import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  HelpCircle,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  Clock,
} from 'lucide-react';
import { insightService } from '../services/api.js';

const QUICK_QUESTIONS = [
  'How can I protect my savings this month?',
  'Why did my budget reach 107%?',
  'Can I afford to spend ₹100 more this week?',
  'Give me 3 practical ways to reduce spending.',
];

const STORAGE_KEY = 'gemini_financial_chat_sessions_v1';

const createDefaultSession = (month) => {
  const id = 'session_' + Date.now();
  return {
    id,
    title: 'New Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    month: month || new Date().toISOString().slice(0, 7),
    messages: [
      {
        role: 'model',
        text: "Hello! I am your Google Gemini AI financial advisor. I have full real-time access to your monthly expenses, income, and fixed bills. What would you like to ask or explore?",
        timestamp: new Date().toISOString(),
      },
    ],
  };
};

export const GeminiChatModal = ({ isOpen, onClose, month }) => {
  // Session storage state
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved chat sessions:', e);
    }
    return [createDefaultSession(month)];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return sessions[0]?.id || 'session_default';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions to localStorage:', e);
    }
  }, [sessions]);

  // Focus input on open or session switch
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, activeSessionId]);

  // Loading elapsed seconds timer
  useEffect(() => {
    let timer;
    if (loading) {
      setLoadingTime(0);
      timer = setInterval(() => {
        setLoadingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // Active session
  const currentSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || createDefaultSession(month);
  }, [sessions, activeSessionId, month]);

  const messages = currentSession?.messages || [];

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Group past sessions by relative time (Today, Yesterday, Previous 7 Days, Older)
  const groupedSessions = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const last7DaysStart = todayStart - 6 * 86400000;

    const groups = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    sessions.forEach((session) => {
      const time = new Date(session.updatedAt || session.createdAt).getTime();
      if (time >= todayStart) {
        groups.Today.push(session);
      } else if (time >= yesterdayStart) {
        groups.Yesterday.push(session);
      } else if (time >= last7DaysStart) {
        groups['Previous 7 Days'].push(session);
      } else {
        groups.Older.push(session);
      }
    });

    return groups;
  }, [sessions]);

  // Create fresh session
  const handleNewChat = () => {
    if (loading) return;
    const newSession = createDefaultSession(month);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Delete session
  const handleDeleteSession = (sessionIdToDelete, e) => {
    e.stopPropagation();
    if (loading) return;

    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionIdToDelete);
      if (remaining.length === 0) {
        const fresh = createDefaultSession(month);
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === sessionIdToDelete) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Cancel in-flight request
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  };

  // Send message
  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    // Auto-title session on first user message if still default
    const shouldUpdateTitle = currentSession.title === 'New Conversation' || !currentSession.title;
    const newTitle = shouldUpdateTitle
      ? textToSend.length > 35
        ? textToSend.slice(0, 32) + '...'
        : textToSend
      : currentSession.title;

    // Optimistically update session messages
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            title: newTitle,
            updatedAt: new Date().toISOString(),
            messages: [...s.messages, userMsg],
          };
        }
        return s;
      })
    );

    setInput('');
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Pass clean history (skip initial assistant greeting for clean multi-turn API format)
      const historyPayload = messages
        .filter((m) => m.text && m.text.trim())
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const response = await insightService.chatWithAdvisor(
        {
          message: textToSend,
          history: historyPayload,
          month: currentSession.month || month,
        },
        { signal: controller.signal }
      );

      const replyText =
        response.data?.reply || "I've reviewed your expenses. Let me know if you need specific tips!";

      const modelMsg = {
        role: 'model',
        text: replyText,
        timestamp: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === currentSession.id) {
            return {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: [...s.messages, modelMsg],
            };
          }
          return s;
        })
      );
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        const cancelMsg = {
          role: 'model',
          text: 'Request stopped. Feel free to ask whenever you are ready!',
          timestamp: new Date().toISOString(),
        };
        setSessions((prev) =>
          prev.map((s) => (s.id === currentSession.id ? { ...s, messages: [...s.messages, cancelMsg] } : s))
        );
      } else {
        console.error('Chat error:', err);
        const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
        const errorMsg = {
          role: 'model',
          text: isTimeout
            ? 'Gemini took longer than expected to respond. The server is ready—please click Try Again!'
            : "I couldn't reach the AI advisor right now. Please check your connection or click Try Again below.",
          isError: true,
          lastUserText: textToSend,
          timestamp: new Date().toISOString(),
        };
        setSessions((prev) =>
          prev.map((s) => (s.id === currentSession.id ? { ...s, messages: [...s.messages, errorMsg] } : s))
        );
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Rule of Hooks: Return null only after all hooks are evaluated
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col h-[88vh] max-h-[800px] overflow-hidden border border-slate-200">
        {/* Main Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-2 text-indigo-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title={isSidebarOpen ? 'Hide History' : 'Show History'}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>

            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg text-white">Google Gemini Financial Advisor</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Live AI
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Personalized advice with real-time access to your {currentSession.month || month || 'active'} budget
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleNewChat}
              disabled={loading}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer disabled:opacity-50"
              title="Start New Chat"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-indigo-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer ml-1"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Container: Sidebar + Chat Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* ChatGPT/Gemini Style History Sidebar */}
          {isSidebarOpen && (
            <aside className="w-64 sm:w-72 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0 animate-in slide-in-from-left duration-200">
              {/* New Chat Button */}
              <div className="p-3 border-b border-slate-200/80">
                <button
                  onClick={handleNewChat}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Chat</span>
                </button>
              </div>

              {/* Past Chats List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {Object.entries(groupedSessions).map(([groupTitle, groupItems]) => {
                  if (!groupItems || groupItems.length === 0) return null;
                  return (
                    <div key={groupTitle} className="space-y-1">
                      <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {groupTitle}
                      </div>
                      {groupItems.map((session) => {
                        const isActive = session.id === activeSessionId;
                        return (
                          <div
                            key={session.id}
                            onClick={() => {
                              if (!loading) setActiveSessionId(session.id);
                            }}
                            className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                              isActive
                                ? 'bg-indigo-100/80 text-indigo-900 font-semibold shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0 pr-1">
                              <MessageSquare
                                className={`w-3.5 h-3.5 flex-shrink-0 ${
                                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                                }`}
                              />
                              <span className="truncate" title={session.title}>
                                {session.title || 'Conversation'}
                              </span>
                            </div>

                            {/* Delete Session Button */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer flex-shrink-0"
                              title="Delete Chat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Sidebar Footer info */}
              <div className="p-3 bg-slate-100/60 border-t border-slate-200/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{sessions.length} Saved {sessions.length === 1 ? 'Chat' : 'Chats'}</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 mr-0.5" />
                  <span>Synced</span>
                </span>
              </div>
            </aside>
          )}

          {/* Active Chat Conversation Area */}
          <main className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Quick Suggestion Chips */}
            <div className="p-2.5 sm:p-3 bg-slate-50/80 border-b border-slate-200/80 overflow-x-auto">
              <div className="flex items-center space-x-2 min-w-max text-xs">
                <span className="text-slate-400 font-bold flex items-center mr-1">
                  <HelpCircle className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                  Try asking:
                </span>
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 text-slate-700 font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        isUser
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gradient-to-br from-amber-400 to-indigo-600 text-white shadow-xs'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-xs shadow-sm font-medium'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs space-y-2'
                      }`}
                    >
                      {msg.text.split('\n\n').map((para, pIdx) => (
                        <p key={pIdx} className="leading-relaxed whitespace-pre-wrap">
                          {para}
                        </p>
                      ))}

                      {msg.isError && msg.lastUserText && (
                        <button
                          type="button"
                          onClick={() => handleSend(msg.lastUserText)}
                          className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Try Again</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading Bubble with dynamic time and Cancel action */}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-xs text-xs text-slate-600 flex items-center justify-between gap-3 min-w-[280px]">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span className="font-medium">
                        {loadingTime > 4
                          ? 'Finalizing response with Gemini...'
                          : 'Google Gemini is analyzing your expenses...'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-600 px-2 py-0.5 rounded border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Gemini about your expenses, savings, or advice..."
                  disabled={loading}
                  className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all font-medium"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center cursor-pointer"
                  title="Send Message"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                <span>Powered by Google Gemini</span>
                <span>Indian Rupees (₹) • Persistent History</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default GeminiChatModal;
