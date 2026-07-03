import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, Switch, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { createDate } from '~/api/dates/dates-service';
import { createPerson } from '~/api/people/people-service';
import {
  type CreatePersonForm,
  createPersonSchema,
} from '~/api/people/person-schema';
import { BirthdayDateRow } from '~/components/person/birthday-date-row';
import { PersonIcon } from '~/components/ui/icons';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { toStorageDate } from '~/lib/dates';
import { palette, shadows } from '~/lib/theme';

// Placeholder until real analytics lands; silent so it doesn't spam the console
const trackEvent = (_event: Record<string, unknown>) => {};

const cardStyle = {
  borderCurve: 'continuous',
  boxShadow: shadows.whisper,
} as const;

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
  } = useForm<CreatePersonForm>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: {
      name: '',
    },
    mode: 'onChange',
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const initial = watch('name').trim().charAt(0).toUpperCase();

  useEffect(() => {
    trackEvent({ type: 'person_create_started' });
  }, []);

  const onSubmit = (data: CreatePersonForm) => {
    const response = createPerson({ name: data.name.trim() });

    if (response.error || !response.data) {
      trackEvent({
        type: 'person_create_error',
        errorCode: response.error?.code,
        errorMessage: response.error?.message,
      });

      const errorMessage =
        response.error?.code === 'VALIDATION_ERROR'
          ? 'Please check the name and try again.'
          : "Something went wrong and this person couldn't be saved.";

      Alert.alert("Couldn't add person", errorMessage, [
        { text: 'OK', style: 'cancel' },
        { text: 'Retry', onPress: () => onSubmit(data) },
      ]);
      return;
    }

    trackEvent({
      type: 'person_create_success',
      personId: response.data.id,
    });

    if (withBirthday) {
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

    // Land on the new person: the natural next step is adding facts,
    // and that's where the entry sheet lives
    router.dismiss();
    router.push({
      pathname: '/(tabs)/(people)/person/[id]',
      params: { id: response.data.id },
    });
  };

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          tintColor={palette.broth}
          onPress={() => router.back()}
        >
          Cancel
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          variant="done"
          tintColor={palette.broth}
          disabled={!isValid}
          onPress={handleSubmit(onSubmit)}
        >
          Add
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <ScrollView
        className="flex-1 bg-paper"
        contentContainerClassName="gap-4 p-4"
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        {/* Live avatar preview: the standard avatar geometry, scaled up */}
        <View className="items-center py-3">
          <View
            className="items-center justify-center rounded-full bg-cream-swirl"
            style={{ width: 72, height: 72 }}
          >
            {initial ? (
              <Text className="text-3xl font-semibold text-broth">
                {initial}
              </Text>
            ) : (
              <PersonIcon size={30} color={palette.broth} />
            )}
          </View>
        </View>

        <View className="rounded-2xl bg-white" style={cardStyle}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Name"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                autoFocus
                maxLength={60}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                accessibilityLabel="Person's name"
                className="border-0 bg-transparent px-4"
              />
            )}
          />
        </View>
        {errors.name && (
          <Text className="-mt-2 px-4 text-sm text-destructive">
            {errors.name.message}
          </Text>
        )}

        <View className="rounded-2xl bg-white" style={cardStyle}>
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-base">Birthday</Text>
            <Switch
              value={withBirthday}
              onValueChange={setWithBirthday}
              trackColor={{ true: palette.noodleGold }}
            />
          </View>
          {withBirthday && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
              <BirthdayDateRow
                date={birthday}
                includeYear={includeYear}
                onChange={setBirthday}
              />
              <View className="flex-row items-center justify-between border-t border-black/5 px-4 py-3">
                <Text className="text-base">Include year</Text>
                <Switch
                  value={includeYear}
                  onValueChange={setIncludeYear}
                  trackColor={{ true: palette.noodleGold }}
                />
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
