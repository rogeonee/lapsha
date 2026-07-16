import AndroidPersonMenu from './person-menu.android';
import IOSPersonMenu from './person-menu.ios';

const androidPersonMenu: typeof IOSPersonMenu = AndroidPersonMenu;
void androidPersonMenu;

export { default } from './person-menu.ios';
