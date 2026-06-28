import { AppState } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { useEvents } from '@/hooks/useEvents';
import { useNetworkState } from '@/hooks/useNetworkState';
import { logCategoryFilter, logScreenView } from '@/lib/analytics';
import type { Event } from '@/types';

import FeedScreen from './index';

// --- Mocks -------------------------------------------------------------------

jest.mock('@/hooks/useEvents', () => ({ useEvents: jest.fn() }));
jest.mock('@/hooks/useNetworkState', () => ({ useNetworkState: jest.fn() }));
jest.mock('@/lib/analytics', () => ({
  logScreenView: jest.fn(),
  logCategoryFilter: jest.fn(),
}));

// Mock the native AdMob SDK (not the component) so the real AdBannerUnit renders its
// testID-bearing slot without pulling in native code. BannerAd renders nothing, so the
// slot stays at zero height — exactly its pre-load state.
jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: () => null,
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER', BANNER: 'BANNER' },
  TestIds: { BANNER: 'test-banner-id' },
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  // useRouter for the screen; useFocusEffect for the nested ChipsRow.
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (cb: () => void) => cb(),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

// The screen consumes only the inset hook (no <SafeAreaView>), so mock just the hook —
// no provider needed and NativeWind's safe-area cssInterop is never engaged.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const renderScreen = () => render(<FeedScreen />);

const mockedUseEvents = useEvents as jest.Mock;
const mockedUseNetwork = useNetworkState as jest.Mock;

// --- Fixtures ----------------------------------------------------------------

const makeEvent = (id: string, name: string, category: Event['category'] = 'Music'): Event => ({
  id,
  name,
  date: '2026-06-30',
  time: '19:00',
  venue: 'Emmarentia Dam',
  address: null,
  category,
  description: null,
  price: null,
  ticketLink: null,
  imageUrl: null,
  source: 'quicket',
  lastUpdated: '2026-06-01T00:00:00.000Z',
});

const refetch = jest.fn();

const setEvents = (over: Partial<ReturnType<typeof base>> = {}) =>
  mockedUseEvents.mockReturnValue({ ...base(), ...over });

const base = () => ({ events: [] as Event[], isLoading: false, isError: false, refetch });

beforeEach(() => {
  jest.clearAllMocks();
  setEvents();
  mockedUseNetwork.mockReturnValue({ isConnected: true });
});

// --- Tests -------------------------------------------------------------------

