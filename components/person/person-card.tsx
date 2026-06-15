import { Image } from 'expo-image';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import type { Person } from '~/types/db';

export function PersonCard({ person }: { person: Person }) {
  const initial = person.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      className="flex-row items-center bg-white rounded-2xl p-4"
      style={{
        borderCurve: 'continuous',
        boxShadow: '0 1px 3px rgba(28, 20, 8, 0.06)',
      }}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: '#FBEAC9' }}
      >
        <Text className="text-lg font-semibold" style={{ color: '#B07818' }}>
          {initial}
        </Text>
      </View>
      <Text className="text-lg font-medium flex-1" numberOfLines={1}>
        {person.name}
      </Text>
      <Image
        source="sf:chevron.right"
        tintColor="#C9C2B6"
        style={{ width: 13, height: 13 }}
      />
    </View>
  );
}
