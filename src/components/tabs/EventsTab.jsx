import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, ChevronRight, AlertTriangle, Car, Bus } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format, isToday, isTomorrow, isThisWeek, addWeeks, isBefore, isAfter, startOfDay, endOfWeek } from 'date-fns';

export default function EventsTab({ eventMode, activeEvent }) {
  const [expandedEventId, setExpandedEventId] = useState(activeEvent?.id);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        return await base44.entities.CampusEvent.list('-start_time');
      } catch {
        return [];
      }
    },
    retry: false,
  });

  // Group events
  const now = new Date();
  const nextWeekStart = addWeeks(startOfDay(now), 1);
  const nextWeekEnd = endOfWeek(nextWeekStart);
  
  const todayEvents = events.filter(e => isToday(new Date(e.start_time)));
  const tomorrowEvents = events.filter(e => isTomorrow(new Date(e.start_time)));
  const thisWeekEvents = events.filter(e => {
    const date = new Date(e.start_time);
    return !isToday(date) && !isTomorrow(date) && isThisWeek(date);
  });
  const nextWeekEvents = events.filter(e => {
    const date = new Date(e.start_time);
    return isAfter(date, nextWeekStart) && isBefore(date, nextWeekEnd);
  });
  const laterEvents = events.filter(e => {
    const date = new Date(e.start_time);
    return isAfter(date, nextWeekEnd);
  });

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'football': return '🏈';
      case 'basketball': return '🏀';
      case 'concert': return '🎵';
      case 'graduation': return '🎓';
      default: return '📅';
    }
  };

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'football': return 'bg-[#CEB888] text-gray-900';
      case 'basketball': return 'bg-orange-500 text-white';
      case 'concert': return 'bg-purple-500 text-white';
      case 'graduation': return 'bg-blue-500 text-white';
      default: return 'bg-gray-700 text-white';
    }
  };

  const renderEventCard = (event) => {
    const isExpanded = expandedEventId === event.id;
    const isActive = event.is_active;
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

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
        >
          {/* Header */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getEventTypeColor(event.event_type)}`}>
                  {getEventTypeIcon(event.event_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isActive && (
                      <Badge className="bg-red-500 text-white text-xs animate-pulse">
                        LIVE
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs capitalize">
                      {event.event_type}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-gray-900">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{event.venue}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 mt-3 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              </span>
              {event.expected_attendance && (
                <>
                  <span className="text-gray-300">•</span>
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{event.expected_attendance.toLocaleString()}</span>
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
                <div className="px-4 pb-4 pt-2 space-y-4 border-t border-gray-100">
                  {event.description && (
                    <p className="text-sm text-gray-600">{event.description}</p>
                  )}

                  {/* Parking Impact */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Parking Impact
                    </h4>
                    
                    {event.closed_lots?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-red-600 mb-1.5">Closed Lots</div>
                        <div className="flex flex-wrap gap-1.5">
                          {event.closed_lots.map(lot => (
                            <Badge key={lot} variant="destructive" className="text-xs">
                              {lot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {event.restricted_lots?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-amber-600 mb-1.5">Restricted Access</div>
                        <div className="flex flex-wrap gap-1.5">
                          {event.restricted_lots.map(lot => (
                            <Badge key={lot} className="text-xs bg-amber-100 text-amber-800 border-0">
                              {lot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {event.alternative_lots?.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-green-600 mb-1.5">Recommended Alternatives</div>
                        <div className="flex flex-wrap gap-1.5">
                          {event.alternative_lots.map(lot => (
                            <Badge key={lot} className="text-xs bg-green-100 text-green-800 border-0">
                              ✓ {lot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transportation */}
                  {event.shuttle_routes?.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Bus className="w-4 h-4" />
                        Event Shuttles
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {event.shuttle_routes.map(route => (
                          <Badge key={route} className="text-xs bg-blue-100 text-blue-800 border-0">
                            🚌 {route}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {event.special_instructions && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                        <p className="text-sm text-amber-800">{event.special_instructions}</p>
                      </div>
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p className="text-sm">Loading events...</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-700">No Upcoming Events</h3>
          <p className="text-sm text-gray-500 mt-1">Check back later for campus events</p>
        </div>
      ) : (
        <>
          {/* Active Event Alert */}
          {activeEvent && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Happening Now
              </h2>
              {renderEventCard(activeEvent)}
            </div>
          )}

          {/* Today */}
          {todayEvents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Today</h2>
              {todayEvents.map(renderEventCard)}
            </div>
          )}

          {/* Tomorrow */}
          {tomorrowEvents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Tomorrow</h2>
              {tomorrowEvents.map(renderEventCard)}
            </div>
          )}

          {/* This Week */}
          {thisWeekEvents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">This Week</h2>
              {thisWeekEvents.map(renderEventCard)}
            </div>
          )}

          {/* Next Week */}
          {nextWeekEvents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Next Week</h2>
              {nextWeekEvents.map(renderEventCard)}
            </div>
          )}

          {/* Later This Year */}
          {laterEvents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Later This Year</h2>
              {laterEvents.map(renderEventCard)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