describe('FeedScreen', () => {
  it('(a) cold load renders the chips skeleton and exactly 3 skeleton cards', () => {
    setEvents({ isLoading: true });
    renderScreen();

    expect(screen.queryByLabelText('Loading filters')).not.toBeNull();
    expect(screen.getAllByLabelText('Loading events')).toHaveLength(3);
    // Interactive ChipsRow is not mounted during the cold load.
    expect(screen.queryByText('All')).toBeNull();
  });

  it('(b) renders one card per event and navigates to detail on card tap', () => {
    setEvents({ events: [makeEvent('e1', 'Jazz on the Lake'), makeEvent('e2', 'Indie Night')] });
    renderScreen();

    expect(screen.queryByText('Jazz on the Lake')).not.toBeNull();
    expect(screen.queryByText('Indie Night')).not.toBeNull();

    fireEvent.press(screen.getByLabelText(/Jazz on the Lake/));
    expect(mockPush).toHaveBeenCalledWith('/event/e1');
  });

  it('(c) selecting a chip filters by category and re-selecting it resets to all', () => {
    renderScreen();

    fireEvent.press(screen.getByText('Music'));
    expect(mockedUseEvents.mock.calls.at(-1)?.[0]).toBe('Music');

    fireEvent.press(screen.getByText('Music'));
    expect(mockedUseEvents.mock.calls.at(-1)?.[0]).toBeNull();
  });

  it('(l) logs the Feed screen view once on mount', () => {
    renderScreen();
    expect(logScreenView).toHaveBeenCalledTimes(1);
    expect(logScreenView).toHaveBeenCalledWith('Feed');
  });

  it('(m) logs category_filter on a real category tap but not on the toggle-off reset', () => {
    renderScreen();

    fireEvent.press(screen.getByText('Music'));
    expect(logCategoryFilter).toHaveBeenCalledTimes(1);
    expect(logCategoryFilter).toHaveBeenCalledWith('Music');

    // Re-tapping the active chip toggles back to All → no new analytics event.
    fireEvent.press(screen.getByText('Music'));
    expect(logCategoryFilter).toHaveBeenCalledTimes(1);
  });

  it('(d) empty-category shows the category heading and its action clears the filter', () => {
    renderScreen();

    // Activate a category → feed is empty for it.
    fireEvent.press(screen.getByText('Comedy'));
    expect(screen.queryByText('No Comedy events right now')).not.toBeNull();

    // "Clear filter" resets to All → generic empty heading.
    fireEvent.press(screen.getByText('Clear filter'));
    expect(screen.queryByText('No events right now')).not.toBeNull();
  });

  it('(e) general-error renders when error + empty + online and Retry calls refetch', () => {
    setEvents({ isError: true });
    renderScreen();

    expect(screen.queryByText('Something went wrong')).not.toBeNull();
    fireEvent.press(screen.getByText('Retry'));
    expect(refetch).toHaveBeenCalled();
  });

  it('(f) no-connection renders when offline + empty', () => {
    mockedUseNetwork.mockReturnValue({ isConnected: false });
    renderScreen();

    expect(screen.queryByText('No connection')).not.toBeNull();
  });

  it('(g) OfflineBanner shows when offline with cached events present', () => {
    mockedUseNetwork.mockReturnValue({ isConnected: false });
    setEvents({ events: [makeEvent('e1', 'Cached Gig')] });
    renderScreen();

    expect(screen.queryByText(/showing saved events/)).not.toBeNull();
    expect(screen.queryByText('Cached Gig')).not.toBeNull();
  });

  it('(h) seeds an ad slot after the 6th card only when more cards follow (trailing guard)', () => {
    // 5 events → no ad slot (proves the slot is not at index 0 or on a `% 5` cadence).
    setEvents({ events: Array.from({ length: 5 }, (_, i) => makeEvent(`e${i}`, `Event ${i}`)) });
    const view = renderScreen();
    expect(screen.queryAllByTestId('feed-ad-slot')).toHaveLength(0);

    // 6 events → still no ad slot: the only candidate (after the 6th) would be the final
    // row, which the trailing guard (index + 1 < events.length) suppresses.
    setEvents({ events: Array.from({ length: 6 }, (_, i) => makeEvent(`e${i}`, `Event ${i}`)) });
    view.rerender(<FeedScreen />);
    expect(screen.queryAllByTestId('feed-ad-slot')).toHaveLength(0);

    // 7 events → exactly one ad slot after the 6th card (a 7th card follows it).
    setEvents({ events: Array.from({ length: 7 }, (_, i) => makeEvent(`e${i}`, `Event ${i}`)) });
    view.rerender(<FeedScreen />);
    expect(screen.queryAllByTestId('feed-ad-slot')).toHaveLength(1);
  });

  it('(j) re-renders the correct body as state transitions', () => {
    // error + empty + online → general-error
    setEvents({ isError: true });
    const view = renderScreen();
    expect(screen.queryByText('Something went wrong')).not.toBeNull();

    // error clears + events arrive → list shows, error gone
    setEvents({ events: [makeEvent('e1', 'Recovered Gig')] });
    view.rerender(<FeedScreen />);
    expect(screen.queryByText('Something went wrong')).toBeNull();
    expect(screen.queryByText('Recovered Gig')).not.toBeNull();

    // connection drops with no cache → no-connection
    mockedUseNetwork.mockReturnValue({ isConnected: false });
    setEvents({ events: [] });
    view.rerender(<FeedScreen />);
    expect(screen.queryByText('No connection')).not.toBeNull();
  });

  it('(k) per-category cold load keeps ChipsRow mounted and skeletons only the list', () => {
    // Loaded for "All"; still cold (loading) for any specific category.
    mockedUseEvents.mockImplementation((cat: unknown) =>
      cat === null
        ? { events: [makeEvent('e1', 'Gig')], isLoading: false, isError: false, refetch }
        : { events: [] as Event[], isLoading: true, isError: false, refetch },
    );
    renderScreen();

    // "All" cold load is done → interactive ChipsRow is mounted (no chips skeleton).
    expect(screen.queryByText('All')).not.toBeNull();

    // Tap a category whose feed is still cold-loading.
    fireEvent.press(screen.getByText('Music'));

    // ChipsRow stays mounted (chip anchor preserved); list region shows 3 skeletons;
    // the full-screen chips skeleton does NOT appear.
    expect(screen.queryByText('All')).not.toBeNull();
    expect(screen.getAllByLabelText('Loading events')).toHaveLength(3);
    expect(screen.queryByLabelText('Loading filters')).toBeNull();
  });

  it('(i) returning to the foreground triggers a soft refresh', () => {
    const addSpy = jest.spyOn(AppState, 'addEventListener');
    setEvents({ events: [makeEvent('e1', 'Gig')] });
    renderScreen();

    const handler = addSpy.mock.calls[0]?.[1] as (s: string) => void;
    expect(handler).toBeDefined();

    // Simulate background → active so the prev-state guard passes.
    handler('background');
    refetch.mockClear();
    handler('active');

    expect(refetch).toHaveBeenCalledTimes(1);
    addSpy.mockRestore();
  });
});
