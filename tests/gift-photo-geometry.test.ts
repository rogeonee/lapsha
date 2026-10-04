import { expect, test } from 'bun:test';
import {
  boundPhotoTransform,
  containedPhotoSize,
  photoTransformAtPoint,
} from '../src/components/gifts/gift-photo-geometry';

const viewport = { width: 400, height: 700 };
const landscape = { width: 1600, height: 900 };
const portrait = { width: 600, height: 1400 };
const fitted = { scale: 1, x: 0, y: 0 };

test('pan bounds use the contained photograph rather than its letterboxed viewport', () => {
  expect(containedPhotoSize(landscape, viewport)).toEqual({
    width: 400,
    height: 225,
  });
  expect(
    boundPhotoTransform(landscape, viewport, { scale: 3, x: 900, y: 900 }),
  ).toEqual({ scale: 3, x: 400, y: 0 });
  expect(
    boundPhotoTransform(landscape, viewport, { scale: 4, x: -900, y: -900 }),
  ).toEqual({ scale: 4, x: -600, y: -100 });
  expect(containedPhotoSize(portrait, viewport)).toEqual({
    width: 300,
    height: 700,
  });
  expect(
    boundPhotoTransform(portrait, viewport, { scale: 2, x: 900, y: 900 }),
  ).toEqual({ scale: 2, x: 100, y: 350 });
});

test('double-tap centers the selected image point when the edges allow it', () => {
  expect(
    photoTransformAtPoint(
      landscape,
      viewport,
      fitted,
      { x: 280, y: 350 },
      { x: 200, y: 350 },
      3,
    ),
  ).toEqual({ scale: 3, x: -240, y: 0 });
  expect(
    photoTransformAtPoint(
      landscape,
      viewport,
      fitted,
      { x: 400, y: 450 },
      { x: 200, y: 350 },
      3,
    ),
  ).toEqual({ scale: 3, x: -400, y: 0 });
});

test('pinch keeps the image point under its moving focal point after prior panning', () => {
  const from = { x: 260, y: 430 };
  const to = { x: 280, y: 460 };
  const initial = { scale: 2, x: -40, y: 30 };
  const next = photoTransformAtPoint(portrait, viewport, initial, from, to, 3);
  expect(next).toEqual({ scale: 3, x: -70, y: 35 });
  expect((to.x - viewport.width / 2 - next.x) / next.scale).toBe(
    (from.x - viewport.width / 2 - initial.x) / initial.scale,
  );
  expect((to.y - viewport.height / 2 - next.y) / next.scale).toBe(
    (from.y - viewport.height / 2 - initial.y) / initial.scale,
  );
});

test('zoom limits cannot expose extra empty space and returning to fit clears offsets', () => {
  expect(
    boundPhotoTransform(landscape, viewport, { scale: 0.5, x: 300, y: -300 }),
  ).toEqual(fitted);
  expect(
    boundPhotoTransform(landscape, viewport, { scale: 12, x: 3000, y: -3000 }),
  ).toEqual({ scale: 5, x: 800, y: -212.5 });
  expect(
    photoTransformAtPoint(
      portrait,
      viewport,
      { scale: 3, x: 100, y: -450 },
      { x: 200, y: 350 },
      { x: 200, y: 350 },
      1,
    ),
  ).toEqual(fitted);
});
