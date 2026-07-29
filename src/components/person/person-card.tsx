import { View } from 'react-native';
import { Avatar } from '~/components/person/avatar';
import { ChevronRightIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';
import { avatarUri } from '~/lib/avatars';
import { palette, shadows } from '~/lib/theme';
import type { Person } from '~/types/db';

export function PersonCard({ person }: { person: Person }) {
  return (
    <View
      className="flex-row items-center rounded-2xl bg-white p-4"
      style={{
        borderCurve: 'continuous',
        boxShadow: shadows.whisper,
      }}
    >
      <Avatar
        name={person.name}
        photo={avatarUri(person.avatar)}
        size={48}
        className="mr-4"
      />
      <Text className="flex-1 text-lg font-medium" numberOfLines={1}>
        {person.name}
      </Text>
      <ChevronRightIcon color={palette.warmGrayDeep} />
    </View>
  );
}
