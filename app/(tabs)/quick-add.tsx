// Never rendered: this route exists only so Expo Router registers the
// quick-add trigger in (tabs)/_layout.tsx. On iOS 26+ that trigger is the
// detached search-role tab whose selection is prevented (it opens the
// entry sheet instead); everywhere else the trigger is hidden.
export default function QuickAddRoute() {
  return null;
}
