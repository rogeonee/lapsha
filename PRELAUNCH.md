# Lapsha release record

Current distribution state, confirmed October 16, 2026. Both platforms use the main app identity, `com.rogeonee.lapsha`.

## Android — Google Play internal testing

- Available to internal testers. Last recorded rollout: `0.1.0 (4)` from `4e7c619`, published October 11, 2026 with full rollout through EAS Submit.
- The user updated their Pixel and accepted normal appearance and behavior.

## iOS — internal TestFlight

- Available through internal TestFlight. Distribution and installation on the user's Mac were confirmed October 14, 2026; the Mac UX caveat was accepted for that milestone.
- The distributed version/build and source revision are not recorded here. iPhone acceptance has not been recorded.

## Open before external testing or production

Carried forward from the September beta audit; none is recorded as resolved.

- **Supported OS range.** Generated settings admit iOS 16.4+ and Android API 24+, wider than the tested devices. Test the floor or raise it; Android 14 and below need the keyboard double-shift check in the notebook.
- **Android permissions.** The generated manifest declares `SYSTEM_ALERT_WINDOW` and legacy external-storage permissions; confirm whether production needs them.
- **External TestFlight.** The first external build needs beta review and test information (no sign-in; a short add-person/fact/date path). Add the [privacy policy](https://lapsha-landing.vercel.app/privacy) URL to the store metadata.
- **Play closed testing and production.** Closed testing requires Data safety, content rating, target audience, ads, app access, and listing assets. A personal developer account created after November 13, 2023 needs 12 testers opted in for 14 continuous days before applying for production access.
- **Tester support.** Give testers one feedback destination and confirm access to TestFlight crash feedback and Play crash/ANR reports.
- **Signed-candidate checks.** Update N→N+1 without uninstalling and verify records, photos, and preferences; launch offline from a cold start; cover calendar edges (December 31, February 29, DST, timezone change); and confirm interrupted saves or photo imports recover without duplicate or missing data.

Release build/submission configuration lives in [eas.json](eas.json); accepted engineering decisions live in [notebook.md](notebook.md).
