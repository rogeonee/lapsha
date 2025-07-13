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
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '~/auth/auth-schema';
import { forgotPassword } from '~/auth/auth-service';
import { AuthButton, AuthInput } from '~/components/auth';
import { Text } from '~/components/ui/text';

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const emailValue = watch('email');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await forgotPassword(data.email);

      if (error) {
        Alert.alert('Reset Failed', error.message);
      } else {
        setEmailSent(true);
      }
    } catch (error) {
      console.warn(error);
      Alert.alert(
        'Reset Failed',
        'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailValue) return;

    setIsLoading(true);

    try {
      const { error } = await forgotPassword(emailValue);

      if (error) {
        Alert.alert('Resend Failed', error.message);
      } else {
        Alert.alert(
          'Email Sent',
          'A new reset link has been sent to your email.',
        );
      }
    } catch (error) {
      console.warn(error);
      Alert.alert(
        'Resend Failed',
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
                {emailSent ? 'Check Your Email' : 'Reset Password'}
              </Text>
              <Text className="text-center text-muted-foreground mt-2">
                {emailSent
                  ? 'We sent a password reset link to your email'
                  : 'Enter your email to receive a password reset link'}
              </Text>
            </View>

            {emailSent ? (
              <View className="space-y-4">
                <Text className="text-center text-sm text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or try
                  again.
                </Text>

                <AuthButton
                  onPress={handleResend}
                  isLoading={isLoading}
                  loadingText="Sending..."
                  variant="outline"
                  className="mt-4"
                >
                  Resend Email
                </AuthButton>

                <AuthButton
                  onPress={() => setEmailSent(false)}
                  variant="ghost"
                  className="mt-2"
                >
                  Try Different Email
                </AuthButton>
              </View>
            ) : (
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

                <AuthButton
                  onPress={handleSubmit(onSubmit)}
                  isLoading={isLoading}
                  loadingText="Sending..."
                  className="mt-6"
                >
                  Send Reset Link
                </AuthButton>
              </View>
            )}

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-muted-foreground">
                Remember your password?{' '}
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
