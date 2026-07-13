import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { createDate } from '~/api/dates/dates-service';
import { createPerson } from '~/api/people/people-service';
import {
  type CreatePersonForm,
  createPersonSchema,
} from '~/api/people/person-schema';
import { toStorageDate } from '~/lib/dates';

// Placeholder until real analytics lands; silent so it doesn't spam the console
const trackEvent = (_event: Record<string, unknown>) => {};

/**
 * Shared state + save flow behind add-person, mirroring the
 * use-entry-form pattern: the iOS modal screen and the Android HeroUI
 * sheet are just two skins over this hook.
 */
export function useAddPersonForm() {
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

    // The keyboard outlives the Android sheet otherwise (same gotcha as
    // the entry sheet). KeyboardController, not RN's Keyboard: dismiss()
    // there only blurs the *tracked* focused input, and the sheet's
    // resize on the birthday toggle loses that tracking — the IME stays
    // up while RN thinks nothing is focused. This hides it window-level.
    KeyboardController.dismiss();

    // Land on the new person: the natural next step is adding facts,
    // and that's where the entry sheet lives
    router.dismiss();
    router.push({
      pathname: '/(tabs)/(people)/person/[id]',
      params: { id: response.data.id },
    });
  };

  return {
    control,
    errors,
    isValid,
    initial,
    withBirthday,
    setWithBirthday,
    birthday,
    setBirthday,
    includeYear,
    setIncludeYear,
    save: handleSubmit(onSubmit),
  };
}

export type AddPersonForm = ReturnType<typeof useAddPersonForm>;
