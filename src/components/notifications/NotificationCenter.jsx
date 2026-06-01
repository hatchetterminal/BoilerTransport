import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Calendar, Car, Bus, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'event',
    title: 'Event Mode Active',
    message: 'Parking restrictions are now in effect for today\'s game. Check alternative lots.',
    time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'parking',
    title: 'Lot A Near Capacity',
    message: 'Lot A is now 90% full. Consider Lot C or the North Garage.',
    time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'bus',
    title: 'Gold Route Delay',
    message: 'Gold Route buses are running 8 minutes late due to traffic near Stadium Ave.',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: '4',
    type: 'event',
    title: 'Upcoming: Men\'s Basketball',
    message: 'Basketball game tomorrow at Mackey Arena. Event parking begins at 5:00 PM.',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: '5',
    type: 'parking',
    title: 'Parking Permit Reminder',
    message: 'Permit enforcement begins at 7:30 AM on weekdays. Ensure your permit is displayed.',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: '6',
    type: 'bus',
    title: 'Weekend Schedule Active',
    message: 'Bus routes are now running on weekend frequency. Some routes may have reduced service.',
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

const TYPE_CONFIG = {
  event: { icon: Calendar, color: 'text-[#CEB888]', bg: 'bg-amber-50' },
  parking: { icon: Car, color: 'text-blue-500', bg: 'bg-blue-50' },
  bus: { icon: Bus, color: 'text-green-500', bg: 'bg-green-50' },
  alert: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
};

function formatTime(isoString) {
  const date = parseISO(isoString);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

export default function NotificationCenter({ isOpen, onClose, onUnreadCountChange }) {
  const [notifications, setNotifications] = React.useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[68px] right-3 left-3 sm:left-auto sm:w-96 z-[10000] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[75vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-700" />
                <span className="font-bold text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#CEB888] font-semibold hover:text-[#B8A06E]"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <CheckCircle className="w-8 h-8 mb-2 text-gray-300" />
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.alert;
                  const Icon = config.icon;
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${
                        !notif.read ? 'bg-amber-50/40' : 'bg-white'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${config.bg}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notif.title}
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                            {formatTime(notif.time)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      </div>
                      <button
                        onClick={() => dismiss(notif.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
