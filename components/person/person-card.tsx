import { View } from 'react-native';
import { ChevronRightIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { palette, shadows } from '~/lib/theme';
import type { Person } from '~/types/db';

export function PersonCard({ person }: { person: Person }) {
  const initial = person.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      className="flex-row items-center bg-white rounded-2xl p-4"
      style={{
        borderCurve: 'continuous',
        boxShadow: shadows.whisper,
      }}
    >
      <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-cream-swirl">
        <Text className="text-lg font-semibold text-broth">{initial}</Text>
      </View>
      <Text className="text-lg font-medium flex-1" numberOfLines={1}>
        {person.name}
      </Text>
      <ChevronRightIcon color={palette.warmGray} />
    </View>
  );
}
