import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  if (process.env.APP_VARIANT !== 'gifts-lab') return config as ExpoConfig;
  return {
    ...config,
    name: 'Lapsha Gifts Lab',
    slug: 'lapsha',
    scheme: 'lapsha-gifts-lab',
    android: { ...config.android, package: 'com.rogeonee.lapsha.giftslab' },
    ios: { ...config.ios, bundleIdentifier: 'com.rogeonee.lapsha.giftslab' },
    plugins: [...(config.plugins ?? []), './plugins/with-gifts-lab-icon'],
  };
};
