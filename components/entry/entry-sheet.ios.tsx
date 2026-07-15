import {
  BottomSheet,
  Button,
  DatePicker,
  Divider,
  Group,
  Host,
  HStack,
  Picker,
  Spacer,
  Text,
  TextField,
  Toggle,
  useNativeState,
  VStack,
} from '@expo/ui/swift-ui';
import {
  background,
  cornerRadius,
  disabled,
  font,
  foregroundStyle,
  frame,
  opacity,
  padding,
  pickerStyle,
  presentationBackground,
  presentationDragIndicator,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  useEntryForm,
  type EntryKind,
  type EntrySheetConfig,
} from '~/components/entry/use-entry-form';
import { palette } from '~/lib/theme';

// SwiftUI has no .infinity over the bridge; a huge maxWidth
// stretches a view to fill its container the same way
const FILL = 100000;

const sheetStackModifiers = [padding({ horizontal: 16, top: 20, bottom: 16 })];
const sheetTitleModifiers = [
  font({ textStyle: 'headline' }),
  foregroundStyle(palette.broth),
  frame({ maxWidth: FILL }),
];
const fieldCardModifiers = [
  padding({ horizontal: 16, vertical: 14 }),
  background(palette.cardWhite),
  cornerRadius(14),
];
const cardModifiers = [background(palette.cardWhite), cornerRadius(14)];
const fieldRowModifiers = [padding({ horizontal: 16, vertical: 14 })];
const controlRowModifiers = [
  padding({ horizontal: 16, vertical: 8 }),
  tint(palette.noodleGold),
];
const personRowModifiers = [
  padding({ horizontal: 16, vertical: 8 }),
  background(palette.cardWhite),
  cornerRadius(14),
];
const saveModifiers = (isValid: boolean) => [
  disabled(!isValid),
  padding({ vertical: 14 }),
  frame({ maxWidth: FILL }),
  background(palette.inkPrimary),
  cornerRadius(14),
  foregroundStyle(palette.primaryForeground),
  opacity(isValid ? 1 : 0.5),
];
const saveEnabledModifiers = saveModifiers(true);
const saveDisabledModifiers = saveModifiers(false);

export type { EntrySheetConfig };

/**
 * Native SwiftUI bottom sheet for adding/editing a fact or date.
 * Open it by passing a config; pass null to dismiss. Self-contained:
 * renders its own zero-size Host, so it can be dropped into RN screens
 * and the tab-bar quick-add accessory alike.
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

  if (!rendered) {
    return null;
  }

  return (
    <Host style={{ position: 'absolute', width: 0, height: 0 }}>
      <BottomSheet
        isPresented={config !== null}
        onIsPresentedChange={(presented) => {
          if (!presented) {
            onClose();
          }
        }}
        // Every mode hugs its content so no dead space rides above the
        // keyboard; height re-fits when the fact/date tab switches
        fitToContents
      >
        <Group
          modifiers={[
            presentationBackground(palette.paper),
            presentationDragIndicator('visible'),
          ]}
        >
          <EntryForm
            key={rendered.nonce}
            config={rendered.config}
            onClose={onClose}
          />
        </Group>
      </BottomSheet>
    </Host>
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

  // Observable state prefills the native TextFields; the hook's plain
  // state mirrors them for validation and saving
  const factValueState = useNativeState(form.initialFactValue);
  const factLabelState = useNativeState(form.initialFactLabel);
  const dateLabelState = useNativeState(form.initialDateLabel);
  const personNameState = useNativeState(form.initialPersonName);

  if (form.kind === 'person') {
    return (
      <VStack alignment="leading" spacing={16} modifiers={sheetStackModifiers}>
        <Text modifiers={sheetTitleModifiers}>Edit name</Text>
        <TextField
          placeholder="Name"
          text={personNameState}
          onTextChange={form.setPersonName}
          autoFocus
          modifiers={fieldCardModifiers}
        />
        <Button
          label="Save changes"
          onPress={form.handleSave}
          modifiers={
            form.isValid ? saveEnabledModifiers : saveDisabledModifiers
          }
        />
      </VStack>
    );
  }

  if (form.showPersonPicker && form.people.length === 0) {
    return (
      <VStack alignment="leading" spacing={16} modifiers={sheetStackModifiers}>
        <Text modifiers={sheetTitleModifiers}>Add a person first</Text>
        <Text>Facts and dates need someone to belong to.</Text>
        <Button
          label="Add a person"
          onPress={() => {
            onClose();
            router.push('/add-person');
          }}
          modifiers={saveEnabledModifiers}
        />
      </VStack>
    );
  }

  return (
    <VStack alignment="leading" spacing={16} modifiers={sheetStackModifiers}>
      <Text modifiers={sheetTitleModifiers}>
        {form.kind === 'fact'
          ? form.editFact
            ? 'Edit fact'
            : 'New fact'
          : form.editDate
            ? 'Edit date'
            : 'New date'}
      </Text>

      {form.showPersonPicker && (
        <HStack modifiers={personRowModifiers}>
          <Text>Person</Text>
          <Spacer />
          <Picker
            selection={form.personId}
            onSelectionChange={(selection) =>
              form.setPersonId(String(selection))
            }
            modifiers={[pickerStyle('menu')]}
          >
            {form.people.map((p) => (
              <Text key={p.id} modifiers={[tag(p.id)]}>
                {p.name}
              </Text>
            ))}
          </Picker>
        </HStack>
      )}

      {config.mode === 'create' && (
        <Picker
          selection={form.kind}
          onSelectionChange={(selection) =>
            form.setKind(selection as EntryKind)
          }
          modifiers={[pickerStyle('segmented')]}
        >
          <Text modifiers={[tag('fact')]}>Fact</Text>
          <Text modifiers={[tag('date')]}>Date</Text>
        </Picker>
      )}

      {form.kind === 'fact' ? (
        <VStack spacing={0} modifiers={cardModifiers}>
          <TextField
            placeholder="The fact itself"
            text={factValueState}
            onTextChange={form.setFactValue}
            autoFocus={config.mode === 'create'}
            modifiers={fieldRowModifiers}
          />
          <Divider />
          <TextField
            placeholder="Label (optional)"
            text={factLabelState}
            onTextChange={form.setFactLabel}
            modifiers={fieldRowModifiers}
          />
        </VStack>
      ) : (
        <>
          <TextField
            placeholder="Label (e.g. Wedding anniversary)"
            text={dateLabelState}
            onTextChange={form.setDateLabel}
            modifiers={fieldCardModifiers}
          />
          <VStack spacing={0} modifiers={cardModifiers}>
            <DatePicker
              title="Date"
              selection={form.pickedDate}
              displayedComponents={['date']}
              onDateChange={form.setPickedDate}
              modifiers={controlRowModifiers}
            />
            <Divider />
            <Toggle
              label="Include year"
              isOn={form.includeYear}
              onIsOnChange={form.setIncludeYear}
              modifiers={controlRowModifiers}
            />
          </VStack>
        </>
      )}

      <Button
        label={config.mode === 'edit' ? 'Save changes' : 'Save'}
        onPress={form.handleSave}
        modifiers={form.isValid ? saveEnabledModifiers : saveDisabledModifiers}
      />
    </VStack>
  );
}
