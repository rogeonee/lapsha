import { View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export default function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F9F7F4]">
      <Text className="text-3xl font-bold mb-10">Lapsha Settings</Text>
      <Button
        variant="outline"
        size="lg"
        onPress={() => alert('Button pressed!')}
      >
        <Text>Press me</Text>
      </Button>
    </View>
  );
}
