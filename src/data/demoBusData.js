// Illustrative bus routes and arrivals; these are not a live transit feed.
export const demoBusRoutes = [
  {
    id: 'route-4b',
    name: 'Purdue West',
    short_name: '4B',
    color: '#2563eb',
    schedule_start: '6:30 AM',
    schedule_end: '11:30 PM',
    frequency_minutes: 15,
    is_active: true,
    stops: [
      { name: 'Memorial Union', latitude: 40.42417, longitude: -86.91152 },
      { name: 'Krannert', latitude: 40.42313, longitude: -86.91295 },
      { name: 'Purdue West', latitude: 40.42592, longitude: -86.92454 },
      { name: 'McCutcheon Hall', latitude: 40.42745, longitude: -86.92972 },
      { name: 'Northwestern Garage', latitude: 40.42835, longitude: -86.91491 },
    ],
  },
  {
    id: 'route-13',
    name: 'Silver Loop',
    short_name: '13',
    color: '#6b7280',
    schedule_start: '7:00 AM',
    schedule_end: '7:00 PM',
    frequency_minutes: 10,
    is_active: true,
    stops: [
      { name: 'Purdue Memorial Union', latitude: 40.42417, longitude: -86.91152 },
      { name: 'Armstrong Hall', latitude: 40.43111, longitude: -86.91488 },
      { name: 'Ross-Ade Stadium', latitude: 40.43419, longitude: -86.91838 },
      { name: 'Co-Rec', latitude: 40.42892, longitude: -86.92271 },
      { name: 'Third Street Suites', latitude: 40.42631, longitude: -86.92116 },
    ],
  },
  {
    id: 'route-17',
    name: 'Ross-Ade Express',
    short_name: '17',
    color: '#16a34a',
    schedule_start: '7:30 AM',
    schedule_end: '10:00 PM',
    frequency_minutes: 20,
    is_active: true,
    stops: [
      { name: 'Discovery Park', latitude: 40.41893, longitude: -86.92956 },
      { name: 'McCutcheon Garage', latitude: 40.42565, longitude: -86.92934 },
      { name: 'Co-Rec', latitude: 40.42892, longitude: -86.92271 },
      { name: 'Ross-Ade Stadium', latitude: 40.43419, longitude: -86.91838 },
    ],
  },
  {
    id: 'route-23',
    name: 'The Connector',
    short_name: '23',
    color: '#dc2626',
    schedule_start: '6:45 AM',
    schedule_end: '12:00 AM',
    frequency_minutes: 12,
    is_active: true,
    stops: [
      { name: 'Chauncey Hill', latitude: 40.42379, longitude: -86.90664 },
      { name: 'Grant Street Garage', latitude: 40.42319, longitude: -86.91092 },
      { name: 'Engineering Mall', latitude: 40.42812, longitude: -86.91366 },
      { name: 'Discovery Park', latitude: 40.41893, longitude: -86.92956 },
    ],
  },
];

export const demoBuses = [
  {
    id: 'bus-4b-1',
    bus_id: '401',
    route_id: 'route-4b',
    latitude: 40.42565,
    longitude: -86.92132,
    heading: 80,
    next_stop: 'Purdue West',
    eta_minutes: 4,
    delay_minutes: 0,
    is_delayed: false,
    capacity_status: 'moderate',
  },
  {
    id: 'bus-13-1',
    bus_id: '1302',
    route_id: 'route-13',
    latitude: 40.43072,
    longitude: -86.91892,
    heading: 25,
    next_stop: 'Armstrong Hall',
    eta_minutes: 3,
    delay_minutes: 0,
    is_delayed: false,
    capacity_status: 'crowded',
  },
  {
    id: 'bus-17-1',
    bus_id: '1705',
    route_id: 'route-17',
    latitude: 40.42698,
    longitude: -86.92621,
    heading: 15,
    next_stop: 'Co-Rec',
    eta_minutes: 7,
    delay_minutes: 2,
    is_delayed: true,
    capacity_status: 'moderate',
  },
  {
    id: 'bus-23-1',
    bus_id: '2304',
    route_id: 'route-23',
    latitude: 40.42407,
    longitude: -86.91173,
    heading: 270,
    next_stop: 'Engineering Mall',
    eta_minutes: 6,
    delay_minutes: 0,
    is_delayed: false,
    capacity_status: 'empty',
  },
];

const toDemoIso = (baseDate, dayOffset, hour, minute = 0) => {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const getDemoCampusEvents = (baseDate = new Date()) => {
  const activeStart = new Date(baseDate.getTime() - 45 * 60 * 1000).toISOString();
  const activeEnd = new Date(baseDate.getTime() + 2.5 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'demo-event-football',
      title: 'Boilermaker Football Game',
      description:
        'Demo event showing how game-day transportation changes appear throughout the app.',
      venue: 'Ross-Ade Stadium',
      event_type: 'football',
      start_time: activeStart,
      end_time: activeEnd,
      expected_attendance: 57_000,
      restricted_lots: ['RAN', 'RAS'],
      closed_lots: ['MAC'],
      alternative_lots: ['DPS', 'DPN', 'CREC-N'],
      shuttle_routes: ['Stadium Express'],
      special_instructions: 'Use posted event routes and allow extra travel time.',
      is_active: true,
    },
    {
      id: 'demo-event-basketball',
      title: 'Men’s Basketball',
      description: 'Evening event traffic is expected around Northwestern Avenue.',
      venue: 'Mackey Arena',
      event_type: 'basketball',
      start_time: toDemoIso(baseDate, 1, 19, 0),
      end_time: toDemoIso(baseDate, 1, 21, 30),
      expected_attendance: 14_800,
      restricted_lots: ['MAC'],
      closed_lots: [],
      alternative_lots: ['PGNW', 'CREC-N'],
      shuttle_routes: [],
      special_instructions: 'Expect delays near Northwestern Avenue before and after the game.',
      is_active: false,
    },
    {
      id: 'demo-event-graduation',
      title: 'Summer Commencement',
      description: 'Additional visitor parking and shuttle service will be available.',
      venue: 'Elliott Hall of Music',
      event_type: 'graduation',
      start_time: toDemoIso(baseDate, 5, 10, 0),
      end_time: toDemoIso(baseDate, 5, 12, 30),
      expected_attendance: 6_500,
      restricted_lots: ['PGU'],
      closed_lots: [],
      alternative_lots: ['PGG', 'PGH'],
      shuttle_routes: ['Commencement Shuttle'],
      special_instructions: 'Follow commencement signs for guest drop-off and accessible parking.',
      is_active: false,
    },
  ];
};
