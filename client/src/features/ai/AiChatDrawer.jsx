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

      {/* Drawer Panel (420px width, full screen on mobile) */}
      <div className="relative w-full max-w-[420px] bg-[var(--surface)] dropdown-shadow flex flex-col h-full z-10 border-l border-[var(--border)] transition-colors">
        {/* Header */}
        <div className="h-16 px-4 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--ai-soft)] text-[var(--ai)] flex items-center justify-center font-bold text-xs select-none">
              ✦
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[var(--text)]">HCM Lite assistant</h2>
              <span className="text-[11px] text-[var(--text-muted)] block">Policy, leave & attendance helper</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close assistant"
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)] transition-colors"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[var(--bg)]">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-normal'
                    : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'assistant' && (
                <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-medium bg-[var(--ai-soft)] text-[var(--ai)]">
                  AI-generated
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] p-2.5 bg-[var(--surface)] rounded-lg border border-[var(--border)] w-fit">
              <Bot className="w-3.5 h-3.5 animate-spin text-[var(--ai)]" />
              <span>Consulting policy & data...</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[var(--danger-soft)] border border-[var(--danger)]/20 rounded-lg text-[var(--danger)] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 stroke-[1.75]" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts (including Roman Urdu examples per Section 12) */}
        <div className="p-2.5 bg-[var(--surface)] border-t border-[var(--border)] overflow-x-auto flex gap-1.5">
          {[
            'What is the grace period?',
            'Kal chutti chahiye',
            'Leave balance kitna hai?',
            'Overtime calculation'
          ].map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="text-[11px] whitespace-nowrap bg-[var(--bg)] hover:bg-[var(--ai-soft)] hover:text-[var(--ai)] px-2.5 py-1 rounded-full text-[var(--text-muted)] font-normal border border-[var(--border)] transition-colors cursor-pointer"
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
          className="p-3 bg-[var(--surface)] border-t border-[var(--border)] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI anything about policies, leave..."
            disabled={loading}
            className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-xs bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ai)]"
          />
          <Button
            type="submit"
            size="sm"
            disabled={loading || !input.trim()}
            className="bg-[var(--ai)] hover:opacity-90 text-white h-9 px-3"
          >
            <Send className="w-3.5 h-3.5 stroke-[1.75]" />
          </Button>
        </form>
      </div>
    </div>
  );
}

