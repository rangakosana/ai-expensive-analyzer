import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  IndianRupee,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { budgetService } from '../services/api.js';
import { useToast } from './Toast.jsx';

export const BudgetModal = ({ isOpen, onClose, onSaveSuccess, currentBudget }) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [income, setIncome] = useState(3000);
  const [savingsPercent, setSavingsPercent] = useState(20);
  const [fixedBills, setFixedBills] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentBudget) {
      setIncome(Number(currentBudget.monthly_income || 3000));
      setSavingsPercent(Number(currentBudget.savings_target_percentage ?? 20));
      setFixedBills(
        Array.isArray(currentBudget.fixed_bills) && currentBudget.fixed_bills.length > 0
          ? currentBudget.fixed_bills
          : [
              { id: '1', name: 'House Rent', amount: 1250, category: 'Housing' },
              { id: '2', name: 'Metro Electric Utility', amount: 120, category: 'Utilities' },
              { id: '3', name: 'Mobile Recharge', amount: 50, category: 'Utilities' },
            ]
      );
    }
  }, [currentBudget, isOpen]);

  const savingsTargetAmount = useMemo(() => {
    return Math.round((Number(income || 0) * Number(savingsPercent || 0)) / 100);
  }, [income, savingsPercent]);

  const fixedBillsTotal = useMemo(() => {
    return fixedBills.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [fixedBills]);

  const flexibleBudget = useMemo(() => {
    return Math.max(0, Number(income || 0) - savingsTargetAmount - fixedBillsTotal);
  }, [income, savingsTargetAmount, fixedBillsTotal]);

  if (!isOpen) return null;

  const handleAddBill = () => {
    setFixedBills([
      ...fixedBills,
      { id: Date.now().toString(), name: '', amount: '', category: 'Utilities' },
    ]);
  };

  const handleUpdateBill = (index, field, value) => {
    const updated = [...fixedBills];
    updated[index][field] = field === 'amount' ? (value === '' ? '' : Number(value)) : value;
    setFixedBills(updated);
  };

  const handleRemoveBill = (index) => {
    setFixedBills(fixedBills.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanIncome = Number(income);
    if (isNaN(cleanIncome) || cleanIncome < 0) {
      toastError('Please enter a valid monthly income.');
      return;
    }

    const cleanBills = fixedBills
      .filter((b) => b.name.trim() && Number(b.amount) > 0)
      .map((b) => ({
        id: b.id || Date.now().toString(),
        name: b.name.trim(),
        amount: Number(b.amount),
        category: b.category || 'Utilities',
      }));

    setSaving(true);
    try {
      const response = await budgetService.saveBudget({
        monthly_income: cleanIncome,
        savings_target_percentage: Number(savingsPercent),
        fixed_bills: cleanBills,
      });
      toastSuccess('Budget & fixed obligations saved successfully.');
      if (onSaveSuccess) onSaveSuccess(response.data);
      onClose();
    } catch (err) {
      toastError(err.response?.data?.error || 'Failed to save budget settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Monthly Budget & Fixed Obligations</h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Separate non-negotiable bills to calculate your true daily flexible spending allowance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Income & Savings Target Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Monthly Income (₹)
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="e.g. 3000"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Savings Goal Target
                </label>
                <span className="text-xs font-extrabold text-indigo-600">
                  {savingsPercent}% (₹{savingsTargetAmount.toLocaleString('en-IN')})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={savingsPercent}
                onChange={(e) => setSavingsPercent(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>0% (No savings)</span>
                <span>20% (Recommended)</span>
                <span>50% (Aggressive)</span>
              </div>
            </div>
          </div>

          {/* Section: Fixed & Unavoidable Bills */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center">
                  <Lock className="w-4 h-4 mr-1.5 text-slate-500" />
                  Fixed & Unavoidable Bills
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  House rent, mobile plans, utilities. <span className="font-semibold text-slate-700">The AI will never advise cutting these.</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddBill}
                className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Fixed Bill
              </button>
            </div>

            <div className="space-y-2.5">
              {fixedBills.map((bill, index) => (
                <div
                  key={bill.id || index}
                  className="flex items-center gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80"
                >
                  <input
                    type="text"
                    value={bill.name}
                    onChange={(e) => handleUpdateBill(index, 'name', e.target.value)}
                    placeholder="Bill Name (e.g. House Rent)"
                    className="flex-1 px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                    required
                  />

                  <div className="relative w-32">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={bill.amount}
                      onChange={(e) => handleUpdateBill(index, 'amount', e.target.value)}
                      placeholder="Amount"
                      className="w-full pl-6 pr-2.5 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600 text-right"
                      required
                    />
                  </div>

                  <select
                    value={bill.category}
                    onChange={(e) => handleUpdateBill(index, 'category', e.target.value)}
                    className="w-28 px-2 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden text-slate-700"
                  >
                    <option value="Housing">Housing</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Miscellaneous">Other</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveBill(index)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {fixedBills.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No fixed bills added yet. Add your rent or mobile plan so the system subtracts them upfront.
                </div>
              )}
            </div>
          </div>

          {/* Real Flexible Budget Calculation Preview */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 flex items-center">
              <Sparkles className="w-4 h-4 mr-1 text-amber-500" />
              Your Daily Spending Budget
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-white rounded-lg border border-indigo-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Income</span>
                <span className="text-sm font-extrabold text-slate-900">
                  ₹{Number(income || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-indigo-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Savings Target</span>
                <span className="text-sm font-extrabold text-emerald-600">
                  -₹{savingsTargetAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-indigo-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Fixed Bills</span>
                <span className="text-sm font-extrabold text-slate-700">
                  -₹{fixedBillsTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
                <span className="text-[10px] text-indigo-200 font-semibold block">Daily Spending Money</span>
                <span className="text-sm font-black">
                  ₹{flexibleBudget.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-indigo-900/80 leading-relaxed">
              💡 <strong>Why this matters:</strong> You have <strong>₹{flexibleBudget.toLocaleString('en-IN')}</strong> left for your everyday spending. Your fixed bills (₹{fixedBillsTotal.toLocaleString('en-IN')}) and savings (₹{savingsTargetAmount.toLocaleString('en-IN')}) are already taken out and kept safe.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Budget & Fixed Obligations'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;
