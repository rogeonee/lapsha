import AndroidEntrySheet from './entry-sheet.android';
import IOSEntrySheet from './entry-sheet.ios';

// TypeScript resolves this facade while Metro selects a platform file.
// Keep both implementations structurally compatible without bundling one
// platform's native dependencies into the other.
const androidEntrySheet: typeof IOSEntrySheet = AndroidEntrySheet;
void androidEntrySheet;

export { default } from './entry-sheet.ios';
export type { EntrySheetConfig } from './use-entry-form';
