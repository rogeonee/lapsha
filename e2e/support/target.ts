// Shared by e2e.config.ts, the test files and `bun run ios:e2e`: the suite
// drives the app that script installed on this simulator.
export const iosDevice = process.env.E2E_IOS_DEVICE ?? 'iPhone 18 Pro';
export const bundleId = 'com.rogeonee.lapsha.e2e';
export const metroUrl = 'http://127.0.0.1:8092';
