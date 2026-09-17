import { useQuery } from '@tanstack/react-query';
import { demoBuses, demoBusRoutes } from '@/data/demoBusData';
import { purdueParkingLots, parkingInventoryMetadata } from '@/data/purdueParkingData';
import { getCampusEvents, getGameDayEvents, eventsMetadata } from '@/data/purdueEventsData';
import { transportQueryOptions } from '@/lib/transport-query';

/**
 * @typedef {Record<string, any>} TransportEntity
 * @param {{
 *   key: string[],
 *   getData: () => TransportEntity[],
 *   staleTime?: number,
 *   refetchInterval?: number | false,
 * }} options
 */
const useTransportQuery = (options) => useQuery(transportQueryOptions(options));

export const useParkingLots = () =>
  useTransportQuery({
    key: [
      'parkingLots',
      parkingInventoryMetadata.source_updated,
      parkingInventoryMetadata.verified_on,
    ],
    getData: () => purdueParkingLots,
  });

export const useBusRoutes = () =>
  useTransportQuery({
    key: ['busRoutes'],
    getData: () => demoBusRoutes,
  });

export const useBuses = () =>
  useTransportQuery({
    key: ['buses'],
    getData: () => demoBuses,
  });

export const useCampusEvents = () =>
  useTransportQuery({
    key: ['events', eventsMetadata.verified_on],
    getData: getCampusEvents,
    staleTime: 60_000,
  });

export const useActiveCampusEvents = () =>
  useTransportQuery({
    key: ['events', 'game-day', eventsMetadata.verified_on],
    getData: () => getGameDayEvents(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
// @ts-check
