# Gifts prototype

Private gift ideas for each person, with an Android capture flow that saves the photo before asking for details. A title is optional; a photo, thought, or link is enough.

## Try it on Android

- Open a person → **Gifts** camera → shutter → native confirmation. The phone supplies zoom, flash, lens controls, and retake. Confirmation saves the photo and returns to its gift card; tap the card text to edit or swipe to delete.
- From global **+**, choose **Snap gift**. Capture first, then choose a person or **Choose later**. Unassigned ideas appear under **Unsorted gift ideas** on Home.
- **Add gift idea** supports text or links without a photo. The recipient picker sits above the photo; photo actions stay beside it. Photos and person assignments save immediately; text/status edits use sticky **Done**. The full-width status switch is grouped separately, with **Delete idea** at the end of the form. Removal, deletion, and discard confirmations use HeroUI on Android.
- Tap an attached photo to view it. Double-tap to zoom/reset, pinch to zoom, and drag to pan. The close icon or Android Back dismisses the viewer. The domain row opens an attached link separately.
- **Given** moves the idea out of the active list into collapsed **Previously given** history. Its date and status remain editable.

Links without a scheme receive `https://`; only HTTP(S) is accepted. Photo-only cards show the picture prominently. Cards with text use a thumbnail, stacking at larger text sizes. The whole gift body shares pressed feedback and a right-edge swipe action; link footers remain independent. Dates, Facts, and Gifts share consistent section headings.

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

The local native folder is generated and ignored by Git. A new Android native build is required for the camera configuration and pinned Expo recovery patches; JavaScript reload alone cannot apply them.

## Persistence and recovery

Schema v5 preserves v4 gift rows while allowing a nullable recipient/title, an optional photo filename, and a given date. Schema v6 allows existing ideas to become blank when the last photo or details are removed; creating a new idea still requires content. Services remain synchronous, validated, and soft-delete aware. Person deletion hides assigned gifts; unassigned gifts form the inbox.

Photos live in `documents/gift-photos/`, referenced by bare filenames. A small journal precedes the permanent copy/database save; startup replays unfinished captures idempotently. Photo replacement commits the target update and staging-row deletion together. A separate marker identifies interrupted gift camera/gallery selections so avatar selections cannot become gifts.

Startup waits for picker recovery before reopening a restored capture route. Pinned Android patches in `expo-modules-core` and `expo` persist the native request before launch and wait for ReactHost initialization before delivering the result. Interrupted captures recover into Unsorted. Expo's existing five-minute recovery expiry remains; recheck both patches and rebuild Android when upgrading Expo. Native contract limitations are recorded in `notebook.md`.

Clear All Data removes gift records, photos, and pending journals. Android backup rules exclude avatars, but gift photos remain eligible for OS backup and device transfer. Actual restore/transfer is still unverified.

## Verification — October 3–4, 2026

Physical **Pixel 6 / Android 17**, standalone release build:

- Scoped photo-only capture; optional-title details; Given history; single saved card after capture and after adding a title.
- Global capture; choosing a person later; force-stop and reopen with the unassigned photo intact.
- Gallery replacement without a duplicate active idea; assignment from Unsorted.
- Whole-card pressed feedback and right-edge swipe actions for text/photo cards, independent links, consistent section headings, and history disclosure.
- Photo viewer double-tap, focal pinch zoom, bounded pan, pinch-to-one-finger handoff, dismissal, and restored status-bar/keyboard behavior.
- Camera permission denial/retry; background/resume; cancel without capture.
- Enlarged text (font scale 1.3), scrolling, keyboard entry, and discard of unsaved details while retaining the photo.
- Last-photo removal to a blank saved idea; HeroUI confirmations; sticky Done; full-width status controls; gallery dismissal without a button flicker.
- Killing the Lab process while native camera stays open, then confirming, recovers exactly one Unsorted gift. Cancellation after shutter creates none, and the next intentional capture opens normally.
- Swipe/editor deletion returning to the person; Clear All Data followed by a cold start with an empty People list.
- Distinct app name, icon, package, and separate installation alongside the existing apps.

Automated tests cover preservation of prototype data, blank updates versus empty creation, optional-title validation, given dates, assignment, soft deletion, atomic photo replacement, transaction rollback, interrupted capture replay, selection recovery, photo transform geometry, and injected failures.

Not physically verified: OS backup/transfer, storage exhaustion, process death while the gallery picker is open, TalkBack, or other Android versions. The camera/viewer track had no new large-text or reduced-motion setting pass. Phone font and animation settings were restored, QA records cleaned up, and existing user data retained.

## Next slice

Automatic link metadata/previews, share-sheet capture, and the iOS camera/editor presentation remain follow-ups. Existing iOS text/link entry keeps optional titles and preserves photo fields, but this change has not had an iOS device pass. No sharing, accounts, price tracking, affiliate links, or scheduled gift reminders are included.
