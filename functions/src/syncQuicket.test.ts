import { mapQuicketEvent, syncQuicketHandler, QUICKET_CATEGORY_MAP } from './syncQuicket';
import { normaliseEvent } from './lib/normaliseEvent';
import { upsertEvent } from './lib/firestoreClient';

jest.mock('./lib/normaliseEvent');
jest.mock('./lib/firestoreClient');
jest.mock('firebase-functions/logger');

const mockNormaliseEvent = jest.mocked(normaliseEvent);
const mockUpsertEvent = jest.mocked(upsertEvent);

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const MOCK_NORMALISED = {
  id: 'quicket-jazz-in-the-park-2026-07-05',
  name: 'Jazz in the Park',
  date: '2026-07-05',
  time: '14:00',
  venue: 'Zoo Lake',
  address: 'Parkview, JHB',
  category: 'Music' as const,
  description: null,
  price: 'Free',
  ticketLink: 'https://www.quicket.co.za/events/123456',
  imageUrl: null,
  source: 'quicket' as const,
  lastUpdated: '2026-07-01T00:00:00.000Z',
};

const MOCK_QUICKET_EVENT = {
  eventId: '123456',
  name: 'Jazz in the Park',
  description: null,
  startDate: '2026-07-05T14:00:00',
  venueName: 'Zoo Lake',
  venueAddress: 'Parkview, JHB',
  categoryName: 'Music',
  imageUrl: null,
  saleUrl: 'https://www.quicket.co.za/events/123456',
  minimumTicketPrice: 0,
};

function mockApiPage(events: unknown[], totalCount: number, pageIndex: number) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: events, totalCount, pageIndex, pageSize: 100 }),
  } as Response);
}

describe('QUICKET_CATEGORY_MAP', () => {
  it('maps known synonyms to canonical categories', () => {
    expect(QUICKET_CATEGORY_MAP['Concert']).toBe('Music');
    expect(QUICKET_CATEGORY_MAP['Craft Market']).toBe('Markets');
    expect(QUICKET_CATEGORY_MAP['Stand-Up Comedy']).toBe('Comedy');
    expect(QUICKET_CATEGORY_MAP['Club Night']).toBe('Nightlife');
  });
});

describe('mapQuicketEvent', () => {
  it('maps core fields to NormalisedEvent field names', () => {
    const mapped = mapQuicketEvent(MOCK_QUICKET_EVENT);
    expect(mapped).toMatchObject({
      name: 'Jazz in the Park',
      venue: 'Zoo Lake',
      address: 'Parkview, JHB',
      category: 'Music',
      ticketLink: 'https://www.quicket.co.za/events/123456',
      imageUrl: null,
      description: null,
    });
  });

  it('splits an ISO startDate into date and time', () => {
    const mapped = mapQuicketEvent(MOCK_QUICKET_EVENT);
    expect(mapped.date).toBe('2026-07-05');
    expect(mapped.time).toBe('14:00');
  });

  it('sets date and time to null for a missing startDate', () => {
    const { startDate: _omit, ...rest } = MOCK_QUICKET_EVENT;
    const mapped = mapQuicketEvent(rest);
    expect(mapped.date).toBeNull();
    expect(mapped.time).toBeNull();
  });

  it('maps an unmapped categoryName to null', () => {
    const mapped = mapQuicketEvent({ ...MOCK_QUICKET_EVENT, categoryName: 'Unknown Genre' });
    expect(mapped.category).toBeNull();
  });

  it('maps a missing categoryName to null', () => {
    const { categoryName: _omit, ...rest } = MOCK_QUICKET_EVENT;
    const mapped = mapQuicketEvent(rest);
    expect(mapped.category).toBeNull();
  });

  it('formats a zero minimum price as "Free"', () => {
    const mapped = mapQuicketEvent({ ...MOCK_QUICKET_EVENT, minimumTicketPrice: 0 });
    expect(mapped.price).toBe('Free');
  });

  it('formats a positive minimum price as "R{n}"', () => {
    const mapped = mapQuicketEvent({ ...MOCK_QUICKET_EVENT, minimumTicketPrice: 150 });
    expect(mapped.price).toBe('R150');
  });

  it('sets price to null when minimumTicketPrice is absent', () => {
    const { minimumTicketPrice: _omit, ...rest } = MOCK_QUICKET_EVENT;
    const mapped = mapQuicketEvent(rest);
    expect(mapped.price).toBeNull();
  });
});

describe('syncQuicketHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNormaliseEvent.mockReturnValue(MOCK_NORMALISED);
    mockUpsertEvent.mockResolvedValue(undefined);
  });

  it('upserts once per valid event on a single page', async () => {
    mockApiPage([MOCK_QUICKET_EVENT, MOCK_QUICKET_EVENT], 2, 0);

    await syncQuicketHandler('test-key');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockUpsertEvent).toHaveBeenCalledTimes(2);
    expect(mockUpsertEvent).toHaveBeenCalledWith(MOCK_NORMALISED);
  });

  it('sends the api_key Authorization header', async () => {
    mockApiPage([MOCK_QUICKET_EVENT], 1, 0);

    await syncQuicketHandler('secret-123');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('api_key secret-123');
  });

  it('paginates through multiple pages until no more remain', async () => {
    // totalCount 150, pageSize 100 → page 0 hasMore, page 1 done
    mockApiPage(new Array(100).fill(MOCK_QUICKET_EVENT), 150, 0);
    mockApiPage(new Array(50).fill(MOCK_QUICKET_EVENT), 150, 1);

    await syncQuicketHandler('test-key');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockUpsertEvent).toHaveBeenCalledTimes(150);
    // second fetch requested pageIndex=1
    const [secondUrl] = mockFetch.mock.calls[1] as [string];
    expect(secondUrl).toContain('pageIndex=1');
  });

  it('skips events whose normalised result is null but processes the rest', async () => {
    mockApiPage([MOCK_QUICKET_EVENT, MOCK_QUICKET_EVENT], 2, 0);
    mockNormaliseEvent
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(MOCK_NORMALISED);

    await syncQuicketHandler('test-key');

    expect(mockUpsertEvent).toHaveBeenCalledTimes(1);
  });

  it('logs but does not throw when an upsert fails, continuing with later events', async () => {
    mockApiPage([MOCK_QUICKET_EVENT, MOCK_QUICKET_EVENT], 2, 0);
    mockUpsertEvent
      .mockRejectedValueOnce(new Error('Firestore unavailable'))
      .mockResolvedValueOnce(undefined);

    await expect(syncQuicketHandler('test-key')).resolves.toBeUndefined();
    expect(mockUpsertEvent).toHaveBeenCalledTimes(2);
  });

  it('throws when the Quicket API returns a non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    await expect(syncQuicketHandler('bad-key')).rejects.toThrow('Quicket API 401');
  });
});
