import { Link } from 'expo-router';
import { View } from 'react-native';
import 'react-native-url-polyfill/auto';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export default function ForgotPassword() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text>Forgot password</Text>
      <Link dismissTo href="/sign-in" className="mt-4" asChild>
        <Button className="mt-4">
          <Text>Back to sign in</Text>
        </Button>
      </Link>
    </View>
  );
}
