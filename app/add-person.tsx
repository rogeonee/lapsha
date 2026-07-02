import { DatePicker, Host } from '@expo/ui/swift-ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, Switch, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { createDate } from '~/api/dates/dates-service';
import { createPerson } from '~/api/people/people-service';
import {
  type CreatePersonForm,
  createPersonSchema,
} from '~/api/people/person-schema';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
import { toStorageDate } from '~/lib/dates';

// placeholder analytic fn
const trackEvent = (event: any) => {
  console.log('Analytics event:', event);
  // TODO: Implement actual analytics tracking
};

export default function AddPersonModal() {
  const router = useRouter();
  const [withBirthday, setWithBirthday] = useState(false);
  const [birthday, setBirthday] = useState(() => new Date());
  const [includeYear, setIncludeYear] = useState(true);

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

  // eslint-disable-next-line react-hooks/incompatible-library
  const nameValue = watch('name');

  useEffect(() => {
    trackEvent({ type: 'person_create_started' });
  }, []);

  const onSubmit = (data: CreatePersonForm) => {
    const response = createPerson({ name: data.name.trim() });

    if (response.error) {
      console.error('Failed to create person:', response.error);

      trackEvent({
        type: 'person_create_error',
        errorCode: response.error.code,
        errorMessage: response.error.message,
      });

      const errorMessage =
        response.error.code === 'VALIDATION_ERROR'
          ? 'Please check your input and try again.'
          : 'Failed to add person. Please try again.';

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

    if (withBirthday && response.data) {
      const dateResponse = createDate({
        person_id: response.data.id,
        label: 'Birthday',
        date: toStorageDate(birthday, includeYear),
      });

      if (dateResponse.error) {
        Alert.alert(
          'Person saved',
          "The birthday couldn't be added — you can add it from their screen.",
        );
      }
    }

    reset();

    // close modal and return to people tab
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-paper">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 pt-16">
        <Text className="text-lg font-semibold">Add New Person</Text>
        <Button
          variant="outline"
          size="sm"
          onPress={handleClose}
          className="border-border bg-transparent"
        >
          <Text className="text-muted-foreground">×</Text>
        </Button>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 p-6"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
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
                className={errors.name ? 'border-destructive' : ''}
              />
            )}
          />
          {errors.name && (
            <Text className="mt-1 text-sm text-destructive">
              {errors.name.message}
            </Text>
          )}
          <Text className="mt-1 text-xs text-muted-foreground">
            This is the name that will appear in your people list
          </Text>
        </View>

        {/* Optional birthday */}
        <View className="mb-6 gap-3">
          <View className="flex-row items-center justify-between">
            <Label>Birthday</Label>
            <Switch value={withBirthday} onValueChange={setWithBirthday} />
          </View>
          {withBirthday && (
            <View className="gap-3">
              <Host matchContents>
                <DatePicker
                  selection={birthday}
                  displayedComponents={['date']}
                  onDateChange={setBirthday}
                />
              </Host>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">
                  Include year
                </Text>
                <Switch value={includeYear} onValueChange={setIncludeYear} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Save Button: rides above the keyboard via translation */}
      <KeyboardStickyView>
        <View className="mb-6 border-t border-border bg-paper p-6">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || !nameValue?.trim()}
            className="w-full"
          >
            <Text className="font-medium text-white">Add Person</Text>
          </Button>
        </View>
      </KeyboardStickyView>
    </View>
  );
}
