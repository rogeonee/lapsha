import { View } from 'react-native';
import { Text } from '~/components/ui/text';

export function PersonSectionHeader({
  title,
  accessory,
}: {
  title: string;
  accessory?: React.ReactNode;
}) {
  return (
    <View
      className="flex-row items-center justify-between gap-3 px-1"
      style={{ minHeight: process.env.EXPO_OS === 'android' ? 48 : 24 }}
    >
      <Text className="flex-1 text-lg font-medium">{title}</Text>
      {accessory}
    </View>
  );
}
