import express from "express";
import https from "https";
import http from "http";
import Agreement from "../../models/Agreements/agreementModel.js";
import cloudinary from "../../config/cloudinary.js";

import { verifyToken } from "../../Middlewares/Auth/authMiddleware.js";

import { createAgreementService, refreshAgreementPdf } from "../../services/Agreements/agreementService.js";
import { signAgreement } from "../../services/signals/signatureService.js";
import { releaseEscrowPayment } from "../../services/score/escrowService.js";
import { sendAgreementEmail } from "../../services/emails/emailService.js";
import User from "../../models/users/UserModel.js";

const router = express.Router();


router.post(
  "/agreements",
  verifyToken,
  async (req, res) => {
    try {
      const result = await createAgreementService({
        ...req.body,
        customerId: req.user._id,
        createdBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.get("/agreements/animal/:animalId", verifyToken, async (req, res) => {
  try {
    const partyFields = ["parties.customer", "parties.farmer", "parties.hotel"];
    const agreement = await Agreement.findOne({
      "animal.animalId": req.params.animalId,
      $or: partyFields.map((field) => ({ [field]: req.user._id })),
    }).sort({ createdAt: -1 });

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    res.json({ success: true, data: agreement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/agreements/my-agreements", verifyToken, async (req, res) => {
  try {
    const agreements = await Agreement.find({
      $or: [
        { "parties.customer": req.user._id },
        { "parties.farmer": req.user._id },
        // Hotel–Farmer agreements: farmer is listed as a party in hotel bookings
        { "parties.hotel": { $exists: true, $ne: null }, "parties.farmer": req.user._id },
      ],
    })
      .populate("parties.customer", "name email phone")
      .populate("parties.farmer", "name email phone")
      .populate("parties.hotel", "hotelName email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: agreements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get agreement for a specific animal + hotel pair (used by Hotel dashboard per-booking view)
router.get("/agreements/hotel-animal/:animalId/:hotelId", verifyToken, async (req, res) => {
  try {
    const { animalId, hotelId } = req.params;
    const agreement = await Agreement.findOne({
      "animal.animalId": animalId,
      "parties.hotel": hotelId,
    })
      .populate("parties.farmer", "name email phone")
      .populate("parties.hotel", "hotelName email phone")
      .populate("parties.customer", "name email phone")
      .sort({ createdAt: -1 });

    if (!agreement) {
      return res.status(404).json({ success: false, message: "No agreement found for this animal and hotel" });
    }
    res.json({ success: true, data: agreement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



router.put("/agreements/:id/sign", verifyToken, async (req, res) => {
  try {
    const { signature } = req.body;

    const agreement = await Agreement.findById(req.params.id);

    if (!agreement) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    const isParty = [agreement.parties.customer, agreement.parties.farmer, agreement.parties.hotel]
      .filter(Boolean)
      .some((partyId) => partyId.toString() === req.user._id.toString());
    if (!isParty) {
      return res.status(403).json({ message: "Only agreement parties can sign" });
    }

    if (typeof signature !== "string" || !signature.trim()) {
      return res.status(400).json({ message: "A digital signature is required" });
    }

    const wasFarmerUnsigned = !agreement.signatures?.farmer;
    signAgreement(agreement, req.user, signature.trim());
    if ((agreement.signatures.customer && agreement.signatures.farmer) || (agreement.signatures.hotel && agreement.signatures.farmer)) {
      agreement.status = "accepted";
    }

    await agreement.save();

    const fullySignedByFarmer = wasFarmerUnsigned && agreement.signatures?.customer && agreement.signatures?.farmer;
    if (fullySignedByFarmer) {
      const signedAgreement = await refreshAgreementPdf(agreement._id);
      const customer = await User.findById(agreement.parties.customer).select("email");
      if (customer?.email && signedAgreement.pdfUrl) {
        await sendAgreementEmail([customer.email], signedAgreement.pdfUrl, signedAgreement.transactionId);
      }
      agreement.pdfUrl = signedAgreement.pdfUrl;
    }

    res.json({
      success: true,
      message: "Agreement signed",
      data: agreement,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/agreements/:id/price", verifyToken, async (req, res) => {
  try {
    const { price } = req.body;
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ message: "A valid price is required" });
    }

    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ message: "Agreement not found" });

    const isParty = [agreement.parties.customer, agreement.parties.farmer]
      .filter(Boolean)
      .some((partyId) => partyId.toString() === req.user._id.toString());
    if (req.user.role !== "admin" && !isParty) {
      return res.status(403).json({ message: "Only agreement parties can update the price" });
    }

    if (agreement.signatures.customer || agreement.signatures.farmer) {
      return res.status(409).json({ message: "Price cannot be changed after signing" });
    }

    agreement.price = price;
    await agreement.save();
    res.json({ success: true, message: "Agreement price updated", data: agreement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.put(
  "/agreements/:id/complete",
  verifyToken,
  async (req, res) => {
    try {
      const agreement = await Agreement.findById(req.params.id);

      if (!agreement) {
        return res.status(404).json({ message: "Not found" });
      }

      await releaseEscrowPayment(agreement);

      agreement.status = "completed";
      await agreement.save();

      res.json({
        success: true,
        message: "Agreement completed & payment released",
        data: agreement,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PDF Proxy — uses Cloudinary SDK to generate a signed URL then streams the PDF
router.get("/pdf-proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("PDF URL is required");

  try {
    // Parse the public_id from the Cloudinary URL
    // e.g. https://res.cloudinary.com/cloud/raw/upload/v123/agreements/file.pdf
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/").filter(Boolean);
    // parts: [cloudName, 'raw', 'upload', 'v1234567', 'agreements', 'file.pdf']
    const uploadIdx = parts.findIndex((p) => p === "upload");
    // Skip version segment (starts with 'v' followed by digits)
    let startIdx = uploadIdx + 1;
    if (parts[startIdx] && /^v\d+$/.test(parts[startIdx])) startIdx++;
    const publicId = parts.slice(startIdx).join("/"); // 'agreements/file.pdf'

    // Generate a signed URL using Cloudinary SDK credentials
    const signedUrl = cloudinary.url(publicId, {
      resource_type: "raw",
      type: "upload",
      sign_url: true,
      secure: true,
    });

    // Fetch the signed URL and stream to the client
    const protocol = signedUrl.startsWith("https") ? https : http;
    const request = protocol.get(signedUrl, (proxyRes) => {
      const status = proxyRes.statusCode || 200;
      if (status >= 400) {
        res.status(status).send(`Failed to fetch PDF from Cloudinary (${status})`);
        return;
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="agreement.pdf"');
      res.setHeader("Access-Control-Allow-Origin", "*");
      proxyRes.pipe(res);
    });
    request.on("error", (err) => {
      if (!res.headersSent) res.status(500).send("Failed to fetch PDF");
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// Get latest agreement assigned to a hotel by admin
router.get("/hotel/:hotelId/my-agreement", verifyToken, async (req, res) => {
  try {
    const { hotelId } = req.params;

    const agreement = await Agreement.findOne({
      "parties.hotel": hotelId,
    })
      .sort({ createdAt: -1 })
      .populate("parties.customer", "name email")
      .populate("parties.farmer", "name email")
      .populate("createdBy", "name email");

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: "No agreement found for this hotel",
      });
    }

    res.json({ success: true, data: agreement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

