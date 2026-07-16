import AndroidBirthdayDateRow from './birthday-date-row.android';
import IOSBirthdayDateRow from './birthday-date-row.ios';

const androidBirthdayDateRow: typeof IOSBirthdayDateRow =
  AndroidBirthdayDateRow;
void androidBirthdayDateRow;

export { default } from './birthday-date-row.ios';
