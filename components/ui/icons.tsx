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

function MaterialIcon({ d, size = 18, color }: IconProps & { d: string }) {
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

export function PersonIcon({ size = 18, color }: IconProps) {
  if (isIOS) {
    return (
      <Image
        source="sf:person.fill"
        tintColor={String(color)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <MaterialIcon
      size={size}
      color={color}
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
    />
  );
}

export function SwapVertIcon({ size = 18, color }: IconProps) {
  if (isIOS) {
    return (
      <Image
        source="sf:arrow.up.arrow.down"
        tintColor={String(color)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <MaterialIcon
      size={size}
      color={color}
      d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"
    />
  );
}

export function EditIcon({ size = 18, color }: IconProps) {
  if (isIOS) {
    return (
      <Image
        source="sf:pencil"
        tintColor={String(color)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <MaterialIcon
      size={size}
      color={color}
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
    />
  );
}

export function PhotoIcon({ size = 18, color }: IconProps) {
  if (isIOS) {
    return (
      <Image
        source="sf:photo"
        tintColor={String(color)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <MaterialIcon
      size={size}
      color={color}
      d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
    />
  );
}

export function CancelCircleIcon({ size = 18, color }: IconProps) {
  if (isIOS) {
    return (
      <Image
        source="sf:xmark.circle"
        tintColor={String(color)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <MaterialIcon
      size={size}
      color={color}
      d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"
    />
  );
}

export function MoreVertIcon({ size = 18, color }: IconProps) {
  if (isIOS) {
    return (
      <Image
        source="sf:ellipsis"
        tintColor={String(color)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <MaterialIcon
      size={size}
      color={color}
      d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
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
