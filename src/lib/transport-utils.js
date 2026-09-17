export const decorateLotsForEvent = (lots, activeEvent) => {
  const restrictedLots = new Set(activeEvent?.restricted_lots || []);
  const closedLots = new Set(activeEvent?.closed_lots || []);

  return lots.map((lot) => ({
    ...lot,
    event_restricted: restrictedLots.has(lot.code),
    closed: closedLots.has(lot.code),
  }));
};

export const getAvailabilityStatus = (lot, hour = new Date().getHours()) => {
  if (lot?.closed) return 'closed';
  return lot?.availability_pattern?.[hour] ?? 'unknown';
};

export const buildArrivalsForRoute = (route, buses) => {
  if (!route) return [];

  return buses
    .filter((bus) => bus.route_id === route.id)
    .map((bus) => ({
      bus_id: bus.bus_id,
      stop_name: bus.next_stop,
      eta_minutes: bus.eta_minutes ?? null,
      is_delayed: bus.is_delayed,
      delay_minutes: bus.delay_minutes,
      capacity_status: bus.capacity_status,
    }))
    .sort(
      (a, b) =>
        (a.eta_minutes ?? Number.POSITIVE_INFINITY) - (b.eta_minutes ?? Number.POSITIVE_INFINITY),
    );
};

export const normalizeErrorMessage = (error, fallback = 'Unable to load data') => {
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }
  return fallback;
};

export const getDistanceInMiles = (from, to) => {
  const fromLat = Number(from?.latitude);
  const fromLng = Number(from?.longitude);
  const toLat = Number(to?.latitude);
  const toLng = Number(to?.longitude);
  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) return null;

  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const earthRadiusMiles = 3958.8;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
// @ts-check
