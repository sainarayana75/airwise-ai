import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bot,
  Send,
  User,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { sendChatMessage } from '../../services/chat-service';
import { SUGGESTED_PROMPT_CHIPS } from '../../engine/fallback-assistant';
import { ChatMessage } from '../../types';

export const ChatAssistant: React.FC = () => {
  const { user, envData } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      content: `Hello! I am **AirWise AI**, your intelligent clean-air companion.\n\nI have loaded verified real-time environmental data for **${user.location.city}** (Current AQI: **${envData?.aqi ?? 'N/A'}**, ${envData?.category ?? ''}).\n\nAsk me about outdoor child safety, low-cost indoor filtration, commute advice, or sustainable habits!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFallback: false,
      suggestedFollowUps: SUGGESTED_PROMPT_CHIPS.slice(0, 3),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading || !envData) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(textToSend, user, envData, messages);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Render markdown-like formatting (bold, headers, bullet points) strictly as safe React elements (No XSS)
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-extrabold text-sm sm:text-base text-slate-900 mt-3 mb-1">
            {renderSafeInlineMarkdown(line.replace('### ', ''))}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-black text-base text-slate-900 mt-3 mb-1">
            {renderSafeInlineMarkdown(line.replace('## ', ''))}
          </h3>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const itemText = line.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 text-xs my-0.5 leading-relaxed">
            <span>{renderSafeInlineMarkdown(itemText)}</span>
          </li>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-slate-700 text-xs my-0.5 leading-relaxed">
            <span>{renderSafeInlineMarkdown(line.replace(/^\d+\.\s/, ''))}</span>
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2"></div>;
      }
      return (
        <p key={idx} className="text-slate-700 text-xs leading-relaxed my-1">
          {renderSafeInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderSafeInlineMarkdown = (text: string): React.ReactNode => {
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code key={i} className="px-1 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={i} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-[750px] overflow-hidden relative">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                AirWise Conversational Assistant
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Grounded Hybrid AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Grounded in {user.location.city} verified AQI ({envData?.aqi}) & your family context
            </p>
          </div>
        </div>

        {/* Engine status indicator */}
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="text-[11px]">Strict Scientific Grounding</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${
                  isUser ? 'bg-slate-900' : 'bg-emerald-600'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 sm:p-5 shadow-sm text-xs relative group ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200/80 rounded-tl-none'
                }`}
              >
                {/* Meta details & copy button */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 text-[10px] text-slate-400">
                    <span className="font-semibold text-emerald-700">
                      {msg.isFallback ? 'Deterministic Rule Engine' : 'Google Gemini Server-Side Model'}
                    </span>
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1 hover:text-slate-700 rounded transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Formatted Content */}
                <div>{isUser ? <p className="leading-relaxed">{msg.content}</p> : formatContent(msg.content)}</div>

                <div
                  className={`mt-2 text-[10px] ${
                    isUser ? 'text-slate-400 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>

                {/* Follow-up Prompt Chips */}
                {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center">
                      <Lightbulb className="w-3 h-3 mr-1 text-amber-500" />
                      Suggested Follow-Ups:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(chip)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-3xl rounded-tl-none bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Synthesizing verified environmental recommendation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Suggested Prompt Chips Strip */}
      <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex-shrink-0">
          Quick Questions:
        </span>
        {SUGGESTED_PROMPT_CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSend(chip)}
            disabled={isLoading}
            className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 rounded-full border border-slate-200 whitespace-nowrap transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box Bar */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about smog, children's safety, DIY filtration, or travel..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl shadow-md shadow-emerald-700/20 transition-all"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
