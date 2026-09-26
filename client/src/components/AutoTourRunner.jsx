import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const AutoTourRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showFinishedModal, setShowFinishedModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const timerRef = useRef(null);
  const stepTimeoutRef = useRef(null);

  // Native Browser Voiceover Synthesizer
  const speakNarration = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // cancel previous speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02; // natural, articulate pacing
    utterance.pitch = 1.0;

    // Pick natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Samantha') ||
          v.name.includes('Google') ||
          v.name.includes('Daniel') ||
          v.name.includes('Natural'))
    );
    if (naturalVoice) utterance.voice = naturalVoice;

    window.speechSynthesis.speak(utterance);
  }, []);

  // 60-Second Cinematic Storyboard
  const steps = [
    {
      id: 'scene1_dashboard_clarity',
      duration: 13,
      title: 'Scene 1: From Blankness to Total Clarity',
      route: '/dashboard',
      narration:
        'I used to feel a complete blankness about my money at the end of every month. No clarity, no control. That changed the moment I installed my twenty-four-seven AI Financial Manager.',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'scene2_visual_breakdown',
      duration: 12,
      title: 'Scene 2: Dynamic Budget Pacing & Visual Charts',
      route: '/dashboard',
      narration:
        'Look at this visual clarity. It monitors my fixed bills, calculates my Safe Daily Limit in real time, and shows me exactly where every single rupee flows.',
      action: () => {
        window.scrollTo({ top: 580, behavior: 'smooth' });
      },
    },
    {
      id: 'scene3_calendar_heatmap',
      duration: 13,
      title: 'Scene 3: Daily Spending Heatmap',
      route: '/calendar',
      narration:
        'The interactive Calendar Heatmap spots my high-spend days instantly. Tap any date, and my entire itemized transaction history is right there.',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          const dayButtons = document.querySelectorAll('button[class*="min-h-"]');
          if (dayButtons.length > 5) {
            dayButtons[4].click();
          }
        }, 1200);
      },
    },
    {
      id: 'scene4_ai_advisor',
      duration: 12,
      title: 'Scene 4: The 0-Salary AI Financial Manager',
      route: '/insights',
      narration:
        'This AI asks for zero salary, never lies, and never betrays my money. It detected over two thousand rupees in unnecessary cafe spending and gave me three high-impact habits to keep my savings goal.',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'scene5_triumphant_close',
      duration: 10,
      title: 'Scene 5: Complete Financial Peace of Mind',
      route: '/dashboard',
      narration:
        'No more blankness. No more fear. With total honesty and bank-grade data security, I am finally in complete control of my financial destiny.',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
  ];

  // Stop Tour Cleanly
  const stopTour = useCallback(() => {
    setIsRunning(false);
    setCurrentStepIndex(0);
    setElapsedSeconds(0);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
  }, []);

  // Execute Step
  const executeStep = useCallback(
    (index) => {
      if (index >= steps.length) {
        stopTour();
        setShowFinishedModal(true);
        return;
      }

      setCurrentStepIndex(index);
      const step = steps[index];

      // Navigate if route differs
      if (location.pathname !== step.route) {
        navigate(step.route);
      }

      // Voiceover Speech
      if (voiceEnabled) {
        speakNarration(step.narration);
      }

      // Execute smooth page scroll / click
      setTimeout(() => {
        if (step.action) step.action();
      }, 450);

      // Schedule next step
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = setTimeout(() => {
        executeStep(index + 1);
      }, step.duration * 1000);
    },
    [navigate, location.pathname, voiceEnabled, speakNarration, stopTour, steps]
  );

  // Start Tour
  const startTour = async () => {
    setShowFinishedModal(false);
    setIsRunning(true);
    setElapsedSeconds(0);
    setCurrentStepIndex(0);

    // Ensure demo user is logged in so rich data (₹45,000 spent, budget, charts) is live
    if (!isAuthenticated) {
      try {
        await login('demo@example.com', 'Password123!');
      } catch (err) {
        console.error('Auto login failed:', err);
      }
    }

    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }

    // 1-second interval counter
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Start Step 0
    executeStep(0);
  };

  // Keyboard shortcut: Esc to cancel tour
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isRunning) {
        stopTour();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, stopTour]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    };
  }, []);

  return (
    <>
      {/* Launcher Badge (Only visible when tour is IDLE) */}
      {!isRunning && (
        <div className="fixed bottom-5 left-5 z-50 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center space-x-2 bg-slate-900/90 text-white p-1.5 rounded-full border border-indigo-500/40 shadow-xl backdrop-blur-md">
            <button
              onClick={startTour}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-transform hover:scale-105 cursor-pointer shadow-md shadow-indigo-900/40"
              title="Start 1-minute cinematic recording tour"
            >
              <Play className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>Start 1-Min Cinematic Demo</span>
            </button>

            {/* Voiceover audio toggle */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              title={voiceEnabled ? 'Voiceover narration ON' : 'Voiceover narration OFF'}
            >
              {voiceEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Discrete Escape Control (Only a tiny 20px badge in corner during recording - ZERO screen disturbance!) */}
      {isRunning && (
        <div className="fixed top-3 right-3 z-50 animate-in fade-in duration-300">
          <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full border border-slate-700/60 shadow-lg text-[10px] font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>{elapsedSeconds}s / 60s</span>
            <button
              onClick={stopTour}
              className="hover:text-rose-400 ml-1 p-0.5 cursor-pointer"
              title="Cancel tour (Esc)"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Finished Modal */}
      {showFinishedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                1-Minute Recording Complete
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                Cinematic Demo Finished!
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Your 1-minute presentation captured the transformation from financial fog to total clarity with full graphs, safe daily limit, calendar heatmap, and AI insights.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={startTour}
                className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Play Again
              </button>
              <button
                onClick={() => setShowFinishedModal(false)}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-colors cursor-pointer"
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
