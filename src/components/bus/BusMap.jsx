import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { CAMPUS_MAP_CENTER, MAP_STYLE_URL } from '@/lib/map-config';

const EMPTY_LIST = [];

const toCoordinate = (value) => Number.parseFloat(value);
const hasCoordinates = (item) => {
  const latitude = toCoordinate(item?.latitude);
  const longitude = toCoordinate(item?.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};
const getLngLat = (item) => [toCoordinate(item.longitude), toCoordinate(item.latitude)];
const getSafeColor = (color) =>
  /^(?:#[0-9a-f]{3}|#[0-9a-f]{4}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i.test(color || '')
    ? color
    : '#6b7280';
const getRouteLabel = (route) =>
  [route?.short_name, route?.name].filter(Boolean).join(' – ') || 'Unknown route';

const appendTextElement = (parent, tagName, text, className) => {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = String(text ?? '');
  parent.appendChild(element);
  return element;
};

const createColorSwatch = (color, className) => {
  const swatch = document.createElement('span');
  swatch.className = className;
  swatch.style.backgroundColor = getSafeColor(color);
  swatch.setAttribute('aria-hidden', 'true');
  return swatch;
};

const createStopMarkerElement = (stop, route) => {
  const stopName = stop.name || 'Bus stop';
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.className = 'grid h-8 w-8 cursor-pointer place-items-center border-0 bg-transparent p-0';
  marker.setAttribute('aria-label', `${stopName}, ${getRouteLabel(route)}`);
  marker.title = `${stopName} • ${getRouteLabel(route)}`;

  const dot = document.createElement('span');
  dot.className = 'block h-5 w-5 rounded-full border-[3px] border-white shadow-md';
  dot.style.backgroundColor = getSafeColor(route.color);
  dot.setAttribute('aria-hidden', 'true');
  marker.appendChild(dot);

  return marker;
};

const createStopPopupContent = (stop, route) => {
  const stopName = stop.name || 'Bus stop';
  const content = document.createElement('section');
  content.className = 'min-w-[180px] p-1 text-foreground';
  content.setAttribute('aria-label', `${stopName} details`);

  const heading = document.createElement('div');
  heading.className = 'mb-1 flex items-center gap-2';
  heading.appendChild(createColorSwatch(route.color, 'h-3 w-3 shrink-0 rounded-full'));
  appendTextElement(heading, 'h3', stopName, 'font-semibold text-foreground');
  content.appendChild(heading);
  appendTextElement(content, 'p', getRouteLabel(route), 'text-xs text-muted-foreground');

  return content;
};

const createBusMarkerElement = (bus, route) => {
  const busLabel = bus.bus_id || bus.id || 'Unknown';
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.className = 'grid h-11 w-11 cursor-pointer place-items-center border-0 bg-transparent p-0';

  const details = [`Bus ${busLabel}`, getRouteLabel(route)];
  if (bus.next_stop) details.push(`next stop ${bus.next_stop}`);
  if (bus.eta_minutes !== undefined && bus.eta_minutes !== null) {
    details.push(`${bus.eta_minutes} minutes away`);
  }
  if (bus.is_delayed) details.push('delayed');
  marker.setAttribute('aria-label', details.join(', '));
  marker.title = details.join(' • ');

  const icon = document.createElement('span');
  icon.className =
    'flex h-9 w-9 items-center justify-center rounded-xl border-[3px] border-white text-xl leading-none shadow-lg';
  icon.style.backgroundColor = getSafeColor(route?.color);
  icon.textContent = '🚌';
  icon.setAttribute('aria-hidden', 'true');
  marker.appendChild(icon);

  return marker;
};

const createBusPopupContent = (bus, route) => {
  const busLabel = bus.bus_id || bus.id || 'Unknown';
  const content = document.createElement('section');
  content.className = 'min-w-[190px] p-1 text-foreground';
  content.setAttribute('aria-label', `Bus ${busLabel} details`);

  const heading = document.createElement('div');
  heading.className = 'mb-1 flex items-center gap-2';
  heading.appendChild(createColorSwatch(route?.color, 'h-3 w-3 shrink-0 rounded'));
  appendTextElement(heading, 'h3', `Bus #${busLabel}`, 'font-semibold');
  content.appendChild(heading);
  appendTextElement(content, 'p', getRouteLabel(route), 'mb-2 text-xs text-muted-foreground');

  if (bus.next_stop) {
    appendTextElement(content, 'p', `Next: ${bus.next_stop}`, 'mb-1 text-sm text-muted-foreground');
  }

  if (bus.eta_minutes !== undefined && bus.eta_minutes !== null) {
    const eta = document.createElement('p');
    eta.className = 'text-sm';
    appendTextElement(eta, 'strong', `${bus.eta_minutes} min`, 'font-medium');
    appendTextElement(eta, 'span', ' to next stop', 'text-muted-foreground');
    content.appendChild(eta);
  }

  if (bus.is_delayed) {
    const delayText =
      bus.delay_minutes !== undefined && bus.delay_minutes !== null
        ? `Delayed ${bus.delay_minutes}+ min`
        : 'Delayed';
    appendTextElement(
      content,
      'span',
      delayText,
      'mt-2 inline-flex rounded-md bg-red-600 px-2 py-0.5 text-xs font-medium text-white',
    );
  }

  if (bus.capacity_status) {
    appendTextElement(
      content,
      'p',
      `Capacity: ${bus.capacity_status}`,
      'mt-2 text-xs text-muted-foreground',
    );
  }

  return content;
};

const removeMarkers = (markers) => {
  markers.forEach((marker) => {
    marker.getPopup()?.remove();
    marker.remove();
  });
};

export default function BusMap({ routes, buses, selectedRoute }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const lastBoundsKeyRef = useRef('');

  const routeList = Array.isArray(routes) ? routes : EMPTY_LIST;
  const busList = Array.isArray(buses) ? buses : EMPTY_LIST;
  const routesToDisplay = useMemo(
    () => (selectedRoute ? [selectedRoute] : routeList),
    [routeList, selectedRoute],
  );
  const routesById = useMemo(
    () => new Map(routeList.map((route) => [route.id, route])),
    [routeList],
  );
  const fitCoordinates = useMemo(() => {
    const fitRoutes = selectedRoute ? [selectedRoute] : routeList;
    return fitRoutes
      .flatMap((route) => route.stops || [])
      .filter(hasCoordinates)
      .map(getLngLat);
  }, [routeList, selectedRoute]);
  const boundsKey = useMemo(
    () =>
      `${selectedRoute ? `route:${selectedRoute.id}` : 'all'}|${fitCoordinates
        .map(([longitude, latitude]) => `${longitude},${latitude}`)
        .sort()
        .join('|')}`,
    [fitCoordinates, selectedRoute],
  );

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return undefined;

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE_URL,
      center: CAMPUS_MAP_CENTER,
      zoom: 14,
      attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;
    lastBoundsKeyRef.current = '';

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      removeMarkers(markersRef.current);
      markersRef.current = [];
      mapRef.current = null;
      lastBoundsKeyRef.current = '';
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    removeMarkers(markersRef.current);
    const nextMarkers = [];

    routesToDisplay.forEach((route) => {
      (route.stops || []).filter(hasCoordinates).forEach((stop) => {
        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '280px',
          offset: 14,
        }).setDOMContent(createStopPopupContent(stop, route));

        const marker = new maplibregl.Marker({
          element: createStopMarkerElement(stop, route),
          anchor: 'center',
        })
          .setLngLat(getLngLat(stop))
          .setPopup(popup)
          .addTo(map);
        nextMarkers.push(marker);
      });
    });

    busList.filter(hasCoordinates).forEach((bus) => {
      const route = routesById.get(bus.route_id);
      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '300px',
        offset: 22,
      }).setDOMContent(createBusPopupContent(bus, route));

      const marker = new maplibregl.Marker({
        element: createBusMarkerElement(bus, route),
        anchor: 'center',
      })
        .setLngLat(getLngLat(bus))
        .setPopup(popup)
        .addTo(map);
      nextMarkers.push(marker);
    });

    markersRef.current = nextMarkers;

    return () => {
      if (markersRef.current === nextMarkers) {
        removeMarkers(nextMarkers);
        markersRef.current = [];
      }
    };
  }, [busList, routesById, routesToDisplay]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || fitCoordinates.length === 0 || boundsKey === lastBoundsKeyRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (fitCoordinates.length === 1) {
      map.easeTo({
        center: fitCoordinates[0],
        zoom: 16,
        duration: prefersReducedMotion ? 0 : 500,
      });
    } else {
      const bounds = fitCoordinates
        .slice(1)
        .reduce(
          (nextBounds, coordinate) => nextBounds.extend(coordinate),
          new maplibregl.LngLatBounds(fitCoordinates[0], fitCoordinates[0]),
        );
      map.fitBounds(bounds, {
        padding: selectedRoute ? 50 : 36,
        maxZoom: 16,
        duration: prefersReducedMotion ? 0 : 500,
      });
    }
    lastBoundsKeyRef.current = boundsKey;
  }, [boundsKey, fitCoordinates, selectedRoute]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div
        ref={mapContainerRef}
        className="h-full w-full"
        role="region"
        aria-label="Interactive bus routes map"
      />

      {!selectedRoute && routeList.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-card/95 p-3 shadow-lg backdrop-blur-sm">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Routes</div>
          <div className="space-y-1.5">
            {routeList.map((route) => (
              <div key={route.id} className="flex items-center gap-2">
                <div
                  className="h-1 w-4 rounded-full"
                  style={{ backgroundColor: getSafeColor(route.color) }}
                  aria-hidden="true"
                />
                <span className="text-xs text-foreground">{getRouteLabel(route)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
