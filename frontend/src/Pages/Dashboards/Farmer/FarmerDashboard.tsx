import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import brand from "../../../../public/images/brand.png"
import { Bell, ChevronDown, Heart, LogOut, Moon, Search, ShoppingCart, Sun } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../Contexts/AuthContext';
import { useCart } from '../../../Contexts/CartContext';
import { useTheme } from '../../../Contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
// ===== TypeScript Interfaces =====
interface Animal {
  id: number;
  _id?: string;
  name: string;
  type: string;
  breed: string;
  age: string;
  weight: string;
  gender: string;
  health: string;
  healthStatus?: AnimalForm['healthStatus'];
  owner: string;
  lineage: string;
  lastVaccine: string;
  nextVaccine: string;
  docs: string;
  listedForSale: boolean;
  price: number;
  images: string[];
  previousOwnerName?: string;
  previousOwnerAgreementPhoto?: string;
  previousOwnerIdPhoto?: string;
}

interface Inquiry {
  id: number;
  from: string;
  animal: string;
  message: string;
  date: string;
  status: 'pending' | 'replied';
}

interface Transaction {
  id: number;
  animal: string;
  buyer: string;
  amount: string;
  status: 'escrow' | 'completed';
  date: string;
}

interface BookingNotification {
  _id: string;
  bookingNumber?: string;
  customer?: { name?: string; email?: string };
  animal?: { name?: string };
  price?: number;
  status?: string;
  createdAt?: string;
}

interface MeetingNotification {
  _id: string;
  title: string;
  meetingDate: string;
  status: string;
  organizer?: { name?: string; email?: string };
  animal?: { name?: string };
  videoCall?: { meetingLink?: string; provider?: string };
}

interface AgreementNotification {
  _id: string;
  title: string;
  status: string;
  price?: number;
  currency?: string;
  paymentMethod?: string;
  deliveryDate?: string;
  terms?: string;
  transactionId?: string;
  createdAt?: string;
  animal?: { name?: string; type?: string; breed?: string; age?: number; weight?: number };
  parties?: {
    customer?: { name?: string; email?: string; phone?: string };
    farmer?: { name?: string; email?: string };
    hotel?: { hotelName?: string; email?: string; phone?: string };
  };
  signatures?: { customer?: string; farmer?: string; hotel?: string };
  pdfUrl?: string;
}

type StatusType = 'vaccinated' | 'healthy' | 'under observation' | 'pending' | 'replied' | 'escrow' | 'completed';

interface AnimalForm {
  name: string;
  type: string;
  breed: string;
  gender: 'male' | 'female';
  age: string;
  weight: string;
  price: string;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  vaccinated: boolean;
  country: string;
  district: string;
  village: string;
  previousOwnerName: string;
  previousOwnerPhone: string;
  previousOwnerIdNumber: string;
}

interface HealthForm {
  animalId: string;
  vaccineName: string;
  vaccineDate: string;
  healthStatus: AnimalForm['healthStatus'];
  vaccinated: boolean;
  vaccinationProofType: 'image' | 'video' | 'pdf' | '';
}
const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
 
const TIME_SLOTS = [
  "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM",
  "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
];
const AVAILABLE_DAYS = new Set([4, 5, 6, 7, 8, 9]);
 
function getMonthGrid(year, month) {
  // Monday-first grid, including leading/trailing days from adjacent months.
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
 
  // JS getDay(): 0 = Sunday ... 6 = Saturday. Convert to Monday-first index.
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
 
  const cells = [];
 
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - (firstWeekday + daysInMonth) + 1, inMonth: false });
  }
  // Ensure at least 6 rows for a stable calendar height, like the reference.
  while (cells.length < 42) {
    const lastTrailing = cells[cells.length - 1];
    cells.push({ day: lastTrailing.inMonth ? 1 : lastTrailing.day + 1, inMonth: false });
  }
 
  return cells;
}
 
