import AndroidSwitch from './switch.android';
import IOSSwitch from './switch.ios';

const androidSwitch: typeof IOSSwitch = AndroidSwitch;
void androidSwitch;

export { default } from './switch.ios';
