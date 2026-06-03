import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Event Board ZA',
  slug: 'event-board-za',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'eventboardza',
  userInterfaceStyle: 'automatic',
  ios: {
    ...config.ios,
    bundleIdentifier: 'za.voicemijalkovic.eventboard',
    icon: './assets/images/icon.png',
    googleServicesFile: './GoogleService-Info.plist',
  },
  android: {
    ...config.android,
    package: 'za.voicemijalkovic.eventboard',
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  extra: {
    quicketApiKey: process.env.QUICKET_API_KEY ?? '',
    eventbriteApiKey: process.env.EVENTBRITE_API_KEY ?? '',
    facebookAppToken: process.env.FACEBOOK_APP_TOKEN ?? '',
    eas: {
      projectId: '48b701cb-dcad-42ff-8132-b7d8f18945b1',
    },
  },
  plugins: [
    '@react-native-firebase/app',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-3940256099942544~3347511713', // Google test App ID
        iosAppId: 'ca-app-pub-3940256099942544~1458002511',     // Google test App ID
      },
    ],
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
