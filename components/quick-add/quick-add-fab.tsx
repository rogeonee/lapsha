import AndroidQuickAddFab from './quick-add-fab.android';
import IOSQuickAddFab from './quick-add-fab.ios';

const androidQuickAddFab: typeof IOSQuickAddFab = AndroidQuickAddFab;
void androidQuickAddFab;

export { default } from './quick-add-fab.ios';
