import { useEffect } from 'react';
import { BADGE_DEFINITIONS } from '../lib/badgeEngine';
import type { BadgeRecord } from '../types/student';

interface ToastNotificationProps {
  badge: BadgeRecord;
  onDismiss: () => void;
}

export default function ToastNotification({ badge, onDismiss }: ToastNotificationProps) {
  const definition = BADGE_DEFINITIONS.find((d) => d.id === badge.badgeId);

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!definition) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-slide-in fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl border border-gray-100 max-w-xs w-full"
    >
      <span className="text-3xl leading-none mt-0.5" aria-hidden="true">
        {definition.icon}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight">
          Badge Unlocked: {definition.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
          {definition.description}
        </p>
      </div>

      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
