import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { Star, Clock, AlertTriangle, ChevronRight, Users } from 'lucide-react';

export default function RouteCard({ 
  route, 
  buses, 
  isSelected, 
  onSelect, 
  isFavorite, 
  onToggleFavorite 
}) {
  const routeBuses = buses.filter(b => b.route_id === route.id);
  const hasDelay = routeBuses.some(b => b.is_delayed);
  const nextArrival = routeBuses.length > 0 
    ? Math.min(...routeBuses.map(b => b.eta_minutes || 999))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(route)}
      className={`
        relative p-4 rounded-2xl border-2 transition-all cursor-pointer
        ${isSelected 
          ? 'border-gray-900 bg-gray-50' 
          : 'border-gray-100 bg-white hover:border-gray-200'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ backgroundColor: route.color }}
          >
            {route.short_name}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{route.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {route.is_active ? (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">
                  Inactive
                </Badge>
              )}
              {hasDelay && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Delays
                </Badge>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleFavorite();
          }}
          className="p-2 -mr-2 -mt-1 relative z-10"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        </button>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
        {nextArrival !== null && nextArrival < 999 && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              <span className="font-semibold text-gray-900">{nextArrival}</span>
              <span className="text-gray-500"> min</span>
            </span>
          </div>
        )}
        
        {routeBuses.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              {routeBuses.length} bus{routeBuses.length > 1 ? 'es' : ''} active
            </span>
          </div>
        )}

        <div className="ml-auto">
          <ChevronRight className={`w-5 h-5 transition-transform ${
            isSelected ? 'rotate-90 text-gray-900' : 'text-gray-300'
          }`} />
        </div>
      </div>

      {/* Schedule Info */}
      {route.schedule_start && route.schedule_end && (
        <div className="text-xs text-gray-400 mt-2">
          {route.schedule_start} - {route.schedule_end} • Every {route.frequency_minutes || '?'} min
        </div>
      )}
    </motion.div>
  );
}