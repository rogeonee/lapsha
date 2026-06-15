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
import { Alert } from 'react-native';
import { createDate, updateDate } from '~/api/dates/dates-service';
import { createFact, updateFact } from '~/api/facts/facts-service';
import { getPeople } from '~/api/people/people-service';
import { fromStorageDate, toStorageDate } from '~/lib/dates';
import { getLastPersonId, setLastPersonId } from '~/lib/prefs';
import type { Fact, Date as PersonDate } from '~/types/db';

type EntryKind = 'fact' | 'date';

export type EntrySheetConfig =
  | {
      mode: 'create';
      kind: EntryKind;
      /** Scope to one person and hide the person picker (person screen) */
      personId?: string;
      /** Prefill for the date label, e.g. "Birthday" */
      dateLabel?: string;
    }
  | { mode: 'edit'; kind: 'fact'; fact: Fact }
  | { mode: 'edit'; kind: 'date'; date: PersonDate };

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

  const editFact =
    config.mode === 'edit' && config.kind === 'fact' ? config.fact : null;
  const editDate =
    config.mode === 'edit' && config.kind === 'date' ? config.date : null;
  const showPersonPicker = config.mode === 'create' && !config.personId;

  const [people] = useState(() =>
    showPersonPicker ? (getPeople().data ?? []) : [],
  );

  const [personId, setPersonId] = useState<string | null>(() => {
    if (editFact) return editFact.person_id;
    if (editDate) return editDate.person_id;
    if (config.mode === 'create' && config.personId) return config.personId;
    const last = getLastPersonId();
    if (last && people.some((p) => p.id === last)) return last;
    return people[0]?.id ?? null;
  });

  const [kind, setKind] = useState<EntryKind>(config.kind);

  // Fact fields: observable state prefills the native TextField,
  // plain state mirrors it for validation and saving
  const initialFactValue = editFact?.value ?? '';
  const initialFactLabel = editFact?.label ?? '';
  const factValueState = useNativeState(initialFactValue);
  const factLabelState = useNativeState(initialFactLabel);
  const [factValue, setFactValue] = useState(initialFactValue);
  const [factLabel, setFactLabel] = useState(initialFactLabel);

  // Date fields
  const initialDateLabel =
    editDate?.label ??
    (config.mode === 'create' ? (config.dateLabel ?? '') : '');
  const initialPicked = editDate
    ? fromStorageDate(editDate.date)
    : { date: new Date(), includeYear: true };
  const dateLabelState = useNativeState(initialDateLabel);
  const [dateLabel, setDateLabel] = useState(initialDateLabel);
  const [pickedDate, setPickedDate] = useState(initialPicked.date);
  const [includeYear, setIncludeYear] = useState(initialPicked.includeYear);

  const isValid =
    personId !== null &&
    (kind === 'fact'
      ? factValue.trim().length > 0
      : dateLabel.trim().length > 0);

  const handleSave = () => {
    if (!personId) return;

    const response =
      kind === 'fact'
        ? (() => {
            const label = factLabel.trim() || null;
            const value = factValue.trim();
            return editFact
              ? updateFact(editFact.id, { label, value })
              : createFact({ person_id: personId, label, value });
          })()
        : (() => {
            const label = dateLabel.trim();
            const date = toStorageDate(pickedDate, includeYear);
            return editDate
              ? updateDate(editDate.id, { label, date })
              : createDate({ person_id: personId, label, date });
          })();

    if (response.error) {
      Alert.alert('Error', response.error.message || 'Failed to save.');
      return;
    }

    if (config.mode === 'create') {
      setLastPersonId(personId);
    }
    onClose();
  };

  if (showPersonPicker && people.length === 0) {
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
      {showPersonPicker && (
        <Section>
          <Picker
            label="Person"
            selection={personId}
            onSelectionChange={(selection) => setPersonId(String(selection))}
            modifiers={[pickerStyle('menu')]}
          >
            {people.map((p) => (
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
            selection={kind}
            onSelectionChange={(selection) => setKind(selection as EntryKind)}
            modifiers={[pickerStyle('segmented')]}
          >
            <Text modifiers={[tag('fact')]}>Fact</Text>
            <Text modifiers={[tag('date')]}>Date</Text>
          </Picker>
        </Section>
      )}

      {kind === 'fact' ? (
        <Section title={editFact ? 'Edit fact' : 'New fact'}>
          <TextField
            placeholder="The fact itself"
            text={factValueState}
            onTextChange={setFactValue}
            autoFocus={config.mode === 'create'}
          />
          <TextField
            placeholder="Label (optional)"
            text={factLabelState}
            onTextChange={setFactLabel}
          />
        </Section>
      ) : (
        <Section title={editDate ? 'Edit date' : 'New date'}>
          <TextField
            placeholder="Label (e.g. Wedding anniversary)"
            text={dateLabelState}
            onTextChange={setDateLabel}
          />
          <DatePicker
            title="Date"
            selection={pickedDate}
            displayedComponents={['date']}
            onDateChange={setPickedDate}
          />
          <Toggle
            label="Include year"
            isOn={includeYear}
            onIsOnChange={setIncludeYear}
          />
        </Section>
      )}

      <Section>
        <Button
          label={config.mode === 'edit' ? 'Save changes' : 'Save'}
          onPress={handleSave}
          modifiers={[disabled(!isValid)]}
        />
      </Section>
    </Form>
  );
}
