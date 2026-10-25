import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
        <div className={`relative transform overflow-hidden rounded-xl bg-[var(--surface)] text-left dropdown-shadow transition-all w-full ${maxWidth} p-6 border border-[var(--border)]`}>
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--border)]">
            <h3 className="text-lg font-semibold text-[var(--text)] leading-7">{title}</h3>
            <button 
              onClick={onClose}
              aria-label="Close modal"
              className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

