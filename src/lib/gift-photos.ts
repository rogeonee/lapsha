import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Observe } from 'expo-observe';
import { z } from 'zod';

const photos = new Directory(Paths.document, 'gift-photos');
const librarySelection = new File(photos, 'library.pending');
const libraryAssetSchema = z.object({
  uri: z.string(),
  width: z.number(),
  height: z.number(),
});
const pendingSchema = z.object({
  id: z.uuid(),
  personId: z.uuid().nullable(),
  photo: z.string().regex(/^[\w-]+\.jpg$/),
});
export type PendingGiftPhoto = z.infer<typeof pendingSchema>;

export function giftPhotoUri(name: string | null): string | null {
  if (!name) return null;
  const file = new File(photos, name);
  return file.exists ? file.uri : null;
}

export function stageGiftPhoto(
  uri: string,
  personId: string | null,
): PendingGiftPhoto {
  photos.create({ idempotent: true, intermediates: true });
  const id = randomUUID();
  const pending = { id, personId, photo: `${id}.jpg` };
  new File(photos, `${id}.json`).write(JSON.stringify(pending));
  new File(uri).copy(new File(photos, pending.photo));
  if (librarySelection.exists) librarySelection.delete();
  return pending;
}

export function finishGiftPhoto(pending: PendingGiftPhoto) {
  try {
    const file = new File(photos, `${pending.id}.json`);
    if (file.exists) file.delete();
  } catch {
    Observe.reportError(new Error('Gift capture journal cleanup failed'));
  }
}

export function pendingGiftPhotos(): PendingGiftPhoto[] {
  if (!photos.exists) return [];
  return photos.list().flatMap((file) => {
    if (!(file instanceof File) || !file.name.endsWith('.json')) return [];
    try {
      const pending = pendingSchema.parse(JSON.parse(file.textSync()));
      return giftPhotoUri(pending.photo) ? [pending] : [];
    } catch {
      Observe.reportError(new Error('Gift capture recovery failed'));
      return [];
    }
  });
}

export async function pickGiftPhoto(): Promise<string | null> {
  return selectGiftPhoto('library');
}

export async function takeGiftPhoto(): Promise<string | null> {
  return selectGiftPhoto('camera');
}

async function selectGiftPhoto(
  source: 'library' | 'camera',
): Promise<string | null> {
  photos.create({ idempotent: true, intermediates: true });
  librarySelection.write('null');
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  };
  let result: ImagePicker.ImagePickerResult;
  try {
    result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
  } catch (error) {
    librarySelection.delete();
    throw error;
  }
  if (result.canceled) {
    librarySelection.delete();
    return null;
  }
  librarySelection.write(
    JSON.stringify(libraryAssetSchema.parse(result.assets[0])),
  );
  return prepareGiftPhoto(result.assets[0]);
}

export async function prepareGiftPhoto(
  asset: Pick<ImagePicker.ImagePickerAsset, 'uri' | 'width' | 'height'>,
): Promise<string> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 2560) {
    context.resize(
      asset.width > asset.height ? { width: 2560 } : { height: 2560 },
    );
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.85,
  });
  return saved.uri;
}

export function deleteGiftPhoto(name: string | null) {
  if (!name) return;
  try {
    const file = new File(photos, name);
    if (file.exists) file.delete();
  } catch {
    Observe.reportError(new Error('Gift photo deletion failed'));
  }
}

export function clearGiftPhotos(): boolean {
  try {
    if (photos.exists) photos.delete();
    return true;
  } catch {
    Observe.reportError(new Error('Gift photo cleanup failed'));
    return false;
  }
}

export function hasPendingGiftLibrarySelection(): boolean {
  return librarySelection.exists;
}

export async function pendingGiftLibraryPhoto(): Promise<string | null> {
  if (!librarySelection.exists) return null;
  const stored = JSON.parse(librarySelection.textSync());
  if (stored) return prepareGiftPhoto(libraryAssetSchema.parse(stored));
  const result = await ImagePicker.getPendingResultAsync();
  if (result && 'assets' in result && !result.canceled && result.assets?.[0]) {
    const asset = libraryAssetSchema.parse(result.assets[0]);
    librarySelection.write(JSON.stringify(asset));
    return prepareGiftPhoto(asset);
  }
  librarySelection.delete();
  return null;
}
