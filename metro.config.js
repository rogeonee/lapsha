const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  // NativeWind resolved rem to 14px; Uniwind defaults to 16px. Keep 14 so
  // every rem-based size (text-*, p-*, gap-*) stays visually identical.
  polyfills: { rem: 14 },
});
