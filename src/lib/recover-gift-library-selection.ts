import { Observe } from 'expo-observe';
import { saveGiftCapture } from '~/api/gifts/capture-service';
import { pendingGiftLibraryPhoto, stageGiftPhoto } from '~/lib/gift-photos';

/** Android may recreate the activity while the system photo picker is open. */
export async function recoverGiftLibrarySelection() {
  try {
    const uri = await pendingGiftLibraryPhoto();
    if (uri) saveGiftCapture(stageGiftPhoto(uri, null));
  } catch {
    Observe.reportError(new Error('Gift library recovery failed'));
  }
}
