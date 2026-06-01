import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MapPin, List, Star, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ParkingMap from '../parking/ParkingMap';
import LotDetailSheet from '../parking/LotDetailSheet';
import SearchBar from '../common/SearchBar';
import PullToRefresh from '../common/PullToRefresh';
import { tabScrollRefs } from '../common/BottomNav';
import { demoParkingLots } from '@/data/demoTransportData';

export default function ParkingTab({ eventMode, activeEvent, userPrefs }) {
  const [viewMode, setViewMode] = useState('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [permitFilter, setPermitFilter] = useState('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);

  // Register scroll ref for BottomNav same-tab scroll-to-top
  useEffect(() => { tabScrollRefs['parking'] = scrollRef; }, []);

  // Selected lot via URL search param ?lot=<id>
  const params = new URLSearchParams(location.search);
  const selectedLotId = params.get('lot');

  // Fetch parking lots
  const { data: lots = demoParkingLots, isLoading, refetch } = useQuery({
    queryKey: ['parkingLots'],
    queryFn: async () => {
      try {
        const remoteLots = await base44.entities.ParkingLot.list();
        return remoteLots?.length ? remoteLots : demoParkingLots;
      } catch {
        return demoParkingLots;
      }
    },
    refetchInterval: 30000,
    retry: false,
  });

  const selectedLot = lots.find(l => l.id === selectedLotId) || null;
  const setSelectedLot = (lot) => {
    if (lot) {
      navigate(`/parking?lot=${lot.id}`, { replace: false });
    } else {
      navigate('/parking', { replace: false });
    }
  };

  // Update lot with event restrictions
  const lotsWithEventStatus = lots.map(lot => ({
    ...lot,
    event_restricted: eventMode && activeEvent?.restricted_lots?.includes(lot.code),
    closed: eventMode && activeEvent?.closed_lots?.includes(lot.code),
  }));

  // Filter lots
  const filteredLots = lotsWithEventStatus.filter(lot => {
    const matchesSearch = lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lot.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPermit = permitFilter === 'all' || 
                         lot.required_permits?.includes(permitFilter);
    return matchesSearch && matchesPermit;
  });

  // Favorite lots
  const favoriteIds = userPrefs?.favorite_lots || [];

  const favoriteMutation = useMutation({
    mutationFn: async (lotId) => {
      const newFavorites = favoriteIds.includes(lotId)
        ? favoriteIds.filter(id => id !== lotId)
        : [...favoriteIds, lotId];
      if (userPrefs?.id) {
        return base44.entities.UserPreferences.update(userPrefs.id, { favorite_lots: newFavorites });
      } else {
        const user = await base44.auth.me();
        return base44.entities.UserPreferences.create({ user_email: user.email, favorite_lots: newFavorites });
      }
    },
    onMutate: async (lotId) => {
      await queryClient.cancelQueries({ queryKey: ['preferences'] });
      const prev = queryClient.getQueryData(['preferences', userPrefs?.user_email]);
      const newFavorites = favoriteIds.includes(lotId)
        ? favoriteIds.filter(id => id !== lotId)
        : [...favoriteIds, lotId];
      queryClient.setQueryData(['preferences', userPrefs?.user_email], (old) =>
        old ? [{ ...old[0], favorite_lots: newFavorites }] : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['preferences', userPrefs?.user_email], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  });

  const toggleFavorite = (lotId) => favoriteMutation.mutate(lotId);

  const currentHour = new Date().getHours();
  const getAvailability = (lot) => lot.availability_pattern?.[currentHour] || 'open';

  // Get unique permits
  const allPermits = [...new Set(lots.flatMap(lot => lot.required_permits || []))];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Search & Filters */}
      <div className="px-4 py-3 space-y-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search parking lots..."
        />
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Badge
            variant={permitFilter === 'all' ? 'default' : 'outline'}
            className={`cursor-pointer whitespace-nowrap ${
              permitFilter === 'all' ? 'bg-gray-900' : ''
            }`}
            onClick={() => setPermitFilter('all')}
          >
            All Permits
          </Badge>
          {allPermits.map(permit => (
            <Badge
              key={permit}
              variant={permitFilter === permit ? 'default' : 'outline'}
              className={`cursor-pointer whitespace-nowrap ${
                permitFilter === permit ? 'bg-gray-900' : ''
              }`}
              onClick={() => setPermitFilter(permit)}
            >
              {permit}
            </Badge>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="bg-gray-100">
              <TabsTrigger value="map" className="gap-1.5">
                <MapPin className="w-4 h-4" /> Map
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5">
                <List className="w-4 h-4" /> List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-gray-500"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading parking data...</p>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <ParkingMap
            lots={filteredLots}
            selectedLot={selectedLot}
            onSelectLot={setSelectedLot}
            eventMode={eventMode}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <PullToRefresh onRefresh={refetch}>
          <div ref={scrollRef} className="space-y-3 pt-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Favorites Section */}
            {favoriteIds.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  Favorites
                </h3>
                {filteredLots
                  .filter(lot => favoriteIds.includes(lot.id))
                  .map(lot => (
                    <LotListItem
                      key={lot.id}
                      lot={lot}
                      availability={getAvailability(lot)}
                      isFavorite={true}
                      onSelect={() => setSelectedLot(lot)}
                      onToggleFavorite={() => toggleFavorite(lot.id)}
                      eventMode={eventMode}
                    />
                  ))}
              </div>
            )}

            {/* All Lots */}
            <h3 className="text-sm font-semibold text-gray-500 mb-2">
              All Lots ({filteredLots.length})
            </h3>
            {filteredLots.map(lot => (
              <LotListItem
                key={lot.id}
                lot={lot}
                availability={getAvailability(lot)}
                isFavorite={favoriteIds.includes(lot.id)}
                onSelect={() => setSelectedLot(lot)}
                onToggleFavorite={() => toggleFavorite(lot.id)}
                eventMode={eventMode}
              />
            ))}
          </div>
          </PullToRefresh>
        )}
      </div>

      {/* Lot Detail Sheet */}
      <LotDetailSheet
        lot={selectedLot}
        isOpen={!!selectedLot}
        onClose={() => setSelectedLot(null)}
        isFavorite={favoriteIds.includes(selectedLot?.id)}
        onToggleFavorite={toggleFavorite}
        eventMode={eventMode}
      />
    </div>
  );
}

function LotListItem({ lot, availability, isFavorite, onSelect, onToggleFavorite, eventMode }) {
  const getAvailabilityColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'half': return 'bg-amber-500';
      case 'full': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const isRestricted = eventMode && (lot.event_restricted || lot.closed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className={`
        p-4 bg-white rounded-2xl border-2 cursor-pointer transition-all
        ${isRestricted ? 'border-purple-200 bg-purple-50' : 'border-gray-100 hover:border-gray-200'}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${
            isRestricted ? 'bg-purple-500' : getAvailabilityColor(availability)
          }`} />
          <div>
            <div className="font-semibold text-gray-900">{lot.name}</div>
            <div className="text-sm text-gray-500">
              Lot {lot.code}
              {lot.required_permits?.length > 0 && (
                <span> • {lot.required_permits.join(', ')}</span>
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
          className="p-2 relative z-10"
        >
          <Star
            className={`w-5 h-5 ${
              isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        </button>
      </div>
      {isRestricted && (
        <Badge className="mt-2 bg-purple-100 text-purple-700 border-0">
          Event Restricted
        </Badge>
      )}
    </motion.div>
  );
}
