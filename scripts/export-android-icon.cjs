const fs = require('node:fs/promises');
const path = require('node:path');
const Jimp = require('jimp-compact');

// Export the approved artwork; keep color and themed layers in identical geometry.
// eslint-disable-next-line no-undef
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets/android-icon');
const size = 1024;
const paper = 0xf9f7f4ff;

async function main() {
  await fs.mkdir(output, { recursive: true });
  const source = await Jimp.read(
    path.join(root, 'assets/reference/app-icon/abby-diagonal-transparent.png'),
  );
  let left = source.bitmap.width,
    top = source.bitmap.height,
    right = 0,
    bottom = 0;
  source.scan(
    0,
    0,
    source.bitmap.width,
    source.bitmap.height,
    function (x, y, index) {
      if (this.bitmap.data[index + 3] > 16) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    },
  );
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  let radius = 0;
  source.scan(
    0,
    0,
    source.bitmap.width,
    source.bitmap.height,
    function (x, y, index) {
      if (this.bitmap.data[index + 3] > 16)
        radius = Math.max(radius, Math.hypot(x - centerX, y - centerY));
    },
  );
  // A 64dp diameter leaves 1dp breathing room inside Android's 66dp safe circle.
  const scale = (size * 32) / 108 / radius;
  const mark = source
    .clone()
    .crop(left, top, right - left + 1, bottom - top + 1);
  mark.resize(
    Math.round(mark.bitmap.width * scale),
    Math.round(mark.bitmap.height * scale),
    Jimp.RESIZE_BICUBIC,
  );
  const foreground = new Jimp(size, size, 0x00000000);
  foreground.composite(
    mark,
    Math.round((size - mark.bitmap.width) / 2),
    Math.round((size - mark.bitmap.height) / 2),
  );
  const monochrome = foreground.clone();
  monochrome.scan(0, 0, size, size, function (_x, _y, index) {
    this.bitmap.data[index] =
      this.bitmap.data[index + 1] =
      this.bitmap.data[index + 2] =
        0;
  });
  await foreground.writeAsync(path.join(output, 'foreground.png'));
  await monochrome.writeAsync(path.join(output, 'monochrome.png'));
  // Legacy and store artwork use the visible 72dp viewport, not the padded 108dp layer.
  const legacy = new Jimp(size, size, paper).composite(foreground, 0, 0);
  const inset = Math.round(size / 6);
  legacy
    .crop(inset, inset, size - 2 * inset, size - 2 * inset)
    .resize(size, size, Jimp.RESIZE_BICUBIC);
  legacy.scan(0, 0, size, size, function (_x, _y, index) {
    this.bitmap.data[index + 3] = 255;
  });
  await legacy.writeAsync(path.join(output, 'legacy.png'));
  const store = legacy.clone().resize(512, 512, Jimp.RESIZE_BICUBIC);
  store.scan(0, 0, 512, 512, function (_x, _y, index) {
    this.bitmap.data[index + 3] = 255;
  });
  await store.writeAsync(path.join(output, 'play-store.png'));
  console.log(
    `Exported 1024px layers; mark ${mark.bitmap.width}×${mark.bitmap.height}px within the 64dp safe circle.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
