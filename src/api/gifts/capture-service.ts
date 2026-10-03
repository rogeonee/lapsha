import { db } from '~/api/database';
import { createGift, getGift } from '~/api/gifts/gifts-service';
import { runServiceOperation } from '~/api/error-handling';
import {
  finishGiftPhoto,
  pendingGiftPhotos,
  type PendingGiftPhoto,
} from '~/lib/gift-photos';

export function saveGiftCapture(pending: PendingGiftPhoto) {
  // The UUID is also the journal key: retrying an interrupted save cannot duplicate it.
  const existing = getGift(pending.id);
  if (!existing.error && existing.data) {
    finishGiftPhoto(pending);
    return existing;
  }
  const personExists =
    pending.personId &&
    db.getFirstSync(
      'SELECT id FROM persons WHERE id = ? AND deleted_at IS NULL',
      pending.personId,
    );
  const result = createGift({
    id: pending.id,
    person_id: personExists ? pending.personId : null,
    title: null,
    note: null,
    url: null,
    photo: pending.photo,
    status: 'idea',
  });
  if (!result.error) finishGiftPhoto(pending);
  return result;
}

export function recoverGiftCaptures() {
  return runServiceOperation(() => {
    for (const pending of pendingGiftPhotos()) {
      // A completed capture may have been deleted before its journal was cleaned up.
      if (db.getFirstSync('SELECT id FROM gifts WHERE id = ?', pending.id)) {
        finishGiftPhoto(pending);
      } else {
        const result = saveGiftCapture(pending);
        if (result.error) throw new Error('Gift capture recovery failed');
      }
    }
  });
}
