import source from './purdueEventsSource.js';
import { campusDate, upcomingCampusEvents } from '../lib/event-utils.js';

export const EVENT_PARKING_URL = 'https://www.purdue.edu/operations/parking/home/event-parking/';
export const eventsMetadata = source;
export const parkingRulesVerifiedOn = '2026-09-06';

const signs =
  'Lots and permit-only streets near Ross-Ade, Mackey and Mollenkopf have posted removal times. Follow each location’s signs; vehicles left after the posted time may be relocated.';
const footballAreas =
  'Affected areas include athletics lots, Armory, PUSH, Horticulture Park, Pickett Park, Purdue West and Schowe House; Hilltop loop, stadium ramps, Third Street (McCutcheon–McCormick) and Tower Drive (John Wooden–Martin Jischke). Check Purdue’s full list for the individual lot letters.';
const rv =
  'RV areas close to regular permit holders the day before the game: north CoRec (RV3) at 4 p.m.; upper H (RV1), south Discovery Park gravel (RV2) and Northwest Athletic Complex (RV4) at 5 p.m. They remain reserved through the morning after the game.';

export function parkingForEvent(event) {
  if (event.sport === 'football') {
    const friday = new Date(`${event.date}T12:00:00Z`).getUTCDay() === 5;
    const garageRule = friday
      ? 'Friday: Northwestern and University Street garages admit eligible campus permits before 3 p.m.; those vehicles may remain. From 3 p.m., entry requires a paid athletic event parking pass.'
      : 'Saturday: clear Northwestern and University Street garages by 6 a.m. to avoid relocation. Event parking begins at 8 a.m.; a normal campus permit does not cover event entry.';
    return {
      summary: friday
        ? 'Friday football parking • garage event entry from 3 p.m.'
        : 'Saturday football parking • garage removal deadline 6 a.m.',
      rules: [
        garageRule,
        signs,
        footballAreas,
        friday
          ? 'Friday removal times vary: many athletics lots and affected streets at 7 a.m.; O, W, AA, BB and FF at noon; Purdue West at 3 p.m.; Armory and PUSH at 5 p.m. Purdue lists FF in both morning and noon groups, so follow its posted signs.'
          : 'Saturday lot and street relocation may begin as early as 6 a.m.; the posted time for each location controls.',
        rv,
      ],
      alternatives: friday
        ? 'For campus business or classes, Purdue lists Harrison Street Garage, 2550 Northwestern Avenue, GG lot, lots south of Mitch Daniels Boulevard and the airport east gravel lot. Follow the permit and temporary signs.'
        : 'For campus business or classes, Purdue suggests Wood Street Garage and locations with relaxed evening/weekend enforcement. Reserved and 24/7 permit restrictions still apply.',
      transit: friday
        ? 'Friday transit changes include removal of the Ross-Ade Loop stop on Tiller Drive, relocation of the Purdue Mall Loop stop to McCormick Road, and an airport east gravel lot stop on Discovery Park Loop. Check Purdue’s notice for the full changes.'
        : null,
      link: 'https://purduesports.com/football-parking-main',
      garage_advisories: { PGNW: garageRule, PGU: garageRule },
    };
  }
  if (event.sport === 'mens-basketball' || event.sport === 'womens-basketball') {
    const mens = event.sport === 'mens-basketball';
    const garageRule = mens
      ? 'Northwestern Garage generally switches to paid event entry at 5 p.m. on weekdays (some games at 4:30 p.m.), or three hours before weekend tip-off. Eligible permit holders already parked before the change may remain. Check the game notice for its exact time.'
      : 'Northwestern Garage remains available to the campus community for women’s basketball; men’s game-day garage rules do not apply.';
    return {
      summary: mens
        ? 'Men’s basketball • Northwestern Garage event rates'
        : 'Women’s basketball • selected athletics lots affected',
      rules: [
        garageRule,
        mens
          ? 'Athletics lots A, AA, C, F, G, H, J, K, M, N, P, Q, R, U, Y, Z and FB Staff, plus stadium ramps and the north plaza, have restrictions. J lot relocation starts at 7 a.m.; other lots follow posted times.'
          : 'Athletics lots A, C, F, G, P, R, U and Y, plus stadium ramps and the north plaza, have restrictions at posted times.',
        signs,
      ],
      alternatives:
        'For campus business or classes, Purdue lists University Street, Wood Street and Harrison Street garages and university parking south of Mitch Daniels Boulevard. Eligible permits apply during business hours; check signs and other events before parking.',
      transit: null,
      link: 'https://purduesports.com/basketball-parking-main',
      garage_advisories: mens ? { PGNW: garageRule } : {},
    };
  }
  if (event.sport === 'volleyball')
    return {
      summary: 'Volleyball • check posted athletics-area restrictions',
      rules: [
        signs,
        'Purdue’s general volleyball notice does not give a universal garage fee or removal time. Check the signs and event guidance for this match.',
      ],
      alternatives: null,
      transit: null,
      link: event.source_url,
      garage_advisories: {},
    };
  return {
    summary: 'Soccer • match-specific parking details not published here',
    rules: [
      'No match-specific closure or event rate has been verified for this fixture. Follow the permit and temporary signs at Folk Field and the Northwest Athletic Complex; check other campus events on the same date.',
    ],
    alternatives: null,
    transit: null,
    link: event.source_url,
    garage_advisories: {},
  };
}

export const purdueCampusEvents = source.events.map((event) => ({
  ...event,
  parking: parkingForEvent(event),
}));

export function getCampusEvents() {
  return purdueCampusEvents;
}

// A calendar-day advisory is not a live game or a verified closure window.
export function getGameDayEvents(now = new Date()) {
  return upcomingCampusEvents(purdueCampusEvents, now)
    .filter((event) => event.date === campusDate(now) && event.sport !== 'womens-soccer')
    .sort((a, b) => Number(b.sport === 'football') - Number(a.sport === 'football'));
}
