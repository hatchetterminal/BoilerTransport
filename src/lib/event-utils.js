export const CAMPUS_TIME_ZONE = 'America/Indiana/Indianapolis';

export function campusDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CAMPUS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

// Date-only records stay date-only: UTC midnight would move them to the previous campus day.
export function formatEventDate(date, options = {}) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatEventTime(event) {
  if (!event.start_time) return event.time_note || 'Time TBA';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CAMPUS_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(event.start_time));
}

export function upcomingCampusEvents(events, now = new Date()) {
  const today = campusDate(now);
  return events
    .filter((event) => event.is_home && event.status === 'scheduled' && event.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || (a.start_time || 'z').localeCompare(b.start_time || 'z'),
    );
}

export function groupCampusEvents(events, now = new Date()) {
  const today = campusDate(now);
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowDate = tomorrow.toISOString().slice(0, 10);
  const groups = new Map();
  for (const event of upcomingCampusEvents(events, now)) {
    const label =
      event.date === today
        ? 'Today'
        : event.date === tomorrowDate
          ? 'Tomorrow'
          : formatEventDate(event.date, { weekday: undefined, day: undefined, month: 'long' });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(event);
  }
  return [...groups].map(([label, items]) => ({ label, events: items }));
}
