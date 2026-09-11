import User from "../../models/users/UserModel.js";
import Animal from "../../models/animals/AnimalModel.js";
import Meeting from "../../models/Meetings/meettingModels.js";
import axios from "axios";
import { sendZoomMeetingNotification } from "../emails/emailService.js";

import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

let cachedToken = null;
let tokenExpiry = null;

const getZoomAccessToken = async () => {
    if (cachedToken && tokenExpiry > Date.now()) {
        return cachedToken;
    }

    const auth = Buffer.from(
        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString("base64");

    let response;
    try {
        response = await axios.post(
            "https://zoom.us/oauth/token",
            null,
            {
                params: {
                    grant_type: "account_credentials",
                    account_id: process.env.ZOOM_ACCOUNT_ID,
                    scope: "meeting:write:meeting",
                },
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
    } catch (error) {
        throw new Error(`Zoom authentication failed: ${error.response?.data?.message || error.message}`);
    }

    cachedToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000 - 300000); // 5 min buffer

    return cachedToken;
};

export const createRealZoomMeeting = async (details) => {
    const payload = {
        topic: details.title,
        type: 2, // Scheduled
        start_time: details.meetingDate,
        duration: details.durationMinutes || 30,
        timezone: details.timezone || "Africa/Kigali",
        agenda: details.description,
        settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: true,
            waiting_room: true,
            auto_recording: "none",
        }
    };

    let response;
    let token = await getZoomAccessToken();
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            response = await axios.post(
                "https://api.zoom.us/v2/users/me/meetings",
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            break;
        } catch (error) {
            if (error.response?.data?.code !== 4711 || attempt === 1) {
                if (error.response?.data?.code === 4711) {
                    throw new Error(
                        "Zoom token has no meeting creation scope. In Zoom Marketplace, add `meeting:write:meeting` to the same Server-to-Server OAuth app used by ZOOM_CLIENT_ID, activate it, and restart the backend."
                    );
                }

                throw new Error(`Zoom meeting creation failed: ${error.response?.data?.message || error.message}`);
            }

            cachedToken = null;
            tokenExpiry = null;
            token = await getZoomAccessToken();
        }
    }

    const zoom = response.data;

    return {
        meetingId: zoom.id.toString(),
        meetingLink: zoom.join_url,
        startUrl: zoom.start_url,
        password: zoom.password,
        zoomMeetingData: zoom
    };
};

export const updateRealZoomMeeting = async (zoomMeetingId, updates) => {
    const token = await getZoomAccessToken();

    const payload = {};
    if (updates.title) payload.topic = updates.title;
    if (updates.meetingDate) payload.start_time = updates.meetingDate;
    if (updates.durationMinutes) payload.duration = updates.durationMinutes;
    if (updates.description) payload.agenda = updates.description;

    await axios.patch(
        `https://api.zoom.us/v2/meetings/${zoomMeetingId}`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }
    );

    return true;
};

