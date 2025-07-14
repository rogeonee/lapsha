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
import { signUpSchema, type SignUpFormData } from '~/auth/auth-schema';
import { signUp } from '~/auth/auth-service';
import { AuthButton, AuthInput } from '~/components/auth';
import { Text } from '~/components/ui/text';

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);

    try {
      const { error } = await signUp(
        data.name,
        data.email,
        data.password,
        data.phone || undefined,
      );

      if (error) {
        Alert.alert('Sign Up Failed', error.message);
      }
    } catch (error) {
      console.warn(error);
      Alert.alert(
        'Sign Up Failed',
        'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                Create Account
              </Text>
              <Text className="text-center text-muted-foreground mt-2">
                Sign up to get started
              </Text>
            </View>

            <View className="space-y-4">
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                    editable={!isLoading}
                  />
                )}
              />

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
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="Phone Number (Optional)"
                    placeholder="Enter your phone number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.phone?.message}
                    editable={!isLoading}
                    keyboardType="phone-pad"
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

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    editable={!isLoading}
                  />
                )}
              />

              <AuthButton
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                loadingText="Creating account..."
                className="mt-6"
              >
                Sign Up
              </AuthButton>
            </View>

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-muted-foreground">
                Already have an account?{' '}
              </Text>
              <Link dismissTo href="/sign-in" className="ml-1">
                <Text className="text-primary font-medium">Sign in</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
