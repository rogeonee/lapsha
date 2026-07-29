import { Image } from 'expo-image';
import { View } from 'react-native';
import { PersonIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { palette } from '~/lib/theme';
import { cn } from '~/lib/utils';

export type AvatarSize = 40 | 48 | 72 | 96;

const initialClass: Record<AvatarSize, string> = {
  40: 'text-base font-semibold text-broth',
  48: 'text-lg font-semibold text-broth',
  72: 'text-3xl font-semibold text-broth',
  96: 'text-4xl font-semibold text-broth',
};

export function Avatar({
  name,
  photo,
  size,
  className,
}: {
  name: string;
  photo?: string | null;
  size: AvatarSize;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <View
      className={cn(
        'items-center justify-center overflow-hidden rounded-full bg-cream-swirl',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={150}
        />
      ) : initial ? (
        <Text className={initialClass[size]}>{initial}</Text>
      ) : (
        <PersonIcon size={Math.round(size * 0.42)} color={palette.broth} />
      )}
    </View>
  );
}
