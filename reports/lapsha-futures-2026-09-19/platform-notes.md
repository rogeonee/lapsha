> Research workpaper, 19 September 2026. This records exploration and debate; the HTML report contains the final synthesis and incorporates the user’s direction to learn from and improve on competitors.

# Lapsha: music integrations, wishlists, and business reality

Research partner memo. Checked 2026-09-19. Product baseline: `PRODUCT.md`, `CLAUDE.md`, `notebook.md`; private native personal notebook, single user, SQLite, no account/backend. All proposals and economics below are hypotheses, not observed Lapsha demand or forecasts. No app files changed.

## Recommendation

Build the useful unit **“something this person would appreciate, with the reason I saved it”**, not a music integration. A shared song, a book recommendation, an exact gift link, an experience someone mentioned, and a promise to lend something are all the same capture-and-recall problem. Music is a good example, but weak as a separate strategic pillar.

The strongest near-term commercial hypothesis is a dependable private notebook that becomes useful before birthdays, visits, meals, and conversations. Links, gifts, and reminders can earn their place by making those moments easier. Automatic taste dossiers add access risk and questionable accuracy while removing the personally meaningful reason a detail was remembered.

Recommended order: reliable export/restore and retrieval → share-to-person capture → gift ideas and history → explicit, selected preference sharing if users request it → optional paid cross-device service only when demand pays for the responsibility. A cloud service can remain compatible with local-first; it cannot retain an absolute “data never leaves this device” promise.

## Spotify: feasibility versus launchability

There is no general “get this friend's favorites” endpoint. Distinguish at least four meanings of favorite:

| Meaning | Official access | Consequence |
|---|---|---|
| Current user's most-affine artists/tracks | `GET /me/top/{type}`, OAuth `user-top-read` | Calculated listening affinity, not an explicit declaration that something is their favorite. [S1] |
| Current user's saved/liked songs | `GET /me/tracks`, OAuth `user-library-read` | A saved library, not a public profile lookup. [S2] |
| Current user's followed artists | `GET /me/following`, OAuth `user-follow-read` | Artist follows only; still the signed-in user. [S3] |
| A song, artist or playlist the friend actually sends | User-provided ordinary link | Can save link and the user's own explanation; opening goes to Spotify. No account import needed. [S8] |

The subject would have to authenticate and consent to access their own personal data. The notebook owner's Spotify login does not authorize access to everyone in their Lapsha. A friend's public profile is not equivalent to permission or technical access to likes/top items. Even when someone consents, ask them to select what they want to share instead of assuming all listening history is a useful or appropriate relationship fact.

OAuth on a native device does **not inherently require operating a Lapsha backend**: Authorization Code with PKCE is the relevant public-client pattern. Credentials/token lifecycle, revoke/disconnect handling, privacy disclosures, and network dependence still become product responsibilities. [S4]

The launch blocker is separate: current development mode allows only five authenticated, allowlisted users per app and requires the app owner to have Premium. Extended access requires a registered organization, active launched service, at least 250,000 MAU, specified market/commercial criteria, and subsequent review. Meeting thresholds is not approval. This is not a realistic public-launch dependency for Lapsha. [S5] Spotify's February 6, 2026 announcement explicitly frames the narrowed development mode as noncommercial experimentation/personal use. [S6]

**Freshness trap:** February's one-client-ID rule is stale. The July 2026 changelog increases the limit to 25 and pools development quotas across the developer account. It does not make five-user development apps a production path. [S7] Do not propose cycling client IDs or asking consumers to become developers as a business model.

The February development-mode changes also removed other-user profile and playlist-list endpoints; another person's playlist contents are not a safe assumption merely because its URL is public. Current changes retain own top/library access, with narrower general endpoint availability. [S9]

Policy is an additional design blocker: the current policy prohibits analysis that builds user profiles, commercial product offers, and AI ingestion of Spotify Content; requires attribution/link-back for displayed content; and requires deletion of a disconnected user's personal data. Non-streaming paid apps have limited commercial permission, so “Spotify forbids every paid app” is also incorrect. My inference: automatic friend-taste profiles and Spotify-derived gift recommendations are poor fits; obtain explicit platform clearance before any such investment. Permanent copied dossiers also make disconnect deletion difficult. [S10]

**Decision:** ordinary links now; own-account experimentation only as a disposable prototype; no promised public favorites integration or automated gift engine built on Spotify.

## Apple Music and other alternatives

