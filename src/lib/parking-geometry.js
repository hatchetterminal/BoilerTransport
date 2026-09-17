// The campus inventory describes parking areas, not individual available stalls.
export function parkingAreasToGeoJSON(lots, selectedLotId = null) {
  return {
    type: 'FeatureCollection',
    features: lots
      .filter((lot) => ['Polygon', 'MultiPolygon'].includes(lot.geometry?.type))
      .map((lot) => ({
        type: 'Feature',
        id: lot.id,
        geometry: lot.geometry,
        properties: {
          id: lot.id,
          selected: lot.id === selectedLotId,
          street: lot.facility_type === 'street',
        },
      })),
  };
}

// A scanline through the polygon produces a point inside a mapped parking area,
// unlike a bounding-box center, which can land in a building or polygon hole.
export function parkingAreaPoint(geometry) {
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
  let best = null;
  for (const rings of polygons) {
    const ys = rings[0].map((point) => point[1]);
    const minY = Math.min(...ys);
    const height = Math.max(...ys) - minY;
    for (const fraction of [0.5, 0.25, 0.75, 0.125, 0.875]) {
      const y = minY + height * fraction;
      const intersections = [];
      for (const ring of rings) {
        for (let i = 1; i < ring.length; i++) {
          const [x1, y1] = ring[i - 1];
          const [x2, y2] = ring[i];
          if (y1 > y !== y2 > y) intersections.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
        }
      }
      intersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < intersections.length; i += 2) {
        const width = intersections[i + 1] - intersections[i];
        const score = width * height;
        if (!best || score > best.score)
          best = { point: [(intersections[i] + intersections[i + 1]) / 2, y], score };
      }
    }
  }
  if (!best) throw new Error('Parking geometry has no interior point');
  return best.point;
}
