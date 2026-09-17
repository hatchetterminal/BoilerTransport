import React, { lazy, Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Bell, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getActiveTabFromPath } from '@/lib/tabs';
import { useActiveCampusEvents } from '@/hooks/useTransportData';
import { usePreferences } from '@/hooks/usePreferences';

import BottomNav from '../components/common/BottomNav';
import EventBanner from '../components/events/EventBanner';
import NotificationCenter from '../components/notifications/NotificationCenter';
import AppStatusBanner from '../components/common/AppStatusBanner';
import { LoadingState } from '../components/common/DataState';

const ParkingTab = lazy(() => import('../components/tabs/ParkingTab'));
const BusTab = lazy(() => import('../components/tabs/BusTab'));
const EventsTab = lazy(() => import('../components/tabs/EventsTab'));
const ProfileTab = lazy(() => import('../components/tabs/ProfileTab'));

export default function Home() {
  const location = useLocation();
  const [eventBannerExpanded, setEventBannerExpanded] = useState(false);
  const [dismissedEventId, setDismissedEventId] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const activeTab = getActiveTabFromPath(location.pathname);

  const { data: events = [] } = useActiveCampusEvents();

  const activeEvent = events.find((e) => e.id !== dismissedEventId);
  const eventMode = !!activeEvent;

  const preferencesState = usePreferences();
  const tabProps = {
    eventMode,
    activeEvent,
    ...preferencesState,
  };
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-[1100] bg-card/90 backdrop-blur-xl border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Boiler Transport</h1>
            <div className="flex items-center gap-2">
              {eventMode && (
                <Badge className="bg-[#CEB888] text-neutral-900 hover:bg-[#B8A06E]">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Event Mode
                </Badge>
              )}
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="p-2 hover:bg-muted rounded-xl relative select-none"
                aria-label={`Notifications, ${unreadNotifCount} unread`}
                aria-expanded={notifOpen}
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
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
        <AppStatusBanner />
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
            <Suspense fallback={<LoadingState message="Loading section…" />}>
              {renderActiveTab()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={setUnreadNotifCount}
        activeEvent={activeEvent}
        eventAlertsEnabled={
          preferencesState.preferences?.notifications_enabled !== false &&
          preferencesState.preferences?.event_alerts !== false
        }
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
