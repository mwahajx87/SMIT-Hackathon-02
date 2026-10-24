import React from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black/40 transition-opacity" onClick={onClose} />
        <div className={`relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all w-full ${maxWidth} p-6 border border-[#E3E7EE]`}>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E3E7EE]">
            <h3 className="text-lg font-semibold text-[#1F2A44]">{title}</h3>
            <button 
              onClick={onClose}
              className="text-[#6B7385] hover:text-[#1F2A44] p-1 rounded-md transition-colors"
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
