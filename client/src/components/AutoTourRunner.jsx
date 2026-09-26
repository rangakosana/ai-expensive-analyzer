import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  X,
  Video,
  Download,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const STORAGE_KEY = 'gemini_financial_chat_sessions_v1';

// Seeded Gemini Doubts & Conversations for Arjun Sharma
const SEEDED_CHAT_SESSIONS = [
  {
    id: 'session_goa_trip',
    title: 'Can I afford a Goa trip this month?',
    createdAt: '2026-09-24T10:30:00.000Z',
    updatedAt: '2026-09-24T10:32:00.000Z',
    month: '2026-09',
    messages: [
      {
        role: 'user',
        text: 'Can I afford a weekend getaway to Goa with my remaining September budget?',
        timestamp: '2026-09-24T10:30:00.000Z',
      },
      {
        role: 'model',
        text: 'Yes, Arjun! Based on your September budget (₹85,000 income, ₹27,000 fixed bills), you have a healthy spendable cushion of ₹16,500 remaining with a Safe Daily Limit of ₹1,650/day. A ₹12,000 weekend trip is completely feasible if you allocate ₹3,500 from your dining buffer, all while 100% protecting your ₹17,000 monthly savings goal.',
        timestamp: '2026-09-24T10:30:03.000Z',
      },
    ],
  },
  {
    id: 'session_dining_cut',
    title: 'Cut 15% from dining',
    createdAt: '2026-09-20T14:15:00.000Z',
    updatedAt: '2026-09-20T14:17:00.000Z',
    month: '2026-09',
    messages: [
      {
        role: 'user',
        text: 'How can I cut 15% on dining out without affecting my client meetings?',
        timestamp: '2026-09-20T14:15:00.000Z',
      },
      {
        role: 'model',
        text: 'You have spent ₹5,250 across cafe visits and dinner deliveries. Capping personal afternoon coffee runs to twice a week preserves ₹1,400 monthly with zero impact on professional meetings.',
        timestamp: '2026-09-20T14:15:03.000Z',
      },
    ],
  },
];

