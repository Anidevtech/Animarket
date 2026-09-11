'use client';

import { useState, useEffect, type KeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import brand from "../../../public/images/brand.png";
import { FaCartPlus } from "react-icons/fa";
import hotelProfile from "../../../public/images/hotelPofile.png";
import { useHotelAuth } from "../../Contexts/HotelAuthContext";

type Animal = {
  id?: string;
  _id?: string;
  name?: string;
  type?: string;
  breed?: string;
  age?: number | string;
  weight?: number | string;
  status?: string;
  images?: string[];
  price?: number | string;
  amount?: number | string;
  currency?: string;
  birthDate?: string;
};

type IconProps = {
  d: string | string[];
  size?: number;
  className?: string;
  viewBox?: string;
  stroke?: boolean;
};

type BadgeProps = {
  children: ReactNode;
  color?: "green" | "yellow" | "red" | "blue";
};

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  icon?: string | string[];
  color?: "green" | "blue" | "purple" | "amber";
  change?: string;
  positive?: boolean;
};

type VerificationItemProps = {
  id: string;
  title: string;
  subtitle: string;
};

type RiskRowProps = {
  id: string;
  sender: string;
  receiver: string;
  asset: string;
  value: string;
  score: number;
};

type SidebarProps = {
  active: string;
  setActive: (id: string) => void;
};

type AnimalCardProps = {
  animal: Animal;
  onSelect: (animal: Animal) => void;
};

type AnimalDetailModalProps = {
  animal: Animal;
  onClose: () => void;
  onBook: () => void;
  bookingLoading: boolean;
  bookingMessage: string;
  bookingError: string;
  agreement: any;
  agreementLoading: boolean;
  agreementError: string;
  agreementSignature: string;
  setAgreementSignature: (value: string) => void;
  agreementSigning: boolean;
  onSignAgreement: () => void;
  showAgreementPanel: boolean;
  onToggleAgreementPanel: () => void;
};

const Icon = ({ d, size = 16, className = "", viewBox = "0 0 24 24", stroke = true }: IconProps) => (
  <svg width={size} height={size} viewBox={viewBox} fill={stroke ? "none" : "currentColor"}
    stroke={stroke ? "currentColor" : "none"} strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  inventory: "M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16M1 21h22",
  marketplace: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  transactions: "M3 10h18M5 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
  health: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
  analytics: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  settings: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  search: "M11 19A8 8 0 1 0 11 3a8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  plus: "M12 5v14M5 12h14",
  arrowUp: "M18 15l-6-6-6 6",
  arrowDown: "M6 9l6 6 6-6",
  creditCard: "M1 4h22v16H1zM1 10h22",
  herd: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  verify: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
  risk: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4M12 16h.01",
  escrow: "M3 10h18M5 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
  heatmap: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  sun: "M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 1 0 0 14A7 7 0 0 0 12 5z",
  chevronDown: "M6 9l6 6 6-6",
  chevronRight: "M9 6l6 6-6 6",
  pay: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z",
  schedule: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z",
  cancel: "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  update: "M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z",
  sign: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  create: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  read: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  updateAlt: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  delete: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  delivery: "M4 16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4H4v12zM6 12h12M6 8h12",
  booking: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z",
  video: "M23 7l-6 5.33V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5.33L23 17V7z",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z",
  calendar: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z",
  clock: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z",
  check: "M20 6L9 17l-5-5",
  weight: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  calendarCheck: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10l2 2 4-4",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"
};

const Badge = ({ children, color = "green" }: BadgeProps) => {
  const map: Record<string, string> = {
    green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    yellow: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    red: "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20",
    blue: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[color]}`}>{children}</span>;
};

const StatCard = ({ label, value, sub, icon, color, change, positive }: StatCardProps) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    green: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
    blue: { bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-400" },
    purple: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  };
  const c = colorMap[color] || colorMap.green;

  return (
    <div className="group rounded-2xl p-6 flex flex-col gap-1 transition-all duration-300 border bg-white dark:bg-[#16191f] border-gray-200 dark:border-white/[0.07] hover:shadow-lg hover:scale-[1.02] hover:border-emerald-500/20">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 dark:text-[#94a3b8] text-xs font-medium tracking-wider uppercase">{label}</span>
        {icon && (
          <div className={`p-2 rounded-xl ${c.bg} ${c.text}`}>
            <Icon d={icon} size={18} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold text-gray-900 dark:text-white font-['Sora']">{value}</span>
        {change && (
          <span className={`text-xs flex items-center gap-0.5 font-medium ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            <Icon d={positive ? icons.arrowUp : icons.arrowDown} size={12} />
            {change}
          </span>
        )}
      </div>
      {sub && <span className="text-xs text-gray-500 dark:text-[#94a3b8] mt-0.5">{sub}</span>}
    </div>
  );
};

const VerificationItem = ({ id, title, subtitle }: VerificationItemProps) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/[0.06] last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] px-2 -mx-2 rounded-lg transition-all">
    <div>
      <div className="font-semibold text-gray-900 dark:text-white text-sm">{id}</div>
      <div className="text-xs text-gray-500 dark:text-[#94a3b8]">{title} • {subtitle}</div>
    </div>
    <button className="text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:underline flex items-center gap-1 transition-all hover:gap-2">
      Verify Now <span className="text-xs">→</span>
    </button>
  </div>
);

const RiskRow = ({ id, sender, receiver, asset, value, score }: RiskRowProps) => (
  <tr className="border-b border-gray-100 dark:border-white/[0.06] last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all">
    <td className="py-3 px-4 text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">{id}</td>
    <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">{sender} / {receiver}</td>
    <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400">{asset}</td>
    <td className="py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white">{value}</td>
    <td className="py-3 px-4">
      <Badge color={score > 70 ? "red" : score > 40 ? "yellow" : "green"}>{score}</Badge>
    </td>
    <td className="py-3 px-4">
      <button className="text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:underline transition-all">Review</button>
    </td>
  </tr>
);

const statusStyles: Record<string, { dot: string; text: string; ring: string }> = {
  available: { dot: "bg-emerald-400", text: "text-emerald-300", ring: "ring-emerald-400/30" },
  booked: { dot: "bg-amber-400", text: "text-amber-300", ring: "ring-amber-400/30" },
  sick: { dot: "bg-rose-400", text: "text-rose-300", ring: "ring-rose-400/30" },
  unknown: { dot: "bg-gray-400", text: "text-gray-300", ring: "ring-gray-400/30" },
};

