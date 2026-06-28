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
    // POPIA / Apple privacy manifest (Story 5.4). Generates ios/PrivacyInfo.xcprivacy
    // on `expo prebuild` — no native file is hand-edited. The AdMob + Firebase native
    // SDKs ship their OWN bundled manifests; this declares the APP-level Required Reason
    // APIs. NSPrivacyTracking is false: v1 runs no ATT/UMP consent prompt (disclosure-only
    // POPIA model; a consent flow is deferred to v1.1). UserDefaults (CA92.1) is the
    // standard app-functionality reason these SDKs require.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
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
    // Production AdMob unit IDs are injected from EAS Secrets at build time (Story 5.5).
    // TestIds are used in dev/CI ONLY (resolved off __DEV__ in AdBannerUnit / _layout).
    // In a PRODUCTION build an empty value → an empty unit ID → ads fail to load silently
    // (no test-ID fallback). These secrets MUST be set before store submission for ads to show.
    admobBannerUnitId: process.env.ADMOB_BANNER_UNIT_ID ?? '',
    admobInterstitialUnitId: process.env.ADMOB_INTERSTITIAL_UNIT_ID ?? '',
    // Public URL of the hosted privacy policy (Story 5.4). Sourced from docs/privacy-policy.md.
    // Empty until the hosted copy goes live — the in-app "Privacy Policy" link hides when empty
    // (no dead link), and the real URL is finalised + wired into store listings in Story 5.5.
    privacyPolicyUrl: process.env.PRIVACY_POLICY_URL ?? '',
    eas: {
      projectId: '48b701cb-dcad-42ff-8132-b7d8f18945b1',
    },
  },
  plugins: [
    '@react-native-firebase/app',
    // Crashlytics needs its OWN config plugin to wire the Android Gradle plugin + iOS
    // dSYM upload build phase (the `app` plugin alone does not) — required for native
    // crash reporting/symbolication (Story 5.3 AC #7).
    '@react-native-firebase/crashlytics',
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
        // Real AdMob App IDs are injected from EAS Secrets in production (Story 5.5).
        // The Google TEST App IDs remain the dev/CI fallback so local + CI builds never
        // need real ad credentials. NOTE: a production build missing the AdMob *unit*-ID
        // secrets shows NO ads (empty unit IDs fail to load) — set ALL AdMob secrets before
        // submission. See docs/store-metadata.md release checklist.
        androidAppId: process.env.ADMOB_ANDROID_APP_ID ?? 'ca-app-pub-3940256099942544~3347511713',
        iosAppId: process.env.ADMOB_IOS_APP_ID ?? 'ca-app-pub-3940256099942544~1458002511',
      },
    ],
    'expo-router',
    [
      'expo-splash-screen',
      {
        // Brand dark background (#0F0C09 = COLORS.background) so the splash matches the app
        // shell on both platforms (Story 5.5). Shared `image` gives iOS the splash icon too.
        backgroundColor: '#0F0C09',
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
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
