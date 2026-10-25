// frontend/src/components/Logo.jsx — Apple-Caliber Precision Logo for MediMap
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

/**
 * Apple-Level Brand Emblem for MediMap
 * 
 * Geometry Architecture:
 * - Mathematical iOS Superellipse (G2 continuous curvature)
 * - Sapphire Glass Optical Lighting: Diffuse top specular shine + micro-milled hairline rim
 * - Core Iconography: Seamless synthesis of the Medicine Capsule (Health) + Map Beacon (Navigation) + Letter 'M'
 * - Ambient Depth: Dual drop-shadow system calibrated for both OLED Dark Mode and Paper Light Mode
 */
export function LogoIcon({ size = 32, className = '' }) {
  return (
    <div 
      className={cn(
        'relative inline-flex items-center justify-center flex-shrink-0 transition-transform duration-300 ease-out group-hover:scale-[1.05] group-hover:rotate-[-1deg] select-none',
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(83,58,253,0.28)] dark:drop-shadow-[0_6px_16px_rgba(83,58,253,0.45)]"
      >
        <defs>
          {/* Apple Sapphire Surface Gradient */}
          <linearGradient id="appleSquircleGrad" x1="16" y1="12" x2="108" y2="112" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6754fe" />
            <stop offset="42%" stopColor="#533afd" />
            <stop offset="78%" stopColor="#432bd8" />
            <stop offset="100%" stopColor="#2e19a6" />
          </linearGradient>

          {/* Subsurface Light Radial Accent */}
          <radialGradient id="appleCenterGlow" cx="50%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#8d7eff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#533afd" stopOpacity="0" />
          </radialGradient>

          {/* Inset Hairline Specular Rim */}
          <linearGradient id="appleRimHighlight" x1="60" y1="2" x2="60" y2="118" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="75%" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
          </linearGradient>

          {/* Translucent Horizontal Capsule Fill */}
          <linearGradient id="appleCapsuleHoriz" x1="28" y1="52" x2="92" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#f0ecff" stopOpacity="0.92" />
          </linearGradient>

          {/* Vertical Pin / Capsule Gradient */}
          <linearGradient id="applePinVertical" x1="60" y1="24" x2="60" y2="98" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="65%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#dcd4ff" stopOpacity="0.88" />
          </linearGradient>

          {/* Vitality Core Beacon Glow (Ruby / Coral Accent) */}
          <linearGradient id="appleVitalityRuby" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff4d79" />
            <stop offset="100%" stopColor="#ea2261" />
          </linearGradient>

          {/* Apple Shadow Filters */}
          <filter id="appleSymbolShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#140866" floodOpacity="0.38" />
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.18" />
          </filter>

          <filter id="appleBeaconGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#ea2261" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* ── 1. MATHEMATICAL SQUIRCLE (Apple G2 Superellipse) ── */}
        <path 
          d="M 60,2 C 86,2 110,6 116,24 C 122,42 118,78 116,96 C 110,114 86,118 60,118 C 34,118 10,114 4,96 C -2,78 2,42 4,24 C 10,6 34,2 60,2 Z" 
          fill="url(#appleSquircleGrad)" 
        />
        
        {/* Subsurface Radial Bloom */}
        <path 
          d="M 60,2 C 86,2 110,6 116,24 C 122,42 118,78 116,96 C 110,114 86,118 60,118 C 34,118 10,114 4,96 C -2,78 2,42 4,24 C 10,6 34,2 60,2 Z" 
          fill="url(#appleCenterGlow)" 
        />

        {/* Precision Inset Specular Glass Rim */}
        <path 
          d="M 60,3.5 C 85,3.5 108,7.5 114,24.5 C 120,41.5 116.5,77.5 114,94.5 C 108,111.5 85,116.5 60,116.5 C 35,116.5 12,111.5 6,94.5 C 0,77.5 3.5,41.5 6,24.5 C 12,7.5 35,3.5 60,3.5 Z" 
          stroke="url(#appleRimHighlight)" 
          strokeWidth="1.75" 
          fill="none" 
        />

        {/* Top Arc Ambient Specular Highlight */}
        <ellipse 
          cx="60" 
          cy="20" 
          rx="36" 
          ry="10" 
          fill="#ffffff" 
          fillOpacity="0.14" 
        />

        {/* ── 2. THE EMBLEM: Navigation Map Pin + Medicine Cross Capsule ── */}
        <g filter="url(#appleSymbolShadow)">
          
          {/* Vertical Geolocation Tapered Body (Forms the Pin Point & Cross Vertical) */}
          <path 
            d="M 49,36 C 49,29.92 53.92,25 60,25 C 66.08,25 71,29.92 71,36 L 71,64 C 71,73.5 65.5,84 61.8,91.8 C 61.0,93.5 59.0,93.5 58.2,91.8 C 54.5,84 49,73.5 49,64 Z" 
            fill="url(#applePinVertical)" 
          />

          {/* Horizontal Medicine Capsule (Overlapping at optical center) */}
          <rect 
            x="24" 
            y="42" 
            width="72" 
            height="22" 
            rx="11" 
            fill="url(#appleCapsuleHoriz)" 
          />

          {/* Capsule Center Partition Line (Precision Milled Groove) */}
          <line 
            x1="60" 
            y1="43" 
            x2="60" 
            y2="63" 
            stroke="#533afd" 
            strokeOpacity="0.16" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
          />

          {/* Medical Plus Highlight Notch at Center */}
          <rect 
            x="54" 
            y="47" 
            width="12" 
            height="12" 
            rx="3.5" 
            fill="#533afd" 
            fillOpacity="0.10" 
          />
        </g>

        {/* ── 3. RADIAL BEACON PULSE (The Aperture / Heartbeat) ── */}
        <circle 
          cx="60" 
          cy="53" 
          r="6.5" 
          fill="#533afd" 
        />
        
        <circle 
          cx="60" 
          cy="53" 
          r="3" 
          fill="#ffffff" 
        />

        {/* ── 4. SATELLITE LIVE VERIFICATION BEACON (Apple Vitality Ruby) ── */}
        <g filter="url(#appleBeaconGlow)">
          <circle 
            cx="89" 
            cy="31" 
            r="6" 
            fill="url(#appleVitalityRuby)" 
          />
          <circle 
            cx="89" 
            cy="31" 
            r="7.5" 
            stroke="#ffffff" 
            strokeOpacity="0.85" 
            strokeWidth="1.5" 
            fill="none" 
          />
          <circle 
            cx="87.5" 
            cy="29.5" 
            r="1.8" 
            fill="#ffffff" 
            fillOpacity="0.8" 
          />
        </g>
      </svg>
    </div>
  );
}

/**
 * Full Apple-Grade MediMap Logo with Proportional Wordmark
 */
export default function Logo({ 
  to = '/', 
  size = 32, 
  textSize = 'text-[16px]', 
  showText = true, 
  className = '',
  textClassName = '',
}) {
  const content = (
    <div className={cn('inline-flex items-center gap-2.5 group select-none', className)}>
      <LogoIcon size={size} />
      {showText && (
        <span className={cn('font-semibold tracking-[-0.035em] text-[#0d253d] dark:text-white flex items-center leading-none', textSize, textClassName)}>
          <span>Medi</span>
          <span className="text-[#533afd] dark:text-[#8b7eff] transition-colors duration-200">Map</span>
          {/* Subtle live radar dot in wordmark */}
          <span className="w-1.5 h-1.5 rounded-full bg-[#ea2261] ml-0.5 inline-block opacity-90 group-hover:scale-125 transition-transform" />
        </span>
      )}
    </div>
  );

  if (!to) return content;
  return (
    <Link to={to} aria-label="MediMap home" className="focus:outline-none inline-block">
      {content}
    </Link>
  );
}
