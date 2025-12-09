import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullScreen?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, fullScreen = false }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className={`bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col relative w-full ${fullScreen ? 'h-full m-0 rounded-none' : 'max-w-2xl max-h-[90vh]'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-0">
          {children}
        </div>
      </div>
    </div>
  );
};