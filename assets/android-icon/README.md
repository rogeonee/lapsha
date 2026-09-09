# Android app icon

Abby uses the approved `assets/reference/app-icon/abby-diagonal-transparent.png`
artwork, centered over Lapsha Paper (`#F9F7F4`). The iOS Icon Composer asset is
independent and unchanged. No Figma editing is needed to build these exports.

| File             | Purpose                                                 |
| ---------------- | ------------------------------------------------------- |
| `foreground.png` | 1024×1024 transparent adaptive foreground               |
| `monochrome.png` | Matching alpha mask, black RGB, for themed icons        |
| `legacy.png`     | 1024×1024 opaque square fallback                        |
| `play-store.png` | 512×512 opaque RGBA PNG for the Play listing            |

The background is supplied by `android.adaptiveIcon.backgroundColor` in
`app.json`; a separate flat background PNG is unnecessary. Both adaptive PNGs
represent Android's full 108dp layer. The artwork fits within a centered 64dp
circle, leaving margin inside the 66dp guaranteed safe region. Do not enlarge
these padded layers to fill the square or bake rounded corners into them.
The legacy/store exports use the inner 72dp viewport over an opaque background.

The monochrome asset preserves the outline, eye, nose and collar as alpha;
it is not a grayscale image on an opaque square. The launcher supplies both
foreground and background colors when themed icons are enabled.

## Regeneration

With the project's dependencies installed:

```sh
node scripts/export-android-icon.cjs
bunx expo prebuild --platform android --no-install
bun run android
```

The exporter uses `jimp-compact`, already supplied by Expo's image tooling.
It preserves the approved mark rather than generating a new illustration.
Rebuilding/reinstalling is necessary: launcher resources do not update through
Fast Refresh or an OTA update. The Play Store PNG is uploaded separately to
Play Console; it is not an adaptive layer.

## Verification — 2026-09-09

- Checked transparency, monochrome RGB, image dimensions and safe-circle bounds.
- Verified Expo prebuild emitted foreground, background and monochrome references.
- Android debug build and `bun run lint` passed.
- Installed on the USB-connected Pixel 6, reporting Android 17; visually checked
  the color icon in Pixel Launcher's circular app-drawer mask.
- Themed light/dark variants and alternate masks were inspected in the browser
  preview, not with device theme settings. Other Android versions and OEM
  launchers were not tested. iOS was not retested for this Android-only change.

## Official guidance

- [Expo app icons](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/#app-icon)
- [Android adaptive icons](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)
- [Google Play icon specifications](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)
