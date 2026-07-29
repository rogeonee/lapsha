import type { ReactElement, ReactNode } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export interface CollapsingHeaderOptions {
  /** Large in-content title; also the small title in the pinned bar. */
  title: string;
  /** Trailing bar action (Android), always visible while the bar chrome fades. */
  right?: ReactNode;
}

export interface CollapsingHeader {
  /** Attach to the screen's scrollable together with `scrollEventThrottle={16}`. */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Render as the first element of the scroll content (`ListHeaderComponent`). */
  largeTitle: ReactElement | null;
  /** Render after the scrollable; the absolutely positioned pinned bar. */
  bar: ReactElement | null;
}

// iOS keeps the native large-title header; the hook is inert there.
export function useCollapsingHeader(
  _options: CollapsingHeaderOptions,
): CollapsingHeader {
  return { onScroll: undefined, largeTitle: null, bar: null };
}
