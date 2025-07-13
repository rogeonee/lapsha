import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

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
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'your-app://reset-password', // TODO: update with dev build
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
