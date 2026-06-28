module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/functions/'],
  // Analytics/Crashlytics are native modules; map them to inert stubs so screen tests that
  // import @/lib/analytics transitively (logScreenView on mount) don't load native code.
  moduleNameMapper: {
    '^@react-native-firebase/analytics$': '<rootDir>/lib/__stubs__/firebase-analytics.js',
    '^@react-native-firebase/crashlytics$': '<rootDir>/lib/__stubs__/firebase-crashlytics.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|native-base|react-native-svg)',
  ],
};
