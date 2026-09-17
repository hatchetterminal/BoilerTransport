import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { AlertTriangle, Layers3 } from 'lucide-react';
import { CAMPUS_MAP_CENTER, MAP_STYLE_URL } from '@/lib/map-config';
import { parkingAreasToGeoJSON } from '@/lib/parking-geometry';
import { hasParkingCoordinates, parkingLotsToGeoJSON } from '@/lib/parking-utils';

const LOT_SOURCE_ID = 'parking-lots';
const LOT_HALO_LAYER_ID = 'parking-lot-halos';
const LOT_LAYER_ID = 'parking-lot-points';
const LOT_LABEL_LAYER_ID = 'parking-lot-labels';
const CLUSTER_LAYER_ID = 'parking-clusters';
const CLUSTER_COUNT_LAYER_ID = 'parking-cluster-counts';
const USER_SOURCE_ID = 'parking-user-location';
const AREA_SOURCE_ID = 'parking-areas';
const AREA_LAYER_ID = 'parking-area-fill';

const emptyFeatureCollection = () => ({ type: 'FeatureCollection', features: [] });

function fitMapToLots(map, lots, userLocation, animate = true) {
  const bounds = new maplibregl.LngLatBounds();
  lots.filter(hasParkingCoordinates).forEach((lot) => {
    bounds.extend([Number(lot.longitude), Number(lot.latitude)]);
  });
  if (hasParkingCoordinates(userLocation)) {
    bounds.extend([Number(userLocation.longitude), Number(userLocation.latitude)]);
  }
  if (bounds.isEmpty()) return;

  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();
  const isSinglePoint = northEast.lng === southWest.lng && northEast.lat === southWest.lat;
  if (isSinglePoint) {
    map.easeTo({ center: northEast, zoom: 16, duration: animate ? 450 : 0 });
    return;
  }

  map.fitBounds(bounds, {
    padding: { top: 56, right: 44, bottom: 72, left: 44 },
    maxZoom: 15.8,
    duration: animate ? 500 : 0,
  });
}

function addParkingLayers(map, lotData, userData, areaData) {
  map.addSource(AREA_SOURCE_ID, { type: 'geojson', data: areaData });
  map.addLayer({
    id: AREA_LAYER_ID,
    type: 'fill',
    source: AREA_SOURCE_ID,
    paint: {
      'fill-color': ['case', ['get', 'selected'], '#CEB888', '#2563eb'],
      'fill-opacity': ['case', ['get', 'selected'], 0.5, 0.18],
    },
  });
  map.addLayer({
    id: 'parking-area-outline',
    type: 'line',
    source: AREA_SOURCE_ID,
    paint: {
      'line-color': ['case', ['get', 'selected'], '#927033', '#2563eb'],
      'line-width': ['case', ['get', 'selected'], 3, ['get', 'street'], 2, 1],
      'line-opacity': 0.8,
    },
  });
  map.addSource(LOT_SOURCE_ID, {
    type: 'geojson',
    data: lotData,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 44,
  });

  map.addLayer({
    id: LOT_HALO_LAYER_ID,
    type: 'circle',
    source: LOT_SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': ['case', ['==', ['get', 'selected'], true], 13, 11],
      'circle-color': ['case', ['==', ['get', 'selected'], true], '#CEB888', '#f59e0b'],
      'circle-opacity': [
        'case',
        ['any', ['==', ['get', 'selected'], true], ['==', ['get', 'favorite'], true]],
        0.95,
        0,
      ],
      'circle-blur': 0.08,
    },
  });

  map.addLayer({
    id: LOT_LAYER_ID,
    type: 'circle',
    source: LOT_SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': ['case', ['==', ['get', 'selected'], true], 8.5, 7.5],
      'circle-color': ['get', 'color'],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2.5,
      'circle-opacity': 0.98,
    },
  });

  map.addLayer({
    id: LOT_LABEL_LAYER_ID,
    type: 'symbol',
    source: LOT_SOURCE_ID,
    minzoom: 14.4,
    filter: ['!', ['has', 'point_count']],
    layout: {
      'text-field': ['get', 'code'],
      'text-size': 10,
      'text-offset': [0, 1.55],
      'text-anchor': 'top',
      'text-allow-overlap': false,
      'text-optional': true,
    },
    paint: {
      'text-color': '#111827',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
    },
  });

  map.addLayer({
    id: CLUSTER_LAYER_ID,
    type: 'circle',
    source: LOT_SOURCE_ID,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#111827',
      'circle-radius': ['step', ['get', 'point_count'], 17, 8, 20, 18, 24],
      'circle-stroke-color': '#CEB888',
      'circle-stroke-width': 3,
      'circle-opacity': 0.94,
    },
  });

  map.addLayer({
    id: CLUSTER_COUNT_LAYER_ID,
    type: 'symbol',
    source: LOT_SOURCE_ID,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 12,
    },
    paint: { 'text-color': '#ffffff' },
  });

  map.addSource(USER_SOURCE_ID, { type: 'geojson', data: userData });
  map.addLayer({
    id: 'parking-user-location-halo',
    type: 'circle',
    source: USER_SOURCE_ID,
    paint: {
      'circle-radius': 12,
      'circle-color': '#2563eb',
      'circle-opacity': 0.18,
    },
  });
  map.addLayer({
    id: 'parking-user-location-point',
    type: 'circle',
    source: USER_SOURCE_ID,
    paint: {
      'circle-radius': 6,
      'circle-color': '#2563eb',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
    },
  });
}

