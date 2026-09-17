import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, AlertTriangle, ChevronRight, Users } from 'lucide-react';

export default function RouteCard({
  route,
  buses,
  isSelected,
  onSelect,
  isFavorite,
  onToggleFavorite,
}) {
  const routeBuses = buses.filter((b) => b.route_id === route.id);
  const hasDelay = routeBuses.some((b) => b.is_delayed);
  const nextArrival =
    routeBuses.length > 0 ? Math.min(...routeBuses.map((b) => b.eta_minutes ?? 999)) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-4 rounded-2xl border-2 transition-all cursor-pointer
        ${
          isSelected
            ? 'border-gray-900 dark:border-[#CEB888] bg-background'
            : 'border-border bg-card hover:border-border'
        }
      `}
    >
      <button
        type="button"
        onClick={() => onSelect(route)}
        className="absolute inset-0 rounded-2xl"
        aria-label={`View ${route.name} route`}
        aria-expanded={isSelected}
      />
      <div className="relative pointer-events-none flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ backgroundColor: route.color }}
          >
            {route.short_name}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{route.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {route.is_active ? (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                >
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
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
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleFavorite();
          }}
          className="p-2 -mr-2 -mt-1 relative z-10 pointer-events-auto"
          aria-label={
            isFavorite ? `Remove ${route.name} from favorites` : `Add ${route.name} to favorites`
          }
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/60'
            }`}
          />
        </button>
      </div>

      {/* Stats Row */}
      <div className="relative pointer-events-none flex items-center gap-4 mt-4 pt-3 border-t border-border">
        {nextArrival !== null && nextArrival < 999 && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-semibold text-foreground">{nextArrival}</span>
              <span className="text-muted-foreground"> min</span>
            </span>
          </div>
        )}

        {routeBuses.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {routeBuses.length} bus{routeBuses.length > 1 ? 'es' : ''} active
            </span>
          </div>
        )}

        <div className="ml-auto">
          <ChevronRight
            className={`w-5 h-5 transition-transform ${
              isSelected ? 'rotate-90 text-foreground' : 'text-muted-foreground/60'
            }`}
          />
        </div>
      </div>

      {/* Schedule Info */}
      {route.schedule_start && route.schedule_end && (
        <div className="relative pointer-events-none text-xs text-muted-foreground mt-2">
          {route.schedule_start} - {route.schedule_end} • Every {route.frequency_minutes || '?'} min
        </div>
      )}
    </motion.article>
  );
}
