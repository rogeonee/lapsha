import {
  BottomSheet,
  Button,
  DatePicker,
  Form,
  Group,
  Host,
  Picker,
  Section,
  Text,
  TextField,
  Toggle,
  useNativeState,
} from '@expo/ui/swift-ui';
import {
  disabled,
  pickerStyle,
  presentationDetents,
  presentationDragIndicator,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  useEntryForm,
  type EntryKind,
  type EntrySheetConfig,
} from '~/components/entry/use-entry-form';

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
      >
        <Group
          modifiers={[
            // Single detent: iOS expands a sheet to its largest detent when
            // the keyboard appears, so offering 'large' meant the auto-
            // focused field blew the sheet up to full height on open.
            presentationDetents(['medium']),
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

  if (form.showPersonPicker && form.people.length === 0) {
    return (
      <Form>
        <Section>
          <Text>
            Add a person first — then save facts and dates about them.
          </Text>
          <Button
            label="Add a person"
            onPress={() => {
              onClose();
              router.push('/add-person');
            }}
          />
        </Section>
      </Form>
    );
  }

  return (
    <Form>
      {form.showPersonPicker && (
        <Section>
          <Picker
            label="Person"
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
        </Section>
      )}

      {config.mode === 'create' && (
        <Section>
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
        </Section>
      )}

      {form.kind === 'fact' ? (
        <Section title={form.editFact ? 'Edit fact' : 'New fact'}>
          <TextField
            placeholder="The fact itself"
            text={factValueState}
            onTextChange={form.setFactValue}
            autoFocus={config.mode === 'create'}
          />
          <TextField
            placeholder="Label (optional)"
            text={factLabelState}
            onTextChange={form.setFactLabel}
          />
        </Section>
      ) : (
        <Section title={form.editDate ? 'Edit date' : 'New date'}>
          <TextField
            placeholder="Label (e.g. Wedding anniversary)"
            text={dateLabelState}
            onTextChange={form.setDateLabel}
          />
          <DatePicker
            title="Date"
            selection={form.pickedDate}
            displayedComponents={['date']}
            onDateChange={form.setPickedDate}
          />
          <Toggle
            label="Include year"
            isOn={form.includeYear}
            onIsOnChange={form.setIncludeYear}
          />
        </Section>
      )}

      <Section>
        <Button
          label={config.mode === 'edit' ? 'Save changes' : 'Save'}
          onPress={form.handleSave}
          modifiers={[disabled(!form.isValid)]}
        />
      </Section>
    </Form>
  );
}
