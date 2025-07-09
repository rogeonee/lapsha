import { router } from 'expo-router';
import { View } from 'react-native';
import { useSession } from '~/auth/ctx';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export default function SignIn() {
  const { signIn } = useSession();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        backgroundColor: 'white',
      }}
    >
      <Text className="text-3xl font-bold">Welcome to Lapsha!</Text>
      <Text className="text-xl">Sign in to continue</Text>
      <Button size="lg">
        <Text
          onPress={() => {
            signIn();
            router.replace('/(tabs)');
          }}
        >
          Sign In
        </Text>
      </Button>
    </View>
  );
}
