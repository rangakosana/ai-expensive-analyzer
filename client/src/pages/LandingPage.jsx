import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Sparkles,
  ShieldCheck,
  PieChart,
  ArrowRight,
  Receipt,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-24 sm:pb-28 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-5 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Powered by Google Gemini 2.5 Flash</span>
        </div>

        <h1 className="text-3xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
          Transform Raw Expenses into <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">
            Intelligent Financial Advice
          </span>
        </h1>

        <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Traditional expense trackers are just digital ledgers. The AI Expense Analyzer tracks your daily transactions, categorizes your spending habits, and leverages Generative AI to pinpoint waste and provide actionable financial tips.
        </p>

        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all"
            >
              Open Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all"
            >
              Sign In to Account
            </Link>
          )}
        </div>

        {/* Application Highlight Frame */}
        <div id="application-showcase-frame" className="mt-10 sm:mt-14 max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 shadow-2xl shadow-indigo-500/20 animate-in fade-in duration-700">
          <div className="bg-slate-950 text-white rounded-[22px] p-5 sm:p-8 overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline">https://ai-expense-analyzer.io/dashboard</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800/60">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>AI Expense Analyzer Active</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left">
              <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Salary Tracked</span>
                <p className="text-lg sm:text-2xl font-black text-white mt-0.5">₹85,000</p>
                <span className="text-[10px] text-emerald-400 font-semibold">100% Locked</span>
              </div>
              <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Monthly Savings</span>
                <p className="text-lg sm:text-2xl font-black text-emerald-400 mt-0.5">₹17,000</p>
                <span className="text-[10px] text-slate-400 font-semibold">20% Goal</span>
              </div>
              <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Safe Daily Limit</span>
                <p className="text-lg sm:text-2xl font-black text-indigo-300 mt-0.5">₹1,650<span className="text-xs font-normal text-slate-400">/day</span></p>
                <span className="text-[10px] text-indigo-400 font-semibold">Healthy Pacing</span>
              </div>
              <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Gemini Advisor</span>
                <p className="text-lg sm:text-2xl font-black text-amber-300 mt-0.5">2.5 Flash</p>
                <span className="text-[10px] text-amber-400 font-semibold">Real-Time Doubts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-12 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 text-left">
          {/* Card 1 */}
          <div className="p-5 sm:p-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 sm:mb-5">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">AI Financial Advisor</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Bundles your monthly spending data and queries Gemini with a strict financial advisory prompt to detect micro-overspending and suggest 3 high-impact habits.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 sm:p-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 sm:mb-5">
              <PieChart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">Visual Breakdown</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Instant category distributions, interactive donut charts, and monthly trend graphs so you always know where your money goes.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 sm:p-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 sm:mb-5">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">Bank-Grade Isolation</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Strict backend authorization enforcing row-level security. Your financial data is securely hashed, validated via Zod, and never shared.
            </p>
          </div>
        </div>

        {/* Categories Supported */}
        <div className="mt-10 sm:mt-16 p-4 sm:p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3">
            9 Supported Expense Categories
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              'Housing',
              'Transportation',
              'Food & Dining',
              'Utilities',
              'Entertainment',
              'Healthcare',
              'Shopping',
              'Personal Care',
              'Miscellaneous',
            ].map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 bg-white rounded-lg text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