export const AutoTourRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const timerRef = useRef(null);
  const stepTimeoutRef = useRef(null);

  // Audio & Video Recording Refs
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);

  // 60-Second Professional Employee Storyboard
  const steps = [
    {
      id: 'scene1_dashboard_clarity',
      duration: 13,
      title: 'Scene 1: Arjun Sharma - Dashboard & Safe Daily Limit',
      route: '/dashboard',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'scene2_visual_breakdown',
      duration: 12,
      title: 'Scene 2: Dynamic Budget Pacing & Recharts',
      route: '/dashboard',
      action: () => {
        window.scrollTo({ top: 580, behavior: 'smooth' });
      },
    },
    {
      id: 'scene3_calendar_heatmap',
      duration: 12,
      title: 'Scene 3: 3-Month Spending Calendar Heatmap',
      route: '/calendar',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          const dayButtons = document.querySelectorAll('button[class*="min-h-"]');
          if (dayButtons.length > 5) {
            dayButtons[5].click(); // click Day 6 Petrol refill
          }
        }, 1200);
      },
    },
    {
      id: 'scene4_gemini_doubts',
      duration: 12,
      title: 'Scene 4: Asking Gemini Financial Doubts',
      route: '/insights',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Automatically open the Gemini Chat modal on screen!
        setTimeout(() => {
          const chatButton = document.querySelector('button[title*="Chat"], button:has(svg.lucide-sparkles)');
          if (chatButton) chatButton.click();
        }, 1000);
      },
    },
    {
      id: 'scene5_triumphant_close',
      duration: 11,
      title: 'Scene 5: Total Peace of Mind & 3 Actionable Tips',
      route: '/insights',
      action: () => {
        // Close chat if open, show insights report
        const closeBtn = document.querySelector('button[aria-label="Close"], button:has(svg.lucide-x)');
        if (closeBtn) closeBtn.click();
        window.scrollTo({ top: 350, behavior: 'smooth' });
      },
    },
  ];

  // Stop Tour Cleanly
  const stopTour = useCallback(() => {
    setIsRunning(false);
    setCurrentStepIndex(0);
    setElapsedSeconds(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Safe catch
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
  }, []);

  // Advance step
  const executeStep = useCallback(
    (index) => {
      if (index >= steps.length) {
        stopTour();
        setShowFinishedModal(true);
        return;
      }

      setCurrentStepIndex(index);
      const step = steps[index];

      if (location.pathname !== step.route) {
        navigate(step.route);
      }

      setTimeout(() => {
        if (step.action) step.action();
      }, 450);

      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = setTimeout(() => {
        executeStep(index + 1);
      }, step.duration * 1000);
    },
    [navigate, location.pathname, stopTour, steps]
  );

  // Initialize Arjun Sharma's Profile & Chat Data
  const prepareProfessionalSession = async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_CHAT_SESSIONS));
      await login('arjun.sharma@techcorp.io', 'Password123!');
    } catch (err) {
      console.warn('Professional login fallback:', err);
    }
  };

  // Start Tour
  const runTourSequence = async () => {
    setShowFinishedModal(false);
    setIsRunning(true);
    setElapsedSeconds(0);
    setCurrentStepIndex(0);

    await prepareProfessionalSession();

    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    executeStep(0);
  };

  // 1-Click Silent Auto-Record Video with Embedded Studio Voiceover
  const startRecordingAndTour = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true,
      });
      streamRef.current = displayStream;

      const audio = new Audio('/cinematic_voiceover.m4a');
      audioRef.current = audio;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const sourceNode = audioCtx.createMediaElementSource(audio);
      const destNode = audioCtx.createMediaStreamDestination();

      sourceNode.connect(destNode);
      sourceNode.connect(audioCtx.destination);

      const combinedTracks = [
        ...displayStream.getVideoTracks(),
        ...destNode.stream.getAudioTracks(),
      ];
      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Arjun_Sharma_AI_Expense_Analyzer_Demo.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        displayStream.getTracks().forEach((track) => track.stop());
      };

      displayStream.getVideoTracks()[0].onended = () => {
        stopTour();
      };

      recorder.start(1000);
      setIsRecordingVideo(true);

      await audio.play();
      await runTourSequence();
    } catch (err) {
      console.warn('Screen recording cancelled, falling back to visual tour:', err);
      runTourSequence();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isRunning) {
        stopTour();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, stopTour]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
    };
  }, []);

  return (
    <>
      {/* Launcher Badge (Only visible when tour is IDLE) */}
      {!isRunning && (
        <div className="fixed bottom-5 left-5 z-50 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-900/90 text-white p-2 rounded-2xl sm:rounded-full border border-indigo-500/40 shadow-2xl backdrop-blur-md">
            {/* Primary Action: 1-Click Silent Recording with Studio Voiceover */}
            <button
              onClick={startRecordingAndTour}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs transition-transform hover:scale-105 cursor-pointer shadow-lg shadow-indigo-900/40"
              title="Record tab video with Arjun Sharma profile & studio voiceover silently in class"
            >
              <Video className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Record 1-Min Video (Arjun Sharma Showcase)</span>
            </button>

            {/* Secondary Action: Visual Tour Only */}
            <button
              onClick={runTourSequence}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              title="Tour visually on screen without auto-recording"
            >
              <Play className="w-3 h-3 text-amber-300 fill-current" />
              <span>Tour Only</span>
            </button>

            {/* Quick Switch to Showcase Account */}
            <button
              onClick={async () => {
                await prepareProfessionalSession();
                navigate('/dashboard');
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full hover:bg-slate-800 text-emerald-300 text-xs font-medium transition-colors cursor-pointer border border-emerald-500/30"
              title="Instantly switch active login to Arjun Sharma"
            >
              <UserCheck className="w-3 h-3 text-emerald-400" />
              <span>Switch to Arjun</span>
            </button>
          </div>
        </div>
      )}

      {/* Discrete Recording Indicator (Only a tiny 18px badge in top-right corner - ZERO SCREEN DISTURBANCE) */}
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
                Showcase Video Completed
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                {isRecordingVideo ? 'Video Downloaded!' : 'Demo Complete!'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isRecordingVideo
                  ? 'Your 1-minute video featuring Arjun Sharma, 3 months of data, budget pacing, and Gemini doubts resolution is in your Downloads folder.'
                  : 'The 1-minute showcase tour has completed successfully.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href="/cinematic_voiceover.m4a"
                download="Arjun_Sharma_Voiceover.m4a"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download Standalone Voiceover (.m4a)
              </a>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={startRecordingAndTour}
                  className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Record Again
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
        </div>
      )}
    </>
  );
};

export default AutoTourRunner;
