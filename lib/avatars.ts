import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/**
 * Avatar photo storage. The database keeps only a file name in
 * `persons.avatar`; the file itself lives in <documents>/avatars/. Never
 * store the full URI — the iOS app container path changes between
 * installs. A replaced photo gets a fresh file name so expo-image's
 * URI-keyed cache can never show the old picture.
 */

/** Longest stored edge. Display tops out at 72pt (~216px @3x). */
const AVATAR_SIZE = 512;

const avatarsDir = new Directory(Paths.document, 'avatars');

/** Resolve a stored avatar file name to a displayable URI. */
export function avatarUri(fileName: string | null | undefined): string | null {
  return fileName ? new File(avatarsDir, fileName).uri : null;
}

/**
 * Open the system photo library with the platform's square-crop editor.
 * Resolves null when the user cancels. The system pickers (PHPicker /
 * Android Photo Picker) need no permission prompt.
 */
export async function pickAvatarImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  return result.canceled ? null : (result.assets[0] ?? null);
}

/**
 * Persist a picked image as an avatar file: downscale (never upscale),
 * re-encode as JPEG, and move it into the avatars directory. Returns the
 * file name to store in `persons.avatar`.
 */
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

/** Best-effort cleanup of a replaced or removed avatar file. */
export function deleteAvatarFile(fileName: string | null | undefined): void {
  if (!fileName) return;
  try {
    const file = new File(avatarsDir, fileName);
    if (file.exists) file.delete();
  } catch {
    // Orphaned files are harmless; never fail the user action over cleanup.
  }
}

/** Remove every stored avatar. Companion to clearAllData(). */
export function clearAvatarFiles(): void {
  try {
    if (!avatarsDir.exists) return;
    for (const entry of avatarsDir.list()) {
      entry.delete();
    }
  } catch {
    // Same stance as deleteAvatarFile: cleanup must not throw.
  }
}
