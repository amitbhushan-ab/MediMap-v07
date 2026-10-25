// frontend/src/pages/ScanPrescription.jsx — read a prescription image in the browser
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  ScanLine,
  Search,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { useLang } from '../context/LanguageContext';
import { formatPrice } from '../lib/format';
import { useMotionSafe } from '../lib/motion';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/badge';
import { Button, IconButton } from '../components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { Skeleton } from '../components/ui/skeleton';
import { Sparkles } from '../components/ui/sparkles';
import { Container, PageHeader, Section } from '../components/ui/section';
import { GridPattern } from '../components/ui/grid-pattern';
import { StepLoader } from '../components/ui/step-loader';

const STAGES = {
  'loading tesseract core': { en: 'Starting the image reader', hi: 'छवि पढ़ने की शुरुआत' },
  'initializing tesseract': { en: 'Getting ready to read', hi: 'पढ़ने की तैयारी' },
  'loading language traineddata': { en: 'Loading language data', hi: 'भाषा डेटा लोड हो रहा है' },
  'initializing api': { en: 'Preparing the reader', hi: 'पढ़ने की तैयारी' },
  'recognizing text': { en: 'Reading the image', hi: 'छवि पढ़ी जा रही है' },
};

const COPY = {
  en: {
    eyebrow: 'Prescription',
    title: 'Scan a prescription',
    lead: 'Read the image, then check each line before searching.',
    imageTitle: 'Prescription image',
    imageHint: 'One clear photo, taken straight on.',
    formats: 'JPG · PNG',
    choose: 'Choose an image or drag it here',
    formatsLine: 'JPG or PNG · up to 10 MB',
    replace: 'Replace',
    remove: 'Remove image',
    fileHint: 'Click the image to choose another file',
    read: 'Read the image',
    reading: 'Reading the image',
    whatImage: 'What happens to the image',
    whatImageBody: 'The image is read in this browser. It is not uploaded.',
    idleTitle: 'Nothing read yet',
    idleBody: 'Choose an image on the left. After reading, check each line before searching.',
    readyTitle: 'Image ready to read',
    readyBody: 'Use Read the image on the left, then check each line before searching.',
    completeTitle: 'A complete prescription shows',
    completeItems: [
      'Doctor registration and clinic',
      'Date of consultation',
      'Patient name and age',
      'Medicine name and strength',
    ],
    manual: 'Enter medicines manually',
    readingTitle: 'Reading the image',
    readingHint: 'This runs in your browser.',
    preparing: 'Getting ready to read',
    scanSteps: ['Preparing the image', 'Reading the handwriting', 'Extracting medicine lines'],
    scanningHint: 'Keep this tab open. Reading can take up to half a minute on a slow connection.',
    resultsTitle: 'Extracted medicines',
    resultsHint: 'Read the image, then check each line before searching.',
    line: 'line',
    lines: 'lines',
    scanAnother: 'Scan another',
    nameLabel: 'Medicine name',
    namePlaceholder: 'e.g. Paracetamol 500 mg',
    searchKey: 'Searches as',
    qty: 'Qty',
    searchLine: 'Search this line',
    removeLine: 'Remove this line',
    searchThese: 'Search these medicines',
    searchTheseHint: 'Opens the first named line.',
    addLine: 'Add a line',
    emptyLines: 'No lines yet. Add a line to search a medicine.',
    rawTitle: 'Raw text from the image',
    hide: 'Hide',
    notice:
      'The image reader can misread handwriting. Check each medicine with your doctor or pharmacist before buying.',
    noDetected: 'No medicines were detected automatically. Fill the lines in from the text below.',
    scanFailed: 'Could not read the image: ',
  },
  hi: {
    eyebrow: 'पर्ची',
    title: 'पर्ची स्कैन करें',
    lead: 'छवि पढ़ें, फिर खोजने से पहले हर पंक्ति जाँचें।',
    imageTitle: 'पर्ची की छवि',
    imageHint: 'एक साफ़ तस्वीर, सीधे खींची हुई।',
    formats: 'JPG · PNG',
    choose: 'छवि चुनें या यहाँ खींचकर छोड़ें',
    formatsLine: 'JPG या PNG · 10 MB तक',
    replace: 'बदलें',
    remove: 'छवि हटाएँ',
    fileHint: 'दूसरी फ़ाइल चुनने के लिए छवि पर क्लिक करें',
    read: 'छवि पढ़ें',
    reading: 'छवि पढ़ी जा रही है',
    whatImage: 'छवि का क्या होता है',
    whatImageBody: 'छवि इसी ब्राउज़र में पढ़ी जाती है। यह कहीं अपलोड नहीं होती।',
    idleTitle: 'अभी कुछ नहीं पढ़ा गया',
    idleBody: 'बाईं ओर से छवि चुनें। पढ़ने के बाद खोजने से पहले हर पंक्ति जाँचें।',
    readyTitle: 'छवि तैयार है',
    readyBody: 'बाईं ओर की छवि पढ़ें, फिर खोजने से पहले हर पंक्ति जाँचें।',
    completeTitle: 'पूरी पर्ची में ये बातें होती हैं',
    completeItems: [
      'डॉक्टर का पंजीकरण और क्लिनिक',
      'परामर्श की तारीख',
      'मरीज़ का नाम और उम्र',
      'दवा का नाम और उसकी मात्रा',
    ],
    manual: 'दवाइयाँ हाथ से लिखें',
    readingTitle: 'छवि पढ़ी जा रही है',
    readingHint: 'यह काम आपके ब्राउज़र में होता है।',
    preparing: 'पढ़ने की तैयारी',
    scanSteps: ['छवि तैयार हो रही है', 'लिखावट पढ़ी जा रही है', 'दवाओं की पंक्तियाँ निकाली जा रही हैं'],
    scanningHint: 'यह टैब खुला रखें। धीमे कनेक्शन पर पढ़ने में आधा मिनट तक लग सकता है।',
    resultsTitle: 'निकाली गई दवाइयाँ',
    resultsHint: 'छवि पढ़ें, फिर खोजने से पहले हर पंक्ति जाँचें।',
    line: 'पंक्ति',
    lines: 'पंक्तियाँ',
    scanAnother: 'दूसरी छवि',
    nameLabel: 'दवा का नाम',
    namePlaceholder: 'जैसे पैरासिटामोल 500 mg',
    searchKey: 'इस नाम से खोजा जाएगा',
    qty: 'मात्रा',
    searchLine: 'इस पंक्ति को खोजें',
    removeLine: 'यह पंक्ति हटाएँ',
    searchThese: 'इन दवाओं को खोजें',
    searchTheseHint: 'पहली भरी हुई पंक्ति के लिए खोज खुलती है।',
    addLine: 'पंक्ति जोड़ें',
    emptyLines: 'अभी कोई पंक्ति नहीं है। दवा खोजने के लिए पंक्ति जोड़ें।',
    rawTitle: 'छवि से पढ़ा गया पाठ',
    hide: 'छिपाएँ',
    notice:
      'हाथ से लिखी पर्ची गलत पढ़ी जा सकती है। खरीदने से पहले हर दवा अपने डॉक्टर या फार्मासिस्ट से जाँच लें।',
    noDetected: 'कोई दवा अपने आप नहीं पहचानी गई। नीचे दिए पाठ से पंक्तियाँ भरें।',
    scanFailed: 'छवि पढ़ी नहीं जा सकी: ',
  },
};

