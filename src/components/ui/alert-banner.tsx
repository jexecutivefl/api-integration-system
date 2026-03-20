'use client';

import React from 'react';

type AlertVariant = 'info' | 'warning' | 'critical';

interface AlertBannerProps {
  variant: AlertVariant;
  message: string;
  onDismiss?: () => void;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    text: 'text-blue-800',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-l-yellow-500',
    text: 'text-yellow-800',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-l-red-500',
    text: 'text-red-800',
  },
};

function AlertIcon({ variant }: { variant: AlertVariant }) {
  switch (variant) {
    case 'info':
      return (
        <svg className="w-5 h-5 text-blue-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-5 h-5 text-yellow-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'critical':
      return (
        <svg className="w-5 h-5 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

export function AlertBanner({ variant, message, onDismiss }: AlertBannerProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`w-full border-l-4 ${styles.border} ${styles.bg} ${styles.text}`}
      role="alert"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertIcon variant={variant} />
          <p className="text-sm font-medium">{message}</p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${styles.text} opacity-60 hover:opacity-100 transition-opacity p-1 rounded-md`}
            aria-label="Dismiss alert"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
