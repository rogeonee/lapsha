import { useState } from 'react';
import { Alert } from 'react-native';
import { createDate, updateDate } from '~/api/dates/dates-service';
import { createFact, updateFact } from '~/api/facts/facts-service';
import { getPeople } from '~/api/people/people-service';
import { fromStorageDate, toStorageDate } from '~/lib/dates';
import { getLastPersonId, setLastPersonId } from '~/lib/prefs';
import type { Fact, Date as PersonDate } from '~/types/db';

export type EntryKind = 'fact' | 'date';

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
 * Platform-agnostic state and save logic for the entry sheet form.
 * The iOS (SwiftUI) and Android (HeroUI) sheets render their own
 * controls on top of this.
 */
export function useEntryForm(config: EntrySheetConfig, onClose: () => void) {
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

  // Fact fields: initial values prefill platform inputs (which are
  // uncontrolled), plain state mirrors them for validation and saving
  const initialFactValue = editFact?.value ?? '';
  const initialFactLabel = editFact?.label ?? '';
  const [factValue, setFactValue] = useState(initialFactValue);
  const [factLabel, setFactLabel] = useState(initialFactLabel);

  // Date fields
  const initialDateLabel =
    editDate?.label ??
    (config.mode === 'create' ? (config.dateLabel ?? '') : '');
  const initialPicked = editDate
    ? fromStorageDate(editDate.date)
    : { date: new Date(), includeYear: true };
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

  return {
    editFact,
    editDate,
    showPersonPicker,
    people,
    personId,
    setPersonId,
    kind,
    setKind,
    initialFactValue,
    initialFactLabel,
    initialDateLabel,
    setFactValue,
    setFactLabel,
    setDateLabel,
    pickedDate,
    setPickedDate,
    includeYear,
    setIncludeYear,
    isValid,
    handleSave,
  };
}
