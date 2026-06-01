import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Bell, AlertTriangle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { getActiveTabFromPath } from '@/lib/tabs';

import BottomNav from '../components/common/BottomNav';
import ParkingTab from '../components/tabs/ParkingTab';
import BusTab from '../components/tabs/BusTab';
import EventsTab from '../components/tabs/EventsTab';
import ProfileTab from '../components/tabs/ProfileTab';
import EventBanner from '../components/events/EventBanner';
import NotificationCenter from '../components/notifications/NotificationCenter';

export default function Home() {
  const location = useLocation();
  const [eventBannerExpanded, setEventBannerExpanded] = useState(false);
  const [dismissedEventId, setDismissedEventId] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(2);

  const activeTab = getActiveTabFromPath(location.pathname);

  // Fetch active event
  const { data: events = [] } = useQuery({
    queryKey: ['events', 'active'],
    queryFn: async () => {
      try {
        return await base44.entities.CampusEvent.filter({ is_active: true });
      } catch {
        return [];
      }
    },
    refetchInterval: 60000, // Refresh every minute
    retry: false,
  });

  const activeEvent = events.find(e => e.id !== dismissedEventId);
  const eventMode = !!activeEvent;

  // Fetch user preferences
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const { data: preferences = [] } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      try {
        return await base44.entities.UserPreferences.filter({ user_email: user?.email });
      } catch {
        return [];
      }
    },
    enabled: !!user?.email,
    retry: false,
  });

  const userPrefs = preferences[0];

  const tabProps = { eventMode, activeEvent, userPrefs };
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'bus':
        return <BusTab {...tabProps} />;
      case 'events':
        return <EventsTab {...tabProps} />;
      case 'profile':
        return <ProfileTab {...tabProps} />;
      case 'parking':
      default:
        return <ParkingTab {...tabProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Boiler Transport</h1>
            <div className="flex items-center gap-2">
              {eventMode && (
                <Badge className="bg-[#CEB888] text-gray-900 hover:bg-[#B8A06E]">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Event Mode
                </Badge>
              )}
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="p-2 hover:bg-gray-100 rounded-xl relative select-none"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ paddingTop: 'calc(72px + env(safe-area-inset-top))' }} className="pb-24">
        {/* Event Banner */}
        {activeEvent && activeTab !== 'events' && (
          <div className="px-4 py-3">
            <EventBanner
              event={activeEvent}
              isExpanded={eventBannerExpanded}
              onToggle={() => setEventBannerExpanded(!eventBannerExpanded)}
              onDismiss={() => setDismissedEventId(activeEvent.id)}
            />
          </div>
        )}

        {/* Active Tab */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={setUnreadNotifCount}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
