const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
} = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = function withGiftsLabIcon(config) {
  config = withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );
    application.$['android:icon'] = '@drawable/gifts_lab_icon';
    application.$['android:roundIcon'] = '@drawable/gifts_lab_icon';
    return config;
  });
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const directory = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/drawable',
      );
      await fs.mkdir(directory, { recursive: true });
      await fs.writeFile(
        path.join(directory, 'gifts_lab_icon.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
  <path android:fillColor="#5944A4" android:pathData="M54,0 A54,54 0,1 1,54 108 A54,54 0,1 1,54 0" />
  <path android:fillColor="#FFFFFF" android:pathData="M43,23 L65,23 L65,29 L61,29 L61,45 L78,72 Q82,83 69,83 L39,83 Q26,83 30,72 L47,45 L47,29 L43,29 Z M52,29 L52,47 L39,68 L69,68 L56,47 L56,29 Z" />
  <path android:fillColor="#F6B756" android:pathData="M39,72 L69,72 L72,77 L36,77 Z" />
</vector>`,
      );
      return config;
    },
  ]);
};
