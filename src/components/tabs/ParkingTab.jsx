import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  CarFront,
  CircleParking,
  House,
  List,
  LocateFixed,
  Map,
  RotateCcw,
  Route,
  Star,
  Ticket,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ParkingMap from '../parking/ParkingMap';
import ParkingListItem from '../parking/ParkingListItem';
import LotDetailSheet from '../parking/LotDetailSheet';
import SearchBar from '../common/SearchBar';
import { tabScrollRefs } from '../common/BottomNav';
import { ErrorState, LoadingState } from '../common/DataState';
import { useParkingLots } from '@/hooks/useTransportData';
import { decorateLotsForEvent, normalizeErrorMessage } from '@/lib/transport-utils';
import {
  PARKING_CATEGORY_OPTIONS,
  PARKING_SORT_OPTIONS,
  filterParkingLots,
  getParkingCategories,
  sortParkingLots,
} from '@/lib/parking-utils';
import { getCurrentCoordinates } from '@/lib/native-platform';

const CATEGORY_ICONS = Object.freeze({
  all: CarFront,
  garage: Building2,
  surface: CircleParking,
  street: Route,
  visitor: Ticket,
  residential: House,
  event: CalendarDays,
});

export default function ParkingTab({ eventMode, activeEvent, preferences, toggleFavorite }) {
  const [viewMode, setViewMode] = useState('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [permitFilter, setPermitFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);
  const appliedDefaultPermit = useRef(false);

  useEffect(() => {
    tabScrollRefs.parking = scrollRef;
    return () => {
      if (tabScrollRefs.parking === scrollRef) delete tabScrollRefs.parking;
    };
  }, []);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedLotId = params.get('lot');
  const { data: lots = [], isLoading, isError, error, refetch } = useParkingLots();

  const lotsWithEventStatus = useMemo(
    () => decorateLotsForEvent(lots, eventMode ? activeEvent : null),
    [activeEvent, eventMode, lots],
  );
  const selectedLot = lotsWithEventStatus.find((lot) => lot.id === selectedLotId) || null;
  const favoriteIds = useMemo(() => preferences?.favorite_lots || [], [preferences?.favorite_lots]);

  const allPermits = useMemo(
    () =>
      [...new Set(lots.flatMap((lot) => lot.required_permits || []))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [lots],
  );

  useEffect(() => {
    if (
      !appliedDefaultPermit.current &&
      preferences?.default_permit &&
      allPermits.includes(preferences.default_permit)
    ) {
      setPermitFilter(preferences.default_permit);
      appliedDefaultPermit.current = true;
    }
  }, [allPermits, preferences?.default_permit]);

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        PARKING_CATEGORY_OPTIONS.map(({ value }) => [
          value,
          value === 'all'
            ? lotsWithEventStatus.length
            : lotsWithEventStatus.filter((lot) => getParkingCategories(lot).includes(value)).length,
        ]),
      ),
    [lotsWithEventStatus],
  );

  const visibleLots = useMemo(() => {
    const matching = filterParkingLots(lotsWithEventStatus, {
      query: searchQuery,
      category: categoryFilter,
      permit: permitFilter,
      favoritesOnly,
      favoriteIds,
    });
    return sortParkingLots(matching, {
      sortBy,
      favoriteIds,
      userLocation,
    });
  }, [
    categoryFilter,
    favoriteIds,
    favoritesOnly,
    lotsWithEventStatus,
    permitFilter,
    searchQuery,
    sortBy,
    userLocation,
  ]);

  const setSelectedLot = useCallback(
    (lot, { replace = false } = {}) => {
      if (lot) navigate(`/parking?lot=${encodeURIComponent(lot.id)}`, { replace });
      else navigate('/parking', { replace });
    },
    [navigate],
  );

  useEffect(() => {
    if (!isLoading && selectedLotId && !visibleLots.some((lot) => lot.id === selectedLotId)) {
      setSelectedLot(null, { replace: true });
    }
  }, [isLoading, selectedLotId, setSelectedLot, visibleLots]);

  const toggleLotFavorite = (lotId) => toggleFavorite('favorite_lots', lotId);

  const findNearbyParking = async () => {
    setIsLocating(true);
    try {
      const coordinates = await getCurrentCoordinates();
      setUserLocation(coordinates);
      setSortBy('distance');
      toast.success('Showing the nearest parking first');
      return true;
    } catch (locationError) {
      toast.error(locationError?.message || 'Your location could not be determined');
      return false;
    } finally {
      setIsLocating(false);
    }
  };

  const handleSortChange = (value) => {
    if (value === 'distance' && !userLocation) {
      void findNearbyParking();
      return;
    }
    setSortBy(value);
  };

  const toggleNearby = () => {
    if (!userLocation) {
      void findNearbyParking();
      return;
    }
    setUserLocation(null);
    if (sortBy === 'distance') setSortBy('recommended');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setPermitFilter('all');
    setFavoritesOnly(false);
    setSortBy('recommended');
  };

  const activeFilterCount =
    Number(Boolean(searchQuery.trim())) +
    Number(categoryFilter !== 'all') +
    Number(permitFilter !== 'all') +
    Number(favoritesOnly);
  const sortLabel =
    PARKING_SORT_OPTIONS.find((option) => option.value === sortBy)?.label || 'Recommended';

  return (
    <div className="flex h-[calc(100dvh-180px)] min-h-[500px] flex-col">
      <section className="space-y-3 px-4 pb-3 pt-2" aria-label="Parking search and filters">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search lots, garages, streets, or permits"
        />

        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
          role="group"
          aria-label="Parking type"
        >
          {PARKING_CATEGORY_OPTIONS.map(({ value, label }) => {
            const Icon = CATEGORY_ICONS[value];
            const isActive = categoryFilter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setCategoryFilter(value)}
                className={`flex h-9 flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'border-gray-900 dark:border-[#CEB888] bg-gray-900 text-white'
                    : 'border-border bg-card text-muted-foreground hover:border-border'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
                <span className={isActive ? 'text-gray-300' : 'text-muted-foreground'}>
                  {categoryCounts[value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="h-9 bg-muted p-1">
              <TabsTrigger value="map" className="h-7 gap-1.5 px-3 text-xs">
                <Map className="h-3.5 w-3.5" aria-hidden="true" /> Map
              </TabsTrigger>
              <TabsTrigger value="list" className="h-7 gap-1.5 px-3 text-xs">
                <List className="h-3.5 w-3.5" aria-hidden="true" /> List
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant={favoritesOnly ? 'secondary' : 'outline'}
              size="sm"
              className="h-9 gap-1.5 px-2.5"
              onClick={() => setFavoritesOnly((value) => !value)}
              aria-pressed={favoritesOnly}
              aria-label="Show favorite parking only"
            >
              <Star className={`h-4 w-4 ${favoritesOnly ? 'fill-amber-400 text-amber-500' : ''}`} />
              <span className="hidden sm:inline">Favorites</span>
            </Button>
            <Button
              type="button"
              variant={userLocation ? 'secondary' : 'outline'}
              size="sm"
              className="h-9 gap-1.5 px-2.5"
              onClick={toggleNearby}
              disabled={isLocating}
              aria-pressed={Boolean(userLocation)}
            >
              <LocateFixed
                className={`h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`}
                aria-hidden="true"
              />
              <span>{userLocation ? 'Nearby on' : 'Near me'}</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={permitFilter} onValueChange={setPermitFilter}>
            <SelectTrigger
              className="h-9 rounded-xl border-border bg-card text-xs"
              aria-label="Filter by permit"
            >
              <SelectValue placeholder="Any permit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any permit</SelectItem>
              {allPermits.map((permit) => (
                <SelectItem key={permit} value={permit}>
                  {permit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger
              className="h-9 rounded-xl border-border bg-card text-xs"
              aria-label="Sort parking"
            >
              <SelectValue placeholder="Sort parking" />
            </SelectTrigger>
            <SelectContent>
              {PARKING_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-h-6 items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            <strong className="font-semibold text-foreground">{visibleLots.length}</strong> of{' '}
            {lotsWithEventStatus.length} places · {sortLabel}
          </span>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 font-semibold text-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Clear {activeFilterCount}
            </button>
          )}
        </div>
      </section>

      <div className="min-h-0 flex-1 px-4 pb-4">
        {isLoading ? (
          <LoadingState message="Loading parking data…" />
        ) : isError ? (
          <ErrorState
            message={normalizeErrorMessage(error, 'Unable to load parking data')}
            onRetry={refetch}
          />
        ) : visibleLots.length === 0 ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-8 text-center">
            <CircleParking className="mb-3 h-9 w-9 text-muted-foreground/60" aria-hidden="true" />
            <h2 className="font-semibold text-foreground">No parking matches those filters</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another parking type or clear your permit and search filters.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          </div>
        ) : viewMode === 'map' ? (
          <ParkingMap
            lots={visibleLots}
            selectedLot={selectedLot}
            onSelectLot={setSelectedLot}
            eventMode={eventMode}
            favoriteIds={favoriteIds}
            userLocation={userLocation}
          />
        ) : (
          <div
            ref={scrollRef}
            className="h-full space-y-2.5 overflow-y-auto pb-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {visibleLots.map((lot) => (
              <ParkingListItem
                key={lot.id}
                lot={lot}
                isFavorite={favoriteIds.includes(lot.id)}
                onSelect={() => setSelectedLot(lot)}
                onToggleFavorite={() => toggleLotFavorite(lot.id)}
                eventMode={eventMode}
              />
            ))}
          </div>
        )}
      </div>

      <LotDetailSheet
        lot={selectedLot}
        isOpen={Boolean(selectedLot)}
        onClose={() => setSelectedLot(null)}
        isFavorite={favoriteIds.includes(selectedLot?.id)}
        onToggleFavorite={toggleLotFavorite}
        eventMode={eventMode}
      />
    </div>
  );
}
