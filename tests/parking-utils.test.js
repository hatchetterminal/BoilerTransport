import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterParkingLots,
  formatParkingDistance,
  getParkingCategories,
  getParkingFacilityLabel,
  parkingLotsToGeoJSON,
  sortParkingLots,
} from '../src/lib/parking-utils.js';

const lots = [
  {
    id: 'garage',
    name: 'Grant Garage',
    code: 'PGG',
    latitude: 40.423,
    longitude: -86.911,
    is_garage: true,
    required_permits: ['A', 'Visitor/Paid'],
    availability_pattern: { 9: 'half' },
  },
  {
    id: 'surface',
    name: 'Discovery Lot',
    code: 'DPL',
    latitude: 40.418,
    longitude: -86.929,
    is_garage: false,
    required_permits: ['A', 'B', 'C'],
    availability_pattern: { 9: 'open' },
  },
  {
    id: 'residential',
    name: 'Residence Lot',
    code: 'RES',
    latitude: 40.43,
    longitude: -86.92,
    is_garage: false,
    required_permits: ['Residence Hall'],
    availability_pattern: { 9: 'full' },
  },
];

const streetParking = {
  id: 'street',
  name: 'Campus Street permit parking',
  facility_type: 'street',
  latitude: 40.425,
  longitude: -86.918,
  required_permits: ['A', 'B'],
  aliases: ['North campus curb spaces'],
  location_notes: 'Marked spaces beside the engineering buildings.',
  permit_notes: 'An employee permit is required; follow posted restrictions.',
};

test('parking categories support overlapping facility and access filters', () => {
  assert.deepEqual(getParkingCategories(lots[0]), ['garage', 'visitor']);
  assert.deepEqual(getParkingCategories(lots[2]), ['surface', 'residential']);
  assert.deepEqual(
    filterParkingLots(lots, { category: 'visitor' }).map((lot) => lot.id),
    ['garage'],
  );
  assert.deepEqual(
    filterParkingLots(lots, { category: 'surface' }).map((lot) => lot.id),
    ['surface', 'residential'],
  );
});

test('street parking is a distinct facility and never appears among surface lots', () => {
  const withStreet = [...lots, streetParking];
  assert.deepEqual(getParkingCategories(streetParking), ['street']);
  assert.deepEqual(
    filterParkingLots(withStreet, { category: 'street' }).map((lot) => lot.id),
    ['street'],
  );
  assert.deepEqual(
    filterParkingLots(withStreet, { category: 'surface' }).map((lot) => lot.id),
    ['surface', 'residential'],
  );
  assert.equal(getParkingFacilityLabel(streetParking), 'Street parking');
  assert.equal(getParkingFacilityLabel(lots[0]), 'Garage');
  assert.equal(getParkingFacilityLabel(lots[1]), 'Surface lot');
});

test('parking search includes permit names and combines with favorites', () => {
  const result = filterParkingLots(lots, {
    query: 'residence',
    favoritesOnly: true,
    favoriteIds: ['residential'],
  });
  assert.deepEqual(
    result.map((lot) => lot.id),
    ['residential'],
  );
});

test('parking search finds location notes, permit notes and aliases with permit filtering', () => {
  const withStreet = [...lots, streetParking];
  for (const query of ['engineering buildings', 'employee permit', 'NORTH CAMPUS CURB']) {
    assert.deepEqual(
      filterParkingLots(withStreet, { query, permit: 'B' }).map((lot) => lot.id),
      ['street'],
    );
  }
  assert.deepEqual(
    filterParkingLots(withStreet, { query: 'engineering buildings', permit: 'C' }),
    [],
  );
});

test('recommended parking puts favorites first, then sorts by availability', () => {
  const result = sortParkingLots(lots, { favoriteIds: ['residential'], hour: 9 });
  assert.deepEqual(
    result.map((lot) => lot.id),
    ['residential', 'surface', 'garage'],
  );
});

test('nearest parking keeps unknown coordinates last and adds distances', () => {
  const result = sortParkingLots([...lots, { id: 'unknown', name: 'Unknown' }], {
    sortBy: 'distance',
    userLocation: { latitude: 40.423, longitude: -86.912 },
    hour: 9,
  });
  assert.equal(result[0].id, 'garage');
  assert.equal(result.at(-1).id, 'unknown');
  assert.ok(Number.isFinite(result[0].distanceMiles));
  assert.match(formatParkingDistance(result[0].distanceMiles), /(ft|mi)$/);
});

test('GeoJSON uses longitude-latitude coordinates and carries UI state', () => {
  const geojson = parkingLotsToGeoJSON(lots, {
    favoriteIds: ['garage'],
    selectedLotId: 'garage',
    hour: 9,
  });
  assert.deepEqual(geojson.features[0].geometry.coordinates, [-86.911, 40.423]);
  assert.equal(geojson.features[0].properties.favorite, true);
  assert.equal(geojson.features[0].properties.selected, true);
});

test('street map features retain their facility label and unreported availability', () => {
  const [feature] = parkingLotsToGeoJSON([streetParking], { hour: 9 }).features;
  assert.equal(feature.properties.facility, 'Street parking');
  assert.equal(feature.properties.status, 'unknown');
  assert.deepEqual(feature.geometry.coordinates, [-86.918, 40.425]);
});
