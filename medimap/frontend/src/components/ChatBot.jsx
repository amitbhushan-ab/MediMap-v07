// src/components/ChatBot.jsx — in-app assistant for prices, stock, and navigation
import { useEffect, useRef, useState } from 'react';
import { CircleAlert, MessageCircle, Mic, RotateCcw, Send, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../context/LanguageContext';
import { cn } from '../lib/utils';
import { API_BASE } from '../lib/api';
import { IconButton } from './ui/button';

const SUGGESTIONS = {
  en: [
    'Where is Paracetamol cheapest?',
    'How does Bridge mode work?',
    'What can I scan?',
    'How do MediPoints work?',
  ],
  hi: [
    'पैरासिटामोल सबसे सस्ता कहाँ है?',
    'ब्रिज मोड कैसे काम करता है?',
    'मैं क्या स्कैन कर सकता हूँ?',
    'मेडीपॉइंट्स कैसे काम करते हैं?',
  ],
};

const WELCOME = {
  en: 'Ask about a medicine price, nearby stock, or how the app works. For dosage or side effects, please speak to a pharmacist or doctor.',
  hi: 'दवा की कीमत, पास का स्टॉक, या ऐप कैसे काम करता है — कुछ भी पूछें। खुराक या साइड इफेक्ट के लिए फार्मासिस्ट या डॉक्टर से बात करें।',
};

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted"
          style={{ animationDelay: `${index * 140}ms` }}
        />
      ))}
    </div>
  );
}

