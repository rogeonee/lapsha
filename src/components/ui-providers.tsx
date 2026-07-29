import AndroidUIProviders from './ui-providers.android';
import IOSUIProviders from './ui-providers.ios';

const androidUIProviders: typeof IOSUIProviders = AndroidUIProviders;
void androidUIProviders;

export { default } from './ui-providers.ios';
