import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const AVATAR_SIZE = 1536;

const avatarsDir = new Directory(Paths.document, 'avatars');

export function avatarUri(fileName: string | null | undefined): string | null {
  if (!fileName) return null;
  const file = new File(avatarsDir, fileName);
  return file.exists ? file.uri : null;
}

export async function pickAvatarImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  return result.canceled ? null : (result.assets[0] ?? null);
}

export async function saveAvatarFile(asset: {
  uri: string;
  width: number;
}): Promise<string> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > AVATAR_SIZE) {
    context.resize({ width: AVATAR_SIZE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8,
  });

  avatarsDir.create({ intermediates: true, idempotent: true });
  const fileName = `${randomUUID()}.jpg`;
  new File(saved.uri).moveSync(new File(avatarsDir, fileName));
  return fileName;
}

export function deleteAvatarFile(fileName: string | null | undefined): void {
  if (!fileName) return;
  try {
    const file = new File(avatarsDir, fileName);
    if (file.exists) file.delete();
  } catch {}
}

/** Delete every stored avatar and report whether any cleanup was incomplete. */
export function clearAvatarFiles(): boolean {
  try {
    if (!avatarsDir.exists) return true;
    let complete = true;
    for (const entry of avatarsDir.list()) {
      try {
        entry.delete();
      } catch {
        complete = false;
      }
    }
    return complete;
  } catch {
    return false;
  }
}
