import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Car, Bus, Calendar, User } from 'lucide-react';
import { getActiveTabFromPath } from '@/lib/tabs';

// Global ref map for tab scroll containers
export const tabScrollRefs = {};

const tabs = [
  { id: 'parking', icon: Car, label: 'Parking' },
  { id: 'bus', icon: Bus, label: 'Bus' },
  { id: 'events', icon: Calendar, label: 'Events' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = getActiveTabFromPath(location.pathname);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1100] select-none">
      <div
        className="bg-card/90 backdrop-blur-xl border-t border-border px-4 pt-2"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => {
                  if (activeTab === tab.id) {
                    // scroll to top if already on this tab
                    const ref = tabScrollRefs[tab.id];
                    if (ref?.current) ref.current.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    navigate(`/${tab.id}`);
                  }
                }}
                className="relative flex flex-col items-center py-2 px-4 min-w-[64px] select-none"
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${tab.label}${isActive ? ', current section' : ''}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 w-12 h-1 bg-[#CEB888] rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-[#CEB888]' : 'text-muted-foreground'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`text-xs mt-1 font-medium transition-colors ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
