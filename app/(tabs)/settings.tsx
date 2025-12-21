import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, View } from 'react-native';
import { useSession } from '~/api/auth/auth-context';
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordFormData,
  type UpdateProfileFormData,
} from '~/api/auth/auth-schema';
import {
  deleteAccount,
  updatePassword,
  updateProfile,
} from '~/api/auth/auth-service';
import { AuthInput } from '~/components/auth';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';

export default function SettingsScreen() {
  const { session, signOut } = useSession();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
    reset: resetProfileForm,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: session?.user.user_metadata.name ?? '',
      email: session?.user.email ?? '',
    },
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
    watch: watchPasswordForm,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    resetProfileForm({
      name: session?.user.user_metadata.name ?? '',
      email: session?.user.email ?? '',
    });
  }, [session, resetProfileForm]);

  const onSaveProfile = async (data: UpdateProfileFormData) => {
    setIsSavingProfile(true);

    try {
      const name = data.name.trim();
      const email = data.email.trim();
      const { data: result, error } = await updateProfile(name, email);

      if (error) {
        Alert.alert('Update Failed', error.message);
        return;
      }

      const emailChanged = result?.user?.email !== session?.user.email;
      Alert.alert(
        'Profile Updated',
        emailChanged
          ? 'Check your inbox to confirm your new email address.'
          : 'Your profile details have been saved.',
      );
      resetProfileForm({ name, email });
    } catch (error) {
      console.warn(error);
      Alert.alert(
        'Update Failed',
        'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onChangePassword = async (data: ChangePasswordFormData) => {
    setIsSavingPassword(true);

    try {
      const { error } = await updatePassword(data.password);

      if (error) {
        Alert.alert('Change Failed', error.message);
        return;
      }

      Alert.alert(
        'Password Updated',
        'Your password has been changed successfully.',
      );
      resetPasswordForm({ password: '', confirmPassword: '' });
    } catch (error) {
      console.warn(error);
      Alert.alert(
        'Change Failed',
        'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently remove your account and associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDeleteAccount },
      ],
    );
  };

  const onDeleteAccount = async () => {
    if (!session?.user.id) {
      Alert.alert('Delete Failed', 'No active session found.');
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await deleteAccount(session.user.id);

      if (error) {
        Alert.alert('Delete Failed', error.message);
        return;
      }

      Alert.alert(
        'Account Deleted',
        'Your account has been deleted successfully.',
        [{ text: 'OK', onPress: () => signOut() }],
      );
    } catch (error) {
      console.warn(error);
      Alert.alert(
        'Delete Failed',
        'An unexpected error occurred. Please try again.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-[#F9F7F4]"
      contentContainerStyle={{ padding: 24, gap: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-3">
        <Text className="text-2xl font-bold text-foreground">Profile</Text>
        <Text className="text-muted-foreground">
          Update your display name and email address.
        </Text>

        <View className="mt-4 gap-4">
          <Controller
            control={profileControl}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthInput
                label="Display Name"
                placeholder="Enter your name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={profileErrors.name?.message}
                editable={!isSavingProfile}
              />
            )}
          />

          <Controller
            control={profileControl}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthInput
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={profileErrors.email?.message}
                editable={!isSavingProfile}
              />
            )}
          />

          <Button
            onPress={handleProfileSubmit(onSaveProfile)}
            disabled={isSavingProfile || !isProfileDirty}
            className="h-12"
          >
            <Text>
              {isSavingProfile ? 'Saving profile...' : 'Save profile changes'}
            </Text>
          </Button>
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-2xl font-bold text-foreground">Password</Text>
        <Text className="text-muted-foreground">
          Change your password without leaving the app.
        </Text>

        <View className="mt-4 gap-4">
          <Controller
            control={passwordControl}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthInput
                label="New Password"
                type="password"
                placeholder="Enter a new password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={passwordErrors.password?.message}
                editable={!isSavingPassword}
              />
            )}
          />

          <Controller
            control={passwordControl}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthInput
                label="Confirm New Password"
                type="password"
                placeholder="Confirm your new password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={passwordErrors.confirmPassword?.message}
                editable={!isSavingPassword}
              />
            )}
          />

          <Button
            onPress={handlePasswordSubmit(onChangePassword)}
            disabled={
              isSavingPassword ||
              (!watchPasswordForm('password') &&
                !watchPasswordForm('confirmPassword'))
            }
            className="h-12"
            variant="secondary"
          >
            <Text>
              {isSavingPassword ? 'Updating password...' : 'Update password'}
            </Text>
          </Button>
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-2xl font-bold text-foreground">Session</Text>
        <Text className="text-muted-foreground">
          Manage your account and session.
        </Text>

        <View className="mt-4 gap-3">
          <Button
            variant="outline"
            className="h-12"
            onPress={signOut}
            disabled={isDeleting}
          >
            <Text>Sign out</Text>
          </Button>
        </View>
      </View>

      <View className="gap-3">
        <Text className="text-2xl font-bold text-destructive">Danger zone</Text>
        <Text className="text-muted-foreground">
          Permanently delete your account and all related data.
        </Text>

        <View className="mt-4 gap-3">
          <Button
            variant="destructive"
            className="h-12"
            onPress={confirmDelete}
            disabled={isDeleting}
          >
            <Text>{isDeleting ? 'Deleting account...' : 'Delete account'}</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
