import { zodResolver } from '@hookform/resolvers/zod';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '~/api/auth/auth-schema';
import { supabase } from '~/api/supabase';
import { AuthButton, AuthInput } from '~/components/auth';
import { Text } from '~/components/ui/text';

type RecoveryTokens = {
  access_token: string;
  refresh_token: string;
};

function extractTokens(url: string | null): RecoveryTokens | null {
  if (!url) return null;
  const hash = url.split('#')[1];
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export default function ResetPassword() {
  const [isVerifyingLink, setIsVerifyingLink] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    let isMounted = true;

    const applyTokens = async (url: string | null) => {
      const tokens = extractTokens(url);
      if (!tokens) {
        if (isMounted) {
          setLinkError(
            'Open the password reset link from your email to continue.',
          );
        }
        return;
      }

      const { error } = await supabase.auth.setSession(tokens);
      if (error) {
        throw error;
      }
      if (isMounted) {
        setSessionReady(true);
      }
    };

    const init = async () => {
      setIsVerifyingLink(true);
      setLinkError(null);

      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSessionReady(true);
          return;
        }

        const initialUrl = await Linking.getInitialURL();
        await applyTokens(initialUrl);
      } catch (error) {
        console.warn(error);
        setLinkError(
          'We could not validate your reset link. Please request a new one.',
        );
      } finally {
        if (isMounted) {
          setIsVerifyingLink(false);
        }
      }
    };

    init();

    const subscription = Linking.addEventListener('url', async (event) => {
      setIsVerifyingLink(true);
      setLinkError(null);

      try {
        await applyTokens(event.url);
      } catch (error) {
        console.warn(error);
        setLinkError(
          'We could not validate your reset link. Please request a new one.',
        );
      } finally {
        if (isMounted) {
          setIsVerifyingLink(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        Alert.alert('Reset Failed', error.message);
        return;
      }

      Alert.alert(
        'Password Updated',
        'Your password has been reset. Please sign in with your new password.',
        [{ text: 'OK', onPress: () => router.replace('/sign-in') }],
      );

      await supabase.auth.signOut();
    } catch (error) {
      console.warn(error);
      Alert.alert(
        'Reset Failed',
        'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showForm = sessionReady && !isVerifyingLink && !linkError;

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
                Reset Password
              </Text>
              <Text className="text-center text-muted-foreground mt-2">
                {isVerifyingLink
                  ? 'Checking your reset link...'
                  : linkError
                    ? linkError
                    : 'Set a new password to continue'}
              </Text>
            </View>

            {showForm ? (
              <View className="space-y-4">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AuthInput
                      label="New Password"
                      type="password"
                      placeholder="Enter a new password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AuthInput
                      label="Confirm New Password"
                      type="password"
                      placeholder="Confirm your new password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.confirmPassword?.message}
                      editable={!isSubmitting}
                    />
                  )}
                />

                <AuthButton
                  onPress={handleSubmit(onSubmit)}
                  isLoading={isSubmitting}
                  loadingText="Updating password..."
                  className="mt-6"
                >
                  Update Password
                </AuthButton>
              </View>
            ) : (
              <View className="space-y-4">
                <AuthButton
                  onPress={() => router.replace('/forgot-password')}
                  variant="outline"
                  disabled={isVerifyingLink}
                >
                  Request a new reset link
                </AuthButton>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
