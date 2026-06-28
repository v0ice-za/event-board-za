// Web stub for @react-native-firebase/firestore
// Returns seed data so the app is usable in a browser (expo start --web) for UI testing.
// This stub is only loaded when Metro bundles for web (see metro.config.js resolveRequest).

const SEED_EVENTS = [
  {
    id: 'seed-1',
    name: 'Jazz on the Lake',
    date: '2026-07-05',
    time: '18:00',
    venue: 'Emmarentia Dam',
    address: 'Emmarentia, Johannesburg',
    category: 'Music',
    description: 'An evening of smooth jazz beside the dam. Bring a blanket and enjoy local artists under the stars.',
    price: 'R120',
    ticketLink: 'https://quicket.co.za',
    imageUrl: null,
    source: 'quicket',
    lastUpdated: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'seed-2',
    name: 'Neighbourgoods Market',
    date: '2026-07-05',
    time: '09:00',
    venue: 'Neighbourgoods Market',
    address: '73 Juta St, Braamfontein',
    category: 'Markets',
    description: 'Joburg\'s favourite weekend market — artisan food, coffee, craft and live music every Saturday.',
    price: 'Free',
    ticketLink: null,
    imageUrl: null,
    source: 'eventbrite',
    lastUpdated: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'seed-3',
    name: 'Braai & Craft Beer Festival',
    date: '2026-07-12',
    time: '12:00',
    venue: 'The Sheds @ 1Fox',
    address: '1 Fox St, Ferreiras Dorp, Johannesburg',
    category: 'Food & Drink',
    description: 'South Africa\'s best craft breweries meet the country\'s greatest cooking tradition. Free entry, pay per tasting.',
    price: 'Free',
    ticketLink: 'https://quicket.co.za',
    imageUrl: null,
    source: 'quicket',
    lastUpdated: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'seed-4',
    name: 'Wits Art Museum: New Acquisitions',
    date: '2026-07-08',
    time: null,
    venue: 'Wits Art Museum',
    address: 'Corner Bertha & Jorissen St, Braamfontein',
    category: 'Art & Culture',
    description: 'A showcase of recently acquired works spanning sculpture, painting and digital media from emerging South African artists.',
    price: 'R50',
    ticketLink: 'https://wam.wits.ac.za',
    imageUrl: null,
    source: 'eventbrite',
    lastUpdated: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'seed-5',
    name: 'Orlando Pirates vs Kaizer Chiefs',
    date: '2026-07-19',
    time: '15:00',
    venue: 'FNB Stadium',
    address: 'Soccer City Ave, Nasrec, Johannesburg',
    category: 'Sport',
    description: 'The Soweto Derby — one of the biggest fixtures in African football. Expect a packed stadium and an electric atmosphere.',
    price: 'R180',
    ticketLink: 'https://ticketpros.co.za',
    imageUrl: null,
    source: 'quicket',
    lastUpdated: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'seed-6',
    name: 'Loyiso Gola: Live in Joburg',
    date: '2026-07-25',
    time: '20:00',
    venue: 'Teatro at Montecasino',
    address: 'William Nicol Dr, Fourways',
    category: 'Comedy',
    description: 'South Africa\'s award-winning comedian returns to Joburg for one night only. Rated 18+.',
    price: 'R250',
    ticketLink: 'https://ticketmaster.co.za',
    imageUrl: null,
    source: 'eventbrite',
    lastUpdated: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'seed-7',
    name: 'Science Day at Sci-Bono',
    date: '2026-07-16',
    time: '10:00',
    venue: 'Sci-Bono Discovery Centre',
    address: 'Corner Helen Joseph & President St, Newtown',
    category: 'Family',
    description: 'Interactive science experiments, live shows and hands-on exhibits for kids of all ages. Free for children under 3.',
    price: 'R80',
    ticketLink: 'https://sci-bono.co.za',
    imageUrl: null,
    source: 'eventbrite',
    lastUpdated: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'seed-8',
    name: 'Afro House Sessions',
    date: '2026-07-11',
    time: '22:00',
    venue: 'Truth Nightclub',
    address: '24 Pine St, New Doornfontein',
    category: 'Nightlife',
    description: 'The finest Afro house DJs from Cape Town and Joburg battle it out on an industry-grade soundsystem. Doors open 10pm.',
    price: 'R200',
    ticketLink: 'https://quicket.co.za',
    imageUrl: null,
    source: 'quicket',
    lastUpdated: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'seed-9',
    name: 'Sunday Jazz in the Park',
    date: '2026-08-02',
    time: '14:00',
    venue: 'Zoo Lake',
    address: 'Parkview, Johannesburg',
    category: 'Music',
    description: 'Free outdoor jazz sessions every first Sunday. Family-friendly. Bring your own picnic.',
    price: 'Free',
    ticketLink: null,
    imageUrl: null,
    source: 'facebook',
    lastUpdated: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'seed-10',
    name: 'Maboneng Night Market',
    date: '2026-07-18',
    time: '17:00',
    venue: 'Arts on Main',
    address: '264 Fox St, Maboneng',
    category: 'Markets',
    description: 'Street food, local designers, vintage finds and live performances in Joburg\'s creative precinct.',
    price: 'Free',
    ticketLink: null,
    imageUrl: null,
    source: 'facebook',
    lastUpdated: '2026-06-01T00:00:00.000Z',
  },
];

