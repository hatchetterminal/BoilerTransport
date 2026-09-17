import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bell, Calendar, CheckCircle, X } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

const TYPE_CONFIG = {
  event: {
    icon: Calendar,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/50',
  },
};

function buildNotifications(activeEvent, eventAlertsEnabled) {
  const notifications = [];

  if (activeEvent && eventAlertsEnabled) {
    const restrictions = [
      ...(activeEvent.closed_lots || []),
      ...(activeEvent.restricted_lots || []),
    ];
    notifications.push({
      id: `active-event-${activeEvent.id}`,
      type: 'event',
      title: `${activeEvent.title || activeEvent.name || 'Campus event'} is active`,
      message:
        restrictions.length > 0
          ? `Parking changes affect ${restrictions.join(', ')}. Open the event details for alternatives.`
          : 'Special parking or transportation rules may be in effect.',
      time: activeEvent.start_time || new Date().toISOString(),
    });
  }

  return notifications;
}

function formatTime(isoString) {
  const date = parseISO(isoString);
  if (Number.isNaN(date.getTime())) return '';
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

export default function NotificationCenter({
  isOpen,
  onClose,
  onUnreadCountChange,
  activeEvent,
  eventAlertsEnabled = true,
}) {
  const [readIds, setReadIds] = useState(() => new Set());
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const notifications = useMemo(
    () =>
      buildNotifications(activeEvent, eventAlertsEnabled).filter(
        (notification) => !dismissedIds.has(notification.id),
      ),
    [activeEvent, dismissedIds, eventAlertsEnabled],
  );
  const unreadCount = notifications.filter((notification) => !readIds.has(notification.id)).length;

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const markAllRead = () => {
    setReadIds(
      (previous) => new Set([...previous, ...notifications.map((notification) => notification.id)]),
    );
  };

  const dismiss = (id) => {
    setDismissedIds((previous) => new Set(previous).add(id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Dismiss notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="notifications-title"
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed right-3 left-3 sm:left-auto sm:w-96 z-[10000] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            style={{
              top: 'var(--notification-top)',
              maxHeight:
                'min(75vh, calc(100vh - var(--notification-top) - env(safe-area-inset-bottom, 0px) - 16px))',
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-foreground" aria-hidden="true" />
                <h2 id="notifications-title" className="font-bold text-foreground">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-amber-700 dark:text-amber-300 font-semibold hover:text-amber-800 dark:hover:text-amber-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 hover:bg-muted rounded-lg"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle
                    className="w-8 h-8 mb-2 text-muted-foreground/60"
                    aria-hidden="true"
                  />
                  <p className="text-sm">You&apos;re all caught up.</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.alert;
                  const Icon = config.icon;
                  const isRead = readIds.has(notification.id);
                  return (
                    <article
                      key={notification.id}
                      className={`group flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 ${
                        isRead ? 'bg-card' : 'bg-amber-50/40 dark:bg-amber-950/50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${config.bg}`}
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} aria-hidden="true" />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setReadIds((previous) => new Set(previous).add(notification.id))
                        }
                        className="flex-1 min-w-0 text-left"
                        aria-label={
                          isRead
                            ? `${notification.title}, read`
                            : `${notification.title}, mark as read`
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {notification.title}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {formatTime(notification.time)}
                          </span>
                        </div>
                        <span className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {notification.message}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => dismiss(notification.id)}
                        className="p-1 hover:bg-muted rounded-lg flex-shrink-0 mt-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                        aria-label={`Dismiss ${notification.title}`}
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                      </button>
                    </article>
                  );
                })
              )}
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
