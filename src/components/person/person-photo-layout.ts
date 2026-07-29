const COMPACT_PHOTO_SIZE = 96;
const COMPACT_PHOTO_GAP = 16;
const EXPANDED_SECTION_GAP = 20;

export function personPhotoCompactHeight(headerHeight: number): number {
  return (
    headerHeight + COMPACT_PHOTO_GAP + COMPACT_PHOTO_SIZE + EXPANDED_SECTION_GAP
  );
}

export function personPhotoExpandedHeight(screenWidth: number): number {
  return screenWidth + EXPANDED_SECTION_GAP;
}

export const personPhotoLayout = {
  compactSize: COMPACT_PHOTO_SIZE,
  compactGap: COMPACT_PHOTO_GAP,
} as const;
