import { getAvailabilityStatus, getDistanceInMiles } from './transport-utils.js';

const RESIDENTIAL_PERMIT_PATTERN = /\b(residence|residential|hawkins|grad house|purdue village)\b/i;
const VISITOR_PERMIT_PATTERN = /(visitor|guest|paid)/i;
const EVENT_PERMIT_PATTERN = /event/i;

export const PARKING_CATEGORY_OPTIONS = Object.freeze([
  { value: 'all', label: 'All parking' },
  { value: 'garage', label: 'Garages' },
  { value: 'surface', label: 'Surface parking' },
  { value: 'street', label: 'Street parking' },
  { value: 'visitor', label: 'Visitor / paid' },
  { value: 'residential', label: 'Residential' },
  { value: 'event', label: 'Event parking' },
]);

export const PARKING_SORT_OPTIONS = Object.freeze([
  { value: 'recommended', label: 'Recommended' },
  { value: 'distance', label: 'Nearest' },
  { value: 'availability', label: 'Availability' },
  { value: 'name', label: 'Name A–Z' },
]);

export const AVAILABILITY_META = Object.freeze({
  open: {
    label: 'Available',
    shortLabel: 'Open',
    color: '#16a34a',
    badgeClass:
      'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  half: {
    label: 'Limited spots',
    shortLabel: 'Limited',
    color: '#d97706',
    badgeClass:
      'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  full: {
    label: 'Likely full',
    shortLabel: 'Full',
    color: '#dc2626',
    badgeClass:
      'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  },
  closed: {
    label: 'Closed',
    shortLabel: 'Closed',
    color: '#111827',
    badgeClass: 'bg-muted text-foreground border-border',
  },
  unknown: {
    label: 'Status unknown',
    shortLabel: 'Unknown',
    color: '#6b7280',
    badgeClass: 'bg-background text-muted-foreground border-border',
  },
});

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

export function getParkingCategories(lot) {
  const categories = new Set();
  const facilityType = normalizeText(lot?.facility_type);
  const permits = Array.isArray(lot?.required_permits) ? lot.required_permits : [];
  const accessTypes = Array.isArray(lot?.access_types) ? lot.access_types.map(normalizeText) : [];
  const permitText = permits.join(' ');

  if (facilityType === 'street') categories.add('street');
  else if (facilityType === 'garage' || lot?.is_garage === true) categories.add('garage');
  else categories.add('surface');

  if (
    accessTypes.some((type) => ['visitor', 'guest', 'paid'].includes(type)) ||
    VISITOR_PERMIT_PATTERN.test(permitText)
  ) {
    categories.add('visitor');
  }
  if (accessTypes.includes('residential') || RESIDENTIAL_PERMIT_PATTERN.test(permitText)) {
    categories.add('residential');
  }
  if (
    accessTypes.includes('event') ||
    EVENT_PERMIT_PATTERN.test(permitText) ||
    Boolean(lot?.event_notes)
  ) {
    categories.add('event');
  }

  return [...categories];
}

export const getParkingFacilityLabel = (lot) => {
  const categories = getParkingCategories(lot);
  if (categories.includes('street')) return 'Street parking';
  return categories.includes('garage') ? 'Garage' : 'Surface lot';
};

export const getAvailabilityMeta = (lotOrStatus, hour = new Date().getHours()) => {
  const status =
    typeof lotOrStatus === 'string' ? lotOrStatus : getAvailabilityStatus(lotOrStatus, hour);
  return { status, ...(AVAILABILITY_META[status] || AVAILABILITY_META.unknown) };
};

export function filterParkingLots(
  lots,
  {
    query = '',
    category = 'all',
    permit = 'all',
    favoritesOnly = false,
    favoriteIds = [],
    status = 'all',
    hour = new Date().getHours(),
  } = {},
) {
  const normalizedQuery = normalizeText(query);
  const favorites = new Set(favoriteIds);

  return lots.filter((lot) => {
    const categories = getParkingCategories(lot);
    const permits = Array.isArray(lot?.required_permits) ? lot.required_permits : [];
    const searchable = normalizeText(
      [
        lot?.name,
        lot?.code,
        lot?.address,
        lot?.location_notes,
        lot?.permit_notes,
        ...permits,
        ...categories,
        ...(Array.isArray(lot?.aliases) ? lot.aliases : []),
      ].join(' '),
    );

    return (
      (!normalizedQuery || searchable.includes(normalizedQuery)) &&
      (category === 'all' || categories.includes(category)) &&
      (permit === 'all' || permits.includes(permit)) &&
      (!favoritesOnly || favorites.has(lot.id)) &&
      (status === 'all' || getAvailabilityStatus(lot, hour) === status)
    );
  });
}

const availabilityRank = Object.freeze({ open: 0, half: 1, unknown: 2, full: 3, closed: 4 });

export function sortParkingLots(
  lots,
  {
    sortBy = 'recommended',
    favoriteIds = [],
    userLocation = null,
    hour = new Date().getHours(),
  } = {},
) {
  const favorites = new Set(favoriteIds);
  const decorated = lots.map((lot) => ({
    ...lot,
    distanceMiles: userLocation ? getDistanceInMiles(userLocation, lot) : lot.distanceMiles,
  }));
  const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''));
  const byAvailability = (a, b) =>
    (availabilityRank[getAvailabilityStatus(a, hour)] ?? availabilityRank.unknown) -
    (availabilityRank[getAvailabilityStatus(b, hour)] ?? availabilityRank.unknown);
  const byDistance = (a, b) =>
    (Number.isFinite(a.distanceMiles) ? a.distanceMiles : Number.POSITIVE_INFINITY) -
    (Number.isFinite(b.distanceMiles) ? b.distanceMiles : Number.POSITIVE_INFINITY);

  return decorated.sort((a, b) => {
    if (sortBy === 'distance') return byDistance(a, b) || byAvailability(a, b) || byName(a, b);
    if (sortBy === 'availability') return byAvailability(a, b) || byDistance(a, b) || byName(a, b);
    if (sortBy === 'name') return byName(a, b);

    const favoriteDifference = Number(favorites.has(b.id)) - Number(favorites.has(a.id));
    return favoriteDifference || byAvailability(a, b) || byDistance(a, b) || byName(a, b);
  });
}

