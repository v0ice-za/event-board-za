import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import { normaliseEvent } from './lib/normaliseEvent';
import { upsertEvent } from './lib/firestoreClient';
import { parseIsoDateTime, todayIso } from './lib/dateUtils';

const QUICKET_EVENTS_URL = 'https://api.quicket.co.za/api/events';
const QUICKET_LOCATION = 'Johannesburg';
const QUICKET_PAGE_SIZE = 100;

/** Maps Quicket category strings to our canonical 8 Category values. */
export const QUICKET_CATEGORY_MAP: Record<string, string> = {
  'Music': 'Music',
  'Concert': 'Music',
  'Festival': 'Music',
  'Live Music': 'Music',
  'Gig': 'Music',
  'Market': 'Markets',
  'Markets': 'Markets',
  'Craft Market': 'Markets',
  'Food & Drink': 'Food & Drink',
  'Food and Drink': 'Food & Drink',
  'Food': 'Food & Drink',
  'Drinks': 'Food & Drink',
  'Art': 'Art & Culture',
  'Art & Culture': 'Art & Culture',
  'Arts & Culture': 'Art & Culture',
  'Exhibition': 'Art & Culture',
  'Theatre': 'Art & Culture',
  'Film': 'Art & Culture',
  'Dance': 'Art & Culture',
  'Sport': 'Sport',
  'Sports': 'Sport',
  'Fitness': 'Sport',
  'Running': 'Sport',
  'Comedy': 'Comedy',
  'Stand-Up Comedy': 'Comedy',
  'Improv': 'Comedy',
  'Family': 'Family',
  'Kids': 'Family',
  'Children': 'Family',
  'Family Fun': 'Family',
  'Nightlife': 'Nightlife',
  'Club Night': 'Nightlife',
  'Party': 'Nightlife',
  'DJ': 'Nightlife',
};

/**
 * Translates a raw Quicket API event into a common intermediate shape using
 * NormalisedEvent field names, ready to pass to `normaliseEvent`.
 * Unmapped categories become `null` so the event is later skipped.
 */
export function mapQuicketEvent(raw: unknown): Record<string, unknown> {
  const e = raw as Record<string, unknown>;

  const { date, time } = parseIsoDateTime(
    typeof e['startDate'] === 'string' ? e['startDate'] : null,
  );

  const categoryName = typeof e['categoryName'] === 'string' ? e['categoryName'] : '';
  const category = QUICKET_CATEGORY_MAP[categoryName] ?? null;

  const minPrice = typeof e['minimumTicketPrice'] === 'number' ? e['minimumTicketPrice'] : undefined;
  let price: string | null = null;
  if (minPrice === 0) price = 'Free';
  else if (minPrice !== undefined) price = `R${minPrice}`;

  return {
    name:        e['name'] ?? null,
    date,
    time,
    venue:       e['venueName'] ?? null,
    address:     e['venueAddress'] ?? null,
    category,
    description: e['description'] ?? null,
    price,
    ticketLink:  e['saleUrl'] ?? null,
    imageUrl:    e['imageUrl'] ?? null,
  };
}

/** Fetches a single page of JHB events from the Quicket REST API. */
async function fetchPage(
  apiKey: string,
  pageIndex: number,
): Promise<{ events: unknown[]; hasMore: boolean }> {
  const url = new URL(QUICKET_EVENTS_URL);
  url.searchParams.set('location', QUICKET_LOCATION);
  url.searchParams.set('startdate', todayIso());
  url.searchParams.set('pagesize', String(QUICKET_PAGE_SIZE));
  url.searchParams.set('pageIndex', String(pageIndex));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `api_key ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Quicket API ${res.status}: ${res.statusText}`);

  const data = (await res.json()) as { data?: unknown[]; totalCount?: number; pageSize?: number };
  const events = Array.isArray(data.data) ? data.data : [];
  const totalCount = typeof data.totalCount === 'number' ? data.totalCount : 0;
  const pageSize = typeof data.pageSize === 'number' ? data.pageSize : QUICKET_PAGE_SIZE;
  return { events, hasMore: (pageIndex + 1) * pageSize < totalCount };
}

/**
 * Core sync logic: paginate Quicket, normalise each event, upsert to Firestore.
 * Takes `apiKey` as a parameter so it is testable without the Functions runtime.
 */
export async function syncQuicketHandler(apiKey: string): Promise<void> {
  const startTime = new Date().toISOString();
  logger.info('syncQuicket started', { startTime });

  let pageIndex = 0;
  let totalFetched = 0;
  let totalWritten = 0;

  while (true) {
    const { events, hasMore } = await fetchPage(apiKey, pageIndex);
    totalFetched += events.length;

    for (const raw of events) {
      const mapped = mapQuicketEvent(raw);
      const normalised = normaliseEvent(mapped, 'quicket');

      if (!normalised) {
        logger.warn('syncQuicket: skipped (normalise returned null)', { raw });
        continue;
      }

      try {
        await upsertEvent(normalised);
        totalWritten++;
      } catch (err) {
        logger.error('syncQuicket: upsert failed', { id: normalised.id, err });
      }
    }

    if (!hasMore) break;
    pageIndex++;
  }

  logger.info('syncQuicket completed', { startTime, totalFetched, totalWritten });
}

const quicketApiKey = defineSecret('QUICKET_API_KEY');

export const syncQuicket = onSchedule(
  {
    schedule: 'every 4 hours',
    timeZone: 'Africa/Johannesburg',
    secrets: [quicketApiKey],
  },
  async () => syncQuicketHandler(quicketApiKey.value()),
);
