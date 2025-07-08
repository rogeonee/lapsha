import { View } from 'react-native';
import { useSession } from '~/auth/ctx';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export default function HomeScreen() {
  const { signOut } = useSession();

  return (
    <View className="flex-1 items-center justify-center bg-[#F9F7F4]">
      <Text className="text-3xl font-bold mb-10">Home & Timeline</Text>
      <Button onPress={signOut}>
        <Text>Sign Out</Text>
      </Button>
    </View>
  );
}
