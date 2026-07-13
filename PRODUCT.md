# Product

## Register

product

## Users

A single person keeping private notes about the people who matter to them — friends, family, colleagues. Today that user is the developer himself; the app is a daily-driver personal tool first, with an eventual public App Store release in mind. Usage context is quick, in-the-moment capture ("she mentioned she's allergic to walnuts") and quick recall before a call, a gift, or a visit. Sessions are short and frequent, on a phone, often one-handed.

The job to be done: never let a meaningful detail about someone you care about slip away, and find it again in seconds.

## Product Purpose

Lapsha ("noodles" in Russian) is a local-first personal relationship manager. Each person gets facts (label/value pairs), important dates (birthday pinned first), and free-form notes. Single-user, no accounts, no network — everything lives in a local SQLite database by deliberate stance, not as a shortcut.

Success looks like: capture takes under ten seconds from anywhere in the app (quick add), recall is instant, and the app earns a permanent spot on the home screen without ever feeling like work.

## Brand Personality

**Warm, personal, native.**

The app should feel like a well-kept notebook about friends — cozy and human, never clinical. The content (people and their details) is intimate; the interface honors that with warmth rather than data-management coldness. The amber accent carries the warmth; the neutral surfaces stay quiet so the people are the content.

References:
- **Apple's own apps** (Contacts, Notes, Journal): native affordances — large titles, sheets, swipe actions, system materials — with personal content at the center.
- **Clay / Monaru** (personal CRMs): people-first layouts where relationship warmth is a design feature, not decoration.

## Anti-references

- **Sales CRMs (Salesforce, HubSpot):** no pipelines, no "contacts as leads" energy, no cold data-table treatment of people.
- **Generic cross-platform apps:** never web-app-in-a-wrapper. iOS gets SwiftUI-native components and conventions; Android gets Material 3. Platform-split UI is already an architectural commitment (EntrySheet, icons, quick add) — design must respect it.
- **Social network profiles:** person entries are private notes, not public profiles. No follower-count/profile-page aesthetics.

## Design Principles

1. **Capture in seconds.** Adding a fact must never take more than a few taps from anywhere. Any friction in the capture flow is a product bug, not a polish issue.
2. **People are the content; the app disappears.** Quiet neutral surfaces, one warm accent, native system affordances. The interface should read as "my notes about Anna," not "a database record."
3. **Native to each platform, always.** Follow iOS and Android conventions faithfully (sheets, large titles, swipe-to-delete on iOS; M3 components on Android). Familiarity is trust — invented affordances are the failure mode.
4. **Warmth without clutter.** Warmth comes from the amber accent, tone of copy, and human details — not from decoration, badges, or density. Each screen has one clear job.
5. **Local-first is a feature.** Privacy of intimate data is part of the product's character; the design can quietly reinforce that this data never leaves the device.

## Accessibility & Inclusion

No formal commitments recorded yet — revisit before App Store release. Practical baseline in the meantime: keep text contrast readable against the neutral palette, respect standard touch-target sizes, and prefer system components (which carry Dynamic Type and platform accessibility for free). The app is currently locked to light mode. The semantic dark values in `global.css` are compatibility scaffolding for third-party components, not a designed Lapsha dark theme.
