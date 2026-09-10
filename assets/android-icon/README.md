# Android app icon

Abby uses the approved `assets/reference/app-icon/abby-diagonal-transparent.png`
artwork, centered over Lapsha Paper (`#F9F7F4`). The iOS Icon Composer asset is
independent and unchanged. No Figma editing is needed to build these exports.

| File             | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `foreground.png` | 1024×1024 transparent adaptive foreground        |
| `monochrome.png` | Matching alpha mask, black RGB, for themed icons |
| `legacy.png`     | 1024×1024 opaque square fallback                 |
| `play-store.png` | 512×512 opaque RGBA PNG for the Play listing     |

The background is supplied by `android.adaptiveIcon.backgroundColor` in
`app.json`; a separate flat background PNG is unnecessary. Both adaptive PNGs
represent Android's full 108dp layer. The artwork fits within a centered 64dp
circle, leaving margin inside the 66dp guaranteed safe region. Do not enlarge
these padded layers to fill the square or bake rounded corners into them.
The legacy/store exports use the inner 72dp viewport over an opaque background.

## Splash screen (iOS and Android)

Both platforms reuse `foreground.png` through the `expo-splash-screen` plugin
in `app.json`, centered on Paper (`#F9F7F4`). The 288pt/dp image width includes
the transparent padding: Abby herself is about 122×141pt/dp. The existing 64/108
safe-circle proportion also fits inside Android's 192dp splash safe circle.
Keep the padding and use `contain`; the legacy/store images would add an opaque
square. The splash stays light to match the app's light-only interface.
The root layout enables Expo's native 300ms cross-fade on iOS; Android retains
its existing native fade. Both iOS 18.0 and 26.5 release cold launches were
recorded again to verify the fade into the loaded screen.

Regenerate native resources with `bunx expo prebuild --no-install`, then rebuild.
Verify cold launches with release builds; Expo Go and the development client's
own launch screen do not faithfully represent the production splash.

Verified on 2026-09-09 with local release builds:

- Pixel 6, Android 17: recorded the centered, unclipped splash and its fade into
  Upcoming; repeated the cold launch successfully. Existing data was preserved.
- iPhone 16 Pro simulator, iOS 18.0 (system light), and iPhone 17 Pro simulator,
  iOS 26.5 (system dark): recorded the splash and successful transition into
  Upcoming; inspected both running apps through `serve-sim` in Chrome.
- `bun run lint`, `bunx tsc --noEmit`, and both native release builds passed.
  Other Android versions and physical iPhones were not tested.

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
