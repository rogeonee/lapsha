import { View } from 'react-native';
import { useSession } from '~/api/auth/auth-context';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export default function HomeScreen() {
  const { session, signOut } = useSession();

  return (
    <View className="flex-1 items-center justify-center bg-[#F9F7F4] p-4">
      <Text className="text-3xl font-bold text-center mb-4">
        Home & Timeline
      </Text>

      <Text className="text-lg text-muted-foreground text-center mb-10">
        Welcome back, {session?.user?.email}
      </Text>

      <Button onPress={signOut}>
        <Text>Sign Out</Text>
      </Button>
    </View>
  );
}
