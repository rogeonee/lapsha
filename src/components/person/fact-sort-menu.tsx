import AndroidFactSortMenu from './fact-sort-menu.android';
import IOSFactSortMenu from './fact-sort-menu.ios';

const androidFactSortMenu: typeof IOSFactSortMenu = AndroidFactSortMenu;
void androidFactSortMenu;

export { default } from './fact-sort-menu.ios';
