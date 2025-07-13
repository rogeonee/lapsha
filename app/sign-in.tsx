import { View } from 'react-native';
import 'react-native-url-polyfill/auto';
import Auth from '~/screens/sign-in';

export default function SignIn() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Auth />
    </View>
  );
}