Apple Music technically has broader documented native integration: catalog search; personalized library/recent listening/Replay; favorite-related operations; MusicKit on Apple platforms, Android, and web. Personal data requires user permission; it does not reveal any named friend's private preferences. Apple platforms automatically manage user tokens, while Android requires manual user-token management. [S11, S12]

It is not a policy loophole. Apple's current agreement limits MusicKit to facilitating users' Apple Music subscriptions, prohibits unrelated purposes and charging for/indirectly monetizing access, and constrains use of artwork/music text and user metadata. A paid relationship notebook mining favorites needs a permitted use-case review, not just a successful API call. [S13]

Use ordinary Apple Music share links, which Apple explicitly supports, just as with Spotify. [S14] For Bandcamp, YouTube, books, shops, restaurant pages, and existing wishlists, the same generic URL-with-user-entered-title pattern avoids claiming API access at all. Saving a URL does not mean importing its private contents. Treat richer previews as optional network activity with separate source rules; do not promise scraped descriptions, prices, availability, or wishlist synchronization.

An interesting niche exception is Last.fm: documented top-artists and loved-tracks endpoints accept a username and API key without user authentication. That is genuinely different from Spotify's `/me` endpoints. [S15, S16] But commercial API use requires a separate agreement and attribution obligations apply; this is not a free unqualified production alternative. [S17] It also only helps people who actually use Last.fm. A profile link is enough to test demand.

**Useful first version:** person + URL + optional plain title + one sentence of context + saved date. Optional intent: “they want this,” “I might give this,” “they recommended this,” “we could do this together.” Those are different meanings; do not collapse them into an inferred favorite. For gifting, add idea/bought/given, occasion, and “already owns it.” Price entry can be manual and dated. A few carefully saved items beat a giant import of unknown relevance.

## Comparable prices, checked 2026-09-19

These establish that consumers are offered both subscriptions and free alternatives. They do **not** establish demand, retention, profitability, or what Lapsha can charge. USD where the source explicitly specifies it; storefront and billing cadence matter.

| Product | Live first-party price | Why it matters |
|---|---|---|
| Amicu | $3.99/month; $29.99/year; country variation disclosed | Close individual relationship/reminder comparison. Unlimited contacts/reminders and privacy remain free; paid customization/statistics/supporter proposition. [P1] |
| Fabriq | US $4.99/month or $39.99/year in developer's store description | Close consumer relationship-habit subscription. [P2] |
| Monica | Hosted $9/month or $90/year; self-host software $0 | Rich personal CRM. Operating/backup/support service is what hosted users buy; export and basic privacy are not premium. [P3] |
| Dex | Premium $12/month on annual billing ($144/year), Professional $20/month on annual billing | More professional/integration-heavy reference; includes messaging/email/calendar/social sync, not like-for-like local note economics. Main pricing page has cadence toggle; current official comparison clarifies annual basis. [P4, P5] |
| Clay URL now redirects to Mesh | Free personal tier up to 1,000 contacts; visible Pro price $10/month, with monthly/annual toggle and promotional display | Important competitive change; do not repeat historical Clay prices. Billing commitment not unambiguously exposed by static text, so do not claim $10 is cancellable monthly. [P6] |
| Obsidian (adjacent, not personal CRM) | Free local app; Sync $4/month annual or $5/month monthly; one-time Catalyst $25 | A proven *offering structure*, not evidence Lapsha can achieve Obsidian's scale: free local utility, paid operated service, voluntary patronage. [P7] |

## Monetization that preserves trust

1. **One-time local Pro unlock, with a narrow promise.** Test approximately $29–49 for durable advanced capture/organization. Define what is purchased; avoid cheap “everything forever including cloud” promises. Optional supporter purchase can fund work, but philanthropy alone is hard to forecast. If recurring revenue becomes necessary, paid major upgrades or an update pass are more honest than pretending storage is the only ongoing expense.

2. **Annual product membership, independent of cloud.** A $19–39/year hypothesis can fund native OS maintenance, reliability, support, and substantial ongoing improvements. Subscribers are paying for a maintained tool, not just server bytes. It only works if users perceive continuing value; “we need predictable revenue” is not their benefit. Keep existing notes readable and exportable after cancellation.

3. **Optional operated sync/backup service.** Charge for cross-platform convenience, version recovery, and operational responsibility. Keep local use and basic export available. Be precise: backup is a restorable historical copy; sync propagates changes and can propagate mistaken deletion. Encrypted sync still needs account/key recovery, conflict resolution, attachment handling, deletion semantics, support, and restore tests. Infrastructure cost alone is a poor proxy for the business cost.

