import type { ReactNode } from 'react';

/**
 * iOS / default: no extra UI-library providers — iOS uses native
 * SwiftUI surfaces. Android wraps children in HeroUINativeProvider
 * (see ui-providers.android.tsx), keeping HeroUI out of the iOS bundle.
 */
export function UIProviders({ children }: { children: ReactNode }) {
  return children;
}
