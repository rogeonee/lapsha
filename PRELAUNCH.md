# lapsha beta checklist

Audit: September 9, 2026, against commit `a1c4ca8`. This is a release assessment; app code and dependencies were not changed.

The feature set is sufficient for a small beta. Fix the date integrity bugs and the known runtime regression, settle the data recovery promise, and complete the distribution setup before inviting people to rely on it.

All unchecked items are pending discussion. We will work through them one by one and decide whether to fix, defer, or accept each; this checklist does not authorize a batch of implementation changes.

## Fix before inviting testers

- [ ] **B01 · P1 — Resolve the known Hermes memory regression.** The installed `expo@57.0.6` / React Native `0.86.0` combination is affected. `expo-doctor` specifically flags it, and Lapsha imports both Reanimated and Worklets, which trigger the documented problem. Stay on SDK 57 and align its maintenance releases; Expo identifies `expo@57.0.9` / RN `0.86.2` as the first fixed combination. The current compatibility check recommends Expo `57.0.21` / RN `0.86.3`. Preserve or rebase the local `@expo/ui` patch, rebuild both native apps, and rerun the iOS 18 software-backspace case. This is a concrete runtime issue, not a request to upgrade dependencies merely because newer versions exist. [Expo SDK 57 known regressions](https://expo.dev/changelog/sdk-57#known-regressions). Evidence: [package.json](/Users/rogeonee/dev/projects/lapsha/package.json), [patch](/Users/rogeonee/dev/projects/lapsha/patches/@expo%2Fui@57.0.6.patch).

- [x] **B02 · P1 — Preserve February 29 when editing an unknown-year date.** Completed September 10, 2026: unknown-year edit values use leap year 2000 while storage retains `0001-MM-DD`, including `0001-02-29`. Create/update validation rejects impossible dates (including non-leap February 29, February 30, and April 31). Upcoming and date details share the existing March 1 anniversary policy in non-leap years without changing stored month/day. Regression tests pass in UTC, Tokyo, and Edmonton. Physical Pixel 6 / Android 17: saved an unknown-year February 29, edited only its label, reopened and confirmed the picker in Tokyo and Edmonton, and verified SQLite still held `0001-02-29`, month 2, day 29, `year_known = 0`. Upcoming displayed March 1, 2027. iOS UI was not exercised.

- [x] **B03 · P1 — Initialize Android date pickers using UTC calendar components.** Completed September 10, 2026: entry and add-person pickers now share UTC-midnight input and UTC-component output conversions. Regression tests cover unchanged selections, known/unknown years, February 29, DST dates, and year boundaries in UTC, Tokyo, and Edmonton. Lint, TypeScript, and both native JS production exports passed. Physical Pixel 6 / Android 17: in Tokyo, selected September 9 in add-person, reopened and confirmed the unchanged selection, saved, then reopened and confirmed September 9 in the entry picker without a day shift. February 29 also survived entry-picker confirmation in Tokyo and Edmonton. Deleted the synthetic test person and restored `America/Edmonton` plus automatic timezone afterward. Tested current JS through the installed development client; no release-build or iOS UI sign-off implied.

- [x] **B04 · P1 — Keep Android Fact/Date drafts consistent with the visible fields.** Completed September 10, 2026: Android fact value, optional fact label, and date label now bind to the current independent drafts used by validation and saving. Physical Pixel 6 / Android 17: verified the Strawberry coffee reproduction, repeated Fact/Date switches with both fact fields populated, empty-date Save disabled, Birthday prefill surviving a round trip, fact/date save and edit, and independent quick-add drafts with date save. Saved values matched the fields, including SQLite checks of edited fact/date records. Lint and TypeScript passed. Tested current JS in the installed development client; iOS UI and release builds were not exercised.

- [x] **B05 · P1 for real-data use — Set the beta backup policy.** Decided September 11, 2026: retain default iOS backup behavior; remove unused SecureStore; include all other eligible Android app data while excluding `files/avatars/` from both cloud backup and device transfer. This retains the main SQLite database and separate preferences store without photos consuming Android’s 25 MB cloud quota. Android Settings explicitly explains that photos must be added again after restoring; missing avatar files fall back to initials. Verified on the physical Pixel 6 / Android 17 with a rebuilt local release APK: update install, cold start without Metro, readable Settings notice, and existing people/photos still visible. Decoded the compiled APK rules for legacy backup, cloud backup, and device transfer; lint and TypeScript passed. iOS was not exercised. Full OS backup/restore and transfer testing is deliberately deferred to the small friends beta, not claimed complete. No export/import UI or backend was added. Evidence: [config plugin](plugins/with-android-backup.js), [Settings](src/app/(tabs)/(settings)/settings.tsx).

## Small fixes before a wider beta

- [ ] **B06 · P2 — Make saved content readable by screen readers.** Shared fact/date rows hide their children with `aria-hidden` and expose only `Edit ${label}`. The iOS 26.5 accessibility tree confirmed that the saved date/year and a labeled fact's value were absent. Include the full fact or date in the accessible label/value while retaining edit/delete actions. Also label both quick-add actions: iOS exposes `quick-add`, while the physical Android accessibility dump marks its FAB `NAF=true` (no text or content description). Android add-person switches expose only `on`/`off`, without identifying Birthday or Include year. Evidence: [shared row](/Users/rogeonee/dev/projects/lapsha/src/components/person/entry-row.tsx:83), [tabs](/Users/rogeonee/dev/projects/lapsha/src/app/(tabs)/_layout.tsx).

- [ ] **B07 · P2 — Refresh Upcoming when the calendar day changes.** The screen derives relative dates from the clock, but subscribes only to database changes and a retry counter. No midnight timer, foreground refresh, or focus-based day invalidation exists. An app left open or resumed without a data write can retain yesterday's Today/Tomorrow grouping. Add a current-day invalidation shared with age/anniversary formatting; verify overnight resume and timezone changes. Confirmed on the Pixel 6 across a timezone/day change: after returning from Tokyo (September 10) to Edmonton (September 9), Upcoming still placed the September 9 birthday under September 2027. Navigating back to Home did not fix it; a cold restart correctly changed it to Today. An actual midnight boundary remains untested. Evidence: [Home screen](/Users/rogeonee/dev/projects/lapsha/src/app/(tabs)/(home)/index.tsx:316), [table subscription](/Users/rogeonee/dev/projects/lapsha/src/lib/use-table-version.ts).

- [ ] **B08 · P2 — Bound and scroll the Android quick-add person selector.** Confirmed on the Pixel 6 with 21 people at the normal font scale: expanding the selector pushes the oldest people and the form/Save below the screen; upward swipes do not reveal them. The selector maps every person into a plain view, with no scroll container. Keep every person and Save reachable using a bounded scrolling surface. Separately, at 200% font scale the add-person form kept Save reachable with the keyboard and birthday enabled, but its expanded sheet overlapped the status-bar area. Complete large-text checks for both entry sheets, including iOS, rather than treating this one passing form check as full coverage. Evidence: [Android entry sheet](/Users/rogeonee/dev/projects/lapsha/src/components/entry/entry-sheet.android.tsx).

- [ ] **B09 · P2 — Make Clear All Data report incomplete cleanup honestly.** Its SQL deletes are not wrapped in a transaction, avatar deletion exceptions are swallowed, and the separate SQLite preferences store is not cleared. Wrap the relational deletes together, reset the saved person/sort preferences, and report or retry failed photo cleanup instead of always reporting that all data was removed. Ordinary person deletion is intentionally soft-delete; preserve that accepted choice. Evidence: [clearAllData](/Users/rogeonee/dev/projects/lapsha/src/api/database.ts:148), [photo cleanup](/Users/rogeonee/dev/projects/lapsha/src/lib/avatars.ts:52), [preferences](/Users/rogeonee/dev/projects/lapsha/src/lib/prefs.ts).

## Distribution and tester setup

### iOS: TestFlight

- [ ] Confirm Apple Developer membership, signing access, and an App Store Connect app record for `com.rogeonee.lapsha`. Account/console state was not inspected during this review.
- [ ] Build with the EAS **production** profile and upload a store-signed iOS build. `preview` is configured for internal/ad hoc distribution; it is not the TestFlight profile. Remote build numbering and production `autoIncrement` are already configured in [eas.json](/Users/rogeonee/dev/projects/lapsha/eas.json).
- [ ] Configure a tester group. Friends outside your App Store Connect team are **external testers**; plan for the first external build's beta review. TestFlight builds expire after 90 days. [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).
- [ ] Fill in the beta description, feedback email, review contact, and What to Test. State that there is no sign-in and give reviewers a short create-person/add-fact/add-date path. [Test information](https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-test-information/).
- [ ] Publish a privacy policy and link it in Settings and the relevant console metadata before external review. Settings includes About, version, Clear All Data, and an Android backup explanation. Describe local storage, photos, OS backups as actually configured, deletion, and any voluntary feedback. Apple requires an accessible in-app policy link. [App Review guideline 5.1.1](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage).
- [ ] Validate the final archive's privacy manifests, export-compliance answers, icons, launch screen, signing, and current upload SDK requirements. The local Xcode is 26.6; the EAS build image is not pinned here. The generated iOS privacy manifest exists and the non-exempt-encryption flag is already set; those still need checking in the distributed artifact. [Apple submission requirements](https://developer.apple.com/app-store/submitting/).

### Android: Google Play testing tracks

For a small friends beta, start with **Google Play internal testing**: up to 100 testers, Play Store installation and updates, and no need to finish the entire public listing first. Move to **closed testing** when you want a wider controlled beta or need the production-access test. These are the Android equivalents of the TestFlight workflow. [Google Play testing tracks](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en).

- [ ] Confirm the Play developer account, required identity/device verification, app record, and signing credentials. Preserve `com.rogeonee.lapsha` once uploaded.
- [ ] Produce a production **AAB**, configure Play App Signing, and upload it to the intended testing track. Use an appropriate service account if submitting through EAS. A preview APK is useful for sideload testing, but is not the Play submission artifact. [EAS Android submission](https://docs.expo.dev/submit/android/).
- [ ] Add the tester email list or Google Group, share the opt-in link, and provide a feedback email/URL.
- [ ] For closed testing, finish the privacy policy, Data safety, content rating, target audience, ads declaration, app access, and required listing assets. Apps exclusively on the internal track are exempt from the Data safety form; closed testing is not. On-device-only processing does not itself count as off-device collection, but check the actual SDK behavior before declaring that nothing is collected. [Data safety requirements](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).
- [ ] If this is a personal developer account created after November 13, 2023, plan a closed test with at least **12 testers opted in continuously for 14 days** before applying for production access. This does not prevent starting an internal beta. [New personal account testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
- [ ] Validate the final AAB's target API, 16 KB native-library/page alignment, permissions, signing, and Play pre-launch report. The installed Pixel build targets API 36, matching the current new-app requirement. The existing local APK passes the ZIP 16 KB alignment check; all 26 arm64 shared libraries also pass the 16 KB ELF `PT_LOAD` alignment check. A future AAB still needs its own validation. The existing APK also declares overlay and legacy storage permissions: review whether these are needed in the production manifest. Camera/microphone and broad `READ_MEDIA_*` permissions were not present in the inspected APK. [Target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).

### Both platforms

- [ ] Show the build number alongside `0.1.0` in Settings so reports identify the exact binary; it currently shows only the marketing version.
- [ ] Give testers one feedback destination and a short script: add a person, optionally choose a photo/birthday, add and edit a fact/date, try quick add, and reopen the app the following day. Use synthetic details in screenshots and reports.
- [ ] Confirm access to TestFlight crash feedback and Android crash/ANR reports. Start with platform diagnostics; adding analytics is not necessary for this beta.
- [ ] Decide the supported OS range. Generated native settings currently admit iOS **16.4+** and Android **7/API 24+**, considerably wider than the devices inspected. Either test the advertised floor or intentionally raise it. Specifically include Android 14 or below if retained: the notebook records a possible keyboard double-shift there.

## Final candidate acceptance run

Run this on the actual signed candidate, using a separate disposable dataset. The following boxes remain open; the limited checks below are not a full device sign-off.

- [ ] Fresh install and cold start with no Metro connection; launch offline, and open all tabs. Verify icons, splash, and the light-only theme when the OS is dark.
- [ ] Add person with and without birthday/photo; cancel every sheet and picker; reopen; rapidly press Save; verify exactly one record and working navigation.
- [ ] Create/edit labeled and unlabeled facts and dates; switch Fact/Date tabs mid-draft; try blank/whitespace and over-limit input, multiline paste, long names, and emoji. Check that visible field contents match what saves.
- [ ] Verify global quick add, last-person selection, person-specific entry, and navigation back to the originating Home/People stack. On iOS below 26, verify the existing person-screen entry path.
- [ ] Photo pick, crop, cancel, change, remove, expand/collapse, and missing-file fallback. Verify photos survive app updates and iOS restore. Android cloud backup and device transfer intentionally omit photos: verify records/preferences return, initials replace missing photos, and photos can be added again.
- [ ] Swipe/delete a test fact/date, cancel/confirm deletion of a test person, and clear the disposable dataset. Check every tab refreshes and cleanup failures are not falsely reported as success.
- [ ] Calendar cases: today/tomorrow, December 31/January 1, known/unknown years, February 29, DST, west/east-of-UTC zones, background overnight, and a timezone change.
- [ ] iOS 18 and 26: rapid **software-keyboard** backspace in prefilled name/fact/date fields after a clean native rebuild; dismissal with keyboard open; photo/header behavior. Recheck the local native patch after dependency maintenance.
- [ ] Physical Android: keyboard avoidance, system Back, repeated sheet open/dismiss, date dialog, 20–50-person picker, long content, and both navigation modes where relevant.
- [ ] VoiceOver/TalkBack, largest text sizes, reduced motion, and small-screen safe areas. The photo animation explicitly uses `ReduceMotion.Never`; revisit it during this pass. Keep the already-accepted accent contrast tradeoff separate from newly found accessibility defects.
- [ ] Install candidate N, create records/photos/preferences, update to N+1 without uninstalling, then verify all data. Exercise database v1/v2 migration fixtures separately. Full OS backup/restore and Android device-transfer tests are deferred to the friends beta by the B05 decision.
- [ ] Interrupt a save/photo import, simulate unavailable storage/database failure, and confirm the user can recover without duplicate or apparently missing data. Detail-screen fact/date read errors currently become empty arrays; verify and improve that failure presentation if necessary.

## Evidence from this sweep

| Check | Result |
| --- | --- |
| App naming | `app.json` already says `lapsha`; generated iOS display name and existing Android APK label are lowercase too. Console listing names remain unverified. |
| Static checks | `bun run lint` and `bunx tsc --noEmit` passed. |
| Native JS production export | Separate iOS and Android exports passed, including Hermes bytecode generation. This is not native archive/signing verification. |
| Dependency checks | `expo-doctor`: 19/21 checks passed; failures were the Hermes regression and SDK package alignment. `expo install --check` reported 24 mismatches. |
| Database | Actual migration SQL executed against isolated SQLite for fresh/v1/v2 → v3; sample facts/dates retained, foreign keys valid, normal SQL clear path passed. Native change listeners, disk failure, and upgrade installation were not tested by this check. |
| Dates | Executed actual helpers to reproduce unknown-year Feb 29 corruption and Android's east-of-UTC input shift. Confirmed known-year invalid-date acceptance. |
| iOS 26.5, iPhone 17 Pro simulator | Inspected Upcoming, person detail, date-sheet open/dismiss, and accessibility tree. Confirmed missing saved content in row semantics. |
| iOS 18.0, iPhone 16 Pro simulator | Inspected Upcoming, person detail, prefilled fact sheet and keyboard; ten rapid software delete taps did not crash the installed build. Temporary edit discarded. This is one fact-field smoke check, not all patched paths. |
| Physical Pixel 6 | Android 17, installed release `0.1.0` / build 1 / target API 36. Follow-up device pass below supersedes the initial metadata-only inspection. Installed APK matches the inspected local release APK byte-for-byte. |
| Release access | No App Store Connect, Play Console, EAS credential inspection, upload, invitation, or publication performed. |

An initial generic `expo export --platform all` also attempted the unsupported web target and failed there; only the separate native exports are relevant above. The diagnostic tool's incidental Corepack `packageManager` insertion was removed; no app/dependency changes remain from the audit.

### Android device follow-up

Physical Pixel 6, Android 17, installed non-debuggable release `0.1.0` (build 1), target API 36. This was an existing installation with user data, not a fresh-install or update test. No app code, dependencies, signing, or distribution settings were changed.

| Area | Observed result |
| --- | --- |
| Normal creation | Created a synthetic person with an unknown-year birthday. Repeated Save taps produced one person. Created another 17 named synthetic people for the overflow test. |
| Facts and quick add | Saved an unlabeled fact and a labeled Coffee / Oat latte fact. Person selection and ordinary saves worked; switching Fact/Date mid-draft exposed B04. |
| Keyboard and dismissal | Opened and dismissed sheets repeatedly; system Back hid the keyboard before dismissing the sheet. Native date-picker cancellation preserved the saved birthday. |
| Photos | Picked a synthetic image from the system photo picker, accepted the square crop, expanded/collapsed the saved avatar, and removed it back to initials. Photo replacement, missing-file fallback, and persistence across updates remain untested. |
| Deletion | Swiped and deleted a synthetic fact. Cancelled person deletion, reopened the confirmation, then deleted the synthetic person; its Upcoming row disappeared immediately. Opened Clear All Data and chose Cancel; the original three people remained. The destructive Clear action was not executed against the existing dataset. |
| Dates/timezone | Reproduced B03 in Tokyo and B07 when returning to Edmonton across a calendar-day boundary. A cold restart corrected Upcoming. |
| Longer people list | At 21 people, expanding the quick-add selector made older people and the rest of the form unreachable (B08). |
| Large text | At 200% font scale, add-person Save remained reachable with birthday enabled and keyboard open. Sheet top overlapped the status-bar area; other large-text flows remain incomplete. |
| Accessibility semantics | Android UI hierarchy confirmed the unlabeled quick-add FAB and switches without contextual labels (B06). This was not an end-to-end TalkBack test. |
| Native binary | Installed APK matched the local release APK byte-for-byte. ZIP alignment and all 26 arm64 libraries' ELF load-segment alignment passed the 16 KB checks. |

**Cleanup complete:** all 18 synthetic people (`Beta QA Android`, `Beta QA List 01`–`17`) were removed through the normal soft-delete flow. The People list was verified to contain only the original three people afterward; existing user records were not edited or deleted. The synthetic avatar was removed through the app before person deletion, and `/sdcard/Pictures/lapsha-beta-audit.png` was deleted and verified absent. Font scale was verified restored to 1.0; timezone was verified restored to America/Edmonton with automatic timezone enabled. No crashes were observed during these flows; the available crash buffer contained no entry naming Lapsha. This does not resolve the known runtime regression in B01.

Remaining device coverage includes photo replacement and cancellation at the crop stage, date deletion and disposable-dataset Clear All Data, full TalkBack, older Android versions, alternate navigation mode, upgrade installation, backup/restore, offline fresh launch, storage failures, and an actual midnight boundary. These remain acceptance checks above, not additional confirmed defects.

## Safe to defer

Search, manual ordering, a dedicated Notes section, dark mode, notifications, sync/accounts, and a global quick-add fallback below iOS 26 do not need to hold up a small beta. Describe the current scope honestly: dates appear in Upcoming; they do not send reminder notifications. Search is likely the first feature to revisit once testers accumulate people. A larger recovery/export feature can wait only if the beta's data-loss limitations are explicit and acceptable.
