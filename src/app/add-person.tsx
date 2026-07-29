import { Stack, useRouter } from 'expo-router';
import { Controller } from 'react-hook-form';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import AddPersonSheet from '~/components/person/add-person-sheet';
import { Avatar } from '~/components/person/avatar';
import BirthdayDateRow from '~/components/person/birthday-date-row';
import { useAddPersonForm } from '~/components/person/use-add-person-form';
import { Input } from '~/components/ui/input';
import Switch from '~/components/ui/switch';
import { Text } from '~/components/ui/text';
import { palette, shadows } from '~/lib/theme';

const isIOS = process.env.EXPO_OS === 'ios';

const cardStyle = {
  borderCurve: 'continuous',
  boxShadow: shadows.whisper,
} as const;

export default function AddPersonModal() {
  // Android renders the HeroUI bottom sheet (the app's Android sheet
  // vocabulary, shared with quick add); the route itself is a
  // transparentModal that the sheet pops on close
  if (!isIOS) {
    return <AddPersonSheet />;
  }
  return <AddPersonScreen />;
}

/** iOS: native pageSheet modal with header bar buttons (Contacts-style). */
function AddPersonScreen() {
  const router = useRouter();
  const form = useAddPersonForm();

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          tintColor={palette.broth}
          disabled={form.isSubmitting}
          onPress={() => router.back()}
        >
          Cancel
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          variant="done"
          tintColor={palette.broth}
          disabled={!form.isValid || form.isSubmitting}
          onPress={form.save}
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
        {/* Live avatar preview doubles as the photo picker */}
        <View className="items-center py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={form.photoUri ? 'Change photo' : 'Add photo'}
            disabled={form.isSubmitting}
            onPress={form.onAvatarPress}
            className="items-center gap-2 active:opacity-80"
          >
            <Avatar name={form.initial} photo={form.photoUri} size={72} />
            <Text className="text-base text-broth">
              {form.photoUri ? 'Change photo' : 'Add photo'}
            </Text>
          </Pressable>
        </View>

        <View className="rounded-2xl bg-white" style={cardStyle}>
          <Controller
            control={form.control}
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
                onSubmitEditing={form.save}
                accessibilityLabel="Person's name"
                className="border-0 bg-transparent px-4"
              />
            )}
          />
        </View>
        {form.errors.name && (
          <Text className="-mt-2 px-4 text-sm text-destructive">
            {form.errors.name.message}
          </Text>
        )}

        <View className="rounded-2xl bg-white" style={cardStyle}>
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-base">Birthday</Text>
            <Switch
              value={form.withBirthday}
              onValueChange={form.setWithBirthday}
            />
          </View>
          {form.withBirthday && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
              <BirthdayDateRow
                date={form.birthday}
                includeYear={form.includeYear}
                onChange={form.setBirthday}
              />
              <View className="flex-row items-center justify-between border-t border-black/5 px-4 py-3">
                <Text className="text-base">Include year</Text>
                <Switch
                  value={form.includeYear}
                  onValueChange={form.setIncludeYear}
                />
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
