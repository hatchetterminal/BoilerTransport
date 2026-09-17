import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, List, RefreshCw, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

import BusMap from '../bus/BusMap';
import RouteCard from '../bus/RouteCard';
import ArrivalCountdown from '../bus/ArrivalCountdown';
import SearchBar from '../common/SearchBar';
import PullToRefresh from '../common/PullToRefresh';
import { tabScrollRefs } from '../common/BottomNav';
import { useBuses, useBusRoutes } from '@/hooks/useTransportData';
import { buildArrivalsForRoute, normalizeErrorMessage } from '@/lib/transport-utils';
import { ErrorState, LoadingState } from '../common/DataState';

export default function BusTab({ preferences, toggleFavorite }) {
  const [viewMode, setViewMode] = useState('routes');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);

  // Register scroll ref for BottomNav same-tab scroll-to-top
  useEffect(() => {
    tabScrollRefs.bus = scrollRef;
    return () => {
      if (tabScrollRefs.bus === scrollRef) delete tabScrollRefs.bus;
    };
  }, []);

  // Selected route via URL search param ?route=<id>
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedRouteId = params.get('route');

  const {
    data: routes = [],
    isLoading: routesLoading,
    isError: routesError,
    error: routesErrorValue,
    refetch: refetchRoutes,
  } = useBusRoutes();
  const {
    data: buses = [],
    isLoading: busesLoading,
    isError: busesError,
    error: busesErrorValue,
    refetch: refetchBuses,
  } = useBuses();

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || null;
  const setSelectedRoute = (route) => {
    if (route) {
      navigate(`/bus?route=${encodeURIComponent(route.id)}`, { replace: false });
    } else {
      navigate('/bus', { replace: false });
    }
  };

  // Filter routes
  const favoriteIds = preferences?.favorite_routes || [];
  const filteredRoutes = routes.filter((route) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesSearch =
      String(route.name || '')
        .toLowerCase()
        .includes(normalizedQuery) ||
      String(route.short_name || '')
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesFavorite = !showFavoritesOnly || favoriteIds.includes(route.id);
    return matchesSearch && matchesFavorite;
  });

  const toggleRouteFavorite = (routeId) => toggleFavorite('favorite_routes', routeId);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Search & Filters */}
      <div className="px-4 py-3 space-y-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search bus routes..."
        />

        <div className="flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="bg-muted">
              <TabsTrigger value="routes" className="gap-1.5">
                <List className="w-4 h-4" /> Routes
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-1.5">
                <MapPin className="w-4 h-4" /> Map
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Star
                className={`w-4 h-4 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
              />
              <Switch
                checked={showFavoritesOnly}
                onCheckedChange={setShowFavoritesOnly}
                aria-label="Show favorite routes only"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                refetchRoutes();
                refetchBuses();
              }}
              className="text-muted-foreground"
              aria-label="Refresh bus data"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        {routesLoading || busesLoading ? (
          <LoadingState message="Loading bus data…" />
        ) : routesError || busesError ? (
          <ErrorState
            message={normalizeErrorMessage(
              routesErrorValue || busesErrorValue,
              'Unable to load bus data',
            )}
            onRetry={() => {
              void refetchRoutes();
              void refetchBuses();
            }}
          />
        ) : viewMode === 'map' ? (
          <BusMap routes={routes} buses={buses} selectedRoute={selectedRoute} />
        ) : (
          <PullToRefresh
            onRefresh={async () => {
              await refetchRoutes();
              await refetchBuses();
            }}
          >
            <div
              ref={scrollRef}
              className="space-y-4 pt-2"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Selected Route Detail */}
              <AnimatePresence mode="wait">
                {selectedRoute && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-card rounded-2xl border-2 border-border p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white"
                          style={{ backgroundColor: selectedRoute.color }}
                        >
                          {selectedRoute.short_name}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{selectedRoute.name}</h3>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Every {selectedRoute.frequency_minutes || '?'} min
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedRoute(null)}>
                        Close
                      </Button>
                    </div>

                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      Upcoming Arrivals
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </h4>
                    <ArrivalCountdown
                      arrivals={buildArrivalsForRoute(selectedRoute, buses)}
                      routeColor={selectedRoute.color}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Routes List */}
              <div className="space-y-3">
                {favoriteIds.length > 0 && !showFavoritesOnly && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      Favorite Routes
                    </h3>
                    {filteredRoutes
                      .filter((route) => favoriteIds.includes(route.id))
                      .map((route) => (
                        <RouteCard
                          key={route.id}
                          route={route}
                          buses={buses}
                          isSelected={selectedRoute?.id === route.id}
                          onSelect={setSelectedRoute}
                          isFavorite={true}
                          onToggleFavorite={() => toggleRouteFavorite(route.id)}
                        />
                      ))}
                  </div>
                )}

                <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                  {showFavoritesOnly ? 'Favorite Routes' : 'All Routes'} ({filteredRoutes.length})
                </h3>
                {filteredRoutes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    buses={buses}
                    isSelected={selectedRoute?.id === route.id}
                    onSelect={setSelectedRoute}
                    isFavorite={favoriteIds.includes(route.id)}
                    onToggleFavorite={() => toggleRouteFavorite(route.id)}
                  />
                ))}

                {filteredRoutes.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No routes found</p>
                  </div>
                )}
              </div>
            </div>
          </PullToRefresh>
        )}
      </div>
    </div>
  );
}
