import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { supabase } from '~/api/supabase';

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign up with name, email, password, and optional phone
 */
export async function signUp(
  name: string,
  email: string,
  password: string,
  phone?: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        ...(phone && { phone }),
      },
    },
  });

  if (data.user && !data.session && !error) {
    Alert.alert(
      'Check your email',
      'We sent you a confirmation link. Please check your inbox and click the link to verify your account.',
      [{ text: 'OK' }],
    );
  }

  return { data, error };
}

/**
 * Send password reset email
 */
export async function forgotPassword(email: string) {
  const redirectTo = Linking.createURL('/reset-password');

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (!error) {
    Alert.alert(
      'Password reset email sent',
      'Check your inbox for a link to reset your password.',
      [{ text: 'OK' }],
    );
  }

  return { data, error };
}

/**
 * Update user profile (name and email)
 */
export async function updateProfile(name: string, email: string) {
  const { data, error } = await supabase.auth.updateUser({
    email,
    data: { name },
  });

  return { data, error };
}

/**
 * Update the current user's password
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

/**
 * Delete the current user's account via a secure backend (Edge Function/API)
 */
export async function deleteAccount(userId: string) {
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { userId },
  });

  return { data, error };
}
