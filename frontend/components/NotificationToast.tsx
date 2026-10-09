'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
  onClose: (id: string) => void;
}

export function NotificationToast({ id, type, message, onClose }: ToastProps) {
  const icon = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  }[type];

  const border = {
    success: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200',
    warning: 'border-amber-500/30 bg-amber-950/40 text-amber-200',
    error: 'border-rose-500/30 bg-rose-950/40 text-rose-200',
  }[type];

  return (
    <div
      className={`flex items-center gap-3 p-3.5 rounded-lg border shadow-lg backdrop-blur-md transition-all ${border}`}
    >
      {icon}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="ml-auto p-1 rounded hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

