// frontend/src/pages/PharmacistDashboard.jsx — MediMap dispensary hub
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StockOCR from '../components/StockOCR';
import { useTheme } from '../context/ThemeContext';
import { LogoIcon } from '../components/Logo';
import { api, clearSession, getToken, isDemoSession, API_BASE } from '../lib/api';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/badge';
import { Button, IconButton } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { EmptyState } from '../components/ui/empty-state';
import { Field, Input, Select, Textarea } from '../components/ui/input';
import { Lamp } from '../components/ui/lamp';
import { Modal } from '../components/ui/modal';
import { NumberTicker } from '../components/ui/number-ticker';
import { Progress } from '../components/ui/progress';
import { ShimmerButton } from '../components/ui/shimmer-button';
import { Skeleton, SkeletonText } from '../components/ui/skeleton';

// ── Clean Vector Micro-Icons (Zero Emojis) ─────────────────────────
const Icons = {
  Overview: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Stock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Billing: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  ),
  Analytics: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Suppliers: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  ),
  Customers: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Lists: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  Inbox: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Send: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Printer: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

// ── Realistic Pre-Seeded Datasets for Dwarka Dispensaries ──────────
const INITIAL_STOCK = [
  { _id: 'st_1', medicineName: 'Paracetamol 500mg', genericName: 'Acetaminophen', manufacturer: 'Cipla Ltd', batchNo: 'PAC-2026-08', expiryDate: '2027-08', purchasePrice: 12.00, sellingPrice: 18.00, units: 145, minStock: 20, category: 'Analgesics' },
  { _id: 'st_2', medicineName: 'Metformin 500mg SR', genericName: 'Metformin Hydrochloride', manufacturer: 'USV Pvt Ltd', batchNo: 'MET-2026-11', expiryDate: '2027-10', purchasePrice: 22.00, sellingPrice: 28.50, units: 84, minStock: 15, category: 'Anti-Diabetic' },
  { _id: 'st_3', medicineName: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate', manufacturer: 'Alkem Laboratories', batchNo: 'AMX-2026-04', expiryDate: '2026-12', purchasePrice: 52.00, sellingPrice: 68.00, units: 32, minStock: 10, category: 'Antibiotics' },
  { _id: 'st_4', medicineName: 'Cetirizine 10mg', genericName: 'Cetirizine Dihydrochloride', manufacturer: 'Dr. Reddy\'s', batchNo: 'CET-2026-09', expiryDate: '2027-06', purchasePrice: 14.00, sellingPrice: 22.00, units: 95, minStock: 20, category: 'Antihistamine' },
  { _id: 'st_5', medicineName: 'Azithromycin 500mg', genericName: 'Azithromycin', manufacturer: 'Zydus Cadila', batchNo: 'AZI-2026-02', expiryDate: '2026-11', purchasePrice: 85.00, sellingPrice: 110.00, units: 8, minStock: 10, category: 'Antibiotics' },
  { _id: 'st_6', medicineName: 'Pantoprazole 40mg', genericName: 'Pantoprazole Sodium', manufacturer: 'Sun Pharma', batchNo: 'PAN-2026-12', expiryDate: '2027-09', purchasePrice: 65.00, sellingPrice: 85.00, units: 42, minStock: 15, category: 'Antacid' },
  { _id: 'st_7', medicineName: 'Telmisartan 40mg', genericName: 'Telmisartan', manufacturer: 'Glenmark', batchNo: 'TEL-2026-05', expiryDate: '2027-04', purchasePrice: 48.00, sellingPrice: 65.00, units: 60, minStock: 15, category: 'Cardiovascular' },
  { _id: 'st_8', medicineName: 'ORS Sachet (Electral)', genericName: 'Oral Rehydration Salts', manufacturer: 'FDC Ltd', batchNo: 'ORS-2026-10', expiryDate: '2028-01', purchasePrice: 16.50, sellingPrice: 22.00, units: 180, minStock: 30, category: 'Rehydration' },
];

const INITIAL_BILLS = [
  { _id: 'b_101', billNumber: 'INV-2026-088', customerName: 'Kunal Verma', customerPhone: '9811223344', grandTotal: 186.00, paymentMode: 'UPI', createdAt: new Date(Date.now() - 3600000 * 1).toISOString(), items: [{ medicineName: 'Paracetamol 500mg', qty: 2, price: 18.00 }, { medicineName: 'Pantoprazole 40mg', qty: 1, price: 85.00 }] },
  { _id: 'b_102', billNumber: 'INV-2026-087', customerName: 'Priya Sharma', customerPhone: '9876543210', grandTotal: 245.50, paymentMode: 'Cash', createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), items: [{ medicineName: 'Metformin 500mg SR', qty: 3, price: 28.50 }] },
  { _id: 'b_103', billNumber: 'INV-2026-086', customerName: 'Rohan Mehra', customerPhone: '9812345678', grandTotal: 410.00, paymentMode: 'Card', createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), items: [{ medicineName: 'Azithromycin 500mg', qty: 1, price: 110.00 }, { medicineName: 'ORS Sachet', qty: 2, price: 22.00 }] },
  { _id: 'b_104', billNumber: 'INV-2026-085', customerName: 'Deepak Ahuja', customerPhone: '9988776655', grandTotal: 130.00, paymentMode: 'UPI', createdAt: new Date(Date.now() - 3600000 * 18).toISOString(), items: [{ medicineName: 'Telmisartan 40mg', qty: 2, price: 65.00 }] },
];

const INITIAL_SUPPLIERS = [
  { _id: 'sup_1', name: 'Delhi Pharma Wholesale', contactPerson: 'Rajesh Gupta', phone: '011-23861234', email: 'orders@delhipharma.in', address: 'Bhagirath Palace, Chandni Chowk, Delhi', leadTime: '24 hours' },
  { _id: 'sup_2', name: 'Dwarka Medicos Agency', contactPerson: 'Sunil Kumar', phone: '9811002233', email: 'sales@dwarkamedicos.com', address: 'Plot 18, Sector 12 Dwarka, New Delhi', leadTime: 'Same day (4 hrs)' },
  { _id: 'sup_3', name: 'MedEx Healthcare Logistics', contactPerson: 'Anita Rao', phone: '011-45671122', email: 'dispatch@medexdelhi.com', address: 'Mayapuri Phase 2, New Delhi', leadTime: '48 hours' },
];

const INITIAL_CUSTOMERS = [
  { _id: 'c_1', name: 'Kunal Verma', phone: '9811223344', email: 'kunal.v@nsut.ac.in', address: 'NSUT Campus, Hostel 4', medicines: [{ name: 'Metformin 500mg SR', refillDay: 25 }] },
  { _id: 'c_2', name: 'Priya Sharma', phone: '9876543210', email: 'priya.s@gmail.com', address: 'Pocket 1, Sector 3 Dwarka', medicines: [{ name: 'Telmisartan 40mg', refillDay: 28 }] },
  { _id: 'c_3', name: 'Anil Kapoor', phone: '9811445566', email: 'anil.k@gmail.com', address: 'Sector 14 Dwarka near Metro', medicines: [{ name: 'Pantoprazole 40mg', refillDay: 26 }] },
];

// ── Reminder log formatting ────────────────────────────────────────
const REMINDER_STATUS = {
  sent: { label: 'Sent', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  logged: { label: 'Logged', tone: 'warning' },
};

const REMINDER_CHANNEL = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  log: 'No channel',
};

function formatReminderTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

// Friendly label for when the daily job will next reach a patient.
// Returns null for an invalid or missing date so the badge simply doesn't render.
function nextAutoReminderLabel(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((startDate - startOfToday) / 86400000);

  if (days <= 0) return { text: 'Today', tone: 'accent' };
  if (days === 1) return { text: 'Tomorrow', tone: 'accent' };
  if (days <= 7) return { text: `In ${days} days`, tone: 'neutral' };
  return {
    text: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    tone: 'neutral',
  };
}

// Badge when a patient's monthly refill day is close, so the pharmacist can
// see who will need stock before the daily job runs. Returns null otherwise.
function refillDueLabel(refillDay) {
  const day = Number(refillDay);
  if (!day || day < 1 || day > 31) return null;

  let days = day - new Date().getDate();
  if (days < 0) days += 31; // next month's cycle

  if (days === 0) {
    return { text: 'Refill due today', tone: 'danger' };
  }
  if (days <= 5) {
    return { text: `Refill due in ${days}d`, tone: 'warning' };
  }
  return null;
}

