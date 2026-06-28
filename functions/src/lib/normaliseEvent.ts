import type { NormalisedEvent, EventSource, Category } from './types';
import { CATEGORY_VALUES } from './types';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getString(obj: unknown, key: string): string | null {
  if (typeof obj !== 'object' || obj === null) return null;
  const val = (obj as Record<string, unknown>)[key];
  if (typeof val === 'string' && val.trim() !== '') return val.trim();
  return null;
}

export function normaliseEvent(raw: unknown, source: EventSource): NormalisedEvent | null {
  const name  = getString(raw, 'name');
  const date  = getString(raw, 'date');
  const venue = getString(raw, 'venue');

  if (!name || !date || !venue) return null;

  const isoDateMatch = date.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!isoDateMatch) return null;
  const isoDate = isoDateMatch[1];
  if (isNaN(new Date(isoDate).getTime())) return null;

  const rawCategory = getString(raw, 'category');
  if (!rawCategory || !(CATEGORY_VALUES as readonly string[]).includes(rawCategory)) return null;
  const category = rawCategory as Category;

  return {
    id:          `${source}-${slugify(name)}-${isoDate}`,
    name,
    date:        isoDate,
    time:        getString(raw, 'time'),
    venue,
    address:     getString(raw, 'address'),
    category,
    description: getString(raw, 'description'),
    price:       getString(raw, 'price'),
    ticketLink:  getString(raw, 'ticketLink'),
    imageUrl:    getString(raw, 'imageUrl'),
    source,
    lastUpdated: new Date().toISOString(),
  };
}
