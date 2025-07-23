import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, View } from 'react-native';
import { useSession } from '~/auth/auth-context';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
import { createPerson } from '~/lib/people-service';
import { CreatePersonForm, createPersonSchema } from '~/lib/person-schema';

// Analytics tracking function (placeholder for now)
const trackEvent = (event: any) => {
  console.log('Analytics event:', event);
  // TODO: Implement actual analytics tracking
};

export default function AddPersonModal() {
  const router = useRouter();
  const { session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<CreatePersonForm>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: {
      name: '',
      photo_url: null,
    },
    mode: 'onChange',
  });

  const nameValue = watch('name');

  React.useEffect(() => {
    // Track modal open event
    trackEvent({ type: 'person_create_started' });
  }, []);

  const onSubmit = async (data: CreatePersonForm) => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'You must be signed in to add people.');
      return;
    }

    setIsSubmitting(true);

    try {
      const personData = {
        user_id: session.user.id,
        name: data.name.trim(),
      };

      const { error } = await createPerson(personData);

      if (error) {
        throw error;
      }

      // Close modal and return to people tab
      // Note: In a real app, you might want to pass the person.id back
      router.back();
    } catch (error) {
      console.error('Failed to create person:', error);

      trackEvent({
        type: 'person_create_error',
        errorCode: error instanceof Error ? error.message : 'unknown',
      });

      Alert.alert('Error', 'Failed to add person. Please try again.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: () => onSubmit(data) },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-[#F9F7F4]">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 pt-16 border-red-500 border-gray-200">
        <Text className="text-lg font-semibold">Add New Person</Text>
        <Button
          variant="outline"
          size="sm"
          onPress={handleClose}
          className="bg-transparent border-gray-300"
        >
          <Text className="text-gray-600">×</Text>
        </Button>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-6">
        {/* Name Input */}
        <View className="mb-6">
          <Label htmlFor="name" className="mb-2">
            Name
          </Label>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                id="name"
                placeholder="Enter person's name"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                autoFocus
                maxLength={60}
                accessibilityLabel="Person's name"
                className={errors.name ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.name && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.name.message}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Sticky Save Button */}
      <View className="p-6 border-t border-gray-200 bg-[#F9F7F4]">
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || !nameValue?.trim() || isSubmitting}
          className="w-full"
        >
          <Text className="text-white font-medium">
            {isSubmitting ? 'Saving...' : 'Save Person'}
          </Text>
        </Button>
      </View>
    </View>
  );
}
