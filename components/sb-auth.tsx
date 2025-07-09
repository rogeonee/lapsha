import { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Text } from './ui/text';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    if (!session)
      Alert.alert('Please check your inbox for email verification!');
    setLoading(false);
  }

  return (
    <View className="mt-10 p-3">
      <View className="py-1 align-self-stretch">
        <TextInput
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize={'none'}
        />
      </View>
      <View className="py-1 align-self-stretch">
        <TextInput
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize={'none'}
        />
      </View>
      <View className="mt-5 py-1 align-self-stretch">
        <Button disabled={loading} onPress={() => signInWithEmail()}>
          <Text>Sign in</Text>
        </Button>
      </View>
      <View className="py-1 align-self-stretch">
        <Button disabled={loading} onPress={() => signUpWithEmail()}>
          <Text>Sign up</Text>
        </Button>
      </View>
    </View>
  );
}