export default function ParkingMap({
  lots,
  selectedLot,
  onSelectLot,
  eventMode,
  favoriteIds,
  userLocation,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const lotsRef = useRef(lots);
  const userLocationRef = useRef(userLocation);
  const onSelectLotRef = useRef(onSelectLot);
  const latestLotDataRef = useRef(emptyFeatureCollection());
  const latestUserDataRef = useRef(emptyFeatureCollection());
  const latestAreaDataRef = useRef(emptyFeatureCollection());
  const previousBoundsKeyRef = useRef('');
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState('');

  const lotData = useMemo(
    () =>
      parkingLotsToGeoJSON(lots, {
        favoriteIds,
        selectedLotId: selectedLot?.id,
        eventMode,
      }),
    [eventMode, favoriteIds, lots, selectedLot?.id],
  );
  const areaData = useMemo(
    () => parkingAreasToGeoJSON(lots, selectedLot?.id),
    [lots, selectedLot?.id],
  );

  const userData = useMemo(() => {
    if (!hasParkingCoordinates(userLocation)) return emptyFeatureCollection();
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(userLocation.longitude), Number(userLocation.latitude)],
          },
          properties: {},
        },
      ],
    };
  }, [userLocation]);

  const boundsKey = useMemo(
    () =>
      lots
        .filter(hasParkingCoordinates)
        .map((lot) => lot.id)
        .sort()
        .join('|'),
    [lots],
  );

  useEffect(() => {
    lotsRef.current = lots;
    userLocationRef.current = userLocation;
    onSelectLotRef.current = onSelectLot;
    latestLotDataRef.current = lotData;
    latestUserDataRef.current = userData;
    latestAreaDataRef.current = areaData;
  }, [areaData, lotData, lots, onSelectLot, userData, userLocation]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: CAMPUS_MAP_CENTER,
      zoom: 14.2,
      attributionControl: true,
      maxPitch: 45,
      touchPitch: false,
      cooperativeGestures: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const handleLoad = () => {
      addParkingLayers(
        map,
        latestLotDataRef.current,
        latestUserDataRef.current,
        latestAreaDataRef.current,
      );
      setIsMapReady(true);
      setMapError('');
      fitMapToLots(map, lotsRef.current, userLocationRef.current, false);

      const selectFeature = (event) => {
        const id = event.features?.[0]?.properties?.id;
        const lot = lotsRef.current.find((item) => String(item.id) === String(id));
        if (lot) onSelectLotRef.current(lot);
      };
      map.on('click', LOT_LAYER_ID, selectFeature);
      map.on('click', LOT_LABEL_LAYER_ID, selectFeature);
      map.on('click', AREA_LAYER_ID, (event) => {
        // A point/cluster on top of an area owns the click.
        if (
          !map.queryRenderedFeatures(event.point, {
            layers: [LOT_LAYER_ID, LOT_LABEL_LAYER_ID, CLUSTER_LAYER_ID],
          }).length
        )
          selectFeature(event);
      });

      map.on('click', CLUSTER_LAYER_ID, async (event) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        const coordinates = feature?.geometry?.coordinates;
        const source = map.getSource(LOT_SOURCE_ID);
        if (!source || clusterId === undefined || !coordinates) return;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({ center: coordinates, zoom, duration: 450 });
      });

      [LOT_LAYER_ID, LOT_LABEL_LAYER_ID, CLUSTER_LAYER_ID, AREA_LAYER_ID].forEach((layerId) => {
        map.on('mouseenter', layerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = '';
        });
      });
    };

    const handleError = (event) => {
      if (!map.loaded() && event?.error)
        setMapError('The map could not load. The parking list is still available.');
    };

    map.on('load', handleLoad);
    map.on('error', handleError);

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;
    map.getSource(LOT_SOURCE_ID)?.setData(lotData);
    map.getSource(USER_SOURCE_ID)?.setData(userData);
    map.getSource(AREA_SOURCE_ID)?.setData(areaData);
  }, [areaData, isMapReady, lotData, userData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || selectedLot || boundsKey === previousBoundsKeyRef.current) return;
    fitMapToLots(map, lots, userLocation);
    previousBoundsKeyRef.current = boundsKey;
  }, [boundsKey, isMapReady, lots, selectedLot, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !hasParkingCoordinates(selectedLot)) return;
    map.easeTo({
      center: [Number(selectedLot.longitude), Number(selectedLot.latitude)],
      zoom: Math.max(map.getZoom(), 16),
      duration: 450,
    });
  }, [isMapReady, selectedLot]);

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-3xl border border-border bg-muted shadow-sm">
      <div ref={containerRef} className="h-full w-full" aria-label="Interactive parking map" />

      {!isMapReady && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/90 text-sm font-medium text-muted-foreground">
          <Layers3 className="mr-2 h-5 w-5 animate-pulse" aria-hidden="true" />
          Loading vector map…
        </div>
      )}

      {mapError && (
        <div className="absolute inset-x-3 top-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-card/95 p-3 text-sm text-amber-900 dark:text-amber-300 shadow-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{mapError}</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-7 left-3 z-10 flex max-w-[calc(100%-1.5rem)] items-center gap-2 overflow-x-auto rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur">
        {(lots.some((lot) => lot.availability_pattern)
          ? [
              { color: '#16a34a', label: 'Open' },
              { color: '#d97706', label: 'Limited' },
              { color: '#dc2626', label: 'Full' },
              ...(eventMode ? [{ color: '#7e22ce', label: 'Restricted' }] : []),
            ]
          : [
              { color: '#2563eb', label: 'Mapped parking area' },
              { color: '#6b7280', label: 'Availability unreported' },
            ]
        ).map(({ color, label }) => (
          <div key={label} className="flex flex-shrink-0 items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