// ── Root Pharmacist Dashboard Component ─────────────────────────────
export default function PharmacistDashboard() {
  const { dark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pharmacist, setPharmacist] = useState(null);
  const [toast, setToast] = useState(null);
  const [hydrating, setHydrating] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [syncNote, setSyncNote] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Core Data States
  const [stock, setStock] = useState(INITIAL_STOCK);
  const [bills, setBills] = useState(INITIAL_BILLS);
  const [suppliers, setSuppliers] = useState(INITIAL_SUPPLIERS);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [expandedRefillCustomer, setExpandedRefillCustomer] = useState(null);
  const [storeOpen, setStoreOpen] = useState(true);

  // Modals & Forms
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('All');

  // POS Billing State
  const [cart, setCart] = useState([]);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [paymentMode, setPaymentMode] = useState('UPI');

  // Stock Form State
  const [newStock, setNewStock] = useState({
    medicineName: '',
    genericName: '',
    manufacturer: '',
    batchNo: '',
    expiryDate: '',
    purchasePrice: '',
    sellingPrice: '',
    units: '',
    category: 'General',
  });
  const [editingStock, setEditingStock] = useState(null);

  // Purchase order state
  const [orderFor, setOrderFor] = useState(null);
  const [orderForm, setOrderForm] = useState({ medicineName: '', quantity: 10, expectedDate: '', notes: '' });
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '' });

  // Sales analytics (premium)
  const [analytics, setAnalytics] = useState(null);
  const [analyticsState, setAnalyticsState] = useState('idle'); // idle | loading | ready | locked

  // Regular patients: add / edit form
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [patientForm, setPatientForm] = useState({ name: '', phone: '', email: '', address: '', medicineName: '', dosage: '', quantity: 1, typicalDate: '', notes: '' });

  // Purchase lists (requirements)
  const [requirements, setRequirements] = useState([]);
  const [requirementsState, setRequirementsState] = useState('idle');
  const [showListModal, setShowListModal] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [listItems, setListItems] = useState([]);
  const [listItemDraft, setListItemDraft] = useState({ medicineName: '', quantity: 1, unit: 'strips', priority: 'medium', notes: '' });
  const [sendListFor, setSendListFor] = useState(null);
  const [sendListSupplierId, setSendListSupplierId] = useState('');

  // Incoming patient price requests
  const [requests, setRequests] = useState([]);
  const [requestsState, setRequestsState] = useState('idle');
  const [requestChoice, setRequestChoice] = useState({}); // requestId -> stockId chosen on approve

  // Which live feeds the server refused on this plan. Used to swap the fake
  // seed tables for an honest upgrade panel instead of pretending.
  const [suppliersLocked, setSuppliersLocked] = useState(false);
  const [customersLocked, setCustomersLocked] = useState(false);

  // Premium upgrade
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState('monthly');
  const [upgradeStep, setUpgradeStep] = useState('idle'); // idle | creating | waiting | verifying

  // Key of the write currently in flight, so a button can't fire twice
  const [busyKey, setBusyKey] = useState('');

  // Writes only reach the API with a live pharmacist session; demo mode keeps
  // changes on this device and says so.
  const canPersist = !demoMode && Boolean(getToken('pharmacist'));

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleWriteError(error, fallback) {
    if (error?.status === 401) {
      clearSession('pharmacist');
      window.location.href = '/login';
      return;
    }
    showToast(error?.message || fallback, 'error');
  }

  // Premium features are gated on the server too; this only controls what the
  // pharmacist sees. Free accounts get an upgrade prompt instead of fake data.
  const isPremium = Boolean(pharmacist?.isPremium);

  function openUpgrade() {
    setUpgradeStep('idle');
    setShowUpgradeModal(true);
  }

  // Premium panels cache the 403 they got on a free plan; clearing the cached
  // state and re-hydrating is what actually unlocks them without a reload.
  function applyPremiumActivation(nextPharmacist) {
    setPharmacist(nextPharmacist);
    try { localStorage.setItem('pharmacist_info', JSON.stringify(nextPharmacist)); } catch {}
    setAnalyticsState('idle');
    setRequirementsState('idle');
    setRequestsState('idle');
    setSuppliersLocked(false);
    setCustomersLocked(false);
    setShowUpgradeModal(false);
    setReloadKey((key) => key + 1);
  }

  async function handleUpgrade() {
    if (upgradeStep === 'creating' || upgradeStep === 'verifying') return;
    if (!canPersist) return showToast('Upgrades need a live dispensary connection.', 'error');

    const token = getToken('pharmacist');
    setUpgradeStep('creating');
    try {
      const order = await api('/pharmacist/premium/create-order', { method: 'POST', token, body: { plan: upgradePlan } });

      // Without Razorpay keys the backend hands back a demo order; activating
      // it locally is the honest thing rather than pretending to pay.
      if (order?.demo) {
        setUpgradeStep('verifying');
        await api('/pharmacist/premium/verify', { method: 'POST', token, body: { plan: upgradePlan } });
        const me = await api('/pharmacist/me', { token });
        applyPremiumActivation(me);
        showToast('Premium activated in demo mode — set Razorpay keys to take real payments.');
        return;
      }

      setUpgradeStep('waiting');
      // Real order: hand it to Razorpay Checkout when the SDK is present.
      if (window.Razorpay && order?.orderId) {
        const rz = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'MediMap Premium',
          description: upgradePlan === 'annual' ? 'Annual dispensary plan' : 'Monthly dispensary plan',
          order_id: order.orderId,
          prefill: { email: pharmacist?.email || '', contact: pharmacist?.phone || '' },
          theme: { color: '#1B6EF3' },
          handler: async () => {
            setUpgradeStep('verifying');
            try {
              await api('/pharmacist/premium/verify', { method: 'POST', token, body: { plan: upgradePlan } });
              const me = await api('/pharmacist/me', { token });
              applyPremiumActivation(me);
              showToast('Premium activated. Analytics and purchase lists are unlocked.');
            } catch (error) { handleWriteError(error, 'Payment verified but activation failed.'); }
            finally { setUpgradeStep('idle'); }
          },
          modal: { ondismiss: () => setUpgradeStep('idle') },
        });
        rz.open();
        return;
      }

      // Razorpay checkout not loaded — say so instead of hanging on a spinner.
      setUpgradeStep('idle');
      showToast('Razorpay checkout could not be loaded. Try again shortly.', 'error');
    } catch (error) {
      setUpgradeStep('idle');
      handleWriteError(error, 'Could not start the upgrade.');
    }
  }

  // Load the signed-in dispensary and its real records. When the API is
  // unreachable the seeded tables stay on screen, labelled as demo data.
  useEffect(() => {
    let cancelled = false;

    const demoProfile = {
      name: 'Apollo Pharmacy — Sector 14 Dwarka',
      address: 'Near Metro Station, Sector 14, Dwarka',
      phone: '011-25081144',
      email: 'apollo.dwk14@apollo.com',
      gstin: '07AAAAA0000A1Z5',
      licenseNo: 'DL-DWK-2026-A1',
      isPremium: true,
    };

    async function hydrate() {
      const token = getToken('pharmacist');
      const stored = localStorage.getItem('pharmacist_info');
      let profile = null;
      if (stored) {
        try { profile = JSON.parse(stored); } catch { profile = null; }
      }

      if (!token) {
        if (cancelled) return;
        setPharmacist(profile || demoProfile);
        setDemoMode(true);
        setSyncNote(isDemoSession() ? 'Demo session — signed in without the API.' : 'Not signed in — showing demo data.');
        setHydrating(false);
        return;
      }

      setHydrating(true);
      const [me, stockRes, billsRes, suppliersRes, customersRes] = await Promise.allSettled([
        api('/pharmacist/me', { token }),
        api('/pharmacist/stock', { token }),
        api('/pharmacist/bills', { token }),
        api('/pharmacist/suppliers', { token }),
        api('/pharmacist/customers', { token }),
      ]);
      if (cancelled) return;

      const failures = [me, stockRes, billsRes, suppliersRes, customersRes].filter((r) => r.status === 'rejected');
      const unauthorized = failures.find((r) => r.reason?.status === 401);
      if (unauthorized) {
        clearSession('pharmacist');
        window.location.href = '/login';
        return;
      }

      const offline = failures.some((r) => r.reason?.status === 0);
      const forbidden = failures.filter((r) => r.reason?.status === 403).length;

      if (me.status === 'fulfilled') {
        setPharmacist(me.value);
        try { localStorage.setItem('pharmacist_info', JSON.stringify(me.value)); } catch {}
      } else {
        setPharmacist(profile || demoProfile);
      }

      if (stockRes.status === 'fulfilled' && Array.isArray(stockRes.value?.stock)) {
        setStock(stockRes.value.stock);
      } else if (!offline) {
        // Connected but the feed failed: never show seeded rows as if they were real.
        setStock([]);
      }

      if (billsRes.status === 'fulfilled' && Array.isArray(billsRes.value?.bills)) {
        setBills(
          billsRes.value.bills.map((bill) => ({
            ...bill,
            items: (bill.items || []).map((item) => ({
              ...item,
              qty: item.qty ?? item.quantity ?? 1,
              price: item.price ?? item.unitPrice ?? 0,
            })),
            grandTotal: Number(bill.grandTotal) || 0,
          })),
        );
      } else if (!offline) {
        setBills([]);
      }

      if (suppliersRes.status === 'fulfilled') {
        const list = Array.isArray(suppliersRes.value) ? suppliersRes.value : suppliersRes.value?.suppliers || [];
        setSuppliers(
          list.map((supplier) => ({
            ...supplier,
            contactPerson: supplier.contactPerson || supplier.name,
            leadTime:
              supplier.leadTime ||
              (supplier.creditDays ? `${supplier.creditDays}-day credit` : 'Verified distributor'),
          })),
        );
      } else if (!offline) {
        setSuppliers([]);
        setSuppliersLocked(suppliersRes.reason?.status === 403);
      }

      if (customersRes.status === 'fulfilled') {
        const list = Array.isArray(customersRes.value) ? customersRes.value : customersRes.value?.customers || [];
        setCustomers(
          list.map((customer) => ({
            ...customer,
            medicines: (customer.medicines || []).map((medicine) => ({
              ...medicine,
              name: medicine.name || medicine.medicineName,
              refillDay: medicine.refillDay ?? medicine.typicalDate,
            })),
          })),
        );
      } else if (!offline) {
        setCustomers([]);
        setCustomersLocked(customersRes.reason?.status === 403);
      }

      setDemoMode(offline);
      setSyncNote(
        offline
          ? 'API unreachable — showing demo data. Changes stay on this device.'
          : forbidden
            ? 'Signed in. Distributors and refill data need a premium dispensary.'
            : '',
      );
      setHydrating(false);
    }

    hydrate();
    return () => { cancelled = true; };
  }, [reloadKey]);

  // Premium data is loaded on demand — a free account never fetches it, it
  // gets the upgrade prompt instead.
  async function loadAnalytics() {
    if (!canPersist) return setAnalyticsState('demo');
    setAnalyticsState('loading');
    try {
      const data = await api('/pharmacist/analytics', { token: getToken('pharmacist') });
      setAnalytics(data);
      setAnalyticsState('ready');
    } catch (error) {
      if (error?.status === 403) setAnalyticsState('locked');
      else if (error?.status === 401) { clearSession('pharmacist'); window.location.href = '/login'; }
      else { setAnalyticsState('offline'); showToast('Analytics need a live dispensary connection.', 'error'); }
    }
  }

  async function loadRequirements() {
    if (!canPersist) return setRequirementsState('demo');
    setRequirementsState('loading');
    try {
      const list = await api('/pharmacist/requirements', { token: getToken('pharmacist') });
      setRequirements(Array.isArray(list) ? list : list?.requirements || []);
      setRequirementsState('ready');
    } catch (error) {
      if (error?.status === 403) setRequirementsState('locked');
      else if (error?.status === 401) { clearSession('pharmacist'); window.location.href = '/login'; }
      else { setRequirementsState('offline'); showToast('Purchase lists need a live dispensary connection.', 'error'); }
    }
  }

  async function loadRequests() {
    if (!canPersist) return setRequestsState('demo');
    setRequestsState('loading');
    try {
      const data = await api(`/requests/notifications/${pharmacist?._id}`, { token: getToken('pharmacist') });
      setRequests(Array.isArray(data?.notifications) ? data.notifications : []);
      setRequestsState('ready');
    } catch {
      setRequestsState('offline');
    }
  }

  // Fetch premium panels only once their tab is opened.
  useEffect(() => {
    if (hydrating) return;
    if (activeTab === 'analytics' && analyticsState === 'idle') loadAnalytics();
    if (activeTab === 'lists' && requirementsState === 'idle') loadRequirements();
    if (activeTab === 'requests' && requestsState === 'idle') loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hydrating, analyticsState, requirementsState, requestsState]);

  function handleLogout() {
    clearSession('pharmacist');
    window.location.href = '/';
  }

  // Stock Operations
  const EMPTY_STOCK_FORM = {
    medicineName: '',
    genericName: '',
    manufacturer: '',
    batchNo: '',
    expiryDate: '',
    purchasePrice: '',
    sellingPrice: '',
    units: '',
    category: 'General',
  };

  function openStockModal(item = null) {
    setEditingStock(item);
    setNewStock(
      item
        ? {
            medicineName: item.medicineName || '',
            genericName: item.genericName || '',
            manufacturer: item.manufacturer || '',
            batchNo: item.batchNo || '',
            expiryDate: item.expiryDate || '',
            purchasePrice: item.purchasePrice ?? '',
            sellingPrice: item.sellingPrice ?? '',
            units: item.units ?? '',
            category: item.category || 'General',
          }
        : EMPTY_STOCK_FORM,
    );
    setShowAddStockModal(true);
  }

  function closeStockModal() {
    setShowAddStockModal(false);
    setEditingStock(null);
  }

  async function handleAddMedicine(e) {
    e.preventDefault();
    if (busyKey === 'stock:save') return;
    if (!newStock.medicineName || !newStock.sellingPrice || newStock.units === '') {
      return showToast('Please complete required fields', 'error');
    }

    const payload = {
      medicineName: newStock.medicineName.trim(),
      genericName: newStock.genericName.trim() || newStock.medicineName.trim(),
      manufacturer: newStock.manufacturer.trim() || 'Verified Lab',
      batchNo: newStock.batchNo.trim() || `BAT-${Date.now().toString().slice(-4)}`,
      expiryDate: newStock.expiryDate || '2027-12',
      purchasePrice: Number(newStock.purchasePrice) || Number(newStock.sellingPrice) * 0.7,
      sellingPrice: Number(newStock.sellingPrice),
      units: Number(newStock.units),
      minStock: editingStock?.minStock || 15,
      category: newStock.category || 'General',
    };

    // Demo mode — keep the row on this device and label the save honestly.
    if (!canPersist) {
      if (editingStock) {
        setStock(prev => prev.map(s => (s._id === editingStock._id ? { ...s, ...payload } : s)));
        showToast('Demo mode — changes saved on this device only.');
      } else {
        setStock(prev => [{ _id: `st_${Date.now()}`, ...payload }, ...prev]);
        showToast('Demo mode — item added on this device only.');
      }
      closeStockModal();
      setNewStock(EMPTY_STOCK_FORM);
      return;
    }

    setBusyKey('stock:save');
    try {
      if (editingStock) {
        const saved = await api(`/pharmacist/stock/${editingStock._id}`, {
          method: 'PATCH',
          token: getToken('pharmacist'),
          body: payload,
        });
        setStock(prev => prev.map(s => (s._id === editingStock._id ? { ...s, ...saved } : s)));
        showToast(`${saved?.medicineName || payload.medicineName} updated in inventory.`);
      } else {
        const saved = await api('/pharmacist/stock', {
          method: 'POST',
          token: getToken('pharmacist'),
          body: payload,
        });
        setStock(prev => [saved, ...prev]);
        showToast(`${saved?.medicineName || payload.medicineName} added to inventory.`);
      }
      closeStockModal();
      setNewStock(EMPTY_STOCK_FORM);
    } catch (error) {
      handleWriteError(error, 'Could not save this medicine.');
    } finally {
      setBusyKey('');
    }
  }

  async function handleDeleteStock(item) {
    if (busyKey === `stock:delete:${item._id}`) return;

    if (!canPersist) {
      setStock(prev => prev.filter(s => s._id !== item._id));
      setCart(prev => prev.filter(c => c._id !== item._id));
      showToast('Demo mode — item removed on this device only.');
      return;
    }

    setBusyKey(`stock:delete:${item._id}`);
    try {
      await api(`/pharmacist/stock/${item._id}`, { method: 'DELETE', token: getToken('pharmacist') });
      setStock(prev => prev.filter(s => s._id !== item._id));
      setCart(prev => prev.filter(c => c._id !== item._id));
      showToast(`${item.medicineName} removed from inventory.`);
    } catch (error) {
      handleWriteError(error, 'Could not remove this item.');
    } finally {
      setBusyKey('');
    }
  }

  // POS Operations
  function addToCart(med) {
    const existing = cart.find(c => c._id === med._id);
    if (existing) {
      if (existing.qty >= med.units) return showToast('Exceeds available stock units', 'error');
      setCart(cart.map(c => c._id === med._id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...med, qty: 1 }]);
    }
  }

  function updateCartQty(id, delta) {
    setCart(prev => prev.map(c => {
      if (c._id !== id) return c;
      const next = c.qty + delta;
      return next > 0 ? { ...c, qty: next } : null;
    }).filter(Boolean));
  }

  function applyCoupon() {
    if (couponCode.toUpperCase() === 'MEDI20' || couponCode.toUpperCase() === 'WELCOME10') {
      setCouponApplied(true);
      setDiscountPercent(couponCode.toUpperCase() === 'MEDI20' ? 20 : 10);
      showToast(`Voucher ${couponCode.toUpperCase()} applied!`);
    } else {
      showToast('Invalid voucher code', 'error');
    }
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.qty), 0);
  const cartDiscountAmount = (cartSubtotal * discountPercent) / 100;
  const cartGrandTotal = Math.max(0, cartSubtotal - cartDiscountAmount);

  async function handleCompleteBill() {
    if (busyKey === 'bill') return;
    if (cart.length === 0) return showToast('Add medicines to bill', 'error');
    if (!customerForm.name.trim()) return showToast('Customer name required', 'error');

    function resetCart() {
      setCart([]);
      setCustomerForm({ name: '', phone: '', email: '' });
      setCouponApplied(false);
      setDiscountPercent(0);
      setCouponCode('');
    }

    // Demo mode — the invoice lives on this device until the API is reachable.
    if (!canPersist) {
      const newBill = {
        _id: `b_${Date.now()}`,
        billNumber: `INV-2026-${Math.floor(Math.random() * 900 + 100)}`,
        customerName: customerForm.name.trim(),
        customerPhone: customerForm.phone.trim() || 'Unlisted',
        customerEmail: customerForm.email.trim() || undefined,
        grandTotal: cartGrandTotal,
        paymentMode,
        createdAt: new Date().toISOString(),
        items: cart.map(c => ({ medicineName: c.medicineName, qty: c.qty, price: c.sellingPrice })),
      };

      setStock(prev => prev.map(s => {
        const sold = cart.find(c => c._id === s._id);
        return sold ? { ...s, units: Math.max(0, s.units - sold.qty) } : s;
      }));
      setBills(prev => [newBill, ...prev]);
      resetCart();
      showToast(`Demo invoice ${newBill.billNumber} created on this device.`);
      return;
    }

    setBusyKey('bill');
    try {
      const saved = await api('/pharmacist/bill', {
        method: 'POST',
        token: getToken('pharmacist'),
        body: {
          customerName: customerForm.name.trim(),
          customerPhone: customerForm.phone.trim(),
          customerEmail: customerForm.email.trim() || undefined,
          items: cart.map(c => ({
            stockId: c._id,
            medicineName: c.medicineName,
            price: c.sellingPrice,
            quantity: c.qty,
            gstRate: c.gstRate ?? 12,
          })),
          discount: discountPercent,
          paymentMode,
          couponCode: couponApplied ? couponCode.toUpperCase() : undefined,
        },
      });

      const savedBill = {
        ...saved,
        billNumber: saved.billNumber || saved.id,
        paymentMode: saved.paymentMode || paymentMode,
        grandTotal: Number(saved.grandTotal) || cartGrandTotal,
        createdAt: saved.createdAt || new Date().toISOString(),
        items: (saved.items || []).map(item => ({
          ...item,
          qty: item.qty ?? item.quantity ?? 1,
          price: item.price ?? item.unitPrice ?? 0,
        })),
      };

      setBills(prev => [savedBill, ...prev]);
      setStock(prev => prev.map(s => {
        const sold = cart.find(c => c._id === s._id);
        return sold ? { ...s, units: Math.max(0, s.units - sold.qty) } : s;
      }));
      resetCart();
      showToast(`Invoice ${savedBill.billNumber} saved to the dispensary ledger.`);

      // The API deducts stock for the sold lines; pull the authoritative counts.
      api('/pharmacist/stock', { token: getToken('pharmacist') })
        .then(res => { if (Array.isArray(res?.stock)) setStock(res.stock); })
        .catch(() => {});
    } catch (error) {
      handleWriteError(error, 'Could not save this invoice.');
    } finally {
      setBusyKey('');
    }
  }

  // Purchase orders
  function openOrderModal(supplier) {
    if (!canPersist) {
      return showToast('Distributor orders need a live dispensary connection.', 'error');
    }
    const low = stock.find(s => s.units <= (s.minStock || 10)) || stock[0];
    setOrderFor(supplier);
    setOrderForm({ medicineName: low?.medicineName || '', quantity: 10, expectedDate: '', notes: '' });
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (!orderFor || busyKey === 'order') return;
    if (!orderForm.medicineName.trim() || !Number(orderForm.quantity)) {
      return showToast('Medicine and quantity required', 'error');
    }

    setBusyKey('order');
    try {
      const res = await api(`/pharmacist/suppliers/${orderFor._id}/order`, {
        method: 'POST',
        token: getToken('pharmacist'),
        body: {
          medicineName: orderForm.medicineName.trim(),
          quantity: Number(orderForm.quantity),
          expectedDate: orderForm.expectedDate || undefined,
          notes: orderForm.notes.trim() || undefined,
        },
      });

      setSuppliers(prev => prev.map(s => (
        s._id === orderFor._id
          ? { ...s, orders: [...(s.orders || []), res?.order].filter(Boolean), totalOrders: (s.totalOrders || 0) + 1 }
          : s
      )));
      showToast(res?.message || `Order placed with ${orderFor.name}.`);
      setOrderFor(null);
    } catch (error) {
      if (error?.status === 403) {
        showToast('Distributor orders need a premium dispensary.', 'error');
      } else {
        handleWriteError(error, 'Could not place this order.');
      }
    } finally {
      setBusyKey('');
    }
  }

  async function handleAddSupplier(e) {
    e.preventDefault();
    if (busyKey === 'supplier:add') return;
    if (!supplierForm.name.trim()) return showToast('Distributor name is required', 'error');

    setBusyKey('supplier:add');
    try {
      const saved = await api('/pharmacist/suppliers', {
        method: 'POST',
        token: getToken('pharmacist'),
        body: {
          name: supplierForm.name.trim(),
          phone: supplierForm.phone.trim() || undefined,
          email: supplierForm.email.trim() || undefined,
          address: supplierForm.address.trim() || undefined,
        },
      });
      setSuppliers(prev => [{
        ...saved,
        contactPerson: saved.contactPerson || saved.name,
        leadTime: saved.leadTime || (saved.creditDays ? `${saved.creditDays}-day credit` : 'Verified distributor'),
      }, ...prev]);
      setSupplierForm({ name: '', phone: '', email: '', address: '' });
      setShowSupplierModal(false);
      showToast(`${saved.name} added to distributors.`);
    } catch (error) {
      if (error?.status === 403) {
        showToast('Distributors need a premium dispensary.', 'error');
      } else {
        handleWriteError(error, 'Could not add this distributor.');
      }
    } finally {
      setBusyKey('');
    }
  }

  // Refill reminders
  async function handleSendReminder(customer) {
    if (busyKey === `remind:${customer._id}`) return;
    if (!canPersist) {
      return showToast('Refill reminders need a live dispensary connection.', 'error');
    }

    setBusyKey(`remind:${customer._id}`);
    try {
      const res = await api(`/pharmacist/customers/${customer._id}/remind`, {
        method: 'POST',
        token: getToken('pharmacist'),
        body: { medicineName: customer.medicines?.[0]?.name },
      });
      setCustomers(prev => prev.map(c => (
        c._id === customer._id
          ? {
              ...c,
              reminders: [...(c.reminders || []), res?.reminder].filter(Boolean),
              lastReminderAt: res?.customer?.lastReminderAt || c.lastReminderAt,
            }
          : c
      )));
      showToast(res?.message || `Reminder logged for ${customer.name}.`, res?.success === false ? 'error' : 'success');
    } catch (error) {
      if (error?.status === 403) {
        showToast('Refill reminders need a premium dispensary.', 'error');
      } else {
        handleWriteError(error, 'Could not send this reminder.');
      }
    } finally {
      setBusyKey('');
    }
  }

  // Store profile
  async function handleSaveProfile() {
    if (busyKey === 'profile') return;
    const payload = {
      name: (pharmacist?.name || '').trim(),
      ownerName: (pharmacist?.ownerName || '').trim(),
      phone: (pharmacist?.phone || '').trim(),
      address: (pharmacist?.address || '').trim(),
    };
    if (!payload.name) return showToast('Store name is required', 'error');

    if (!canPersist) {
      try { localStorage.setItem('pharmacist_info', JSON.stringify(pharmacist)); } catch {}
      showToast('Demo mode — profile saved on this device only.');
      return;
    }

    setBusyKey('profile');
    try {
      const res = await api('/pharmacist/profile', {
        method: 'PATCH',
        token: getToken('pharmacist'),
        body: payload,
      });
      const updated = { ...pharmacist, ...(res?.pharmacist || payload) };
      setPharmacist(updated);
      try { localStorage.setItem('pharmacist_info', JSON.stringify(updated)); } catch {}
      showToast('Store profile saved.');
    } catch (error) {
      handleWriteError(error, 'Could not save the store profile.');
    } finally {
      setBusyKey('');
    }
  }

  // ── Bill actions ──────────────────────────────────────────────
  async function handleBillEmail(bill) {
    if (busyKey === `bill-email:${bill._id}`) return;
    if (!canPersist) return showToast('Bill actions need a live dispensary connection.', 'error');

    // Walk-in bills often have no email on file; ask before calling the API.
    const email = bill.customerEmail || window.prompt('Send this invoice to which email address?', '')?.trim();
    if (!email) return;

    setBusyKey(`bill-email:${bill._id}`);
    try {
      const res = await api(`/pharmacist/bill/${bill.billNumber || bill.id}/send-email`, {
        method: 'POST', token: getToken('pharmacist'), body: { email },
      });
      showToast(res?.message || `Invoice ${bill.billNumber} emailed to ${email}.`);
    } catch (error) { handleWriteError(error, 'Could not email this invoice.'); }
    finally { setBusyKey(''); }
  }

  async function handleBillWhatsapp(bill) {
    if (busyKey === `bill-wa:${bill._id}`) return;
    if (!canPersist) return showToast('Bill actions need a live dispensary connection.', 'error');
    setBusyKey(`bill-wa:${bill._id}`);
    try {
      const res = await api(`/pharmacist/bill/${bill.billNumber || bill.id}/send-whatsapp`, {
        method: 'POST', token: getToken('pharmacist'), body: { phone: bill.customerPhone || undefined },
      });
      // Without a WhatsApp API the backend only builds the message; open it
      // rather than claiming the patient received anything.
      if (res?.mock && res?.waLink) {
        window.open(res.waLink, '_blank', 'noopener,noreferrer');
        showToast('WhatsApp API is not connected — opened the message for you to send.');
      } else {
        showToast(res?.message || `Invoice ${bill.billNumber} sent on WhatsApp.`);
      }
    } catch (error) { handleWriteError(error, 'Could not send this invoice on WhatsApp.'); }
    finally { setBusyKey(''); }
  }

  async function handleBillPrint(bill) {
    if (!canPersist) return showToast('Printing needs a live dispensary connection.', 'error');
    try {
      const token = getToken('pharmacist');
      const res = await fetch(`${API_BASE}/pharmacist/bill/${bill.billNumber || bill.id}/html`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Print failed (${res.status})`);
      const html = await res.text();
      const frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      document.body.appendChild(frame);
      const doc = frame.contentWindow.document;
      doc.open(); doc.write(html); doc.close();
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => document.body.removeChild(frame), 60000);
    } catch (error) { showToast(error.message || 'Could not print this invoice.', 'error'); }
  }

  async function handleBillDelete(bill) {
    const key = `bill-del:${bill._id}`;
    if (busyKey === key) return;
    if (!canPersist) {
      setBills(prev => prev.filter(b => b._id !== bill._id));
      return showToast('Demo mode — invoice removed on this device only.');
    }
    if (!window.confirm(`Delete invoice ${bill.billNumber}? This removes it from the ledger permanently.`)) return;
    setBusyKey(key);
    try {
      await api(`/pharmacist/bill/${bill.billNumber || bill.id}`, { method: 'DELETE', token: getToken('pharmacist') });
      setBills(prev => prev.filter(b => b._id !== bill._id));
      showToast(`Invoice ${bill.billNumber} deleted.`);
    } catch (error) { handleWriteError(error, 'Could not delete this invoice.'); }
    finally { setBusyKey(''); }
  }

  // ── Regular patients ──────────────────────────────────────────
  const EMPTY_PATIENT_FORM = { name: '', phone: '', email: '', address: '', medicineName: '', dosage: '', quantity: 1, typicalDate: '', notes: '' };

  function openPatientModal(patient = null) {
    if (!canPersist) return showToast('Patient records need a live dispensary connection.', 'error');
    setEditingPatient(patient);
    const med = patient?.medicines?.[0];
    setPatientForm(patient ? {
      name: patient.name || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      medicineName: med?.name || med?.medicineName || '',
      dosage: med?.dosage || '',
      quantity: med?.quantity || 1,
      typicalDate: med?.refillDay ?? med?.typicalDate ?? '',
      notes: patient.notes || '',
    } : EMPTY_PATIENT_FORM);
    setShowPatientModal(true);
  }

  async function handleSavePatient(e) {
    e.preventDefault();
    if (busyKey === 'patient:save') return;
    if (!patientForm.name.trim()) return showToast('Patient name is required', 'error');

    const medicines = patientForm.medicineName.trim() ? [{
      medicineName: patientForm.medicineName.trim(),
      dosage: patientForm.dosage.trim() || undefined,
      quantity: Number(patientForm.quantity) || 1,
      typicalDate: patientForm.typicalDate === '' ? undefined : Number(patientForm.typicalDate),
      alertEnabled: true,
    }] : [];

    const payload = {
      name: patientForm.name.trim(),
      phone: patientForm.phone.trim() || undefined,
      email: patientForm.email.trim() || undefined,
      address: patientForm.address.trim() || undefined,
      notes: patientForm.notes.trim() || undefined,
      medicines,
    };

    setBusyKey('patient:save');
    try {
      const token = getToken('pharmacist');
      if (editingPatient) {
        await api(`/pharmacist/customers/${editingPatient._id}`, { method: 'PATCH', token, body: payload });
      } else {
        await api('/pharmacist/customers', { method: 'POST', token, body: payload });
      }
      const list = await api('/pharmacist/customers', { token });
      setCustomers((Array.isArray(list) ? list : list?.customers || []).map(c => ({
        ...c,
        medicines: (c.medicines || []).map(m => ({ ...m, name: m.name || m.medicineName, refillDay: m.refillDay ?? m.typicalDate })),
      })));
      setShowPatientModal(false);
      setEditingPatient(null);
      setPatientForm(EMPTY_PATIENT_FORM);
      showToast(editingPatient ? 'Patient record updated.' : 'Patient added to the refill registry.');
    } catch (error) { handleWriteError(error, 'Could not save this patient.'); }
    finally { setBusyKey(''); }
  }

  async function handleDeletePatient(patient) {
    const key = `patient-del:${patient._id}`;
    if (busyKey === key) return;
    if (!window.confirm(`Remove ${patient.name} from the refill registry?`)) return;
    setBusyKey(key);
    try {
      await api(`/pharmacist/customers/${patient._id}`, { method: 'DELETE', token: getToken('pharmacist') });
      setCustomers(prev => prev.filter(c => c._id !== patient._id));
      showToast(`${patient.name} removed.`);
    } catch (error) { handleWriteError(error, 'Could not remove this patient.'); }
    finally { setBusyKey(''); }
  }

  // ── Purchase lists (requirements) ─────────────────────────────
  function handleAddListItem(e) {
    e.preventDefault();
    if (!listItemDraft.medicineName.trim() || !Number(listItemDraft.quantity)) {
      return showToast('Medicine and quantity required', 'error');
    }
    setListItems(prev => [...prev, { ...listItemDraft, medicineName: listItemDraft.medicineName.trim(), quantity: Number(listItemDraft.quantity), _key: `${Date.now()}-${prev.length}` }]);
    setListItemDraft({ medicineName: '', quantity: 1, unit: 'strips', priority: 'medium', notes: '' });
  }

  async function handleSaveList(e) {
    e.preventDefault();
    if (busyKey === 'list:save') return;
    if (!listItems.length) return showToast('Add at least one medicine to the list', 'error');

    setBusyKey('list:save');
    try {
      const created = await api('/pharmacist/requirements', {
        method: 'POST', token: getToken('pharmacist'),
        body: { title: listTitle.trim() || 'Purchase List', items: listItems },
      });
      setRequirements(prev => [created, ...prev]);
      setRequirementsState('ready');
      setShowListModal(false);
      setListTitle('');
      setListItems([]);
      showToast(`Purchase list “${created?.title || 'Purchase List'}” saved.`);
    } catch (error) { handleWriteError(error, 'Could not save this purchase list.'); }
    finally { setBusyKey(''); }
  }

  async function handleSendList(e) {
    e.preventDefault();
    if (!sendListFor || busyKey === 'list:send') return;
    if (!sendListSupplierId) return showToast('Pick a distributor', 'error');

    setBusyKey('list:send');
    try {
      const res = await api(`/pharmacist/requirements/${sendListFor._id}/send`, {
        method: 'POST', token: getToken('pharmacist'), body: { supplierId: sendListSupplierId },
      });
      setRequirements(prev => prev.map(r => (r._id === sendListFor._id ? { ...r, status: 'sent' } : r)));
      const supplierName = suppliers.find(s => s._id === sendListSupplierId)?.name || 'the distributor';
      showToast(res?.message || `List sent to ${supplierName}.`);
      setSendListFor(null);
      setSendListSupplierId('');
    } catch (error) {
      if (error?.status === 403) showToast('Purchase lists need a premium dispensary.', 'error');
      else handleWriteError(error, 'Could not send this list.');
    } finally { setBusyKey(''); }
  }

  async function handleDeleteList(requirement) {
    const key = `list-del:${requirement._id}`;
    if (busyKey === key) return;
    setBusyKey(key);
    try {
      await api(`/pharmacist/requirements/${requirement._id}`, { method: 'DELETE', token: getToken('pharmacist') });
      setRequirements(prev => prev.filter(r => r._id !== requirement._id));
      showToast(`“${requirement.title}” deleted.`);
    } catch (error) { handleWriteError(error, 'Could not delete this list.'); }
    finally { setBusyKey(''); }
  }

  // ── Incoming patient price requests ───────────────────────────
  async function handleRequestRespond(notif, response) {
    const key = `req:${notif.id}`;
    if (busyKey === key) return;
    setBusyKey(key);
    try {
      const res = await api(`/requests/notifications/${pharmacist?._id}/${notif.id}/respond`, {
        method: 'PATCH', token: getToken('pharmacist'),
        body: { pharmacistId: pharmacist?._id, response, selectedStockId: requestChoice[notif.id] || undefined },
      });
      setRequests(prev => prev.map(n => (n.id === notif.id ? { ...n, pharmacistResponse: response, isRead: true } : n)));
      showToast(res?.message || (response === 'approved' ? 'Price approved and updated.' : 'Request rejected.'));
      if (response === 'approved') setReloadKey(key => key + 1);
    } catch (error) { handleWriteError(error, 'Could not respond to this request.'); }
    finally { setBusyKey(''); }
  }

  async function handleRequestRead(notif) {
    if (notif.isRead) return;
    setRequests(prev => prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n)));
    try {
      await api(`/requests/notifications/${pharmacist?._id}/${notif.id}/read`, { method: 'PATCH', token: getToken('pharmacist') });
    } catch { /* read receipts are best-effort */ }
  }

  // Filtered Stock
  const filteredStock = stock.filter(s => {
    const needle = stockSearch.toLowerCase();
    const matchesSearch = (s.medicineName || '').toLowerCase().includes(needle) ||
                          (s.genericName || '').toLowerCase().includes(needle);
    const matchesCat = stockCategoryFilter === 'All' || s.category === stockCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const lowStockCount = stock.filter(s => s.units <= s.minStock).length;
  const totalStockValue = stock.reduce((sum, s) => sum + (s.sellingPrice * s.units), 0);
  const totalRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);

  // Bills actually raised today, so “billed today” never quotes all-time sales.
  const todayKey = new Date().toDateString();
  const billsToday = bills.filter(b => new Date(b.createdAt).toDateString() === todayKey);
  const todayRevenue = billsToday.reduce((sum, b) => sum + b.grandTotal, 0);

  // Refill rows are ordered by the patient whose cycle comes round first.
  const upcomingRefills = [...customers]
    .sort((a, b) => (Number(a.medicines?.[0]?.refillDay) || 99) - (Number(b.medicines?.[0]?.refillDay) || 99))
    .slice(0, 3);

  const stockCategories = ['All', ...Array.from(new Set(stock.map(s => s.category).filter(Boolean)))];

  const unreadRequests = requests.filter(r => !r.isRead && !r.pharmacistResponse).length;

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Icons.Overview },
    { id: 'stock', label: 'Stock Inventory', icon: Icons.Stock, badge: lowStockCount > 0 ? lowStockCount : null },
    { id: 'billing', label: 'POS Billing', icon: Icons.Billing, badge: cart.length > 0 ? cart.length : null },
    { id: 'analytics', label: 'Sales Analytics', icon: Icons.Analytics },
    { id: 'suppliers', label: 'Distributors', icon: Icons.Suppliers },
    { id: 'lists', label: 'Purchase Lists', icon: Icons.Lists },
    { id: 'customers', label: 'Refill Tracker', icon: Icons.Customers },
    { id: 'requests', label: 'Price Requests', icon: Icons.Inbox, badge: unreadRequests > 0 ? unreadRequests : null },
    { id: 'settings', label: 'Store Profile', icon: Icons.Settings },
  ];

  // Shared lock panel for premium features on a free plan.
  function PremiumLock({ title, blurb }) {
    return (
      <div className="relative mx-auto max-w-lg overflow-hidden rounded-panel border border-white/10 bg-navy px-6 py-12 text-center text-white">
        <Lamp width="34rem" height="18rem" />
        <div className="relative z-10">
          <Badge tone="navy" className="mb-4">
            <Icons.Lock /> Premium
          </Badge>
          <h3 className="text-lg font-medium tracking-[-0.02em]">{title}</h3>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-white/70">{blurb}</p>
          <ShimmerButton tone="accent" onClick={openUpgrade} className="mt-6">
            Upgrade the dispensary
          </ShimmerButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink transition-colors duration-200 lg:flex-row">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.msg}
            role="status"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'fixed bottom-6 right-6 z-[130] flex max-w-[min(22rem,calc(100vw-3rem))] items-center gap-2.5 rounded-full border px-4 py-2.5 text-xs font-medium shadow-float',
              toast.type === 'error'
                ? 'border-danger/40 bg-danger text-white'
                : 'border-line bg-navy text-white',
            )}
          >
            <span
              className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', toast.type === 'error' ? 'bg-white/85' : 'bg-success')}
              aria-hidden="true"
            />
            <span className="min-w-0">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile top bar — the sidebar is off-canvas below lg */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open dashboard menu"
          aria-expanded={mobileNavOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-canvas text-ink-soft"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-xs font-semibold text-ink">{TABS.find((tab) => tab.id === activeTab)?.label || 'Overview'}</p>
          <p className="truncate text-[10px] text-muted">{pharmacist?.name?.split('—')[0] || 'Dispensary Cloud'}</p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-canvas text-ink-soft"
        >
          {dark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </header>

      {/* Backdrop for the off-canvas sidebar */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-[65] bg-ink/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Left Sidebar (Stripe Editorial Rhythm) ── */}
      <aside
        aria-label="Dashboard navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-[70] flex h-screen w-64 flex-shrink-0 flex-col justify-between overflow-y-auto border-r border-line bg-surface transition-transform duration-300 lg:sticky lg:top-0 lg:z-40 lg:translate-x-0',
          mobileNavOpen ? 'translate-x-0 shadow-float' : '-translate-x-full',
        )}
      >
        <div>
          {/* Top Brand Header */}
          <div className="p-4 border-b border-line">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <LogoIcon size={30} />
                <div>
                  <span className="font-semibold text-xs text-ink block leading-tight">
                    MediMap <span className="text-accent-ink">POS</span>
                  </span>
                  <span className="text-[10px] text-muted">Dispensary Cloud</span>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                title="Toggle Theme"
                className="w-7 h-7 rounded-full border border-line bg-canvas flex items-center justify-center text-xs text-ink hover:border-accent transition-colors"
              >
                {dark ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Store status */}
            <CardSpotlight radius={200} className="rounded-field border border-line bg-canvas p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold text-ink">
                  {pharmacist?.name?.split('—')[0] || 'Your pharmacy'}
                </span>
                <button
                  type="button"
                  aria-pressed={storeOpen}
                  onClick={() => { setStoreOpen(!storeOpen); showToast(storeOpen ? 'Store marked closed' : 'Store marked open'); }}
                  className="flex-shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <Badge tone={storeOpen ? 'success' : 'danger'} dot>
                    {storeOpen ? 'Open' : 'Closed'}
                  </Badge>
                </button>
              </div>
              <span className="mt-1 block truncate text-[10px] text-muted">
                {pharmacist?.address || 'Add your address in Store Profile'}
              </span>
            </CardSpotlight>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1" aria-label="Dashboard sections">
            {TABS.map(tab => {
              const IconComponent = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileNavOpen(false);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex w-full items-center justify-between rounded-field px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                    active
                      ? 'text-white'
                      : 'text-muted hover:bg-canvas hover:text-ink dark:hover:bg-raised dark:hover:text-white',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="pharmacist-nav-active"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-field bg-accent-solid shadow-xs"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5">
                    <IconComponent />
                    <span>{tab.label}</span>
                  </span>
                  {tab.badge && (
                    <span
                      className={cn(
                        'tnum relative z-10 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                        active
                          ? 'bg-white/20 text-white'
                          : 'border border-warning/25 bg-warning/10 text-warning',
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="space-y-1 border-t border-line p-3">
          {!hydrating && !isPremium && (
            <Button
              variant="outline"
              size="sm"
              onClick={openUpgrade}
              className="w-full justify-start gap-2 border-accent/40 text-accent-ink hover:border-accent"
            >
              <Icons.Lock /> Upgrade to Premium
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            to="/"
            className="w-full justify-start gap-2 text-muted"
          >
            <span aria-hidden="true">←</span> Patient platform
          </Button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-field px-3 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            <Icons.Logout /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        
        {/* Top Header */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div className="min-w-0">
            <div className="eyebrow mb-2">
              <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
              Dispensary
            </div>
            <h1 className="display-3 text-ink">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="mt-1.5 text-xs text-muted">
              {hydrating
                ? 'Syncing with the dispensary API…'
                : demoMode
                  ? 'Demo data — not connected to the live dispensary'
                  : (
                    <>
                      <span className="tnum">{stock.length}</span> medicine{stock.length === 1 ? '' : 's'} ·{' '}
                      <span className="tnum">{bills.length}</span> bill{bills.length === 1 ? '' : 's'} synced from the API
                    </>
                  )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowOCRModal(true)}>
              Scan stock OCR
            </Button>
            <Button size="sm" onClick={() => setActiveTab('billing')}>
              <Icons.Plus />
              New POS bill
            </Button>
          </div>
        </header>

        {/* ── Connection state ── */}
        {(demoMode || syncNote) && !bannerDismissed && (
          <div
            role="status"
            className={cn(
              'mb-6 flex flex-col gap-3 rounded-field border p-3.5 sm:flex-row sm:items-center sm:justify-between',
              demoMode
                ? 'border-warning/30 bg-warning/10'
                : 'border-line bg-raised',
            )}
          >
            <div className="flex items-start gap-2.5">
              <Badge tone={demoMode ? 'warning' : 'success'} dot className="mt-px flex-shrink-0">
                {demoMode ? 'Demo mode' : 'Connected'}
              </Badge>
              <p className="min-w-0 text-[11px] leading-relaxed text-muted">
                {syncNote || 'Stock, bills, distributors and refill registries are read from the MediMap API.'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  if (!getToken('pharmacist')) {
                    window.location.href = '/login';
                  } else {
                    setReloadKey((key) => key + 1);
                  }
                }}
              >
                {!getToken('pharmacist') ? 'Sign in to Pharmacy' : demoMode ? 'Retry connection' : 'Refresh'}
              </Button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="text-muted hover:text-ink p-1 rounded-md transition-colors"
                title="Dismiss notice"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── 1. OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardSpotlight className="p-5">
                <span className="text-xs font-medium text-muted">Billed today</span>
                <div className="mt-1.5 text-3xl font-light tracking-[-0.03em] text-ink">
                  ₹<NumberTicker value={todayRevenue} decimals={0} />
                </div>
                <span className="mt-2 block text-[11px] text-muted">
                  <span className="tnum">{billsToday.length}</span> invoice{billsToday.length === 1 ? '' : 's'} raised since midnight
                </span>
              </CardSpotlight>

              <CardSpotlight className="p-5">
                <span className="text-xs font-medium text-muted">Total billed</span>
                <div className="mt-1.5 text-3xl font-light tracking-[-0.03em] text-ink">
                  ₹<NumberTicker value={totalRevenue} decimals={0} />
                </div>
                <span className="mt-2 block text-[11px] text-muted">
                  <span className="tnum">{bills.length}</span> invoice{bills.length === 1 ? '' : 's'} in the ledger
                </span>
              </CardSpotlight>

              <CardSpotlight className="p-5">
                <span className="text-xs font-medium text-muted">Stock at retail value</span>
                <div className="mt-1.5 text-3xl font-light tracking-[-0.03em] text-accent-ink">
                  ₹<NumberTicker value={totalStockValue} decimals={0} />
                </div>
                <span className="mt-2 block text-[11px] text-muted">
                  <span className="tnum">{stock.length}</span> medicine line{stock.length === 1 ? '' : 's'} on the shelf
                </span>
              </CardSpotlight>

              <CardSpotlight className="p-5">
                <span className="text-xs font-medium text-muted">Below reorder level</span>
                <div className={cn('mt-1.5 text-3xl font-light tracking-[-0.03em]', lowStockCount > 0 ? 'text-danger' : 'text-ink')}>
                  <NumberTicker value={lowStockCount} />
                </div>
                <span className="mt-2 block text-[11px] text-muted">
                  {lowStockCount > 0 ? 'Order these before the shelf runs dry' : 'Every line is above its minimum'}
                </span>
              </CardSpotlight>
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

              {/* Recent Bills Ledger */}
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Recent POS sales</h3>
                  <Button variant="link" size="xs" onClick={() => setActiveTab('billing')}>
                    View all
                  </Button>
                </div>

                {bills.length === 0 ? (
                  <EmptyState
                    icon={Icons.Billing}
                    title="No invoices yet"
                    description="Ring up the first sale from the POS Billing tab — it lands in this ledger."
                    action={<Button size="sm" onClick={() => setActiveTab('billing')}>Open POS Billing</Button>}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {bills.slice(0, 4).map(b => (
                      <div key={b._id} className="flex items-center justify-between gap-3 rounded-field border border-line bg-surface p-3 text-xs transition-colors hover:border-line-strong/80">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-accent-ink">{b.billNumber}</span>
                            <span className="truncate font-medium text-ink">{b.customerName}</span>
                            <Badge tone="neutral">{b.paymentMode}</Badge>
                          </div>
                          <span className="mt-0.5 block truncate text-[11px] text-muted">
                            {b.items.map(it => `${it.medicineName} (${it.qty})`).join(', ')}
                          </span>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="tnum block text-sm font-semibold text-ink">₹{b.grandTotal.toFixed(2)}</span>
                          <span className="tnum text-[10px] text-muted">{new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Patient Refill Alerts */}
              <CardSpotlight className="flex h-full flex-col justify-between p-5">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <Badge tone="accent">
                      <Icons.Bell /> Refills
                    </Badge>
                    <span className="tnum text-[11px] text-muted">{customers.length} on file</span>
                  </div>
                  <h3 className="text-sm font-semibold text-ink">Next refills due</h3>
                  <p className="mb-4 mt-1 text-xs leading-relaxed text-muted">
                    Patients on a monthly cycle, ordered by the day their refill comes round.
                  </p>

                  {upcomingRefills.length === 0 ? (
                    <p className="rounded-field border border-dashed border-line px-3 py-5 text-center text-[11px] text-muted">
                      No chronic patients on file yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingRefills.map(c => (
                        <div key={c._id} className="rounded-field border border-line bg-canvas p-2.5 text-xs">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="truncate font-medium text-ink">{c.name}</span>
                            <span className="flex-shrink-0 text-[10px] font-semibold text-accent-ink">
                              {c.medicines?.[0]?.refillDay ? `Day ${c.medicines[0].refillDay}` : 'No cycle'}
                            </span>
                          </div>
                          <span className="block truncate text-[11px] text-muted">
                            {c.medicines?.[0]?.name || 'No medicine on file'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('customers')}
                  className="mt-4 w-full"
                >
                  Manage refill schedule
                </Button>
              </CardSpotlight>

            </div>
          </div>
        )}

        {/* ── 2. INVENTORY & STOCK TAB ── */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex w-full max-w-md flex-1 flex-wrap items-center gap-2 sm:flex-nowrap">
                <div className="flex h-9 w-full flex-1 items-center gap-2 rounded-full border border-line bg-surface px-3.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/15 sm:w-auto">
                  <Icons.Search />
                  <input
                    type="search"
                    placeholder="Search brand, formulation or salt…"
                    aria-label="Search inventory"
                    value={stockSearch}
                    onChange={e => setStockSearch(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-muted"
                  />
                </div>
                <div className="w-full flex-shrink-0 sm:w-40">
                  <Select
                    aria-label="Filter by category"
                    value={stockCategoryFilter}
                    onChange={e => setStockCategoryFilter(e.target.value)}
                    className="h-9 py-0 text-xs"
                  >
                    {stockCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <Button size="sm" onClick={() => openStockModal()}>
                <Icons.Plus />
                Add medicine
              </Button>
            </div>

            {/* Inventory Table */}
            {filteredStock.length === 0 ? (
              <EmptyState
                icon={Icons.Stock}
                title={stock.length === 0 ? 'No medicines in inventory' : 'Nothing matches this filter'}
                description={
                  stock.length === 0
                    ? 'Add the first formulation to start billing and tracking stock.'
                    : 'Clear the search or category filter to see the rest of the shelf.'
                }
                action={
                  stock.length === 0 ? (
                    <Button size="sm" onClick={() => openStockModal()}>
                      <Icons.Plus /> Add medicine
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => { setStockSearch(''); setStockCategoryFilter('All'); }}>
                      Clear filters
                    </Button>
                  )
                }
              />
            ) : (
            <div className="rounded-card border border-line bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-line text-muted">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Medicine Formulation</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Batch & Expiry</th>
                      <th className="py-3 px-4 font-semibold text-right">Cost Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Retail MRP</th>
                      <th className="py-3 px-4 font-semibold text-center">Available Units</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredStock.map(s => {
                      const isLow = s.units <= s.minStock;
                      return (
                        <tr key={s._id} className="hover:bg-canvas/60 dark:hover:bg-raised/40 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-semibold text-ink block">{s.medicineName}</span>
                            <span className="text-[11px] text-muted">{s.genericName} · {s.manufacturer}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge tone="accent">{s.category}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs text-ink block">{s.batchNo}</span>
                            <span className="text-[11px] text-muted">Exp: {s.expiryDate}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-muted tnum">
                            ₹{s.purchasePrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-ink tnum">
                            ₹{s.sellingPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge tone={isLow ? 'danger' : 'success'} className="tnum">
                              {s.units}{isLow ? ' · low' : ''}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <IconButton
                                size="xs"
                                onClick={() => openStockModal(s)}
                                title="Edit item"
                                aria-label={`Edit ${s.medicineName}`}
                              >
                                <Icons.Edit />
                              </IconButton>
                              <IconButton
                                size="xs"
                                onClick={() => handleDeleteStock(s)}
                                disabled={busyKey === `stock:delete:${s._id}`}
                                title="Delete item"
                                aria-label={`Delete ${s.medicineName}`}
                                className="text-danger hover:text-danger"
                              >
                                <Icons.Trash />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )}

          </div>
        )}

        {/* ── 3. POS BILLING TAB ── */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Medicine Search & Cart */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-card border border-line bg-surface p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">Tap an item to bill</h3>
                  <Badge tone="neutral" className="tnum">{stock.length} in stock</Badge>
                </div>

                {stock.length === 0 ? (
                  <p className="rounded-field border border-dashed border-line px-3 py-6 text-center text-[11px] text-muted">
                    Add medicines in the Stock Inventory tab to start billing.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {stock.slice(0, 6).map(s => {
                      const out = s.units <= 0;
                      return (
                        <motion.button
                          key={s._id}
                          type="button"
                          whileHover={out ? undefined : { y: -2 }}
                          whileTap={out ? undefined : { scale: 0.985 }}
                          onClick={() => addToCart(s)}
                          disabled={out}
                          className="rounded-field border border-line bg-canvas p-3 text-left transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="block truncate text-xs font-semibold text-ink">{s.medicineName}</span>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="tnum text-xs font-semibold text-accent-ink">₹{s.sellingPrice}</span>
                            <span className={cn('text-[10px]', out ? 'text-danger' : 'text-muted')}>
                              {out ? 'out of stock' : `${s.units} left`}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Live Invoice Items Table */}
              <div className="rounded-card border border-line bg-surface p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">Current bill</h3>
                  <Badge tone={cart.length ? 'accent' : 'neutral'} className="tnum">
                    {cart.length} item{cart.length === 1 ? '' : 's'}
                  </Badge>
                </div>

                {cart.length === 0 ? (
                  <EmptyState
                    icon={Icons.Billing}
                    title="Cart is empty"
                    description="Pick an item above to start the invoice."
                    className="border-0 bg-canvas py-8"
                  />
                ) : (
                  <div className="space-y-2">
                    {cart.map(c => (
                      <div key={c._id} className="flex items-center justify-between gap-3 rounded-field border border-line bg-canvas p-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-ink">{c.medicineName}</span>
                          <span className="text-[11px] text-muted">₹{c.sellingPrice} each</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <IconButton
                            size="xs"
                            variant="secondary"
                            aria-label={`Remove one ${c.medicineName}`}
                            onClick={() => updateCartQty(c._id, -1)}
                          >
                            −
                          </IconButton>
                          <span className="tnum w-6 text-center font-mono text-xs font-semibold">{c.qty}</span>
                          <IconButton
                            size="xs"
                            variant="secondary"
                            aria-label={`Add one ${c.medicineName}`}
                            onClick={() => updateCartQty(c._id, 1)}
                          >
                            +
                          </IconButton>
                        </div>

                        <span className="tnum w-20 text-right text-sm font-semibold text-ink">
                          ₹{(c.sellingPrice * c.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Bill Checkout Console */}
            <div className="space-y-4">
              <div className="rounded-card border border-line bg-surface p-5">
                <h3 className="font-semibold text-sm text-ink mb-3">Customer & Payment</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={customerForm.name}
                      onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-field border border-line bg-canvas text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9811223344"
                      value={customerForm.phone}
                      onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-field border border-line bg-canvas text-ink outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Email for the invoice</label>
                    <input
                      type="email"
                      placeholder="e.g. patient@email.com"
                      value={customerForm.email}
                      onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-field border border-line bg-canvas text-ink outline-none focus:border-accent"
                    />
                  </div>

                  {/* Voucher Input */}
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Discount Voucher</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. MEDI20"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-field border border-line bg-canvas text-ink outline-none uppercase font-mono"
                      />
                      <button
                        onClick={applyCoupon}
                        className="h-8 px-3 rounded-field border border-line text-xs font-semibold text-accent-ink"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Payment Mode Selector */}
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Payment Method</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['UPI', 'Cash', 'Card'].map(m => (
                        <button
                          key={m}
                          onClick={() => setPaymentMode(m)}
                          className={`py-1.5 rounded-field text-xs font-semibold border transition-colors ${
                            paymentMode === m
                              ? 'bg-accent-solid text-white border-accent'
                              : 'bg-surface border-line text-muted'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary Totals */}
                  <div className="space-y-1.5 border-t border-line pt-4 text-xs">
                    <div className="flex justify-between text-muted">
                      <span>Subtotal</span>
                      <span className="tnum font-mono">₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Discount ({discountPercent}%)</span>
                        <span className="tnum font-mono">-₹{cartDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-line pt-2 text-sm font-semibold text-ink">
                      <span>Grand total</span>
                      <span className="tnum font-mono text-accent-ink">₹{cartGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCompleteBill}
                    loading={busyKey === 'bill'}
                    className="mt-4 w-full"
                  >
                    Generate GST invoice
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Billing ledger — resend or void any invoice on this counter */}
          <div className="rounded-card border border-line bg-surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 pb-3">
              <div>
                <h3 className="font-semibold text-sm text-ink">Billing ledger</h3>
                <p className="text-[11px] text-muted mt-0.5">
                  Every invoice on this counter. Print or resend a copy without re-entering the sale.
                </p>
              </div>
              <span className="text-[11px] text-muted tnum">
                {bills.length} invoice{bills.length === 1 ? '' : 's'}
              </span>
            </div>

            {bills.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={Icons.Billing}
                  title="No invoices yet"
                  description="The first bill you generate lands here, with print, email and WhatsApp actions."
                  className="border-0 bg-canvas py-10"
                />
              </div>
            ) : (
              <div className="divide-y divide-line border-t border-line">
                {bills.map(bill => {
                  const emailBusy = busyKey === `bill-email:${bill._id}`;
                  const waBusy = busyKey === `bill-wa:${bill._id}`;
                  const delBusy = busyKey === `bill-del:${bill._id}`;
                  return (
                    <div key={bill._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-accent-ink">{bill.billNumber}</span>
                          <span className="text-xs font-semibold text-ink truncate">{bill.customerName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-canvas border border-line text-muted font-medium">
                            {bill.paymentMode}
                          </span>
                        </div>
                        <span className="mt-0.5 block text-[11px] text-muted truncate">
                          {bill.customerPhone && bill.customerPhone !== 'Unlisted' ? `${bill.customerPhone} · ` : ''}
                          {new Date(bill.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>                        <div className="flex flex-shrink-0 items-center gap-3">
                          <span className="tnum text-sm font-semibold text-ink">
                            ₹{Number(bill.grandTotal || 0).toFixed(2)}
                          </span>
                          <div className="flex items-center gap-1">
                            <IconButton
                              size="xs"
                              variant="secondary"
                              onClick={() => handleBillPrint(bill)}
                              title="Print invoice"
                              aria-label={`Print ${bill.billNumber}`}
                            >
                              <Icons.Printer />
                            </IconButton>
                            <IconButton
                              size="xs"
                              variant="secondary"
                              onClick={() => handleBillEmail(bill)}
                              disabled={emailBusy}
                              title="Email invoice"
                              aria-label={`Email ${bill.billNumber}`}
                            >
                              {emailBusy ? '…' : <Icons.Inbox />}
                            </IconButton>
                            <IconButton
                              size="xs"
                              variant="secondary"
                              onClick={() => handleBillWhatsapp(bill)}
                              disabled={waBusy}
                              title="Send on WhatsApp"
                              aria-label={`WhatsApp ${bill.billNumber}`}
                              className="hover:text-success"
                            >
                              {waBusy ? '…' : <Icons.Send />}
                            </IconButton>
                            <IconButton
                              size="xs"
                              variant="secondary"
                              onClick={() => handleBillDelete(bill)}
                              disabled={delBusy}
                              title="Delete invoice"
                              aria-label={`Delete ${bill.billNumber}`}
                              className="text-danger hover:text-danger"
                            >
                              {delBusy ? '…' : <Icons.Trash />}
                            </IconButton>
                          </div>
                        </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
        )}

        {/* ── 4. SALES ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsState === 'locked' && (
              <PremiumLock
                title="Sales analytics"
                blurb="Monthly revenue, profit and margin, top dispensing, expiry warnings and slow-moving stock — computed from your own bills and inventory."
              />
            )}

            {(analyticsState === 'idle' || analyticsState === 'loading') && (
              <div className="rounded-card border border-line bg-surface p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="space-y-3 rounded-field border border-line bg-canvas p-5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-8 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  ))}
                </div>
                <SkeletonText lines={3} className="mt-6" />
                <p className="mt-5 text-center text-[11px] text-muted">Reading your sales history…</p>
              </div>
            )}

            {analyticsState === 'demo' && (
              <EmptyState
                icon={Icons.Analytics}
                title="Analytics need a live connection"
                description="Sign in against the dispensary API to see real figures from your own bills."
              />
            )}

            {analyticsState === 'offline' && (
              <EmptyState
                icon={Icons.Analytics}
                title="Could not load analytics"
                description="The dispensary API did not answer. Nothing was lost — try again."
                action={<Button variant="secondary" size="sm" onClick={loadAnalytics}>Try again</Button>}
              />
            )}

            {analyticsState === 'ready' && analytics && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <CardSpotlight className="p-5">
                    <span className="text-xs font-medium text-muted">Total revenue</span>
                    <div className="mt-1.5 text-3xl font-light tracking-[-0.03em] text-ink">
                      ₹<NumberTicker value={analytics.summary.totalRevenue} decimals={0} />
                    </div>
                    <span className="mt-2 block text-[11px] text-muted">
                      Across <span className="tnum">{analytics.summary.totalBills}</span> invoice{analytics.summary.totalBills === 1 ? '' : 's'}
                    </span>
                  </CardSpotlight>
                  <CardSpotlight className="p-5">
                    <span className="text-xs font-medium text-muted">Profit</span>
                    <div className={cn('mt-1.5 text-3xl font-light tracking-[-0.03em]', analytics.summary.totalProfit >= 0 ? 'text-success' : 'text-danger')}>
                      ₹<NumberTicker value={analytics.summary.totalProfit} decimals={0} />
                    </div>
                    <span className="mt-2 block text-[11px] text-muted">Margin {analytics.summary.overallMargin}%</span>
                  </CardSpotlight>
                  <CardSpotlight className="p-5">
                    <span className="text-xs font-medium text-muted">Average bill</span>
                    <div className="mt-1.5 text-3xl font-light tracking-[-0.03em] text-ink">
                      ₹<NumberTicker value={analytics.summary.avgBillValue} decimals={0} />
                    </div>
                    <span className="mt-2 block text-[11px] text-muted">Cost ₹{analytics.summary.totalCost.toFixed(0)}</span>
                  </CardSpotlight>
                  <CardSpotlight className="p-5">
                    <span className="text-xs font-medium text-muted">Stock at cost</span>
                    <div className="mt-1.5 text-3xl font-light tracking-[-0.03em] text-ink">
                      ₹<NumberTicker value={analytics.summary.totalStockValue} decimals={0} />
                    </div>
                    <span className="mt-2 block text-[11px] text-muted">
                      <span className="tnum">{analytics.summary.totalItems}</span> lines · <span className="tnum">{analytics.summary.lowStockItems}</span> low
                    </span>
                  </CardSpotlight>
                </div>

                <div className="rounded-card border border-line bg-surface p-6">
                  <h3 className="font-semibold text-sm text-ink mb-1">Revenue vs cost, last 12 months</h3>
                  <p className="text-[11px] text-muted mb-4">Bars show revenue; the line beneath each is the profit it carried.</p>
                  <div className="space-y-2.5">
                    {analytics.monthlyData.map((m) => {
                      const max = Math.max(...analytics.monthlyData.map(x => x.revenue), 1);
                      return (
                        <div key={m.month}>
                          <div className="flex items-baseline justify-between gap-3 text-xs">
                            <span className="font-medium text-ink">{m.month}</span>
                            <span className="tnum text-right text-[11px] text-muted">
                              ₹{m.revenue.toFixed(0)} · {m.bills} bill{m.bills === 1 ? '' : 's'} · {m.margin}%
                            </span>
                          </div>
                          <Progress value={m.revenue} max={max} className="mt-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-card border border-line bg-surface p-6">
                    <h3 className="font-semibold text-sm text-ink mb-4">Top dispensing by revenue</h3>
                    {analytics.topMedicines.length === 0 ? (
                      <p className="text-xs text-muted">Nothing dispensed yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.topMedicines.map((item) => {
                          const max = Math.max(...analytics.topMedicines.map(x => x.revenue), 1);
                          return (
                            <div key={item.name}>
                              <div className="flex items-baseline justify-between gap-3 text-xs">
                                <span className="truncate font-medium text-ink">{item.name}</span>
                                <span className="tnum flex-shrink-0 text-[11px] text-muted">{item.qty} units · ₹{item.revenue.toFixed(0)}</span>
                              </div>
                              <Progress value={item.revenue} max={max} className="mt-1.5" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-card border border-line bg-surface p-6">
                      <h3 className="font-semibold text-sm text-ink mb-3">Expiring within 90 days</h3>
                      {analytics.expiryAlerts.length === 0 ? (
                        <p className="text-xs text-muted">No batches expiring soon.</p>
                      ) : (
                        <div className="space-y-2">
                          {analytics.expiryAlerts.slice(0, 8).map((item) => (
                            <div key={item._id || item.medicineName} className="flex items-center justify-between gap-3 rounded-field border border-line bg-canvas px-3 py-2 text-xs">
                              <span className="truncate font-medium text-ink">{item.medicineName}</span>
                              <Badge tone={item.urgency === 'critical' ? 'danger' : item.urgency === 'warning' ? 'warning' : 'neutral'} className="tnum flex-shrink-0">
                                {item.daysLeft}d · {item.units} left
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-card border border-line bg-surface p-6">
                      <h3 className="font-semibold text-sm text-ink mb-3">Slow-moving stock</h3>
                      {analytics.slowMoving.length === 0 ? (
                        <p className="text-xs text-muted">Everything on the shelf is turning over.</p>
                      ) : (
                        <div className="space-y-2">
                          {analytics.slowMoving.slice(0, 8).map((item) => (
                            <div key={item._id || item.medicineName} className="flex items-center justify-between gap-3 rounded-field border border-line bg-canvas px-3 py-2 text-xs">
                              <span className="truncate font-medium text-ink">{item.medicineName}</span>
                              <Badge tone="neutral" className="tnum flex-shrink-0">{item.units} units · idle 30d+</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {analytics.marginAnalysis.length > 0 && (
                  <div className="rounded-card border border-line bg-surface overflow-hidden">
                    <div className="px-6 pt-5 pb-3">
                      <h3 className="font-semibold text-sm text-ink">Margin per medicine</h3>
                      <p className="text-[11px] text-muted mt-0.5">Markup over purchase price, ranked by the revenue each line earned.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-canvas border-y border-line text-muted">
                          <tr>
                            <th className="py-2.5 px-6 font-semibold">Medicine</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Cost</th>
                            <th className="py-2.5 px-4 font-semibold text-right">MRP</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Margin</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Units sold</th>
                            <th className="py-2.5 px-6 font-semibold text-right">Profit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {analytics.marginAnalysis.map((row) => (
                            <tr key={row.medicineName} className="hover:bg-canvas/60 dark:hover:bg-raised/40 transition-colors">
                              <td className="py-2.5 px-6 font-semibold text-ink">{row.medicineName}</td>
                              <td className="py-2.5 px-4 text-right font-mono text-muted tnum">₹{row.purchasePrice.toFixed(2)}</td>
                              <td className="py-2.5 px-4 text-right font-mono text-ink tnum">₹{row.sellingPrice.toFixed(2)}</td>
                              <td className="py-2.5 px-4 text-right font-mono tnum text-accent-ink">{row.margin}%</td>
                              <td className="py-2.5 px-4 text-right font-mono text-ink tnum">{row.unitsSold}</td>
                              <td className="py-2.5 px-6 text-right font-mono font-semibold text-ink tnum">₹{row.profit.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── 5. DISTRIBUTORS / SUPPLIERS TAB ── */}
        {activeTab === 'suppliers' && (
          suppliersLocked ? (
            <PremiumLock
              title="Distributor network"
              blurb="Keep your wholesalers on file, place purchase orders by email and track what has been dispatched — without a paper order book."
            />
          ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm text-ink">Distributor network</h3>
                <p className="text-[11px] text-muted mt-0.5">Orders are emailed to the distributor's address on file.</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if (!canPersist) return showToast('Distributors need a live dispensary connection.', 'error');
                  setShowSupplierModal(true);
                }}
              >
                <Icons.Plus />
                Add distributor
              </Button>
            </div>

            {suppliers.length === 0 && (
              <EmptyState
                icon={Icons.Suppliers}
                title="No distributors yet"
                description="Add the wholesalers you buy from to place purchase orders with them."
              />
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {suppliers.map(sup => (
                <Card key={sup._id} hover className="flex flex-col justify-between p-5">
                  <div>
                    <span className="text-[10px] font-bold text-accent-ink uppercase tracking-wider block mb-1">
                      {sup.leadTime}
                    </span>
                    <h3 className="font-semibold text-base text-ink">{sup.name}</h3>
                    <p className="text-xs text-muted mt-1">{sup.address}</p>

                    <div className="mt-4 space-y-1 border-t border-line pt-3 text-xs text-muted">
                      <div>Contact: <strong className="text-ink">{sup.contactPerson}</strong></div>
                      <div>Phone: <strong className="font-mono text-ink">{sup.phone}</strong></div>
                      <div>Email: <strong className="text-ink">{sup.email}</strong></div>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openOrderModal(sup)}
                    className="mt-4 w-full"
                  >
                    Place purchase order
                  </Button>
                </Card>
              ))}
            </div>
          </div>
          )
        )}

        {/* ── 5b. PURCHASE LISTS TAB ── */}
        {activeTab === 'lists' && (
          <div className="space-y-4">
            {requirementsState === 'locked' && (
              <PremiumLock
                title="Purchase lists"
                blurb="Group everything you are short on into one restock list and send it to any distributor in a single click — instead of phoning each wholesaler separately."
              />
            )}

            {(requirementsState === 'idle' || requirementsState === 'loading') && (
              <div className="rounded-card border border-line bg-surface p-6">
                <SkeletonText lines={4} />
              </div>
            )}

            {requirementsState === 'demo' && (
              <EmptyState
                icon={Icons.Lists}
                title="Purchase lists need a live connection"
                description="Sign in against the dispensary API to build and send restock lists."
              />
            )}

            {requirementsState === 'offline' && (
              <EmptyState
                icon={Icons.Lists}
                title="Could not load purchase lists"
                description="The dispensary API did not answer. Nothing was lost — try again."
                action={<Button variant="secondary" size="sm" onClick={loadRequirements}>Try again</Button>}
              />
            )}

            {requirementsState === 'ready' && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-sm text-ink">Restock lists</h3>
                    <p className="text-[11px] text-muted mt-0.5">Collect short lines, then email the list to a wholesaler.</p>
                  </div>
                  <Button size="sm" onClick={() => { setListTitle(''); setListItems([]); setShowListModal(true); }}>
                    <Icons.Plus />
                    New list
                  </Button>
                </div>

                {requirements.length === 0 ? (
                  <EmptyState
                    icon={Icons.Lists}
                    title="No purchase lists yet"
                    description="Build one from your low-stock lines and send it to a wholesaler."
                    action={
                      <Button size="sm" onClick={() => { setListTitle(''); setListItems([]); setShowListModal(true); }}>
                        Create the first list
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {requirements.map(list => (
                      <div key={list._id} className="rounded-card border border-line bg-surface p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-sm text-ink">{list.title}</h4>
                              <Badge
                                tone={list.status === 'sent' ? 'success' : list.status === 'completed' ? 'accent' : 'warning'}
                                className="uppercase tracking-wider"
                              >
                                {list.status}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted mt-0.5">
                              {list.items?.length || 0} item{(list.items?.length || 0) === 1 ? '' : 's'}
                              {list.createdAt ? ` · created ${new Date(list.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                            </p>
                          </div>

                          <div className="flex flex-shrink-0 items-center gap-2">
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => { setSendListFor(list); setSendListSupplierId(''); }}
                              disabled={!suppliers.length || busyKey === `list-del:${list._id}`}
                              title={suppliers.length ? 'Email this list to a distributor' : 'Add a distributor first'}
                            >
                              Send to distributor
                            </Button>
                            <IconButton
                              size="xs"
                              variant="secondary"
                              onClick={() => handleDeleteList(list)}
                              disabled={busyKey === `list-del:${list._id}`}
                              aria-label={`Delete ${list.title}`}
                              title="Delete list"
                              className="text-danger hover:text-danger"
                            >
                              <Icons.Trash />
                            </IconButton>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(list.items || []).map((item, i) => (
                            <div key={item._id || i} className="flex items-center justify-between gap-3 rounded-field border border-line bg-canvas px-3 py-2 text-xs">
                              <span className="font-semibold text-ink truncate">{item.medicineName}</span>
                              <span className="flex flex-shrink-0 items-center gap-2 font-mono tnum text-muted">
                                {item.quantity} {item.unit || 'units'}
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${item.priority === 'high' ? 'bg-rose-500' : item.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  title={`${item.priority || 'medium'} priority`}
                                />
                              </span>
                            </div>
                          ))}
                        </div>

                        {(list.sentToSuppliers || []).length > 0 && (
                          <p className="mt-3 text-[11px] text-muted">
                            Sent to {Array.from(new Set(list.sentToSuppliers.map(s => s.supplierName).filter(Boolean))).join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── 6. REFILL TRACKER TAB ── */}
        {activeTab === 'customers' && (
          customersLocked ? (
            <PremiumLock
              title="Refill tracker"
              blurb="Keep your chronic patients on file, see who is due, and let the daily job send refill reminders for you."
            />
          ) : (
          <div className="space-y-4">
            <div className="rounded-card border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-sm text-ink mb-1">Patient Chronic Refill Registry</h3>
                  <p className="text-xs text-muted">
                    Send direct reminders to regular neighborhood customers before their medication runs out.
                  </p>
                </div>
                <Button size="sm" onClick={() => openPatientModal()}>
                  <Icons.Plus />
                  Add patient
                </Button>
              </div>

              <div className="mt-4 mb-3">

              {customers.length === 0 && (
                <p className="text-xs text-muted">
                  No regular customers yet. Customers become regulars after a billed visit.
                </p>
              )}

              <div className="space-y-2.5">
                {customers.map(c => {
                  const history = [...(c.reminders || [])].reverse();
                  const expanded = expandedRefillCustomer === c._id;
                  const nextReminder = nextAutoReminderLabel(c.nextAutoReminderAt);
                  const dueSoon = refillDueLabel(c.medicines?.[0]?.refillDay);
                  return (
                    <div key={c._id} className="rounded-field bg-canvas border border-line text-xs">
                      <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm text-ink">{c.name}</span>
                            <span className="font-mono text-[11px] text-muted">{c.phone}</span>
                            {nextReminder && (
                              <Badge
                                tone={nextReminder.tone}
                                title="When the daily job will next contact this patient"
                              >
                                Next auto reminder: {nextReminder.text}
                              </Badge>
                            )}
                            {dueSoon && (
                              <Badge tone={dueSoon.tone} title="This patient's monthly refill day is close">
                                {dueSoon.text}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted mt-0.5 block">
                            Prescription: <strong className="text-accent-ink">{c.medicines?.[0]?.name || 'No medicine on file'}</strong>
                            {c.medicines?.[0]?.refillDay ? ` · Expected refill cycle: Day ${c.medicines[0].refillDay}` : ''}
                          </span>
                          {c.lastReminderAt && (
                            <span className="mt-0.5 block text-[10px] text-success">
                              Last reminded {new Date(c.lastReminderAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              {history.length ? ` · ${history.length} logged` : ''}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                          {history.length > 0 && (
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => setExpandedRefillCustomer(expanded ? null : c._id)}
                              aria-expanded={expanded}
                            >
                              {expanded ? 'Hide history' : `History (${history.length})`}
                            </Button>
                          )}
                          <Button variant="secondary" size="xs" onClick={() => openPatientModal(c)}>
                            Edit
                          </Button>
                          <IconButton
                            size="xs"
                            variant="secondary"
                            onClick={() => handleDeletePatient(c)}
                            disabled={busyKey === `patient-del:${c._id}`}
                            aria-label={`Remove ${c.name}`}
                            title="Remove from registry"
                            className="text-danger hover:text-danger"
                          >
                            <Icons.Trash />
                          </IconButton>
                          <Button
                            size="xs"
                            onClick={() => handleSendReminder(c)}
                            loading={busyKey === `remind:${c._id}`}
                            className="bg-success hover:bg-success/90"
                          >
                            Send refill reminder
                          </Button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="space-y-2 border-t border-line px-3.5 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Reminder history</p>
                          {history.map((reminder, index) => {
                            const status = REMINDER_STATUS[reminder.status] || REMINDER_STATUS.logged;
                            return (
                              <div
                                key={reminder._id || `${reminder.sentAt}-${index}`}
                                className="rounded-lg border border-line bg-surface p-2.5"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge tone={status.tone}>{status.label}</Badge>
                                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                    {REMINDER_CHANNEL[reminder.channel] || reminder.channel}
                                  </span>
                                  <span className="text-[11px] font-semibold text-ink">
                                    {reminder.medicineName || 'All medicines'}
                                  </span>
                                  <span className="ml-auto text-[10px] text-muted tnum">
                                    {formatReminderTime(reminder.sentAt)}
                                  </span>
                                </div>
                                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{reminder.message}</p>
                                {reminder.error && (
                                  <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">Delivery error: {reminder.error}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
          </div>
          )
        )}

        {/* ── 6b. PRICE REQUESTS INBOX TAB ── */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm text-ink">Incoming price requests</h3>
                <p className="text-[11px] text-muted mt-0.5">
                  Patients attach a bill when they think your listed price is off. Approving updates the public price.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => { setRequestsState('idle'); loadRequests(); }}>
                Refresh
              </Button>
            </div>

            {(requestsState === 'idle' || requestsState === 'loading') && (
              <div className="rounded-card border border-line bg-surface p-6">
                <SkeletonText lines={3} />
              </div>
            )}

            {requestsState === 'demo' && (
              <EmptyState
                icon={Icons.Inbox}
                title="The requests inbox needs a live connection"
                description="Sign in against the dispensary API to review patient price requests."
              />
            )}

            {requestsState === 'offline' && (
              <EmptyState
                icon={Icons.Inbox}
                title="Could not load the inbox"
                description="Price requests live in the running API session and disappear on restart."
                action={<Button variant="secondary" size="sm" onClick={loadRequests}>Try again</Button>}
              />
            )}

            {requestsState === 'ready' && (
              requests.length === 0 ? (
                <EmptyState
                  icon={Icons.Inbox}
                  title="No price requests"
                  description="When a patient submits a bill from the results page, it lands here for approval."
                />
              ) : (
                <div className="space-y-3">
                  {requests.map(notif => {
                    const answered = Boolean(notif.pharmacistResponse);
                    const data = notif.submissionData || {};
                    const matches = stock.filter(s =>
                      (s.medicineName || '').toLowerCase().trim() === String(data.medicineName || '').toLowerCase().trim(),
                    );
                    const chosenId = requestChoice[notif.id] ?? (matches[0]?._id || '');
                    return (
                      <div
                        key={notif.id}
                        className={`rounded-card border border-line bg-surface p-5 ${!notif.isRead && !answered ? 'border-l-2 !border-l-accent' : ''}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                tone={
                                  answered
                                    ? notif.pharmacistResponse === 'approved'
                                      ? 'success'
                                      : notif.pharmacistResponse === 'rejected'
                                        ? 'danger'
                                        : 'neutral'
                                    : notif.isRead
                                      ? 'neutral'
                                      : 'accent'
                                }
                                className="uppercase tracking-wider"
                              >
                                {answered ? notif.pharmacistResponse : notif.isRead ? 'Seen' : 'New'}
                              </Badge>
                              <h4 className="font-semibold text-sm text-ink">{notif.title || 'Price Update Request'}</h4>
                              <span className="text-[10px] text-muted tnum">
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-xs text-muted mt-1">{notif.message}</p>
                          </div>

                          {!answered && !notif.isRead && (
                            <Button variant="link" size="xs" onClick={() => handleRequestRead(notif)} className="flex-shrink-0">
                              Mark as seen
                            </Button>
                          )}
                        </div>

                        {(data.medicineName || data.price) && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="rounded-field border border-line bg-canvas px-3 py-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">Medicine</span>
                              <span className="text-xs font-semibold text-ink">{data.medicineName || '—'}</span>
                            </div>
                            <div className="rounded-field border border-line bg-canvas px-3 py-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">Submitted price</span>
                              <span className="text-xs font-semibold font-mono tnum text-ink">₹{data.price ?? '—'}</span>
                            </div>
                            <div className="rounded-field border border-line bg-canvas px-3 py-2">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block">Submitted by</span>
                              <span className="text-xs font-semibold text-ink">{data.userName || 'Anonymous patient'}</span>
                            </div>
                          </div>
                        )}

                        {data.personalNote && (
                          <p className="mt-2 text-[11px] italic text-muted">“{data.personalNote}”</p>
                        )}

                        {!answered ? (
                          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
                            <Field label="Update which inventory row?" htmlFor={`choice-${notif.id}`} className="min-w-52">
                              <Select
                                id={`choice-${notif.id}`}
                                value={chosenId}
                                onChange={e => setRequestChoice(prev => ({ ...prev, [notif.id]: e.target.value }))}
                                className="h-9 py-0 text-xs"
                              >
                                <option value="">Public price only</option>
                                {matches.map(s => (
                                  <option key={s._id} value={s._id}>
                                    {s.medicineName} — {s.batchNo || 'no batch'} ({s.units} left)
                                  </option>
                                ))}
                              </Select>
                            </Field>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRequestRespond(notif, 'rejected')}
                                disabled={busyKey === `req:${notif.id}`}
                                className="text-danger"
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRequestRespond(notif, 'approved')}
                                loading={busyKey === `req:${notif.id}`}
                              >
                                Approve
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-3 text-[11px] text-muted border-t border-line pt-3">
                            {notif.pharmacistResponse === 'approved' && 'Approved — the public price and your stock row were updated.'}
                            {notif.pharmacistResponse === 'rejected' && 'Rejected — the submission was discarded.'}
                            {notif.pharmacistResponse === 'already_processed' && 'Handled elsewhere — no further action needed.'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}

        {/* ── 7. STORE SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div className="max-w-xl rounded-card border border-line bg-surface p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-base text-ink">Dispensary profile & credentials</h3>
              <p className="mt-1 text-xs text-muted">
                The licence and GSTIN are verified at signup and cannot be edited here.
              </p>
            </div>

            <div className="space-y-3">
              <Field label="Store name">
                <Input
                  type="text"
                  value={pharmacist?.name || ''}
                  onChange={e => setPharmacist({ ...pharmacist, name: e.target.value })}
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Pharmacist / owner name">
                  <Input
                    type="text"
                    value={pharmacist?.ownerName || ''}
                    onChange={e => setPharmacist({ ...pharmacist, ownerName: e.target.value })}
                  />
                </Field>

                <Field label="Store phone">
                  <Input
                    type="tel"
                    value={pharmacist?.phone || ''}
                    onChange={e => setPharmacist({ ...pharmacist, phone: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Drug licence number">
                <Input
                  type="text"
                  value={pharmacist?.licenseNo || '—'}
                  disabled
                  className="font-mono"
                />
              </Field>

              <Field label="Address / landmark">
                <Input
                  type="text"
                  value={pharmacist?.address || ''}
                  onChange={e => setPharmacist({ ...pharmacist, address: e.target.value })}
                />
              </Field>

              <Button
                onClick={handleSaveProfile}
                loading={busyKey === 'profile'}
                className="mt-2"
              >
                Save store profile
              </Button>
            </div>
          </div>
        )}

      </main>

      {/* ── MODAL: ADD MEDICINE TO STOCK ── */}
      <Modal
        open={showAddStockModal}
        onClose={closeStockModal}
        title={editingStock ? 'Edit inventory item' : 'Add medicine to live inventory'}
        description={
          editingStock
            ? `Update the shelf record for ${editingStock.medicineName}.`
            : 'Add a formulation to the live shelf — it becomes billable immediately.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeStockModal}>Cancel</Button>
            <Button type="submit" form="stock-form" loading={busyKey === 'stock:save'}>
              {editingStock ? 'Save changes' : 'Save formulation'}
            </Button>
          </>
        }
      >
        <form id="stock-form" onSubmit={handleAddMedicine} className="space-y-4">
          <Field label="Medicine brand name" required>
            <Input
              type="text"
              placeholder="e.g. Paracetamol 650mg"
              value={newStock.medicineName}
              onChange={e => setNewStock({ ...newStock, medicineName: e.target.value })}
              required
            />
          </Field>

          <Field label="Generic / active salt">
            <Input
              type="text"
              placeholder="e.g. Acetaminophen"
              value={newStock.genericName}
              onChange={e => setNewStock({ ...newStock, genericName: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Selling price (₹)" required>
              <Input
                type="number"
                step="0.01"
                placeholder="25.00"
                value={newStock.sellingPrice}
                onChange={e => setNewStock({ ...newStock, sellingPrice: e.target.value })}
                required
              />
            </Field>
            <Field label="Units in stock" required>
              <Input
                type="number"
                placeholder="100"
                value={newStock.units}
                onChange={e => setNewStock({ ...newStock, units: e.target.value })}
                required
              />
            </Field>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: ADD DISTRIBUTOR ── */}
      <Modal
        open={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title="Add distributor"
        description="Keep a wholesaler on file so purchase orders can be emailed instead of phoned in."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSupplierModal(false)}>Cancel</Button>
            <Button type="submit" form="supplier-form" loading={busyKey === 'supplier:add'}>
              Add distributor
            </Button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleAddSupplier} className="space-y-4">
          <Field label="Distributor name" required>
            <Input
              type="text"
              placeholder="e.g. Dwarka Medicos Agency"
              value={supplierForm.name}
              onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input
                type="tel"
                value={supplierForm.phone}
                onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
            </Field>
            <Field label="Order email">
              <Input
                type="email"
                value={supplierForm.email}
                onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Address">
            <Input
              type="text"
              value={supplierForm.address}
              onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      {/* ── MODAL: PLACE PURCHASE ORDER ── */}
      <Modal
        open={Boolean(orderFor)}
        onClose={() => setOrderFor(null)}
        title="Place purchase order"
        description={`${orderFor?.name || ''}${orderFor?.email ? ` · ${orderFor.email}` : ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOrderFor(null)}>Cancel</Button>
            <Button type="submit" form="order-form" loading={busyKey === 'order'}>
              Send order
            </Button>
          </>
        }
      >
        <form id="order-form" onSubmit={handlePlaceOrder} className="space-y-4">
          <Field label="Medicine" required>
            <Input
              type="text"
              list="purchase-order-medicines"
              value={orderForm.medicineName}
              onChange={e => setOrderForm({ ...orderForm, medicineName: e.target.value })}
              required
            />
            <datalist id="purchase-order-medicines">
              {stock.map(s => <option key={s._id} value={s.medicineName} />)}
            </datalist>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity" required>
              <Input
                type="number"
                min="1"
                value={orderForm.quantity}
                onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })}
                required
              />
            </Field>
            <Field label="Expected by">
              <Input
                type="date"
                value={orderForm.expectedDate}
                onChange={e => setOrderForm({ ...orderForm, expectedDate: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              rows={2}
              placeholder="Anything the distributor should know…"
              value={orderForm.notes}
              onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      {/* ── MODAL: STOCK OCR SCANNER ── */}
      <Modal
        open={showOCRModal}
        onClose={() => setShowOCRModal(false)}
        title="Scan purchase bill via OCR"
        description="Upload a wholesaler invoice and the extracted lines land straight in inventory."
        size="lg"
      >
        <StockOCR
          onStockAdded={() => {
            setShowOCRModal(false);
            setReloadKey((key) => key + 1);
            showToast('OCR extracted items added to inventory!');
          }}
          toast={showToast}
        />
      </Modal>

      {/* ── MODAL: ADD / EDIT PATIENT ── */}
      <Modal
        open={showPatientModal}
        onClose={() => { setShowPatientModal(false); setEditingPatient(null); }}
        title={editingPatient ? 'Edit patient record' : 'Add regular patient'}
        description="Regular patients feed the refill registry, the daily job and its reminders."
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowPatientModal(false); setEditingPatient(null); }}>
              Cancel
            </Button>
            <Button type="submit" form="patient-form" loading={busyKey === 'patient:save'}>
              {editingPatient ? 'Save changes' : 'Add patient'}
            </Button>
          </>
        }
      >
        <form id="patient-form" onSubmit={handleSavePatient} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Patient name" required>
              <Input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={patientForm.name}
                onChange={e => setPatientForm({ ...patientForm, name: e.target.value })}
                required
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                placeholder="98xxxxxxxx"
                value={patientForm.phone}
                onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Email">
              <Input
                type="email"
                value={patientForm.email}
                onChange={e => setPatientForm({ ...patientForm, email: e.target.value })}
              />
            </Field>
            <Field label="Locality">
              <Input
                type="text"
                placeholder="Sector 14, Dwarka"
                value={patientForm.address}
                onChange={e => setPatientForm({ ...patientForm, address: e.target.value })}
              />
            </Field>
          </div>

          <div className="border-t border-line pt-4">
            <p className="eyebrow mb-3">
              <span className="h-px w-4 bg-accent/60" aria-hidden="true" />
              Chronic prescription
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Medicine">
                <Input
                  type="text"
                  list="patient-medicines"
                  placeholder="e.g. Metformin 500mg SR"
                  value={patientForm.medicineName}
                  onChange={e => setPatientForm({ ...patientForm, medicineName: e.target.value })}
                />
                <datalist id="patient-medicines">
                  {stock.map(s => <option key={s._id} value={s.medicineName} />)}
                </datalist>
              </Field>
              <Field label="Dosage">
                <Input
                  type="text"
                  placeholder="e.g. 1-0-1 after food"
                  value={patientForm.dosage}
                  onChange={e => setPatientForm({ ...patientForm, dosage: e.target.value })}
                />
              </Field>
              <Field label="Packs per cycle">
                <Input
                  type="number"
                  min="1"
                  value={patientForm.quantity}
                  onChange={e => setPatientForm({ ...patientForm, quantity: e.target.value })}
                />
              </Field>
              <Field label="Refill day of month">
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g. 25"
                  value={patientForm.typicalDate}
                  onChange={e => setPatientForm({ ...patientForm, typicalDate: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <Field label="Notes">
            <Textarea
              rows={2}
              placeholder="Allergies, preferred brands, delivery instructions…"
              value={patientForm.notes}
              onChange={e => setPatientForm({ ...patientForm, notes: e.target.value })}
            />
          </Field>
        </form>
      </Modal>

      {/* ── MODAL: BUILD PURCHASE LIST ── */}
      <Modal
        open={showListModal}
        onClose={() => setShowListModal(false)}
        title="New purchase list"
        description="Collect the lines you are short on, then send them to a wholesaler."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowListModal(false)}>Cancel</Button>
            <Button type="submit" form="list-form" loading={busyKey === 'list:save'}>
              Save purchase list
            </Button>
          </>
        }
      >
        {/* One line at a time */}
        <form onSubmit={handleAddListItem} className="space-y-4 border-b border-line pb-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2">
              <Field label="Medicine" required>
                <Input
                  type="text"
                  list="list-medicines"
                  value={listItemDraft.medicineName}
                  onChange={e => setListItemDraft({ ...listItemDraft, medicineName: e.target.value })}
                  required
                />
                <datalist id="list-medicines">
                  {stock.map(s => <option key={s._id} value={s.medicineName} />)}
                </datalist>
              </Field>
            </div>
            <Field label="Qty" required>
              <Input
                type="number"
                min="1"
                value={listItemDraft.quantity}
                onChange={e => setListItemDraft({ ...listItemDraft, quantity: e.target.value })}
                required
              />
            </Field>
            <Field label="Priority">
              <Select
                value={listItemDraft.priority}
                onChange={e => setListItemDraft({ ...listItemDraft, priority: e.target.value })}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => {
                const low = stock.filter(s => s.units <= (s.minStock || 10));
                if (!low.length) return showToast('Nothing is below its reorder level.', 'error');
                setListItems(prev => {
                  const have = new Set(prev.map(i => i.medicineName.toLowerCase()));
                  const added = low.filter(s => !have.has(s.medicineName.toLowerCase())).map((s, i) => ({
                    medicineName: s.medicineName,
                    quantity: Math.max((s.minStock || 10) - s.units, 10),
                    unit: 'strips',
                    priority: s.units <= s.minStock ? 'high' : 'medium',
                    notes: `${s.units} left, reorder level ${s.minStock || 10}`,
                    _key: `low-${Date.now()}-${i}`,
                  }));
                  if (!added.length) return prev;
                  showToast(`${added.length} low-stock line${added.length === 1 ? '' : 's'} added.`);
                  return [...prev, ...added];
                });
              }}
            >
              Pull low-stock lines
            </Button>
            <Button type="submit" variant="secondary" size="xs">
              Add to list
            </Button>
          </div>
        </form>

        <form id="list-form" onSubmit={handleSaveList} className="space-y-4 pt-4">
          <Field label="List title">
            <Input
              type="text"
              placeholder="e.g. Week 4 restock"
              value={listTitle}
              onChange={e => setListTitle(e.target.value)}
            />
          </Field>

          {listItems.length === 0 ? (
            <p className="rounded-field border border-dashed border-line px-3 py-4 text-center text-[11px] text-muted">
              No lines yet — add one above, or pull everything below its reorder level.
            </p>
          ) : (
            <div className="space-y-2">
              {listItems.map(item => (
                <div key={item._key} className="flex items-center justify-between gap-3 rounded-field border border-line bg-canvas px-3 py-2">
                  <span className="truncate font-semibold text-ink">{item.medicineName}</span>
                  <span className="flex flex-shrink-0 items-center gap-2 font-mono tnum text-muted">
                    {item.quantity} {item.unit}
                    <IconButton
                      size="xs"
                      variant="secondary"
                      type="button"
                      onClick={() => setListItems(prev => prev.filter(i => i._key !== item._key))}
                      aria-label={`Remove ${item.medicineName}`}
                      className="h-6 w-6 text-danger hover:text-danger"
                    >
                      ×
                    </IconButton>
                  </span>
                </div>
              ))}
            </div>
          )}
        </form>
      </Modal>

      {/* ── MODAL: SEND LIST TO DISTRIBUTOR ── */}
      <Modal
        open={Boolean(sendListFor)}
        onClose={() => setSendListFor(null)}
        title="Send purchase list"
        description={`“${sendListFor?.title || ''}” · ${sendListFor?.items?.length || 0} line${(sendListFor?.items?.length || 0) === 1 ? '' : 's'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSendListFor(null)}>Cancel</Button>
            <Button type="submit" form="send-list-form" loading={busyKey === 'list:send'}>
              Send list
            </Button>
          </>
        }
      >
        <form id="send-list-form" onSubmit={handleSendList} className="space-y-4">
          <Field
            label="Distributor"
            required
            hint="The list is emailed to the address on file. Stock itself does not change until you receive the delivery."
          >
            <Select
              value={sendListSupplierId}
              onChange={e => setSendListSupplierId(e.target.value)}
              required
            >
              <option value="">Choose a distributor…</option>
              {suppliers.map(sup => (
                <option key={sup._id} value={sup._id}>
                  {sup.name}{sup.email ? ` · ${sup.email}` : ''}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>

      {/* ── MODAL: PREMIUM UPGRADE ── */}
      <Modal
        open={showUpgradeModal}
        onClose={() => {
          if (upgradeStep === 'creating' || upgradeStep === 'verifying') return;
          setShowUpgradeModal(false);
        }}
        title="Upgrade this dispensary"
        description="Analytics, distributors, purchase lists and automated refill reminders."
        hideClose={upgradeStep === 'creating' || upgradeStep === 'verifying'}
        footer={
          <Button
            onClick={handleUpgrade}
            loading={upgradeStep === 'creating' || upgradeStep === 'verifying'}
            disabled={upgradeStep !== 'idle'}
            className="w-full"
          >
            {upgradeStep === 'creating'
              ? 'Creating order…'
              : upgradeStep === 'waiting'
                ? 'Complete payment in the checkout window…'
                : upgradeStep === 'verifying'
                  ? 'Verifying payment…'
                  : `Upgrade with ${upgradePlan === 'annual' ? 'annual' : 'monthly'} plan`}
          </Button>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[{ id: 'monthly', price: '₹299', cadence: 'per month', note: 'Cancel any time' }, { id: 'annual', price: '₹2,999', cadence: 'per year', note: 'Two months free' }].map(plan => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setUpgradePlan(plan.id)}
                aria-pressed={upgradePlan === plan.id}
                className={cn(
                  'rounded-field border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                  upgradePlan === plan.id
                    ? 'border-accent bg-accent/10'
                    : 'border-line hover:border-accent/50',
                )}
              >
                <span className="tnum block text-xl font-light text-ink">{plan.price}</span>
                <span className="block text-[11px] text-muted">{plan.cadence}</span>
                <span className="mt-1 block text-[10px] font-semibold text-accent-ink">{plan.note}</span>
              </button>
            ))}
          </div>

          <ul className="space-y-1.5 text-xs text-muted">
            {['Sales analytics: revenue, margin, expiry and slow-mover alerts', 'Distributor network and purchase orders', 'Purchase lists emailed to wholesalers', 'Refill reminders and the daily automated job'].map(feature => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-0.5 text-accent-ink"><Icons.Check /></span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <p className="text-center text-[10px] leading-relaxed text-muted">
            Payments run through Razorpay. Without live keys the demo order activates instantly and no money moves.
          </p>
        </div>
      </Modal>

    </div>
  );
}
