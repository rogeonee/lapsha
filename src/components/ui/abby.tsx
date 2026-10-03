import { Image } from 'expo-image';
import { View } from 'react-native';

const artwork = {
  curious: require('~/assets/abby/curious-sniff.png'),
  dates: require('~/assets/abby/dates-companion.png'),
  note: require('~/assets/abby/first-note.png'),
};

/** Approved original PNGs, with their transparent canvas inset in layout. */
export function Abby({
  pose,
  size = 200,
}: {
  pose: keyof typeof artwork;
  size?: number;
}) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, overflow: 'hidden' }}
    >
      <Image
        source={artwork[pose]}
        contentFit="contain"
        accessible={false}
        style={{
          width: size * 1.4,
          height: size * 1.4,
          position: 'absolute',
          left: -size * 0.2,
          top: -size * 0.2,
        }}
      />
    </View>
  );
}
