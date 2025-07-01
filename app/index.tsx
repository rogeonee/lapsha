import { View } from 'react-native';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-purple-100">
      <Text className="text-3xl font-bold mb-10">Welcome to Lapsha!</Text>
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
