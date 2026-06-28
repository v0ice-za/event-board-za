// Web stub for react-native-google-mobile-ads
const MobileAds = () => ({ initialize: () => Promise.resolve([]) });
module.exports = MobileAds;
module.exports.default = MobileAds;

// Named exports used by components/AdBannerUnit.tsx so the web bundle resolves.
// BannerAd renders nothing on web; sizes/test IDs are inert string maps.
module.exports.BannerAd = () => null;
module.exports.BannerAdSize = {
  BANNER: 'BANNER',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
};
module.exports.TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
};

// Interstitial (Story 5.2) — used by app/_layout.tsx. On web it is inert: the factory
// returns an object whose listeners/load/show are no-ops so the web bundle resolves.
module.exports.InterstitialAd = {
  createForAdRequest: () => ({
    addAdEventListener: () => () => {},
    load: () => {},
    show: () => Promise.resolve(),
  }),
};
module.exports.AdEventType = {
  LOADED: 'loaded',
  ERROR: 'error',
  OPENED: 'opened',
  CLOSED: 'closed',
};
