/**
 * TypeScript-only resolution target: tsc has no platform moduleSuffixes,
 * so imports resolve here for types. Metro picks the .ios.tsx / .android.tsx
 * implementation at runtime; this file is never bundled.
 */
export { useClearDataConfirmation } from './use-clear-data-confirmation.ios';
