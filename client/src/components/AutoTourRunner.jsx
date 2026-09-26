import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  X,
  Video,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const AutoTourRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const timerRef = useRef(null);
  const stepTimeoutRef = useRef(null);

  // Audio & Video Recording Refs
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);

  // 60-Second Cinematic Storyboard
  const steps = [
    {
      id: 'scene1_dashboard_clarity',
      duration: 13,
      title: 'Scene 1: From Blankness to Total Clarity',
      route: '/dashboard',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'scene2_visual_breakdown',
      duration: 12,
      title: 'Scene 2: Dynamic Budget Pacing & Visual Charts',
      route: '/dashboard',
      action: () => {
        window.scrollTo({ top: 580, behavior: 'smooth' });
      },
    },
    {
      id: 'scene3_calendar_heatmap',
      duration: 13,
      title: 'Scene 3: Daily Spending Heatmap',
      route: '/calendar',
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
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      id: 'scene5_triumphant_close',
      duration: 10,
      title: 'Scene 5: Complete Financial Peace of Mind',
      route: '/dashboard',
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

    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Stop recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Safe catch
      }
    }

    // Stop tracks
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

      // Navigate if route differs
      if (location.pathname !== step.route) {
        navigate(step.route);
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
    [navigate, location.pathname, stopTour, steps]
  );

  // Start Tour
  const runTourSequence = async () => {
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

    executeStep(0);
  };

  // 1-Click Silent Auto-Record Video with Embedded Studio Voiceover
  const startRecordingAndTour = async () => {
    try {
      // 1. Request user to pick the browser tab to record
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: true, // Captures tab audio digitally
      });
      streamRef.current = displayStream;

      // 2. Load the pre-rendered studio voiceover audio
      const audio = new Audio('/cinematic_voiceover.m4a');
      audioRef.current = audio;

      // 3. Digital Audio Mixing (streams voiceover internally into the video stream)
      // This works even when the physical Mac speakers are completely MUTED!
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const sourceNode = audioCtx.createMediaElementSource(audio);
      const destNode = audioCtx.createMediaStreamDestination();

      sourceNode.connect(destNode);
      // Optional: connect to destination only if user wants to hear through headphones
      sourceNode.connect(audioCtx.destination);

      // Combine video track + digital voiceover audio track
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
        a.download = 'AI_Expense_Analyzer_1Min_Cinematic_Demo.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Stop all tracks
        displayStream.getTracks().forEach((track) => track.stop());
      };

      // Listen for user stopping screen share via browser popup
      displayStream.getVideoTracks()[0].onended = () => {
        stopTour();
      };

      recorder.start(1000);
      setIsRecordingVideo(true);

      // Play digital audio & start visual tour
      await audio.play();
      runTourSequence();
    } catch (err) {
      console.warn('Screen recording cancelled or failed, falling back to visual tour:', err);
      // If user cancels permission dialog, just run the tour
      runTourSequence();
    }
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
              title="Record tab video with studio voiceover silently in class"
            >
              <Video className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Record & Download 1-Min Video (Silent in Class)</span>
            </button>

            {/* Secondary Action: Visual Tour Only (For macOS Cmd+Shift+5) */}
            <button
              onClick={runTourSequence}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              title="Tour visually on screen without auto-recording"
            >
              <Play className="w-3 h-3 text-amber-300 fill-current" />
              <span>Tour Only</span>
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
                1-Minute Tour Completed
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                {isRecordingVideo ? 'Video Downloaded!' : 'Demo Complete!'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isRecordingVideo
                  ? 'Your video was recorded silently with embedded studio voiceover and downloaded to your Downloads folder as an MP4/WebM file.'
                  : 'Your 1-minute cinematic tour has completed. You can re-run anytime.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href="/cinematic_voiceover.m4a"
                download="AI_Expense_Analyzer_Voiceover.m4a"
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