export const formatParkingDistance = (distanceMiles) => {
  if (!Number.isFinite(distanceMiles)) return '';
  if (distanceMiles < 0.1) return `${Math.max(1, Math.round(distanceMiles * 5280))} ft`;
  return `${distanceMiles.toFixed(1)} mi`;
};

export const hasParkingCoordinates = (lot) =>
  Number.isFinite(Number(lot?.latitude)) && Number.isFinite(Number(lot?.longitude));

export function parkingLotsToGeoJSON(
  lots,
  { favoriteIds = [], selectedLotId = null, eventMode = false, hour = new Date().getHours() } = {},
) {
  const favorites = new Set(favoriteIds);

  return {
    type: 'FeatureCollection',
    features: lots.filter(hasParkingCoordinates).map((lot) => {
      const availability = getAvailabilityMeta(lot, hour);
      const restricted = eventMode && Boolean(lot.event_restricted || lot.closed);
      return {
        type: 'Feature',
        id: lot.id,
        geometry: {
          type: 'Point',
          coordinates: [Number(lot.longitude), Number(lot.latitude)],
        },
        properties: {
          id: lot.id,
          name: lot.name || 'Parking',
          code: lot.code || '',
          status: availability.status,
          color: restricted ? '#7e22ce' : availability.color,
          selected: lot.id === selectedLotId,
          favorite: favorites.has(lot.id),
          restricted,
          facility: getParkingFacilityLabel(lot),
        },
      };
    }),
  };
}
