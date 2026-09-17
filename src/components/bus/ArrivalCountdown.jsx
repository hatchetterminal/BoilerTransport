import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Bus, AlertTriangle, Wifi } from 'lucide-react';

export default function ArrivalCountdown({ arrivals, routeColor }) {
  if (!arrivals || arrivals.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Bus className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No upcoming arrivals</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {arrivals.slice(0, 3).map((arrival, idx) => (
          <motion.div
            key={`${arrival.bus_id}-${idx}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: idx * 0.1 }}
            className={`
              p-4 rounded-2xl border-2 transition-all
              ${idx === 0 ? 'bg-gray-900 border-gray-900 text-white' : 'bg-card border-border'}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${idx === 0 ? 'bg-white/20' : 'bg-muted'}
                  `}
                  style={{
                    backgroundColor: idx === 0 ? 'rgba(255,255,255,0.15)' : routeColor + '20',
                  }}
                >
                  <Bus className="w-5 h-5" style={{ color: idx === 0 ? 'white' : routeColor }} />
                </div>
                <div>
                  <div className={`font-medium ${idx === 0 ? 'text-white' : 'text-foreground'}`}>
                    {arrival.stop_name || 'Next Stop'}
                  </div>
                  <div
                    className={`text-sm ${idx === 0 ? 'text-white/70' : 'text-muted-foreground'}`}
                  >
                    Bus #{arrival.bus_id}
                    {arrival.capacity_status && (
                      <span className="ml-2">• {arrival.capacity_status}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-2xl font-bold tabular-nums ${
                    idx === 0 ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {arrival.eta_minutes === null ? '—' : arrival.eta_minutes}
                  <span
                    className={`text-sm font-normal ml-1 ${
                      idx === 0 ? 'text-white/70' : 'text-muted-foreground'
                    }`}
                  >
                    min
                  </span>
                </div>

                {arrival.is_delayed && (
                  <Badge
                    variant={idx === 0 ? 'outline' : 'destructive'}
                    className={`text-xs mt-1 ${idx === 0 ? 'border-white/30 text-white' : ''}`}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />+{arrival.delay_minutes}
                  </Badge>
                )}
              </div>
            </div>

            {/* Live indicator for first item */}
            {idx === 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-white/60">Live tracking</span>
                <Wifi className="w-3 h-3 text-white/40 ml-auto" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
