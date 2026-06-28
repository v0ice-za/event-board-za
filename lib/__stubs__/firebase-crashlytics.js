// Stub for @react-native-firebase/crashlytics — used for the web bundle (Metro) and Jest.
// Inert no-ops: Crashlytics is native-only, so on web / in tests collection toggling and
// error recording are harmless calls.
module.exports = {
  getCrashlytics: () => ({}),
  setCrashlyticsCollectionEnabled: () => Promise.resolve(),
  recordError: () => {},
  log: () => {},
};
