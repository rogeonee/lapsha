import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { signInSchema, type SignInFormData } from '~/api/auth/auth-schema';
import { signIn } from '~/api/auth/auth-service';
import { AuthButton, AuthInput } from '~/components/auth';
import { Text } from '~/components/ui/text';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        Alert.alert('Sign In Failed', error.message);
      }
    } catch (error) {
      console.warn(error);
      Alert.alert(
        'Sign In Failed',
        'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center bg-white px-6 py-12">
          <View className="mx-auto w-full max-w-sm">
            <View className="mb-8">
              <Text className="text-2xl font-bold text-center text-foreground">
                Welcome Back
              </Text>
              <Text className="text-center text-muted-foreground mt-2">
                Sign in to your account
              </Text>
            </View>

            <View className="space-y-4">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    editable={!isLoading}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    editable={!isLoading}
                  />
                )}
              />

              <AuthButton
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                loadingText="Signing in..."
                className="mt-6"
              >
                Sign In
              </AuthButton>
            </View>

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-muted-foreground">
                Forgot your password?{' '}
              </Text>
              <Link href="/forgot-password" className="ml-1">
                <Text className="text-primary font-medium">Reset it</Text>
              </Link>
            </View>

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-muted-foreground">
                Don&apos;t have an account?{' '}
              </Text>
              <Link href="/sign-up" className="ml-1">
                <Text className="text-primary font-medium">Sign up</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
