import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, Clock, ChevronRight, X } from 'lucide-react';
import { formatEventDate, formatEventTime } from '@/lib/event-utils';

export default function EventBanner({ event, isExpanded, onToggle, onDismiss }) {
  if (!event) return null;

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'football':
        return 'bg-[#8E6F3E]';
      case 'basketball':
        return 'bg-orange-500';
      case 'concert':
        return 'bg-purple-500';
      case 'graduation':
        return 'bg-blue-500';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative"
      >
        <div
          className={`
            ${getEventTypeColor(event.event_type)} 
            relative rounded-2xl overflow-hidden
            transition-all duration-300
          `}
        >
          {/* Main Banner */}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${event.title}`}
            className="block w-full p-4 pr-12 text-left text-white"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-white/20 text-white hover:bg-white/30 border-0">
                      GAME DAY
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-white/80 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{event.venue}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ChevronRight
                  className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </div>
            </div>
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="absolute top-3 right-3 p-2 text-white hover:bg-white/10 rounded-lg"
              aria-label={`Dismiss ${event.title}`}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 space-y-4 border-t border-white/20">
                  {/* Time */}
                  <div className="flex items-center gap-2 text-white/90">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {formatEventDate(event.date)} · {formatEventTime(event)}
                    </span>
                  </div>

                  {/* Closed Lots */}
                  {event.closed_lots?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-white/70 mb-2">Closed Lots</div>
                      <div className="flex flex-wrap gap-2">
                        {event.closed_lots.map((lot) => (
                          <Badge key={lot} className="bg-red-500/30 text-white border-0">
                            {lot}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Restricted Lots */}
                  {event.restricted_lots?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-white/70 mb-2">
                        Restricted Access
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {event.restricted_lots.map((lot) => (
                          <Badge key={lot} className="bg-yellow-500/30 text-white border-0">
                            {lot}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Alternatives */}
                  {event.alternative_lots?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-white/70 mb-2">
                        Suggested Alternatives
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {event.alternative_lots.map((lot) => (
                          <Badge key={lot} className="bg-green-500/30 text-white border-0">
                            ✓ {lot}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {event.special_instructions && (
                    <div className="p-3 bg-white/10 rounded-xl text-sm text-white/90">
                      {event.special_instructions}
                    </div>
                  )}

                  {/* Shuttle Routes */}
                  {event.shuttle_routes?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-white/70 mb-2">
                        Event Shuttles Available
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {event.shuttle_routes.map((route) => (
                          <Badge key={route} className="bg-white/20 text-white border-0">
                            🚌 {route}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
