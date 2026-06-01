import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Car, Clock, AlertTriangle, Star, Navigation, 
  Shield, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const getAvailabilityColor = (status) => {
  switch (status) {
    case 'open': return 'bg-green-500';
    case 'half': return 'bg-amber-500';
    case 'full': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

const getAvailabilityBg = (status) => {
  switch (status) {
    case 'open': return 'bg-green-50 text-green-700 border-green-200';
    case 'half': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'full': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getAvailabilityLabel = (status) => {
  switch (status) {
    case 'open': return 'Available';
    case 'half': return 'Limited Spots';
    case 'full': return 'Full';
    default: return 'Unknown';
  }
};

export default function LotDetailSheet({ lot, isOpen, onClose, isFavorite, onToggleFavorite, eventMode }) {
  if (!lot) return null;
  
  const currentHour = new Date().getHours();
  const availability = lot.availability_pattern?.[currentHour] || 'open';

  // Generate hourly forecast
  const getHourlyForecast = () => {
    const forecast = [];
    for (let i = 0; i < 6; i++) {
      const hour = (currentHour + i) % 24;
      const status = lot.availability_pattern?.[hour] || 'open';
      forecast.push({
        hour: hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`,
        status,
        isCurrent: i === 0
      });
    }
    return forecast;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-white text-gray-900 p-0 z-[1001]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-medium">
                    Lot {lot.code}
                  </Badge>
                  {lot.is_garage && (
                    <Badge variant="outline" className="text-xs">Garage</Badge>
                  )}
                </div>
                <SheetTitle className="text-2xl font-bold text-gray-900">
                  {lot.name}
                </SheetTitle>
              </div>
              <button
                onClick={() => onToggleFavorite(lot.id)}
                className="p-2 -mr-2"
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                  }`}
                />
              </button>
            </div>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-white px-6 py-5 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Current Status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border ${getAvailabilityBg(availability)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${getAvailabilityColor(availability)}`} />
                  <div>
                    <div className="font-semibold">{getAvailabilityLabel(availability)}</div>
                    <div className="text-sm opacity-75">
                      {lot.total_spaces ? `~${lot.total_spaces} total spaces` : 'Current status'}
                    </div>
                  </div>
                </div>
                <Car className="w-8 h-8 opacity-50" />
              </div>
            </motion.div>

            {/* Event Restrictions */}
            {eventMode && lot.event_restricted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-2xl bg-purple-50 border border-purple-200"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-purple-900">Event Mode Active</div>
                    <div className="text-sm text-purple-700 mt-1">
                      {lot.event_notes || 'Special restrictions may apply during events'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Hourly Forecast */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Today's Forecast
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {getHourlyForecast().map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex-shrink-0 w-14 py-3 rounded-xl text-center ${
                      item.isCurrent ? 'bg-gray-900 text-white' : 'bg-gray-100'
                    }`}
                  >
                    <div className="text-xs font-medium mb-2">
                      {item.isCurrent ? 'Now' : item.hour}
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full mx-auto ${getAvailabilityColor(item.status)}`}
                    />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Permits Required */}
            {lot.required_permits?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  Required Permits
                </h3>
                <div className="flex flex-wrap gap-2">
                  {lot.required_permits.map((permit) => (
                    <Badge
                      key={permit}
                      className="bg-gray-900 text-white hover:bg-gray-800 px-3 py-1.5"
                    >
                      {permit}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Time-Based Rules */}
            {lot.time_rules?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  Time Rules
                </h3>
                <div className="space-y-2">
                  {lot.time_rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {rule.days}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {rule.hours} — {rule.rule}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            <Button
              className="w-full h-14 bg-[#CEB888] hover:bg-[#B8A06E] text-gray-900 font-semibold rounded-xl text-base"
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${lot.latitude},${lot.longitude}`;
                window.open(url, '_blank');
              }}
            >
              <Navigation className="w-5 h-5 mr-2" />
              Get Directions
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
