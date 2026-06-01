import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, List, RefreshCw, Star, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

import BusMap from '../bus/BusMap';
import RouteCard from '../bus/RouteCard';
import ArrivalCountdown from '../bus/ArrivalCountdown';
import SearchBar from '../common/SearchBar';
import PullToRefresh from '../common/PullToRefresh';
import { tabScrollRefs } from '../common/BottomNav';
import { demoBuses, demoBusRoutes } from '@/data/demoTransportData';

export default function BusTab({ eventMode, activeEvent, userPrefs }) {
  const [viewMode, setViewMode] = useState('routes');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);

  // Register scroll ref for BottomNav same-tab scroll-to-top
  useEffect(() => { tabScrollRefs['bus'] = scrollRef; }, []);

  // Selected route via URL search param ?route=<id>
  const params = new URLSearchParams(location.search);
  const selectedRouteId = params.get('route');

  // Fetch bus routes
  const { data: routes = demoBusRoutes, isLoading: routesLoading, refetch: refetchRoutes } = useQuery({
    queryKey: ['busRoutes'],
    queryFn: async () => {
      try {
        const remoteRoutes = await base44.entities.BusRoute.list();
        return remoteRoutes?.length ? remoteRoutes : demoBusRoutes;
      } catch {
        return demoBusRoutes;
      }
    },
    retry: false,
  });

  // Fetch active buses
  const { data: buses = demoBuses, refetch: refetchBuses } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      try {
        const remoteBuses = await base44.entities.Bus.list();
        return remoteBuses?.length ? remoteBuses : demoBuses;
      } catch {
        return demoBuses;
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time feel
    retry: false,
  });

  // Auto-refresh buses
  useEffect(() => {
    const interval = setInterval(() => {
      refetchBuses();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetchBuses]);

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || null;
  const setSelectedRoute = (route) => {
    if (route) {
      navigate(`/bus?route=${route.id}`, { replace: false });
    } else {
      navigate('/bus', { replace: false });
    }
  };

  // Filter routes
  const favoriteIds = userPrefs?.favorite_routes || [];
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         route.short_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorite = !showFavoritesOnly || favoriteIds.includes(route.id);
    return matchesSearch && matchesFavorite;
  });

  const favoriteMutation = useMutation({
    mutationFn: async (routeId) => {
      const newFavorites = favoriteIds.includes(routeId)
        ? favoriteIds.filter(id => id !== routeId)
        : [...favoriteIds, routeId];
      if (userPrefs?.id) {
        return base44.entities.UserPreferences.update(userPrefs.id, { favorite_routes: newFavorites });
      } else {
        const user = await base44.auth.me();
        return base44.entities.UserPreferences.create({ user_email: user.email, favorite_routes: newFavorites });
      }
    },
    onMutate: async (routeId) => {
      await queryClient.cancelQueries({ queryKey: ['preferences'] });
      const prev = queryClient.getQueryData(['preferences', userPrefs?.user_email]);
      const newFavorites = favoriteIds.includes(routeId)
        ? favoriteIds.filter(id => id !== routeId)
        : [...favoriteIds, routeId];
      queryClient.setQueryData(['preferences', userPrefs?.user_email], (old) =>
        old ? [{ ...old[0], favorite_routes: newFavorites }] : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['preferences', userPrefs?.user_email], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  });

  const toggleFavorite = (routeId) => favoriteMutation.mutate(routeId);

  // Generate mock arrivals for selected route
  const getArrivalsForRoute = (route) => {
    if (!route) return [];
    const routeBuses = buses.filter(b => b.route_id === route.id);
    return routeBuses.map(bus => ({
      bus_id: bus.bus_id,
      stop_name: bus.next_stop,
      eta_minutes: bus.eta_minutes || Math.floor(Math.random() * 15) + 1,
      is_delayed: bus.is_delayed,
      delay_minutes: bus.delay_minutes,
      capacity_status: bus.capacity_status,
    })).sort((a, b) => a.eta_minutes - b.eta_minutes);
  };

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
            <TabsList className="bg-gray-100">
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
              <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
              <Switch
                checked={showFavoritesOnly}
                onCheckedChange={setShowFavoritesOnly}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                refetchRoutes();
                refetchBuses();
              }}
              className="text-gray-500"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        {routesLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading bus data...</p>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <BusMap
            routes={routes}
            buses={buses}
            selectedRoute={selectedRoute}
            stops={selectedRoute?.stops || []}
            nearbyStops={[]}
          />
        ) : (
          <PullToRefresh onRefresh={async () => { await refetchRoutes(); await refetchBuses(); }}>
          <div ref={scrollRef} className="space-y-4 pt-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Selected Route Detail */}
            <AnimatePresence mode="wait">
              {selectedRoute && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl border-2 border-gray-100 p-4"
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
                        <h3 className="font-bold text-gray-900">{selectedRoute.name}</h3>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Every {selectedRoute.frequency_minutes || '?'} min
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRoute(null)}
                    >
                      Close
                    </Button>
                  </div>
                  
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    Upcoming Arrivals
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </h4>
                  <ArrivalCountdown 
                    arrivals={getArrivalsForRoute(selectedRoute)}
                    routeColor={selectedRoute.color}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Routes List */}
            <div className="space-y-3">
              {favoriteIds.length > 0 && !showFavoritesOnly && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    Favorite Routes
                  </h3>
                  {filteredRoutes
                    .filter(route => favoriteIds.includes(route.id))
                    .map(route => (
                      <RouteCard
                        key={route.id}
                        route={route}
                        buses={buses}
                        isSelected={selectedRoute?.id === route.id}
                        onSelect={setSelectedRoute}
                        isFavorite={true}
                        onToggleFavorite={() => toggleFavorite(route.id)}
                      />
                    ))}
                </div>
              )}

              <h3 className="text-sm font-semibold text-gray-500 mb-2">
                {showFavoritesOnly ? 'Favorite Routes' : 'All Routes'} ({filteredRoutes.length})
              </h3>
              {filteredRoutes.map(route => (
                <RouteCard
                  key={route.id}
                  route={route}
                  buses={buses}
                  isSelected={selectedRoute?.id === route.id}
                  onSelect={setSelectedRoute}
                  isFavorite={favoriteIds.includes(route.id)}
                  onToggleFavorite={() => toggleFavorite(route.id)}
                />
              ))}

              {filteredRoutes.length === 0 && (
                <div className="text-center py-12 text-gray-400">
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
