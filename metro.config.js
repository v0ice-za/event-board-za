const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Wire @/* path alias so Metro resolves it the same as tsconfig
config.resolver.alias = {
  '@': __dirname,
};

module.exports = withNativeWind(config, { input: './global.css' });
