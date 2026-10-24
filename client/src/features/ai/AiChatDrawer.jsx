import React, { useState } from 'react';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { apiRequest } from '../../lib/api.js';
import { X, Send, Bot, Sparkles, AlertCircle, Clock } from 'lucide-react';

export function AiChatDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI HR Assistant. You can ask me about company attendance policies, your leave balances, work hours, or payroll deductions.',
      label: 'AI-generated'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const suggestedPrompts = [
    'What is the grace period for check-in?',
    'Meri chhutti ka balance kitna bacha hai?',
    'Office timings aur grace period kya hai?',
    'How is overtime and half-day calculated?',
    'How is income tax calculated on salary?'
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    setInput('');
    setError(null);
    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: query })
      });

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: res.answer,
          label: res.label || 'AI-generated'
        }
      ]);
    } catch (err) {
      setError(err.message || 'Failed to communicate with AI Assistant');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full z-10 border-l border-[#E3E7EE]">
        {/* Header */}
        <div className="p-4 bg-[#1F2A44] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#5B4FCF] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm">HCM Lite AI Assistant</h2>
              <span className="text-[10px] text-gray-300 block">Context-aware policy & data helper</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#12A087] text-white rounded-br-none'
                    : 'bg-white text-[#1F2A44] border border-[#E3E7EE] shadow-xs rounded-bl-none'
                }`}
              >
                {m.content}
              </div>
              {m.label && (
                <span className="text-[9px] text-[#6B7385] mt-1 px-1 flex items-center gap-1 font-medium">
                  <Sparkles className="w-2.5 h-2.5 text-[#5B4FCF]" />
                  {m.label}
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#6B7385] p-2 bg-white rounded-lg border border-[#E3E7EE] w-fit">
              <Bot className="w-3.5 h-3.5 animate-spin text-[#5B4FCF]" />
              <span>Consulting policy & tools...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 bg-white border-t border-[#E3E7EE] overflow-x-auto flex gap-2">
          {suggestedPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-[10px] whitespace-nowrap bg-slate-100 hover:bg-[#5B4FCF]/10 hover:text-[#5B4FCF] px-2.5 py-1 rounded-full text-[#6B7385] font-medium transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-[#E3E7EE] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI anything about HCM Lite policies..."
            disabled={loading}
            className="flex-1 px-3 py-2 border border-[#E3E7EE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#5B4FCF]"
          />
          <Button
            type="submit"
            size="sm"
            disabled={loading || !input.trim()}
            className="bg-[#5B4FCF] hover:bg-[#4A3EB5] text-white p-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
