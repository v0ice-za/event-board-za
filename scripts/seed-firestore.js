// One-time seed script — run with: node scripts/seed-firestore.js
// Requires: scripts/service-account.json (NOT committed — download from Firebase Console)
// Installs: npm install --save-dev firebase-admin
const admin = require('firebase-admin');

let serviceAccount;
try {
  serviceAccount = require('./service-account.json');
} catch {
  console.error('ERROR: scripts/service-account.json not found.');
  console.error('Download it from Firebase Console → Project Settings → Service Accounts → Generate new private key');
  console.error('Save it as scripts/service-account.json (it is gitignored and must not be committed).');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const now = new Date();
// All dates must be future (≥ today+1 day)
const future = (daysAhead, timeStr = null) => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysAhead);
  const iso = d.toISOString().split('T')[0]; // "2026-06-XX"
  return { date: iso, time: timeStr };
};

const events = [
  // Music (4 events)
  {
    id: 'seed-jazz-in-the-park-2026-06-07',
    name: 'Jazz in the Park',
    ...future(10, '18:00'),
    venue: 'Delta Park',
    address: 'Delta Park, Blairgowrie, Johannesburg',
    category: 'Music',
    description: 'Monthly jazz evening under the stars featuring local and international artists.',
    price: 'R180',
    ticketLink: 'https://www.quicket.co.za/events/jazz-in-the-park',
    imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
    source: 'quicket',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-open-mic-braamfontein-2026-06-12',
    name: 'Open Mic Night — Braamfontein',
    ...future(15, '20:00'),
    venue: 'Kitcheners Carvery Bar',
    address: '40 De Korte St, Braamfontein, Johannesburg',
    category: 'Music',
    description: null,
    price: 'Free',
    ticketLink: null,
    imageUrl: null,
    source: 'facebook',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-joburg-symphony-2026-06-21',
    name: 'Johannesburg Symphony Orchestra',
    ...future(24),
    venue: 'Linder Auditorium',
    address: 'Linder Auditorium, Parktown, Johannesburg',
    category: 'Music',
    description: 'Classic programme featuring Beethoven and Brahms.',
    price: 'R350',
    ticketLink: 'https://www.ticketmaster.co.za/jso',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800',
    source: 'eventbrite',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-afrobeats-night-2026-07-04',
    name: 'Afrobeats Night',
    ...future(37, '21:00'),
    venue: 'Maboneng Precinct',
    address: '27 Fox Street, Maboneng, Johannesburg',
    category: 'Music',
    description: null,
    price: 'R120',
    ticketLink: 'https://www.quicket.co.za/events/afrobeats-night',
    imageUrl: null,
    source: 'quicket',
    lastUpdated: now.toISOString(),
  },

  // Markets (3 events)
  {
    id: 'seed-market-on-main-2026-06-07',
    name: 'Market on Main',
    ...future(10, '09:00'),
    venue: 'Maboneng Precinct',
    address: '264 Fox Street, Maboneng, Johannesburg',
    category: 'Markets',
    description: 'Weekly artisan food and design market in the heart of Maboneng.',
    price: 'Free',
    ticketLink: null,
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
    source: 'facebook',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-leafy-greens-market-2026-06-14',
    name: 'Leafy Greens Market',
    ...future(17, '08:00'),
    venue: 'Emmarentia Dam',
    address: 'Emmarentia Dam, Johannesburg',
    category: 'Markets',
    description: 'Organic produce, artisan bakes, and handmade crafts.',
    price: 'Free',
    ticketLink: null,
    imageUrl: null,
    source: 'facebook',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-moyo-craft-market-2026-07-12',
    name: 'Moyo Craft Market',
    ...future(45, '10:00'),
    venue: 'Zoo Lake',
    address: 'Zoo Lake, Parkview, Johannesburg',
    category: 'Markets',
    description: null,
    price: 'R50',
    ticketLink: null,
    imageUrl: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
    source: 'eventbrite',
    lastUpdated: now.toISOString(),
  },

  // Food & Drink (3 events)
  {
    id: 'seed-taste-of-joburg-2026-06-20',
    name: 'Taste of Joburg',
    ...future(23, '11:00'),
    venue: 'Sandton Central',
    address: 'Sandton Central, Johannesburg',
    category: 'Food & Drink',
    description: 'Annual food festival celebrating the best of Johannesburg cuisine.',
    price: 'R200',
    ticketLink: 'https://www.quicket.co.za/events/taste-of-joburg',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    source: 'quicket',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-wine-pairing-rosebank-2026-06-25',
    name: 'Wine Pairing Evening',
    ...future(28, '19:00'),
    venue: 'The Rosebank Hotel',
    address: '9 Tyrwhitt Ave, Rosebank, Johannesburg',
    category: 'Food & Drink',
    description: null,
    price: 'R450',
    ticketLink: 'https://www.eventbrite.com/wine-rosebank',
    imageUrl: null,
    source: 'eventbrite',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-street-food-thursdays-2026-07-02',
    name: 'Street Food Thursdays',
    ...future(35, '17:00'),
    venue: 'Vilakazi Street',
    address: 'Vilakazi Street, Soweto, Johannesburg',
    category: 'Food & Drink',
    description: 'Weekly gathering of Soweto street food vendors.',
    price: 'Free',
    ticketLink: null,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    source: 'facebook',
    lastUpdated: now.toISOString(),
  },

  // Art & Culture (3 events)
  {
    id: 'seed-joburg-art-fair-2026-06-13',
    name: 'Joburg Art Fair',
    ...future(16, '10:00'),
    venue: 'Sandton Convention Centre',
    address: 'Maude St, Sandton, Johannesburg',
    category: 'Art & Culture',
    description: "Africa's premier contemporary art fair showcasing over 50 galleries.",
    price: 'R250',
    ticketLink: 'https://www.joburgart.com',
    imageUrl: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800',
    source: 'quicket',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-genesis-gallery-opening-2026-06-19',
    name: 'Genesis Gallery Opening',
    ...future(22, '18:30'),
    venue: 'Genesis Gallery',
    address: '44 Stanley Ave, Milpark, Johannesburg',
    category: 'Art & Culture',
    description: null,
    price: 'Free',
    ticketLink: null,
    imageUrl: null,
    source: 'facebook',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-origins-museum-exhibition-2026-08-01',
    name: 'Origins: Human Evolution Exhibition',
    ...future(65),
    venue: 'Origins Centre',
    address: 'Yale Rd, Braamfontein, Johannesburg',
    category: 'Art & Culture',
    description: 'Permanent exhibition exploring the origins of humankind in Southern Africa.',
    price: 'R100',
    ticketLink: null,
    imageUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800',
    source: 'eventbrite',
    lastUpdated: now.toISOString(),
  },

  // Sport (3 events)
  {
    id: 'seed-joburg-10k-2026-06-22',
    name: 'Joburg 10K City Run',
    ...future(25, '07:00'),
    venue: 'Mandela Bridge',
    address: 'Mandela Bridge, Braamfontein, Johannesburg',
    category: 'Sport',
    description: 'Annual 10km road race through the heart of Johannesburg.',
    price: 'R150',
    ticketLink: 'https://www.quicket.co.za/events/joburg-10k',
    imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800',
    source: 'quicket',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-lions-rugby-2026-07-05',
    name: 'Lions vs Sharks — URC',
    ...future(38, '15:00'),
    venue: 'Emirates Airline Park',
    address: 'Ellis Park, Doornfontein, Johannesburg',
    category: 'Sport',
    description: null,
    price: null,
    ticketLink: 'https://www.ticketmaster.co.za/lions',
    imageUrl: null,
    source: 'eventbrite',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-polo-in-the-park-2026-09-06',
    name: 'Polo in the Park',
    ...future(101, '11:00'),
    venue: 'Johannesburg Polo Club',
    address: '1 Club Rd, Inanda, Johannesburg',
    category: 'Sport',
    description: 'An afternoon of polo with a fashion component and champagne bar.',
    price: 'R350',
    ticketLink: 'https://www.quicket.co.za/events/polo-in-the-park',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    source: 'quicket',
    lastUpdated: now.toISOString(),
  },

  // Comedy (2 events)
  {
    id: 'seed-comedy-central-2026-06-28',
    name: 'Comedy Central Live',
    ...future(31, '20:00'),
    venue: 'Teatro at Montecasino',
    address: 'Montecasino, Fourways, Johannesburg',
    category: 'Comedy',
    description: "Line-up of SA's top stand-up comedians in an evening of laughs.",
    price: 'R280',
    ticketLink: 'https://www.ticketmaster.co.za/comedy-central',
    imageUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800',
    source: 'eventbrite',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-open-mic-comedy-2026-07-09',
    name: 'Open Mic Comedy Night',
    ...future(42, '19:30'),
    venue: 'The Orbit Jazz Club',
    address: '81 De Korte St, Braamfontein, Johannesburg',
    category: 'Comedy',
    description: null,
    price: 'R80',
    ticketLink: null,
    imageUrl: null,
    source: 'facebook',
    lastUpdated: now.toISOString(),
  },

  // Family (3 events)
  {
    id: 'seed-joburg-zoo-family-day-2026-06-28',
    name: 'Joburg Zoo Family Day',
    ...future(31, '09:00'),
    venue: 'Johannesburg Zoo',
    address: 'Hermann Eckstein Park, Parkview, Johannesburg',
    category: 'Family',
    description: 'Special guided tours, animal feeding, and educational activities for kids.',
    price: 'R120',
    ticketLink: null,
    imageUrl: 'https://images.unsplash.com/photo-1534567200603-3fa06e22d6da?w=800',
    source: 'eventbrite',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-science-centre-workshop-2026-07-06',
    name: 'Kids Science Workshop',
    ...future(39, '10:00'),
    venue: 'Sci-Bono Discovery Centre',
    address: 'Corner Miriam Makeba & Helen Joseph St, Newtown',
    category: 'Family',
    description: null,
    price: 'R95',
    ticketLink: 'https://www.quicket.co.za/events/sci-bono-workshop',
    imageUrl: null,
    source: 'quicket',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-gauteng-library-storytime-2026-06-14',
    name: 'Saturday Storytime',
    ...future(17, '10:30'),
    venue: 'Johannesburg Public Library',
    address: 'Market St, Johannesburg CBD',
    category: 'Family',
    description: 'Free weekly read-aloud session for children aged 3–8.',
    price: 'Free',
    ticketLink: null,
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
    source: 'facebook',
    lastUpdated: now.toISOString(),
  },

  // Nightlife (4 events)
  {
    id: 'seed-basha-uhuru-2026-06-14',
    name: 'Basha Uhuru Freedom Festival',
    ...future(17, '12:00'),
    venue: 'Soweto Theatre',
    address: 'Cnr Bolani Rd & Kikuyu Ave, Jabulani, Soweto',
    category: 'Nightlife',
    description: 'Annual festival of culture, music, and art celebrating freedom and creativity.',
    price: 'R100',
    ticketLink: 'https://www.quicket.co.za/events/basha-uhuru',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    source: 'quicket',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-parkhurst-night-market-2026-06-20',
    name: 'Parkhurst Night Market',
    ...future(23, '18:00'),
    venue: '4th Avenue, Parkhurst',
    address: '4th Avenue, Parkhurst, Johannesburg',
    category: 'Nightlife',
    description: null,
    price: 'Free',
    ticketLink: null,
    imageUrl: null,
    source: 'facebook',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-rooftop-sessions-2026-07-11',
    name: 'Rooftop Sessions JHB',
    ...future(44, '17:00'),
    venue: 'The Cosmopolitan',
    address: '33 Eloff St, Johannesburg CBD',
    category: 'Nightlife',
    description: 'Sundowner DJ sets with panoramic Joburg skyline views.',
    price: 'R150',
    ticketLink: 'https://www.eventbrite.com/rooftop-sessions-jhb',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    source: 'eventbrite',
    lastUpdated: now.toISOString(),
  },
  {
    id: 'seed-house-music-4am-2026-08-08',
    name: '4AM Sessions',
    ...future(72, '22:00'),
    venue: 'Truth JHB',
    address: '85 Commissioner St, Johannesburg CBD',
    category: 'Nightlife',
    description: null,
    price: 'R200',
    ticketLink: 'https://www.quicket.co.za/events/4am-sessions',
    imageUrl: null,
    source: 'quicket',
    lastUpdated: now.toISOString(),
  },
];

async function seed() {
  console.log(`Seeding ${events.length} events to Firestore...`);
  const batch = db.batch();

  for (const event of events) {
    const { id, ...data } = event;
    const ref = db.collection('events').doc(id);
    batch.set(ref, data);
  }

  await batch.commit();
  console.log(`✅ Seeded ${events.length} events successfully.`);
  console.log('Verify at: https://console.firebase.google.com → Firestore → events collection');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