const AnimalCard = ({ animal, onSelect }: AnimalCardProps) => {
  const statusKey = (animal.status || "unknown").toLowerCase();
  const status = statusStyles[statusKey] || statusStyles.unknown;

  const handleActivate = () => onSelect && onSelect(animal);
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className="group relative bg-white dark:bg-[#16191f] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.07] hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
    >
      <div className="relative h-56 w-full overflow-hidden bg-gray-100 dark:bg-white/[0.03]">
        {animal.images && animal.images[0] ? (
          <img
            src={animal.images[0]}
            alt={animal.name || "animal"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Icon d={icons.herd} size={40} />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm ring-1 ${status.ring}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span className={`text-[11px] font-medium capitalize ${status.text}`}>{animal.status || "Unknown"}</span>
        </div>

        {animal.price ? (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
            <span className="text-sm font-semibold text-white">
              {animal.currency || ""} {Number(animal.price).toLocaleString()}
            </span>
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h4 className="font-semibold text-white text-base leading-tight">{animal.name || animal.type || "Unknown"}</h4>
          <span className="text-xs text-white/70">ID: {animal.id || animal._id || "N/A"}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-gray-500 dark:text-[#94a3b8]">Breed</span>
            <p className="font-medium text-gray-900 dark:text-white truncate">{animal.breed || "N/A"}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-[#94a3b8]">Age</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {animal.age
                ? `${animal.age} yrs`
                : animal.birthDate
                ? `${new Date().getFullYear() - new Date(animal.birthDate).getFullYear()} yrs`
                : "N/A"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-[#94a3b8]">Weight</span>
            <p className="font-medium text-gray-900 dark:text-white">{animal.weight ? `${animal.weight} kg` : "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </div>
  );
};

const Sidebar = ({ active, setActive }: SidebarProps) => {
  const { hotel, logout } = useHotelAuth();
  const navigate = useNavigate();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    transactions: false,
    zoom: false,
    agreement: false
  });

  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNavClick = (id: string) => {
    setActive(id);
    setOpenDropdowns({
      transactions: false,
      zoom: false,
      agreement: false
    });
  };

  const handleDropdownItemClick = (id: string) => {
    setActive(id);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: icons.dashboard },
    { id: "transactions", label: "Transactions", icon: icons.transactions, dropdown: true },
    { id: "zoom", label: "Zoom Meeting", icon: icons.schedule, dropdown: true },
    { id: "agreement", label: "Agreement", icon: icons.sign, dropdown: true },
    { id: "health", label: "Health Records", icon: icons.health },
    { id: "delivery", label: "Request Delivery", icon: icons.delivery },
    { id: "booking", label: "Booking", icon: icons.booking },
  ];

  const dropdownItems: Record<string, Array<{ id: string; label: string; icon: string }>> = {
    transactions: [
      { id: "pay-animal", label: "Pay Animal", icon: icons.pay },
      { id: "pay-commission", label: "Pay Commission", icon: icons.pay }
    ],
    zoom: [
      { id: "schedule-zoom", label: "Schedule Zoom", icon: icons.schedule },
      { id: "cancel-zoom", label: "Cancel Zoom", icon: icons.cancel },
      { id: "add-zoom", label: "Add Zoom", icon: icons.add },
      { id: "updated-zoom", label: "Updated Zoom", icon: icons.update }
    ],
    agreement: [
      { id: "sign-agreement", label: "Sign Agreement", icon: icons.sign },
      { id: "create-agreement", label: "Create Agreement", icon: icons.create },
      { id: "read-agreement", label: "Read Agreement", icon: icons.read },
      { id: "update-agreement", label: "Update Agreement", icon: icons.updateAlt },
      { id: "delete-agreement", label: "Delete Agreement", icon: icons.delete }
    ]
  };

  return (
    <aside className="w-[240px] min-h-screen bg-white dark:bg-[#0f1117] border-r border-gray-200 dark:border-white/[0.06] flex flex-col pt-6 pb-6 shrink-0">
      <div className="px-5 mb-8 flex items-center gap-3">
        <div className="flex items-center gap-3">
          <img src={brand} alt="logo" className="h-12 w-auto" />
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">Animarket</span>
        </div>
      </div>

      <div className="px-3 mb-6 flex-1">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            if (item.dropdown) {
              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleDropdown(item.id)}
                    className={`flex items-center justify-between gap-3 text-sm px-3 py-2.5 rounded-xl w-full text-left transition-all duration-200 ${
                      active === item.id || openDropdowns[item.id]
                        ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 font-medium"
                        : "text-gray-600 dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon d={item.icon} size={18} />
                      <span>{item.label}</span>
                    </div>
                    <Icon d={openDropdowns[item.id] ? icons.chevronDown : icons.chevronRight} size={14} className="transition-transform duration-200" />
                  </button>
                  {openDropdowns[item.id] && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-emerald-500/20 pl-3">
                      {dropdownItems[item.id].map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleDropdownItemClick(subItem.id)}
                          className={`flex items-center gap-3 text-sm px-3 py-2 rounded-xl w-full text-left transition-all duration-200 ${
                            active === subItem.id
                              ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 font-medium"
                              : "text-gray-600 dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          <Icon d={subItem.icon} size={14} />
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 text-sm px-3 py-2.5 rounded-xl w-full text-left transition-all duration-200 ${
                  active === item.id
                    ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 font-medium"
                    : "text-gray-600 dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon d={item.icon} size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-3 mb-6">
        <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-medium rounded-xl py-3 px-4 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40">
          <Icon d={icons.plus} size={16} />
          Add New Hotel
        </button>
      </div>

      <div className="px-3 mt-auto pt-4 border-t border-gray-200 dark:border-white/[0.06] flex flex-col gap-1">
        {/* Hotel profile info */}
        {hotel && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            {hotel.profileImage || hotel.logo ? (
              <img
                src={hotel.profileImage || hotel.logo}
                alt={hotel.hotelName}
                className="w-8 h-8 rounded-lg object-cover border border-emerald-500/20 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                {(hotel.hotelName || 'H').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium text-gray-700 dark:text-[#e2e8f0] truncate">{hotel.hotelName || 'Hotel'}</span>
          </div>
        )}
        <button className="text-xs text-gray-500 dark:text-[#94a3b8] hover:text-gray-700 dark:hover:text-white flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all duration-200">
          <Icon d={icons.settings} size={14} /> Settings
        </button>
        <button
          onClick={handleLogout}
          className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
        >
          <Icon d={icons.logout} size={14} /> Logout
        </button>
      </div>
    </aside>
  );
};

const Topbar = ({ darkMode, setDarkMode }) => {
  const { hotel } = useHotelAuth();
  return (
  <div className="h-16 flex items-center justify-between px-8 border-b border-gray-200 fixed top-0 left-48 right-0 shadow-md dark:border-white/[0.06] bg-white/80 dark:bg-[#0c0e12]/80 backdrop-blur-sm shrink-0">
    <div>
      <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent font-['Sora']">
        Welcome, {hotel?.hotelName || 'Hotel'}
      </h1>
    </div>

    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#16191f] border border-gray-200 dark:border-white/[0.07] rounded-xl px-4 py-2 transition-all focus-within:border-emerald-500/50">
        <Icon d={icons.search} size={16} className="text-gray-400 dark:text-[#94a3b8]" />
        <input
          placeholder="Search..."
          className="bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#94a3b8] outline-none w-48"
        />
      </div>

      <button
        onClick={() => setDarkMode(!darkMode)}
        className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#16191f] border border-gray-200 dark:border-white/[0.07] flex items-center justify-center text-gray-500 dark:text-[#94a3b8] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all duration-200"
      >
        <Icon d={darkMode ? icons.sun : icons.moon} size={16} />
      </button>

      <div className="relative">
        <button className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#16191f] border border-gray-200 dark:border-white/[0.07] flex items-center justify-center text-gray-500 dark:text-[#94a3b8] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all duration-200">
          <Icon d={icons.bell} size={16} />
        </button>
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0c0e12]" />
      </div>

      <button className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#16191f] border border-gray-200 dark:border-white/[0.07] flex items-center justify-center text-gray-500 dark:text-[#94a3b8] hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all duration-200 text-lg">
        <FaCartPlus />
      </button>

      {hotel?.profileImage || hotel?.logo ? (
        <img
          src={hotel.profileImage || hotel.logo}
          alt={hotel.hotelName}
          className="h-10 w-10 rounded-xl object-cover border-2 border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer"
        />
      ) : (
        <img
          src={hotelProfile}
          alt="profile"
          className="h-10 w-10 rounded-xl object-cover border-2 border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer"
        />
      )}
    </div>
  </div>
  );
};

const LivestockDashboard = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const { hotel, token } = useHotelAuth();
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");

  const handleHotelBooking = async () => {
    if (!hotel?._id) {
      setBookingError("Please log in as a hotel to book an animal.");
      return;
    }

    if (!selectedAnimal?._id) {
      setBookingError("No animal selected.");
      return;
    }

    setBookingLoading(true);
    setBookingError("");
    setBookingMessage("");

    try {
      const hotelId = hotel._id;
      const price = Number(selectedAnimal.price || selectedAnimal.amount || 0);
      const checkInDate = new Date();
      const checkOutDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await fetch(`http://localhost:4000/api/hotels/${hotelId}/book-animal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          animalId: selectedAnimal._id,
          serviceType: "boarding",
          checkInDate: checkInDate.toISOString(),
          checkOutDate: checkOutDate.toISOString(),
          price,
          paymentMethod: "mobile_money",
          specialRequests: "Hotel booking request from hotel dashboard",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Hotel booking failed.");
      }

      setBookingMessage("Animal booked successfully. The hotel booking has been created.");
      setTimeout(() => {
        setSelectedAnimal(null);
      }, 1200);
    } catch (error) {
      setBookingError(error?.message || "Something went wrong while booking.");
    } finally {
      setBookingLoading(false);
    }
  };
  const [agreement, setAgreement] = useState<any>(null);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [agreementError, setAgreementError] = useState("");
  const [agreementSignature, setAgreementSignature] = useState("");
  const [agreementSigning, setAgreementSigning] = useState(false);
  const [showAgreementPanel, setShowAgreementPanel] = useState(false);

  const handleLoadAgreement = async (animalId?: string, hotelId?: string) => {
    const aid = animalId || selectedAnimal?._id;
    const hid = hotelId || hotel?._id;
    if (!aid || !hid) return;
    setAgreementLoading(true);
    setAgreementError("");
    try {
      // Use hotel-specific agreement lookup: animal + hotel party
      const response = await fetch(
        `http://localhost:4000/api/agreements/hotel-animal/${aid}/${hid}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Agreement service returned an unexpected response (${response.status}).`);
      }
      if (!response.ok) {
        throw new Error(data?.message || "No agreement found for this animal.");
      }
      setAgreement(data.data);
    } catch (error: any) {
      setAgreementError(error?.message || "No agreement found for this animal.");
      setAgreement(null);
    } finally {
      setAgreementLoading(false);
    }
  };

  const handleSignAgreement = async () => {
    if (!agreement?._id) return;
    if (!agreementSignature.trim()) {
      setAgreementError("Please type your full name to sign.");
      return;
    }
    setAgreementSigning(true);
    setAgreementError("");
    try {
      const response = await fetch(`http://localhost:4000/api/agreements/${agreement._id}/sign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signature: agreementSignature.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to sign agreement.");
      }
      setAgreement(data.data);
      setAgreementSignature("");
    } catch (error: any) {
      setAgreementError(error?.message || "Something went wrong while signing.");
    } finally {
      setAgreementSigning(false);
    }
  };

  // Auto-load agreement whenever a new animal is selected
  useEffect(() => {
    if (selectedAnimal?._id && hotel?._id) {
      setAgreement(null);
      setAgreementError("");
      setShowAgreementPanel(false);
      handleLoadAgreement(selectedAnimal._id, hotel._id);
    } else {
      setAgreement(null);
      setAgreementError("");
      setShowAgreementPanel(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnimal?._id]);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/animal/animals?owned=true');
        if (!response.ok) {
          throw new Error('Failed to fetch animals');
        }
        const data = await response.json();
        const normalized = Array.isArray(data) ? data : Array.isArray(data?.animals) ? data.animals : Array.isArray(data?.data) ? data.data : [];
        setAnimals(normalized);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAnimals();
  }, []);

  return (
    <div className="p-6 flex flex-col gap-6 overflow-y-auto bg-gray-50 dark:bg-[#0c0e12]">
      <div className="grid grid-cols-4 gap-5">
        <StatCard 
          label="animal" 
          value="0" 
          positive 
          icon={icons.creditCard} 
          color="green" 
        />
        <StatCard 
          label="booked" 
          value="0" 
          icon={icons.herd} 
          color="blue" 
        />
        <StatCard 
          label="paid" 
          value="0" 
          icon={icons.escrow} 
          color="purple" 
        />
        <StatCard 
          label="new Hotels" 
          value="0" 
          icon={icons.risk} 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl p-6 border bg-white dark:bg-[#16191f] border-gray-200 dark:border-white/[0.07] hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Ecosystem Distribution</h3>
            <div className="flex gap-2">
              <button className="text-xs text-gray-500 dark:text-[#94a3b8] hover:text-gray-700 dark:hover:text-white flex items-center gap-1 bg-gray-100 dark:bg-[#0c0e12] px-3 py-1.5 rounded-lg transition-all hover:bg-gray-200 dark:hover:bg-white/[0.1]">
                <Icon d={icons.download} size={12} /> Export
              </button>
              <button className="text-xs text-gray-500 dark:text-[#94a3b8] hover:text-gray-700 dark:hover:text-white flex items-center gap-1 bg-gray-100 dark:bg-[#0c0e12] px-3 py-1.5 rounded-lg transition-all hover:bg-gray-200 dark:hover:bg-white/[0.1]">
                <Icon d={icons.refresh} size={12} /> Refresh
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-[#94a3b8] mb-4">Real-time animal population heatmaps by district.</p>
          <div className="bg-gray-100 dark:bg-[#0c0e12] rounded-xl h-48 flex items-center justify-center text-gray-400 dark:text-[#94a3b8] text-sm transition-all hover:bg-gray-200 dark:hover:bg-[#1a1d24]">
            <div className="flex flex-col items-center gap-2">
              <Icon d={icons.heatmap} size={40} className="opacity-50" />
              <span>Heatmap visualization</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 border bg-white dark:bg-[#16191f] border-gray-200 dark:border-white/[0.07] hover:shadow-lg transition-all duration-300">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Verification Queue</h3>
          <div>
            <VerificationItem id="DP-90214-B" title="Jersey Cow" subtitle="High-Yield Herd" />
            <VerificationItem id="DP-88129-A" title="Boer Goat" subtitle="Export Standard" />
            <VerificationItem id="DP-77341-C" title="Angus Bull" subtitle="Genetics Grade" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-6 border bg-white dark:bg-[#16191f] border-gray-200 dark:border-white/[0.07] hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Animals List</h3>
          <span className="text-xs text-gray-500 dark:text-[#94a3b8]">
            {loading ? 'Loading...' : `${animals.length} animals`}
          </span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 dark:text-red-400 py-8">
            <p>Error loading animals: {error}</p>
          </div>
        ) : animals.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-[#94a3b8] py-8">
            <Icon d={icons.herd} size={40} className="mx-auto mb-2 opacity-50" />
            <p>No animals found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {animals.map((animal, index) => (
              <AnimalCard key={animal.id || animal._id || index} animal={animal} onSelect={(a) => setSelectedAnimal(a)} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl p-6 border bg-white dark:bg-[#16191f] border-gray-200 dark:border-white/[0.07] hover:shadow-lg transition-all duration-300">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Flagged High-Risk Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-[#94a3b8] border-b border-gray-200 dark:border-white/[0.06]">
                <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider">Transaction ID</th>
                <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider">Sender / Receiver</th>
                <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider">Asset Type</th>
                <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider">Value</th>
                <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider">Risk Score</th>
                <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              <RiskRow id="TX-1024" sender="FarmCo" receiver="AgriBuy" asset="Cattle" value="$124,500" score={78} />
              <RiskRow id="TX-1025" sender="GreenPastures" receiver="ExportHub" asset="Goats" value="$87,200" score={65} />
              <RiskRow id="TX-1026" sender="Sunrise Ranch" receiver="MeatDist" asset="Poultry" value="$210,000" score={91} />
              <RiskRow id="TX-1027" sender="DairyPlus" receiver="Processors" asset="Milk" value="$45,000" score={32} />
              {selectedAnimal && (
                <AnimalDetailModal
                  animal={selectedAnimal}
                  onClose={() => setSelectedAnimal(null)}
                  onBook={handleHotelBooking}
                  bookingLoading={bookingLoading}
                  bookingMessage={bookingMessage}
                  bookingError={bookingError}
                  agreement={agreement}
                  agreementLoading={agreementLoading}
                  agreementError={agreementError}
                  agreementSignature={agreementSignature}
                  setAgreementSignature={setAgreementSignature}
                  agreementSigning={agreementSigning}
                  onSignAgreement={handleSignAgreement}
                  showAgreementPanel={showAgreementPanel}
                  onToggleAgreementPanel={() => {
                    setShowAgreementPanel((v) => !v);
                    if (!agreement) handleLoadAgreement();
                  }}
                />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AnimalDetailModal = ({ animal, onClose, onBook, bookingLoading, bookingMessage, bookingError, agreement, agreementLoading, agreementError, agreementSignature, setAgreementSignature, agreementSigning, onSignAgreement, showAgreementPanel, onToggleAgreementPanel }: AnimalDetailModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-white dark:bg-[#16191f] border-gray-200 dark:border-white/[0.07] shadow-2xl">
        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-6 p-6">
          {/* Left Column - Animal Image & Details */}
          <div className="space-y-4">
            {/* Animal Image */}
            <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.03] h-64">
              {animal?.images && animal.images[0] ? (
                <img
                  src={animal.images[0]}
                  alt={animal.name || "animal"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Icon d={icons.herd} size={48} />
                </div>
              )}
            </div>

            {/* Animal Name & Price */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {animal?.name || "Jersey Cow"} #{animal?.id || "45"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#94a3b8]">cow · {animal?.breed || "Jersey"}</p>
              <div className="mt-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">FRW 450,000</span>
                <span className="text-sm text-gray-500 dark:text-[#94a3b8] ml-2">per head</span>
              </div>
            </div>

            {/* Overview Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Overview</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0c0e12] text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                  Vaccination
                </button>
                <button className="text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0c0e12] text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                  Ownership
                </button>
                <button className="text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0c0e12] text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                  Location
                </button>
                <button className="text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0c0e12] text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                  Contact
                </button>
                <button
                  onClick={onToggleAgreementPanel}
                  className="text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0c0e12] text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                  Agreement
                </button>
                <button className="text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0c0e12] text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                  Chat
                </button>
                 <button className="text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0c0e12] text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                  Booking
                </button>
              </div>
            </div>
          </div>

            {showAgreementPanel && (
              <div className="bg-gray-50 dark:bg-[#0c0e12] rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-[#94a3b8] uppercase tracking-wider flex items-center gap-2">
                  <Icon d={icons.sign} size={13} /> Hotel–Farmer Agreement
                </h4>

                {agreementLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#94a3b8]">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
                    Loading agreement…
                  </div>
                )}

                {agreementError && !agreementLoading && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                    {agreementError}
                  </div>
                )}

                {agreement && !agreementLoading && (() => {
                  const hotelSigned = !!agreement.signatures?.hotel;
                  const farmerSigned = !!agreement.signatures?.farmer;
                  const fullySigned = hotelSigned && farmerSigned;
                  const statusLabel = fullySigned
                    ? 'Fully Signed'
                    : hotelSigned
                    ? 'Pending Farmer Signature'
                    : 'Pending Hotel Signature';
                  const statusColor = fullySigned
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : hotelSigned
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20';
                  return (
                    <div className="space-y-3">
                      {/* Status badge */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor}`}>
                          {statusLabel}
                        </span>
                        {agreement.pdfUrl && (
                          <a
                            href={agreement.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Icon d={icons.read} size={12} /> View Agreement
                          </a>
                        )}
                      </div>

                      {/* Agreement details */}
                      <div className="text-xs space-y-1 text-gray-500 dark:text-[#94a3b8]">
                        <div className="flex justify-between">
                          <span>Animal:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{agreement.animal?.name || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {agreement.currency || 'RWF'} {Number(agreement.price || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Farmer:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{agreement.parties?.farmer?.name || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hotel signed:</span>
                          <span className={hotelSigned ? 'text-emerald-500' : 'text-gray-400'}>{hotelSigned ? '✓ Yes' : '— Not yet'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Farmer signed:</span>
                          <span className={farmerSigned ? 'text-emerald-500' : 'text-gray-400'}>{farmerSigned ? '✓ Yes' : '— Not yet'}</span>
                        </div>
                      </div>

                      {/* Sign action — only if hotel hasn't signed yet */}
                      {!hotelSigned && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs text-gray-500 dark:text-[#94a3b8]">Type your full name to sign electronically:</p>
                          <input
                            type="text"
                            value={agreementSignature}
                            onChange={(e) => setAgreementSignature(e.target.value)}
                            placeholder="Full name as e-signature"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#16191f] text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#94a3b8] outline-none focus:border-emerald-500/50 transition-colors"
                          />
                          {agreementError && (
                            <p className="text-xs text-red-500">{agreementError}</p>
                          )}
                          <button
                            onClick={onSignAgreement}
                            disabled={agreementSigning}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                          >
                            {agreementSigning ? (
                              <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full" /> Signing…</>
                            ) : (
                              <><Icon d={icons.sign} size={14} /> Sign Agreement</>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Fully signed: view link */}
                      {fullySigned && agreement.pdfUrl && (
                        <a
                          href={agreement.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full py-2 text-center bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg text-sm font-semibold transition-colors border border-sky-500/20"
                        >
                          View Signed Agreement
                        </a>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          {/* Right Column - Details */}
          <div className="space-y-4">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-[#0c0e12] rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-[#94a3b8]">Weight</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{animal?.weight || "320"} kg</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#0c0e12] rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-[#94a3b8]">Age</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{animal?.age || "3"} yrs</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#0c0e12] rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-[#94a3b8]">Breed</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{animal?.breed || "Jersey"}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#0c0e12] rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-[#94a3b8]">Gender</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Female</p>
              </div>
            </div>

            {/* Status & Health */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94a3b8]">Status</p>
                <Badge color="green">{animal?.status || "Available"}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94a3b8]">Health Score</p>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 capitalize">excellent</span>
              </div>
            </div>

            {/* Location & Contact Details */}
            <div className="bg-gray-50 dark:bg-[#0c0e12] rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-[#94a3b8] uppercase tracking-wider">Location & Contact</h4>
              
              <div className="flex items-center gap-3">
                <Icon d={icons.mapPin} size={16} className="text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Nairobi, Kenya</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Icon d={icons.phone} size={16} className="text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">+254 712 345 678</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Icon d={icons.mail} size={16} className="text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">john@greenvalley.com</span>
              </div>

              {/* Google Map */}
              <div className="mt-2 rounded-lg overflow-hidden h-32 bg-gray-200 dark:bg-[#0c0e12] border border-gray-200 dark:border-white/[0.06]">
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-[#94a3b8] text-sm">
                  <div className="text-center">
                    <Icon d={icons.mapPin} size={24} className="mx-auto mb-1 text-emerald-500" />
                    <p>Google Map Location</p>
                    <p className="text-xs">-1.2921° S, 36.8219° E</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-white/[0.07] space-y-3">
          {bookingError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {bookingError}
            </div>
          )}
          {bookingMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {bookingMessage}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onToggleAgreementPanel}
              className="flex-1 py-3 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Icon d={icons.sign} size={15} />
              {agreement
                ? (agreement.signatures?.hotel && agreement.signatures?.farmer
                    ? 'View Signed Agreement'
                    : agreement.signatures?.hotel
                    ? 'Pending Farmer Signature'
                    : 'Sign Agreement')
                : 'View Agreement'}
            </button>
            <button
              onClick={onBook}
              disabled={bookingLoading}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
            >
              {bookingLoading ? "Booking..." : "Book Animal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HotelAgreementPage = () => {
  const { hotel, token } = useHotelAuth();
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");
  const [signSuccess, setSignSuccess] = useState("");
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    if (!hotel?._id) return;
    setLoading(true);
    setError("");
    fetch(`http://localhost:4000/api/agreements/hotel/${hotel._id}/my-agreement`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const responseText = await r.text();
        let data: any;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(`Agreement service returned an unexpected response (${r.status}).`);
        }
        return { response: r, data };
      })
      .then(({ response, data }) => {
        if (!response.ok) {
          setError(data.message || "No agreement found.");
          return;
        }
        if (data.success) setAgreement(data.data);
        else setError(data.message || "No agreement found.");
      })
      .catch(() => setError("Failed to load agreement."))
      .finally(() => setLoading(false));
  }, [hotel?._id]);

  // Derive signature state
  const hotelSigned = !!agreement?.signatures?.hotel;
  const farmerSigned = !!agreement?.signatures?.farmer;
  const fullySigned = hotelSigned && farmerSigned;
  const agreementStatusLabel = fullySigned
    ? 'Fully Signed'
    : hotelSigned
    ? 'Pending Farmer Signature'
    : 'Pending Hotel Signature';
  const agreementStatusColor: Record<string, string> = {
    'Fully Signed': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    'Pending Farmer Signature': 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20',
    'Pending Hotel Signature': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  };

  const handleSign = async () => {
    if (!signature.trim()) {
      setSignError("Please type your full name to sign.");
      return;
    }
    setSigning(true);
    setSignError("");
    setSignSuccess("");
    try {
      const res = await fetch(`http://localhost:4000/api/agreements/${agreement._id}/sign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ signature: signature.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Signing failed.");
      setAgreement(data.data);
      setSignSuccess("Agreement signed successfully!");
      setSignature("");
    } catch (e: any) {
      setSignError(e.message || "Something went wrong.");
    } finally {
      setSigning(false);
    }
  };

  const statusColor: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    accepted: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    completed: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20",
    rejected: "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20",
    cancelled: "bg-gray-500/15 text-gray-500 dark:text-gray-400 border border-gray-500/20",
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto bg-gray-50 dark:bg-[#0c0e12] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Icon d={icons.sign} size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-['Sora']">Hotel–Farmer Agreement</h2>
          <p className="text-xs text-gray-500 dark:text-[#94a3b8]">Farm Purchase Agreement — review and e-sign below</p>
        </div>
        {agreement && (
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold border ${agreementStatusColor[agreementStatusLabel] || ''}`}>
            {agreementStatusLabel}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
        </div>
      )}

      {/* Error / No agreement */}
      {!loading && error && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Icon d={icons.analytics} size={28} />
          </div>
          <p className="text-amber-700 dark:text-amber-400 font-medium">{error}</p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-1">Contact admin or book an animal first to generate an agreement.</p>
        </div>
      )}

      {/* Agreement Document — Farm Purchase Agreement template (Hotel-Farmer) */}
      {!loading && agreement && (
        <div className="space-y-5">
          {/* Agreement document in Farm Purchase Agreement style */}
          <div id="hotel-agreement-print" className="bg-white text-gray-900 rounded-2xl border border-gray-200 shadow-sm" style={{ fontFamily: 'Georgia, serif' }}>
            {/* Header banner */}
            <div className="text-center py-6 px-8 border-b-2 border-gray-800">
              <h1 className="text-2xl font-black tracking-widest uppercase text-gray-900">Farm Purchase Agreement</h1>
              <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                <span>State: <span className="border-b border-gray-400 min-w-[80px] inline-block text-gray-800 px-1">Rwanda</span></span>
                <span>Rev: <span className="border-b border-gray-400 min-w-[40px] inline-block text-gray-800 px-1">1.0</span></span>
                <span>Date: <span className="border-b border-gray-400 min-w-[100px] inline-block text-gray-800 px-1">{agreement.createdAt ? new Date(agreement.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</span></span>
              </div>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* SELLER (FARMER) block */}
              <div>
                <div className="bg-gray-900 text-white text-center py-1.5 px-3 text-sm font-bold tracking-wide mb-3">SELLER (FARMER)</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-gray-500 min-w-[55px]">Name:</span>
                    <span className="border-b border-gray-300 flex-1 font-medium text-gray-900">{agreement.parties?.farmer?.name || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 min-w-[50px]">Phone:</span>
                    <span className="border-b border-gray-300 flex-1 text-gray-700">{agreement.parties?.farmer?.phone || '—'}</span>
                  </div>
                  <div className="flex gap-2 col-span-2">
                    <span className="text-gray-500 min-w-[55px]">Email:</span>
                    <span className="border-b border-gray-300 flex-1 text-gray-700">{agreement.parties?.farmer?.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-4 col-span-2 text-xs mt-1">
                    <span className="text-gray-500">Entity:</span>
                    {['Individual', 'Corporation', 'Partnership', 'LLC'].map(t => (
                      <label key={t} className="flex items-center gap-1 cursor-default">
                        <input type="checkbox" readOnly defaultChecked={t === 'Individual'} className="w-3 h-3 accent-gray-700" />
                        <span className="text-gray-600">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* BUYER (HOTEL) block */}
              <div>
                <div className="bg-gray-900 text-white text-center py-1.5 px-3 text-sm font-bold tracking-wide mb-3">BUYER (HOTEL)</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-gray-500 min-w-[55px]">Name:</span>
                    <span className="border-b border-gray-300 flex-1 font-medium text-gray-900">
                      {agreement.parties?.hotel?.hotelName || agreement.parties?.customer?.name || hotel?.hotelName || '—'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500 min-w-[50px]">Phone:</span>
                    <span className="border-b border-gray-300 flex-1 text-gray-700">
                      {agreement.parties?.hotel?.phone || agreement.parties?.customer?.phone || hotel?.phone || '—'}
                    </span>
                  </div>
                  <div className="flex gap-2 col-span-2">
                    <span className="text-gray-500 min-w-[55px]">Email:</span>
                    <span className="border-b border-gray-300 flex-1 text-gray-700">
                      {agreement.parties?.hotel?.email || agreement.parties?.customer?.email || hotel?.email || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 col-span-2 text-xs mt-1">
                    <span className="text-gray-500">Entity:</span>
                    {['Individual', 'Corporation', 'Partnership', 'LLC'].map(t => (
                      <label key={t} className="flex items-center gap-1 cursor-default">
                        <input type="checkbox" readOnly defaultChecked={t === 'Corporation'} className="w-3 h-3 accent-gray-700" />
                        <span className="text-gray-600">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agreement clauses */}
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-bold text-gray-900">1. Property Description</p>
                  <p className="text-gray-600 mt-1 leading-relaxed">
                    The Seller agrees to sell the following livestock to the Buyer:{' '}
                    <strong>{agreement.animal?.name || '—'}</strong>, a{' '}
                    {agreement.animal?.type || '—'} of breed{' '}
                    <strong>{agreement.animal?.breed || '—'}</strong>
                    {agreement.animal?.age ? `, aged approximately ${agreement.animal.age}` : ''}
                    {agreement.animal?.weight ? `, weighing ${agreement.animal.weight} kg` : ''}. The animal is identified with a unique record in the AniMarket Platform
                    {agreement.animal?.animalId ? ` (ID: ${String(agreement.animal.animalId).slice(-8)})` : ''}.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-gray-900">2. Purchase Price</p>
                  <p className="text-gray-600 mt-1">
                    The total purchase price for the above-described property shall be:{' '}
                    <strong className="text-emerald-700 text-base">{agreement.currency || 'RWF'} {Number(agreement.price || 0).toLocaleString()}</strong>{' '}
                    (Rwandan Francs). Payment shall be made in full at closing unless otherwise agreed.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-gray-900">3. Earnest Money Deposit</p>
                  <p className="text-gray-600 mt-1">
                    Buyer shall deposit an earnest money amount as mutually agreed through AniMarket escrow service. Said amount shall be applied toward the purchase price at closing.
                  </p>
                </div>

                <div>
                  <p className="font-bold text-gray-900">4. Closing</p>
                  <p className="text-gray-600 mt-1">
                    The closing of this sale shall occur on a date mutually agreed upon by both parties, facilitated by AniMarket Platform. Both parties shall execute all documents necessary to complete the transfer.
                  </p>
                </div>

                {agreement.terms && (
                  <div>
                    <p className="font-bold text-gray-900">5. Additional Terms</p>
                    <p className="text-gray-600 mt-1 leading-relaxed">{agreement.terms}</p>
                  </div>
                )}
              </div>

              {/* Transaction reference */}
              {agreement.transactionId && (
                <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                  Transaction Ref: {agreement.transactionId}
                </p>
              )}

              {/* Signature block */}
              <div className="pt-4 border-t-2 border-gray-300 grid grid-cols-2 gap-8">
                <div>
                  <div className="border-b border-gray-400 h-12 mb-1 flex items-end pb-1">
                    {agreement.signatures?.farmer && (
                      <span className="text-base italic text-gray-800 font-semibold" style={{ fontFamily: 'cursive, Georgia, serif' }}>
                        {agreement.signatures.farmer}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Seller Signature / Date</p>
                  <p className="text-xs font-medium mt-1 text-gray-700">{agreement.parties?.farmer?.name || '—'}</p>
                  {farmerSigned && <p className="text-[10px] text-emerald-600 mt-0.5">✓ Signed</p>}
                </div>
                <div>
                  <div className="border-b border-gray-400 h-12 mb-1 flex items-end pb-1">
                    {agreement.signatures?.hotel && (
                      <span className="text-base italic text-emerald-700 font-semibold" style={{ fontFamily: 'cursive, Georgia, serif' }}>
                        {agreement.signatures.hotel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Buyer Signature / Date</p>
                  <p className="text-xs font-medium mt-1 text-gray-700">
                    {agreement.parties?.hotel?.hotelName || agreement.parties?.customer?.name || hotel?.hotelName || '—'}
                  </p>
                  {hotelSigned && <p className="text-[10px] text-emerald-600 mt-0.5">✓ Signed</p>}
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-400 pt-2">
                Generated via AniMarket Platform · {new Date().getFullYear()} · This is a binding document upon signatures of both parties.
              </div>
            </div>
          </div>

          {/* E-Sign & Status Panel */}
          <div className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#16191f] p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Icon d={icons.sign} size={16} className="text-emerald-500" />
              E-Sign this Agreement
            </h3>

            {/* Signature status row */}
            <div className="flex gap-4 text-xs">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                farmerSigned ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-[#94a3b8]'
              }`}>
                <Icon d={icons.check} size={12} /> Farmer: {farmerSigned ? 'Signed' : 'Not yet'}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${
                hotelSigned ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'
              }`}>
                <Icon d={icons.sign} size={12} /> Hotel: {hotelSigned ? 'Signed' : 'Awaiting your signature'}
              </div>
            </div>

            {hotelSigned ? (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Icon d={icons.check} size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">You have signed this agreement</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">
                    {fullySigned ? 'Both parties have signed. Agreement is fully executed.' : 'Waiting for farmer to sign.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {signSuccess && (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                    <Icon d={icons.check} size={16} /> {signSuccess}
                  </div>
                )}
                {signError && (
                  <div className="rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                    {signError}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-[#94a3b8]">Type your full legal name below to apply your electronic signature:</p>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full legal name to sign"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-[#0c0e12] text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#94a3b8] outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                  onClick={handleSign}
                  disabled={signing}
                  className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {signing ? (
                    <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full" /> Signing…</>
                  ) : (
                    <><Icon d={icons.sign} size={16} /> E-Sign Agreement</>
                  )}
                </button>
              </div>
            )}

            {/* View signed PDF */}
            {fullySigned && agreement.pdfUrl && (
              <a
                href={agreement.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-sm font-semibold transition-colors"
              >
                <Icon d={icons.download} size={16} /> Download / View Signed Agreement
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PlaceholderPage = ({ title }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-16 bg-gray-50 dark:bg-[#0c0e12]">
    <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 animate-pulse">
      <Icon d={icons.inventory} size={32} />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-['Sora']">{title}</h2>
    <p className="text-gray-500 dark:text-[#94a3b8] text-sm max-w-xs">This section is under construction.</p>
  </div>
);

const ScheduleZoomPage = () => {
  const { hotel, token } = useHotelAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [form, setForm] = useState({
    animalId: "",
    title: "",
    date: "",
    time: "",
    duration: "60",
    timezone: "Africa/Kigali",
    participants: "",
    agenda: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [scheduledMeetings, setScheduledMeetings] = useState<any[]>([
    {
      id: "zm-001",
      title: "Animal Sourcing Discussion",
      date: "2026-09-15",
      time: "10:00",
      duration: 45,
      participants: "farmer@greenvalley.com",
      animalName: "Selected animal",
      status: "upcoming",
    },
    {
      id: "zm-002",
      title: "Livestock Health Briefing",
      date: "2026-09-18",
      time: "14:30",
      duration: 30,
      participants: "vet@animarkt.rw",
      animalName: "Selected animal",
      status: "upcoming",
    },
  ]);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/animal/animals?owned=true");
        if (!response.ok) throw new Error("Failed to load animals");
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.animals)
          ? data.animals
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setAnimals(normalized);
      } catch (e: any) {
        setError(e.message || "Unable to load animals.");
      } finally {
        setAnimalsLoading(false);
      }
    };

    fetchAnimals();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSchedule = async () => {
    if (!form.animalId || !form.title.trim() || !form.date || !form.time) {
      setError("Please select an animal and fill in the meeting title, date, and time.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        animalId: form.animalId,
        title: form.title.trim(),
        description: form.agenda.trim() || undefined,
        meetingDate: new Date(`${form.date}T${form.time}`).toISOString(),
        durationMinutes: parseInt(form.duration) || 60,
        timezone: form.timezone,
        provider: "zoom",
        meetingType: "general",
      };

      const res = await fetch("http://localhost:4000/api/meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data?.errors) ? data.errors.join(", ") : data?.message || "Failed to schedule meeting.";
        throw new Error(msg);
      }

      setScheduledMeetings((prev) => [
        {
          id: data?.data?._id || data?.data?.id || `zm-${Date.now()}`,
          title: form.title,
          date: form.date,
          time: form.time,
          duration: parseInt(form.duration) || 60,
          participants: form.participants,
          animalName: animals.find((animal) => String(animal._id || animal.id) === form.animalId)?.name || "Selected animal",
          status: "upcoming",
          joinUrl: data?.data?.meetingLink || data?.data?.joinUrl,
        },
        ...prev,
      ]);
      setSuccess("Zoom meeting scheduled successfully!");
      setForm({ animalId: "", title: "", date: "", time: "", duration: "60", timezone: "Africa/Kigali", participants: "", agenda: "", password: "" });
    } catch (e: any) {
      setError(e.message || "Something went wrong while scheduling the meeting.");
    } finally {
      setLoading(false);
    }
  };

  const timezones = [
    "Africa/Kigali",
    "Africa/Nairobi",
    "Africa/Lagos",
    "Africa/Johannesburg",
    "Europe/London",
    "America/New_York",
    "Asia/Dubai",
  ];

  const durations = [
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "45", label: "45 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
    { value: "120", label: "2 hours" },
  ];

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0c0e12] text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#94a3b8] outline-none focus:border-emerald-500/50 transition-colors";

  const labelClass = "block text-xs font-medium text-gray-500 dark:text-[#94a3b8] mb-1.5 uppercase tracking-wider";

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto bg-gray-50 dark:bg-[#0c0e12] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
          <Icon d={icons.video} size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-['Sora']">Schedule Zoom Call</h2>
          <p className="text-xs text-gray-500 dark:text-[#94a3b8]">Set up a Zoom meeting with farmers, agents, or vets</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Form Panel */}
        <div className="col-span-3 rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#16191f] p-6 space-y-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <Icon d={icons.calendar} size={15} className="text-emerald-500" />
            Meeting Details
          </h3>

          <div className="rounded-xl border border-sky-200 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/10 p-4">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <Icon d={icons.herd} size={14} /> Animal for this meeting
            </div>
            <p className="mt-1 text-xs text-sky-700/70 dark:text-sky-300/70">Each Zoom meeting must be linked to one animal.</p>
            <select
              value={form.animalId}
              onChange={(e) => handleChange("animalId", e.target.value)}
              className={inputClass + " mt-3 border-sky-200 dark:border-sky-500/30"}
              disabled={animalsLoading}
              required
            >
              <option value="">{animalsLoading ? "Loading animals..." : "Select an animal"}</option>
              {animals.map((animal) => {
                const animalId = String(animal._id || animal.id || "");
                return (
                  <option key={animalId} value={animalId}>
                    {animal.name || "Unnamed animal"} {animal.breed ? `· ${animal.breed}` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className={labelClass}>Meeting Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. Animal Purchase Discussion"
              className={inputClass}
            />
          </div>

          {/* Date & Time row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Time *</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => handleChange("time", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Duration & Timezone row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Duration</label>
              <select
                value={form.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                className={inputClass}
              >
                {durations.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className={inputClass}
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className={labelClass}>Participants (emails, comma-separated)</label>
            <input
              type="text"
              value={form.participants}
              onChange={(e) => handleChange("participants", e.target.value)}
              placeholder="farmer@example.com, agent@example.com"
              className={inputClass}
            />
          </div>

          {/* Agenda */}
          <div>
            <label className={labelClass}>Agenda / Description</label>
            <textarea
              value={form.agenda}
              onChange={(e) => handleChange("agenda", e.target.value)}
              placeholder="Outline the meeting agenda..."
              rows={3}
              className={inputClass + " resize-none"}
            />
          </div>

          {/* Password */}
          <div>
            <label className={labelClass}>Meeting Password (optional)</label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Leave blank for no password"
              className={inputClass}
            />
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <Icon d={icons.check} size={15} />
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSchedule}
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35"
          >
            {loading ? (
              <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full" /> Scheduling…</>
            ) : (
              <><Icon d={icons.video} size={16} /> Schedule Zoom Meeting</>
            )}
          </button>
        </div>

        {/* Side panel - upcoming meetings */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* Quick tips card */}
          <div className="rounded-2xl border border-sky-200 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/10 p-5">
            <h4 className="text-sm font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-2 mb-3">
              <Icon d={icons.bell} size={14} /> Tips
            </h4>
            <ul className="text-xs text-sky-700 dark:text-sky-300/80 space-y-2">
              <li className="flex items-start gap-2"><span className="mt-0.5 text-sky-500">•</span> Invite participants by email so they receive the join link automatically.</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-sky-500">•</span> Set a password to protect sensitive discussions.</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-sky-500">•</span> Confirm the farmer's timezone before scheduling.</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 text-sky-500">•</span> Add a clear agenda so all parties come prepared.</li>
            </ul>
          </div>

          {/* Upcoming meetings */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#16191f] p-5 flex flex-col gap-3 flex-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Icon d={icons.calendarCheck} size={14} className="text-emerald-500" />
              Upcoming Meetings
              <span className="ml-auto text-xs text-gray-400 dark:text-[#94a3b8]">{scheduledMeetings.length}</span>
            </h4>

            {scheduledMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-[#94a3b8] text-sm gap-2">
                <Icon d={icons.video} size={28} className="opacity-40" />
                <span>No meetings scheduled yet</span>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-[#0c0e12] p-3 hover:border-emerald-500/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{m.title}</p>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        {m.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-[#94a3b8]">
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <Icon d={icons.herd} size={11} /> {m.animalName || "Animal"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon d={icons.calendar} size={11} /> {m.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon d={icons.clock} size={11} /> {m.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon d={icons.clock} size={11} /> {m.duration} min
                      </span>
                    </div>
                    {m.participants && (
                      <p className="mt-1.5 text-[11px] text-gray-400 dark:text-[#94a3b8] truncate">
                        {m.participants}
                      </p>
                    )}
                    {m.joinUrl && (
                      <a
                        href={m.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        <Icon d={icons.video} size={11} /> Join Meeting
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const pageMeta = {
  dashboard: { title: "LivestockPro Marketplace" },
  "pay-animal": { title: "Pay Animal" },
  "pay-commission": { title: "Pay Commission" },
  "schedule-zoom": { title: "Schedule Zoom" },
  "cancel-zoom": { title: "Cancel Zoom" },
  "add-zoom": { title: "Add Zoom" },
  "updated-zoom": { title: "Updated Zoom" },
  "sign-agreement": { title: "Sign Agreement" },
  "create-agreement": { title: "Create Agreement" },
  "read-agreement": { title: "Read Agreement" },
  "update-agreement": { title: "Update Agreement" },
  "delete-agreement": { title: "Delete Agreement" },
  health: { title: "Health Records" },
  delivery: { title: "Request Delivery" },
  booking: { title: "Booking" },
};

const HotelDashboard = () => {
  const [active, setActive] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(true);

  const renderPage = () => {
    if (active === "dashboard") return <LivestockDashboard />;
    if (active === "sign-agreement" || active === "read-agreement") return <HotelAgreementPage />;
    if (active === "schedule-zoom") return <ScheduleZoomPage />;
    return <PlaceholderPage title={pageMeta[active]?.title || active} />;
  };

  return (
    <div className={`flex min-h-screen font-['Inter'] transition-colors duration-300 ${darkMode ? 'dark' : ''} bg-gray-50 dark:bg-[#0c0e12]`}>
      <Sidebar active={active} setActive={setActive} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default HotelDashboard;
