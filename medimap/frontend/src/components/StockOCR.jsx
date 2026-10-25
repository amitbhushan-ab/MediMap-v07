// frontend/src/components/StockOCR.jsx — Precision OCR & Ingestion Pipeline
import { useState, useRef, useEffect } from 'react';
import { API_BASE, getToken } from '../lib/api';

const BACKEND = API_BASE;

export default function StockOCR({ onStockAdded, toast }) {
  const [suppliers, setSuppliers] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState([]);
  const [step, setStep] = useState('upload'); // upload | review
  const [globalMargin, setGlobalMargin] = useState(20);
  const [adding, setAdding] = useState(false);
  const [addingProgress, setAddingProgress] = useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    const token = getToken('pharmacist');
    if (!token) return;
    fetch(`${BACKEND}/pharmacist/suppliers`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(d => Array.isArray(d) && setSuppliers(d)).catch(() => {});
  }, []);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setItems([]);
    setStep('upload');
  }

  function calcSell(buy, margin) {
    const b = parseFloat(buy), m = parseFloat(margin);
    if (!b || isNaN(b)) return '';
    return (b * (1 + (m || 0) / 100)).toFixed(2);
  }

  function createEmpty() {
    return {
      id: Math.random().toString(36).slice(2),
      medicineName: '', genericName: '', manufacturer: '',
      batchNo: '', expiryDate: '',
      purchasePrice: '', markupPercent: globalMargin, sellingPrice: '',
      units: 1, minStock: 10, category: '', gstRate: 12,
      supplierId: '', supplierName: '',
      included: true,
    };
  }

  async function scan() {
    if (!file) return;
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append('prescription', file);
      const res = await fetch(`${BACKEND}/prescription/scan-bill`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const meds = data.medicines || [];

      if (!meds.length) {
        toast('No medicines detected — input manually below', 'error');
        setItems([createEmpty()]);
        setStep('review');
        return;
      }

      // Map each detected field to its correct input
      const mapped = meds.map(m => {
        const buy = parseFloat(m.price) || 0;
        const margin = globalMargin;
        return {
          id: Math.random().toString(36).slice(2),
          medicineName: (m.searchName || m.name || '').trim(),
          genericName: '',
          manufacturer: m.manufacturer || '',
          batchNo: m.batchNo || '',
          expiryDate: m.expiryDate || '',
          purchasePrice: m.price || '',
          markupPercent: margin,
          sellingPrice: buy > 0 ? calcSell(buy, margin) : '',
          units: parseInt(m.quantity) || 1,
          minStock: 10,
          category: '',
          gstRate: 12,
          supplierId: '',
          supplierName: data.supplierName || '',
          included: true,
        };
      });

      setItems(mapped);
      setStep('review');
      toast(`Extracted ${mapped.length} line items for verification.`);
    } catch (err) {
      toast('OCR ingestion error: ' + err.message, 'error');
      setItems([createEmpty()]);
      setStep('review');
    }
    setScanning(false);
  }

  function upd(id, field, val) {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      const u = { ...it, [field]: val };
      if (field === 'purchasePrice' || field === 'markupPercent') {
        const b = parseFloat(field === 'purchasePrice' ? val : u.purchasePrice) || 0;
        const m = parseFloat(field === 'markupPercent' ? val : u.markupPercent) || 0;
        if (b > 0) u.sellingPrice = calcSell(b, m);
      }
      if (field === 'supplierId') {
        const s = suppliers.find(x => x._id === val);
        u.supplierName = s?.name || '';
      }
      return u;
    }));
  }

  function applyMarginAll() {
    setItems(prev => prev.map(it => {
      const b = parseFloat(it.purchasePrice) || 0;
      return { ...it, markupPercent: globalMargin, sellingPrice: b > 0 ? calcSell(b, globalMargin) : it.sellingPrice };
    }));
  }

  async function addAll() {
    const toAdd = items.filter(i => i.included && i.medicineName.trim() && i.sellingPrice);
    if (!toAdd.length) { toast('Please specify medicine name and selling price for selected entries.', 'error'); return; }
    const token = getToken('pharmacist');
    setAdding(true);
    let ok = 0, fail = 0;
    for (let i = 0; i < toAdd.length; i++) {
      const it = toAdd[i];
      setAddingProgress(Math.round(((i + 1) / toAdd.length) * 100));
      try {
        const res = await fetch(`${BACKEND}/pharmacist/stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            medicineName: it.medicineName,
            genericName: it.genericName,
            manufacturer: it.manufacturer,
            batchNo: it.batchNo,
            expiryDate: it.expiryDate,
            purchasePrice: parseFloat(it.purchasePrice) || 0,
            sellingPrice: parseFloat(it.sellingPrice),
            units: parseInt(it.units) || 1,
            minStock: parseInt(it.minStock) || 10,
            category: it.category,
            gstRate: parseFloat(it.gstRate) || 12,
            supplierId: it.supplierId || undefined,
            supplierName: it.supplierName || undefined,
          }),
        });
        const d = await res.json();
        if (d.error) throw new Error(d.error);
        ok++;
      } catch { fail++; }
    }
    setAdding(false);
    toast(`Inventory updated: ${ok} item(s) synchronized${fail ? `, ${fail} failed` : ''}`);
    if (ok > 0) {
      setTimeout(() => {
        onStockAdded();
        setFile(null); setPreview(null); setItems([]); setStep('upload');
      }, 1000);
    }
  }

  const included = items.filter(i => i.included && i.medicineName.trim()).length;

  return (
    <div className="mb-4">
      {/* UPLOAD VIEW */}
      {step === 'upload' && (
        <div className="bg-raised border border-line rounded-card p-5 text-ink">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft">Purchase Invoice OCR Ingestion</h4>
                <p className="text-[11px] text-muted">Extract line items, batch codes, rates and expiry automatically</p>
              </div>
            </div>
            <button
              onClick={() => { setItems([createEmpty()]); setStep('review'); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-raised text-ink-soft font-medium transition"
            >
              Manual Entry
            </button>
          </div>

          <div
            onClick={() => fileRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile({ target: { files: [f] } }); }}
            className={`border-2 border-dashed rounded-field p-6 text-center cursor-pointer transition ${
              file ? 'border-accent bg-accent/5' : 'border-line hover:border-line-strong bg-canvas'
            }`}
          >
            {preview ? (
              <img src={preview} alt="Invoice preview" className="max-h-28 mx-auto rounded-lg border border-line" />
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-muted mb-2">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-ink-soft">
                  {file ? file.name : 'Select or drag purchase bill / GST invoice'}
                </p>
                <p className="text-[10px] text-muted mt-1">Accepts PDF, JPG, PNG up to 10MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} className="hidden" />
          </div>

          {file && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={scan}
                disabled={scanning}
                className="flex-1 py-2.5 px-4 rounded-field bg-accent-solid hover:bg-accent-solid-hover text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-accent/25 transition disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5 text-ink" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Parsing Document Structure...</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span>Process Invoice OCR</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* REVIEW VIEW */}
      {step === 'review' && (
        <div className="bg-raised border border-line rounded-card p-5 text-ink">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                Review Line Items ({items.length})
              </h4>
              <p className="text-[11px] text-muted">Verify extracted SKU details, batch numbers, and applied markups</p>
            </div>
            <button
              onClick={() => { setStep('upload'); setFile(null); setPreview(null); setItems([]); }}
              className="text-xs text-muted hover:text-ink transition"
            >
              Back to Ingestion
            </button>
          </div>

          {/* Batch Margin Presets */}
          {items.length > 0 && (
            <div className="bg-canvas border border-line rounded-field p-3 mb-4 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-medium text-muted">Batch Markup:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[10, 15, 20, 25, 30].map(p => (
                  <button
                    key={p}
                    onClick={() => setGlobalMargin(p)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      globalMargin === p
                        ? 'bg-accent text-ink'
                        : 'bg-surface text-muted hover:text-ink border border-line'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
                <button
                  onClick={applyMarginAll}
                  className="px-3 py-1 rounded-md bg-accent/15 hover:bg-accent/25 text-accent-ink text-[11px] font-semibold border border-accent/30 transition"
                >
                  Apply All
                </button>
              </div>
            </div>
          )}

          {/* Medicine Rows */}
          <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className={`p-3.5 rounded-field border transition ${
                  it.included
                    ? 'bg-canvas border-line'
                    : 'bg-canvas border-line opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-ink-soft">
                    <input
                      type="checkbox"
                      checked={it.included}
                      onChange={e => upd(it.id, 'included', e.target.checked)}
                      className="accent-accent rounded"
                    />
                    <span className="text-[11px] font-mono text-muted">#{idx + 1}</span>
                    {it.batchNo && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-raised text-ink-soft border border-line">
                        Batch: {it.batchNo}
                      </span>
                    )}
                    {it.expiryDate && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/40">
                        Exp: {it.expiryDate}
                      </span>
                    )}
                  </label>
                  <button
                    onClick={() => setItems(p => p.filter(x => x.id !== it.id))}
                    className="text-muted hover:text-rose-400 transition text-sm"
                  ><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="col-span-2">
                    <label className="text-[10px] font-medium text-muted block mb-1">MEDICINE FORMULATION *</label>
                    <input
                      value={it.medicineName}
                      onChange={e => upd(it.id, 'medicineName', e.target.value)}
                      placeholder="e.g. Augmentin 625mg Duo"
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted block mb-1">MANUFACTURER</label>
                    <input
                      value={it.manufacturer}
                      onChange={e => upd(it.id, 'manufacturer', e.target.value)}
                      placeholder="GSK, Cipla..."
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted block mb-1">BATCH IDENTIFIER</label>
                    <input
                      value={it.batchNo}
                      onChange={e => upd(it.id, 'batchNo', e.target.value)}
                      placeholder="e.g. AG2941"
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted block mb-1">EXPIRY (YYYY-MM)</label>
                    <input
                      value={it.expiryDate}
                      onChange={e => upd(it.id, 'expiryDate', e.target.value)}
                      placeholder="2027-06"
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted block mb-1">PURCHASE PRICE (₹)</label>
                    <input
                      value={it.purchasePrice}
                      onChange={e => upd(it.id, 'purchasePrice', e.target.value)}
                      placeholder="Cost"
                      inputMode="decimal"
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted block mb-1">MARGIN %</label>
                    <input
                      value={it.markupPercent}
                      onChange={e => upd(it.id, 'markupPercent', e.target.value)}
                      placeholder="20"
                      inputMode="numeric"
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-success block mb-1">RETAIL PRICE (₹) *</label>
                    <input
                      value={it.sellingPrice}
                      onChange={e => upd(it.id, 'sellingPrice', e.target.value)}
                      placeholder="Selling price"
                      inputMode="decimal"
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-success/40 text-success font-semibold text-xs outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted block mb-1">UNITS IN STOCK *</label>
                    <input
                      value={it.units}
                      onChange={e => upd(it.id, 'units', e.target.value.replace(/\D/g, ''))}
                      placeholder="Quantity"
                      inputMode="numeric"
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted block mb-1">GST RATE</label>
                    <select
                      value={it.gstRate}
                      onChange={e => upd(it.id, 'gstRate', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink text-xs outline-none focus:border-accent"
                    >
                      <option value="0">0% Excluded</option>
                      <option value="5">5% Concessional</option>
                      <option value="12">12% Standard Pharma</option>
                      <option value="18">18% Specialty</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-medium text-muted block mb-1">SUPPLIER TAG</label>
                    <select
                      value={it.supplierId}
                      onChange={e => upd(it.id, 'supplierId', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-line text-ink-soft text-xs outline-none focus:border-accent"
                    >
                      <option value="">— Unassigned (Local Wholesale) —</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s._id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {it.purchasePrice && it.sellingPrice && parseFloat(it.purchasePrice) > 0 && (
                  <div className="mt-2.5 px-3 py-1 rounded-md bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-success flex items-center justify-between">
                    <span>Unit Cost ₹{it.purchasePrice} → Retail ₹{it.sellingPrice}</span>
                    <span className="font-semibold font-mono">
                      +{(((parseFloat(it.sellingPrice) - parseFloat(it.purchasePrice)) / parseFloat(it.purchasePrice)) * 100).toFixed(1)}% margin
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex gap-2.5 mt-4 pt-3 border-t border-line">
            <button
              onClick={() => setItems(p => [...p, createEmpty()])}
              className="px-3.5 py-2 rounded-field border border-line bg-surface hover:bg-raised text-ink-soft text-xs font-semibold transition"
            >
              + Add Item
            </button>
            <button
              onClick={addAll}
              disabled={adding || included === 0}
              className="flex-1 py-2 px-4 rounded-field bg-accent-solid hover:bg-accent-solid-hover text-white text-xs font-semibold shadow-lg shadow-accent/25 transition disabled:opacity-40"
            >
              {adding ? `Synchronizing ${addingProgress}%...` : `Commit ${included} Entries to Live Inventory`}
            </button>
          </div>

          {adding && (
            <div className="mt-2.5 w-full h-1.5 rounded-full bg-line overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${addingProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
