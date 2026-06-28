// Stub for @react-native-firebase/analytics — used for the web bundle (Metro) and Jest.
// Inert no-ops: analytics is a native module, so on web / in tests the wrappers in
// lib/analytics.ts become harmless calls. Promise-returning fns resolve so .catch() is safe.
module.exports = {
  getAnalytics: () => ({}),
  logEvent: () => Promise.resolve(),
  logScreenView: () => Promise.resolve(),
  setAnalyticsCollectionEnabled: () => Promise.resolve(),
};
