import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Sparkles,
  ShieldCheck,
  PieChart,
  ArrowRight,
  Receipt,
  CheckCircle2,
  ScanLine,
  BrainCircuit,
  BarChart3,
  ChevronRight,
  Menu,
  X,
  Wallet,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFD] text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* =========================================================================
          A. DEDICATED WELCOME PAGE HEADER
          A clean, focused header without internal dashboard controls.
          Adapts cleanly if an authenticated user views /welcome or /landing.
      ========================================================================== */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/70 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo */}
            <Link
              to={isAuthenticated ? '/dashboard' : '/'}
              className="flex items-center space-x-2.5 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex items-center">
                <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  AI Expense
                </span>
                <span className="text-lg sm:text-xl font-semibold text-indigo-600">
                  &nbsp;Analyzer
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-lg transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('preview')}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-lg transition-colors cursor-pointer"
              >
                Product Preview
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-lg transition-colors cursor-pointer"
              >
                How It Works
              </button>
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-100 hover:shadow-indigo-200 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Open Dashboard
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-100 hover:shadow-indigo-200 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-2 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="w-full text-left px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('preview')}
              className="w-full text-left px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Product Preview
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="w-full text-left px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              How It Works
            </button>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                >
                  Open Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-100 border border-slate-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          B. HERO SECTION
          Modern, spacious typography with clean gradients and balanced whitespace.
      ========================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Subtle ambient gradient mesh */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-indigo-100/60 via-purple-50/40 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Subtle AI Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-100 shadow-xs mb-6 text-indigo-700 text-xs font-semibold tracking-wide backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            <span>Intelligent Personal Finance Powered by AI</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12] sm:leading-[1.12]">
            Your Money Has a Story.{' '}
            <span className="block mt-2 sm:mt-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600">
              Let AI Help You Understand It.
            </span>
          </h1>

          {/* Supporting description */}
          <p className="mt-5 sm:mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Track your expenses, uncover spending patterns, and turn everyday transactions into meaningful financial insights with AI.
          </p>

          {/* Call-to-action buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200/80 hover:shadow-indigo-300 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
            >
              Explore Features
              <ChevronRight className="w-4 h-4 ml-1 text-slate-400" />
            </button>
          </div>

          {/* Key reassurance points */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-500">
            <span className="inline-flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
              Instant 1-Click Demo
            </span>
            <span className="inline-flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
              Bank-grade data isolation
            </span>
            <span className="inline-flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
              Google Gemini 2.5 Analysis
            </span>
          </div>

          {/* =========================================================================
              C. PRODUCT PREVIEW SECTION
              A polished, realistic demonstration of the AI Expense Analyzer.
          ========================================================================== */}
          <div id="preview" className="mt-12 sm:mt-16 max-w-5xl mx-auto scroll-mt-24">
            <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 p-2 sm:p-3">
              {/* Window Chrome Header */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 rounded-2xl mb-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  <span className="ml-3 font-mono text-slate-400 hidden sm:inline text-[11px]">
                    {typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : 'https://i-expense-analyzer.vercel.app/dashboard'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>AI Engine Connected</span>
                </div>
              </div>

              {/* Realistic Application Interface Demo */}
              <div className="p-3 sm:p-6 text-left space-y-4 sm:space-y-6">
                {/* 1. Key Metrics Strip */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <span>Monthly Income</span>
                      <Wallet className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">₹85,000</div>
                    <span className="text-[11px] text-slate-500">Allocated Budget</span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <span>Spent this Month</span>
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">₹38,450</div>
                    <span className="text-[11px] text-emerald-600 font-medium">45% of budget target</span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <span>Safe Daily Limit</span>
                      <Calendar className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">₹1,550<span className="text-xs font-normal text-slate-500">/day</span></div>
                    <span className="text-[11px] text-emerald-600 font-medium">Healthy pacing</span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <span>Target Savings</span>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">₹17,000</div>
                    <span className="text-[11px] text-indigo-600 font-medium">20% Goal Protected</span>
                  </div>
                </div>

                {/* 2. Split Preview: Activity Feed + AI Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left: Real-time Transaction Ledger */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Recent Transactions
                      </span>
                      <span className="text-[11px] text-slate-400">Live categorization</span>
                    </div>

                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                            FD
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">Fresh Organic Mart</div>
                            <div className="text-[11px] text-slate-500">Food & Dining • Today, 2:30 PM</div>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">₹2,450.00</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                            UT
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">High-Speed Fiber Internet</div>
                            <div className="text-[11px] text-slate-500">Utilities • Yesterday</div>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">₹1,199.00</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            TR
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">Metro Transit Recharge</div>
                            <div className="text-[11px] text-slate-500">Transportation • Oct 22</div>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">₹850.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: AI Insight Callout + Receipt Scanner Preview */}
                  <div className="lg:col-span-5 space-y-3.5">
                    {/* Gemini Advisor Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-tr from-indigo-50/80 to-purple-50/80 border border-indigo-200/70">
                      <div className="flex items-center space-x-2 text-indigo-700 mb-2">
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                        <span className="text-xs font-bold uppercase tracking-wider">AI Spending Advisor</span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-medium">
                        “Dining out is 18% lower this week. Maintaining this trajectory will yield ₹3,400 in surplus savings to allocate toward your emergency fund goal.”
                      </p>
                      <div className="mt-3 inline-flex items-center text-[11px] font-semibold text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-md">
                        Action: Recurring SIP recommendation ready
                      </div>
                    </div>

                    {/* Receipt Scanner Card */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">AI Receipt Scanner</div>
                          <div className="text-[11px] text-slate-500">UPI screenshots or paper bills</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        OCR Live
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          D. FEATURES SECTION
          Explains the existing application capabilities clearly with high-quality cards.
      ========================================================================== */}
      <section id="features" className="py-16 sm:py-24 bg-white border-t border-slate-200/60 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Built for clarity, speed, and real financial intelligence
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-3 leading-relaxed">
              Everything you need to master your expenses without tedious manual bookkeeping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Expense Tracking</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Log transactions in seconds with merchant tagging, standardized categories, date selectors, and rapid keyword search.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gemini analyzes your spending habits to detect overspending, compare velocity, and suggest high-impact financial habits.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Receipt & Invoice OCR</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload paper receipts or payment screenshots. Gemini Vision extracts merchant names, line totals, and dates into an editable review table.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Financial Overview</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Protect fixed bills up front, monitor your safe daily spending allowance, and visualize category distributions with interactive charts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          E. HOW IT WORKS SECTION
          Explain the product in three simple steps.
      ========================================================================== */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-[#FAFAFD] border-t border-slate-200/60 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Simple 3-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              From raw transactions to crystal-clear clarity
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-3 leading-relaxed">
              No spreadsheets. No complicated formulas. Just clean personal finance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-5 shadow-sm shadow-indigo-200">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Add or scan your expenses</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Snap a photo of your receipt, upload UPI payment screenshots, or quickly log daily transactions with one click.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-5 shadow-sm shadow-indigo-200">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Track and understand spending</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The system automatically categorizes your transactions, monitors fixed bills, and updates your safe daily limit.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm mb-5 shadow-sm shadow-indigo-200">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Receive useful AI insights</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate monthly AI reports that highlight spending trends, spot recurring waste, and provide custom savings tips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          F. FINAL CALL TO ACTION & MINIMAL FOOTER
      ========================================================================== */}
      <section className="py-16 sm:py-20 bg-white border-t border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-14 text-center shadow-xl relative overflow-hidden">
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center space-x-2 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Get Started in Under 60 Seconds</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
              Ready to take control of your financial story?
            </h2>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mt-4 leading-relaxed">
              Join users tracking their spending, reviewing OCR receipt extracts, and receiving tailored financial advice.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold text-indigo-950 bg-white hover:bg-slate-100 shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              >
                {isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}
                <ArrowRight className="w-4 h-4 ml-2 text-indigo-900" />
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Clean Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-10 mt-auto text-xs sm:text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-800">AI Expense Analyzer</span>
              <span className="text-slate-400">• Intelligent Personal Finance</span>
            </div>

            <div className="flex items-center space-x-5 text-slate-600">
              <button
                type="button"
                onClick={() => scrollToSection('features')}
                className="hover:text-slate-900 transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-slate-900 transition-colors cursor-pointer"
              >
                How It Works
              </button>
              {isAuthenticated ? (
                <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="hover:text-slate-900 transition-colors">
                    Sign In
                  </Link>
                  <Link to="/register" className="hover:text-slate-900 transition-colors">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              &copy; {new Date().getFullYear()} AI Expense Analyzer. All rights reserved.
            </div>
            <div>
              Strict row-level data isolation • Powered by Google Gemini 2.5
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
