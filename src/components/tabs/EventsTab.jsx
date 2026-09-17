import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, ChevronRight, Car, Bus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatEventDate, formatEventTime, groupCampusEvents } from '@/lib/event-utils';
import { useCampusEvents } from '@/hooks/useTransportData';
import { normalizeErrorMessage } from '@/lib/transport-utils';
import { ErrorState, LoadingState } from '../common/DataState';

export default function EventsTab({ activeEvent }) {
  const [expandedEventId, setExpandedEventId] = useState(activeEvent?.id);

  const { data: events = [], isLoading, isError, error, refetch } = useCampusEvents();

  useEffect(() => {
    if (activeEvent?.id) setExpandedEventId(activeEvent.id);
  }, [activeEvent?.id]);

  const eventGroups = groupCampusEvents(events.filter((event) => event.id !== activeEvent?.id));

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'football':
        return '🏈';
      case 'basketball':
      case 'mens-basketball':
      case 'womens-basketball':
        return '🏀';
      case 'volleyball':
        return '🏐';
      case 'womens-soccer':
        return '⚽';
      case 'concert':
        return '🎵';
      case 'graduation':
        return '🎓';
      default:
        return '📅';
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'football':
        return 'bg-[#CEB888] text-neutral-900';
      case 'basketball':
      case 'mens-basketball':
      case 'womens-basketball':
        return 'bg-orange-500 text-white';
      case 'concert':
        return 'bg-purple-500 text-white';
      case 'graduation':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-700 text-white';
    }
  };

  const renderEventCard = (event) => {
    const isExpanded = expandedEventId === event.id;
    const isActive = event.id === activeEvent?.id;

    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3"
      >
        <Card
          className={`
            overflow-hidden cursor-pointer transition-all
            ${isActive ? 'ring-2 ring-[#CEB888] ring-offset-2' : ''}
          `}
          onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
          onKeyDown={(keyboardEvent) => {
            if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
              keyboardEvent.preventDefault();
              setExpandedEventId(isExpanded ? null : event.id);
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${event.title}`}
        >
          {/* Header */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getEventTypeColor(event.event_type)}`}
                >
                  {getEventTypeIcon(event.event_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isActive && (
                      <Badge className="bg-red-500 text-white text-xs animate-pulse">
                        GAME DAY
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">
                      {event.sport_label || event.event_type}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-foreground">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{event.venue}</span>
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 mt-3 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatEventDate(event.date)} · {formatEventTime(event)}
              </span>
              {event.expected_attendance && (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {event.expected_attendance.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border">
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}

                  {/* Parking Impact */}
                  <div className="bg-background rounded-xl p-4">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Parking Impact
                    </h4>

                    <p className="text-sm font-medium text-foreground">{event.parking?.summary}</p>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-4">
                      {event.parking?.rules?.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                    {event.parking?.alternatives && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {event.parking.alternatives}
                      </p>
                    )}
                  </div>
                  {event.parking?.transit && (
                    <div className="bg-blue-50 dark:bg-blue-950/50 rounded-xl p-4">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Bus className="w-4 h-4" /> Transit Changes
                      </h4>
                      <p className="text-sm text-muted-foreground">{event.parking.transit}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="px-4 py-3 pb-24 overflow-y-auto h-[calc(100vh-150px)]">
      {isLoading ? (
        <LoadingState message="Loading events…" />
      ) : isError ? (
        <ErrorState
          message={normalizeErrorMessage(error, 'Unable to load campus events')}
          onRetry={refetch}
        />
      ) : eventGroups.length === 0 && !activeEvent ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/60 mb-3" />
          <h3 className="font-semibold text-foreground">No Upcoming Events</h3>
          <p className="text-sm text-muted-foreground mt-1">Check back later for campus events</p>
        </div>
      ) : (
        <>
          {/* Active Event Alert */}
          {activeEvent && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Game Day
              </h2>
              {renderEventCard(activeEvent)}
            </div>
          )}

          {eventGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <h2 className="text-lg font-bold text-foreground mb-3">{group.label}</h2>
              {group.events.map(renderEventCard)}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
