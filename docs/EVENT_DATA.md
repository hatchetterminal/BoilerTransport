# Purdue event schedules

`src/data/purdueEventsSource.js` is the generated snapshot of Purdue home schedules. `src/data/purdueEventsData.js` attaches parking guidance, and `src/lib/event-utils.js` formats and groups the records. Bus examples are separate, in `src/data/demoBusData.js`.

## Record conventions

- `date` is a campus calendar date, separate from the optional `start_time` timestamp.
- Unannounced start times remain `null` and display as Time TBA. Do not invent start or end times.
- Upcoming lists include scheduled home events, ordered by date and time.
- Calendar-day parking advisories are not live-game status or verified closure windows.
- Source URLs and verification dates are retained in the snapshot. Posted signs and current Purdue guidance govern parking.

## Refresh the snapshot

From the project root, run:

```sh
npm run data:events
```

The importer fetches football, men's basketball, women's basketball, volleyball, and soccer schedules. It checks the visible schedule against structured data and writes the snapshot only when every source parses successfully.

To use previously downloaded HTML, pass a directory containing `football.html`, `mens-basketball.html`, `womens-basketball.html`, `volleyball.html`, and `womens-soccer.html`:

```sh
npm run data:events -- /absolute/path/to/schedules
```

Review changed dates, venues, times, status, and source coverage. Verify parking guidance separately; the schedule importer does not refresh parking rules. Then run `npm run check` and `npm run ios:sync`, and inspect the Events tab, including a TBA event and expanded parking details.
