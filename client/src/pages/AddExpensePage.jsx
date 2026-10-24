import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  UploadCloud,
  ImageIcon,
  Camera,
  Plus,
  CheckCircle2,
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  Layers,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { expenseService } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { BatchReceiptScannerTable } from '../components/BatchReceiptScannerTable.jsx';
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

export const AddExpensePage = () => {
  const [searchParams] = useSearchParams();
  const dateFromQuery = searchParams.get('date');
  const todayStr = useMemo(
    () => dateFromQuery || new Date().toISOString().slice(0, 10),
    [dateFromQuery]
  );

  // Scanner Table State
  const [batchItems, setBatchItems] = useState([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [existingExpenses, setExistingExpenses] = useState([]);

  const multiFileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const isQueueProcessingRef = useRef(false);
  const batchItemsRef = useRef([]);
  batchItemsRef.current = batchItems;

  const { success, error: toastError } = useToast();

  // Load existing expenses on mount for duplicate detection
  useEffect(() => {
    let isMounted = true;
    expenseService
      .getExpenses({ limit: 100 })
      .then((res) => {
        if (isMounted && Array.isArray(res.data)) {
          setExistingExpenses(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not load existing expenses for duplicate checks:', err?.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sequential AI Scanner Worker (processes 1 screenshot at a time to prevent rate limits)
  const processNextInQueue = useCallback(async () => {
    if (isQueueProcessingRef.current) return;

    // Find next queued item
    const currentList = batchItemsRef.current;
    const nextItem = currentList.find((it) => it.status === 'queued' && it.file);
    if (!nextItem) return;

    isQueueProcessingRef.current = true;

    // Set to scanning
    setBatchItems((prev) =>
      prev.map((it) => (it.id === nextItem.id ? { ...it, status: 'scanning' } : it))
    );

    try {
      // Convert file to Base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(nextItem.file);
      });

      const response = await expenseService.scanReceipt({
        image: base64Data,
        mimeType: nextItem.file.type || 'image/jpeg',
      });

      const data = response.data?.data;
      const extractedList =
        Array.isArray(data?.transactions) && data.transactions.length > 0
          ? data.transactions
          : data?.amount !== undefined || data?.merchant
          ? [data]
          : [];

      if (extractedList.length === 0) {
        // No payment or transaction detected
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === nextItem.id
              ? {
                  ...it,
                  status: 'needs_review',
                  confidence: 'needs_review',
                  is_ready: false,
                  expense_date: '',
                  date_review_reason: 'Date unclear or not visible — please confirm',
                  error:
                    data?.is_valid_transaction === false
                      ? 'No clear payment details detected in this image.'
                      : 'Could not extract details automatically.',
                }
              : it
          )
        );
      } else if (extractedList.length === 1) {
        // Exactly 1 transaction extracted (standard single receipt)
        const tx = extractedList[0];
        const numAmount = parseFloat(tx.amount);
        const hasValidDate = Boolean(tx.expense_date && /^\d{4}-\d{2}-\d{2}$/.test(tx.expense_date) && tx.is_date_confident !== false);
        const hasValidMerchant = Boolean(tx.merchant?.trim());
        const hasValidAmount = !isNaN(numAmount) && numAmount > 0;
        const isReady = hasValidAmount && hasValidMerchant && hasValidDate;

        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === nextItem.id
              ? {
                  ...it,
                  status: isReady ? 'ready' : 'needs_review',
                  amount: tx.amount ? String(tx.amount) : '',
                  merchant: tx.merchant || '',
                  category: CATEGORIES.includes(tx.category) ? tx.category : 'Food & Dining',
                  expense_date: tx.expense_date || '',
                  notes: tx.notes || '',
                  reference_id: tx.reference_id || '',
                  confidence: tx.confidence || (isReady ? 'high' : 'needs_review'),
                  is_ready: isReady,
                  is_date_confident: tx.is_date_confident ?? hasValidDate,
                  date_review_reason: tx.date_review_reason || (hasValidDate ? null : 'Date unclear — please confirm'),
                  amount_review_reason: tx.amount_review_reason || (hasValidAmount ? null : 'Amount not confidently detected'),
                  merchant_review_reason: tx.merchant_review_reason || (hasValidMerchant ? null : 'Merchant name needs review'),
                  error: isReady ? '' : 'Please verify highlighted fields before saving',
                  flashSuccess: true,
                  isMultiExtract: false,
                  itemIndex: 1,
                  totalFromImage: 1,
                }
              : it
          )
        );
      } else {
        // Multiple transactions extracted from a transaction-history screenshot!
        const totalCount = extractedList.length;
        const newRows = extractedList.map((tx, idx) => {
          const numAmount = parseFloat(tx.amount);
          const hasValidDate = Boolean(tx.expense_date && /^\d{4}-\d{2}-\d{2}$/.test(tx.expense_date) && tx.is_date_confident !== false);
          const hasValidMerchant = Boolean(tx.merchant?.trim());
          const hasValidAmount = !isNaN(numAmount) && numAmount > 0;
          const isReady = hasValidAmount && hasValidMerchant && hasValidDate;

          return {
            id: `tx_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
            sourceImageId: nextItem.sourceImageId || nextItem.id,
            file: nextItem.file,
            fileName: nextItem.fileName,
            preview: nextItem.preview,
            status: isReady ? 'ready' : 'needs_review',
            amount: tx.amount ? String(tx.amount) : '',
            merchant: tx.merchant || '',
            category: CATEGORIES.includes(tx.category) ? tx.category : 'Food & Dining',
            expense_date: tx.expense_date || '',
            notes: tx.notes || '',
            reference_id: tx.reference_id || '',
            confidence: tx.confidence || (isReady ? 'high' : 'needs_review'),
            is_ready: isReady,
            is_date_confident: tx.is_date_confident ?? hasValidDate,
            date_review_reason: tx.date_review_reason || (hasValidDate ? null : 'Date unclear — please confirm'),
            amount_review_reason: tx.amount_review_reason || (hasValidAmount ? null : 'Amount not confidently detected'),
            merchant_review_reason: tx.merchant_review_reason || (hasValidMerchant ? null : 'Merchant name needs review'),
            error: isReady ? '' : 'Please verify highlighted fields before saving',
            saving: false,
            saved: false,
            flashSuccess: true,
            isMultiExtract: true,
            itemIndex: idx + 1,
            totalFromImage: totalCount,
          };
        });

        // Replace the single placeholder row with the N extracted rows
        setBatchItems((prev) => {
          const idx = prev.findIndex((it) => it.id === nextItem.id);
          if (idx === -1) return prev;
          const clone = [...prev];
          clone.splice(idx, 1, ...newRows);
          return clone;
        });

        success(`Detected ${totalCount} individual transactions from ${nextItem.fileName}!`);
      }
    } catch (err) {
      console.warn(`Receipt scan error for ${nextItem.fileName}:`, err);
      setBatchItems((prev) =>
        prev.map((it) =>
          it.id === nextItem.id
            ? {
                ...it,
                status: 'needs_review',
                error: err.response?.data?.error || 'Scan failed. You can enter details manually.',
                confidence: 'needs_review',
                is_ready: false,
                expense_date: todayStr,
              }
            : it
        )
      );
    } finally {
      isQueueProcessingRef.current = false;
      // Slight delay before scanning next queued item
      setTimeout(() => {
        processNextInQueue();
      }, 150);
    }
  }, [todayStr, success]);

  // Add files to queue (supports single image or multiple images uniformly)
  const addFilesToBatch = useCallback(
    (files) => {
      if (!files || files.length === 0) return;

      const validFiles = Array.from(files).filter(
        (f) => f && f.type && f.type.startsWith('image/')
      );

      if (validFiles.length === 0) {
        toastError('Please select valid image files (PNG, JPG, WEBP).');
        return;
      }

      const newItems = validFiles.map((file, i) => {
        const sourceImageId = `img_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;
        return {
          id: `tx_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
          sourceImageId,
          file,
          fileName: file.name || `Receipt_${i + 1}`,
          preview: URL.createObjectURL(file),
          status: 'queued',
          amount: '',
          merchant: '',
          category: 'Food & Dining',
          expense_date: todayStr,
          notes: '',
          reference_id: '',
          confidence: 'high',
          is_ready: false,
          error: '',
          saving: false,
          saved: false,
          flashSuccess: false,
          isMultiExtract: false,
          itemIndex: 1,
          totalFromImage: 1,
        };
      });

      setBatchItems((prev) => [...prev, ...newItems]);
      success(
        `Added ${newItems.length} image${newItems.length > 1 ? 's' : ''}! Gemini AI is scanning...`
      );

      setTimeout(() => {
        processNextInQueue();
      }, 60);
    },
    [todayStr, toastError, success, processNextInQueue]
  );

  // Add manual entry row without an image
  const handleAddManualRow = useCallback(() => {
    const manualItem = {
      id: `man_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sourceImageId: null,
      file: null,
      fileName: 'Manual Entry',
      preview: null,
      status: 'needs_review',
      amount: '',
      merchant: '',
      category: 'Food & Dining',
      expense_date: todayStr,
      notes: '',
      reference_id: '',
      confidence: 'high',
      is_ready: false,
      error: '',
      saving: false,
      saved: false,
      flashSuccess: true,
      isMultiExtract: false,
      itemIndex: 1,
      totalFromImage: 1,
    };
    setBatchItems((prev) => [manualItem, ...prev]);
  }, [todayStr]);

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToBatch(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Clipboard Paste handler (Cmd+V / Ctrl+V anywhere on page)
  useEffect(() => {
    const handlePaste = (e) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        addFilesToBatch(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addFilesToBatch]);

  // Update item field in table
  const handleUpdateBatchItem = (id, fields) => {
    setBatchItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, ...fields };

        // Recompute readiness dynamically
        const amt = parseFloat(updated.amount);
        const hasValidAmount = !isNaN(amt) && amt > 0;
        const hasMerchant = Boolean(updated.merchant?.trim());
        const hasValidDate = Boolean(updated.expense_date && /^\d{4}-\d{2}-\d{2}$/.test(updated.expense_date));

        if (hasValidDate) {
          updated.date_review_reason = null;
          updated.is_date_confident = true;
        } else {
          updated.date_review_reason = 'Date unclear — please confirm';
          updated.is_date_confident = false;
        }

        if (hasValidAmount) {
          updated.amount_review_reason = null;
        } else {
          updated.amount_review_reason = 'Amount not confidently detected';
        }

        if (hasMerchant) {
          updated.merchant_review_reason = null;
        } else {
          updated.merchant_review_reason = 'Merchant name needs review';
        }

        const isReady = hasValidAmount && hasMerchant && hasValidDate;
        updated.is_ready = isReady;

        if (updated.status !== 'queued' && updated.status !== 'scanning' && !updated.saved) {
          updated.status = isReady ? 'ready' : 'needs_review';
          updated.error = isReady ? '' : 'Please verify highlighted fields before saving';
        }

        return updated;
      })
    );
  };

  // Remove row from table
  const handleRemoveBatchItem = (id) => {
    setBatchItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Save single row item
  const handleSaveSingleItem = async (itemId) => {
    const item = batchItems.find((it) => it.id === itemId);
    if (!item || item.saved) return;

    const numericAmount = parseFloat(item.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toastError(`Please enter a valid amount for ${item.merchant || 'this expense'}.`);
      return;
    }
    if (!item.merchant?.trim()) {
      toastError('Merchant name is required.');
      return;
    }
    if (!item.expense_date || !/^\d{4}-\d{2}-\d{2}$/.test(item.expense_date)) {
      toastError('A valid expense date (YYYY-MM-DD) is required.');
      return;
    }

    setBatchItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, saving: true } : it))
    );

    try {
      await expenseService.createExpense({
        amount: numericAmount,
        merchant: item.merchant.trim(),
        category: item.category || 'Food & Dining',
        expense_date: item.expense_date,
        notes: item.notes?.trim() || undefined,
      });

      setBatchItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, saving: false, saved: true, status: 'saved', error: '' }
            : it
        )
      );
      success(`Saved ₹${numericAmount.toLocaleString('en-IN')} at ${item.merchant}!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save expense.';
      toastError(msg);
      setBatchItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, saving: false } : it))
      );
    }
  };

  // Save all ready rows
  const handleSaveAllReady = async () => {
    const readyItems = batchItems.filter(
      (it) =>
        !it.saved &&
        (it.status === 'ready' || it.is_ready) &&
        parseFloat(it.amount) > 0 &&
        it.merchant?.trim() &&
        it.expense_date &&
        /^\d{4}-\d{2}-\d{2}$/.test(it.expense_date)
    );

    if (readyItems.length === 0) {
      toastError('No ready expenses to save. Please resolve the highlighted fields first.');
      return;
    }

    // Check for potential duplicates among ready items
    const duplicates = readyItems.filter((it) =>
      Boolean(checkTransactionDuplicate(it, batchItems, existingExpenses))
    );
    if (duplicates.length > 0) {
      const proceed = window.confirm(
        `Notice: ${duplicates.length} of the ${readyItems.length} transaction(s) ready to save are flagged as potential duplicates. Do you want to proceed and save them?`
      );
      if (!proceed) return;
    }

    setIsBatchSaving(true);
    try {
      const payload = readyItems.map((it) => ({
        amount: parseFloat(it.amount),
        merchant: it.merchant.trim(),
        category: it.category || 'Food & Dining',
        expense_date: it.expense_date,
        notes: it.notes?.trim() || undefined,
      }));

      await expenseService.createBatchExpenses(payload);

      setBatchItems((prev) =>
        prev.map((it) =>
          readyItems.some((r) => r.id === it.id)
            ? { ...it, saved: true, status: 'saved', saving: false, error: '' }
            : it
        )
      );

      success(`Successfully saved all ${readyItems.length} expenses to your dashboard!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save batch expenses.';
      toastError(msg);
    } finally {
      setIsBatchSaving(false);
    }
  };

  // Clear all items
  const handleClearBatch = () => {
    setBatchItems([]);
    if (multiFileInputRef.current) multiFileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Accurate Summary Metrics (distinct separation between images and detected transactions)
  const metrics = useMemo(() => {
    const uniqueImages = new Set(
      batchItems.map((it) => it.sourceImageId || it.id).filter(Boolean)
    );
    const imagesUploaded = uniqueImages.size;
    const totalTransactions = batchItems.length;

    let readyCount = 0;
    let needsReviewCount = 0;
    let savedCount = 0;
    let scanningCount = 0;
    let queuedCount = 0;
    let detectedTotal = 0;

    batchItems.forEach((it) => {
      const amt = parseFloat(it.amount);
      if (!isNaN(amt) && amt > 0) detectedTotal += amt;

      const hasValidDate = Boolean(it.expense_date && /^\d{4}-\d{2}-\d{2}$/.test(it.expense_date));
      if (it.saved) {
        savedCount++;
      } else if ((it.status === 'ready' || it.is_ready) && amt > 0 && it.merchant?.trim() && hasValidDate) {
        readyCount++;
      } else if (it.status === 'scanning') {
        scanningCount++;
      } else if (it.status === 'queued') {
        queuedCount++;
      } else {
        needsReviewCount++;
      }
    });

    return {
      imagesUploaded,
      totalTransactions,
      readyCount,
      needsReviewCount,
      savedCount,
      scanningCount,
      queuedCount,
      detectedTotal,
      isScanning: scanningCount > 0,
      hasQueued: queuedCount > 0,
    };
  }, [batchItems]);

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-6 min-w-0">
      {/* Hidden File / Camera Inputs */}
      <input
        ref={multiFileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            addFilesToBatch(e.target.files);
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
            addFilesToBatch(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* A. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            to="/expenses"
            className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors w-fit mb-1.5"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Expenses
          </Link>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AI Expense Scanner
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-2xs">
              <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
              Gemini Vision
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Upload individual payment receipts or transaction-history screenshots. Gemini AI
            automatically extracts every visible expense into the review table below.
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleAddManualRow}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5 text-emerald-600" />
            Add Manual Row
          </button>
          {batchItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearBatch}
              className="inline-flex items-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* B. Unified Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 transition-all text-center relative overflow-hidden ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/70 scale-[1.005]'
            : 'border-slate-300 hover:border-indigo-400 bg-gradient-to-b from-white to-slate-50/60'
        }`}
      >
        <div className="max-w-xl mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3.5 shadow-xs">
            <UploadCloud className={`w-7 h-7 ${isDragging ? 'animate-bounce' : ''}`} />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Drop your receipts or transaction screenshots here
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
            Upload individual receipts or screenshots containing multiple transactions. AI will
            extract the visible expenses for review.
          </p>

          <p className="text-[11px] text-slate-400 mt-2">
            Supports PhonePe, Google Pay, Paytm, bank statements & paper bills (PNG, JPG, WEBP).
            Paste anytime with <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] text-slate-600 font-mono">Cmd+V</kbd>.
          </p>

          {/* Unified Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
            <button
              type="button"
              onClick={() => multiFileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 mr-1.5" />
              Upload Images
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 mr-1.5 text-amber-500" />
              Take Photo
            </button>
          </div>
        </div>
      </div>

      {/* C. Compact Scanner Summary (Shown whenever items exist) */}
      {batchItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Images Uploaded
              </span>
              <span className="text-base font-extrabold text-slate-900">
                {metrics.imagesUploaded}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
                Transactions Detected
              </span>
              <span className="text-base font-extrabold text-indigo-900">
                {metrics.totalTransactions}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
                Ready to Save
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-base font-extrabold text-emerald-800">
                  {metrics.readyCount}
                </span>
                {metrics.needsReviewCount > 0 && (
                  <span className="text-[11px] font-medium text-amber-600">
                    ({metrics.needsReviewCount} check)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-purple-500 uppercase tracking-wider block">
                Detected Total
              </span>
              <span className="text-base font-extrabold text-purple-950">
                ₹{metrics.detectedTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Scanning Progress Banner */}
      {metrics.isScanning && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900 animate-pulse">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span className="font-semibold">
              Gemini Vision AI is extracting transactions... Data will stream directly into the table.
            </span>
          </div>
          <span className="font-bold text-amber-700 font-mono text-[11px]">Processing...</span>
        </div>
      )}

      {/* D. Transaction Review Table */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <BatchReceiptScannerTable
          items={batchItems}
          existingExpenses={existingExpenses}
          onUpdateItem={handleUpdateBatchItem}
          onRemoveItem={handleRemoveBatchItem}
          onSaveItem={handleSaveSingleItem}
          onSaveAll={handleSaveAllReady}
          onClearAll={handleClearBatch}
          isBatchSaving={isBatchSaving}
        />
      </div>
    </div>
  );
};

export default AddExpensePage;
