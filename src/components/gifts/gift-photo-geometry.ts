export type PhotoSize = { width: number; height: number };
export type PhotoPoint = { x: number; y: number };
export type PhotoTransform = PhotoPoint & { scale: number };

export function containedPhotoSize(image: PhotoSize, viewport: PhotoSize) {
  'worklet';
  if (!image.width || !image.height || !viewport.width || !viewport.height)
    return { width: 0, height: 0 };
  const ratio = Math.min(
    viewport.width / image.width,
    viewport.height / image.height,
  );
  return { width: image.width * ratio, height: image.height * ratio };
}

export function boundPhotoTransform(
  image: PhotoSize,
  viewport: PhotoSize,
  transform: PhotoTransform,
): PhotoTransform {
  'worklet';
  const fitted = containedPhotoSize(image, viewport);
  const scale = Math.max(1, Math.min(5, transform.scale));
  const maxX = Math.max(0, (fitted.width * scale - viewport.width) / 2);
  const maxY = Math.max(0, (fitted.height * scale - viewport.height) / 2);
  return {
    scale,
    x: maxX ? Math.max(-maxX, Math.min(maxX, transform.x)) : 0,
    y: maxY ? Math.max(-maxY, Math.min(maxY, transform.y)) : 0,
  };
}

export function photoTransformAtPoint(
  image: PhotoSize,
  viewport: PhotoSize,
  initial: PhotoTransform,
  from: PhotoPoint,
  to: PhotoPoint,
  targetScale: number,
): PhotoTransform {
  'worklet';
  const scale = Math.max(1, Math.min(5, targetScale));
  const imageX = (from.x - viewport.width / 2 - initial.x) / initial.scale;
  const imageY = (from.y - viewport.height / 2 - initial.y) / initial.scale;
  return boundPhotoTransform(image, viewport, {
    scale,
    x: to.x - viewport.width / 2 - imageX * scale,
    y: to.y - viewport.height / 2 - imageY * scale,
  });
}
