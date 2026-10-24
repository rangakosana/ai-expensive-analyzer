import React, { useState, useMemo } from 'react';
import {
  Store,
  Tag,
  Calendar,
  FileText,
  Check,
  CheckCheck,
  Loader2,
  AlertCircle,
  Clock,
  Trash2,
  ZoomIn,
  X,
  CheckCircle2,
  UploadCloud,
  ShieldAlert,
} from 'lucide-react';
import { checkTransactionDuplicate } from '../utils/scannerUtils.js';

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
  existingExpenses = [],
  onUpdateItem,
  onRemoveItem,
  onSaveItem,
  onSaveAll,
  onClearAll,
  isBatchSaving = false,
}) => {
  const [lightboxItem, setLightboxItem] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'ready' | 'needs_review' | 'saved'

  // Summary counts
  const { readyCount, needsReviewCount, savedCount, totalDetectedAmount } = useMemo(() => {
    let ready = 0;
    let needsReview = 0;
    let saved = 0;
    let totalAmt = 0;

    items.forEach((it) => {
      const amt = parseFloat(it.amount);
      if (!isNaN(amt) && amt > 0) totalAmt += amt;

      const hasMerchant = Boolean(it.merchant?.trim());
      const hasValidDate = Boolean(it.expense_date && /^\d{4}-\d{2}-\d{2}$/.test(it.expense_date));
      const isItemReady = (it.is_ready || it.status === 'ready') && amt > 0 && hasMerchant && hasValidDate;

      if (it.saved) {
        saved++;
      } else if (isItemReady) {
        ready++;
      } else if (it.status !== 'queued' && it.status !== 'scanning') {
        needsReview++;
      }
    });

    return {
      readyCount: ready,
      needsReviewCount: needsReview,
      savedCount: saved,
      totalDetectedAmount: totalAmt,
    };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (activeFilter === 'ready') {
      return items.filter(
        (it) =>
          !it.saved &&
          (it.is_ready || it.status === 'ready') &&
          parseFloat(it.amount) > 0 &&
          it.merchant?.trim() &&
          it.expense_date &&
          /^\d{4}-\d{2}-\d{2}$/.test(it.expense_date)
      );
    }
    if (activeFilter === 'needs_review') {
      return items.filter(
        (it) =>
          !it.saved &&
          it.status !== 'queued' &&
          it.status !== 'scanning' &&
          (!it.is_ready ||
            !it.merchant?.trim() ||
            !parseFloat(it.amount) ||
            !it.expense_date ||
            !/^\d{4}-\d{2}-\d{2}$/.test(it.expense_date))
      );
    }
    if (activeFilter === 'saved') {
      return items.filter((it) => it.saved);
    }
    return items;
  }, [items, activeFilter]);

  return (
    <div className="space-y-4">
      {/* Table Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Toolbar */}
        <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-800 mr-1 hidden sm:inline">
              Extracted Transactions:
            </span>

            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('ready')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                activeFilter === 'ready'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              Ready to Save ({readyCount})
            </button>

            {needsReviewCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('needs_review')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeFilter === 'needs_review'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-amber-700 hover:bg-amber-50 border border-slate-200'
                }`}
              >
                Needs Review ({needsReviewCount})
              </button>
            )}

            {savedCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('saved')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeFilter === 'saved'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Saved ({savedCount})
              </button>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {readyCount > 0 && (
              <button
                type="button"
                onClick={onSaveAll}
                disabled={isBatchSaving}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer"
              >
                {isBatchSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving Ready...
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4 mr-1.5" />
                    Save All Ready ({readyCount})
                  </>
                )}
              </button>
            )}

            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-3.5 w-24 text-center">Receipt Image</th>
                <th className="py-3 px-3 min-w-[130px]">Status</th>
                <th className="py-3 px-3 min-w-[170px]">Merchant / Payee *</th>
                <th className="py-3 px-3 min-w-[130px]">Amount (₹) *</th>
                <th className="py-3 px-3 min-w-[150px]">Category</th>
                <th className="py-3 px-3 min-w-[130px]">Date *</th>
                <th className="py-3 px-3 min-w-[160px]">Notes & Ref ID</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center space-y-2.5 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <UploadCloud className="w-6 h-6 text-indigo-500" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {items.length === 0
                          ? 'No transactions scanned yet'
                          : 'No transactions match this filter'}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {items.length === 0
                          ? 'Upload individual receipts or screenshots containing multiple transactions above to extract details.'
                          : 'Switch to the "All" tab to view all extracted transactions.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isScanning = item.status === 'scanning';
                  const isQueued = item.status === 'queued';
                  const isSaved = item.saved;
                  const isSaving = item.saving;
                  const amt = parseFloat(item.amount);
                  const hasMerchant = Boolean(item.merchant?.trim());
                  const hasValidAmount = !isNaN(amt) && amt > 0;
                  const hasValidDate = Boolean(item.expense_date && /^\d{4}-\d{2}-\d{2}$/.test(item.expense_date));
                  const isReady = (item.is_ready || item.status === 'ready') && hasMerchant && hasValidAmount && hasValidDate;
                  const isNeedsReview = !isSaved && !isScanning && !isQueued && !isReady;

                  // Duplicate check
                  const duplicateWarning = checkTransactionDuplicate(item, items, existingExpenses);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors duration-150 ${
                        item.flashSuccess ? 'animate-row-flash' : ''
                      } ${
                        isSaved
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                          : isScanning
                          ? 'bg-amber-50/30'
                          : isNeedsReview
                          ? 'bg-amber-50/15 hover:bg-amber-50/30'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. Source Image Thumbnail & Association */}
                      <td className="py-3 px-3.5 text-center align-middle">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div
                            onClick={() => item.preview && setLightboxItem(item)}
                            className={`relative group w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shadow-2xs flex-shrink-0 bg-slate-100 flex items-center justify-center ${
                              item.preview ? 'cursor-pointer hover:border-indigo-400' : ''
                            }`}
                            title={item.preview ? 'Click to inspect original screenshot' : 'Manual entry'}
                          >
                            {item.preview ? (
                              <>
                                <img
                                  src={item.preview}
                                  alt={`Screenshot ${idx + 1}`}
                                  className={`w-full h-full object-cover transition-transform group-hover:scale-110 ${
                                    isScanning ? 'opacity-50 animate-pulse' : ''
                                  }`}
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </div>
                              </>
                            ) : (
                              <FileText className="w-5 h-5 text-indigo-400" />
                            )}
                          </div>

                          {/* Multi-transaction association pill */}
                          {item.totalFromImage > 1 ? (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded-md">
                              Tx {item.itemIndex}/{item.totalFromImage}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400">
                              #{idx + 1}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Extraction & Review Status */}
                      <td className="py-3 px-3 align-middle">
                        <div className="flex flex-col items-start space-y-1">
                          {isQueued && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-3 h-3 mr-1" />
                              Queued
                            </span>
                          )}

                          {isScanning && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin text-amber-600" />
                              Scanning...
                            </span>
                          )}

                          {isSaved && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Check className="w-3 h-3 mr-1" />
                              Saved
                            </span>
                          )}

                          {isReady && !isSaved && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Ready
                            </span>
                          )}

                          {isNeedsReview && !isScanning && !isQueued && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                              title={item.error || 'Please review highlighted fields before saving'}
                            >
                              <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
                              Needs Review
                            </span>
                          )}

                          {/* Duplicate alert pill */}
                          {duplicateWarning && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/80 cursor-help"
                              title={duplicateWarning}
                            >
                              <ShieldAlert className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                              <span className="truncate max-w-[110px]">Possible duplicate</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Merchant / Payee */}
                      <td className="py-3 px-3 align-middle">
                        {isQueued ? (
                          <div className="h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-2.5 text-slate-400 italic text-[11px]">
                            Waiting...
                          </div>
                        ) : isScanning ? (
                          <div className="h-8 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-center px-2.5 space-x-1.5 text-indigo-700 text-[11px] animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                            <span className="truncate">Reading payee...</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="relative">
                              <Store className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={item.merchant || ''}
                                disabled={isSaved}
                                onChange={(e) => onUpdateItem(item.id, { merchant: e.target.value })}
                                placeholder="Required (Store / Payee)"
                                className={`w-full pl-8 pr-2 py-1.5 text-xs font-semibold rounded-lg border transition-all focus:outline-hidden focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 ${
                                  !hasMerchant && !isSaved
                                    ? 'border-amber-300 bg-amber-50/40 text-amber-950 focus:ring-amber-500'
                                    : 'border-slate-200 bg-white text-slate-900 focus:ring-indigo-500'
                                }`}
                              />
                            </div>
                            {!hasMerchant && !isSaved && (
                              <div className="text-[10px] text-amber-700 font-medium flex items-center">
                                <AlertCircle className="w-2.5 h-2.5 mr-1 flex-shrink-0 text-amber-600" />
                                <span className="truncate">Merchant name needs review</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 4. Amount (₹) */}
                      <td className="py-3 px-3 align-middle">
                        {isQueued ? (
                          <div className="h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-2.5 text-slate-400 italic text-[11px]">
                            —
                          </div>
                        ) : isScanning ? (
                          <div className="h-8 rounded-lg bg-amber-50/50 border border-amber-100 flex items-center px-2.5 space-x-1 text-amber-700 text-[11px] animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                            <span>Detecting ₹...</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
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
                                className={`w-full pl-6 pr-2 py-1.5 text-xs font-bold rounded-lg border transition-all focus:outline-hidden focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 ${
                                  !hasValidAmount && !isSaved
                                    ? 'border-amber-300 bg-amber-50/40 text-amber-950 focus:ring-amber-500'
                                    : 'border-slate-200 bg-white text-slate-900 focus:ring-indigo-500'
                                }`}
                              />
                            </div>
                            {!hasValidAmount && !isSaved && (
                              <div className="text-[10px] text-amber-700 font-medium flex items-center">
                                <AlertCircle className="w-2.5 h-2.5 mr-1 flex-shrink-0 text-amber-600" />
                                <span className="truncate">Amount not confidently detected</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 5. Category */}
                      <td className="py-3 px-3 align-middle">
                        {isQueued ? (
                          <div className="h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-2.5 text-slate-400 italic text-[11px]">
                            —
                          </div>
                        ) : isScanning ? (
                          <div className="h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center px-2.5 text-slate-400 text-[11px]">
                            <Tag className="w-3 h-3 mr-1 animate-pulse" />
                            <span>Categorizing...</span>
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

                      {/* 6. Date */}
                      <td className="py-3 px-3 align-middle">
                        {isQueued ? (
                          <div className="h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-2.5 text-slate-400 italic text-[11px]">
                            —
                          </div>
                        ) : isScanning ? (
                          <div className="h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center px-2.5 text-slate-400 text-[11px]">
                            <Calendar className="w-3 h-3 mr-1 animate-pulse" />
                            <span>Date...</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="date"
                              value={item.expense_date || ''}
                              disabled={isSaved}
                              onChange={(e) => onUpdateItem(item.id, { expense_date: e.target.value })}
                              className={`w-full py-1.5 px-2 text-xs font-medium rounded-lg border transition-all focus:outline-hidden focus:ring-2 disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer ${
                                !hasValidDate && !isSaved
                                  ? 'border-amber-300 bg-amber-50/40 text-amber-950 focus:ring-amber-500'
                                  : 'border-slate-200 bg-white text-slate-700 focus:ring-indigo-500'
                              }`}
                            />
                            {!hasValidDate && !isSaved && (
                              <div className="text-[10px] text-amber-700 font-medium flex items-center">
                                <AlertCircle className="w-2.5 h-2.5 mr-1 flex-shrink-0 text-amber-600" />
                                <span className="truncate" title={item.date_review_reason || 'Date unclear — please confirm'}>
                                  {item.date_review_reason || 'Date unclear — please confirm'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 7. Notes & Ref ID */}
                      <td className="py-3 px-3 align-middle">
                        {isQueued ? (
                          <div className="h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center px-2.5 text-slate-400 italic text-[11px]">
                            —
                          </div>
                        ) : isScanning ? (
                          <div className="h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center px-2.5 text-slate-400 text-[11px]">
                            <FileText className="w-3 h-3 mr-1 animate-pulse" />
                            <span>Notes...</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={item.notes || ''}
                              disabled={isSaved}
                              onChange={(e) => onUpdateItem(item.id, { notes: e.target.value })}
                              placeholder="Memo or context"
                              className="w-full py-1.5 px-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                            />
                            {item.reference_id && (
                              <span className="text-[10px] font-mono text-slate-400 block truncate" title={`Ref: ${item.reference_id}`}>
                                Ref: {item.reference_id}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 8. Row Save & Delete Action */}
                      <td className="py-3 px-3 align-middle text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isSaved ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300">
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Saved ✓
                            </span>
                          ) : (
                            (!isQueued && !isScanning) && (
                              <button
                                type="button"
                                onClick={() => onSaveItem(item.id)}
                                disabled={isSaving || !hasMerchant || !hasValidAmount || !hasValidDate}
                                title={
                                  !hasMerchant || !hasValidAmount || !hasValidDate
                                    ? 'Confirm merchant, amount, and date before saving'
                                    : 'Save this single expense'
                                }
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer"
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

                          {!isSaved && (
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              title="Remove this row"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Footer Summary */}
        {items.length > 0 && (
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-900">{items.length} Transactions</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">{readyCount} Ready</span>
              {needsReviewCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-700 font-semibold">{needsReviewCount} Incomplete</span>
                </>
              )}
              {savedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-slate-700">{savedCount} Saved</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <span className="font-extrabold text-slate-900 text-sm">
                Total: ₹{totalDetectedAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
              {readyCount > 0 && (
                <button
                  type="button"
                  onClick={onSaveAll}
                  disabled={isBatchSaving}
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
                      Save All Ready ({readyCount})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Receipt Full Preview */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {lightboxItem.fileName || 'Original Screenshot'}
                </h3>
                {lightboxItem.totalFromImage > 1 && (
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    Transaction {lightboxItem.itemIndex} of {lightboxItem.totalFromImage}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
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

              {/* Data Summary Card beside image */}
              <div className="flex-1 w-full space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                  Transaction Details
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 font-medium block">Merchant / Payee:</span>
                    <span className="text-sm font-bold text-slate-900">
                      {lightboxItem.merchant || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Amount:</span>
                    <span className="text-base font-extrabold text-emerald-600">
                      ₹{parseFloat(lightboxItem.amount || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Category:</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-semibold ${
                        CATEGORY_COLORS[lightboxItem.category] || 'bg-slate-200'
                      }`}
                    >
                      {lightboxItem.category || 'Food & Dining'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Date:</span>
                    <span className="text-slate-800 font-medium">
                      {lightboxItem.expense_date || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block">Notes:</span>
                    <span className="text-slate-700">{lightboxItem.notes || 'None'}</span>
                  </div>
                  {lightboxItem.reference_id && (
                    <div>
                      <span className="text-slate-500 font-medium block">Reference ID:</span>
                      <span className="text-slate-700 font-mono text-[11px]">
                        {lightboxItem.reference_id}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 font-medium block">Review Status:</span>
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
