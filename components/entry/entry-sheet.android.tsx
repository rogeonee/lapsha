import { DatePickerDialog, Host } from '@expo/ui/jetpack-compose';
import { useRouter } from 'expo-router';
import { BottomSheet } from 'heroui-native/bottom-sheet';
import { Button } from 'heroui-native/button';
import { useBottomSheetAwareHandlers } from 'heroui-native/hooks';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { Switch } from 'heroui-native/switch';
import { Tabs } from 'heroui-native/tabs';
import { TextField } from 'heroui-native/text-field';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, View, type TextInput } from 'react-native';
import { KeyboardEvents } from 'react-native-keyboard-controller';
import {
  useEntryForm,
  type EntryKind,
  type EntrySheetConfig,
} from '~/components/entry/use-entry-form';
import { CheckIcon, ChevronRightIcon } from '~/components/ui/icons';
import { Text } from '~/components/ui/text';

export type { EntrySheetConfig };

/**
 * Android entry sheet: HeroUI bottom sheet with Material pickers.
 * Same contract as the iOS SwiftUI sheet — pass a config to open,
 * null to dismiss.
 */
export function EntrySheet({
  config,
  onClose,
}: {
  config: EntrySheetConfig | null;
  onClose: () => void;
}) {
  // Keep the last config (+ a nonce to reset form state per open) so the
  // sheet content stays rendered during the dismiss animation
  const [rendered, setRendered] = useState<{
    config: EntrySheetConfig;
    nonce: number;
  } | null>(null);

  if (config && config !== rendered?.config) {
    // Derived state: adjust during render when a new config arrives
    setRendered({ config, nonce: (rendered?.nonce ?? 0) + 1 });
  }

  // The keyboard outlives the sheet otherwise (overlay tap, save, swipe)
  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  // Settled signal drives the deferred autofocus: focusing during the
  // open animation makes the sheet and keyboard race (visible stutter)
  const [settled, setSettled] = useState(false);

  // The sheet stays mounted: HeroUI's bottom sheet only animates open on
  // an isOpen false -> true transition, so mounting it already-open
  // (mount-on-demand) would leave it permanently closed.
  return (
    <BottomSheet
      isOpen={config !== null}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          keyboardBehavior="interactive"
          // Keeps gorhom's own keyboard lift inert (its in-container
          // height math is broken under the root KeyboardProvider), so
          // it can't fight the KeyboardEvents padding in EntryForm
          android_keyboardInputMode="adjustResize"
          onChange={(index) => setSettled(index >= 0)}
        >
          {rendered && (
            <EntryForm
              key={rendered.nonce}
              config={rendered.config}
              onClose={handleClose}
              canFocus={settled}
            />
          )}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

function EntryForm({
  config,
  onClose,
  canFocus,
}: {
  config: EntrySheetConfig;
  onClose: () => void;
  canFocus: boolean;
}) {
  const router = useRouter();
  const form = useEntryForm(config, onClose);
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [personListOpen, setPersonListOpen] = useState(false);

  // Deferred autofocus: focus the fact field once the sheet has settled
  const factInputRef = useRef<TextInput>(null);
  const focusedOnce = useRef(false);
  useEffect(() => {
    if (canFocus && !focusedOnce.current && config.mode === 'create') {
      focusedOnce.current = true;
      factInputRef.current?.focus();
    }
  }, [canFocus, config.mode]);

  // Keyboard avoidance: react-native-keyboard-controller owns the window
  // insets (root KeyboardProvider), which starves gorhom's own keyboard
  // tracking — its computed in-container height resolves to 0 and the
  // sheet never lifts. Pad the content from keyboard-controller's events
  // instead; dynamic sizing re-snaps the sheet above the keyboard.
  const [keyboardPad, setKeyboardPad] = useState(0);
  useEffect(() => {
    const show = KeyboardEvents.addListener('keyboardWillShow', (e) =>
      setKeyboardPad(e.height),
    );
    const hide = KeyboardEvents.addListener('keyboardWillHide', () =>
      setKeyboardPad(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (form.showPersonPicker && form.people.length === 0) {
    return (
      <View className="gap-4 pb-2">
        <BottomSheet.Title>Add a person first</BottomSheet.Title>
        <BottomSheet.Description>
          Add a person first — then save facts and dates about them.
        </BottomSheet.Description>
        <Button
          onPress={() => {
            onClose();
            router.push('/add-person');
          }}
        >
          Add a person
        </Button>
      </View>
    );
  }

  const selectedPerson = form.people.find((p) => p.id === form.personId);

  return (
    <View className="gap-5 pb-2" style={{ paddingBottom: keyboardPad }}>
      {form.showPersonPicker && (
        // Inline expanding picker. HeroUI Select's overlays all misbehave
        // inside the sheet (popover renders broken, dialog floats over
        // the form, nested bottom sheet is poor UX); expanding in place
        // keeps one surface and dynamic sizing grows the sheet with it.
        <View className="rounded-xl bg-secondary">
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setPersonListOpen((open) => !open);
            }}
            className="flex-row items-center justify-between px-4 py-3"
            accessibilityLabel="Choose person"
          >
            <Text className="text-base">
              {selectedPerson?.name ?? 'Person'}
            </Text>
            <View
              style={{
                transform: [{ rotate: personListOpen ? '270deg' : '90deg' }],
              }}
            >
              <ChevronRightIcon color="#8A8577" />
            </View>
          </Pressable>
          {personListOpen &&
            form.people.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  form.setPersonId(p.id);
                  setPersonListOpen(false);
                }}
                className="flex-row items-center justify-between border-t border-black/5 px-4 py-3 active:bg-black/5"
              >
                <Text className="text-base">{p.name}</Text>
                {p.id === form.personId && <CheckIcon color="#B07818" />}
              </Pressable>
            ))}
        </View>
      )}

      {config.mode === 'create' && (
        <Tabs
          value={form.kind}
          onValueChange={(value) => form.setKind(value as EntryKind)}
        >
          <Tabs.List>
            <Tabs.Indicator />
            <Tabs.Trigger value="fact">
              <Tabs.Label>Fact</Tabs.Label>
            </Tabs.Trigger>
            <Tabs.Trigger value="date">
              <Tabs.Label>Date</Tabs.Label>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      )}

      {form.kind === 'fact' ? (
        <>
          <TextField>
            <Label>{form.editFact ? 'Edit fact' : 'New fact'}</Label>
            <Input
              ref={factInputRef}
              placeholder="The fact itself"
              defaultValue={form.initialFactValue}
              onChangeText={form.setFactValue}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </TextField>
          <TextField>
            <Label>Label (optional)</Label>
            <Input
              placeholder="e.g. Coffee order"
              defaultValue={form.initialFactLabel}
              onChangeText={form.setFactLabel}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </TextField>
        </>
      ) : (
        <>
          <TextField>
            <Label>{form.editDate ? 'Edit date' : 'New date'}</Label>
            <Input
              placeholder="Label (e.g. Wedding anniversary)"
              defaultValue={form.initialDateLabel}
              onChangeText={form.setDateLabel}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </TextField>

          <Pressable
            onPress={() => setDatePickerOpen(true)}
            className="flex-row items-center justify-between rounded-xl bg-secondary px-4 py-3"
          >
            <Text className="text-sm text-muted-foreground">Date</Text>
            <Text className="text-base">
              {form.pickedDate.toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                ...(form.includeYear ? { year: 'numeric' } : {}),
              })}
            </Text>
          </Pressable>
          {datePickerOpen && (
            // The dialog renders in its own window; the Host is zero-size
            <Host style={{ position: 'absolute', width: 0, height: 0 }}>
              <DatePickerDialog
                initialDate={form.pickedDate.toISOString()}
                variant="picker"
                showVariantToggle={false}
                color="#F6B756"
                onDateSelected={(date) => {
                  // Material 3 returns UTC-midnight millis; re-read the
                  // date in UTC or it shifts a day in western timezones
                  form.setPickedDate(
                    new Date(
                      date.getUTCFullYear(),
                      date.getUTCMonth(),
                      date.getUTCDate(),
                    ),
                  );
                  setDatePickerOpen(false);
                }}
                onDismissRequest={() => setDatePickerOpen(false)}
              />
            </Host>
          )}

          <View className="flex-row items-center justify-between px-1">
            <Text className="text-base">Include year</Text>
            <Switch
              isSelected={form.includeYear}
              onSelectedChange={form.setIncludeYear}
            />
          </View>
        </>
      )}

      <Button isDisabled={!form.isValid} onPress={form.handleSave}>
        {config.mode === 'edit' ? 'Save changes' : 'Save'}
      </Button>
    </View>
  );
}
