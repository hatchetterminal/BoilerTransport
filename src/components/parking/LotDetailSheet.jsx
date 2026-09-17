import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Car,
  Clock,
  AlertTriangle,
  Star,
  Navigation,
  Shield,
  Calendar,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getAvailabilityStatus } from '@/lib/transport-utils';
import {
  getAvailabilityMeta,
  getParkingCategories,
  getParkingFacilityLabel,
} from '@/lib/parking-utils';
import { isNativeApp, openDirections, openExternalUrl } from '@/lib/native-platform';

export default function LotDetailSheet({
  lot,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  eventMode,
}) {
  if (!lot) return null;

  const currentHour = new Date().getHours();
  const availability = getAvailabilityMeta(lot, currentHour);
  const parkingCategories = getParkingCategories(lot);
  const hasAvailabilityPattern = Object.keys(lot.availability_pattern || {}).length > 0;

  // Generate hourly forecast
  const getHourlyForecast = () => {
    const forecast = [];
    for (let i = 0; i < 6; i++) {
      const hour = (currentHour + i) % 24;
      const status = getAvailabilityStatus(lot, hour);
      forecast.push({
        hour:
          hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`,
        status,
        isCurrent: i === 0,
      });
    }
    return forecast;
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-3xl bg-card text-foreground p-0 z-[2100]"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border bg-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-medium">
                    {lot.code || 'Parking'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getParkingFacilityLabel(lot)}
                  </Badge>
                  {parkingCategories.includes('visitor') && (
                    <Badge className="border-0 bg-blue-100 dark:bg-blue-950/50 text-xs text-blue-700 dark:text-blue-300">
                      Visitor / paid
                    </Badge>
                  )}
                </div>
                <SheetTitle className="text-2xl font-bold text-foreground">{lot.name}</SheetTitle>
                <SheetDescription className="sr-only">
                  Parking status, restrictions, permit rules, and directions for {lot.name}.
                </SheetDescription>
              </div>
              <button
                type="button"
                onClick={() => onToggleFavorite(lot.id)}
                className="p-2 mr-8"
                aria-label={
                  isFavorite ? `Remove ${lot.name} from favorites` : `Add ${lot.name} to favorites`
                }
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/60'
                  }`}
                />
              </button>
            </div>
          </SheetHeader>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto bg-card px-6 py-5 space-y-6"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Current Status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border ${availability.badgeClass}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: availability.color }}
                  />
                  <div>
                    <div className="font-semibold">{availability.label}</div>
                    <div className="text-sm opacity-75">
                      {availability.status === 'unknown'
                        ? 'Availability is not reported'
                        : hasAvailabilityPattern
                          ? 'Typical time-of-day estimate'
                          : 'See current restrictions below'}
                    </div>
                    {lot.total_spaces > 0 && (
                      <div className="text-sm opacity-75">~{lot.total_spaces} total spaces</div>
                    )}
                  </div>
                </div>
                <Car className="w-8 h-8 opacity-50" />
              </div>
            </motion.div>

            {/* Event Restrictions */}
            {eventMode && (lot.event_restricted || lot.closed) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-300 mt-0.5" />
                  <div>
                    <div className="font-semibold text-purple-900 dark:text-purple-300">
                      {lot.closed ? 'Closed for Event' : 'Event Mode Active'}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      {lot.event_notes ||
                        (lot.closed
                          ? 'This lot is closed while the current event restrictions are active.'
                          : 'Special restrictions may apply during events.')}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {(lot.address || lot.location_notes || parkingCategories.includes('street')) && (
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Location
                </h3>
                {lot.address && <p className="text-sm text-foreground">{lot.address}</p>}
                {lot.location_notes && (
                  <p className="mt-1 text-sm text-muted-foreground">{lot.location_notes}</p>
                )}
                {parkingCategories.includes('street') && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    This entry covers designated curbside parking bays. Follow posted signs for the
                    exact spaces.
                  </p>
                )}
              </div>
            )}

            {/* Typical Availability */}
            {hasAvailabilityPattern && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Typical availability
                </h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  This pattern is guidance, not a live count of open spaces.
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {getHourlyForecast().map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex-shrink-0 w-14 py-3 rounded-xl text-center ${
                        item.isCurrent ? 'bg-gray-900 text-white' : 'bg-muted'
                      }`}
                    >
                      <div className="text-xs font-medium mb-2">
                        {item.isCurrent ? 'Now' : item.hour}
                      </div>
                      <div
                        className="mx-auto h-3 w-3 rounded-full"
                        style={{ backgroundColor: getAvailabilityMeta(item.status).color }}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Permits Required */}
            {(lot.required_permits?.length > 0 || lot.permit_notes) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  Required Permits
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(lot.required_permits || []).map((permit) => (
                    <Badge
                      key={permit}
                      className="bg-gray-900 text-white hover:bg-gray-800 px-3 py-1.5"
                    >
                      {permit}
                    </Badge>
                  ))}
                </div>
                {lot.permit_notes && (
                  <p className="mt-3 text-sm text-muted-foreground">{lot.permit_notes}</p>
                )}
              </motion.div>
            )}

            {/* Time-Based Rules */}
            {lot.time_rules?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Time Rules
                </h3>
                <div className="space-y-2">
                  {lot.time_rules.map((rule, idx) => (
                    <div key={idx} className="p-3 bg-background rounded-xl border border-border">
                      <div className="text-sm font-medium text-foreground">{rule.days}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {rule.hours} — {rule.rule}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {(lot.source_url || lot.verified_on) && (
              <div className="border-t border-border pt-4 text-xs text-muted-foreground">
                {lot.source_url && (
                  <a
                    href={lot.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => {
                      if (isNativeApp()) {
                        event.preventDefault();
                        void openExternalUrl(lot.source_url);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 font-medium text-foreground underline underline-offset-2"
                  >
                    {lot.source_label || 'Official parking information'}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
                {lot.policy_urls?.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block text-sm font-medium text-blue-700 dark:text-blue-300 underline underline-offset-2"
                    onClick={(event) => {
                      if (isNativeApp()) {
                        event.preventDefault();
                        void openExternalUrl(url);
                      }
                    }}
                  >
                    {url.includes('students')
                      ? 'Student permit rules'
                      : 'Faculty and staff permit rules'}
                  </a>
                ))}
                {lot.verified_on && (
                  <p className="mt-1">
                    Checked <time dateTime={lot.verified_on}>{lot.verified_on}</time>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-border bg-card">
            <Button
              className="w-full h-14 bg-[#CEB888] hover:bg-[#B8A06E] text-neutral-900 font-semibold rounded-xl text-base"
              onClick={() => void openDirections(lot.latitude, lot.longitude, lot.name)}
              disabled={
                !Number.isFinite(Number(lot.latitude)) || !Number.isFinite(Number(lot.longitude))
              }
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
