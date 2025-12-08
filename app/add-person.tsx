import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, View } from 'react-native';
import { useSession } from '~/api/auth/auth-context';
import { createPerson } from '~/api/people/people-service';
import {
  CreatePersonForm,
  createPersonSchema,
} from '~/api/people/person-schema';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';

// placeholder analytic fn
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
    reset,
  } = useForm<CreatePersonForm>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  const nameValue = watch('name');

  useEffect(() => {
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

      const response = await createPerson(personData);

      if (response.error) {
        console.error('Failed to create person:', response.error);

        trackEvent({
          type: 'person_create_error',
          errorCode: response.error.code,
          errorMessage: response.error.message,
        });

        let errorMessage = 'Failed to add person. Please try again.';
        if (response.error.code === 'VALIDATION_ERROR') {
          errorMessage = 'Please check your input and try again.';
        } else if (response.error.code === 'FORBIDDEN') {
          errorMessage = "You don't have permission to add people.";
        } else if (response.error.code === 'CONNECTION_ERROR') {
          errorMessage =
            'Network error. Please check your connection and try again.';
        }

        Alert.alert('Error', errorMessage, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => onSubmit(data) },
        ]);
        return;
      }

      trackEvent({
        type: 'person_create_success',
        personId: response.data?.id,
      });

      reset();

      // close modal and return to people tab
      router.back();
    } catch (error) {
      console.error('Unexpected error creating person:', error);

      trackEvent({
        type: 'person_create_error',
        errorCode: 'UNEXPECTED_ERROR',
        errorMessage: error instanceof Error ? error.message : 'unknown',
      });

      Alert.alert('Error', 'An unexpected error occurred. Please try again.', [
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
          disabled={isSubmitting}
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
                editable={!isSubmitting}
              />
            )}
          />
          {errors.name && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.name.message}
            </Text>
          )}
          <Text className="text-xs text-muted-foreground mt-1">
            This is the name that will appear in your people list
          </Text>
        </View>

        {/* Future fields placeholder */}
        <View className="mb-6">
          <Text className="text-sm text-muted-foreground">
            More fields like photo, birthday, and notes will be available soon!
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Save Button */}
      <View className="p-6 mb-6 border-t border-gray-200 bg-[#F9F7F4]">
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || !nameValue?.trim() || isSubmitting}
          className="w-full"
        >
          <Text className="text-white font-medium">
            {isSubmitting ? 'Adding Person...' : 'Add Person'}
          </Text>
        </Button>

        {isSubmitting && (
          <Text className="text-xs text-muted-foreground text-center mt-2">
            Please wait while we add this person to your list
          </Text>
        )}
      </View>
    </View>
  );
}
