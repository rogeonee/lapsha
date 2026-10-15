import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';
import { nativeGuard, syntheticBundle } from './native-guard';
export default {
  tests: ['lifecycle.native.e2e.ts'],
  workers: 1,
  retries: 0,
  timeout: 240_000,
  actionTimeout: 15_000,
  assertionTimeout: 15_000,
  output: process.env.LAPSHA_E2E_ARTIFACTS!,
  trace: 'on',
  video: 'off',
  targets: [
    {
      name: 'ios-synthetic',
      engine: mobile({
        platform: 'ios',
        device: nativeGuard(),
        session: 'lapsha-e2e',
      }),
      app: {
        bundleId: syntheticBundle,
        identity: 'lapsha-disposable',
        launchArguments: [
          '--initialUrl',
          process.env.LAPSHA_E2E_METRO_URL!,
          '-EXDevMenuShowsAtLaunch',
          'NO',
          '-EXDevMenuIsOnboardingFinished',
          'YES',
          '-EXDevMenuShowFloatingActionButton',
          'NO',
        ],
      },
    },
  ],
} satisfies E2EConfig;
