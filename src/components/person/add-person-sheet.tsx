import AndroidAddPersonSheet from './add-person-sheet.android';
import IOSAddPersonSheet from './add-person-sheet.ios';

const androidAddPersonSheet: typeof IOSAddPersonSheet = AndroidAddPersonSheet;
void androidAddPersonSheet;

export { default } from './add-person-sheet.ios';
