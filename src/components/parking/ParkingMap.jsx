import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Star } from 'lucide-react';
import L from 'leaflet';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getAvailabilityColor = (status) => {
  switch (status) {
    case 'open': return '#22c55e';
    case 'half': return '#f59e0b';
    case 'full': return '#ef4444';
    default: return '#6b7280';
  }
};

const getAvailabilityLabel = (status) => {
  switch (status) {
    case 'open': return 'Available';
    case 'half': return 'Limited';
    case 'full': return 'Full';
    default: return 'Unknown';
  }
};

const toCoordinate = (value) => Number.parseFloat(value);
const hasCoordinates = (item) =>
  Number.isFinite(toCoordinate(item?.latitude)) && Number.isFinite(toCoordinate(item?.longitude));
const getLatLng = (item) => [toCoordinate(item.latitude), toCoordinate(item.longitude)];
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

const createLotIcon = (status, isRestricted, lotCode) => {
  const color = isRestricted ? '#9333ea' : getAvailabilityColor(status);
  const safeLotCode = escapeHtml(lotCode);
  return L.divIcon({
    className: 'custom-lot-marker',
    html: `
      <div style="
        background: white;
        border: 2.5px solid ${color};
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.18);
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 3px 7px;
        white-space: nowrap;
      ">
        <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></div>
        <span style="font-size:11px;font-weight:700;color:#111;letter-spacing:0.02em;">${safeLotCode}</span>
      </div>
    `,
    iconSize: [86, 28],
    iconAnchor: [43, 14],
    popupAnchor: [0, -14],
  });
};

function MapController({ center, lots }) {
  const map = useMap();
  const lastBoundsKey = useRef('');

  const boundsKey = useMemo(
    () => lots
      .filter(hasCoordinates)
      .map(lot => `${lot.id}:${toCoordinate(lot.latitude)},${toCoordinate(lot.longitude)}`)
      .sort()
      .join('|'),
    [lots]
  );

  useEffect(() => {
    if (center) {
      map.setView(center, 16);
      return;
    }

    const mappableLots = lots.filter(hasCoordinates);

    if (mappableLots.length > 1 && boundsKey !== lastBoundsKey.current) {
      const bounds = L.latLngBounds(mappableLots.map(getLatLng));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      lastBoundsKey.current = boundsKey;
    } else if (mappableLots.length === 1 && boundsKey !== lastBoundsKey.current) {
      map.setView(getLatLng(mappableLots[0]), 16);
      lastBoundsKey.current = boundsKey;
    }
  }, [boundsKey, center, lots, map]);

  return null;
}

export default function ParkingMap({ lots, selectedLot, onSelectLot, eventMode, favoriteIds, onToggleFavorite }) {
  const currentHour = new Date().getHours();
  const purdueCenter = [40.4237, -86.9212];

  const getCurrentAvailability = (lot) => {
    if (!lot.availability_pattern) return 'open';
    return lot.availability_pattern[currentHour] || 'open';
  };

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <MapContainer
        center={purdueCenter}
        zoom={15}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapController
          center={selectedLot && hasCoordinates(selectedLot) ? getLatLng(selectedLot) : null}
          lots={lots}
        />
        
        {lots.filter(hasCoordinates).map((lot) => {
          const availability = getCurrentAvailability(lot);
          const isRestricted = eventMode && (lot.event_restricted || lot.closed);
          
          return (
            <Marker
              key={lot.id}
              position={getLatLng(lot)}
              icon={createLotIcon(availability, isRestricted, lot.code || lot.name?.slice(0,4))}
              eventHandlers={{
                click: () => onSelectLot(lot),
              }}
            >
              <Popup className="lot-popup">
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{lot.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onToggleFavorite(lot.id);
                      }}
                      className="p-1 relative z-10"
                    >
                      <Star
                        className={`w-4 h-4 ${favoriteIds?.includes(lot.id) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                      />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getAvailabilityColor(availability) }}
                      />
                      <span className="text-sm text-gray-600">
                        {getAvailabilityLabel(availability)}
                      </span>
                    </div>
                    
                    {lot.required_permits?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {lot.required_permits.map((permit) => (
                          <Badge key={permit} variant="outline" className="text-xs bg-gray-50">
                            {permit}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {isRestricted && (
                      <div className="flex items-center gap-1 text-purple-600 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Event Restrictions</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md z-[1000] flex items-center gap-3 border border-gray-100">
        {[
          { color: '#22c55e', label: 'Open' },
          { color: '#f59e0b', label: 'Limited' },
          { color: '#ef4444', label: 'Full' },
          ...(eventMode ? [{ color: '#9333ea', label: 'Restricted' }] : []),
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
