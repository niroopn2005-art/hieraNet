"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export function toast({ message, type = 'info', duration = 3000 }: ToastProps) {
  const toastElement = document.createElement('div');
  
  const colors = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700'
  };

  toastElement.className = cn(
    'fixed top-4 right-4 p-4 rounded-lg shadow-lg',
    'border transform transition-all duration-300',
    'z-50 animate-in fade-in slide-in-from-top-1',
    colors[type]
  );

  // Add message
  toastElement.textContent = message;

  // Add to document
  document.body.appendChild(toastElement);

  // Remove after duration
  setTimeout(() => {
    toastElement.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(toastElement);
    }, 300);
  }, duration);
}

// Add styles to head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    .fade-out {
      animation: fade-out 0.3s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
}