export const cancelRealZoomMeeting = async (zoomMeetingId) => {
    const token = await getZoomAccessToken();

    try {
        await axios.delete(
            `https://api.zoom.us/v2/meetings/${zoomMeetingId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
    } catch (err) {
        // Zoom returns 404 if meeting already ended/deleted — treat as success
        if (err.response?.status !== 404) throw err;
    }

    return true;
};

export const createMeetingService = async (req) => {
    let {
        title, description, participants, meetingType, animalId,
        meetingDate, durationMinutes, provider = "webrtc", timezone, scheduledAt, note, meetingLink
    } = req.body;

    const isHotelOrganizer = req.user.role === "hotel";
    const userId = req.user._id || req.user.id;
    const organizer = isHotelOrganizer ? req.user : await User.findById(userId);
    if (!organizer) throw new Error("Organizer not found");

    // Map fields from frontend if provided
    meetingDate = meetingDate || scheduledAt;
    description = description || note;

    let validParticipants = [];
    if (participants && participants.length > 0) {
        for (const p of participants) {
            const user = await User.findById(p.user);
            if (!user) throw new Error(`User not found: ${p.user}`);

            validParticipants.push({
                user: user._id,
                role: p.role,
                status: "invited"
            });
        }
    } else {
        // Customer reaches out to admin first
        const adminUser = await User.findOne({ role: "admin" });
        if (!adminUser) throw new Error("Admin not found to host the meeting");

        validParticipants.push({
            user: adminUser._id,
            role: "admin",
            status: "invited"
        });
    }

    let animal = null;
    if (animalId) {
        animal = await Animal.findById(animalId);
        if (!animal) throw new Error("Animal not found");
    }

    if (animal?.owner && !validParticipants.some(p => p.user.toString() === animal.owner.toString())) {
        validParticipants.push({
            user: animal.owner,
            role: "farmer",
            status: "invited"
        });
    }

    let videoCall = {
        provider,
        meetingId: uuidv4(),
        hostToken: crypto.randomBytes(16).toString("hex"),
        participantToken: crypto.randomBytes(16).toString("hex"),
    };

    let zoomMeetingData = null;

    if (provider === "zoom") {
        const zoomResult = await createRealZoomMeeting({
            title, description, meetingDate, durationMinutes, timezone
        });
        videoCall = { ...videoCall, ...zoomResult };
        zoomMeetingData = zoomResult.zoomMeetingData;
        // If farmer provided a custom meeting link, use it
        if (meetingLink) {
            videoCall.meetingLink = meetingLink;
        }
    } else {
        videoCall.meetingLink = meetingLink || `${process.env.FRONTEND_URL}/meeting/${videoCall.meetingId}`;
    }

    const meeting = await Meeting.create({
        title,
        description,
        organizer: userId,
        organizerType: isHotelOrganizer ? "hotel" : "user",
        participants: validParticipants,
        meetingType,
        animal: animal?._id,
        meetingDate,
        durationMinutes: durationMinutes || 30,
        timezone: timezone || "Africa/Kigali",
        videoCall,
        zoomMeetingData,
        status: "pending"
    });

    if (provider === "zoom" && animal?.owner) {
        const owner = await User.findById(animal.owner).select("name email");
        if (owner?.email) {
            try {
                await sendZoomMeetingNotification({
                    email: owner.email,
                    ownerName: owner.name,
                    animalName: animal.name,
                    title,
                    meetingDate,
                    meetingLink: videoCall.meetingLink,
                    password: videoCall.password
                });
            } catch (error) {
                console.error("Zoom meeting owner notification failed:", error.message);
            }
        }
    }

    return meeting;
};

export const grantNegotiationAccessService = async (meetingId, adminUserId, { farmerId, buyerId }) => {
    const admin = await User.findById(adminUserId);
    if (!admin || admin.role !== "admin") {
        throw new Error("Only admin can grant negotiation access");
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    // Map each id to the role your schema already allows
    const entriesToAdd = [
        farmerId ? { id: farmerId, role: "farmer" } : null,
        buyerId ? { id: buyerId, role: "customer" } : null,
    ].filter(Boolean);

    for (const { id, role } of entriesToAdd) {
        const user = await User.findById(id);
        if (!user) throw new Error(`User not found: ${id}`);

        const alreadyIn = meeting.participants.find(p => p.user.toString() === id.toString());
        if (!alreadyIn) {
            meeting.participants.push({
                user: user._id,
                role,
                status: "invited"
            });
        }
    }

    meeting.negotiationAccessGranted = true;
    meeting.status = "pending"; // ready to be joined/started

    await meeting.save();
    return meeting;
};

export const startMeetingService = async (meetingId, userId) => {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    if (meeting.organizer.toString() !== userId) {
        throw new Error("Only organizer can start the meeting");
    }

    meeting.status = "ongoing";
    meeting.lastJoinedAt = new Date();
    await meeting.save();

    return meeting;
};

export const updateMeetingService = async (meetingId, userId, updates) => {
    try {
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) throw new Error("Meeting not found");

        const requester = await User.findById(userId);
        const isAdmin = requester?.role === "admin";
        const isOrganizer = meeting.organizer.toString() === userId;

        if (!isAdmin && !isOrganizer) {
            throw new Error("Only admin or organizer can update the meeting");
        }

        // Only call Zoom API if the meeting has a real Zoom meeting ID
        if (meeting.videoCall?.provider === "zoom" && meeting.videoCall?.meetingId) {
            try {
                await updateRealZoomMeeting(meeting.videoCall.meetingId, updates);
            } catch (zoomError) {
                // Log Zoom API error but don't fail the entire update
                console.error("Zoom API update error:", zoomError.message);
            }
        }

        if (updates.title) meeting.title = updates.title;
        if (updates.description) meeting.description = updates.description;
        if (updates.meetingDate) meeting.meetingDate = updates.meetingDate;
        if (updates.durationMinutes) meeting.durationMinutes = updates.durationMinutes;
        if (updates.meetingLink) {
            if (!meeting.videoCall) meeting.videoCall = {};
            meeting.videoCall.meetingLink = updates.meetingLink;
        }

        await meeting.save();
        
        // Send notification to participants about the update
        if (updates.meetingDate || updates.meetingLink) {
            await sendZoomMeetingNotification(meeting, 'update');
        }

        return meeting;
    } catch (error) {
        console.error("Update meeting service error:", error.message);
        throw error;
    }
};


export const cancelMeetingService = async (meetingId, userId) => {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const requester = await User.findById(userId);
    const isAdmin = requester?.role === "admin";
    const isOrganizer = meeting.organizer.toString() === userId;

    if (!isAdmin && !isOrganizer) {
        throw new Error("Only admin or organizer can cancel the meeting");
    }

    if (meeting.videoCall?.provider === "zoom" && meeting.videoCall?.meetingId) {
        await cancelRealZoomMeeting(meeting.videoCall.meetingId);
    }

    meeting.status = "cancelled";
    await meeting.save();

    return meeting;
};

export const getUserMeetingsService = async (userId) => {
    return await Meeting.find({
        $or: [
            { organizer: userId },
            { "participants.user": userId }
        ]
    })
    .populate("organizer", "name email")
    .populate("participants.user", "name email")
    .populate("animal");
};

export const getSingleMeetingService = async (meetingId) => {
    const meeting = await Meeting.findById(meetingId)
        .populate("organizer")
        .populate("participants.user")
        .populate("animal");

    if (!meeting) throw new Error("Meeting not found");
    return meeting;
};

export const acceptMeetingService = async (meetingId, userId) => {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const participant = meeting.participants.find(p => p.user.toString() === userId);
    if (!participant) throw new Error("Not invited");

    participant.status = "accepted";
    if (participant.role === "farmer" && meeting.status === "pending") {
        meeting.status = "accepted";
    }
    await meeting.save();
    return meeting;
};

export const joinMeetingService = async (meetingId, userId) => {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const participant = meeting.participants.find(p => p.user.toString() === userId);
    if (!participant) throw new Error("Access denied");

    meeting.joinCount += 1;
    meeting.lastJoinedAt = new Date();
    meeting.status = "ongoing";
    participant.status = "joined";

    await meeting.save();

    return {
        meetingLink: meeting.videoCall.meetingLink,
        startUrl: meeting.videoCall.startUrl,
        password: meeting.videoCall.password,
        token: meeting.videoCall.participantToken,
        provider: meeting.videoCall.provider
    };
};

export const endMeetingService = async (meetingId, userId) => {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    if (meeting.organizer.toString() !== userId) {
        throw new Error("Only organizer can end meeting");
    }

    meeting.status = "completed";
    await meeting.save();
    return meeting;
};

export const addFeedbackService = async (meetingId, userId, data) => {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error("Meeting not found");

    meeting.feedback.push({
        user: userId,
        rating: data.rating,
        comment: data.comment
    });

    await meeting.save();
    return meeting;
};