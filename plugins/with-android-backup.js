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
      // Android 8.1 and lower cannot require a device-transfer transport for photos.
      await fs.writeFile(
        path.join(xmlDirectory, 'lapsha_backup_rules.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
  <exclude domain="file" path="avatars/" />
  <exclude domain="file" path="gift-photos/" />
</full-backup-content>
`,
      );
      const legacyTransferDirectory = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/xml-v28',
      );
      await fs.mkdir(legacyTransferDirectory, { recursive: true });
      // Legacy includes replace defaults. SQLite contains both notebook and preferences;
      // add future persistent file directories here without including the photo folders.
      await fs.writeFile(
        path.join(legacyTransferDirectory, 'lapsha_backup_rules.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
  <include domain="file" path="SQLite/" />
  <include domain="file" path="avatars/" requireFlags="deviceToDeviceTransfer" />
  <include domain="file" path="gift-photos/" requireFlags="deviceToDeviceTransfer" />
  <include domain="root" path="." />
  <include domain="database" path="." />
  <include domain="sharedpref" path="." />
  <include domain="external" path="." />
  <include domain="device_root" path="." />
  <include domain="device_file" path="." />
  <include domain="device_database" path="." />
  <include domain="device_sharedpref" path="." />
</full-backup-content>
`,
      );
      await fs.writeFile(
        path.join(xmlDirectory, 'lapsha_data_extraction_rules.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup>
    <exclude domain="file" path="avatars/" />
    <exclude domain="file" path="gift-photos/" />
  </cloud-backup>
  <device-transfer />
</data-extraction-rules>
`,
      );
      return config;
    },
  ]);
};
