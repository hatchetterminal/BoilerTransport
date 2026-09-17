import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildArrivalsForRoute,
  decorateLotsForEvent,
  getAvailabilityStatus,
  getDistanceInMiles,
  normalizeErrorMessage,
} from '../src/lib/transport-utils.js';

test('event restrictions decorate matching lot codes without changing the inputs', () => {
  const lots = [
    { id: '1', code: 'A' },
    { id: '2', code: 'B' },
    { id: '3', code: 'C' },
  ];
  const result = decorateLotsForEvent(lots, {
    restricted_lots: ['A'],
    closed_lots: ['B'],
  });

  assert.equal(result[0].event_restricted, true);
  assert.equal(result[1].closed, true);
  assert.equal(result[2].event_restricted, false);
  assert.equal(lots[0].event_restricted, undefined);
});

test('a closed lot always reports closed before its hourly pattern', () => {
  assert.equal(
    getAvailabilityStatus({ closed: true, availability_pattern: { 8: 'open' } }, 8),
    'closed',
  );
  assert.equal(getAvailabilityStatus({ availability_pattern: { 8: 'full' } }, 8), 'full');
  assert.equal(getAvailabilityStatus({}, 8), 'unknown');
});

test('route arrivals preserve a zero-minute ETA and sort unknown ETAs last', () => {
  const arrivals = buildArrivalsForRoute({ id: 'gold' }, [
    { route_id: 'gold', bus_id: '2', eta_minutes: 4 },
    { route_id: 'other', bus_id: '9', eta_minutes: 1 },
    { route_id: 'gold', bus_id: '1', eta_minutes: 0 },
    { route_id: 'gold', bus_id: '3' },
  ]);

  assert.deepEqual(
    arrivals.map((arrival) => arrival.bus_id),
    ['1', '2', '3'],
  );
  assert.equal(arrivals[0].eta_minutes, 0);
  assert.equal(arrivals[2].eta_minutes, null);
});

test('error messages fall back when no useful message exists', () => {
  assert.equal(normalizeErrorMessage(new Error('Network unavailable')), 'Network unavailable');
  assert.equal(normalizeErrorMessage({}, 'Try later'), 'Try later');
});

test('distance calculation returns realistic miles and rejects missing coordinates', () => {
  const distance = getDistanceInMiles(
    { latitude: 40.4237, longitude: -86.9212 },
    { latitude: 40.43, longitude: -86.92 },
  );

  assert.ok(distance > 0.4 && distance < 0.5);
  assert.equal(getDistanceInMiles({ latitude: 40 }, { latitude: 41 }), null);
});