function emptyMedicine() {
  return { name: '', searchName: '', dosage: '', quantity: '1', price: '' };
}

function formatFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function stageLabel(status, lang) {
  const stage = STAGES[status];
  if (!stage) return lang === 'hi' ? 'छवि पढ़ी जा रही है' : 'Reading the image';
  return lang === 'hi' ? stage.hi : stage.en;
}

export default function ScanPrescription() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const copy = COPY[lang] || COPY.en;
  const motionSafe = useMotionSafe();

  const fileRef = useRef(null);
  const previewUrlRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [step, setStep] = useState('upload');
  const [error, setError] = useState('');

  // Object URLs created for the preview are released when they are replaced or the page closes.
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  function handleFile(e) {
    if (scanning) return;
    const f = e?.target?.files?.[0];
    if (!f) return;

    setFile(f);
    setError('');
    setMedicines([]);
    setRawText('');
    setStep('upload');

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;

    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      previewUrlRef.current = url;
      setPreview(url);
    } else {
      setPreview(null);
    }

    if (e?.target) e.target.value = '';
  }

  function removeFile() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    if (fileRef.current) fileRef.current.value = '';
    setFile(null);
    setPreview(null);
    setError('');
    setMedicines([]);
    setRawText('');
    setStep('upload');
  }

  function resetToUpload() {
    removeFile();
    setScanStage('');
    setScanProgress(0);
  }

  async function handleScan() {
    if (!file || scanning) return;
    setScanning(true);
    setError('');
    setScanStage('');
    setScanProgress(0);

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (message) => {
          if (message?.status) setScanStage(message.status);
          if (Number.isFinite(Number(message?.progress))) {
            setScanProgress(Math.max(0, Math.min(100, Math.round(Number(message.progress) * 100))));
          }
        },
      });

      const text = result.data.text || '';
      setRawText(text);

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      const detected = [];

      for (const line of lines) {
        if (/(mg|ml|mcg|gm|g\b|iu|unit|cap|tab|syr|inj|drp)/i.test(line)) {
          const cleanName = line.replace(/[^a-zA-Z0-9\s]/g, '').trim();
          const searchName = cleanName.replace(/\d+\s*(?:mg|ml|mcg|gm|g\b|iu|units?)/i, '').trim().split(/\s+/).slice(0, 2).join(' ');

          if (searchName.length > 2) {
            detected.push({
              name: line.substring(0, 40),
              searchName: searchName,
              dosage: '',
              quantity: '1',
              price: '',
            });
          }
        }
      }

      setMedicines(detected.length > 0 ? detected : [emptyMedicine()]);
      setStep('results');
      if (!detected.length) setError(copy.noDetected);
    } catch (err) {
      setError(copy.scanFailed + err.message);
      setMedicines([emptyMedicine()]);
      setStep('results');
    } finally {
      setScanning(false);
      setScanProgress(0);
      setScanStage('');
    }
  }

  function updateMed(idx, field, val) {
    setMedicines(prev => prev.map((m, i) => {
      if (i !== idx) return m;
      const updated = { ...m, [field]: val };
      if (field === 'name') {
        updated.searchName = val.replace(/\d+\s*(?:mg|ml|mcg|gm|g\b|iu|units?)/i, '').trim().split(/\s+/).slice(0, 2).join(' ');
      }
      return updated;
    }));
  }

  function addMed() {
    setMedicines(prev => [...prev, emptyMedicine()]);
  }

  function removeMed(idx) {
    setMedicines(prev => prev.filter((_, i) => i !== idx));
  }

  function searchMed(med) {
    const query = (med.searchName || med.name || '').trim();
    if (!query) return;
    navigate(`/results?q=${encodeURIComponent(query)}`);
  }

  function startManual() {
    setMedicines([emptyMedicine()]);
    setStep('results');
    setError('');
  }

  const firstNamed = medicines.find(m => m.name.trim() || m.searchName?.trim());
  const hasNamed = Boolean(firstNamed);
  const sizeLabel = file ? formatFileSize(file.size) : '';

  return (
    <div className="min-h-screen bg-canvas pb-20 pt-16">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.lead} />

      <Section spacing="tight">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-6">
            {/* Left — the image */}
            <Card tone="raised" className="overflow-hidden rounded-panel">
              <CardHeader className="flex-wrap">
                <div>
                  <h2 className="text-sm font-medium text-ink">{copy.imageTitle}</h2>
                  <p className="mt-0.5 text-xs text-muted">{copy.imageHint}</p>
                </div>
                <Badge tone="neutral">{copy.formats}</Badge>
              </CardHeader>

              <CardBody className="space-y-3 pt-4">
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!scanning) setDragging(true);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    const dropped = event.dataTransfer.files[0];
                    if (dropped) handleFile({ target: { files: [dropped] } });
                  }}
                >
                  <input
                    ref={fileRef}
                    id="rx-file"
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={handleFile}
                  />

                  {file ? (
                    <label
                      htmlFor="rx-file"
                      className={cn(
                        'block cursor-pointer rounded-panel border-2 border-dashed bg-raised p-3 transition-colors',
                        dragging ? 'border-accent' : 'border-line-strong hover:border-accent/60',
                        scanning && 'pointer-events-none',
                      )}
                    >
                      {preview ? (
                        <span className="relative block overflow-hidden rounded-field border border-line bg-sunken">
                          <img
                            src={preview}
                            alt="Prescription preview"
                            className="mx-auto max-h-60 w-auto object-contain"
                          />
                          {scanning && motionSafe && (
                            <motion.span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-x-0 h-px bg-accent/60"
                              initial={{ top: '4%' }}
                              animate={{ top: ['4%', '96%', '4%'] }}
                              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          )}
                        </span>
                      ) : (
                        <span className="flex min-h-[180px] flex-col items-center justify-center rounded-field border border-line bg-surface px-4 py-8 text-center">
                          <FileText className="h-8 w-8 text-muted" strokeWidth={1.75} aria-hidden="true" />
                          <span className="mt-2 max-w-full truncate text-xs font-medium text-ink-soft" title={file.name}>
                            {file.name}
                          </span>
                          <span className="mt-1 text-[11px] text-muted">{copy.formatsLine}</span>
                        </span>
                      )}
                      <span className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
                        <ScanLine className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        {scanning ? copy.reading : copy.fileHint}
                      </span>
                    </label>
                  ) : (
                    <label
                      htmlFor="rx-file"
                      className={cn(
                        'relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-panel border-2 border-dashed bg-raised px-6 py-8 text-center transition-colors',
                        dragging ? 'border-accent' : 'border-line-strong hover:border-accent/60',
                      )}
                    >
                      <GridPattern className="opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
                      <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface text-accent">
                        <Upload className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <span className="mt-4 text-sm font-medium text-ink">{copy.choose}</span>
                      <span className="mt-1 text-[11px] text-muted">{copy.formatsLine}</span>
                    </label>
                  )}
                </div>

                {file && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
                      <FileText className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span className="truncate" title={file.name}>{file.name}</span>
                      {sizeLabel && <span className="tnum flex-shrink-0">{sizeLabel}</span>}
                    </p>
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        scanning && 'pointer-events-none opacity-50',
                      )}
                    >
                      <label
                        htmlFor="rx-file"
                        aria-disabled={scanning || undefined}
                        className="inline-flex h-10 cursor-pointer items-center rounded-full px-3 text-[11px] font-medium text-accent transition-colors hover:bg-raised hover:text-accent-ink"
                      >
                        {copy.replace}
                      </label>
                      <IconButton
                        size="md"
                        aria-label={copy.remove}
                        onClick={removeFile}
                        disabled={scanning}
                        className="text-muted hover:text-danger"
                      >
                        <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      </IconButton>
                    </div>
                  </div>
                )}

                {file && (
                  <Button
                    onClick={handleScan}
                    disabled={scanning}
                    className="w-full"
                    size="md"
                  >
                    {scanning ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                    ) : (
                      <ScanLine className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                    )}
                    {scanning ? copy.reading : copy.read}
                  </Button>
                )}
              </CardBody>

              <CardFooter className="items-start justify-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" strokeWidth={1.75} aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium text-ink-soft">{copy.whatImage}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{copy.whatImageBody}</p>
                </div>
              </CardFooter>
            </Card>

            {/* Right — status and results */}
            <div className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-field border border-danger/25 bg-danger/10 p-3.5 text-xs leading-relaxed text-danger"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <p>{error}</p>
                </div>
              )}

              {scanning ? (
                <Card tone="surface" className="rounded-panel">
                  <CardBody className="p-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line bg-raised text-accent">
                        <ScanLine className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="text-sm font-medium text-ink">{copy.readingTitle}</h2>
                        <p className="text-[11px] text-muted">{copy.readingHint}</p>
                      </div>
                    </div>

                    <div className="mt-4" role="status" aria-live="polite">
                      {scanStage === 'recognizing text' ? (
                        <Progress value={scanProgress} label={stageLabel(scanStage, lang)} />
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-medium text-muted">
                            {scanStage ? stageLabel(scanStage, lang) : copy.preparing}
                          </p>
                          <Skeleton className="h-1.5 rounded-full" />
                        </div>
                      )}
                    </div>

                    <StepLoader
                      steps={copy.scanSteps}
                      active={scanProgress > 70 ? 2 : scanProgress > 30 ? 1 : 0}
                      className="mt-5"
                    />

                    <p className="mt-4 text-[11px] leading-relaxed text-muted">{copy.scanningHint}</p>
                  </CardBody>
                </Card>
              ) : step === 'results' ? (
                <>
                  <Card tone="surface" className="overflow-hidden rounded-panel">
                    <div className="relative border-b border-line bg-raised/40 px-5 py-4">
                      <Sparkles count={5} className="opacity-50" />
                      <div className="relative flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-base font-medium text-ink">{copy.resultsTitle}</h2>
                          <p className="mt-1 text-xs leading-relaxed text-muted">{copy.resultsHint}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="neutral" className="tnum">
                            {medicines.length} {medicines.length === 1 ? copy.line : copy.lines}
                          </Badge>
                          <Button variant="ghost" size="xs" onClick={resetToUpload}>
                            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                            {copy.scanAnother}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-line">
                      {medicines.length === 0 && (
                        <p className="px-5 py-8 text-center text-xs text-muted">{copy.emptyLines}</p>
                      )}
                      {medicines.map((med, idx) => (
                        <div key={idx} className="px-4 py-4 sm:px-5">
                          <div className="flex items-center justify-between gap-2">
                            <label
                              htmlFor={`rx-med-${idx}`}
                              className="text-[11px] font-medium text-ink-soft"
                            >
                              {copy.nameLabel}
                            </label>
                            <span className="tnum text-[10px] text-muted">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center gap-1.5">
                            <Input
                              id={`rx-med-${idx}`}
                              value={med.name}
                              onChange={e => updateMed(idx, 'name', e.target.value)}
                              placeholder={copy.namePlaceholder}
                              className="min-w-0 flex-1"
                            />
                            <IconButton
                              size="md"
                              aria-label={`${copy.searchLine}: ${med.name || String(idx + 1)}`}
                              onClick={() => searchMed(med)}
                              disabled={!med.name.trim() && !med.searchName?.trim()}
                              className="flex-shrink-0 text-muted hover:text-accent-ink"
                            >
                              <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                            </IconButton>
                            <IconButton
                              size="md"
                              aria-label={`${copy.removeLine}: ${med.name || String(idx + 1)}`}
                              onClick={() => removeMed(idx)}
                              className="flex-shrink-0 text-muted hover:text-danger"
                            >
                              <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                            </IconButton>
                          </div>

                          {(med.searchName && med.searchName !== med.name) ||
                          med.dosage ||
                          (med.quantity && med.quantity !== '1') ||
                          (med.price !== '' && med.price != null) ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {med.searchName && med.searchName !== med.name && (
                                <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
                                  {copy.searchKey}
                                  <Badge
                                    tone="outline"
                                    className="max-w-[12rem] truncate"
                                    title={med.searchName}
                                  >
                                    {med.searchName}
                                  </Badge>
                                </span>
                              )}
                              {med.dosage && <Badge tone="neutral">{med.dosage}</Badge>}
                              {med.quantity && med.quantity !== '1' && (
                                <Badge tone="neutral" className="tnum">
                                  {copy.qty} {med.quantity}
                                </Badge>
                              )}
                              {med.price !== '' && med.price != null && (
                                <Badge tone="neutral" className="tnum">
                                  {formatPrice(med.price)}
                                </Badge>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <Button
                          onClick={() => firstNamed && searchMed(firstNamed)}
                          disabled={!hasNamed}
                          className="w-full sm:w-auto"
                        >
                          <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          {copy.searchThese}
                        </Button>
                        {hasNamed && (
                          <p className="mt-1.5 text-[10px] text-muted">{copy.searchTheseHint}</p>
                        )}
                      </div>
                      <Button variant="secondary" onClick={addMed} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                        {copy.addLine}
                      </Button>
                    </CardFooter>
                  </Card>

                  {rawText && (
                    <Card tone="surface" className="rounded-panel">
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-ink-soft">{copy.rawTitle}</p>
                          <Button variant="ghost" size="xs" onClick={() => setRawText('')}>
                            {copy.hide}
                          </Button>
                        </div>
                        <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-field border border-line bg-sunken p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
                          {rawText}
                        </pre>
                      </CardBody>
                    </Card>
                  )}
                </>
              ) : (
                <Card tone="surface" className="rounded-panel">
                  <CardBody className="p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-line bg-raised text-muted">
                        <FileText className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="text-sm font-medium text-ink">
                          {file ? copy.readyTitle : copy.idleTitle}
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {file ? copy.readyBody : copy.idleBody}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-field border border-line bg-raised p-4">
                      <p className="text-xs font-medium text-ink-soft">{copy.completeTitle}</p>
                      <ul className="mt-2.5 space-y-2">
                        {copy.completeItems.map((item, index) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 text-[11px] leading-relaxed text-muted"
                          >
                            <span className="tnum mt-px flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-line bg-surface text-[9px] font-medium text-accent">
                              {index + 1}
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5">
                      <Button variant="secondary" size="sm" onClick={startManual}>
                        {copy.manual}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>

          <p className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>{copy.notice}</span>
          </p>
        </Container>
      </Section>
    </div>
  );
}
