import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  UploadCloud,
  ImageIcon,
  Camera,
  Plus,
} from 'lucide-react';
import { expenseService } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { BatchReceiptScannerTable } from '../components/BatchReceiptScannerTable.jsx';

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
  const todayStr = useMemo(() => dateFromQuery || new Date().toISOString().slice(0, 10), [dateFromQuery]);

  // Batch Scanner Table State
  const [batchItems, setBatchItems] = useState([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const multiFileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const isQueueProcessingRef = useRef(false);
  const batchItemsRef = useRef([]);
  batchItemsRef.current = batchItems;

  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  // Sequential AI Scanner Worker (Processes exactly 1 receipt at a time to prevent any mismatches)
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

      const extracted = response.data?.data;

      if (extracted) {
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === nextItem.id
              ? {
                  ...it,
                  status: 'done',
                  amount: extracted.amount ? String(extracted.amount) : '',
                  merchant: extracted.merchant || '',
                  category: CATEGORIES.includes(extracted.category) ? extracted.category : 'Food & Dining',
                  expense_date: extracted.expense_date || todayStr,
                  notes: extracted.notes || '',
                  flashSuccess: true,
                }
              : it
          )
        );
      } else {
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === nextItem.id
              ? {
                  ...it,
                  status: 'error',
                  error: 'Could not extract details',
                  expense_date: todayStr,
                }
              : it
          )
        );
      }
    } catch (err) {
      console.warn(`Receipt scan error for ${nextItem.fileName}:`, err);
      setBatchItems((prev) =>
        prev.map((it) =>
          it.id === nextItem.id
            ? {
                ...it,
                status: 'error',
                error: err.response?.data?.error || 'Scan failed',
                expense_date: todayStr,
              }
            : it
        )
      );
    } finally {
      isQueueProcessingRef.current = false;
      // Slight delay for smooth visual transition before scanning next queued item
      setTimeout(() => {
        processNextInQueue();
      }, 150);
    }
  }, [todayStr]);

  // Add files to batch queue (handles 1 image or multiple images uniformly)
  const addFilesToBatch = useCallback((files) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(
      (f) => f && f.type && f.type.startsWith('image/')
    );

    if (validFiles.length === 0) {
      toastError('Please select valid image files (PNG, JPG, WEBP).');
      return;
    }

    const newItems = validFiles.map((file, i) => ({
      id: `rec_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
      file,
      fileName: file.name || `Receipt_${i + 1}`,
      preview: URL.createObjectURL(file),
      status: 'queued',
      amount: '',
      merchant: '',
      category: 'Food & Dining',
      expense_date: todayStr,
      notes: '',
      error: '',
      saving: false,
      saved: false,
      flashSuccess: false,
    }));

    setBatchItems((prev) => [...prev, ...newItems]);
    success(`Added ${newItems.length} receipt${newItems.length > 1 ? 's' : ''} to table! Scanning with Gemini...`);

    // Kick off queue processing
    setTimeout(() => {
      processNextInQueue();
    }, 60);
  }, [todayStr, toastError, success, processNextInQueue]);

  // Add a clean manual row without an image
  const handleAddManualRow = useCallback(() => {
    const manualItem = {
      id: `man_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file: null,
      fileName: 'Manual Entry',
      preview: null,
      status: 'done',
      amount: '',
      merchant: '',
      category: 'Food & Dining',
      expense_date: todayStr,
      notes: '',
      error: '',
      saving: false,
      saved: false,
      flashSuccess: true,
    };
    setBatchItems((prev) => [...prev, manualItem]);
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
      prev.map((it) => (it.id === id ? { ...it, ...fields } : it))
    );
  };

  // Remove row from table
  const handleRemoveBatchItem = (id) => {
    setBatchItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Save single row item
  const handleSaveSingleItem = async (itemId) => {
    const item = batchItems.find((it) => it.id === itemId);
    if (!item) return;

    const numericAmount = parseFloat(item.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toastError(`Please enter a valid amount for ${item.merchant || 'this receipt'}.`);
      return;
    }
    if (!item.merchant?.trim()) {
      toastError('Merchant name is required.');
      return;
    }
    if (!item.expense_date) {
      toastError('Expense date is required.');
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
          it.id === itemId ? { ...it, saving: false, saved: true, status: 'saved' } : it
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
    const readyItems = batchItems.filter((it) => (it.status === 'done' || it.status === 'error') && !it.saved);
    if (readyItems.length === 0) return;

    const invalidItem = readyItems.find(
      (it) => !it.merchant?.trim() || isNaN(parseFloat(it.amount)) || parseFloat(it.amount) <= 0
    );
    if (invalidItem) {
      toastError('Some receipts have missing amounts or merchants. Please check them before saving.');
      return;
    }

    setIsBatchSaving(true);
    try {
      const payload = readyItems.map((it) => ({
        amount: parseFloat(it.amount),
        merchant: it.merchant.trim(),
        category: it.category || 'Food & Dining',
        expense_date: it.expense_date || todayStr,
        notes: it.notes?.trim() || undefined,
      }));

      await expenseService.createBatchExpenses(payload);

      setBatchItems((prev) =>
        prev.map((it) =>
          readyItems.some((r) => r.id === it.id)
            ? { ...it, saved: true, status: 'saved', saving: false }
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

  // Overall batch progress calculations
  const overallProgress = useMemo(() => {
    const total = batchItems.length;
    if (total === 0) return { total: 0, completed: 0, current: 0, percent: 0 };
    const completed = batchItems.filter(
      (it) => it.status === 'done' || it.status === 'saved' || it.status === 'error'
    ).length;
    const currentScanningIdx = batchItems.findIndex((it) => it.status === 'scanning');
    const current = currentScanningIdx !== -1 ? currentScanningIdx + 1 : completed;
    const percent = Math.round((completed / total) * 100);
    return { total, completed, current, percent };
  }, [batchItems]);

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-5 min-w-0">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            to="/expenses"
            className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors w-fit mb-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Expenses
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Add Expenses & Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Upload payment screenshots (UPI, GPay, PhonePe, Paytm, or bills). Gemini AI scans each one into the review table below.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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

          <button
            type="button"
            onClick={() => multiFileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 mr-1.5" />
            Upload Receipts
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 mr-1.5 text-amber-500" />
            Take Photo
          </button>

          <button
            type="button"
            onClick={handleAddManualRow}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5 text-emerald-600" />
            Add Manual Row
          </button>
        </div>
      </div>

      {/* Dropzone Banner (Always visible & interactive) */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => multiFileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer ${
          isDragging
            ? 'border-amber-400 bg-indigo-50/50 scale-[1.005]'
            : 'border-slate-300 hover:border-indigo-400 bg-white/70 hover:bg-indigo-50/30'
        }`}
      >
        <div className="flex items-center space-x-3.5 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 mx-auto sm:mx-0">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Drag & Drop Receipts Here or Click to Browse
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select 1, 5, 10 or more screenshots at once. You can also paste copied images (<kbd className="px-1 py-0.2 rounded bg-slate-100 border text-[10px]">Cmd+V</kbd>).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Gemini AI Auto-Extract
          </span>
        </div>
      </div>

      {/* Central Review Table (Always rendered, shows real-time extraction & rows) */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <BatchReceiptScannerTable
          items={batchItems}
          onUpdateItem={handleUpdateBatchItem}
          onRemoveItem={handleRemoveBatchItem}
          onSaveItem={handleSaveSingleItem}
          onSaveAll={handleSaveAllReady}
          onAddMoreFiles={addFilesToBatch}
          onAddManualRow={handleAddManualRow}
          onClearAll={handleClearBatch}
          isBatchSaving={isBatchSaving}
          overallProgress={overallProgress}
        />
      </div>
    </div>
  );
};

export default AddExpensePage;
