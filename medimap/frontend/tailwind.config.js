/** @type {import('tailwindcss').Config} */

// Semantic colours resolve through CSS channels defined in src/index.css.
// Every token works in light and dark mode without a `dark:` duplicate.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sohne-var', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'sohne-var', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        raised: token('raised'),
        sunken: token('sunken'),
        ink: {
          DEFAULT: token('ink'),
          soft: token('ink-soft'),
        },
        muted: token('muted'),
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        accent: {
          DEFAULT: token('accent'),
          soft: token('accent-soft'),
          wash: token('accent-wash'),
          ink: token('accent-ink'),
          solid: token('accent-solid'),
          'solid-hover': token('accent-solid-hover'),
        },
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
        navy: token('navy'),
        cream: token('cream'),

        // Legacy aliases kept so untouched surfaces never break.
        stripe: {
          primary: '#533afd',
          'primary-deep': '#4434d4',
          'primary-press': '#2e2b8c',
          'primary-soft': '#665efd',
          'primary-subdued': '#b9b9f9',
          'brand-dark': '#1c1e54',
          ink: '#0d253d',
          'ink-secondary': '#273951',
          'ink-mute': '#64748d',
          'canvas-soft': '#f6f9fc',
          hairline: '#e3e8ee',
          ruby: '#ea2261',
        },
        clay: {
          canvas: '#f6f9fc',
          ink: '#0d253d',
          body: '#273951',
          muted: '#64748d',
          hairline: '#e3e8ee',
          pink: '#ea2261',
          teal: '#1c1e54',
          lavender: '#b9b9f9',
          peach: '#f5e9d4',
          mint: '#00d4b8',
        },
        brand: {
          blue: '#533afd',
          indigo: '#533afd',
          teal: '#00d4b8',
          green: '#059669',
          amber: '#b45309',
          red: '#be185d',
        },
      },
      borderRadius: {
        card: '14px',
        panel: '20px',
        field: '10px',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(13 37 61 / 0.04), 0 1px 3px rgb(13 37 61 / 0.06)',
        lift: '0 10px 30px -12px rgb(13 37 61 / 0.18), 0 2px 6px rgb(13 37 61 / 0.05)',
        float: '0 24px 60px -24px rgb(13 37 61 / 0.3), 0 4px 12px rgb(13 37 61 / 0.06)',
        inset: 'inset 0 1px 0 rgb(255 255 255 / 0.08)',
      },
      letterSpacing: {
        display: '-0.035em',
      },
      maxWidth: {
        page: '1200px',
        prose: '68ch',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fadeIn 0.3s ease both',
        marquee: 'marquee var(--marquee-duration, 44s) linear infinite',
        'marquee-reverse': 'marquee var(--marquee-duration, 44s) linear infinite reverse',
        spotlight: 'spotlight 2.4s ease 0.4s 1 forwards',
        shimmer: 'shimmer 2.8s linear infinite',
        aurora: 'aurora 48s linear infinite',
        beam: 'beam 7s ease-in-out infinite',
        float: 'float 7s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        meteor: 'meteor 5s linear infinite',
        'spin-slow': 'spin 2.4s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        marquee: {
          to: { transform: 'translateX(-50%)' },
        },
        spotlight: {
          '0%': { opacity: '0', transform: 'translate(-60%, -60%) scale(0.6)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -45%) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 50%' },
          '100%': { backgroundPosition: '-200% 50%' },
        },
        aurora: {
          from: { backgroundPosition: '50% 50%, 50% 50%' },
          to: { backgroundPosition: '350% 50%, 350% 50%' },
        },
        beam: {
          '0%, 100%': { transform: 'translateY(-10%)', opacity: '0' },
          '10%': { opacity: '0.7' },
          '50%': { transform: 'translateY(60%)', opacity: '0.35' },
          '90%': { opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        meteor: {
          '0%': { transform: 'rotate(215deg) translateX(0)', opacity: '1' },
          '70%': { opacity: '1' },
          '100%': { transform: 'rotate(215deg) translateX(-600px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
