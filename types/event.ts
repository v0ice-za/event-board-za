import { CATEGORY_VALUES } from '@/constants/categories';

export type Category = typeof CATEGORY_VALUES[number];

export type EventSource = 'quicket' | 'eventbrite' | 'facebook' | 'howler';

export interface Event {
  id: string;
  name: string;
  date: string;           // ISO 8601 date string: "2026-06-14" — never Timestamp or Date object
  time: string | null;    // "19:00" or null if unknown
  venue: string;
  address: string | null;
  category: Category;
  description: string | null;
  price: string | null;   // "R150" or "Free" or null — never undefined or ""
  ticketLink: string | null;
  imageUrl: string | null;
  source: EventSource;
  lastUpdated: string;    // ISO 8601 timestamp
}
