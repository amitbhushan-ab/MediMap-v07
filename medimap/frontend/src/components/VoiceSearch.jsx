// src/components/VoiceSearch.jsx — one-tap voice search with live transcript
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Mic, Square, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../context/LanguageContext';
import { cn } from '../lib/utils';

const MEDICINES_EN = [
  'paracetamol', 'ibuprofen', 'amoxicillin', 'metformin', 'atorvastatin',
  'cetirizine', 'aspirin', 'azithromycin', 'pantoprazole', 'omeprazole',
  'levothyroxine', 'crocin', 'dolo', 'combiflam',
];
const MEDICINES_HI = ['पैरासिटामोल', 'मेटफॉर्मिन', 'सिट्रीज़िन', 'एज़िथ्रोमाइसिन', 'एस्पिरिन', 'ओमेप्राज़ोल'];

export default function VoiceSearch() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [state, setState] = useState('idle');
  const [liveText, setLiveText] = useState('');
  const [supported, setSupported] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    return () => {
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
    };
  }, []);

  function extractMedicine(text) {
    const lower = text.toLowerCase().trim();
    const allMedicines = [...MEDICINES_EN, ...MEDICINES_HI];
    for (const medicine of allMedicines) {
      if (lower.includes(medicine.toLowerCase())) return medicine;
    }
    const cleaned = lower
      .replace(/search|find|look for|where|show me|i need|do you have|मुझे|दिखाओ|खोजो|ढूंढो|चाहिए/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || text.trim();
  }

  function startListening() {
    if (!supported || state === 'listening') return;
    setState('listening');
    setLiveText('');
    setShowPanel(true);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    let gotFinal = false;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) final += event.results[index][0].transcript;
        else interim += event.results[index][0].transcript;
      }
      setLiveText(final || interim);

      if (final) {
        gotFinal = true;
        setState('processing');
        const medicine = extractMedicine(final);
        setTimeout(() => {
          setState('success');
          setTimeout(() => {
            navigate(`/results?q=${encodeURIComponent(medicine)}`);
            setState('idle');
            setLiveText('');
            setShowPanel(false);
          }, 700);
        }, 250);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setState('error');
      setLiveText('');
      setTimeout(() => {
        setState('idle');
        setShowPanel(false);
      }, 2400);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!gotFinal) {
        setState('idle');
        setShowPanel(false);
      }
    };

    try {
      recognition.start();
    } catch {
      setState('idle');
      setShowPanel(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setState('idle');
    setShowPanel(false);
    setLiveText('');
  }

  if (!supported) return null;

  const labels = {
    idle: lang === 'hi' ? 'वॉइस सर्च' : 'Voice search',
    listening: lang === 'hi' ? 'सुन रहे हैं' : 'Listening',
    processing: lang === 'hi' ? 'खोज रहे हैं' : 'Searching',
    success: lang === 'hi' ? 'मिल गया' : 'Found',
    error: lang === 'hi' ? 'फिर कोशिश करें' : 'Try again',
  };

  const isActive = state === 'listening' || state === 'processing';

  return (
    <>
      <button
        type="button"
        onClick={state === 'listening' ? stopListening : startListening}
        aria-label={labels[state]}
        className={cn(
          'fixed bottom-28 right-[4.5rem] z-[96] flex h-12 w-12 items-center justify-center rounded-full border shadow-float transition-colors lg:right-[4.5rem]',
          state === 'listening'
            ? 'border-danger/30 bg-danger text-white'
            : 'border-line bg-surface text-ink-soft hover:text-accent',
        )}
      >
        {state === 'processing' ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : state === 'success' ? (
          <Check className="h-4 w-4 text-success" aria-hidden="true" />
        ) : state === 'error' ? (
          <X className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Mic className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      <AnimatePresence>
        {showPanel && (
          <motion.aside
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-44 right-4 z-[94] w-[280px] max-w-[calc(100vw-2rem)] rounded-panel border border-line bg-surface p-4 shadow-float lg:right-6"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  state === 'error' ? 'bg-danger' : state === 'success' ? 'bg-success' : 'bg-accent',
                  isActive && 'animate-pulse',
                )}
                aria-hidden="true"
              />
              <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
                {labels[state]}
              </span>
            </div>

            {liveText ? (
              <p className="mt-2 text-sm font-medium leading-snug text-ink">“{liveText}”</p>
            ) : state === 'listening' ? (
              <div className="mt-3 flex h-6 items-center gap-1">
                {[10, 18, 13, 22, 11, 16, 9].map((height, index) => (
                  <span
                    key={index}
                    className="w-0.5 animate-bounce rounded-full bg-accent"
                    style={{ height, animationDelay: `${index * 90}ms` }}
                    aria-hidden="true"
                  />
                ))}
                <span className="ml-2 text-[11px] text-muted">
                  {lang === 'hi' ? 'अब बोलें…' : 'Speak now…'}
                </span>
              </div>
            ) : null}

            {state === 'error' && (
              <p className="mt-2 text-[11px] leading-relaxed text-danger">
                {lang === 'hi' ? 'कुछ सुनाई नहीं दिया। दोबारा कोशिश करें।' : 'Nothing was picked up. Try again.'}
              </p>
            )}

            {state === 'listening' && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted">
                  {lang === 'hi' ? 'दवा का नाम बोलें' : 'Say a medicine name'}
                </span>
                <button
                  type="button"
                  onClick={stopListening}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-line px-2.5 text-[10px] font-medium text-ink-soft hover:border-line-strong"
                >
                  <Square className="h-2.5 w-2.5" aria-hidden="true" />
                  {lang === 'hi' ? 'रोकें' : 'Stop'}
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
