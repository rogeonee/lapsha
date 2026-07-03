/**
 * TypeScript-only resolution target: tsc has no platform moduleSuffixes,
 * so `~/components/ui/switch` resolves here for types. Metro always picks
 * switch.ios.tsx / switch.android.tsx at runtime, which share this exact
 * API; this file is never bundled.
 */
export { Switch } from './switch.ios';
