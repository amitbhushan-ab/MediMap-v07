// src/App.jsx — routing shell
import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LangProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import { Skeleton } from './components/ui/skeleton';

// Routes are split so the first paint only pays for the shell and the page in view.
const HomePage = lazy(() => import('./pages/HomePage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const MapViewPage = lazy(() => import('./pages/MapViewPage'));
const ScanPrescription = lazy(() => import('./pages/ScanPrescription'));
const PharmacyDetailPage = lazy(() => import('./pages/PharmacyDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SubmitPricePage = lazy(() => import('./pages/SubmitPricePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const MediPoints = lazy(() => import('./pages/MediPoints'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const BridgePage = lazy(() => import('./pages/BridgePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const PharmacistDashboard = lazy(() => import('./pages/PharmacistDashboard'));

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppInner />
        </BrowserRouter>
      </LangProvider>
    </ThemeProvider>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Let the router own the scroll position: a reload or deep link should
    // start at the top instead of resuming wherever the browser left off.
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
  }, [pathname]);

  return null;
}

/** Quiet placeholder that keeps the page frame from collapsing while a route loads. */
function RouteFallback() {
  return (
    <div className="min-h-[70vh] bg-canvas" role="status" aria-label="Loading page">
      <div className="mx-auto w-full max-w-page px-5 pt-24 sm:px-7">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-10 w-3/5 max-w-md" />
        <Skeleton className="mt-3 h-3 w-4/5 max-w-lg" />
        <Skeleton className="mt-3 h-3 w-2/3 max-w-sm" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36 rounded-card" />
          <Skeleton className="h-36 rounded-card" />
          <Skeleton className="h-36 rounded-card" />
        </div>
      </div>
    </div>
  );
}

function AppInner() {
  const location = useLocation();
  const isPharmacist =
    location.pathname.startsWith('/pharmacy-dashboard') ||
    location.pathname.startsWith('/pharmacist-dashboard');
  const isAuth = location.pathname === '/login' || location.pathname === '/signup';
  const isAdmin = location.pathname.startsWith('/admin');
  const hideFooter = isAuth || isAdmin;

  // The pharmacist portal is a separate application shell.
  if (isPharmacist) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <PharmacistDashboard />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <ScrollToTop />
      <Navbar />
      <main id="main">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/results" element={<Pad><ResultsPage /></Pad>} />
            <Route path="/map" element={<Pad><MapViewPage /></Pad>} />
            <Route path="/map-view" element={<Pad><MapViewPage /></Pad>} />
            <Route path="/scan" element={<ScanPrescription />} />
            <Route path="/bridge" element={<BridgePage />} />
            <Route path="/pharmacy/:id" element={<Pad><PharmacyDetailPage /></Pad>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/profile" element={<Pad><ProfilePage /></Pad>} />
            <Route path="/submit-price" element={<Pad><SubmitPricePage /></Pad>} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/points" element={<Pad><MediPoints /></Pad>} />
            <Route path="/about" element={<Pad><AboutPage /></Pad>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      {!hideFooter && <Footer />}
      <ChatBot />
    </div>
  );
}

function Pad({ children }) {
  return <div className="min-h-[calc(100vh-4rem)] pt-16">{children}</div>;
}