Apple private CloudKit can use the user's iCloud quota and hide private data from the developer portal; it is a possible lower-server-cost Apple route, not a complete turnkey iOS/Android sync plan. [P8] Lapsha's existing OS backup behavior is already documented in `notebook.md` (Android avatar exclusion; full restore testing deferred). Do not sell “backup” before trustworthy recovery exists.

4. **Update-pass ownership model, worth serious consideration.** Agenda permanently unlocks current premium features and features released during a paid period; cancellation does not remove those entitlements. It also offers lifetime. [P9] Lapsha could adopt the principle—buy the tool as it exists, optionally renew for future major capabilities—without copying its exact price. This best reconciles ownership with ongoing indie development, but adds entitlement/version complexity and demands meaningful releases.

Avoid selling privacy, basic data access, or escape/export as premium. Avoid hard caps that frame loved ones as inventory. A generous free trial or small usable free notebook can demonstrate value, but forcing people to decide which relatives to pay for is an avoidable positioning cost. These are recommendations, not platform rules.

## Transparent economics scenarios

All numbers below are illustrative USD, before tax, refunds, acquisition, tooling, fixed costs and founder salary. Model a 15% store take for eligible App Store Small Business sales; actual program/region/channel terms vary. [P10] Variable cost assumptions are placeholders, not vendor quotes. No market-size or conversion claim is implied.

| Model and assumptions | Contribution arithmetic | What scale means |
|---|---|---|
| $29/year; 15% fee; $2/year per payer support/operations allocation | $29 × .85 − $2 = **$22.65/payer/year** | 500 payers: $11,325/year; 2,000: $45,300; 5,000: $113,250. |
| $49 one-time local unlock; 15% fee | **$41.65 per new sale**, before future servicing | 2,000 sales produce $83,300 once. About 1,201 new sales every year are needed to produce $50k before servicing. |
| $12/year cloud add-on; 15% fee; assumed $3/year per payer operations | **$7.20/payer/year** | About 6,945 active paying users to contribute $50k/year before fixed costs. “Cheap backup” can be surprisingly hard to sustain. |
| $24/year cloud add-on; same fee and assumed costs | **$17.40/payer/year** | About 2,874 payers for $50k/year before fixed costs. |

Annual renewal example: at 2,000 paying users and assumed 25% yearly churn, 500 new paid users merely replace churn. At an assumed 5% qualified-install-to-paid conversion, that takes 10,000 new qualified installs/year just to remain level. Neither assumption has been measured. Growth cannot be treated as free, and seasonal gifting could make usage look unhealthy if judged only by daily activity.

Lifetime risk example: $49 is only 1.69 years of $29 subscription billings before differing costs or retention. One thousand $49 buyers create $41,650 after modeled store fees, plus a long tail of OS maintenance and support. If a hosted lifetime buyer costs even $3/year for ten years, $30 of that $41.65 is already spoken for before maintenance. One-time ownership is reasonable for local functionality; lifetime hosted service is a different liability.

Affiliate reality: Giftster says merchant commissions are generally 2–4%; Elfster uses affiliates and sponsored placements. [P11, P12] At a hypothetical 3% on a $50 purchase, Lapsha earns $1.50; $50k gross requires about 33,334 attributed purchases/year, before refunds or attribution loss. It can supplement a large gift-buying audience but is weak early primary revenue. It also creates an incentive to nudge purchases, which can undermine “remember what matters.” Never combine Spotify-derived profiling with commerce on the assumption OAuth made it permissible.

## Three adjacent models worth testing

### 1. The recipient-authored “little guide to me”

A person deliberately shares a tiny current preferences card: coffee order, favorite shops, sizes, “please no scented candles,” wishlist/music links, and experiences they want. Lapsha's private notebook stays private; recipients share only their own selected card. Start with an export/import file or normal shareable text so no account or public profile is needed. A hosted live link is a later, distinct service requiring access rules and deletion.

Surprise: the useful network effect can come from a *small artifact people exchange*, not a social feed or scraped profiles. It solves provenance/freshness and invites another person to discover the app. Business hypothesis: local Pro plus a couples/family entitlement or optional live-card service. Main risk: onboarding a second person turns a one-player tool into a coordination task. Test whether five friends voluntarily complete and send a card without coaxing; do not build the network first.

### 2. The household's gift memory

One partner usually remembers sizes, duplicate gifts, cousins' birthdays, and what was already bought. Give that knowledge continuity: a gift idea inbox and multi-year “what we gave/how it landed” history. Value is reducing repeated mental work. Limited selected lists could later be shared with another adult; private facts must never become visible just because a person is in a family circle.

