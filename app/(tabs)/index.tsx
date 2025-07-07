import { View } from 'react-native';
import { Text } from '~/components/ui/text';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F9F7F4]">
      <Text className="text-3xl font-bold mb-10">Home & Timeline</Text>
    </View>
  );
}
