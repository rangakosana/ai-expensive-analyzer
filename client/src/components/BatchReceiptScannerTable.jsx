import React, { useState, useMemo, useRef } from 'react';
import {
  IndianRupee,
  Store,
  Tag,
  Calendar,
  FileText,
  Check,
  CheckCheck,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Trash2,
  ZoomIn,
  X,
  Plus,
  Eye,
  CheckCircle2,
  UploadCloud,
  ImageIcon,
  Camera,
} from 'lucide-react';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Personal Care',
  'Utilities',
  'Housing',
  'Miscellaneous',
];

const CATEGORY_COLORS = {
  'Food & Dining': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Transportation': 'bg-sky-50 text-sky-700 border-sky-200',
  'Shopping': 'bg-purple-50 text-purple-700 border-purple-200',
  'Entertainment': 'bg-pink-50 text-pink-700 border-pink-200',
  'Healthcare': 'bg-rose-50 text-rose-700 border-rose-200',
  'Personal Care': 'bg-teal-50 text-teal-700 border-teal-200',
  'Utilities': 'bg-amber-50 text-amber-700 border-amber-200',
  'Housing': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Miscellaneous': 'bg-slate-100 text-slate-700 border-slate-200',
};

export const BatchReceiptScannerTable = ({
  items = [],
  onUpdateItem,
  onRemoveItem,
  onSaveItem,
  onSaveAll,
  onAddMoreFiles,
  onAddManualRow,
  onClearAll,
  isBatchSaving = false,
  overallProgress = { total: 0, completed: 0, current: 0, percent: 0 },
}) => {
  const [lightboxItem, setLightboxItem] = useState(null);
  const addFilesInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Statistics
  const { totalAmount, readyCount, savedCount, scanningCount, queuedCount, errorCount } = useMemo(() => {
    let amt = 0;
    let ready = 0;
    let saved = 0;
    let scanning = 0;
    let queued = 0;
    let errors = 0;

    items.forEach((item) => {
      const val = parseFloat(item.amount);
      if (!isNaN(val) && val > 0) amt += val;

      if (item.saved) saved++;
      else if (item.status === 'done') ready++;
      else if (item.status === 'scanning') scanning++;
      else if (item.status === 'queued') queued++;
      else if (item.status === 'error') errors++;
    });

    return {
      totalAmount: amt,
      readyCount: ready,
      savedCount: saved,
      scanningCount: scanning,
      queuedCount: queued,
      errorCount: errors,
    };
  }, [items]);

  const allCompleted = items.length > 0 && scanningCount === 0 && queuedCount === 0;

  return (
    <div className="space-y-4">
      {/* Hidden File / Camera Inputs */}
      <input
        ref={addFilesInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onAddMoreFiles(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onAddMoreFiles(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />

      {/* Top Batch HUD / Status Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-indigo-700/50 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Multi-Receipt AI Batch Scanner
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Gemini Stream
                </span>
              </h2>
            </div>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl">
              {items.length === 0
                ? 'Upload your UPI screenshots, photos, or bills. Gemini AI scans each one sequentially and fills the review table below in real-time.'
                : allCompleted
                ? `All ${items.length} receipt${items.length > 1 ? 's' : ''} scanned! Review extracted fields below and click Save beside any row or Save All.`
                : `Scanning receipts one-by-one with Gemini AI. Data streams live into the table as each receipt is finished.`}
            </p>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[70px]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200 block">Total</span>
              <span className="text-sm font-bold text-white">{items.length} receipts</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-center min-w-[80px]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200 block">Detected</span>
              <span className="text-sm font-bold text-emerald-300">
                ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 text-center min-w-[70px]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200 block">Saved</span>
              <span className="text-sm font-bold text-indigo-200">{savedCount} / {items.length}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar (when items are loaded) */}
        {items.length > 0 && (
          <div className="mt-4 pt-3 border-t border-indigo-800/60">
            <div className="flex items-center justify-between text-xs text-indigo-200 mb-1.5">
              <div className="flex items-center space-x-2 font-medium">
                {scanningCount > 0 ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    <span className="text-amber-200">
                      Scanning receipt #{overallProgress.current} of {overallProgress.total}...
                    </span>
                  </>
                ) : allCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-semibold">
                      100% Scanned ({items.length} processed)
                    </span>
                  </>
                ) : (
                  <span>Queue loaded: {items.length} images</span>
                )}
              </div>
              <div className="text-[11px] font-mono font-bold text-indigo-200">
                {overallProgress.percent}%
              </div>
            </div>

            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-white/10 p-0.5">
              <div
                className="bg-gradient-to-r from-amber-400 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.max(4, overallProgress.percent)}%` }}
              />
            </div>

            {/* Status Breakdown Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px]">
              {savedCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Check className="w-3 h-3 mr-1" />
                  {savedCount} Saved
                </span>
              )}
              {readyCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {readyCount} Ready to Save
                </span>
              )}
              {scanningCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  {scanningCount} Scanning Now
                </span>
              )}
              {queuedCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-300 border border-slate-600/50">
                  <Clock className="w-3 h-3 mr-1" />
                  {queuedCount} Queued
                </span>
              )}
              {errorCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errorCount} Need Manual Check
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="mt-4 pt-3 border-t border-indigo-800/60 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addFilesInputRef.current?.click()}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-white text-indigo-950 text-xs font-bold hover:bg-indigo-50 transition-all cursor-pointer shadow-sm"
            >
              <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Upload Screenshots (1 or Multiple)
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              Take Photo
            </button>

            <button
              type="button"
              onClick={onAddManualRow}
              className="inline-flex items-center px-3 py-1.5 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-100 text-xs font-semibold border border-indigo-400/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Manual Row
            </button>

            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {items.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onSaveAll}
                disabled={readyCount === 0 || isBatchSaving}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed shadow-md shadow-amber-900/30 transition-all cursor-pointer"
              >
                {isBatchSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Saving All Ready...
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4 mr-1.5" />
                    Save All Ready ({readyCount})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progressive Scanned Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-3.5 w-16 text-center"># / Image</th>
                <th className="py-3 px-3 min-w-[170px]">Merchant / Payee</th>
                <th className="py-3 px-3 min-w-[120px]">Amount (₹)</th>
                <th className="py-3 px-3 min-w-[150px]">Category</th>
                <th className="py-3 px-3 min-w-[130px]">Date</th>
                <th className="py-3 px-3 min-w-[160px]">Notes</th>
                <th className="py-3 px-3 text-center min-w-[140px]">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.length === 0 ? (
                /* Empty state inside the table */
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <UploadCloud className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Review Table Is Ready</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Click <strong>"Upload Screenshots"</strong> above or drag & drop 1 or multiple receipt images here. Each will be scanned and appear in this table!
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => addFilesInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Select Receipts
                        </button>
                        <button
                          type="button"
                          onClick={onAddManualRow}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          + Add Empty Row
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const isScanning = item.status === 'scanning';
                  const isQueued = item.status === 'queued';
                  const isDone = item.status === 'done';
                  const isError = item.status === 'error';
                  const isSaved = item.saved;
                  const isSaving = item.saving;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors duration-200 ${
                        item.flashSuccess ? 'animate-row-flash' : ''
                      } ${
                        isSaved
                          ? 'bg-emerald-50/30 hover:bg-emerald-50/50'
                          : isScanning
                          ? 'bg-amber-50/30'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. S.No & Thumbnail Preview */}
                      <td className="py-3 px-3.5 text-center align-middle">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">
                            #{idx + 1}
                          </span>
                          <div
                            onClick={() => item.preview && setLightboxItem(item)}
                            className={`relative group w-11 h-11 rounded-lg overflow-hidden border border-slate-200 shadow-2xs flex-shrink-0 bg-slate-100 flex items-center justify-center ${
                              item.preview ? 'cursor-pointer' : ''
                            }`}
                            title={item.preview ? 'Click to view full receipt screenshot' : 'Manual entry'}
                          >
                            {item.preview ? (
                              <>
                                <img
                                  src={item.preview}
                                  alt={`Receipt ${idx + 1}`}
                                  className={`w-full h-full object-cover transition-transform group-hover:scale-110 ${
                                    isScanning ? 'opacity-60 scale-105 animate-pulse' : ''
                                  }`}
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </div>
                              </>
                            ) : (
                              <FileText className="w-5 h-5 text-indigo-500" />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Merchant / Payee */}
                      <td className="py-3 px-3 align-middle">
                        {isQueued ? (
                          <div className="h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-2.5 text-slate-400 italic text-[11px]">
                            Waiting in queue...
                          </div>
                        ) : isScanning ? (
                          <div className="h-8 rounded-lg animate-shimmer-sweep border border-indigo-200/80 flex items-center px-2.5 space-x-1.5 text-indigo-700 text-[11px] font-medium">
                            <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                            <span className="truncate">Reading payee...</span>
                          </div>
                        ) : (
                          <div className="relative">
                            <Store className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={item.merchant || ''}
                              disabled={isSaved}
                              onChange={(e) => onUpdateItem(item.id, { merchant: e.target.value })}
                              placeholder="Store or Payee"
                              className="w-full pl-8 pr-2 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 transition-shadow"
                            />
                          </div>
                        )}
                      </td>

                      {/* 3. Amount (₹) */}
                      <td className="py-3 px-3 align-middle">
                        {isQueued ? (
                          <div className="h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-2.5 text-slate-400 italic text-[11px]">
                            —
                          </div>
                        ) : isScanning ? (
                          <div className="h-8 rounded-lg animate-shimmer-sweep border border-amber-200/80 flex items-center px-2.5 space-x-1 text-amber-700 text-[11px] font-medium">
                            <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                            <span>Detecting ₹...</span>
                          </div>
                        ) : (
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={item.amount || ''}
                              disabled={isSaved}
                              onChange={(e) => onUpdateItem(item.id, { amount: e.target.value })}
                              placeholder="0.00"
                              className="w-full pl-6 pr-2 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 transition-shadow"
                            />
                          </div>
                        )}
                      </td>

                      {/* 4. Category */}
                      <td className="py-3 px-3 align-middle">
                        {isQueued ? (
                          <div className="h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-2.5 text-slate-400 italic text-[11px]">
                            —
                          </div>
                        ) : isScanning ? (
                          <div className="h-8 rounded-lg animate-shimmer-sweep border border-indigo-200/80 flex items-center px-2.5 text-indigo-700 text-[11px] font-medium">
                            <Tag className="w-3 h-3 mr-1 animate-pulse" />
                            <span>Classifying...</span>
                          </div>
                        ) : (
                          <select
                            value={item.category || 'Food & Dining'}
                            disabled={isSaved}
                            onChange={(e) => onUpdateItem(item.id, { category: e.target.value })}
                            className={`w-full py-1.5 px-2 text-xs font-semibold rounded-lg border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                              CATEGORY_COLORS[item.category] || 'bg-white text-slate-800 border-slate-200'
                            }`}
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat} className="bg-white text-slate-800 font-medium">
                                {cat}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* 5. Date */}
                      <td className="py-3 px-3 align-middle">
                        {isQueued ? (
                          <div className="h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-2.5 text-slate-400 italic text-[11px]">
                            —
                          </div>
                        ) : isScanning ? (
                          <div className="h-8 rounded-lg animate-shimmer-sweep border border-slate-200 flex items-center px-2.5 text-slate-500 text-[11px]">
                            <Calendar className="w-3 h-3 mr-1 animate-pulse" />
                            <span>Date...</span>
                          </div>
                        ) : (
                          <input
                            type="date"
                            value={item.expense_date || ''}
                            disabled={isSaved}
                            onChange={(e) => onUpdateItem(item.id, { expense_date: e.target.value })}
                            className="w-full py-1.5 px-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer"
                          />
                        )}
                      </td>

                      {/* 6. Notes */}
                      <td className="py-3 px-3 align-middle">
                        {isQueued ? (
                          <div className="h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-2.5 text-slate-400 italic text-[11px]">
                            —
                          </div>
                        ) : isScanning ? (
                          <div className="h-8 rounded-lg animate-shimmer-sweep border border-slate-200 flex items-center px-2.5 text-slate-500 text-[11px]">
                            <FileText className="w-3 h-3 mr-1 animate-pulse" />
                            <span>Context...</span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={item.notes || ''}
                            disabled={isSaved}
                            onChange={(e) => onUpdateItem(item.id, { notes: e.target.value })}
                            placeholder="Optional memo / UPI note"
                            className="w-full py-1.5 px-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        )}
                      </td>

                      {/* 7. Status & Row Save Action */}
                      <td className="py-3 px-3 align-middle text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isQueued && (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Queued
                            </span>
                          )}

                          {isScanning && (
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin text-amber-600" />
                              Scanning...
                            </span>
                          )}

                          {isSaved ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Saved ✓
                            </span>
                          ) : (
                            (isDone || isError) && (
                              <button
                                type="button"
                                onClick={() => onSaveItem(item.id)}
                                disabled={isSaving}
                                title="Save this single expense"
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Save
                                  </>
                                )}
                              </button>
                            )
                          )}

                          {/* Remove Row Button */}
                          {!isSaved && (
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              title="Remove this receipt from batch"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Error or validation hint */}
                        {isError && !isSaved && (
                          <div className="text-[10px] text-rose-600 font-medium mt-1">
                            Manual check needed
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Table Footer Summary */}
        {items.length > 0 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-800">{items.length} Total Receipts:</span>
              <span>{savedCount} Saved</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">{readyCount} Ready to Save</span>
              {scanningCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-700 font-semibold">{scanningCount} Scanning...</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <span className="font-bold text-slate-900 text-sm">
                Batch Sum: ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
              <button
                type="button"
                onClick={onSaveAll}
                disabled={readyCount === 0 || isBatchSaving}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
              >
                {isBatchSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 mr-1" />
                    Save All ({readyCount})
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Receipt Full Preview */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 truncate max-w-md">
                  Receipt Preview: {lightboxItem.merchant || lightboxItem.fileName || 'Screenshot'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex flex-col md:flex-row gap-4 items-center justify-center">
              <div className="max-w-md w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                <img
                  src={lightboxItem.preview}
                  alt="Original receipt"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              {/* Data Card beside image */}
              <div className="flex-1 w-full space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                  Extracted Receipt Details
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 font-medium block">Merchant:</span>
                    <span className="text-sm font-bold text-slate-900">{lightboxItem.merchant || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Amount:</span>
                    <span className="text-base font-extrabold text-emerald-600">
                      ₹{parseFloat(lightboxItem.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Category:</span>
                    <span className={`inline-block px-2 py-0.5 rounded font-semibold ${CATEGORY_COLORS[lightboxItem.category] || 'bg-slate-200'}`}>
                      {lightboxItem.category || 'Food & Dining'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Date:</span>
                    <span className="text-slate-800 font-medium">{lightboxItem.expense_date || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Notes:</span>
                    <span className="text-slate-700">{lightboxItem.notes || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Status:</span>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-700">
                      {lightboxItem.saved ? 'Saved ✓' : lightboxItem.status}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setLightboxItem(null)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Done Reviewing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchReceiptScannerTable;
