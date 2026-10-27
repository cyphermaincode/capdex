import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';

// Helper to remove any # or * symbols
function cleanText(text) {
  if (!text) return '';
  return text.replace(/[#*]/g, '');
}

export default function AICoachChat({ evaluationId, initialContext }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Suggested Prompts
  const suggestedPrompts = [
    { label: '📋 30-Day Action Plan', text: 'Give me a step-by-step 30-day action plan to improve my lowest scoring competency.' },
    { label: '🌟 Strengths & Weaknesses', text: 'What are my biggest strengths and weaknesses based on my scores?' },
    { label: '♿ Accessibility & Testing', text: 'How can I master accessibility standards and increase my automated test coverage?' },
    { label: '⚡ Performance Optimization', text: 'How can I optimize web performance, reduce bundle size, and improve Core Web Vitals?' },
    { label: '🏆 Promotion Readiness', text: 'Am I eligible for promotion and how can I reach the 85% benchmark?' },
    { label: '🎯 Suggested Growth Goals', text: 'Suggest 3 high-impact developmental growth goals for next quarter.' },
    { label: '👥 Manager 1-on-1 Prep', text: 'How should I prepare to discuss this appraisal in my upcoming manager 1-on-1?' },
    { label: '📊 Full Score Breakdown', text: 'Give me a full breakdown of all my parameter scores and HR reasons.' },
  ];

  // Initial welcome message with typewriter effect on first mount
  useEffect(() => {
    const welcome = cleanText(
      `Hello! I am your CAPDEX AI Performance Coach.\n\nI have analyzed your appraisal scores, competency weights, and HR written rationales. I can provide deep technical guidance, role-specific action plans, code review strategies, and career advancement roadmaps.\n\nSelect a topic below or type your technical question!`
    );
    setMessages([{ role: 'assistant', content: welcome }]);
  }, [evaluationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isTyping]);

  // Clean up any ongoing typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  // Word-by-word typewriter effect
  const typeMessageOut = (fullText) => {
    const cleaned = cleanText(fullText);
    const words = cleaned.split(' ');
    let currentIndex = 0;
    setIsTyping(true);

    // Add empty message placeholder
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    typingTimerRef.current = setInterval(() => {
      currentIndex += 2; // reveal 2 words per tick for natural reading speed
      if (currentIndex >= words.length) {
        clearInterval(typingTimerRef.current);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: cleaned };
          return updated;
        });
        setIsTyping(false);
      } else {
        const partial = words.slice(0, currentIndex).join(' ');
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: partial };
          return updated;
        });
      }
    }, 25);
  };

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading || isTyping) return;

    const userMessage = { role: 'user', content: queryText };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const endpoint = evaluationId ? `/evaluations/${evaluationId}/chat` : '/evaluations/chat';
      const res = await axiosClient.post(endpoint, {
        message: queryText,
        history: updatedHistory.slice(-6)
      });

      setLoading(false);
      const reply = res.data.data?.reply || 'I am analyzing your technical parameters...';
      typeMessageOut(reply);
    } catch (err) {
      setLoading(false);
      typeMessageOut('Unable to connect to AI Coach at the moment. Please try again.');
    }
  };

  const handleClearChat = () => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setIsTyping(false);
    setLoading(false);
    setMessages([
      {
        role: 'assistant',
        content: `Chat history reset. How can I assist with your technical development and performance goals today?`
      }
    ]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-emerald-400 flex items-center justify-center text-black shadow-lg shadow-brand-500/20 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              CAPDEX AI Diagnostic Coach
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Interactive
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Technical guidance, skill gap analysis & actionable growth strategies</p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-800"
          title="Reset conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Reset Chat</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/50 font-sans">
        {messages.map((msg, index) => {
          const isLatestAssistant = msg.role === 'assistant' && index === messages.length - 1 && isTyping;

          return (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-500 text-black font-semibold rounded-tr-none shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-line text-slate-200 font-normal leading-relaxed">
                  {msg.content}
                  {isLatestAssistant && (
                    <span className="inline-block w-2 h-3.5 bg-brand-400 ml-1 animate-pulse align-middle" />
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 shrink-0 mt-0.5 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
              <span>Analyzing your appraisal metrics and formulating technical recommendations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Toolbar */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-400" /> Topics:
        </span>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.text)}
            disabled={loading || isTyping}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] font-medium text-slate-300 hover:text-white whitespace-nowrap transition disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a technical or career question (e.g. How do I improve test coverage?)..."
          disabled={loading || isTyping}
          className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || isTyping || !input.trim()}
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-black font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-brand-500/20 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Ask Coach</span>
        </button>
      </form>
    </div>
  );
}
