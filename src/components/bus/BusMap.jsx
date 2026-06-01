import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Badge } from "@/components/ui/badge";
import L from 'leaflet';

const toCoordinate = (value) => Number.parseFloat(value);
const hasCoordinates = (item) =>
  Number.isFinite(toCoordinate(item?.latitude)) && Number.isFinite(toCoordinate(item?.longitude));
const getLatLng = (item) => [toCoordinate(item.latitude), toCoordinate(item.longitude)];
const getSafeColor = (color) => /^#[0-9a-f]{3,8}$/i.test(color || '') ? color : '#6b7280';

const createBusIcon = (color) => {
  const safeColor = getSafeColor(color);
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${safeColor};
        border: 3px solid white;
        border-radius: 12px;
        box-shadow: 0 3px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        line-height: 1;
      ">🚌</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const createStopIcon = (color) => {
  const safeColor = getSafeColor(color);
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: ${safeColor};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "/>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

function MapController({ routes, selectedRoute }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedRoute?.stops?.length > 0) {
      const selectedStops = selectedRoute.stops.filter(hasCoordinates);
      if (selectedStops.length > 0) {
        const bounds = L.latLngBounds(selectedStops.map(getLatLng));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (routes?.length > 0) {
      // Fit all routes
      const allStops = routes.flatMap(r => r.stops || []).filter(hasCoordinates);
      if (allStops.length > 0) {
        const bounds = L.latLngBounds(allStops.map(getLatLng));
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }
  }, [selectedRoute, routes, map]);
  
  return null;
}

export default function BusMap({ routes, buses, selectedRoute }) {
  const purdueCenter = [40.4237, -86.9212];

  const getRouteColor = (routeId) => {
    const route = routes.find(r => r.id === routeId);
    return route?.color || '#6b7280';
  };

  // Determine which routes to show
  const routesToDisplay = selectedRoute ? [selectedRoute] : routes;

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden">
      <MapContainer
        center={purdueCenter}
        zoom={14}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController routes={routes} selectedRoute={selectedRoute} />

        {/* Route lines removed - would need routing API for road-following paths */}

        {/* Bus Stops for all displayed routes */}
        {routesToDisplay.map((route) => 
          route.stops?.filter(hasCoordinates).map((stop, idx) => (
            <Marker
              key={`stop-${route.id}-${idx}`}
              position={getLatLng(stop)}
              icon={createStopIcon(route.color)}
            >
              <Popup>
                <div className="p-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getSafeColor(route.color) }}
                    />
                    <span className="font-semibold text-gray-900">{stop.name}</span>
                  </div>
                  <div className="text-xs text-gray-500">{route.name}</div>
                </div>
              </Popup>
            </Marker>
          ))
        )}

        {/* Buses */}
        {buses.filter(hasCoordinates).map((bus) => (
          <Marker
            key={bus.id}
            position={getLatLng(bus)}
            icon={createBusIcon(getRouteColor(bus.route_id), bus.heading)}
          >
            <Popup>
              <div className="p-1 min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: getSafeColor(getRouteColor(bus.route_id)) }}
                  />
                  <span className="font-semibold">Bus #{bus.bus_id}</span>
                </div>
                
                {bus.next_stop && (
                  <div className="text-sm text-gray-600 mb-1">
                    Next: {bus.next_stop}
                  </div>
                )}
                
                {bus.eta_minutes !== undefined && (
                  <div className="text-sm">
                    <span className="font-medium">{bus.eta_minutes} min</span>
                    <span className="text-gray-500"> to next stop</span>
                  </div>
                )}
                
                {bus.is_delayed && (
                  <Badge variant="destructive" className="mt-2 text-xs">
                    Delayed {bus.delay_minutes}+ min
                  </Badge>
                )}

                {bus.capacity_status && (
                  <div className="mt-2 text-xs text-gray-500">
                    Capacity: {bus.capacity_status}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Route Legend */}
      {!selectedRoute && routes.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-[1000]">
          <div className="text-xs font-medium text-gray-500 mb-2">Routes</div>
          <div className="space-y-1.5">
            {routes.map(route => (
              <div key={route.id} className="flex items-center gap-2">
                <div 
                  className="w-4 h-1 rounded-full" 
                  style={{ backgroundColor: getSafeColor(route.color) }}
                />
                <span className="text-xs text-gray-700">{route.short_name} - {route.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
