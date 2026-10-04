import { useState } from 'react';
import { Alert } from 'react-native';
import { createDate, updateDate } from '~/api/dates/dates-service';
import { createFact, updateFact } from '~/api/facts/facts-service';
import { createGift, updateGift } from '~/api/gifts/gifts-service';
import {
  giftFieldsSchema,
  type Gift,
  type GiftStatus,
} from '~/api/gifts/gift-schema';
import { getPeople, updatePerson } from '~/api/people/people-service';
import { fromStorageDate, toStorageDate } from '~/lib/dates';
import { getLastPersonId, setLastPersonId } from '~/lib/prefs';
import type { Fact, Person, Date as PersonDate } from '~/types/db';

export type EntryKind = 'fact' | 'date' | 'gift';

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
  | { mode: 'edit'; kind: 'date'; date: PersonDate }
  | { mode: 'edit'; kind: 'gift'; gift: Gift }
  | { mode: 'edit'; kind: 'person'; person: Person };

/**
 * Platform-agnostic state and save logic for the entry sheet form.
 * The iOS (SwiftUI) and Android (HeroUI) sheets render their own
 * controls on top of this.
 */
export function useEntryForm(config: EntrySheetConfig, onClose: () => void) {
  const editGift =
    config.mode === 'edit' && config.kind === 'gift' ? config.gift : null;
  const editFact =
    config.mode === 'edit' && config.kind === 'fact' ? config.fact : null;
  const editDate =
    config.mode === 'edit' && config.kind === 'date' ? config.date : null;
  const editPerson =
    config.mode === 'edit' && config.kind === 'person' ? config.person : null;
  const showPersonPicker = config.mode === 'create' && !config.personId;

  const [people] = useState(() => {
    if (!showPersonPicker) return [];
    const response = getPeople();
    return response.error ? [] : (response.data ?? []);
  });

  const [personId, setPersonId] = useState<string | null>(() => {
    if (editGift) return editGift.person_id;
    if (editFact) return editFact.person_id;
    if (editDate) return editDate.person_id;
    if (config.mode === 'create' && config.personId) return config.personId;
    const last = getLastPersonId();
    if (last && people.some((p) => p.id === last)) return last;
    return people[0]?.id ?? null;
  });

  const [kind, setKind] = useState<EntryKind | 'person'>(config.kind);

  const initialGiftTitle = editGift?.title ?? '';
  const initialGiftNote = editGift?.note ?? '';
  const initialGiftUrl = editGift?.url ?? '';
  const [giftTitle, setGiftTitle] = useState(initialGiftTitle);
  const [giftNote, setGiftNote] = useState(initialGiftNote);
  const [giftUrl, setGiftUrl] = useState(initialGiftUrl);
  const [giftStatus, setGiftStatus] = useState<GiftStatus>(
    editGift?.status ?? 'idea',
  );

  const initialPersonName = editPerson?.name ?? '';
  const [personName, setPersonName] = useState(initialPersonName);

  // Initial values seed iOS native state; Android binds to the current drafts.
  const initialFactValue = editFact?.value ?? '';
  const initialFactLabel = editFact?.label ?? '';
  const [factValue, setFactValue] = useState(initialFactValue);
  const [factLabel, setFactLabel] = useState(initialFactLabel);

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
    kind === 'person'
      ? personName.trim().length > 0
      : personId !== null &&
        (kind === 'gift'
          ? Boolean(
              giftTitle.trim() || giftNote.trim() || giftUrl.trim() || editGift,
            )
          : kind === 'fact'
            ? factValue.trim().length > 0
            : dateLabel.trim().length > 0);

  const handleSave = () => {
    if (editPerson) {
      const response = updatePerson(editPerson.id, {
        name: personName.trim(),
      });
      if (response.error) {
        Alert.alert('Error', response.error.message || 'Failed to save.');
        return;
      }
      onClose();
      return;
    }

    if (!personId) return;

    if (kind === 'gift') {
      const url = giftUrl.trim();
      const parsed = giftFieldsSchema.safeParse({
        title: giftTitle,
        note: giftNote.trim() || null,
        url: url
          ? /^[a-z][a-z\d+.-]*:/i.test(url)
            ? url
            : `https://${url}`
          : null,
        status: giftStatus,
        photo: editGift?.photo ?? null,
        given_on: editGift?.given_on ?? null,
      });
      if (!parsed.success) {
        Alert.alert('Check your gift idea', parsed.error.issues[0].message);
        return;
      }
      const response = editGift
        ? updateGift(editGift.id, parsed.data)
        : createGift({ ...parsed.data, person_id: personId });
      if (response.error) {
        Alert.alert('Couldn’t save gift', 'Please try again.');
        return;
      }
      if (config.mode === 'create') setLastPersonId(personId);
      onClose();
      return;
    }

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
    editGift,
    initialGiftTitle,
    initialGiftNote,
    initialGiftUrl,
    giftTitle,
    setGiftTitle,
    giftNote,
    setGiftNote,
    giftUrl,
    setGiftUrl,
    giftStatus,
    setGiftStatus,
    editFact,
    editDate,
    editPerson,
    showPersonPicker,
    people,
    personId,
    setPersonId,
    kind,
    setKind,
    initialFactValue,
    initialFactLabel,
    initialDateLabel,
    initialPersonName,
    factValue,
    factLabel,
    dateLabel,
    setFactValue,
    setFactLabel,
    setDateLabel,
    setPersonName,
    pickedDate,
    setPickedDate,
    includeYear,
    setIncludeYear,
    isValid,
    handleSave,
  };
}
