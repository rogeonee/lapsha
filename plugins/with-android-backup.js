const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
} = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = function withAndroidBackup(config) {
  config = withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );
    application.$['android:allowBackup'] = 'true';
    application.$['android:fullBackupContent'] = '@xml/lapsha_backup_rules';
    application.$['android:dataExtractionRules'] =
      '@xml/lapsha_data_extraction_rules';
    return config;
  });

  return withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDirectory = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/xml',
      );
      await fs.mkdir(xmlDirectory, { recursive: true });
      // Exclusions preserve Android's default inclusion of all other eligible app data.
      await fs.writeFile(
        path.join(xmlDirectory, 'lapsha_backup_rules.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
  <exclude domain="file" path="avatars/" />
</full-backup-content>
`,
      );
      await fs.writeFile(
        path.join(xmlDirectory, 'lapsha_data_extraction_rules.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup>
    <exclude domain="file" path="avatars/" />
  </cloud-backup>
  <device-transfer>
    <exclude domain="file" path="avatars/" />
  </device-transfer>
</data-extraction-rules>
`,
      );
      return config;
    },
  ]);
};
