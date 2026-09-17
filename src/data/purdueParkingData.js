import source from './purdueParkingSource.js';
import { parkingAreaPoint } from '../lib/parking-geometry.js';

const STUDENT_POLICY = 'https://www.purdue.edu/operations/parking/home/permits/students/';
const STAFF_POLICY = 'https://www.purdue.edu/operations/parking/home/permits/faculty-staff/';
const signNote =
  'Use only the marked spaces for your permit. Posted restrictions, reserved spaces and event closures take precedence.';

const permitNames = {
  A: ['A'],
  AB: ['A', 'B'],
  ABC: ['A', 'B', 'C'],
  R: ['Residence Hall'],
  RG: ['Residence Hall'],
  FSCL: ['Restricted Residential'],
  M: ['Visitor/Paid'],
  GGPP: ['Visitor/Paid'],
  SP: ['Special Permit'],
  RE: ['Presidential Reserved'],
  VAL: ['Value'],
  CONT: ['Contractor'],
  UV: ['University Vehicle'],
  SCG: ['South Campus Graduate'],
  NPR: [],
};

const shortNames = {
  DAUC: 'Dauch Alumni Center',
  HAWK: 'Hawkins Hall',
  YONG: 'Young Hall',
  HNLY: 'Hanley Hall',
  ARMS: 'Armstrong Hall',
  DUHM: 'Duhme Hall',
  ERHT: 'Earhart Hall',
  EHRT: 'Earhart Hall',
  MRDH: 'Meredith Hall',
  MDDH: 'Meredith Hall',
  SHRV: 'Shreve Hall',
  SMLY: 'Smalley Center',
  MCUT: 'McCutcheon Hall',
  HARR: 'Harrison Hall',
  OWEN: 'Owen Hall',
  FORD: 'Ford Dining Court',
  HILL: 'Hillenbrand Hall',
  TARK: 'Tarkington Hall',
  VAWT: 'Vawter Hall',
  WARN: 'Warren Hall',
  WOOD: 'Wood Hall',
  WILY: 'Wiley Hall',
  LAMB: 'Lambert Fieldhouse',
  LWSN: 'Lawson Hall',
  STEW: 'Stewart Center',
  BRNG: 'Beering Hall',
  STON: 'Stone Hall',
  PAO: 'Pao Hall',
  LYNN: 'Lynn Hall',
  VMTH: 'Veterinary Hospital',
  MACK: 'Mackey Arena',
  MOLL: 'Mollenkopf Athletic Center',
  BCC: 'Black Cultural Center',
  PWF: 'Purdue West',
  PW: 'Purdue West',
  ELLT: 'Elliott Hall of Music',
  MRGN: 'Morgan Center',
  HORT: 'Horticulture Building',
  HORT1: 'Horticulture Building',
  HORT2: 'Horticulture Building',
  SOIL: 'Soil Erosion Laboratory',
  EHSB: 'Equine Health Sciences Building',
  PMU: 'Purdue Memorial Union',
};

