// src/lib/motion.js — shared motion language
// One easing curve and a small set of variants keeps every reveal consistent.
import { useReducedMotion } from 'framer-motion';

export const EASE = [0.16, 1, 0.3, 1];

export const viewport = { once: true, amount: 0.25 };

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

export const stagger = (delayChildren = 0.05, staggerChildren = 0.07) => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
});

/** Animations respect the OS setting; components should gate transforms on this. */
export function useMotionSafe() {
  return !useReducedMotion();
}
