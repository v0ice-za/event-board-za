import { fireEvent, render, screen } from '@testing-library/react-native';

import { useEventDetail } from '@/hooks/useEventDetail';
import { logScreenView, logTicketLinkTapped } from '@/lib/analytics';
import { InterstitialContext } from '@/lib/interstitial';
import { eventKeys } from '@/lib/queryKeys';
import type { Event } from '@/types';

import EventDetailScreen from './[id]';

// --- Mocks -------------------------------------------------------------------

jest.mock('@/hooks/useEventDetail', () => ({ useEventDetail: jest.fn() }));
jest.mock('@/lib/analytics', () => ({
  logScreenView: jest.fn(),
  logTicketLinkTapped: jest.fn(),
}));

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'e1' }),
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

// Privacy-policy URL is read from Constants.expoConfig.extra. A mutable mock value lets
// individual tests toggle between a configured URL and the empty (unhosted) case. The
// `mock` prefix is required for jest.mock factories to reference an outer variable.
let mockPrivacyUrl = 'https://example.com/privacy';
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { privacyPolicyUrl: mockPrivacyUrl } };
    },
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Stub exposes url via accessibilityLabel so the test can assert the correct url
// was passed without pulling in react-native-webview (a native module).
jest.mock('@/components/WebViewModal', () => {
  // jest.mock factories cannot reference out-of-scope variables, so require() is the only option.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    WebViewModal: ({ url }: { url: string; onClose: () => void }) => (
      <View testID="webview-modal" accessibilityLabel={url} />
    ),
  };
});

const mockInvalidate = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));

const renderScreen = () => render(<EventDetailScreen />);

const mockedUseEventDetail = useEventDetail as jest.Mock;

// --- Fixtures ----------------------------------------------------------------

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 'e1',
  name: 'Jazz on the Lake',
  date: '2026-05-30',
  time: '19:00',
  venue: 'Emmarentia Dam',
  address: '15 Emmarentia Ave, Johannesburg',
  category: 'Music',
  description: 'An evening of smooth jazz outdoors.',
  price: 'R150',
  ticketLink: 'https://quicket.co.za/events/e1',
  imageUrl: 'https://example.com/img.jpg',
  source: 'quicket',
  lastUpdated: '2026-05-01T00:00:00.000Z',
  ...overrides,
});

const setHook = (overrides: Partial<ReturnType<typeof baseHook>> = {}) =>
  mockedUseEventDetail.mockReturnValue({ ...baseHook(), ...overrides });

const baseHook = () => ({
  event: null as Event | null,
  isLoading: false,
  isError: false,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockPrivacyUrl = 'https://example.com/privacy';
  setHook({ event: makeEvent() });
});

// --- Tests -------------------------------------------------------------------

describe('EventDetailScreen', () => {
  it('(a) loading renders the skeleton with accessible label and no body content', () => {
    setHook({ isLoading: true, event: null });
    renderScreen();

    expect(screen.getByLabelText('Loading event')).toBeTruthy();
    expect(screen.queryByText('Jazz on the Lake')).toBeNull();
  });

  it('(b) loaded renders name, category, date+time, venue, address, price, description', () => {
    renderScreen();

    expect(screen.getByText('Jazz on the Lake')).toBeTruthy();
    expect(screen.getByText('Music')).toBeTruthy();
    expect(screen.getByText('Sat 30 May · 19:00')).toBeTruthy();
    expect(screen.getByText('Emmarentia Dam')).toBeTruthy();
    expect(screen.getByText('15 Emmarentia Ave, Johannesburg')).toBeTruthy();
    expect(screen.getByText('R150')).toBeTruthy();
    expect(screen.getByText('An evening of smooth jazz outdoors.')).toBeTruthy();
  });

  it('(c) null address, price, and description are omitted — no "N/A" or blank', () => {
    setHook({ event: makeEvent({ address: null, price: null, description: null }) });
    renderScreen();

    expect(screen.queryByText('N/A')).toBeNull();
    // Venue is always present; address absent means only one location line.
    expect(screen.getByText('Emmarentia Dam')).toBeTruthy();
    expect(screen.queryByText('15 Emmarentia Ave, Johannesburg')).toBeNull();
    expect(screen.queryByText('R150')).toBeNull();
    expect(screen.queryByText('An evening of smooth jazz outdoors.')).toBeNull();
  });

  it('(d) null imageUrl shows the CategoryPlaceholder emoji fallback', () => {
    setHook({ event: makeEvent({ imageUrl: null }) });
    renderScreen();

    // CategoryPlaceholder renders the Music emoji from CATEGORY_PLACEHOLDERS.
    expect(screen.getByText('🎵')).toBeTruthy();
  });

  it('(e) ticketLink present — CTA renders; pressing it mounts WebViewModal with the url', () => {
    renderScreen();

    expect(screen.getByLabelText(/Get tickets/)).toBeTruthy();
    expect(screen.queryByTestId('webview-modal')).toBeNull();

    fireEvent.press(screen.getByLabelText(/Get tickets/));

    const modal = screen.getByTestId('webview-modal');
    expect(modal).toBeTruthy();
    // accessibilityLabel carries the url (see WebViewModal stub above).
    expect(modal.props.accessibilityLabel).toBe('https://quicket.co.za/events/e1');
  });

  it('(f) ticketLink null — "No tickets required" label renders, no CTA', () => {
    setHook({ event: makeEvent({ ticketLink: null }) });
    renderScreen();

    expect(screen.getByText('No tickets required')).toBeTruthy();
    expect(screen.queryByLabelText(/Get tickets/)).toBeNull();
  });

  it('(g) pressing the back pill calls router.back() once', () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('(h) isError renders general-error EmptyState; Retry invalidates the detail query', () => {
    setHook({ isError: true, event: null });
    renderScreen();

    expect(screen.getByText('Something went wrong')).toBeTruthy();

    fireEvent.press(screen.getByText('Retry'));
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: eventKeys.detail('e1') });
  });

  it('(i) registers a detail view via InterstitialContext once on mount', () => {
    const recordDetailView = jest.fn();
    render(
      <InterstitialContext.Provider value={recordDetailView}>
        <EventDetailScreen />
      </InterstitialContext.Provider>,
    );

    expect(recordDetailView).toHaveBeenCalledTimes(1);
  });

  it('(j) renders without a provider — the default no-op context does not throw', () => {
    expect(() => renderScreen()).not.toThrow();
  });

  it('(k) logs the EventDetail screen view once on mount', () => {
    renderScreen();
    expect(logScreenView).toHaveBeenCalledTimes(1);
    expect(logScreenView).toHaveBeenCalledWith('EventDetail');
  });

  it('(l) logs ticket_link_tapped with the event id when the Tickets CTA is pressed', () => {
    renderScreen();

    expect(logTicketLinkTapped).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText(/Get tickets/));
    expect(logTicketLinkTapped).toHaveBeenCalledWith('e1');
  });

  it('(m) renders the Privacy Policy link; pressing it mounts WebViewModal with the policy url', () => {
    renderScreen();

    const link = screen.getByLabelText('Privacy Policy');
    expect(link).toBeTruthy();
    expect(screen.queryByTestId('webview-modal')).toBeNull();

    fireEvent.press(link);

    const modal = screen.getByTestId('webview-modal');
    expect(modal.props.accessibilityLabel).toBe('https://example.com/privacy');
  });

  it('(n) hides the Privacy Policy link when no policy url is configured', () => {
    mockPrivacyUrl = '';
    renderScreen();

    expect(screen.queryByLabelText('Privacy Policy')).toBeNull();
  });
});