Surprise: the paid buyer may be the household organizer buying relief, while everyone else only views a selected list. A family purchase or annual household plan could match the benefit. This is more focused than a general personal CRM and closer to an identifiable willingness-to-pay event. Test with actual birthday/holiday planning; compare whether users return to prior gift history. Shared buying statuses and surprise-gift secrecy make collaboration genuinely complex, so begin single-user. Affiliate income remains optional, not the engine.

### 3. The thoughtful host / “before we see them” notebook

Bundle existing facts into intentional moments: before friends visit, recall food constraints, favorite tea, a recent life event, and the thing you promised to bring. User selects the occasion and people. No need to ingest calendars or infer a relationship score. A user-controlled printable or shareable visit card is a practical output; do not pretend it is a clinical care record.

Surprise: Lapsha can become valuable at *retrieval*, even when capture is sparse. Marketing the moment (“host people without forgetting their details”) can be more concrete than selling database features. Business hypothesis: paid local toolkit, optional high-quality occasion/export templates included with Pro. Risk: broad event planning drifts into another crowded product. Test whether the existing notes actually save a planning mistake; keep the job narrow.

## Strongest, weakest, and real gates

**Strongest:** share-sheet capture into a person, with context; gift ideas/history grounded in something said; durable export/restore; search that finds the detail just before it matters. All compound existing data and single-user utility. The family organizer is a plausible focused customer, not validated yet.

**Promising but later:** selected recipient-authored preference cards; optional family collaboration; paid sync. Each adds a clear value exchange but also a second identity/permission/storage system.

**Weakest:** bulk contact/social enrichment, Spotify-based gift recommendations, friendship scoring/streaks, an affiliate shopping feed, a cheap lifetime cloud promise. These either conflict with the chosen relationship tone, rely on access Lapsha cannot obtain at launch, or fail basic economics.

**Release/business gates:** Can someone recover the whole notebook after losing a device? Does capture remain below ten seconds? Can users find a saved detail after a month? Do they use it at a real occasion without prompting? Will a measurable subset pay the proposed price? Is a second-device problem common enough to justify sync? Get this evidence before adding expensive platform dependencies. Download counts and competitor pricing alone do not answer any of it.

## Evidence ledger

All accessed 2026-09-19. “Live” means current official page, with no publication date exposed. Dates are noted where the source provides them. API claims use primary platform documentation; product pricing uses vendors or their own store descriptions.

