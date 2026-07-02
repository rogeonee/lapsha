import { HeroUINativeProvider } from 'heroui-native/provider';
import type { ReactNode } from 'react';

/** Android: HeroUI Native components (entry sheet, FAB) need this context. */
export function UIProviders({ children }: { children: ReactNode }) {
  return (
    <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
      {children}
    </HeroUINativeProvider>
  );
}
