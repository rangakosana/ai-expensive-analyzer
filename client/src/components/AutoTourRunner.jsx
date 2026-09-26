import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  ChevronRight,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const AutoTourRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showFinishedModal, setShowFinishedModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const timerRef = useRef(null);
  const stepTimeoutRef = useRef(null);

  // 110-Second Timed Tour Steps with Voiceover Subtitles
  const steps = [
    {
      id: 'intro_landing',
      duration: 10,
      title: 'Scene 1: The Financial Fog (Landing)',
      route: '/',
      narration:
        'Have you ever opened your bank account at the end of the month and felt a sudden, empty blankness? Spreadsheets take too long. Traditional apps are cold digital ledgers that never tell you what to do next.',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'landing_features',
      duration: 12,
      title: 'Scene 1: Discovering AI Financial Intelligence',
      route: '/',
      narration:
        'What if you had an elite personal financial manager who asks for zero salary, knows every habit and expense, and never lies or betrays you with your money?',
      action: () => {
        window.scrollTo({ top: 600, behavior: 'smooth' });
      },
    },
    {
      id: 'login_transition',
      duration: 8,
      title: 'Scene 2: Seamless Secure Authentication',
      route: '/login',
      narration:
        'Meet AI Expense Analyzer. Powered by Google Gemini 2.5 Flash, it delivers bank-grade row-level security and real-time intelligence.',
      action: async () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try {
          if (!isAuthenticated) {
            await login('demo@example.com', 'Password123!');
          }
        } catch {
          // Fallback gracefully
        }
      },
    },
    {
      id: 'dashboard_overview',
      duration: 16,
      title: 'Scene 3: Dashboard & Dynamic Budget Pacing',
      route: '/dashboard',
      narration:
        'No more guessing if you can afford dinner tonight. Our dynamic Budget Pacing engine calculates your Safe Daily Limit in real time—rebalancing every time you spend.',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'dashboard_charts',
      duration: 14,
      title: 'Scene 3: Visual Spend Breakdown & Pacing Velocity',
      route: '/dashboard',
      narration:
        'Gain instant clarity. Interactive Recharts donut breakdowns and the daily spending strip highlight micro-habits before they become financial leaks.',
      action: () => {
        window.scrollTo({ top: 580, behavior: 'smooth' });
      },
    },
    {
      id: 'calendar_view',
      duration: 16,
      title: 'Scene 4: Spending Calendar Heatmap',
      route: '/calendar',
      narration:
        'Visualize your entire month at a single glance. The Spending Calendar Heatmap highlights high-velocity days from calm emerald to alert amber.',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          const dayButtons = document.querySelectorAll('button[class*="min-h-"]');
          if (dayButtons.length > 5) {
            dayButtons[4].click();
          }
        }, 1500);
      },
    },
    {
      id: 'ai_insights',
      duration: 18,
      title: 'Scene 5: Monthly AI Financial Advisor',
      route: '/insights',
      narration:
        'Need advice at midnight? The Gemini AI Advisor evaluates your monthly habits, pinpoints unnecessary spending, and delivers 3 high-impact actionable tips.',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'expenses_ledger',
      duration: 14,
      title: 'Scene 5: Transaction Management & Dual-View',
      route: '/expenses',
      narration:
        'Track every receipt with camera OCR scanning. Fully responsive on mobile with touch cards and on desktop with full 7-column data tables.',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'finale',
      duration: 10,
      title: 'Scene 6: Total Financial Clarity',
      route: '/dashboard',
      narration:
        'No more blankness. No more fear. With zero salary, total honesty, and bank-grade data isolation, take control of your financial future with AI Expense Analyzer!',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
  ];

  const currentStep = steps[currentStepIndex] || steps[0];

  // Stop Tour Cleanly
  const stopTour = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setElapsedSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
  }, []);

  // Advance to next step
  const executeStep = useCallback(
    (index) => {
      if (index >= steps.length) {
        setIsRunning(false);
        setShowFinishedModal(true);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      setCurrentStepIndex(index);
      const step = steps[index];

      // Navigate if route differs
      if (location.pathname !== step.route) {
        navigate(step.route);
      }

      // Execute custom animation/scroll after page transition
      setTimeout(() => {
        if (step.action) step.action();
      }, 400);

      // Schedule next step
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = setTimeout(() => {
        executeStep(index + 1);
      }, step.duration * 1000);
    },
    [navigate, location.pathname, steps]
  );

  // Start Tour
  const startTour = async () => {
    setShowFinishedModal(false);
    setIsRunning(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setCurrentStepIndex(0);

    // If starting on a subpage, navigate to root first
    if (location.pathname !== '/') {
      navigate('/');
    }

    // Start 1-second interval counter
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Trigger step 0
    executeStep(0);
  };

  // Toggle Pause
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      // Resume current step
      const remainingTime = Math.max(1, currentStep.duration - 2);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      stepTimeoutRef.current = setTimeout(() => {
        executeStep(currentStepIndex + 1);
      }, remainingTime * 1000);
    } else {
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      {/* Floating Tour Launch Button (Visible when tour is not running) */}
      {!isRunning && (
        <div className="fixed bottom-5 left-5 z-50 animate-in fade-in zoom-in-95 duration-300">
          <button
            onClick={startTour}
            className="group flex items-center space-x-2.5 px-4 py-2.5 rounded-full bg-slate-900 text-white border border-indigo-500/40 shadow-xl shadow-indigo-900/30 hover:bg-indigo-950 hover:border-indigo-400 hover:scale-105 transition-all cursor-pointer backdrop-blur-md"
            title="Start automated 2-minute presentation demo"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <div className="text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                Auto-Demo Mode
              </span>
              <span className="text-xs font-semibold text-slate-100 flex items-center gap-1">
                <Play className="w-3 h-3 fill-white text-white" />
                Play 2-Min Tour
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Active Recording Controller & Teleprompter Bar */}
      {isRunning && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl border border-indigo-500/50 shadow-2xl p-4 text-white space-y-3">
            {/* Top Bar: Scene Title, Timer, and Controls */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[11px] font-semibold shrink-0 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>RECORDING</span>
                </div>
                <div className="text-xs font-bold text-amber-400 truncate">
                  {currentStep.title}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-xs font-mono text-slate-300">
                  {formatTime(elapsedSeconds)} / 1:50
                </span>
                <button
                  onClick={togglePause}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title={isPaused ? 'Resume Tour' : 'Pause Tour'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => executeStep(currentStepIndex + 1)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="Skip to next scene"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={stopTour}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                  title="Stop and Exit Tour"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Teleprompter Subtitle / Voiceover Box */}
            <div className="flex items-start space-x-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <Volume2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 mb-0.5">
                  Voiceover Prompt (Read along or record silent):
                </p>
                <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                  "{currentStep.narration}"
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-400 h-full transition-all duration-300"
                style={{
                  width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showFinishedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Tour Completed
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                2-Minute Presentation Recorded!
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                You have toured all primary features: Dynamic Budget Pacing, Spending Heatmap, Gemini AI Advisor, and Transaction management.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={startTour}
                className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Play Again
              </button>
              <button
                onClick={() => setShowFinishedModal(false)}
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AutoTourRunner;
