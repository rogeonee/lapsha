/**
 * TypeScript-only resolution target: tsc has no platform moduleSuffixes,
 * so `~/components/person/birthday-date-row` resolves here for types.
 * Metro always picks birthday-date-row.ios.tsx / .android.tsx at runtime,
 * which share this exact API; this file is never bundled.
 */
export { BirthdayDateRow } from './birthday-date-row.ios';
