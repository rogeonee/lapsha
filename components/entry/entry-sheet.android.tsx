import { DatePickerDialog, Host } from '@expo/ui/jetpack-compose';
import { useRouter } from 'expo-router';
import { BottomSheet } from 'heroui-native/bottom-sheet';
import { Button } from 'heroui-native/button';
import { useBottomSheetAwareHandlers } from 'heroui-native/hooks';
import { Input } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { Select } from 'heroui-native/select';
import { Switch } from 'heroui-native/switch';
import { Tabs } from 'heroui-native/tabs';
import { TextField } from 'heroui-native/text-field';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { KeyboardEvents } from 'react-native-keyboard-controller';
import {
  useEntryForm,
  type EntryKind,
  type EntrySheetConfig,
} from '~/components/entry/use-entry-form';
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

  // The sheet stays mounted: HeroUI's bottom sheet only animates open on
  // an isOpen false -> true transition, so mounting it already-open
  // (mount-on-demand) would leave it permanently closed.
  return (
    <BottomSheet
      isOpen={config !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          keyboardBehavior="interactive"
          // gorhom defaults to adjustPan on Android, which leaves the
          // sheet behind the keyboard; adjustResize lets it track height
          android_keyboardInputMode="adjustResize"
        >
          {rendered && (
            <EntryForm
              key={rendered.nonce}
              config={rendered.config}
              onClose={onClose}
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
}: {
  config: EntrySheetConfig;
  onClose: () => void;
}) {
  const router = useRouter();
  const form = useEntryForm(config, onClose);
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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
        <Select
          // Must match Select.Content's presentation or HeroUI throws
          presentation="dialog"
          value={
            selectedPerson
              ? { value: selectedPerson.id, label: selectedPerson.name }
              : undefined
          }
          onValueChange={(option) => {
            if (option && !Array.isArray(option)) {
              form.setPersonId(String(option.value));
            }
          }}
        >
          <Select.Trigger>
            <Select.Value placeholder="Person" />
            <Select.TriggerIndicator />
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay />
            <Select.Content presentation="dialog">
              {form.people.map((p) => (
                <Select.Item key={p.id} value={p.id} label={p.name} />
              ))}
            </Select.Content>
          </Select.Portal>
        </Select>
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
              placeholder="The fact itself"
              defaultValue={form.initialFactValue}
              onChangeText={form.setFactValue}
              autoFocus={config.mode === 'create'}
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
