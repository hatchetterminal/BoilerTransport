import { Building2, ChevronRight, CircleParking, Route, Star, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  formatParkingDistance,
  getAvailabilityMeta,
  getParkingCategories,
  getParkingFacilityLabel,
} from '@/lib/parking-utils';

export default function ParkingListItem({
  lot,
  isFavorite,
  onSelect,
  onToggleFavorite,
  eventMode,
}) {
  const availability = getAvailabilityMeta(lot);
  const categories = getParkingCategories(lot);
  const permits = lot.required_permits || [];
  const isRestricted = eventMode && (lot.event_restricted || lot.closed);
  const FacilityIcon = categories.includes('street')
    ? Route
    : categories.includes('garage')
      ? Building2
      : CircleParking;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-card transition-colors ${
        isRestricted
          ? 'border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/50'
          : 'border-border hover:border-border'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 py-3.5 pl-3.5 pr-14 text-left"
        aria-label={`View ${lot.name}, ${availability.label}`}
      >
        <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          <FacilityIcon className="h-5 w-5" aria-hidden="true" />
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
            style={{ backgroundColor: isRestricted ? '#7e22ce' : availability.color }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{lot.name}</h3>
            {Number.isFinite(lot.distanceMiles) && (
              <span className="ml-auto flex-shrink-0 text-xs font-medium text-muted-foreground">
                {formatParkingDistance(lot.distanceMiles)}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{lot.code || 'Parking'}</span>
            <span aria-hidden="true">·</span>
            <span>{getParkingFacilityLabel(lot)}</span>
            {categories.includes('visitor') && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300">
                  <Ticket className="h-3 w-3" aria-hidden="true" /> Visitor
                </span>
              </>
            )}
          </div>

          <div className="mt-2 flex min-w-0 items-center gap-1.5 overflow-hidden">
            <Badge
              variant="outline"
              className={`h-5 flex-shrink-0 px-2 text-[10px] ${availability.badgeClass}`}
            >
              {isRestricted
                ? lot.closed
                  ? 'Event closed'
                  : 'Event restricted'
                : availability.shortLabel}
            </Badge>
            {permits.slice(0, 2).map((permit) => (
              <Badge
                key={permit}
                variant="outline"
                className="h-5 max-w-[104px] truncate px-2 text-[10px] text-muted-foreground"
              >
                {permit}
              </Badge>
            ))}
            {permits.length > 2 && (
              <span className="flex-shrink-0 text-[10px] font-medium text-muted-foreground">
                +{permits.length - 2}
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          className="h-4 w-4 flex-shrink-0 text-muted-foreground/60"
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        onClick={onToggleFavorite}
        className="absolute right-2.5 top-2.5 z-10 rounded-xl p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={
          isFavorite ? `Remove ${lot.name} from favorites` : `Add ${lot.name} to favorites`
        }
      >
        <Star
          className={`h-5 w-5 ${
            isFavorite ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/60'
          }`}
        />
      </button>
    </article>
  );
}
