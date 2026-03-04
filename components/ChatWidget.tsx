import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Send,
  MessageSquare,
  X,
  Loader2,
  User,
  Minimize2,
  Maximize2,
  Trash2,
  ArrowRight,
  FileText,
  ShieldAlert
} from 'lucide-react';

import { AnalyzeParams, AnalysisResult } from '../types';
import { logger } from '../services/loggerService';

interface ChatWidgetProps {
  analyzeParams: AnalyzeParams;
  analysisResult?: AnalysisResult;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const LOADING_MESSAGES = [
  "Preparing response...",
  "Reviewing contract context...",
  "Analyzing risks...",
  "Drafting explanation..."
];

const ChatWidget: React.FC<ChatWidgetProps> = ({ analysisResult }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Cycle loading messages */
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 1200);
      return () => clearInterval(interval);
    }
    setLoadingMsgIndex(0);
  }, [isLoading]);

  /* Auto-scroll */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  /* Open chat → add intro message */
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'init',
          role: 'model',
          text: "Hi! I'm your Legal Lens AI assistant. I've analyzed this contract. What questions do you have?",
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  const handleReset = () => {
    logger.info('ui', 'Chat reset');
    setMessages([]);
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    const textToSend = customText || input;

    if (!textToSend.trim() || isLoading) return;

    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context from analysis result (overview + risks) or raw content
      let context = "";
      if (analysisResult) {
        context = `Overview: ${analysisResult.oneLineOverview}\nRisks: ${analysisResult.risks.map(r => r.description).join('; ')}`;
      }

      // Call API using shared service (handles Auth headers automatically)
      const response = await api.post('/chat', {
        message: textToSend,
        context: context // Sending summary context to save tokens, ideally send full content if small
      });

      const data = response.data;

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I'm having trouble connecting to the server. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[100] bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="hidden sm:inline font-semibold">Ask Legal AI</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed z-[100] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all
        ${isMinimized
          ? 'bottom-6 right-6 w-80 h-16 rounded-2xl'
          : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-[100dvh] sm:h-[600px] sm:w-[400px] sm:rounded-2xl'
        }
      `}
    >
      {/* Header */}
      <div
        className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold">Legal Assistant</h3>
            {!isMinimized && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <button onClick={handleReset} className="p-2 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button className="p-2">
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0B1120]">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                  {msg.role === 'user' ? <User /> : <MessageSquare />}
                </div>
                <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl max-w-[80%] text-sm whitespace-pre-wrap">
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{LOADING_MESSAGES[loadingMsgIndex]}</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this contract..."
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button disabled={isLoading || !input.trim()} className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:bg-slate-300">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatWidget;
