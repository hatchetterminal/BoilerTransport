import test from 'node:test';
import assert from 'node:assert/strict';
import { getCampusEvents } from '../src/data/purdueEventsData.js';
import { formatEventDate, formatEventTime, groupCampusEvents } from '../src/lib/event-utils.js';

test('the current schedule displays dates and times without requiring end times', () => {
  const groups = groupCampusEvents(getCampusEvents(), new Date('2026-09-08T16:00:00Z'));
  const events = groups.flatMap((group) => group.events);
  assert.ok(events.some((event) => event.start_time));
  assert.ok(events.some((event) => !event.start_time));
  assert.ok(events.every((event) => !event.end_time));
  for (const event of events) {
    assert.ok(formatEventDate(event.date));
    assert.ok(formatEventTime(event));
    assert.equal(event.status, 'scheduled');
    assert.ok(event.date >= '2026-09-08');
  }
});

test('TBA games retain their calendar date and remain in the upcoming list', () => {
  const event = {
    id: 'tba',
    date: '2026-09-09',
    start_time: null,
    is_home: true,
    status: 'scheduled',
    time_note: 'Time TBA',
  };
  // It is already September 9 in UTC, but still September 8 at Purdue.
  const groups = groupCampusEvents([event], new Date('2026-09-09T02:00:00Z'));
  assert.equal(groups[0].label, 'Tomorrow');
  assert.equal(groups[0].events[0].id, 'tba');
  assert.equal(formatEventTime(event), 'Time TBA');
  assert.match(formatEventDate(event.date), /Sep 9, 2026/);
});

test('a known start time is displayed in campus time without an invented end time', () => {
  assert.equal(formatEventTime({ start_time: '2026-09-12T16:00:00Z' }), '12:00 PM EDT');
  assert.equal(formatEventTime({ start_time: null }), 'Time TBA');
});