// Build a lookup map for getDoc
const EVENT_BY_ID = Object.fromEntries(SEED_EVENTS.map((e) => [e.id, e]));

// --- Constraint helpers ---

function applyConstraints(events, constraints) {
  let result = [...events];
  let sortField = 'date';
  let sortDir = 'asc';

  for (const c of constraints) {
    if (c.type === 'where') {
      result = result.filter((e) => {
        const val = e[c.field];
        if (c.op === '>=') return val >= c.value;
        if (c.op === '==') return val === c.value;
        if (c.op === '<=') return val <= c.value;
        if (c.op === '>') return val > c.value;
        if (c.op === '<') return val < c.value;
        return true;
      });
    } else if (c.type === 'orderBy') {
      sortField = c.field;
      sortDir = c.dir;
    } else if (c.type === 'limit') {
      // Applied after sort below
    }
  }

  result.sort((a, b) => {
    const av = a[sortField] ?? '';
    const bv = b[sortField] ?? '';
    return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : av > bv ? -1 : av < bv ? 1 : 0;
  });

  const limitC = constraints.find((c) => c.type === 'limit');
  if (limitC) result = result.slice(0, limitC.n);

  return result;
}

// --- Public API matching @react-native-firebase/firestore v24 modular ---

function getFirestore() {
  return { __stub: true };
}

function collection(db, path) {
  return { __collection: path };
}

function doc(db, path, id) {
  return { __collection: path, __id: id };
}

function where(field, op, value) {
  return { type: 'where', field, op, value };
}

function orderBy(field, dir = 'asc') {
  return { type: 'orderBy', field, dir };
}

function limit(n) {
  return { type: 'limit', n };
}

function query(collRef, ...constraints) {
  return { __collection: collRef.__collection, __constraints: constraints };
}

async function getDocs(q) {
  const matched = applyConstraints(SEED_EVENTS, q.__constraints || []);
  return {
    docs: matched.map((e) => ({
      id: e.id,
      data: () => {
        const { id: _id, ...rest } = e;
        return rest;
      },
      exists: () => true,
    })),
  };
}

async function getDoc(ref) {
  const event = EVENT_BY_ID[ref.__id];
  if (!event) {
    return { exists: () => false, data: () => undefined, id: ref.__id };
  }
  const { id: _id, ...rest } = event;
  return {
    exists: () => true,
    data: () => rest,
    id: ref.__id,
  };
}

module.exports = { getFirestore, collection, doc, where, orderBy, limit, query, getDocs, getDoc };
