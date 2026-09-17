import test from 'node:test';
import assert from 'node:assert/strict';
import source from '../src/data/purdueParkingSource.js';
import {
  purdueParkingLots as lots,
  parkingInventoryMetadata as metadata,
} from '../src/data/purdueParkingData.js';
import { filterParkingLots, getParkingCategories } from '../src/lib/parking-utils.js';
import { parkingAreaPoint, parkingAreasToGeoJSON } from '../src/lib/parking-geometry.js';
import { getAvailabilityStatus } from '../src/lib/transport-utils.js';

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inGeometry(point, geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some(
    ([outer, ...holes]) => inRing(point, outer) && !holes.some((hole) => inRing(point, hole)),
  );
}

test('every in-scope official parking feature is represented exactly once, including garage floors', () => {
  assert.equal(source.features.length, source.source_record_count);
  const excluded = new Set(metadata.excluded_records.map((record) => record.id));
  const expected = source.features
    .filter((feature) => !excluded.has(feature.properties.FID))
    .map((feature) => feature.properties.FID)
    .sort((a, b) => a - b);
  const actual = lots.flatMap((lot) => lot.source_feature_ids).sort((a, b) => a - b);
  assert.deepEqual(actual, expected);
  assert.equal(new Set(lots.map((lot) => lot.id)).size, lots.length);
  assert.equal(new Set(lots.map((lot) => lot.name)).size, lots.length);
  assert.equal(new Set(actual).size, actual.length);
  assert.equal(metadata.included_source_record_count, actual.length);
  assert.deepEqual(
    [...excluded].sort((a, b) => a - b),
    [240, 249],
  );
  assert.ok(!lots.some((lot) => lot.name.includes('All street parking in West Lafayette')));
});

test('only six operating garages remain, with preserved IDs and authoritative locations', () => {
  const garages = lots.filter((lot) => lot.is_garage);
  assert.deepEqual(garages.map((lot) => lot.code).sort(), [
    'PGG',
    'PGH',
    'PGMD',
    'PGNW',
    'PGU',
    'PGW',
  ]);
  assert.ok(!lots.some((lot) => /Graduate House|PGGH/.test(`${lot.name} ${lot.code}`)));
  const harrison = garages.find((lot) => lot.code === 'PGH');
  assert.equal(harrison.id, 'lot-harrison-street-garage');
  assert.ok(Math.abs(harrison.longitude - -86.9176) < 0.001);
  assert.ok(harrison.required_permits.includes('South Campus Graduate'));
  assert.ok(!harrison.required_permits.includes('Student Garage'));
  assert.match(harrison.permit_notes, /fall 2026 only/);
  const grant = garages.find((lot) => lot.code === 'PGG');
  assert.match(
    grant.permit_notes,
    /Student A, monthly A and daily A permits do not include gated access/,
  );
});

test('all published Purdue street sections are searchable separately from surface lots', () => {
  const streets = filterParkingLots(lots, { category: 'street' });
  assert.equal(streets.length, metadata.street_count);
  assert.equal(streets.length, 41);
  for (const road of [
    'Tower',
    'Arnold',
    'Third',
    'University',
    'Macarthur',
    'McCutcheon',
    'Ross',
  ]) {
    assert.ok(
      filterParkingLots(streets, { query: road }).length > 0,
      `Missing ${road} street parking`,
    );
  }
  const cStreet = filterParkingLots(lots, { category: 'street', permit: 'C' });
  assert.equal(cStreet.length, 4);
  assert.ok(cStreet.every((lot) => lot.aliases.includes('Arnold Drive')));
  assert.ok(streets.every((lot) => !filterParkingLots([lot], { category: 'surface' }).length));
});

test('mapped areas have source links, valid interior coordinates and no fabricated availability', () => {
  for (const lot of lots) {
    assert.ok(
      inGeometry([lot.longitude, lot.latitude], lot.geometry),
      `${lot.id} marker is outside its parking area`,
    );
    assert.ok(
      lot.latitude > 40.3 && lot.latitude < 40.6 && lot.longitude > -87.1 && lot.longitude < -86.7,
    );
    assert.match(lot.source_url, /^https:\/\/purdueuniversity\.maps\.arcgis\.com\//);
    assert.equal(lot.verified_on, source.retrieved_on);
    assert.equal(getAvailabilityStatus(lot, 9), 'unknown');
    assert.equal(lot.availability_pattern, undefined);
  }
});

test('permit filters do not turn restricted or unclassified areas into general campus parking', () => {
  for (const lot of lots.filter((lot) => !lot.is_garage)) {
    const [code] = lot.source_permit_codes;
    if (['SP', 'FSCL', 'RE', 'NPR', 'VAL', 'SCG'].includes(code)) {
      assert.ok(!lot.required_permits.includes('A'), lot.id);
      assert.ok(!lot.required_permits.includes('B'), lot.id);
      assert.ok(!lot.required_permits.includes('C'), lot.id);
    }
    if (code === 'FSCL') assert.ok(!lot.required_permits.includes('Residence Hall'));
    if (code === 'NPR') assert.deepEqual(lot.required_permits, []);
  }
  assert.equal(
    lots.find((lot) => lot.source_feature_ids.includes(310)).required_permits[0],
    'Hawkins',
  );
  assert.ok(
    !getParkingCategories({ required_permits: ['Presidential Reserved'] }).includes('residential'),
  );
});

test('area geometry preserves street boundaries and selection independently of availability', () => {
  const lot = lots.find((lot) => lot.facility_type === 'street');
  const geojson = parkingAreasToGeoJSON([lot], lot.id);
  assert.deepEqual(geojson.features[0].geometry, lot.geometry);
  assert.equal(geojson.features[0].properties.street, true);
  assert.equal(geojson.features[0].properties.selected, true);
  const donut = {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
      [
        [2, 2],
        [8, 2],
        [8, 8],
        [2, 8],
        [2, 2],
      ],
    ],
  };
  assert.ok(inGeometry(parkingAreaPoint(donut), donut));
});
