module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource: 'nativewind' wires NativeWind's JSX transform.
      // reactCompiler: true must be declared here — adding babel.config.js disables
      // the experiments.reactCompiler flag in app.config.ts (confirmed in Story 1.1).
      ['babel-preset-expo', { jsxImportSource: 'nativewind', reactCompiler: true }],
      'nativewind/babel',
    ],
  };
};
