import { randomUUID } from 'expo-crypto';
import { z } from 'zod';
import { db } from '~/api/database';
import { NotFoundError, runServiceOperation } from '~/api/error-handling';
import { toStorageDate } from '~/lib/dates';
import {
  createGiftSchema,
  giftFieldsSchema,
  type Gift,
  type GiftInput,
} from './gift-schema';

function assertPersonExists(personId: string | null) {
  if (
    personId &&
    !db.getFirstSync(
      'SELECT id FROM persons WHERE id = ? AND deleted_at IS NULL',
      personId,
    )
  ) {
    throw new NotFoundError('Person not found');
  }
}

function getGiftOrThrow(id: string): Gift {
  const gift = db.getFirstSync<Gift>(
    `SELECT gifts.* FROM gifts LEFT JOIN persons ON persons.id = gifts.person_id
     WHERE gifts.id = ? AND gifts.deleted_at IS NULL
       AND (gifts.person_id IS NULL OR persons.deleted_at IS NULL)`,
    id,
  );
  if (!gift) throw new NotFoundError('Gift not found');
  return gift;
}

export function getGift(id: string) {
  return runServiceOperation(() => getGiftOrThrow(id));
}

export function getGiftsByPerson(personId: string | null) {
  return runServiceOperation(() => {
    assertPersonExists(personId);
    return db.getAllSync<Gift>(
      `SELECT * FROM gifts WHERE person_id IS ? AND deleted_at IS NULL
       ORDER BY CASE status WHEN 'idea' THEN 0 WHEN 'bought' THEN 1 ELSE 2 END, created_at DESC, id`,
      personId,
    );
  });
}

export function createGift(
  input: GiftInput & { person_id: string | null; id?: string },
) {
  return runServiceOperation(() => {
    const gift = createGiftSchema.parse(input);
    assertPersonExists(gift.person_id);
    const id = gift.id ?? randomUUID();
    const now = new Date().toISOString();
    db.runSync(
      'INSERT INTO gifts (id, person_id, title, note, url, photo, status, given_on, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id,
      gift.person_id,
      gift.title,
      gift.note,
      gift.url,
      gift.photo,
      gift.status,
      gift.status === 'given'
        ? (gift.given_on ?? toStorageDate(new Date(), true))
        : null,
      now,
      now,
    );
    return getGiftOrThrow(id);
  });
}

export function updateGift(
  id: string,
  input: GiftInput & { person_id?: string | null },
) {
  return runServiceOperation(() => {
    const gift = giftFieldsSchema.parse(input);
    const previous = getGiftOrThrow(id);
    const personId =
      input.person_id === undefined
        ? previous.person_id
        : z.uuid().nullable().parse(input.person_id);
    assertPersonExists(personId);
    db.runSync(
      'UPDATE gifts SET person_id = ?, title = ?, note = ?, url = ?, photo = ?, status = ?, given_on = ?, updated_at = ? WHERE id = ?',
      personId,
      gift.title,
      gift.note,
      gift.url,
      gift.photo,
      gift.status,
      gift.status === 'given'
        ? (gift.given_on ??
            previous.given_on ??
            toStorageDate(new Date(), true))
        : null,
      new Date().toISOString(),
      id,
    );
    return getGiftOrThrow(id);
  });
}

export function assignGift(id: string, personId: string | null) {
  return runServiceOperation(() => {
    const gift = getGiftOrThrow(id);
    const parsedId = z.uuid().nullable().parse(personId);
    assertPersonExists(parsedId);
    db.runSync(
      'UPDATE gifts SET person_id = ?, updated_at = ? WHERE id = ?',
      parsedId,
      new Date().toISOString(),
      gift.id,
    );
    return getGiftOrThrow(id);
  });
}

export function deleteGift(id: string) {
  return runServiceOperation(() => {
    const gift = getGiftOrThrow(id);
    const now = new Date().toISOString();
    db.runSync(
      'UPDATE gifts SET deleted_at = ?, updated_at = ? WHERE id = ?',
      now,
      now,
      id,
    );
    return { ...gift, deleted_at: now, updated_at: now };
  });
}

export function attachCapturedPhoto(giftId: string, captureId: string) {
  return runServiceOperation(() => {
    db.withTransactionSync(() => {
      const target = getGiftOrThrow(giftId);
      const capture = getGiftOrThrow(captureId);
      if (!capture.photo || target.id === capture.id)
        throw new Error('Invalid gift photo attachment');
      const now = new Date().toISOString();
      db.runSync(
        'UPDATE gifts SET photo = ?, updated_at = ? WHERE id = ?',
        capture.photo,
        now,
        target.id,
      );
      db.runSync(
        'UPDATE gifts SET deleted_at = ?, updated_at = ? WHERE id = ?',
        now,
        now,
        capture.id,
      );
    });
    return getGiftOrThrow(giftId);
  });
}