function formatSelectedDate(date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" :
    day % 10 === 2 && day !== 12 ? "nd" :
    day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${weekday}, ${month} ${day}${suffix}`;
}

const emptyAnimalForm: AnimalForm = {
  name: '', type: 'cow', breed: '', gender: 'female', age: '', weight: '', price: '',
  healthStatus: 'good', vaccinated: false, country: '', district: '', village: '',
  previousOwnerName: '', previousOwnerPhone: '', previousOwnerIdNumber: '',
};

const emptyHealthForm: HealthForm = {
  animalId: '', vaccineName: '', vaccineDate: '', healthStatus: 'good', vaccinated: false, vaccinationProofType: '',
};

// ===== Main Component =====
const FarmerDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { cartCount, likeCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [animalForm, setAnimalForm] = useState<AnimalForm>(emptyAnimalForm);
  const [editingAnimalId, setEditingAnimalId] = useState<string | null>(null);
  const [animalImage, setAnimalImage] = useState<File | null>(null);
  const [ownershipAgreement, setOwnershipAgreement] = useState<File | null>(null);
  const [ownershipIdPhoto, setOwnershipIdPhoto] = useState<File | null>(null);
  const [animalLoading, setAnimalLoading] = useState(false);
  const [animalMessage, setAnimalMessage] = useState('');
  const [animalMenuOpen, setAnimalMenuOpen] = useState(true);
  const [healthMenuOpen, setHealthMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<Record<string, boolean>>({});
  const [healthFormOpen, setHealthFormOpen] = useState(false);
  const [healthForm, setHealthForm] = useState<HealthForm>(emptyHealthForm);
  const [vaccinationProofFile, setVaccinationProofFile] = useState<File | null>(null);
  const [bookingNotifications, setBookingNotifications] = useState<BookingNotification[]>([]);
  const [meetingNotifications, setMeetingNotifications] = useState<MeetingNotification[]>([]);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [agreements, setAgreements] = useState<AgreementNotification[]>([]);
  const [chatThreads, setChatThreads] = useState<any[]>([]);
  const [selectedChatThread, setSelectedChatThread] = useState<any | null>(null);
  const [chatReplyText, setChatReplyText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [farmerSignature, setFarmerSignature] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState<AgreementNotification | null>(null);
  const [selectedOwnershipDoc, setSelectedOwnershipDoc] = useState<{ title: string; url: string } | null>(null);
  const [ownershipDocForm, setOwnershipDocForm] = useState<{ agreementUrl?: string; idUrl?: string }>({});
  const [zoomForm, setZoomForm] = useState<{ animalId: string; date: string; time: string; link: string }>({ animalId: '', date: '', time: '', link: '' });
  const [showZoomForm, setShowZoomForm] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('animal-form');
  const [calendarViewYear, setCalendarViewYear] = useState(new Date().getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = useState(new Date().getMonth());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [selectedCalendarTime, setSelectedCalendarTime] = useState<string | null>(null);

  const CALENDAR_DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const CALENDAR_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const CALENDAR_TIME_SLOTS = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"];

  const getCalendarMonthGrid = (year: number, month: number) => {
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
    const cells: any[] = [];
    for (let i = firstWeekday - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, inMonth: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true });
    while (cells.length % 7 !== 0) cells.push({ day: cells.length - (firstWeekday + daysInMonth) + 1, inMonth: false });
    return cells;
  };

  const calendarCells = useMemo(() => getCalendarMonthGrid(calendarViewYear, calendarViewMonth), [calendarViewYear, calendarViewMonth]);

  const formatCalendarDate = (date: Date) => {
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const day = date.getDate();
    const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
    return `${weekday}, ${month} ${day}${suffix}`;
  };

  const isCalendarDaySelected = (cell: any) => cell.inMonth && selectedCalendarDate.getFullYear() === calendarViewYear && selectedCalendarDate.getMonth() === calendarViewMonth && selectedCalendarDate.getDate() === cell.day;

  const handleCalendarDayClick = (cell: any) => {
    if (!cell.inMonth) return;
    setSelectedCalendarDate(new Date(calendarViewYear, calendarViewMonth, cell.day));
    setSelectedCalendarTime(null);
  };

  const goToCalendarPrevMonth = () => {
    if (calendarViewMonth === 0) {
      setCalendarViewMonth(11);
      setCalendarViewYear(prev => prev - 1);
    } else {
      setCalendarViewMonth(prev => prev - 1);
    }
  };

  const goToCalendarNextMonth = () => {
    if (calendarViewMonth === 11) {
      setCalendarViewMonth(0);
      setCalendarViewYear(prev => prev + 1);
    } else {
      setCalendarViewMonth(prev => prev + 1);
    }
  };

  const shiftCalendarDay = (delta: number) => {
    const next = new Date(selectedCalendarDate);
    next.setDate(next.getDate() + delta);
    setSelectedCalendarDate(next);
    setSelectedCalendarTime(null);
    setCalendarViewYear(next.getFullYear());
    setCalendarViewMonth(next.getMonth());
  };

  const applyZoomFormFromCalendar = () => {
    if (!selectedCalendarDate || !selectedCalendarTime) {
      setNotificationMessage('Select date and time to schedule the meeting.');
      return;
    }
    const dateStr = selectedCalendarDate.toISOString().split('T')[0];
    const timeStr = selectedCalendarTime.split(' ')[0];
    setZoomForm(prev => ({ ...prev, date: dateStr, time: timeStr }));
  };

  const navigateToSection = (sectionId: string) => (event: React.MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    setActiveSection(sectionId);
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  // ---------- ANIMAL STATE ----------
  const [animals, setAnimals] = useState<Animal[]>([]);

  const mapAnimal = (animal: any, index: number): Animal => {
    const vaccination = animal.health?.vaccinationRecords?.[0];
    const health = animal.health?.vaccinated ? 'vaccinated' : animal.health?.healthStatus || 'healthy';
    return {
      id: index + 1,
      _id: animal._id,
      name: animal.name,
      type: animal.type,
      breed: animal.breed,
      age: `${animal.age}y`,
      weight: `${animal.weight}kg`,
      gender: animal.gender,
      health,
      healthStatus: animal.health?.healthStatus || 'good',
      owner: user?.name || 'Current farmer',
      lineage: animal.previousOwnerName ? `Previous owner: ${animal.previousOwnerName}` : 'History available',
      lastVaccine: vaccination?.date ? new Date(vaccination.date).toISOString().slice(0, 10) : 'Not recorded',
      nextVaccine: 'Update record',
      docs: animal.images?.length ? '✅' : '📎',
      listedForSale: animal.isAvailable !== false,
      price: animal.price || 0,
      images: animal.images || [],
      previousOwnerName: animal.previousOwnerName,
      previousOwnerAgreementPhoto: animal.previousOwnerAgreementPhoto,
      previousOwnerIdPhoto: animal.previousOwnerIdPhoto,
    };
  };

  React.useEffect(() => {
    const loadAnimals = async () => {
      if (!user?._id) return;
      try {
        const response = await axios.get('http://localhost:4000/api/animal/animals');
        const serverAnimals = response.data.data || [];
        const farmerAnimals = serverAnimals.filter((animal: any) => {
          const ownerId = typeof animal.owner === 'object' ? animal.owner?._id : animal.owner;
          return String(ownerId) === String(user._id);
        });
        setAnimals(farmerAnimals.map(mapAnimal));
      } catch {
        setAnimalMessage('Unable to load animal records from the server.');
      }
    };
    loadAnimals();
  }, [user?._id]);

  React.useEffect(() => {
    const loadNotifications = async () => {
      if (!user?._id || !token) return;
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [bookingsResponse, meetingsResponse, agreementsResponse] = await Promise.all([
          axios.get('http://localhost:4000/api/bookings/my-bookings', { headers }),
          axios.get('http://localhost:4000/api/meeting/', { headers }),
          axios.get('http://localhost:4000/api/agreements/my-agreements', { headers }),
        ]);
        setBookingNotifications(bookingsResponse.data.data || []);
        setMeetingNotifications((meetingsResponse.data.data || []).filter((meeting: MeetingNotification) => meeting.animal));
        setAgreements(agreementsResponse.data.data || []);
      } catch {
        setNotificationMessage('Unable to load booking and meeting notifications.');
      }
    };
    loadNotifications();
    const notificationInterval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(notificationInterval);
  }, [user?._id, token]);

  React.useEffect(() => {
    const loadChatThreads = async () => {
      if (!user?._id || !token) return;
      try {
        const response = await axios.get('http://localhost:4000/api/chat/farmer-messages', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const threads = response.data.data || [];
        setChatThreads(threads);
        setSelectedChatThread((prev: any) => {
          if (!prev) return prev;
          const updated = threads.find(
            (t: any) => t.animalId === prev.animalId && t.customerId === prev.customerId
          );
          return updated || prev;
        });
      } catch {
        setChatMessage('Unable to load customer messages.');
      }
    };
    loadChatThreads();
    const chatInterval = window.setInterval(loadChatThreads, 30000);
    return () => window.clearInterval(chatInterval);
  }, [user?._id, token]);

  const approveMeeting = async (meetingId: string): Promise<void> => {
    try {
      const response = await axios.put(`http://localhost:4000/api/meeting/${meetingId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeetingNotifications(prev => prev.map(meeting => meeting._id === meetingId ? response.data.data : meeting));
      setNotificationMessage('Zoom request accepted and updated to the customer.');
    } catch (error: any) {
      setNotificationMessage(error.response?.data?.message || 'Unable to approve the Zoom request.');
    }
  };

  const cancelMeeting = async (meetingId: string): Promise<void> => {
    try {
      const response = await axios.put(`http://localhost:4000/api/meeting/${meetingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMeetingNotifications(prev => prev.map(meeting => meeting._id === meetingId ? response.data.data : meeting));
      setNotificationMessage('Zoom request cancelled and updated to the customer.');
    } catch (error: any) {
      setNotificationMessage(error.response?.data?.message || 'Unable to cancel the Zoom request.');
    }
  };

  const editZoomRequest = (meeting: MeetingNotification): void => {
    const date = meeting.meetingDate ? new Date(meeting.meetingDate).toISOString().slice(0, 10) : '';
    const time = meeting.meetingDate ? new Date(meeting.meetingDate).toISOString().slice(11, 16) : '';
    const animalId = (meeting.animal as any)?._id || (meeting as any).animalId || '';
    setZoomForm({
      animalId,
      date,
      time,
      link: meeting.videoCall?.meetingLink || '',
    });
    setEditingMeetingId(meeting._id);
    setShowZoomForm(true);
  };

  const updateZoomMeeting = async (): Promise<void> => {
    if (!editingMeetingId || !zoomForm.date || !zoomForm.time) {
      setNotificationMessage('Set the date, time, and Zoom link to update the meeting.');
      return;
    }

    if (!token) {
      setNotificationMessage('Please log in before updating the Zoom meeting.');
      return;
    }

    try {
      const payload: any = {
        meetingDate: new Date(`${zoomForm.date}T${zoomForm.time}:00`).toISOString(),
      };

      if (zoomForm.link.trim()) {
        payload.meetingLink = zoomForm.link.trim();
      }

      const response = await axios.put(`http://localhost:4000/api/meeting/${editingMeetingId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMeetingNotifications(prev => prev.map(meeting => meeting._id === editingMeetingId ? response.data.data : meeting));
      setZoomForm({ animalId: '', date: '', time: '', link: '' });
      setEditingMeetingId(null);
      setShowZoomForm(false);
      setNotificationMessage('Zoom meeting updated and customer notified.');
    } catch (error: any) {
      setNotificationMessage(error.response?.data?.message || 'Unable to update the Zoom meeting.');
    }
  };

  const rescheduleZoomMeeting = async (): Promise<void> => {
    if (!editingMeetingId || !zoomForm.date || !zoomForm.time) {
      setNotificationMessage('Set the new date and time to reschedule.');
      return;
    }

    if (!token) {
      setNotificationMessage('Please log in before rescheduling.');
      return;
    }

    try {
      const payload = {
        meetingDate: new Date(`${zoomForm.date}T${zoomForm.time}:00`).toISOString(),
      };

      const response = await axios.put(`http://localhost:4000/api/meeting/${editingMeetingId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMeetingNotifications(prev => prev.map(meeting => meeting._id === editingMeetingId ? response.data.data : meeting));
      setZoomForm({ animalId: '', date: '', time: '', link: '' });
      setEditingMeetingId(null);
      setShowZoomForm(false);
      setNotificationMessage('Zoom meeting rescheduled and customer notified.');
    } catch (error: any) {
      setNotificationMessage(error.response?.data?.message || 'Unable to reschedule the Zoom meeting.');
    }
  };

  const addZoomRequest = async (): Promise<void> => {
    if (!zoomForm.animalId || !zoomForm.date || !zoomForm.time || !zoomForm.link.trim()) {
      setNotificationMessage('Select an animal, set the date and time, and add the Zoom link.');
      return;
    }

    if (!user?._id || !token) {
      setNotificationMessage('Please log in before creating a Zoom meeting.');
      return;
    }

    const selectedAnimal = animals.find((animal) => animal._id === zoomForm.animalId);
    const relatedBooking = bookingNotifications.find((booking) => {
      const bookingAnimalId = (booking.animal as any)?._id || (booking as any).animalId;
      return bookingAnimalId && String(bookingAnimalId) === String(zoomForm.animalId);
    });

    try {
      const payload: any = {
        title: `Zoom call for ${selectedAnimal?.name || 'animal'}`,
        description: `Farmer-to-customer Zoom meeting for ${selectedAnimal?.name || 'animal'}`,
        animalId: zoomForm.animalId,
        meetingDate: new Date(`${zoomForm.date}T${zoomForm.time}:00`).toISOString(),
        durationMinutes: 30,
        provider: 'zoom',
        meetingType: 'transaction_discussion',
        timezone: 'Africa/Kigali',
        meetingLink: zoomForm.link.trim(),
        participants: [
          { user: user._id, role: 'farmer' },
        ],
      };

      if (relatedBooking?.customer && (relatedBooking.customer as any)._id) {
        payload.participants.push({ user: (relatedBooking.customer as any)._id, role: 'customer' });
      }

      const response = await axios.post('http://localhost:4000/api/meeting/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const createdMeeting = response.data?.data;
      if (createdMeeting) {
        setMeetingNotifications(prev => [createdMeeting, ...prev]);
      }

      setZoomForm({ animalId: '', date: '', time: '', link: '' });
      setShowZoomForm(false);
      setNotificationMessage('Zoom meeting scheduled and customer notified.');
    } catch (error: any) {
      setNotificationMessage(error.response?.data?.message || error.response?.data?.error || 'Unable to create the Zoom meeting.');
    }
  };

  const signAgreementAsFarmer = async (agreementId: string): Promise<void> => {
    if (!farmerSignature.trim()) {
      setNotificationMessage('Enter your signature before signing the agreement.');
      return;
    }
    try {
      const response = await axios.put(`http://localhost:4000/api/agreements/${agreementId}/sign`, {
        signature: farmerSignature.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });
      const updated = response.data.data;
      setAgreements(prev => prev.map(agreement => agreement._id === agreementId ? updated : agreement));
      // Also update selectedAgreement if open
      setSelectedAgreement(prev => prev && prev._id === agreementId ? updated : prev);
      setFarmerSignature('');
      setNotificationMessage('Agreement signed successfully.');
    } catch (error: any) {
      setNotificationMessage(error.response?.data?.message || 'Unable to sign the agreement.');
    }
  };

  const handleSendChatReply = async (): Promise<void> => {
    if (!selectedChatThread || !chatReplyText.trim()) return;
    if (!token) {
      setChatMessage('Please log in before replying.');
      return;
    }
    setChatLoading(true);
    setChatMessage('');
    try {
      const response = await axios.post(
        'http://localhost:4000/api/chat/reply',
        {
          animalId: selectedChatThread.animalId,
          customerId: selectedChatThread.customerId,
          text: chatReplyText.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const sent = response.data.data;
      const newMsg = {
        _id: sent._id,
        text: sent.text,
        senderId: sent.sender?._id || sent.sender,
        senderName: sent.sender?.name || user?.name,
        createdAt: sent.createdAt,
        isMine: true,
      };
      setSelectedChatThread((prev: any) => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
      setChatThreads((prev) =>
        prev.map((t) =>
          t.animalId === selectedChatThread.animalId && t.customerId === selectedChatThread.customerId
            ? { ...t, messages: [...t.messages, newMsg] }
            : t
        )
      );
      setChatReplyText('');
    } catch (error: any) {
      setChatMessage(error.response?.data?.message || 'Unable to send reply.');
    } finally {
      setChatLoading(false);
    }
  };

  const customerRequests = React.useMemo(() => {
    const requests: Array<{
      id: string;
      kind: 'booking' | 'zoom' | 'agreement' | 'payment';
      title: string;
      detail: string;
      status: string;
      requestId?: string;
    }> = [];

    bookingNotifications.forEach((booking) => {
      requests.push({
        id: `booking-${booking._id}`,
        kind: 'booking',
        title: `Booking request for ${booking.animal?.name || 'your animal'}`,
        detail: `${booking.customer?.name || booking.customer?.email || 'Customer'} requested a booking${booking.price ? ` for ${booking.price}` : ''}.`,
        status: booking.status || 'pending',
        requestId: booking._id,
      });
    });

    meetingNotifications.forEach((meeting) => {
      requests.push({
        id: `zoom-${meeting._id}`,
        kind: 'zoom',
        title: `Zoom request for ${meeting.animal?.name || 'your animal'}`,
        detail: `${meeting.organizer?.name || meeting.organizer?.email || 'Customer'} requested a Zoom call${meeting.meetingDate ? ` on ${meeting.meetingDate}` : ''}.`,
        status: meeting.status || 'pending',
        requestId: meeting._id,
      });
    });

    agreements.forEach((agreement) => {
      const customerSigned = !!agreement.signatures?.customer;
      const hotelSigned = !!agreement.signatures?.hotel;
      const farmerSigned = !!agreement.signatures?.farmer;
      const signerName = agreement.parties?.hotel?.hotelName
        || agreement.parties?.customer?.name
        || agreement.parties?.customer?.email
        || 'Customer';
      // Only notify farmer when hotel or customer has signed but farmer hasn't yet
      if ((hotelSigned || customerSigned) && !farmerSigned) {
        requests.push({
          id: `agreement-${agreement._id}`,
          kind: 'agreement',
          title: agreement.title || 'Agreement request',
          detail: `${signerName} ${hotelSigned ? 'has signed the agreement and is waiting for your approval' : 'requested an agreement'} for ${agreement.animal?.name || 'your animal'}.`,
          status: 'waiting for farmer sign',
          requestId: agreement._id,
        });
      }
    });

    if (bookingNotifications.length > 0 || meetingNotifications.length > 0 || agreements.length > 0) {
      requests.push({
        id: 'payment-overview',
        kind: 'payment',
        title: 'Payment review',
        detail: 'Review customer payment request and complete escrow details after the Zoom and agreement steps are confirmed.',
        status: 'ready',
      });
    }

    return requests;
  }, [bookingNotifications, meetingNotifications, agreements]);

  // ---------- INQUIRIES ----------
  const [inquiries, setInquiries] = useState<Inquiry[]>([
    { id: 101, from: 'GreenValley Farm', animal: 'Bessie', message: 'Interested in purchasing. Health records?', date: '2026-08-25', status: 'pending' },
    { id: 102, from: 'DairyCo', animal: 'Daisy', message: 'Request for milk yield history.', date: '2026-08-26', status: 'replied' },
    { id: 103, from: 'Organic Valley', animal: 'Luna', message: 'Looking for breeding certificate.', date: '2026-08-27', status: 'pending' },
  ]);

  // ---------- TRANSACTIONS ----------
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 201, animal: 'Charlie', buyer: 'Ranch 99', amount: '₹2.4L', status: 'escrow', date: '2026-08-20' },
    { id: 202, animal: 'Luna', buyer: 'Organic Milk', amount: '₹1.8L', status: 'completed', date: '2026-08-15' },
    { id: 203, animal: 'Bessie', buyer: 'Dairy Fresh', amount: '₹3.2L', status: 'escrow', date: '2026-08-27' },
  ]);

  // ---------- HELPERS (responsibilities) ----------
  const updateVaccination = (animalId: number): void => {
    setAnimals(prev =>
      prev.map(a =>
        a.id === animalId
          ? { ...a, health: 'vaccinated', lastVaccine: new Date().toISOString().slice(0, 10), nextVaccine: '2026-09-27' }
          : a
      )
    );
  };

  const replyToInquiry = (id: number): void => {
    setInquiries(prev => prev.map(q => (q.id === id ? { ...q, status: 'replied' } : q)));
  };

  const completeTransaction = (id: number): void => {
    setTransactions(prev => prev.map(t => (t.id === id ? { ...t, status: 'completed' } : t)));
  };

  const toggleListing = (animalId: number): void => {
    setAnimals(prev => prev.map(a => a.id === animalId ? { ...a, listedForSale: !a.listedForSale } : a));
  };

  const handleLogout = (): void => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleAnimalSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!user?._id || !token) {
      setAnimalMessage('Please log in as a farmer before adding an animal.');
      return;
    }
    setAnimalLoading(true);
    setAnimalMessage('');
    const formData = new FormData();
    formData.append('name', animalForm.name);
    formData.append('type', animalForm.type);
    formData.append('breed', animalForm.breed);
    formData.append('gender', animalForm.gender);
    formData.append('age', animalForm.age);
    formData.append('weight', animalForm.weight);
    formData.append('price', animalForm.price);
    formData.append('currency', 'RWF');
    formData.append('owner', user._id);
    formData.append('location', JSON.stringify({ country: animalForm.country, district: animalForm.district, village: animalForm.village }));
    formData.append('health', JSON.stringify({ vaccinated: animalForm.vaccinated, healthStatus: animalForm.healthStatus, vaccinationRecords: [] }));
    formData.append('previousOwnerName', animalForm.previousOwnerName);
    formData.append('previousOwnerPhone', animalForm.previousOwnerPhone);
    formData.append('previousOwnerIdNumber', animalForm.previousOwnerIdNumber);
    if (animalImage) formData.append('image', animalImage);
    if (ownershipAgreement) formData.append('previousOwnerAgreement', ownershipAgreement);
    if (ownershipIdPhoto) formData.append('previousOwnerIdPhoto', ownershipIdPhoto);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = editingAnimalId
        ? await axios.put(`http://localhost:4000/api/animal/animals/${editingAnimalId}`, formData, config)
        : await axios.post('http://localhost:4000/api/animal/register', formData, config);
      const savedAnimal = response.data.data;
      if (!savedAnimal?._id) throw new Error('The server did not return the saved animal record.');
      setAnimals(prev => editingAnimalId
        ? prev.map(animal => animal._id === editingAnimalId ? mapAnimal(savedAnimal, animal.id - 1) : animal)
        : [mapAnimal(savedAnimal, prev.length), ...prev]);
      setAnimalForm(emptyAnimalForm);
      setAnimalImage(null);
      setOwnershipAgreement(null);
      setOwnershipIdPhoto(null);
      setEditingAnimalId(null);
      setAnimalMessage(editingAnimalId ? 'Animal information updated.' : 'Animal added for sale.');
    } catch (error: any) {
      setAnimalMessage(error.response?.data?.error || error.response?.data?.message || 'Unable to save the animal record.');
    } finally {
      setAnimalLoading(false);
    }
  };

  const startEditingAnimal = (animal: Animal): void => {
    setActiveSection('animal-form');
    setEditingAnimalId(animal._id || null);
    setAnimalForm({
      name: animal.name, type: animal.type, breed: animal.breed, gender: animal.gender.toLowerCase() as 'male' | 'female',
      age: animal.age.replace('y', ''), weight: animal.weight.replace('kg', ''), price: String(animal.price || ''),
      healthStatus: animal.healthStatus as AnimalForm['healthStatus'] || 'good', vaccinated: animal.health === 'vaccinated',
      country: '', district: '', village: '', previousOwnerName: animal.previousOwnerName || '',
      previousOwnerPhone: '', previousOwnerIdNumber: '',
    });
    document.getElementById('animal-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openAddAnimalForm = (): void => {
    setActiveSection('animal-form');
    setEditingAnimalId(null);
    setAnimalForm(emptyAnimalForm);
    setAnimalImage(null);
    setOwnershipAgreement(null);
    setOwnershipIdPhoto(null);
    document.getElementById('animal-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openHealthForm = (addVaccination = false): void => {
    setActiveSection('vaccination-records');
    const firstAnimal = animals.find(animal => animal._id);
    setHealthForm({
      ...emptyHealthForm,
      animalId: firstAnimal?._id || '',
      vaccineName: addVaccination ? '' : 'Health review',
      healthStatus: firstAnimal?.healthStatus || 'good',
      vaccinated: firstAnimal?.health === 'vaccinated' || false,
    });
    setHealthFormOpen(true);
    setTimeout(() => document.getElementById('vaccination-records')?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  const handleHealthSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const selectedAnimal = animals.find(animal => animal._id === healthForm.animalId);
    if (!selectedAnimal?._id || !token) {
      setAnimalMessage('Load a saved animal before updating health records.');
      return;
    }
    setAnimalLoading(true);
    try {
      const vaccinationRecords = healthForm.vaccineName && healthForm.vaccineDate
        ? [{
            vaccineName: healthForm.vaccineName,
            date: healthForm.vaccineDate,
            verifiedByVet: false,
            ...(healthForm.vaccinationProofType ? { vaccinationProof: healthForm.vaccinationProofType } : {}),
          }]
        : [];

      const formData = new FormData();
      formData.append('health', JSON.stringify({
        vaccinated: healthForm.vaccinated,
        healthStatus: healthForm.healthStatus,
        vaccinationRecords,
      }));
      // Attach proof file if selected
      if (vaccinationProofFile) {
        formData.append('vaccinationProofs', vaccinationProofFile);
      }

      const response = await axios.put(
        `http://localhost:4000/api/animal/animals/${selectedAnimal._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const savedAnimal = response.data.data;
      setAnimals(prev => prev.map(animal => animal._id === selectedAnimal._id ? mapAnimal(savedAnimal, animal.id - 1) : animal));
      setHealthFormOpen(false);
      setVaccinationProofFile(null);
      setAnimalMessage('Vaccination and health records updated.');
    } catch (error: any) {
      setAnimalMessage(error.response?.data?.error || error.response?.data?.message || 'Unable to update health records.');
    } finally {
      setAnimalLoading(false);
    }
  };

  const handleUploadDoc = (): void => {
    alert('📎 Document upload dialog would open. (simulated)');
  };

  const handleInspection = (): void => {
    alert('✅ Inspection preparation checklist opened.');
  };

  const statusColor = (status: StatusType | string): string => {
    switch (status) {
      case 'vaccinated':
      case 'healthy':
        return 'bg-emerald-100 text-emerald-700';
      case 'under observation':
        return 'bg-amber-100 text-amber-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'replied':
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'escrow':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const toggleMenu = (menuName: string): void => {
    setMenuOpen(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const ownershipDocumentItems = animals
    .filter((animal) => animal.previousOwnerName || animal.previousOwnerAgreementPhoto || animal.previousOwnerIdPhoto)
    .map((animal) => ({
      id: animal._id || `${animal.id}`,
      animalName: animal.name,
      ownerName: animal.previousOwnerName || 'Previous owner',
      agreementUrl: animal.previousOwnerAgreementPhoto,
      idUrl: animal.previousOwnerIdPhoto,
    }));

  const handleOwnershipNavClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    setActiveSection('ownership-documents');
    setMenuOpen(prev => ({ ...prev, ownership: true }));
    document.getElementById('ownership-documents')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleZoomSidebarClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    setActiveSection('customer-booked');
    setShowZoomForm(true);
    setMenuOpen(prev => ({ ...prev, customer: true }));
    setTimeout(() => document.getElementById('customer-booked')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const secondaryMenus = [
    { name: 'ownership', label: 'Ownership', icon: 'fa-id-card', color: 'text-indigo-500', active: 'bg-indigo-50', hover: 'hover:text-indigo-700 hover:bg-indigo-50', links: [['Ownership Documents', '#ownership-documents'], ['Ownership Transfers', '#ownership-documents'], ['Ownership History', '#animal-history']] },
    { name: 'customer', label: 'Customer', icon: 'fa-comments', color: 'text-cyan-600', active: 'bg-cyan-50', hover: 'hover:text-cyan-700 hover:bg-cyan-50', links: [['Messages', '#customer-messages'], ['Customer requests', '#customer-booked'], ['Zoom meetings', '#customer-booked'], ['Activity insights', '#chart'], ['Schedule Zoom call', '# add-zoom'],] },
    { name: 'agreements', label: 'Agreements', icon: 'fa-file-signature', color: 'text-violet-500', active: 'bg-violet-50', hover: 'hover:text-violet-700 hover:bg-violet-50', links: [['Create Agreement', '#agreements'], ['Pending Agreements', '#agreements'], ['Active Agreements', '#agreements'], ['Completed Agreements', '#agreements'], ['Agreement Documents', '#agreements']] },
    { name: 'inspection', label: 'Inspection', icon: 'fa-clipboard-check', color: 'text-emerald-600', active: 'bg-emerald-50', hover: 'hover:text-emerald-700 hover:bg-emerald-50', links: [['Request Inspection', '#inspection'], ['Scheduled Inspections', '#inspection'], ['Inspection Results', '#inspection'], ['Inspection Reports', '#inspection']] },
    { name: 'transactions', label: 'Transactions', icon: 'fa-handshake', color: 'text-slate-600', active: 'bg-slate-100', hover: 'hover:text-slate-800 hover:bg-slate-100', links: [['Sales', '#transactions'], ['Purchases', '#transactions'], ['Payments', '#transactions'], ['Escrow', '#transactions'], ['Transaction History', '#transactions']] },
  ] as const;

  // ---- render ----
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===== FARMER SIDEBAR ===== */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col">
        <div className="flex items-center gap-2 mb-8">
            <img src={brand} alt="Logo" className="w-16 h-16" />
          
          <span className="text-xl font-bold text-slate-800">animarket</span>
        </div>
        
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Farmer workspace</p>
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => setAnimalMenuOpen(prev => !prev)}
              className={`w-full flex items-center gap-2 text-sm text-slate-700 px-3 py-2 rounded-lg transition-colors ${animalMenuOpen ? 'bg-green-50' : 'hover:bg-slate-50'}`}
              aria-expanded={animalMenuOpen}
            >
              <i className="fas fa-paw w-5 text-green-600"></i>
              <span className="flex-1 text-left">Management</span>
              <ChevronDown size={15} className={`transition-transform ${animalMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {animalMenuOpen && (
              <div className="ml-7 space-y-1 border-l border-green-100 pl-2">
                <a href="#animal-form" onClick={openAddAnimalForm} className="block text-xs text-slate-600 hover:text-green-700 hover:bg-green-50 px-3 py-2 rounded-md">
                  Add animal for sale
                </a>
                <a href="#animal-management" onClick={navigateToSection('animal-management')} className="block text-xs text-slate-600 hover:text-green-700 hover:bg-green-50 px-3 py-2 rounded-md">
                  View & manage animals
                </a>
              </div>
            )}
            <button
              type="button"
              onClick={() => setHealthMenuOpen(prev => !prev)}
              className={`w-full flex items-center gap-2 text-sm text-slate-700 px-3 py-2 rounded-lg transition-colors ${healthMenuOpen ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
              aria-expanded={healthMenuOpen}
            >
              <i className="fas fa-syringe w-5 text-blue-500"></i>
              <span className="flex-1 text-left"> Health</span>
              <ChevronDown size={15} className={`transition-transform ${healthMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {healthMenuOpen && (
              <div className="ml-7 space-y-1 border-l border-blue-100 pl-2">
                <a href="#vaccination-records" onClick={() => openHealthForm(true)} className="block text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-md">
                  Add vaccination record
                </a>
                <a href="#vaccination-records" onClick={() => openHealthForm(false)} className="block text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-md">
                  Update health records
                </a>
              </div>
            )}
            {secondaryMenus.map(menu => (
              <div key={menu.name}>
                <button
                  type="button"
                  onClick={() => toggleMenu(menu.name)}
                  className={`w-full flex items-center gap-2 text-sm text-slate-700 px-3 py-2 rounded-lg transition-colors ${menuOpen[menu.name] ? menu.active : 'hover:bg-slate-50'}`}
                  aria-expanded={Boolean(menuOpen[menu.name])}
                >
                  <i className={`fas ${menu.icon} w-5 ${menu.color}`}></i>
                  <span className="flex-1 text-left">{menu.label}</span>
                  <ChevronDown size={15} className={`transition-transform ${menuOpen[menu.name] ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen[menu.name] && (
                  <div className="ml-7 space-y-1 border-l border-slate-100 pl-2">
                    {menu.links.map(([label, href]) => (
                      <a
                        key={label}
                        href={href}
                        onClick={
                          label === 'Ownership Documents'
                            ? handleOwnershipNavClick
                            : label === 'Schedule Zoom call'
                              ? handleZoomSidebarClick
                              : navigateToSection(href.replace('#', ''))
                        }
                        className={`block text-xs text-slate-600 px-3 py-2 rounded-md ${menu.hover}`}
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3 mb-4">
            {user?.profile_img ? (
              <img src={user.profile_img} alt={user.name || 'Farmer profile'} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold">
                {(user?.name || 'Farmer').slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Farmer'}</p>
              <p className="text-xs text-slate-400">Farmer account</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={17} /> Log out
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="lg:ml-64">
        {/* ===== FARMER HEADER ===== */}
        <header className="sticky top-0 z-30 h-28 bg-white border-b border-slate-200 px-6 flex items-center gap-6">
          <div className="flex-1 max-w-3xl relative">
            <Search size={23} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder="Search animal category..."
              aria-label="Search animal category"
              className="w-full h-16 rounded-2xl bg-slate-50 pl-16 pr-5 text-lg text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-6 ml-auto text-slate-700">
            <button className="hidden sm:flex items-center gap-1 text-lg" aria-label="Select language">
              GB <ChevronDown size={18} />
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="hidden sm:block p-2 hover:text-green-700 transition-colors"
            >
              {theme === 'dark' ? <Moon size={25} /> : <Sun size={25} />}
            </button>
            <button aria-label="Shopping cart" className="relative p-2 hover:text-green-700 transition-colors">
              <ShoppingCart size={25} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button aria-label="Favorites" className="relative p-2 hover:text-teal-600 transition-colors">
              <Heart size={25} />
              {likeCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
                  {likeCount}
                </span>
              )}
            </button>
            <div className="relative">
              <button
                type="button"
                aria-label="Open notifications"
                aria-expanded={notificationOpen}
                onClick={() => setNotificationOpen(prev => !prev)}
                className="relative p-2 hover:text-amber-600 transition-colors"
              >
                <Bell size={25} />
                {(bookingNotifications.length + meetingNotifications.filter(meeting => meeting.status === 'pending').length + agreements.filter(agreement => (agreement.signatures?.hotel || agreement.signatures?.customer) && !agreement.signatures?.farmer).length) > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                    {bookingNotifications.length + meetingNotifications.filter(meeting => meeting.status === 'pending').length + agreements.filter(agreement => (agreement.signatures?.hotel || agreement.signatures?.customer) && !agreement.signatures?.farmer).length}
                  </span>
                )}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h2 className="text-sm font-bold text-slate-800">Notifications</h2>
                    <button type="button" onClick={() => setNotificationOpen(false)} className="text-xs text-slate-400 hover:text-slate-700">Close</button>
                  </div>
                  <div className="max-h-[28rem] space-y-3 overflow-y-auto pt-3">
                    {bookingNotifications.length > 0 && <div><p className="mb-1 text-xs font-semibold text-amber-600">Bookings</p>{bookingNotifications.map(booking => <div key={booking._id} className="rounded-lg bg-slate-50 p-2 text-xs"><strong>{booking.customer?.name || booking.customer?.email || 'Customer'}</strong> booked {booking.animal?.name || 'your animal'}.</div>)}</div>}
                    {meetingNotifications.filter(meeting => meeting.status === 'pending').length > 0 && <div><p className="mb-1 text-xs font-semibold text-blue-600">Zoom requests</p>{meetingNotifications.filter(meeting => meeting.status === 'pending').map(meeting => <div key={meeting._id} className="rounded-lg bg-slate-50 p-2 text-xs"><strong>{meeting.organizer?.name || meeting.organizer?.email || 'Customer'}</strong> requested Zoom for {meeting.animal?.name || 'your animal'}.{meeting.videoCall?.meetingLink && <><br /><a href={meeting.videoCall.meetingLink} target="_blank" rel="noreferrer" className="mt-1 inline-block text-blue-600 underline">Open Zoom link</a></>}<button type="button" onClick={() => approveMeeting(meeting._id)} className="ml-2 rounded-md bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-700">Approve</button></div>)}</div>}
                    {agreements.filter(agreement => (agreement.signatures?.hotel || agreement.signatures?.customer) && !agreement.signatures?.farmer).length > 0 && <div><p className="mb-1 text-xs font-semibold text-violet-600">Agreements</p>{agreements.filter(agreement => (agreement.signatures?.hotel || agreement.signatures?.customer) && !agreement.signatures?.farmer).map(agreement => { const signerName = agreement.parties?.hotel?.hotelName || agreement.parties?.customer?.name || agreement.parties?.customer?.email || 'Customer'; return <div key={agreement._id} className="rounded-lg bg-slate-50 p-2 text-xs"><strong>{signerName}</strong> signed {agreement.animal?.name || agreement.title}.<div className="mt-2 flex gap-2"><input value={farmerSignature} onChange={event => setFarmerSignature(event.target.value)} placeholder="Your signature" className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-[10px]" /><button type="button" onClick={() => signAgreementAsFarmer(agreement._id)} className="rounded-md bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-violet-700">Sign</button></div></div>; })}</div>}
                    {bookingNotifications.length === 0 && meetingNotifications.filter(meeting => meeting.status === 'pending').length === 0 && agreements.filter(agreement => (agreement.signatures?.hotel || agreement.signatures?.customer) && !agreement.signatures?.farmer).length === 0 && <p className="text-xs text-slate-500">No new notifications.</p>}
                    {notificationMessage && <p className="text-xs text-red-600">{notificationMessage}</p>}
                  </div>
                </div>
              )}
            </div>
            <div className="h-14 w-px bg-slate-200" />
            <button className="hidden sm:flex items-center gap-3" aria-label="Open profile menu">
              {user?.profile_img ? (
                <img src={user.profile_img} alt={user.name || 'Farmer profile'} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-semibold">
                  {(user?.name || 'Farmer').split(' ').map((name) => name[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="text-lg font-semibold text-slate-800 max-w-40 truncate">{user?.name || 'Farmer'}</span>
              <ChevronDown size={18} className="text-slate-500" />
            </button>
          </div>
        </header>

        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Farmer dashboard</p>
                <h1 className="text-2xl font-bold text-slate-800 mt-1">Animal care & marketplace responsibilities</h1>
                <p className="text-sm text-slate-500 mt-1">Keep every animal record accurate, current, and ready for a trusted transaction.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
                <i className="fas fa-shield-alt text-green-600"></i>
                Verified records workspace
              </div>
            </div>
          </div>

        {activeSection === 'animal-form' && (
        <section id="animal-form" className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6 scroll-mt-32">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Animal marketplace</p>
              <h2 className="text-lg font-bold text-slate-800">{editingAnimalId ? 'Update animal information' : 'Add animal for sale'}</h2>
            </div>
            {animalMessage && <p className="text-sm text-slate-600">{animalMessage}</p>}
          </div>
          <form onSubmit={handleAnimalSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {([
              ['name', 'Animal name', 'text'], ['breed', 'Breed', 'text'], ['age', 'Age (years)', 'number'],
              ['weight', 'Weight (kg)', 'number'], ['price', 'Price (RWF)', 'number'], ['country', 'Country', 'text'],
              ['district', 'District', 'text'], ['village', 'Village', 'text'],
            ] as const).map(([field, label, type]) => (
              <label key={field} className="text-xs font-medium text-slate-600">
                {label}
                <input
                  required={['name', 'breed', 'age', 'weight', 'price', 'country'].includes(field)}
                  type={type}
                  min={type === 'number' ? '0' : undefined}
                  value={animalForm[field]}
                  onChange={(event) => setAnimalForm(prev => ({ ...prev, [field]: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </label>
            ))}
            <label className="text-xs font-medium text-slate-600">Animal type
              <select value={animalForm.type} onChange={(event) => setAnimalForm(prev => ({ ...prev, type: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {['cow', 'goat', 'sheep', 'pig', 'horse', 'chicken', 'rabbit', 'buffalo', 'other'].map(type => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">Gender
              <select value={animalForm.gender} onChange={(event) => setAnimalForm(prev => ({ ...prev, gender: event.target.value as 'male' | 'female' }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="female">Female</option><option value="male">Male</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">Health status
              <select value={animalForm.healthStatus} onChange={(event) => setAnimalForm(prev => ({ ...prev, healthStatus: event.target.value as AnimalForm['healthStatus'] }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {['excellent', 'good', 'fair', 'poor'].map(status => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 self-end text-sm text-slate-600 pb-2">
              <input type="checkbox" checked={animalForm.vaccinated} onChange={(event) => setAnimalForm(prev => ({ ...prev, vaccinated: event.target.checked }))} /> Vaccinated
            </label>
            <label className="text-xs font-medium text-slate-600">Animal photo
              <input type="file" accept="image/*" onChange={(event) => setAnimalImage(event.target.files?.[0] || null)} className="mt-1 w-full text-xs" />
            </label>
            <label className="text-xs font-medium text-slate-600">Previous owner name
              <input value={animalForm.previousOwnerName} onChange={(event) => setAnimalForm(prev => ({ ...prev, previousOwnerName: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">Previous owner phone
              <input value={animalForm.previousOwnerPhone} onChange={(event) => setAnimalForm(prev => ({ ...prev, previousOwnerPhone: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">Previous owner ID number
              <input value={animalForm.previousOwnerIdNumber} onChange={(event) => setAnimalForm(prev => ({ ...prev, previousOwnerIdNumber: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">Ownership agreement
              <input type="file" accept="image/*,.pdf" onChange={(event) => setOwnershipAgreement(event.target.files?.[0] || null)} className="mt-1 w-full text-xs" />
            </label>
            <label className="text-xs font-medium text-slate-600">Previous owner ID document
              <input type="file" accept="image/*,.pdf" onChange={(event) => setOwnershipIdPhoto(event.target.files?.[0] || null)} className="mt-1 w-full text-xs" />
            </label>
            <div className="flex items-end gap-2 lg:col-span-2">
              <button disabled={animalLoading} type="submit" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                {animalLoading ? 'Saving...' : editingAnimalId ? 'Update animal' : 'Add animal'}
              </button>
              {editingAnimalId && <button type="button" onClick={() => { setEditingAnimalId(null); setAnimalForm(emptyAnimalForm); setAnimalImage(null); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button>}
            </div>
          </form>
        </section>
        )}

        {/* ===== FARMER RESPONSIBILITIES SECTION ===== */}
        <div className="grid ">
          {/* LEFT COLUMN - Animal Management */}
          <div className="space-y-4">
            {activeSection === 'animal-management' && (
        <div id="animal-management" className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 scroll-mt-32">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <i className="fas fa-paw text-green-600"></i> Animal details
              </h4>
              <div className="space-y-2">
                {animals.map(a => (
                  <div key={a.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                    <div className="flex min-w-0 items-center gap-3">
                      {a.images[0] ? (
                        <img src={a.images[0]} alt={a.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-400">No image</div>
                      )}
                      <div className="min-w-0">
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.breed} · {a.age} · {a.weight} · {a.gender}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor(a.health)}`}>{a.health}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.listedForSale ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {a.listedForSale ? 'for sale' : 'not listed'}
                      </span>
                      <button
                        onClick={() => updateVaccination(a.id)}
                        className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full transition"
                      >
                        <i className="fas fa-syringe mr-1"></i>vacc
                      </button>
                      <button
                        onClick={() => toggleListing(a.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition ${a.listedForSale ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}
                      >
                        <i className={`fas ${a.listedForSale ? 'fa-eye-slash' : 'fa-tag'} mr-1`}></i>
                        {a.listedForSale ? 'remove' : 'list for sale'}
                      </button>
                      {a._id && <button onClick={() => startEditingAnimal(a)} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full transition">edit</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
        )}

            {activeSection === 'vaccination-records' && (
        <div id="vaccination-records" className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 scroll-mt-32">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <i className="fas fa-syringe text-blue-500"></i> Vaccination records
              </h4>
              {healthFormOpen && (
                <form onSubmit={handleHealthSubmit} className="mb-4 rounded-lg bg-blue-50 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-medium text-slate-600">Animal
                    <select required value={healthForm.animalId} onChange={(event) => setHealthForm(prev => ({ ...prev, animalId: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
                      <option value="">Select animal</option>
                      {animals.filter(animal => animal._id).map(animal => <option key={animal._id} value={animal._id}>{animal.name}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-medium text-slate-600">Vaccine name
                    <input value={healthForm.vaccineName} onChange={(event) => setHealthForm(prev => ({ ...prev, vaccineName: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Optional for health update" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">Vaccination date
                    <input type="date" value={healthForm.vaccineDate} onChange={(event) => setHealthForm(prev => ({ ...prev, vaccineDate: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-medium text-slate-600">Health status
                    <select value={healthForm.healthStatus} onChange={(event) => setHealthForm(prev => ({ ...prev, healthStatus: event.target.value as AnimalForm['healthStatus'] }))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
                      {['excellent', 'good', 'fair', 'poor'].map(status => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={healthForm.vaccinated} onChange={(event) => setHealthForm(prev => ({ ...prev, vaccinated: event.target.checked }))} /> Vaccinated
                  </label>

                  {/* ── Vaccination Proof Upload ─────────────────────────────── */}
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <i className="fas fa-paperclip text-blue-500" /> Vaccination proof
                      <span className="font-normal text-slate-400">(image, video or document)</span>
                    </p>
                    <label
                      htmlFor="vaccination-proof-upload"
                      className="flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors p-4 gap-2"
                    >
                      {vaccinationProofFile ? (
                        <>
                          <i className="fas fa-check-circle text-emerald-500 text-xl" />
                          <span className="text-xs font-medium text-emerald-700 text-center break-all">{vaccinationProofFile.name}</span>
                          <span className="text-[10px] text-slate-400">{(vaccinationProofFile.size / 1024).toFixed(1)} KB · click to change</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-cloud-upload-alt text-blue-400 text-2xl" />
                          <span className="text-xs text-slate-500 text-center">
                            Click to upload an <strong>image</strong>, <strong>video</strong>, or <strong>PDF document</strong> as proof of vaccination
                          </span>
                        </>
                      )}
                      <input
                        id="vaccination-proof-upload"
                        type="file"
                        className="hidden"
                        accept="image/*,video/*,.pdf,application/pdf"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          if (!file) return;
                          setVaccinationProofFile(file);
                          const mime = file.type;
                          const proofType: HealthForm['vaccinationProofType'] =
                            mime.startsWith('video') ? 'video'
                            : mime === 'application/pdf' ? 'pdf'
                            : 'image';
                          setHealthForm(prev => ({ ...prev, vaccinationProofType: proofType }));
                        }}
                      />
                    </label>
                    {vaccinationProofFile && (
                      <button
                        type="button"
                        className="mt-1 text-[10px] text-red-500 hover:text-red-700"
                        onClick={() => { setVaccinationProofFile(null); setHealthForm(prev => ({ ...prev, vaccinationProofType: '' })); }}
                      >
                        ✕ Remove proof file
                      </button>
                    )}
                  </div>
                  {/* ─────────────────────────────────────────────────────────── */}

                  <div className="flex items-center gap-2 sm:col-span-2">
                    <button disabled={animalLoading} type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{animalLoading ? 'Saving...' : 'Save records'}</button>
                    <button type="button" onClick={() => { setHealthFormOpen(false); setVaccinationProofFile(null); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">Cancel</button>
                  </div>
                </form>
              )}
              <ul className="space-y-1 text-sm">
                {animals.slice(0, 3).map(a => (
                  <li key={`v-${a.id}`} className="flex justify-between border-b border-slate-50 py-1 text-xs">
                    <span>{a.name} · {a.breed}</span>
                    <span className="text-emerald-600">{a.lastVaccine} → {a.nextVaccine}</span>
                  </li>
                ))}
              </ul>
            </div>
        )}

            {activeSection === 'ownership-documents' && (
        <div id="ownership-documents" className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 scroll-mt-32">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <i className="fas fa-id-card text-indigo-500"></i> Ownership & documents
              </h4>
              {ownershipDocumentItems.length > 0 ? (
                <div className="space-y-3 text-sm">
                  {ownershipDocumentItems.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{item.animalName}</p>
                      <p className="mt-1 text-xs text-slate-500">Previous owner: {item.ownerName}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.agreementUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedOwnershipDoc({ title: `${item.animalName} - ownership agreement`, url: item.agreementUrl })}
                            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-700"
                          >
                            View ownership agreement
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-500">
                            No ownership agreement provided
                          </span>
                        )}
                        {item.idUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedOwnershipDoc({ title: `${item.animalName} - owner ID document`, url: item.idUrl })}
                            className="inline-flex items-center rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
                          >
                            View owner ID document
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500">
                            No owner ID document provided
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200">
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            const url = URL.createObjectURL(file);
                            setOwnershipDocForm(prev => ({ ...prev, agreementUrl: url }));
                            setSelectedOwnershipDoc({ title: `${item.animalName} - ownership agreement`, url });
                          }} />
                          Upload / Update agreement
                        </label>
                        <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50">
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            const url = URL.createObjectURL(file);
                            setOwnershipDocForm(prev => ({ ...prev, idUrl: url }));
                            setSelectedOwnershipDoc({ title: `${item.animalName} - owner ID document`, url });
                          }} />
                          Upload / Update ID
                        </label>
                      </div>
                    </div>
                  ))}
                  {selectedOwnershipDoc && (
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{selectedOwnershipDoc.title}</p>
                        <a
                          href={selectedOwnershipDoc.url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-700"
                        >
                          Download
                        </a>
                      </div>
                      <div className="overflow-hidden rounded-md border border-indigo-100 bg-white">
                        {selectedOwnershipDoc.url.toLowerCase().endsWith('.pdf') || selectedOwnershipDoc.url.includes('pdf') ? (
                          <iframe
                            title={selectedOwnershipDoc.title}
                            src={selectedOwnershipDoc.url}
                            className="h-80 w-full"
                          />
                        ) : (
                          <img
                            src={selectedOwnershipDoc.url}
                            alt={selectedOwnershipDoc.title}
                            className="max-h-80 w-full object-contain"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between text-xs border-b border-slate-50 py-1">
                    <span>Owner</span><span className="font-medium">-</span>
                  </p>
                  <p className="flex justify-between text-xs border-b border-slate-50 py-1">
                    <span>Docs</span><span className="text-emerald-600"><i className="fas fa-check-circle mr-1"></i> no uploaded documents</span>
                  </p>
                  <button
                    onClick={handleUploadDoc}
                    className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full mt-1 transition"
                  >
                    <i className="fas fa-upload mr-1"></i> upload photo / doc
                  </button>
                </div>
              )}
            </div>
        )}

            {activeSection === 'animal-history' && (
        <div id="animal-history" className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 scroll-mt-32">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <i className="fas fa-history text-amber-600"></i> Animal history & lineage
              </h4>
              <div className="space-y-1">
                {animals.map(a => (
                  <div key={`hist-${a.id}`} className="text-xs border-b border-slate-50 py-1">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-slate-500 ml-2">{a.lineage}</span>
                  </div>
                ))}
              </div>
            </div>
        )}
          </div>

          {/* RIGHT COLUMN - Marketplace & Compliance */}
          <div className="space-y-4">
            {activeSection === 'customer-inquiries' && (
        <div id="customer-inquiries" className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 scroll-mt-32">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <i className="fas fa-envelope text-amber-500"></i> Customer inquiries
                <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  {inquiries.filter(i => i.status === 'pending').length} pending
                </span>
              </h4>
              <div className="space-y-2">
                {inquiries.map(q => (
                  <div key={q.id} className="border-b border-slate-50 pb-2 last:border-0">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{q.from}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor(q.status)}`}>{q.status}</span>
                    </div>
                    <p className="text-xs text-slate-500">🐄 {q.animal} · {q.message}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-slate-400">{q.date}</span>
                      {q.status === 'pending' && (
                        <button
                          onClick={() => replyToInquiry(q.id)}
                          className="text-[10px] bg-green-50 hover:bg-green-100 text-green-600 px-2 py-0.5 rounded-full transition"
                        >
                          <i className="fas fa-reply mr-1"></i> respond
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
        )}

            {activeSection === 'customer-messages' && (
        <div id="customer-messages" className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 scroll-mt-32">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <i className="fas fa-comments text-cyan-600"></i> Customer messages
                <span className="ml-auto text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">
                  {chatThreads.length} conversation{chatThreads.length === 1 ? '' : 's'}
                </span>
              </h4>
              {chatMessage && <p className="text-xs text-red-600 mb-2">{chatMessage}</p>}

              {!selectedChatThread ? (
                <div className="space-y-2">
                  {chatThreads.length === 0 ? (
                    <p className="text-xs text-slate-500">No customer messages yet.</p>
                  ) : (
                    chatThreads.map((thread: any) => {
                      const lastMsg = thread.messages[thread.messages.length - 1];
                      return (
                        <button
                          key={thread.animalId + '__' + thread.customerId}
                          type="button"
                          onClick={() => setSelectedChatThread(thread)}
                          className="w-full text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 p-3 transition"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-800">{thread.customerName || 'Customer'}</span>
                            <span className="text-[10px] text-slate-400">{lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString() : ''}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Animal: {thread.animalName}</p>
                          {lastMsg && (
                            <p className="text-xs text-slate-600 mt-1 truncate">
                              {lastMsg.isMine ? 'You: ' : ''}{lastMsg.text}
                            </p>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedChatThread(null)}
                    className="text-[11px] text-cyan-600 hover:underline mb-3"
                  >
                    Back to conversations
                  </button>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 mb-3">
                    <p className="text-sm font-semibold text-slate-800">{selectedChatThread.customerName || 'Customer'}</p>
                    <p className="text-xs text-slate-500">About: {selectedChatThread.animalName}</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-2 mb-3 pr-1">
                    {selectedChatThread.messages.map((msg: any) => (
                      <div key={msg._id} className={'flex ' + (msg.isMine ? 'justify-end' : 'justify-start')}>
                        <div className={(msg.isMine ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-800') + ' max-w-[75%] px-3 py-2 rounded-xl text-xs'}>
                          {msg.text}
                          <div className={(msg.isMine ? 'text-white/70' : 'text-slate-400') + ' text-[9px] mt-1'}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatReplyText}
                      onChange={(e) => setChatReplyText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendChatReply()}
                      placeholder="Type a reply..."
                      disabled={chatLoading}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={handleSendChatReply}
                      disabled={!chatReplyText.trim() || chatLoading}
                      className="rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-3 py-2 text-xs font-semibold transition"
                    >
                      {chatLoading ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </div>
        )}

            {activeSection === 'customer-booked' && (
        <div id="customer-booked" className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 scroll-mt-32">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <i className="fas fa-user-friends text-cyan-600"></i> Customer requests
                </h4>
                <button type="button" onClick={() => setShowZoomForm(prev => !prev)} className="text-[10px] bg-cyan-50 hover:bg-cyan-100 text-cyan-600 px-2 py-1 rounded-full transition">
                  {showZoomForm ? 'Hide Zoom' : 'Add Zoom'}
                </button>
              </div>

              {showZoomForm && (
                <div className="mb-4 rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-cyan-700">{editingMeetingId ? 'Update & reschedule Zoom meeting' : 'Schedule new Zoom meeting'}</p>
                    <div className="mt-3 flex gap-3">
                      <select disabled={editingMeetingId !== null} value={zoomForm.animalId} onChange={(event) => setZoomForm(prev => ({ ...prev, animalId: event.target.value }))} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white disabled:bg-slate-100 disabled:text-slate-500">
                        <option value="">Select animal</option>
                        {animals.filter((animal) => animal._id).map((animal) => <option key={animal._id} value={animal._id}>{animal.name}</option>)}
                      </select>
                      <input value={zoomForm.link} onChange={(event) => setZoomForm(prev => ({ ...prev, link: event.target.value }))} placeholder="Zoom link" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white" />
                    </div>
                  </div>

                  {/* Calendar & Time Picker */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Calendar Panel */}
                    <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                      <div className="flex items-center justify-between mb-3">
                        <button onClick={goToCalendarPrevMonth} className="text-slate-400 hover:text-slate-600"><ChevronLeft size={18} /></button>
                        <h3 className="text-sm font-semibold text-slate-700">{CALENDAR_MONTH_NAMES[calendarViewMonth]} {calendarViewYear}</h3>
                        <button onClick={goToCalendarNextMonth} className="text-slate-400 hover:text-slate-600"><ChevronRight size={18} /></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {CALENDAR_DAY_LABELS.map((label) => (
                          <div key={label} className="text-center text-[10px] font-bold text-slate-600">{label}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarCells.map((cell, idx) => {
                          const selected = isCalendarDaySelected(cell);
                          return (
                            <button
                              key={idx}
                              onClick={() => handleCalendarDayClick(cell)}
                              disabled={!cell.inMonth}
                              className={`aspect-square text-[11px] font-medium rounded transition ${!cell.inMonth ? 'text-slate-300 cursor-default' : selected ? 'bg-cyan-600 text-white ring-2 ring-cyan-400' : 'text-slate-700 hover:bg-slate-200'}`}
                            >
                              {cell.day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots Panel */}
                    <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                      <div className="flex items-center justify-between mb-3">
                        <button onClick={() => shiftCalendarDay(-1)} className="text-slate-400 hover:text-slate-600"><ChevronLeft size={18} /></button>
                        <h3 className="text-sm font-semibold text-slate-700">{formatCalendarDate(selectedCalendarDate)}</h3>
                        <button onClick={() => shiftCalendarDay(1)} className="text-slate-400 hover:text-slate-600"><ChevronRight size={18} /></button>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto pr-2 space-y-1">
                        {CALENDAR_TIME_SLOTS.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedCalendarTime(time)}
                            className={`w-full text-center py-2 text-xs rounded transition ${selectedCalendarTime === time ? 'bg-cyan-600 text-white font-semibold' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <button type="button" onClick={applyZoomFormFromCalendar} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700">Apply date & time</button>
                    <div className="flex gap-2">
                      {editingMeetingId ? (
                        <>
                          <button type="button" onClick={() => { setEditingMeetingId(null); setZoomForm({ animalId: '', date: '', time: '', link: '' }); setShowZoomForm(false); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                          <button type="button" onClick={rescheduleZoomMeeting} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700">Reschedule</button>
                          <button type="button" onClick={updateZoomMeeting} className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white hover:bg-cyan-700">Update</button>
                        </>
                      ) : (
                        <button type="button" onClick={addZoomRequest} className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white hover:bg-cyan-700">Schedule Zoom</button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {customerRequests.length > 0 ? customerRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{request.kind}</p>
                        <p className="mt-1 text-sm font-medium text-slate-800">{request.title}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor(request.status)}`}>{request.status}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{request.detail}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {request.kind === 'booking' && (
                        <button type="button" onClick={() => setNotificationMessage('Booking request review opened.')} className="text-[10px] bg-cyan-50 hover:bg-cyan-100 text-cyan-600 px-2 py-1 rounded-full transition">View request</button>
                      )}
                      {request.kind === 'zoom' && (
                        <>
                          {(() => {
                            const meeting = meetingNotifications.find(item => item._id === request.requestId);
                            return meeting?.videoCall?.meetingLink ? (
                              <a href={meeting.videoCall.meetingLink} target="_blank" rel="noreferrer" className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full transition">
                                Open Zoom
                              </a>
                            ) : null;
                          })()}
                          {request.requestId && (
                            <button type="button" onClick={() => {
                              const meeting = meetingNotifications.find(m => m._id === request.requestId);
                              if (meeting) editZoomRequest(meeting);
                            }} className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-600 px-2 py-1 rounded-full transition">
                              {editingMeetingId === request.requestId ? '✏️ Editing' : 'Schedule/Edit'}
                            </button>
                          )}
                          {request.status !== 'cancelled' && (
                            <button type="button" onClick={() => request.requestId && approveMeeting(request.requestId)} className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded-full transition">
                              {request.status === 'pending' ? 'Approve' : 'Scheduled'}
                            </button>
                          )}
                          {request.requestId && (
                            <button type="button" onClick={() => cancelMeeting(request.requestId!)} className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-full transition">Cancel</button>
                          )}
                        </>
                      )}
                      {request.kind === 'agreement' && (
                        <button type="button" onClick={() => { if (request.requestId) signAgreementAsFarmer(request.requestId); }} className="text-[10px] bg-violet-50 hover:bg-violet-100 text-violet-600 px-2 py-1 rounded-full transition">
                          {request.status === 'waiting for farmer sign' ? 'Sign agreement' : 'Review agreement'}
                        </button>
                      )}
                      {request.kind === 'payment' && (
                        <button type="button" onClick={() => setNotificationMessage('Payment review opened for the customer request.')} className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full transition">Review payment</button>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500">No customer requests yet.</p>
                )}
              </div>
            </div>
        )}

            {activeSection === 'chart' && (
        <div id="chart" className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <i className="fas fa-chart-line text-indigo-500"></i> Customer vs farmer activity
              </h4>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Mon', customers: 20, farmers: 12 },
                    { name: 'Tue', customers: 34, farmers: 18 },
                    { name: 'Wed', customers: 28, farmers: 22 },
                    { name: 'Thu', customers: 42, farmers: 27 },
                    { name: 'Fri', customers: 55, farmers: 31 },
                  ]}>
                    <defs>
                      <linearGradient id="customersFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="farmersFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="customers" stroke="#10b981" strokeWidth={2} fill="url(#customersFill)" />
                    <Area type="monotone" dataKey="farmers" stroke="#6366f1" strokeWidth={2} fill="url(#farmersFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
        )}

            {activeSection === 'transactions' && (
        <div id="transactions" className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 scroll-mt-32">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <i className="fas fa-handshake text-slate-600"></i> Transactions & escrow
              </h4>
              <div className="space-y-2">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between border-b border-slate-50 py-1.5 text-sm">
                    <div>
                      <span className="font-medium">{t.animal}</span>
                      <span className="text-xs text-slate-400"> → {t.buyer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{t.amount}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>{t.status}</span>
                      {t.status === 'escrow' && (
                        <button
                          onClick={() => completeTransaction(t.id)}
                          className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full transition"
                        >
                          <i className="fas fa-check-double mr-1"></i>complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
        )}

            {activeSection === 'agreements' && (
        <div id="agreements" className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 scroll-mt-32 space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                <i className="fas fa-file-signature text-violet-500"></i> Agreements
              </h4>

              {agreements.length === 0 && (
                <p className="text-xs text-slate-500">No agreement requests yet.</p>
              )}

              {/* Agreement list */}
              {!selectedAgreement && agreements.map((agreement) => {
                const customerSigned = !!agreement.signatures?.customer;
                const farmerSigned = !!agreement.signatures?.farmer;
                return (
                  <div key={agreement._id} className="border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{agreement.title || 'Purchase Agreement'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          From: <span className="font-medium text-slate-700">{agreement.parties?.customer?.name || agreement.parties?.customer?.email || 'Customer'}</span>
                          {agreement.animal?.name && <> &middot; Animal: <span className="font-medium text-slate-700">{agreement.animal.name}</span></>}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[10px] px-2 py-1 rounded-full font-medium ${
                        farmerSigned && customerSigned ? 'bg-emerald-100 text-emerald-700' :
                        customerSigned ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {farmerSigned && customerSigned ? '✓ Both signed' : customerSigned ? 'Awaiting your sign' : 'Pending customer'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {agreement.price !== undefined && (
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">FRW {agreement.price.toLocaleString()}</span>
                      )}
                      {agreement.paymentMethod && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{agreement.paymentMethod.replace('_', ' ')}</span>
                      )}
                      {agreement.deliveryDate && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">📅 {new Date(agreement.deliveryDate).toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedAgreement(agreement)}
                        className="text-[11px] bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg font-medium transition"
                      >
                        View Agreement
                      </button>
                      {customerSigned && !farmerSigned && (
                        <button
                          type="button"
                          onClick={() => { setSelectedAgreement(agreement); }}
                          className="text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-medium transition"
                        >
                          Sign Now ✍️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Full Agreement Viewer + Farmer Signer */}
              {selectedAgreement && (() => {
                const ag = selectedAgreement;
                const customerSigned = !!ag.signatures?.customer;
                const farmerSigned = !!ag.signatures?.farmer;
                return (
                  <div className="border border-violet-200 bg-violet-50/30 rounded-xl p-5 space-y-4">
                    {/* Back button */}
                    <button
                      type="button"
                      onClick={() => { setSelectedAgreement(null); setFarmerSignature(''); }}
                      className="text-[11px] text-violet-600 hover:underline flex items-center gap-1"
                    >
                      ← Back to list
                    </button>

                    {/* Agreement Document */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 font-serif text-slate-800" style={{ fontFamily: 'Georgia, serif' }}>
                      {/* Header */}
                      <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
                        <h2 className="text-lg font-black tracking-widest uppercase">Farm Purchase Agreement</h2>
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                          <span>Ref: {ag.transactionId || ag._id.slice(-8)}</span>
                          <span>Date: {ag.createdAt ? new Date(ag.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Parties */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <div className="bg-slate-800 text-white text-center text-xs font-bold py-1 mb-2 rounded">SELLER (FARMER)</div>
                          <p><span className="text-slate-500">Name:</span> <span className="font-medium">{ag.parties?.farmer?.name || user?.name || '—'}</span></p>
                          <p><span className="text-slate-500">Email:</span> {ag.parties?.farmer?.email || user?.email || '—'}</p>
                        </div>
                        <div>
                          <div className="bg-slate-800 text-white text-center text-xs font-bold py-1 mb-2 rounded">BUYER (CUSTOMER)</div>
                          <p><span className="text-slate-500">Name:</span> <span className="font-medium">{ag.parties?.customer?.name || '—'}</span></p>
                          <p><span className="text-slate-500">Email:</span> {ag.parties?.customer?.email || '—'}</p>
                          {ag.parties?.customer?.phone && <p><span className="text-slate-500">Phone:</span> {ag.parties.customer.phone}</p>}
                        </div>
                      </div>

                      {/* Animal */}
                      <div className="mb-3 text-sm">
                        <p className="font-bold text-slate-800 mb-1">1. Property Description</p>
                        <p className="text-slate-600 leading-relaxed">
                          The Seller agrees to sell: <strong>{ag.animal?.name || '—'}</strong>
                          {ag.animal?.type && `, a ${ag.animal.type}`}
                          {ag.animal?.breed && ` of breed ${ag.animal.breed}`}
                          {ag.animal?.age !== undefined && `, aged ${ag.animal.age}`}
                          {ag.animal?.weight !== undefined && `, weighing ${ag.animal.weight} kg`}.
                        </p>
                      </div>

                      {/* Price & Payment */}
                      <div className="mb-3 text-sm">
                        <p className="font-bold text-slate-800 mb-1">2. Purchase Price & Payment</p>
                        <p className="text-slate-600">
                          Total: <strong className="text-emerald-700">{ag.currency || 'FRW'} {ag.price?.toLocaleString() || '—'}</strong>
                          {ag.paymentMethod && <> &middot; Method: <strong>{ag.paymentMethod.replace('_', ' ')}</strong></>}
                        </p>
                      </div>

                      {/* Delivery */}
                      {ag.deliveryDate && (
                        <div className="mb-3 text-sm">
                          <p className="font-bold text-slate-800 mb-1">3. Delivery</p>
                          <p className="text-slate-600">Expected delivery date: <strong>{new Date(ag.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
                        </div>
                      )}

                      {/* Terms */}
                      <div className="mb-4 text-sm">
                        <p className="font-bold text-slate-800 mb-1">{ag.deliveryDate ? '4.' : '3.'} Terms</p>
                        <p className="text-slate-600 leading-relaxed">
                          {ag.terms || 'The parties agree to the standard terms for the sale as set out in this agreement, facilitated by AniMarket Platform.'}
                        </p>
                      </div>

                      {/* Signatures status */}
                      <div className="border-t-2 border-slate-200 pt-4 grid grid-cols-2 gap-6 text-sm">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Buyer Signature</p>
                          {customerSigned ? (
                            <p className="font-serif italic text-slate-800 border-b border-slate-300 pb-1">{ag.signatures?.customer}</p>
                          ) : (
                            <p className="text-slate-400 italic border-b border-slate-300 pb-1">Awaiting customer…</p>
                          )}
                          <p className="text-xs font-medium mt-1">{ag.parties?.customer?.name || 'Customer'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Seller Signature</p>
                          {farmerSigned ? (
                            <p className="font-serif italic text-slate-800 border-b border-slate-300 pb-1">{ag.signatures?.farmer}</p>
                          ) : (
                            <p className="text-slate-400 italic border-b border-slate-300 pb-1">Awaiting your signature…</p>
                          )}
                          <p className="text-xs font-medium mt-1">{ag.parties?.farmer?.name || user?.name || 'Farmer'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Farmer Sign Form */}
                    {customerSigned && !farmerSigned && (
                      <div className="bg-white rounded-xl border border-amber-200 p-4 space-y-3">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Your Signature Required</p>
                        <p className="text-xs text-slate-600">The customer has signed this agreement. Please review the details above and sign below to complete the agreement.</p>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Your Digital Signature (Farmer) *</label>
                          <input
                            type="text"
                            value={farmerSignature}
                            onChange={(e) => setFarmerSignature(e.target.value)}
                            placeholder="Type your full legal name to sign"
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">By typing your name you are digitally countersigning this purchase agreement.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => signAgreementAsFarmer(ag._id)}
                          className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2.5 rounded-xl transition"
                        >
                          ✍️ Countersign Agreement
                        </button>
                      </div>
                    )}

                    {/* Both signed */}
                    {customerSigned && farmerSigned && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                        <p className="text-sm font-semibold text-emerald-700 flex items-center gap-2">✓ Agreement fully signed by both parties</p>
                        {ag.pdfUrl && (
                          <a href={ag.pdfUrl} target="_blank" rel="noreferrer" download
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                          >
                            Download signed PDF
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
        )}

            {activeSection === 'inspection' && (
        <div id="inspection" className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 scroll-mt-32">
              <div className="flex items-start gap-2">
                <i className="fas fa-clipboard-check text-green-600 text-lg mt-0.5"></i>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Truthful condition & inspection</h4>
                  <p className="text-xs text-slate-500">Provide accurate health, condition, characteristics. Cooperate with verification.</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full">
                      <i className="fas fa-check mr-1"></i> health status accurate
                    </span>
                    <button
                      onClick={handleInspection}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 px-3 py-0.5 rounded-full transition"
                    >
                      <i className="fas fa-file-signature mr-1"></i> prepare docs
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-400">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span>
              <i className="fas fa-check-circle text-emerald-500 mr-1"></i>
              Farmer responsibilities: accurate animal info · vaccination · ownership · documents · history ·
              respond to inquiries · honor agreements · truthful condition · inspection · transaction
            </span>
            <span className="bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100 text-slate-500">
              <i className="fas fa-shield-alt mr-1 text-green-600"></i> AniMarket compliant
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
