# Gifts prototype

Private gift ideas for each person, with an Android capture flow that saves the photo before asking for details. A title is optional; a photo, thought, or link is enough.

## Try it on Android

- Open a person → **Gifts** camera → shutter. The photo is saved immediately. **Add details** opens the editor; **Undo** removes the capture.
- From global **+**, choose **Snap gift**. Capture first, then choose a person or **Choose later**. Unassigned ideas appear under **Unsorted gift ideas** on Home.
- **Add gift idea** supports text or links without a photo. The editor can take a photo or import from the system gallery without cropping. Photos and person assignments save immediately; text/status edits use **Save details**.
- Tap an attached photo to view it, pinch to zoom, or use **Zoom / reset**. The domain row opens an attached link separately.
- **Given** moves the idea out of the active list into collapsed **Previously given** history. Its date and status remain editable.

Links without a scheme receive `https://`; only HTTP(S) is accepted. Photo-only cards show the picture prominently. Cards with text use a thumbnail, stacking at larger text sizes.

## Distinct test build

**Lapsha Gifts Lab** uses a purple flask launcher icon, package `com.rogeonee.lapsha.giftslab`, and scheme `lapsha-gifts-lab`. It installs beside the Play app with independent data. The release APK includes JavaScript and does not need Metro.

```bash
bun run android:gifts-lab
```

For an EAS internal APK, use the `gifts-lab` profile. The Lab override is selected by `APP_VARIANT=gifts-lab`; normal app configuration stays unchanged. After switching variants locally, regenerate Android before building:

```bash
# Regenerate the normal package/name/icon after a Lab build.
bunx expo prebuild --platform android --clean --no-install
```

The local native folder is generated and ignored by Git. A new native build is required because this slice adds `expo-camera`.

## Persistence and recovery

Schema v5 preserves v4 gift rows while allowing a nullable recipient/title, an optional photo filename, and a given date. Services remain synchronous, validated, and soft-delete aware. Person deletion hides assigned gifts; unassigned gifts form the inbox.

Photos live in `documents/gift-photos/`, referenced by bare filenames. A small journal precedes the permanent copy/database save; startup replays unfinished captures idempotently. Photo replacement commits the target update and staging-row deletion together. A separate marker identifies interrupted gift gallery selections so avatar selections cannot become gifts.

Clear All Data removes gift records, photos, and pending journals. Android backup rules exclude avatars, but gift photos remain eligible for OS backup and device transfer. Actual restore/transfer is still unverified.

## Verification — October 3, 2026

Physical **Pixel 6 / Android 17**, standalone release build:

- Scoped photo-only capture; optional-title details; Given history.
- Global capture; choosing a person later; force-stop and reopen with the unassigned photo intact.
- Gallery replacement without a duplicate active idea; assignment from Unsorted.
- Photo viewer zoom/reset and dismissal.
- Camera permission denial/retry; background/resume; cancel without capture.
- Enlarged text (font scale 1.3), scrolling, keyboard entry, and discard of unsaved details while retaining the photo.
- Capture Undo; editor deletion returning to the person; Clear All Data followed by a cold start with an empty People list.
- Distinct app name, icon, package, and separate installation alongside the existing apps.

Automated migration/service tests cover preservation of prototype data, optional-title validation, given dates, assignment, soft deletion, atomic photo replacement, transaction rollback, interrupted capture replay, and injected database failure. `bun run check`, all 60 Bun tests, and `git diff --check` passed.

Not physically verified: OS backup/transfer, storage exhaustion, process death while the gallery picker is open, TalkBack, or other Android versions. Recovery tests inject a database failure; they do not substitute for those device scenarios.

## Next slice

Automatic link metadata/previews, share-sheet capture, and the iOS camera/editor presentation remain follow-ups. Existing iOS text/link entry keeps optional titles and preserves photo fields, but this change has not had an iOS device pass. No sharing, accounts, price tracking, affiliate links, or scheduled gift reminders are included.
