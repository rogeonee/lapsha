import { useRef, useState } from 'react';
import {
  giftFieldsSchema,
  normalizeGiftUrl,
  type Gift,
  type GiftStatus,
} from '~/api/gifts/gift-schema';
import {
  assignGift,
  attachCapturedPhoto,
  createGift,
  deleteGift,
  updateGift,
} from '~/api/gifts/gifts-service';
import { saveGiftCapture } from '~/api/gifts/capture-service';
import {
  deleteGiftPhoto,
  stageGiftPhoto,
  type PendingGiftPhoto,
} from '~/lib/gift-photos';

export function useGiftEditor(initial: Gift | null, personId: string | null) {
  const [savedGift, setSavedGift] = useState(initial);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [status, setStatus] = useState<GiftStatus>(initial?.status ?? 'idea');
  const [givenOn, setGivenOn] = useState(initial?.given_on ?? null);
  const [person, setPerson] = useState(initial?.person_id ?? personId);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const pending = useRef<{ uri: string; capture: PendingGiftPhoto } | null>(
    null,
  );
  const photo = savedGift?.photo ?? null;
  const dirty =
    title !== (savedGift?.title ?? '') ||
    note !== (savedGift?.note ?? '') ||
    url !== (savedGift?.url ?? '') ||
    status !== (savedGift?.status ?? 'idea') ||
    givenOn !== (savedGift?.given_on ?? null);
  const fields = {
    title,
    note,
    url: normalizeGiftUrl(url),
    photo,
    status,
    given_on: givenOn,
  };
  const valid = Boolean(
    savedGift || title.trim() || note.trim() || url.trim() || photo,
  );

  const save = () => {
    const parsed = giftFieldsSchema.safeParse(fields);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    const response = savedGift
      ? updateGift(savedGift.id, { ...parsed.data, person_id: person })
      : createGift({ ...parsed.data, person_id: person });
    if (response.error || !response.data) {
      setError('Couldn’t save this idea. Please try again.');
      return;
    }
    setSavedGift(response.data);
    setDone(true);
  };

  const selectPerson = (id: string | null) => {
    if (savedGift) {
      const result = assignGift(savedGift.id, id);
      if (result.error || !result.data) {
        setError('Couldn’t assign this idea. Please try again.');
        return false;
      }
      setSavedGift(result.data);
    }
    setPerson(id);
    return true;
  };

  const capturePhoto = (uri: string) => {
    if (!pending.current || pending.current.uri !== uri)
      pending.current = { uri, capture: stageGiftPhoto(uri, person) };
    const captured = saveGiftCapture(pending.current.capture);
    if (captured.error || !captured.data)
      throw new Error('Gift capture failed');
    if (savedGift) {
      const result = attachCapturedPhoto(savedGift.id, captured.data.id);
      if (result.error || !result.data)
        throw new Error('Gift photo update failed');
      deleteGiftPhoto(savedGift.photo);
      setSavedGift(result.data);
    } else {
      setSavedGift(captured.data);
    }
    pending.current = null;
    setError(null);
  };

  const removePhoto = () => {
    if (!savedGift) return;
    const result = updateGift(savedGift.id, { ...savedGift, photo: null });
    if (result.error || !result.data) {
      setError('Couldn’t remove the photo. Please try again.');
      return;
    }
    deleteGiftPhoto(savedGift.photo);
    setSavedGift(result.data);
    setError(null);
  };

  const remove = () => {
    if (!savedGift) {
      setDone(true);
      return;
    }
    const result = deleteGift(savedGift.id);
    if (result.error) {
      setError('Couldn’t delete this idea. Please try again.');
      return;
    }
    setDone(true);
  };

  return {
    title,
    setTitle,
    note,
    setNote,
    url,
    setUrl,
    status,
    setStatus,
    givenOn,
    setGivenOn,
    person,
    selectPerson,
    photo,
    savedGift,
    dirty,
    valid,
    error,
    setError,
    done,
    save,
    capturePhoto,
    removePhoto,
    remove,
  };
}
