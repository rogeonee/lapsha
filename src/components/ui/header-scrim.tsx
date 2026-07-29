import { useId } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import { palette } from '~/lib/theme';

// How far the scrim bleeds past the chrome before going transparent.
const SCRIM_FALLOFF = 24;

/** Total rendered height of the scrim for a chrome of `height`. */
export function headerScrimHeight(height: number): number {
  return height + SCRIM_FALLOFF;
}

/**
 * Progressive paper scrim for transparent Android headers — the gradient
 * stand-in for iOS 26's progressive header blur (Android live blur is
 * experimental and janky). Solid Paper through the status bar, easing to
 * transparent past `height` (the chrome's bottom edge, status bar
 * included) so content dissolves under the header instead of sliding
 * crisply beneath it. Callers position it; it renders in-flow.
 */
export function HeaderScrim({ height }: { height: number }) {
  const insets = useSafeAreaInsets();
  // Gradient defs are looked up by id; keep ids unique across the
  // multiple scrims a navigation stack can have mounted at once.
  const gradientId = `header-scrim-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const scrimHeight = headerScrimHeight(height);
  const statusStop = insets.top / scrimHeight;
  const midStop = (insets.top + (height - insets.top) * 0.55) / scrimHeight;

  return (
    <Svg pointerEvents="none" width="100%" height={scrimHeight}>
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.paper} stopOpacity="1" />
          <Stop
            offset={String(statusStop)}
            stopColor={palette.paper}
            stopOpacity="1"
          />
          <Stop
            offset={String(midStop)}
            stopColor={palette.paper}
            stopOpacity="0.8"
          />
          <Stop offset="1" stopColor={palette.paper} stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>
      <Rect
        x="0"
        y="0"
        width="100%"
        height={scrimHeight}
        fill={`url(#${gradientId})`}
      />
    </Svg>
  );
}
