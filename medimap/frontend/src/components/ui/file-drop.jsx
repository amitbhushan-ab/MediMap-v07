// src/components/ui/file-drop.jsx — Aceternity File Upload, adapted to MediMap tokens
// No extra dependency: native drag events, a real input, and one queued file.
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Upload, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GridPattern } from './grid-pattern';

function formatSize(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDrop({
  onFile,
  file,
  accept = 'image/*,application/pdf',
  label = 'Drop a prescription here',
  hint = 'JPG, PNG or PDF',
  icon: Icon = Upload,
  className,
  disabled = false,
  inputId = 'file-drop-input',
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function acceptFiles(files) {
    const next = files?.[0];
    if (next) onFile?.(next);
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) acceptFiles(event.dataTransfer.files);
        }}
        className={cn(
          'group/drop relative overflow-hidden rounded-panel border border-dashed bg-surface transition-colors duration-200',
          dragging ? 'border-accent bg-accent/[0.04]' : 'border-line-strong/70 hover:border-accent/50',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <GridPattern className="opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative z-10 flex flex-col items-center px-6 py-9 text-center">
          <motion.div
            animate={dragging ? { y: -4, scale: 1.04 } : { y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="flex h-12 w-12 items-center justify-center rounded-field border border-line bg-raised text-ink-soft"
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </motion.div>

          <p className="mt-4 text-sm font-medium text-ink">{dragging ? 'Release to add the file' : label}</p>
          <p className="mt-1 text-xs text-muted">{hint}</p>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-xs font-medium text-ink transition-colors hover:border-accent/45 hover:bg-raised"
          >
            Choose a file
          </button>

          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(event) => acceptFiles(event.target.files)}
          />
        </div>
      </div>

      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-2 flex items-center gap-3 rounded-field border border-line bg-surface px-3 py-2.5"
          >
            <FileText className="h-4 w-4 flex-shrink-0 text-accent" strokeWidth={1.75} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink" title={file.name}>
                {file.name}
              </p>
              <p className="tnum text-[11px] text-muted">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onFile?.(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              aria-label="Remove file"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-raised hover:text-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
