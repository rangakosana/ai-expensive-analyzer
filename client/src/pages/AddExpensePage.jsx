import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  IndianRupee,
  Store,
  Tag,
  Calendar,
  FileText,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Camera,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  X,
  ImageIcon,
} from 'lucide-react';
import { expenseService } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';

const CATEGORIES = [
  'Housing',
  'Transportation',
  'Food & Dining',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Personal Care',
  'Miscellaneous',
];

export const AddExpensePage = () => {
  const [searchParams] = useSearchParams();
  const dateFromQuery = searchParams.get('date');
  const todayStr = new Date().toISOString().slice(0, 10);

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [expenseDate, setExpenseDate] = useState(dateFromQuery || todayStr);
  const [notes, setNotes] = useState('');

  // AI Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const processImageFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toastError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toastError('Image file is too large (max 10MB).');
      return;
    }

    // Set preview
    const previewUrl = URL.createObjectURL(file);
    setScanPreview(previewUrl);
    setIsScanning(true);
    setScanSuccessMessage('');
    setErrorMsg('');

    // Read as Base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      try {
        const response = await expenseService.scanReceipt({
          image: base64Data,
          mimeType: file.type,
        });

        const data = response.data?.data;
        if (data) {
          if (data.amount) setAmount(String(data.amount));
          if (data.merchant) setMerchant(data.merchant);
          if (data.category && CATEGORIES.includes(data.category)) {
            setCategory(data.category);
          }
          if (data.expense_date) setExpenseDate(data.expense_date);
          if (data.notes) setNotes(data.notes);

          setScanSuccessMessage(
            `Extracted ₹${data.amount || '0'} to ${data.merchant || 'Payee'} (${data.category || 'Expense'}). Form auto-filled!`
          );
          success('Payment screenshot scanned successfully!');
        } else {
          toastError('Could not detect clear payment details. Please check the fields below.');
        }
      } catch (err) {
        console.error('Receipt scanning error:', err);
        const msg =
          err.response?.data?.error ||
          'Could not extract payment details from this image. Please fill details manually.';
        setErrorMsg(msg);
        toastError(msg);
      } finally {
        setIsScanning(false);
      }
    };

    reader.onerror = () => {
      setIsScanning(false);
      toastError('Failed to read image file.');
    };

    reader.readAsDataURL(file);
  }, [toastError, success]);

  // Listen for Clipboard Paste (Cmd+V / Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImageFile]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearScanPreview = () => {
    setScanPreview(null);
    setScanSuccessMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }

    if (!merchant.trim()) {
      setErrorMsg('Merchant name is required.');
      return;
    }

    if (!expenseDate) {
      setErrorMsg('Expense date is required.');
      return;
    }

    setLoading(true);
    try {
      await expenseService.createExpense({
        amount: numericAmount,
        merchant: merchant.trim(),
        category,
        expense_date: expenseDate,
        notes: notes.trim() || undefined,
      });

      success(`Expense at ${merchant} logged successfully!`);
      navigate('/expenses');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        'Failed to log expense.';
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 min-w-0">
      {/* Back button */}
      <Link
        to="/expenses"
        className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Expenses
      </Link>

      {/* AI Screenshot & Receipt Scanner Box */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl border border-indigo-700/40 relative overflow-hidden">
        {/* Glow ambient circle */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-indigo-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-base sm:text-lg">Instant AI Screenshot Scanner</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Google Gemini
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Snap or upload Google Pay, PhonePe, Paytm screenshots or physical bills
              </p>
            </div>
          </div>
        </div>

        {/* Upload & Dropzone Area */}
        <div className="mt-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-2xl p-5 transition-all text-center flex flex-col items-center justify-center ${
              isDragging
                ? 'border-amber-400 bg-white/10 scale-[1.01]'
                : 'border-indigo-400/40 hover:border-indigo-300/80 bg-white/5 hover:bg-white/[0.08]'
            }`}
          >
            {/* Hidden native inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processImageFile(e.target.files[0]);
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
                  processImageFile(e.target.files[0]);
                }
              }}
            />

            {/* If scanning in progress */}
            {isScanning ? (
              <div className="py-6 flex flex-col items-center space-y-3">
                <div className="relative">
                  {scanPreview && (
                    <img
                      src={scanPreview}
                      alt="Receipt scanning"
                      className="w-24 h-24 object-cover rounded-xl border border-white/30 opacity-70 shadow-lg"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-300" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-white">Google Gemini is reading your payment details...</p>
                  <p className="text-xs text-indigo-200">Extracting amount, recipient, date, and category</p>
                </div>
              </div>
            ) : scanPreview ? (
              /* If preview ready & scanned */
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
                <div className="flex items-center space-x-3">
                  <img
                    src={scanPreview}
                    alt="Receipt preview"
                    className="w-16 h-16 object-cover rounded-xl border border-white/20 shadow-md"
                  />
                  <div className="text-left">
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Scan Complete</span>
                    </div>
                    <p className="text-xs text-indigo-100 font-medium mt-0.5 max-w-sm truncate">
                      {scanSuccessMessage || 'Details extracted! Review below.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={clearScanPreview}
                    className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title="Clear Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Default Dropzone Call to Action */
              <div className="space-y-3 py-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/30 flex items-center justify-center text-indigo-200 mx-auto border border-indigo-400/20">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Drop your payment screenshot here, or{' '}
                    <span
                      onClick={() => fileInputRef.current?.click()}
                      className="text-amber-300 underline underline-offset-2 hover:text-amber-200 cursor-pointer"
                    >
                      browse files
                    </span>
                  </p>
                  <p className="text-xs text-indigo-200/80 mt-1">
                    Supports Google Pay, PhonePe, Paytm, or bank bills (PNG, JPG)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white text-indigo-900 text-xs font-bold hover:bg-indigo-50 transition-all shadow-sm cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Upload Screenshot</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Camera Snap</span>
                  </button>
                </div>

                <p className="text-[11px] text-indigo-300/70 pt-1">
                  💡 Pro-tip: You can also press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Cmd+V</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Ctrl+V</kbd> anywhere on this page to paste a screenshot!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual or AI-populated Form Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-md p-4 sm:p-8">
        <div className="flex items-center justify-between pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
              <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Expense Details</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {scanSuccessMessage ? 'Review your auto-filled details and save' : 'Fill details or let the AI scanner fill them for you'}
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {scanSuccessMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-900 text-xs sm:text-sm font-semibold animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{scanSuccessMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Amount (₹ INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-5 h-5" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 text-base font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Merchant / Payee <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Store className="w-4 h-4" />
              </div>
              <input
                type="text"
                maxLength={100}
                required
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Swiggy, Apollo Pharmacy, Shell, DMart"
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Tag className="w-4 h-4" />
                </div>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-slate-700"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Notes (Optional)
            </label>
            <div className="relative rounded-xl">
              <div className="absolute top-3.5 left-3.5 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                rows={2}
                maxLength={255}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details (e.g. dinner with friends, medicine bill)..."
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 text-right">{notes.length}/255 characters</p>
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Link
              to="/expenses"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || isScanning}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Expense...
                </>
              ) : (
                'Save Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpensePage;
