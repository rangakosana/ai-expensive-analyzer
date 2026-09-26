import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Receipt,
  CalendarDays,
  IndianRupee,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Camera,
  Bot,
} from 'lucide-react';

export const OnboardingModal = ({ isOpen, onClose, onOpenBudgetModal, userId }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const slides = [
    {
      badge: 'WELCOME TO AI EXPENSE ANALYZER',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'Take Control of Your Financial Runway',
      description:
        'Welcome! This 30-second tour shows you how to track expenditures, prevent month-end budget panic, and use Google Gemini AI to grow your savings.',
      icon: TrendingUp,
      iconBg: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200',
      preview: (
        <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3.5 border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400">Core Highlights</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              100% Private & Real-time
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <ShieldCheck className="w-5 h-5 text-amber-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Safe Daily Spend</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated daily spending runway limit</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <Camera className="w-5 h-5 text-sky-400 mb-1.5" />
              <p className="text-xs font-bold text-white">AI Receipt Scan</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Snap receipts to auto-extract expenses</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <Bot className="w-5 h-5 text-indigo-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Gemini Advisor</p>
              <p className="text-[11px] text-slate-400 mt-0.5">24/7 personal financial intelligence</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: 'STEP 1 • SMART BUDGETING',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Set Monthly Budget & Fixed Obligations',
      description:
        'Enter your monthly income and recurring fixed costs (rent, utilities, WiFi). The system protects your savings goal and gives you a dynamic Safe Daily Spend Limit.',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-600 text-white shadow-lg shadow-emerald-200',
      preview: (
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 rounded-2xl p-5 text-white border border-emerald-800/50 shadow-inner space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-300 font-bold uppercase tracking-wider">Example Runway Calculation</span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
              Target: 20% Savings
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Your Safe Daily Limit</span>
              <h4 className="text-2xl font-black text-emerald-400">
                ₹1,200 <span className="text-xs font-medium text-slate-300">/ day</span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">Rent and savings target automatically locked.</p>
            </div>
            <div className="text-right sm:border-l sm:border-white/10 sm:pl-4">
              <span className="text-[11px] text-slate-400">Days Remaining</span>
              <p className="text-lg font-bold text-white">30 Days</p>
              <span className="text-[11px] text-emerald-300">Runway Protected</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: 'STEP 2 • FAST EXPENSE LOGGING',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      title: 'Log Purchases in 3 Seconds or Snap Receipts',
      description:
        'Record daily spending with one click. Categorize under Food, Travel, Utilities, or Shopping. Use our AI Receipt Scanner to automatically parse photos and PDFs.',
      icon: Receipt,
      iconBg: 'bg-sky-600 text-white shadow-lg shadow-sky-200',
      preview: (
        <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3.5 border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-semibold">Instant Categorization</span>
            <span className="text-sky-400 font-semibold">Live Tagging</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
              🏠 Housing
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
              🥗 Food & Dining
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
              🚕 Transportation
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
              ⚡ Utilities
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
              🛍️ Shopping
            </span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-dashed border-sky-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <Camera className="w-5 h-5 text-sky-400" />
              <span>Drag & drop receipt photo for auto OCR</span>
            </div>
            <span className="bg-sky-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
              AI Vision
            </span>
          </div>
        </div>
      ),
    },
    {
      badge: 'STEP 3 • VISUAL CALENDAR & HEATMAP',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'Analyze Daily Spending Heatmaps',
      description:
        'Switch to the interactive Calendar view to visually see every single day of the month. Spot weekend spending spikes, track low-spend streaks, and drill down on receipts.',
      icon: CalendarDays,
      iconBg: 'bg-purple-600 text-white shadow-lg shadow-purple-200',
      preview: (
        <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-semibold">Monthly Heatmap Grid</span>
            <span className="text-purple-400 font-semibold">Day-by-Day Tracking</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <span key={i} className="text-slate-500 font-bold">{day}</span>
            ))}
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <div
                key={num}
                className={`py-2 rounded-lg border flex flex-col items-center justify-center ${
                  num === 4
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                    : num === 6
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-bold'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-400'
                }`}
              >
                <span>{num}</span>
                <span className="text-[8px] opacity-75">{num === 4 ? '₹450' : num === 6 ? '₹1.2k' : '₹0'}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      badge: 'STEP 4 • GEMINI AI FINANCIAL ADVISOR',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Chat with Google Gemini Anytime',
      description:
        'Tap the floating AI Advisor button anytime for personalized recommendations. Ask questions about your spending patterns or generate monthly financial health audits.',
      icon: Sparkles,
      iconBg: 'bg-amber-500 text-white shadow-lg shadow-amber-200',
      preview: (
        <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="text-amber-400 font-bold flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Gemini AI Chat Advisor
            </span>
            <span className="text-slate-400 text-[11px]">Personalized to your data</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
              💬 "How can I reduce my dining out expenses by ₹3,000 next month?"
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-200">
              🤖 "Based on your 6 coffee visits and weekend dining, packing lunch twice a week will save ₹3,400 comfortably."
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleFinish = (openBudget = false) => {
    if (userId) {
      localStorage.setItem(`has_seen_onboarding_${userId}`, 'true');
    }
    localStorage.setItem('has_seen_onboarding_global', 'true');
    onClose();
    if (openBudget && onOpenBudgetModal) {
      setTimeout(() => {
        onOpenBudgetModal();
      }, 200);
    }
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleFinish(false);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const active = slides[currentSlide];
  const IconComponent = active.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Step indicator and Close button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Slide {currentSlide + 1} of {slides.length}
            </span>
            <div className="flex items-center space-x-1.5 ml-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === currentSlide ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => handleFinish(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Content */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-start space-x-3.5">
            <div className={`w-11 h-11 rounded-2xl ${active.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${active.badgeColor}`}>
                {active.badge}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {active.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                {active.description}
              </p>
            </div>
          </div>

          {/* Interactive Visual Preview */}
          <div className="pt-2">{active.preview}</div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleFinish(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Skip Guide
          </button>

          <div className="flex items-center space-x-2">
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </button>
            )}

            {currentSlide < slides.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-colors cursor-pointer"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish(true)}
                className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-900/20 transition-all cursor-pointer"
              >
                Configure Budget & Start
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
