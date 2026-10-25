// src/components/Navbar.jsx — a bar that settles into a capsule on scroll
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Globe,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  Moon,
  Route,
  ScanLine,
  Sun,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { NAV_LINKS } from '../lib/content';
import { initials, pick } from '../lib/format';
import { cn } from '../lib/utils';
import Logo from './Logo';
import { Avatar } from './ui/avatar';
import { IconButton } from './ui/button';
import { Switch } from './ui/switch';
import { SegmentedControl } from './ui/tabs';
import { FloatingDock } from './ui/floating-dock';
import { Container } from './ui/section';
import { MobileNavSheet, NavLinks, NavShell, useScrolled } from './ui/nav-shell';
import { clearSession } from '../lib/api';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, toggleLang } = useLang();
  const { dark, toggleTheme } = useTheme();
  const scrolled = useScrolled(18);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [pharmacistInfo, setPharmacistInfo] = useState(null);

  const dropRef = useRef(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('medimap_user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
      const token = localStorage.getItem('pharmacist_token');
      const info = localStorage.getItem('pharmacist_info');
      setPharmacistInfo(token && info ? JSON.parse(info) : null);
    } catch {
      setUser(null);
      setPharmacistInfo(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    setDropdownOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClick(event) {
      if (dropRef.current && !dropRef.current.contains(event.target)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hasPharmacistSession = Boolean(pharmacistInfo);
  // User portal authentication is strictly separated: only patient accounts unlock the user portal.
  const isLoggedIn = Boolean(user);
  const displayName = user?.name || '';
  const firstName = displayName.split(' ')[0] || 'Account';

  function logout() {
    clearSession('patient');
    setUser(null);
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate('/');
  }

  function isActive(to) {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  const dockItems = [
    { title: 'Home', to: '/', icon: Home, active: location.pathname === '/' },
    { title: 'Map', to: '/map', icon: Map, active: isActive('/map') || isActive('/map-view') },
    { title: 'Scan', to: '/scan', icon: ScanLine, active: isActive('/scan') },
    { title: 'Bridge', to: '/bridge', icon: Route, active: isActive('/bridge') },
    {
      title: isLoggedIn ? firstName : 'Account',
      icon: User,
      onClick: () => setMenuOpen(true),
      active: menuOpen,
    },
  ];

  const links = NAV_LINKS.map((link) => ({ to: link.to, label: pick(lang, link.label) }));

  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-4 z-[200] -translate-y-20 rounded-full bg-accent-solid px-4 py-2 text-xs font-medium text-white opacity-0 shadow-float transition-[opacity,transform] duration-200 focus:translate-y-0 focus:opacity-100"
      >
        Skip to content
      </a>

      <header className="fixed inset-x-0 top-0 z-[80]">
        <Container>
          <NavShell scrolled={scrolled} className="py-2">
            <Logo size={28} textSize="text-[15px]" />

            <NavLinks items={links} isActive={isActive} />

            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'mr-1 hidden h-5 w-px bg-line transition-opacity md:block',
                  scrolled ? 'opacity-0' : 'opacity-100',
                )}
                aria-hidden="true"
              />

              <IconButton
                size="sm"
                aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
                onClick={toggleTheme}
                className="hidden sm:inline-flex"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </IconButton>

              <button
                type="button"
                onClick={toggleLang}
                aria-label={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                className="hidden h-9 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink sm:inline-flex"
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                {lang === 'en' ? 'हिंदी' : 'EN'}
              </button>

              {isLoggedIn ? (
                <div ref={dropRef} className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((open) => !open)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                    className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface/80 pl-1 pr-2.5 text-xs font-medium text-ink transition-colors hover:border-accent/40"
                  >
                    <Avatar name={displayName} size="xs" />
                    <span className="max-w-[88px] truncate">{firstName}</span>
                    <ChevronDown
                      className={cn('h-3.5 w-3.5 text-muted transition-transform', dropdownOpen && 'rotate-180')}
                      aria-hidden="true"
                    />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="absolute right-0 top-11 w-56 overflow-hidden rounded-card border border-line bg-surface p-1 shadow-float"
                      >
                        <div className="px-2.5 py-2">
                          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                            Patient account
                          </p>
                          <p className="mt-0.5 truncate text-xs font-medium text-ink">{displayName}</p>
                        </div>
                        <div className="h-px bg-line" />
                        <Link
                          to="/profile"
                          role="menuitem"
                          className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-ink-soft transition-colors hover:bg-raised hover:text-ink"
                        >
                          <User className="h-3.5 w-3.5" />
                          Your profile
                        </Link>
                        <Link
                          to="/points"
                          role="menuitem"
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-ink-soft transition-colors hover:bg-raised hover:text-ink"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          MediPoints
                        </Link>
                        {hasPharmacistSession && (
                          <Link
                            to="/pharmacy-dashboard"
                            role="menuitem"
                            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-accent-ink transition-colors hover:bg-raised"
                          >
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            Switch to Dispensary POS
                          </Link>
                        )}
                        <button
                          type="button"
                          role="menuitem"
                          onClick={logout}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-danger transition-colors hover:bg-danger/10"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden items-center gap-1 md:flex">
                  <Link
                    to="/login"
                    className="rounded-full px-2.5 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/bridge"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent-solid px-3.5 text-xs font-medium text-white transition-colors hover:bg-accent-solid-hover"
                  >
                    Open Bridge
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-soft md:hidden"
              >
                {isLoggedIn ? (
                  <span className="text-[10px] font-medium">{initials(displayName)}</span>
                ) : (
                  <User className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </NavShell>
        </Container>
      </header>

      <FloatingDock items={dockItems} />

      <MobileNavSheet open={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="flex items-center justify-between">
          <Logo size={26} textSize="text-[15px]" />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Mobile" className="mt-4 space-y-0.5">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active ? 'bg-raised font-medium text-ink' : 'text-ink-soft hover:bg-raised',
                )}
              >
                {pick(lang, link.label)}
                {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        <div className="my-4 h-px bg-line" />

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-ink">Language</span>
            <SegmentedControl
              label="Language"
              value={lang}
              onChange={(next) => {
                if (next !== lang) toggleLang();
              }}
              options={[
                { id: 'en', label: 'English' },
                { id: 'hi', label: 'हिंदी' },
              ]}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-ink">Dark appearance</span>
            <Switch checked={dark} onChange={toggleTheme} id="mobile-theme-toggle" />
          </div>
        </div>

        <div className="my-4 h-px bg-line" />

        {isLoggedIn ? (
          <div className="space-y-1">
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:bg-raised"
            >
              <User className="h-4 w-4" />
              Your profile
            </Link>
            <Link
              to="/points"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:bg-raised"
            >
              <Globe className="h-4 w-4" />
              MediPoints
            </Link>
            {hasPharmacistSession && (
              <Link
                to="/pharmacy-dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-accent-ink hover:bg-raised"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dispensary POS
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-danger hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 items-center justify-center rounded-full border border-line text-xs font-medium text-ink"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 items-center justify-center rounded-full bg-accent-solid text-xs font-medium text-white"
              >
                Create account
              </Link>
            </div>
            {hasPharmacistSession && (
              <Link
                to="/pharmacy-dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 items-center justify-center rounded-full border border-line bg-surface text-xs font-medium text-accent-ink hover:bg-raised"
              >
                Open Pharmacist Portal →
              </Link>
            )}
          </div>
        )}
      </MobileNavSheet>
    </>
  );
}