function readableLocation(feature) {
  const p = feature.properties;
  let name = p.LotDesc || p.LotName || `Parking area ${p.LotMapShee || p.FID}`;
  if (/^France Cor[cd]ova REC$/.test(name)) return `Co-Rec ${p.LotName}`;
  name = name
    .replace(
      /\b[A-Z][A-Z0-9]{1,}\b/g,
      (code) => shortNames[code] || source.building_names[code] || code,
    )
    .replace(/\bRoss Ade\b/g, 'Ross-Ade')
    .replace(/\bSt\.?(?=\s|$)/g, 'Street')
    .replace(/\bDr\.?(?=\s|[A-Z]|$)/g, 'Drive ')
    .replace(/\bRd\.?(?=\s|$)/g, 'Road')
    .replace(/\bS Univ\.?/g, 'South University')
    .replace(/\bS OF\b/gi, 'south of')
    .replace(/\bN OF\b/gi, 'north of')
    .replace(/\bE OF\b/gi, 'east of')
    .replace(/\bW OF\b/gi, 'west of')
    .replace(/\bNW of\b/gi, 'northwest of')
    .replace(/\bNE of\b/gi, 'northeast of')
    .replace(/\bSW of\b/gi, 'southwest of')
    .replace(/\bSE of\b/gi, 'southeast of')
    .replace(/Southof/g, 'south of')
    .replace(/PARIKNG/g, 'parking')
    .replace(/Drive\.?Parking/g, 'Drive parking')
    .replace(/\s+/g, ' ')
    .trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function makeArea(feature) {
  const p = feature.properties;
  const facility = p.PTYPE === 'Street' ? 'street' : 'surface';
  const [longitude, latitude] = parkingAreaPoint(feature.geometry);
  const permits = [...permitNames[p.LOT_PERM]];
  let permitNotes = signNote;
  if (p.LOT_PERM === 'ABC' && facility === 'surface') {
    permits.push('Student Garage', 'South Campus Graduate');
    permitNotes = `Student Garage and South Campus Graduate permits also allow surface-lot C spaces. ${signNote}`;
  } else if (p.LOT_PERM === 'NPR') {
    permitNotes =
      'The campus map does not specify a standard permit for this area. Check the signs for customer-only, service, time-limit or other restrictions; this is not a promise of unrestricted parking.';
  } else if (p.LOT_PERM === 'SP') {
    permitNotes = `A location-specific special permit or authorization is required. A, B and C permits do not establish access to this area. ${signNote}`;
  } else if (p.LOT_PERM === 'FSCL') {
    permitNotes = `Restricted residential / FSCL parking. Use only the area assigned to your permit; a general Residence Hall permit does not establish access. ${signNote}`;
  } else if (p.LOT_PERM === 'VAL') {
    permitNotes = `Value permits are assigned to either the airport east gravel lot or 2550 Northwestern Avenue. Use your assigned location only. ${signNote}`;
  } else if (['M', 'GGPP'].includes(p.LOT_PERM)) {
    permitNotes = `Paid parking; follow the payment method and time limits displayed at the space. ${signNote}`;
  } else if (p.LOT_PERM === 'SCG') {
    permitNotes = `South Campus Graduate permit area on the August 2026 campus map. Follow your assigned location and current semester instructions. ${signNote}`;
  }
  const isStandard = ['A', 'AB', 'ABC'].includes(p.LOT_PERM);
  const timeRules = isStandard
    ? [
        {
          days: 'Mon-Fri',
          hours: '7:00 AM - 5:00 PM, unless posted otherwise',
          rule: signNote,
        },
      ]
    : [];
  return {
    id: `purdue-parking-${p.FID}`,
    name: readableLocation(feature),
    code: p.LOT_NUMB ? `Area ${p.LOT_NUMB}` : p.LotName || 'Parking',
    aliases: [p.LotName, p.LotDesc, p.LotMapShee, p.LOT_PERM].filter(Boolean),
    latitude,
    longitude,
    geometry: feature.geometry,
    facility_type: facility,
    is_garage: false,
    required_permits: permits,
    permit_notes: permitNotes,
    location_notes: `${facility === 'street' ? 'Marked curbside parking area' : 'Mapped parking area'}${p.LotMapShee ? ` ${p.LotMapShee}` : ''}. The outline shows the area recorded by Purdue; check individual spaces and entrances on arrival.`,
    time_rules: timeRules,
    source_url: source.source_url,
    source_label: 'Purdue campus parking map',
    verified_on: source.retrieved_on,
    source_feature_ids: [p.FID],
    source_permit_codes: [p.LOT_PERM],
    policy_urls:
      isStandard || ['SCG', 'VAL', 'FSCL', 'R', 'RG'].includes(p.LOT_PERM)
        ? [STUDENT_POLICY, STAFF_POLICY]
        : [],
  };
}

const garageDefinitions = [
  { prefix: 'PGG', code: 'PGG', id: 'lot-grant-street-garage', permits: ['A', 'Visitor/Paid'] },
  {
    prefix: 'PGH',
    code: 'PGH',
    id: 'lot-harrison-street-garage',
    permits: ['A', 'South Campus Graduate', 'Visitor/Paid'],
  },
  { prefix: 'PGNW', code: 'PGNW', id: 'lot-northwestern-garage', permits: ['A', 'Student Garage'] },
  {
    prefix: 'PGU',
    code: 'PGU',
    id: 'lot-university-street-garage',
    permits: ['A', 'Student Garage'],
  },
  {
    prefix: 'PGW',
    code: 'PGW',
    id: 'lot-wood-street-garage',
    permits: ['A', 'Student Garage', 'Hawkins'],
  },
  { prefix: 'PGMC', code: 'PGMD', id: 'lot-mccutcheon-garage', permits: ['Residence Hall'] },
];

// Exclude the city's placeholder feature and an explicit "not a lot" record.
// Purdue/PRF parking remains in scope; blank ownership fields are not interpreted
// as city parking or as evidence that ordinary campus permits grant access.
const excludedFeatures = source.features.filter(
  (f) => f.properties.Owner === 'WL' || /^(y|yes)$/i.test(f.properties.NotALot),
);
const features = source.features.filter((f) => !excludedFeatures.includes(f));
const garages = garageDefinitions.map((definition) => {
  const floors = features.filter(
    (f) => /^Garage/.test(f.properties.PTYPE) && f.properties.LotName.startsWith(definition.prefix),
  );
  const ground = floors.find((f) => f.properties.PTYPE === 'Garage1');
  if (!ground) throw new Error(`Missing official garage footprint: ${definition.code}`);
  const building = source.garage_buildings.find((b) => b.code === definition.code);
  const lot = makeArea(ground);
  let note = `Use only the spaces designated for your permit. Student Garage permits are valid only in the garage assigned to the holder. ${signNote}`;
  if (definition.code === 'PGG' || definition.code === 'PGH') {
    note =
      'Paid visitor parking or an eligible A permit with gated access. Student A, monthly A and daily A permits do not include gated access. Follow the entry system and posted restrictions.';
  }
  if (definition.code === 'PGH')
    note +=
      ' South Campus Graduate permits are assigned here for fall 2026 only; spring 2027 assignments move to Discovery Park and the lot south of Lynn Hall.';
  if (definition.code === 'PGW')
    note += ' Hawkins permits are valid only in designated Hawkins spaces.';
  if (definition.code === 'PGMD')
    note = `Residence Hall permit spaces; follow the signs for each level and reserved space. ${signNote}`;
  return {
    ...lot,
    id: definition.id,
    name: building.name,
    code: definition.code,
    address: building.address,
    aliases: [definition.code, definition.prefix, ...floors.map((f) => f.properties.LotName)],
    facility_type: 'garage',
    is_garage: true,
    required_permits: definition.permits,
    permit_notes: note,
    time_rules: [],
    location_notes:
      'Mapped garage footprint. Follow signs to the vehicle entrance; permit and payment rules can differ by level or space.',
    source_feature_ids: floors.map((f) => f.properties.FID),
    source_permit_codes: [...new Set(floors.map((f) => f.properties.LOT_PERM))],
    policy_urls: [STUDENT_POLICY, STAFF_POLICY],
  };
});

const areas = features.filter((f) => !/^Garage/.test(f.properties.PTYPE)).map(makeArea);
// The Pierce Street special-permit section is designated for Hawkins residents.
const pierce = areas.find(
  (lot) => lot.aliases.includes('PRPRC') && lot.source_permit_codes.includes('SP'),
);
if (pierce) {
  pierce.required_permits = ['Hawkins'];
  pierce.permit_notes = `Hawkins Hall permits are valid in designated Pierce Street lot spaces. Other sections of this lot have different rules. ${signNote}`;
  pierce.policy_urls = [STUDENT_POLICY];
}

// Retain distinct sections where one facility has different permits or separated
// curbside areas. The area number distinguishes them in search and the list.
const nameCounts = new Map();
for (const area of areas) nameCounts.set(area.name, (nameCounts.get(area.name) || 0) + 1);
for (const area of areas) {
  if (nameCounts.get(area.name) > 1)
    area.name += ` - ${area.code} (${area.required_permits.slice(0, 3).join('/') || 'posted rules'})`;
}
const duplicateNames = new Map();
for (const area of areas) {
  const matches = duplicateNames.get(area.name) || [];
  matches.push(area);
  duplicateNames.set(area.name, matches);
}
for (const matches of duplicateNames.values()) {
  if (matches.length > 1)
    matches.forEach((area, index) => {
      area.name += ` - section ${index + 1}`;
    });
}

export const purdueParkingLots = [...garages, ...areas];
export const parkingInventoryMetadata = Object.freeze({
  source_url: source.source_url,
  source_updated: source.source_updated,
  verified_on: source.retrieved_on,
  source_record_count: source.source_record_count,
  included_source_record_count: features.length,
  excluded_records: excludedFeatures.map((f) => ({
    id: f.properties.FID,
    reason: f.properties.Owner === 'WL' ? 'City of West Lafayette' : 'Marked not a lot',
  })),
  garage_count: garages.length,
  street_count: areas.filter((lot) => lot.facility_type === 'street').length,
  surface_count: areas.filter((lot) => lot.facility_type === 'surface').length,
  location_count: purdueParkingLots.length,
});
