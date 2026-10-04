import { Observe } from 'expo-observe';
import { saveGiftCapture } from '~/api/gifts/capture-service';
import type { Gift } from '~/api/gifts/gift-schema';
import {
  hasPendingGiftLibrarySelection,
  pendingGiftLibraryPhoto,
  stageGiftPhoto,
} from '~/lib/gift-photos';

type SelectionRecovery =
  | { status: 'none' | 'canceled' | 'failed' }
  | { status: 'recovered'; gift: Gift };

let startupRecovery: Promise<SelectionRecovery> | undefined;
let captureHandledRecovery = false;

/** The restored capture route must wait for the same recovery as the root. */
export function recoverGiftLibrarySelection(): Promise<SelectionRecovery> {
  return (startupRecovery ??= recoverSelection());
}

export async function consumeRecoveredGiftSelection(
  resumeStartupCapture: boolean,
): Promise<SelectionRecovery> {
  const recovery = await recoverGiftLibrarySelection();
  if (!resumeStartupCapture || captureHandledRecovery)
    return { status: 'none' };
  captureHandledRecovery = true;
  return recovery;
}

async function recoverSelection(): Promise<SelectionRecovery> {
  try {
    if (!hasPendingGiftLibrarySelection()) return { status: 'none' };
    const uri = await pendingGiftLibraryPhoto();
    if (!uri) return { status: 'canceled' };
    const result = saveGiftCapture(stageGiftPhoto(uri, null));
    if (result.error || !result.data)
      throw new Error('Gift capture recovery failed');
    return { status: 'recovered', gift: result.data };
  } catch {
    Observe.reportError(new Error('Gift library recovery failed'));
    return { status: 'failed' };
  }
}
