/**
 * TypeScript-only resolution target: tsc has no platform moduleSuffixes,
 * so `~/components/person/person-menu` resolves here for types. Metro
 * always picks the .ios.tsx / .android.tsx implementation at runtime,
 * which share this exact API; this file is never bundled.
 */
export { PersonMenu } from './person-menu.ios';
