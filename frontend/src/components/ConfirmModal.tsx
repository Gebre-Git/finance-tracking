import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay Backdrop with backdrop-blur */}
      <div 
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-neutral-100 max-w-md w-full overflow-hidden p-6 transform scale-100 opacity-100 transition-all duration-300 flex flex-col items-center text-center">
        {/* Warning Icon Badge */}
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 animate-bounce">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Text Details */}
        <h3 className="text-lg font-bold text-neutral-800 mb-2">{title}</h3>
        <p className="text-sm text-neutral-500 mb-6 max-w-xs">{message}</p>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl text-sm transition-all duration-200 cursor-pointer active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold rounded-xl text-sm shadow-sm shadow-red-200 transition-all duration-200 cursor-pointer active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
