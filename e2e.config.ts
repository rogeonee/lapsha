import { mobile } from '@e2e-dev/mobile';
import type { E2EConfig } from 'e2e';
import { bundleId, iosDevice, metroUrl } from './e2e/support/target';

const metroPort = new URL(metroUrl).port;

export default {
  tests: 'e2e/**/*.e2e.ts',
  workers: 1,
  retries: 0,
  timeout: 240_000,
  actionTimeout: 15_000,
  assertionTimeout: 15_000,
  targets: [
    {
      name: 'ios',
      engine: mobile({ platform: 'ios', device: iosDevice }),
      app: {
        bundleId,
        // Open this checkout's Metro directly instead of the dev launcher.
        launchArguments: [
          '--initialUrl',
          metroUrl,
          '-EXDevMenuShowsAtLaunch',
          'NO',
          '-EXDevMenuIsOnboardingFinished',
          'YES',
          '-EXDevMenuShowFloatingActionButton',
          'NO',
        ],
        command: {
          executable: 'bun',
          args: ['run', 'start', '--port', metroPort],
          env: { APP_VARIANT: 'e2e', CI: '1', EXPO_NO_TELEMETRY: '1' },
          startupTimeout: 120_000,
          log: '.e2e/logs/metro.log',
        },
        readyUrl: `${metroUrl}/status`,
      },
    },
  ],
} satisfies E2EConfig;