| ID | Source, date | Supported fact / limitation |
|---|---|---|
| S1 | [Spotify top items](https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks), live | `/me`, calculated affinity, `user-top-read`; not someone else's favorites. |
| S2 | [Spotify saved tracks](https://developer.spotify.com/documentation/web-api/reference/get-users-saved-tracks), live | Current user's saved songs, `user-library-read`. |
| S3 | [Spotify followed artists](https://developer.spotify.com/documentation/web-api/reference/get-followed), live | Current user's artist follows, `user-follow-read`. |
| S4 | [Spotify PKCE](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow), live | Public-client authorization pattern; implementation feasibility is distinct from approval. |
| S5 | [Spotify quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), live; org eligibility effective May 15, 2025 | Five allowlisted users, owner Premium; extended access organization/launched service/250k MAU/review. |
| S6 | [Spotify access announcement](https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security), Feb 6, 2026 | Narrowed development mode framed as noncommercial; some details later changed. |
| S7 | [Spotify July changelog](https://developer.spotify.com/documentation/web-api/references/changes/july-2026), July 2026 | 25 client IDs; quotas pooled by developer account. |
| S8 | [Spotify share music](https://support.spotify.com/de-en/artists/article/sharing-your-music/), live | Official copy-link/share path for songs, albums, artists. |
| S9 | [Spotify February changelog](https://developer.spotify.com/documentation/web-api/references/changes/february-2026), Feb 2026, amended | Development endpoint restrictions, removed other-user profile/playlist enumeration, own library retained. |
| S10 | [Spotify Developer Policy](https://developer.spotify.com/policy), effective May 15, 2025 | Policy constraints and non-streaming commercial exception; application-specific judgment is an inference, not approval. |
| S11 | [Apple MusicKit](https://developer.apple.com/musickit/), live | Available platforms and capabilities; personal permission required. |
| S12 | [MusicKit user authentication](https://developer.apple.com/documentation/applemusicapi/user-authentication-for-musickit), live | Personal Music User Token, automatic Apple/web handling; manual Android handling. |
| S13 | [Apple Developer Program License Agreement](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/), current page, search dated Aug 2026 | MusicKit Section D restrictions; not a general data-enrichment license. |
| S14 | [Share Apple Music links](https://support.apple.com/en-gb/guide/music-web/apdm0783785d/web), live | Normal links supported; receiving user opens Apple Music. |
| S15 | [Last.fm top artists](https://www.last.fm/api/show/user.getTopArtists), live | Username + API key, no authentication. |
| S16 | [Last.fm loved tracks](https://www.last.fm/api/show/user.getLovedTracks), live | Username + API key, no authentication. |
| S17 | [Last.fm API terms](https://www.last.fm/api/tos), live | Commercial agreement required; attribution; do not treat API availability as permission. |
| P1 | [Amicu Premium](https://amicu.app/premium/), live | $3.99/month, $29.99/year; country variation. |
| P2 | [Fabriq, developer App Store description](https://apps.apple.com/us/app/fabriq-stay-in-touch/id1460143202?platform=watch), live | US $4.99/month, $39.99/year. |
| P3 | [Monica pricing](https://monicahq.com/en/pricing/), live | Hosted $9/month or $90/year; free self-host; exports/privacy included. |
| P4 | [Dex pricing](https://getdex.com/pricing/), live | Displayed prices/features/cadence selector. |
| P5 | [Dex official annual-price clarification](https://getdex.com/blog/dex-vs-affinity-crm-real-estate-investors/), Sept 2026 | Premium $144/year, Pro $240/year. Its trial-card copy conflicts with pricing page; pricing page takes precedence. |
| P6 | [Mesh pricing](https://me.sh/pricing), live; `clay.earth/pricing` redirects | Current free tier and displayed $10 Pro; cadence/promotion ambiguity retained. |
| P7 | [Obsidian pricing](https://obsidian.md/pricing), live | Free local software, paid sync, Catalyst supporter purchase. |
| P8 | [CloudKit private database](https://developer.apple.com/documentation/cloudkit/ckcontainer/privateclouddatabase), live | User iCloud storage quota, private data hidden from developer portal. |
| P9 | [Agenda premium](https://agenda.com/manual/en/premium-features/), live | Retains features unlocked during subscription; also lifetime option. |
| P10 | [Apple Small Business Program](https://developer.apple.com/app-store/small-business-program/), live | Eligible enrolled developers' 15% commission assumption; not universal. |
| P11 | [Why Giftster is free](https://www.giftster.com/free/), live | Merchant affiliate commissions generally 2–4%; price unaffected per vendor. |
| P12 | [How Elfster works](https://www.elfster.com/how-elfster-works/), live | Free core product funded by affiliates and sponsored placements. |

## Debate addendum: gifts first and a $19–29 one-time price

The team's narrower proposal is reasonable as a first **feature experiment**: private gift ideas attached to people and occasion lead-times, with no OAuth. My objection is to treating it as proven positioning or a complete business plan. A useful primitive can still be undifferentiated; new exact competitors and seasonal usage make it especially important to observe reuse rather than infer demand from a price tag.

At an assumed 15% store fee, a $19 sale contributes $16.15 before everything else; $29 contributes $24.65. To produce $50,000 each year before costs requires 3,096 or 2,029 new buyers respectively, each year. This can be an entirely worthwhile small indie business with trusted distribution and modest support. It does not support an unqualified full-time-income claim or expensive acquisition. Future sync should not be a rescue plan for a cheaply priced perpetual obligation.

My counterproposal: keep Lapsha's general private-notebook identity while testing focused acquisition/onboarding around gifts versus hosting/visiting. The smallest common record is **person + detail/item + personal reason; URL optional**. An overheard wish is as useful as a shopping URL. Hosting may need group aggregation; forcing an identical URL prototype would bias that experiment. Predefine which trigger each participant actually faces, then separately measure unprompted next capture and retrieval during an eligible real occasion. Do not merge unlike cohorts after the fact to manufacture retention.

Test $29 for existing local Pro functionality, with a clearly described ownership contract and future major upgrades/update-pass reserved if desired. Avoid a promise that all future capabilities and operated services are included indefinitely. Free export and verified recovery should precede asking anyone to trust years of relationship notes. A price test must involve a real purchase decision; positive comments and competitor list prices are insufficient.

The market partner has found closer local competitors than the integration-heavy CRM comparisons above (Little Things, Hippo, betterpal, Skarbi). Use its independently researched exact-competitor ledger when choosing the first test range; do not price-anchor primarily on Dex.
