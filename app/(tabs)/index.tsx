import { View } from 'react-native';
import { Text } from '~/components/ui/text';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-paper p-4">
      <Text className="text-3xl font-bold text-center mb-4">
        Home & Timeline
      </Text>

      <Text className="text-lg text-muted-foreground text-center">
        Upcoming dates across your people will appear here.
      </Text>
    </View>
  );
}