export default function ChatBot({ userLocation }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const suggestions = SUGGESTIONS[lang] || SUGGESTIONS.en;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: WELCOME[lang] || WELCOME.en, time: formatTime(new Date()) }]);
      const timer = setTimeout(() => inputRef.current?.focus(), 220);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, lang, messages.length]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function getLocalReply(content) {
    const text = content.toLowerCase();
    const asksAboutSelf =
      text.includes('model') ||
      text.includes('groq') ||
      text.includes('llama') ||
      text.includes('gpt') ||
      text.includes('who are you') ||
      text.includes('what are you') ||
      text.includes('which ai') ||
      text.includes('your name') ||
      text.includes('तुम कौन') ||
      text.includes('आप कौन');

    if (asksAboutSelf) {
      return lang === 'hi'
        ? 'मैं मेडीमैप सहायक हूँ। मैं दवाओं की कीमत, आसपास का स्टॉक और ऐप के इस्तेमाल में मदद करता हूँ। मैं चिकित्सकीय सलाह नहीं देता।'
        : "I'm the MediMap assistant. I help with medicine prices, nearby stock, and how the app works. I don't give medical advice.";
    }
    return null;
  }

  async function sendMessage(text) {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput('');
    setError('');

    const userMessage = { role: 'user', content, time: formatTime(new Date()) };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    const localReply = getLocalReply(content);
    if (localReply) {
      setMessages((previous) => [
        ...previous,
        { role: 'assistant', content: localReply, time: formatTime(new Date()) },
      ]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({ role: message.role, content: message.content })),
          lang,
          userLocation,
        }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            data.reply ||
            data.message ||
            (lang === 'hi' ? 'कोई उत्तर नहीं मिला।' : 'No response received.'),
          time: formatTime(new Date()),
        },
      ]);
    } catch (err) {
      const isNetwork =
        err.message.includes('fetch') ||
        err.message.includes('Failed') ||
        err.message.includes('NetworkError');
      setError(
        isNetwork
          ? lang === 'hi'
            ? 'सर्वर से संपर्क नहीं हो सका। दोबारा कोशिश करें।'
            : 'Could not reach the server. Try again in a moment.'
          : err.message,
      );
    }
    setLoading(false);
  }

  function startVoice() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => sendMessage(transcript), 100);
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  }

  function clearChat() {
    setMessages([{ role: 'assistant', content: WELCOME[lang] || WELCOME.en, time: formatTime(new Date()) }]);
    setError('');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        className={cn(
          'fixed bottom-6 right-6 z-[96] flex h-12 items-center gap-2 rounded-full px-4 text-xs font-medium shadow-float transition-colors',
          open ? 'bg-ink text-canvas' : 'bg-accent-solid text-white hover:bg-accent-solid-hover',
        )}
      >
        {open ? <X className="h-4 w-4" aria-hidden="true" /> : <MessageCircle className="h-4 w-4" aria-hidden="true" />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Assistant'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            role="dialog"
            aria-label="MediMap assistant"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-3 bottom-20 top-20 z-[95] flex flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-float sm:inset-x-auto sm:bottom-20 sm:right-6 sm:top-auto sm:h-[min(600px,calc(100dvh-7rem))] sm:w-[400px]"
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[13px] font-medium text-ink">MediMap assistant</h2>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted">
                    Prices, stock, and app help · not medical advice
                  </p>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center">
                {messages.length > 1 && (
                  <IconButton size="sm" onClick={clearChat} aria-label="Reset conversation">
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  </IconButton>
                )}
                <IconButton size="sm" onClick={() => setOpen(false)} aria-label="Close assistant">
                  <X className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              </div>
            </header>

            <div
              role="log"
              aria-live="polite"
              className="flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4"
            >
              {messages.map((message, index) => {
                const isAssistant = message.role === 'assistant';
                return (
                  <div
                    key={`${message.time}-${index}`}
                    className={cn('flex gap-2', isAssistant ? 'justify-start' : 'justify-end')}
                  >
                    {isAssistant && (
                      <span className="mt-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <MessageCircle className="h-3 w-3" aria-hidden="true" />
                      </span>
                    )}
                    <div className={cn('flex max-w-[84%] flex-col gap-1', isAssistant ? 'items-start' : 'items-end')}>
                      <div
                        className={cn(
                          'whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                          isAssistant
                            ? 'rounded-bl-md border border-line bg-surface text-ink-soft'
                            : 'rounded-br-md bg-accent-solid text-white',
                        )}
                      >
                        {message.content}
                      </div>
                      <span className="px-1 text-[10px] text-muted">{message.time}</span>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-2">
                  <span className="mt-auto flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <MessageCircle className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <div className="rounded-2xl rounded-bl-md border border-line bg-surface">
                    <TypingDots />
                  </div>
                </div>
              )}

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-field border border-danger/25 bg-danger/5 p-2.5 text-[11px] text-danger">
                  <CircleAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
              <div className="border-t border-line bg-surface px-4 py-3">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                  {lang === 'hi' ? 'सुझाए गए प्रश्न' : 'Suggested questions'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => sendMessage(suggestion)}
                      className="rounded-full border border-line bg-raised px-2.5 py-1 text-left text-[11px] text-ink-soft transition-colors hover:border-accent/40 hover:text-accent-ink"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-line p-3">
              <div className="flex items-end gap-1.5">
                <label htmlFor="assistant-input" className="sr-only">
                  Message the assistant
                </label>
                <input
                  ref={inputRef}
                  id="assistant-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={
                    lang === 'hi'
                      ? 'दवा, कीमत या ऐप के बारे में पूछें…'
                      : 'Ask about a medicine, price, or the app…'
                  }
                  className="h-10 min-w-0 flex-1 rounded-field border border-line-strong/70 bg-surface px-3 text-xs text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted focus:border-accent focus:ring-[3px] focus:ring-accent/15"
                />
                <IconButton
                  size="sm"
                  onClick={startVoice}
                  aria-label={listening ? 'Stop voice input' : 'Ask by voice'}
                  aria-pressed={listening}
                  className={cn('h-10 w-10', listening && 'bg-danger/10 text-danger')}
                >
                  <Mic className="h-4 w-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="primary"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className="h-10 w-10"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted">
                {lang === 'hi'
                  ? 'चिकित्सकीय सलाह नहीं। खुराक या साइड इफेक्ट के लिए फार्मासिस्ट या डॉक्टर से पूछें।'
                  : 'Not medical advice. Ask a pharmacist or doctor about dosage or side effects.'}
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
