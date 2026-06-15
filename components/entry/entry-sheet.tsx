/**
 * TypeScript-only resolution target: tsc has no platform moduleSuffixes,
 * so `~/components/entry/entry-sheet` resolves here for types. Metro
 * always picks entry-sheet.ios.tsx / entry-sheet.android.tsx at runtime,
 * which share this exact API; this file is never bundled.
 */
export { EntrySheet } from './entry-sheet.ios';
export type { EntrySheetConfig } from './use-entry-form';
