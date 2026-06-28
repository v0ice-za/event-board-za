const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Wire @/* path alias so Metro resolves it the same as tsconfig
config.resolver.alias = {
  '@': __dirname,
};

// Stub native-only packages when bundling for web (browser + SSR node pass)
const nativeOnlyStubs = {
  '@react-native-firebase/app': path.resolve(__dirname, 'lib/__stubs__/firebase-app.js'),
  '@react-native-firebase/firestore': path.resolve(__dirname, 'lib/__stubs__/firebase-firestore.js'),
  '@react-native-firebase/analytics': path.resolve(__dirname, 'lib/__stubs__/firebase-analytics.js'),
  '@react-native-firebase/crashlytics': path.resolve(__dirname, 'lib/__stubs__/firebase-crashlytics.js'),
  'react-native-google-mobile-ads': path.resolve(__dirname, 'lib/__stubs__/mobile-ads.js'),
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && nativeOnlyStubs[moduleName]) {
    return { type: 'sourceFile', filePath: nativeOnlyStubs[moduleName] };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
