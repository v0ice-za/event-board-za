import {
  getAnalytics,
  logEvent,
  logScreenView as fbLogScreenView,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';
import {
  getCrashlytics,
  setCrashlyticsCollectionEnabled,
} from '@react-native-firebase/crashlytics';

import {
  initInstrumentation,
  logAdImpression,
  logCategoryFilter,
  logScreenView,
  logTicketLinkTapped,
} from './analytics';

// Mock the native modules directly so we can assert the wrappers forward the right
// event names + params. (Overrides the jest.config moduleNameMapper stub for this suite.)
jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({ __analytics: true })),
  logEvent: jest.fn(() => Promise.resolve()),
  logScreenView: jest.fn(() => Promise.resolve()),
  setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
}));
jest.mock('@react-native-firebase/crashlytics', () => ({
  getCrashlytics: jest.fn(() => ({ __crashlytics: true })),
  setCrashlyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
}));

const mockGetAnalytics = getAnalytics as jest.Mock;
const mockLogEvent = logEvent as jest.Mock;
const mockLogScreenView = fbLogScreenView as jest.Mock;
const mockSetAnalyticsEnabled = setAnalyticsCollectionEnabled as jest.Mock;
const mockGetCrashlytics = getCrashlytics as jest.Mock;
const mockSetCrashlyticsEnabled = setCrashlyticsCollectionEnabled as jest.Mock;

const analyticsInstance = { __analytics: true };
const crashlyticsInstance = { __crashlytics: true };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('analytics wrappers', () => {
  it('logScreenView forwards screen_name + screen_class via the dedicated API', () => {
    expect(() => logScreenView('Feed')).not.toThrow();
    expect(mockLogScreenView).toHaveBeenCalledWith(analyticsInstance, {
      screen_name: 'Feed',
      screen_class: 'Feed',
    });
  });

  it('logCategoryFilter logs the category_filter event with the tapped category', () => {
    logCategoryFilter('Music');
    expect(mockLogEvent).toHaveBeenCalledWith(analyticsInstance, 'category_filter', {
      category: 'Music',
    });
  });

  it('logTicketLinkTapped logs ticket_link_tapped with the event id', () => {
    logTicketLinkTapped('e1');
    expect(mockLogEvent).toHaveBeenCalledWith(analyticsInstance, 'ticket_link_tapped', {
      event_id: 'e1',
    });
  });

  it('logAdImpression uses the non-reserved `ad_view` event name (not `ad_impression`)', () => {
    logAdImpression('banner');
    expect(mockLogEvent).toHaveBeenCalledWith(analyticsInstance, 'ad_view', {
      ad_type: 'banner',
    });
    expect(mockLogEvent.mock.calls.map((c) => c[1])).not.toContain('ad_impression');
  });

  it('initInstrumentation gates both collections on !__DEV__ (disabled in dev)', () => {
    initInstrumentation();
    expect(mockSetAnalyticsEnabled).toHaveBeenCalledWith(analyticsInstance, !__DEV__);
    expect(mockSetCrashlyticsEnabled).toHaveBeenCalledWith(crashlyticsInstance, !__DEV__);
    // Under jest-expo __DEV__ is true → collection disabled.
    expect(mockSetAnalyticsEnabled).toHaveBeenCalledWith(analyticsInstance, false);
  });

  it('never throws even if the underlying SDK promise rejects', () => {
    mockLogEvent.mockReturnValueOnce(Promise.reject(new Error('boom')));
    expect(() => logCategoryFilter('Sport')).not.toThrow();
  });

  it('resolves the analytics instance through getAnalytics() for each call', () => {
    logScreenView('Feed');
    expect(mockGetAnalytics).toHaveBeenCalled();
    initInstrumentation();
    expect(mockGetCrashlytics).toHaveBeenCalled();
  });
});
