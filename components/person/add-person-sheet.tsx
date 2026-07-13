/**
 * TypeScript + iOS resolution target: the add-person sheet is
 * Android-only (Metro picks add-person-sheet.android.tsx there). The
 * iOS route renders the native modal screen and never mounts this, but
 * Metro still resolves the import — keep it a HeroUI-free no-op so iOS
 * ships zero HeroUI JS.
 */
export function AddPersonSheet() {
  return null;
}
