import { Image } from 'expo-image';
import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * Small icons shared by list rows. iOS renders SF Symbols via expo-image;
 * Android gets Material path equivalents (expo-image's `sf:` source is
 * iOS-only — Glide rejects the scheme).
 */

const isIOS = process.env.EXPO_OS === 'ios';

type IconProps = { size?: number; color: ColorValue };

function MaterialIcon({
  d,
  size = 18,
  color,
}: IconProps & { d: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d={d} />
    </Svg>
  );
}

export function PlusCircleIcon({ size = 18, color }: IconProps) {
  if (isIOS) {
    return (
      <Image
        source="sf:plus.circle.fill"
        tintColor={String(color)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <MaterialIcon
      size={size}
      color={color}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
    />
  );
}

export function TrashIcon({ size = 18, color }: IconProps) {
  if (isIOS) {
    return (
      <Image
        source="sf:trash.fill"
        tintColor={String(color)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <MaterialIcon
      size={size}
      color={color}
      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
    />
  );
}

export function CheckIcon({ size = 18, color }: IconProps) {
  if (isIOS) {
    return (
      <Image
        source="sf:checkmark"
        tintColor={String(color)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <MaterialIcon
      size={size}
      color={color}
      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
    />
  );
}

export function ChevronRightIcon({ size = 13, color }: IconProps) {
  if (isIOS) {
    return (
      <Image
        source="sf:chevron.right"
        tintColor={String(color)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <MaterialIcon
      size={size}
      color={color}
      d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
    />
  );
}
