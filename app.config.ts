import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  switch (process.env.APP_VARIANT) {
    case 'gifts-lab':
      return {
        ...config,
        name: 'Lapsha Gifts Lab',
        slug: 'lapsha',
        scheme: 'lapsha-gifts-lab',
        android: { ...config.android, package: 'com.rogeonee.lapsha.giftslab' },
        ios: {
          ...config.ios,
          bundleIdentifier: 'com.rogeonee.lapsha.giftslab',
        },
        plugins: [...(config.plugins ?? []), './plugins/with-gifts-lab-icon'],
      };
    case 'e2e':
      // The native E2E suite reinstalls this app and erases its data. A
      // separate identity keeps that away from the development app.
      return {
        ...config,
        name: 'Lapsha E2E',
        slug: 'lapsha',
        scheme: 'lapsha-e2e',
        android: { ...config.android, package: 'com.rogeonee.lapsha.e2e' },
        ios: { ...config.ios, bundleIdentifier: 'com.rogeonee.lapsha.e2e' },
      };
    default:
      return config as ExpoConfig;
  }
};
