import { useRouter } from 'expo-router';
import { BottomSheet } from 'heroui-native/bottom-sheet';
import { Button } from 'heroui-native/button';
import { useBottomSheetAwareHandlers } from 'heroui-native/hooks';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Controller } from 'react-hook-form';
import { Pressable, View, type TextInput } from 'react-native';
import {
  KeyboardController,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Avatar } from '~/components/person/avatar';
import { BirthdayDateRow } from '~/components/person/birthday-date-row';
import { useAddPersonForm } from '~/components/person/use-add-person-form';
import { Switch } from '~/components/ui/switch';
import { Text } from '~/components/ui/text';

/**
 * Android add-person: the same HeroUI bottom sheet as the entry sheet —
 * one Android sheet vocabulary everywhere. Mounted by the /add-person
 * route (transparentModal); closing the sheet pops the route.
 */
export function AddPersonSheet() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HeroUI's bottom sheet only animates open on an isOpen false -> true
  // transition, AND gorhom silently drops the snapToIndex call that
  // transition triggers if the sheet hasn't measured its content yet. So
  // the route mounts the sheet closed and flips it open on the content's
  // first onLayout — the earliest moment the open animation can stick.
  const [isOpen, setIsOpen] = useState(false);
  const contentMeasured = useRef(false);
  const handleContentLayout = () => {
    if (!contentMeasured.current) {
      contentMeasured.current = true;
      setIsOpen(true);
    }
  };

  // The keyboard outlives the sheet otherwise (overlay tap, swipe).
  // KeyboardController rather than RN Keyboard — see use-add-person-form.
  // canGoBack guards the deep-link case where this route is the only one
  // in the stack — back() there throws GO_BACK into the void.
  const handleClose = () => {
    KeyboardController.dismiss();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // Autofocus fires at animation start (onAnimate), not on settle — same
  // timing rationale as the entry sheet
  const [opening, setOpening] = useState(false);

  // HeroUI makes one snapToIndex call when isOpen flips. Gorhom drops it
  // when its own container/handle layout is not ready, even if our form has
  // already laid out, so retry briefly until the animation actually starts.
  const sheetRef = useRef<ComponentRef<typeof BottomSheet.Content>>(null);
  const hasOpened = useRef(false);
  useEffect(() => {
    if (!isOpen || hasOpened.current) return;

    let attempts = 0;
    const retry = setInterval(() => {
      if (hasOpened.current || attempts >= 20) {
        clearInterval(retry);
        return;
      }

      attempts += 1;
      sheetRef.current?.snapToIndex(0);
    }, 50);

    return () => clearInterval(retry);
  }, [isOpen]);

  // The sheet emits onOpenChange(false) while mounting closed. Ignore only
  // that event; once opening has been requested, every close path must pop
  // the transparent route even if the open animation was dropped.
  const closing = useRef(false);

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (open) {
          setIsOpen(true);
          return;
        }
        if (!isOpen || isSubmitting || closing.current) return;

        closing.current = true;
        setIsOpen(false);
        handleClose();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          ref={sheetRef}
          keyboardBehavior="interactive"
          // Keeps gorhom's own keyboard lift inert (its in-container
          // height math is broken under the root KeyboardProvider), so
          // it can't fight the KeyboardEvents padding in SheetForm
          android_keyboardInputMode="adjustResize"
          enablePanDownToClose={!isSubmitting}
          onAnimate={(_fromIndex, toIndex) => {
            if (toIndex >= 0) {
              hasOpened.current = true;
            }
            setOpening(toIndex >= 0);
          }}
        >
          <SheetForm
            canFocus={opening}
            onLayout={handleContentLayout}
            onSubmittingChange={setIsSubmitting}
          />
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

function SheetForm({
  canFocus,
  onLayout,
  onSubmittingChange,
}: {
  canFocus: boolean;
  onLayout: () => void;
  onSubmittingChange: (isSubmitting: boolean) => void;
}) {
  const form = useAddPersonForm();
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();

  useEffect(() => {
    onSubmittingChange(form.isSubmitting);
  }, [form.isSubmitting, onSubmittingChange]);

  // Autofocus the name field shortly after the open animation starts:
  // the head start lets the sheet establish its spring before dynamic
  // sizing retargets it for the keyboard (see entry-sheet.android)
  const nameInputRef = useRef<TextInput>(null);
  const focusedOnce = useRef(false);
  useEffect(() => {
    if (canFocus && !focusedOnce.current) {
      focusedOnce.current = true;
      const timer = setTimeout(() => nameInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [canFocus]);

  // Keyboard avoidance: pad the content from keyboard-controller's
  // animated height (per-frame, UI thread); dynamic sizing re-snaps the
  // sheet above it. Same pattern as the entry sheet.
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const keyboardPad = useAnimatedStyle(() => ({
    // height runs 0 -> -keyboardHeight as the keyboard animates in
    paddingBottom: Math.max(0, -keyboardHeight.value),
  }));

  return (
    <Animated.View
      className="gap-5 pb-2"
      style={keyboardPad}
      onLayout={onLayout}
    >
      {/* Live avatar preview doubles as the photo picker */}
      <View className="items-center pt-1">
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

      <Controller
        control={form.control}
        name="name"
        render={({ field: { onChange, onBlur: fieldBlur, value } }) => (
          <TextField>
            <Label>New person</Label>
            <Input
              ref={nameInputRef}
              placeholder="Name"
              value={value}
              onChangeText={onChange}
              maxLength={60}
              autoCapitalize="words"
              autoComplete="name"
              accessibilityLabel="Person's name"
              onFocus={onFocus}
              onBlur={(event) => {
                fieldBlur();
                onBlur(event);
              }}
            />
          </TextField>
        )}
      />
      {form.errors.name && (
        <Text className="-mt-3 px-1 text-sm text-destructive">
          {form.errors.name.message}
        </Text>
      )}

      <View className="flex-row items-center justify-between px-1">
        <Text className="text-base">Birthday</Text>
        <Switch
          value={form.withBirthday}
          onValueChange={form.setWithBirthday}
        />
      </View>
      {form.withBirthday && (
        <Animated.View
          className="gap-5"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <BirthdayDateRow
            date={form.birthday}
            includeYear={form.includeYear}
            onChange={form.setBirthday}
          />
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-base">Include year</Text>
            <Switch
              value={form.includeYear}
              onValueChange={form.setIncludeYear}
            />
          </View>
        </Animated.View>
      )}

      <Button
        isDisabled={!form.isValid || form.isSubmitting}
        onPress={form.save}
      >
        Add person
      </Button>
    </Animated.View>
  );
}
