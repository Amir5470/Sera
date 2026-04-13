# Post-Launch Growth Strategy — NoSchoolState (Final Draft)

Date: 2026-04-12
Author: Growth Lead (assistant)

★ Insight ─────────────────────────────────────
- The NoSchoolState is a high-leverage activation point: users who can’t find their school often drop out. A benefit-first headline + one clear primary CTA reduces friction and increases activation.
- Keep the UI pure (components/ui/NoSchoolState.tsx:1-160) and fire analytics where callbacks are wired (app/(app)/feed/index.tsx:792-796). This preserves testability and attribution.
- Small contextual nudges (starter prompts, 24h first-post push) convert doubters into posters and create early social proof.
───────────────────────────────────────────────

## Objective
Make the NoSchool experience convert: increase "find or create school" completion, raise first-post within 24h, and seed invitations for viral growth.

Success metrics (primary):
- create_school_completed rate
- first_post_created_within_24h
- invite_sent

---

## NoSchoolState-specific copy & UX
File: components/ui/NoSchoolState.tsx

Headline (benefit-first):
- "🏫 Your school, all in one place."  // components/ui/NoSchoolState.tsx:33
Subheading:
- "See schedules, join classes, and follow the school feed — student-led and ad-free." // components/ui/NoSchoolState.tsx:38
Primary CTA (recommended):
- "Find your school" (calls onSearch) // wire at app/(app)/feed/index.tsx:792
Secondary CTA:
- "Create a school" (calls onCreate) // wire at app/(app)/feed/index.tsx:794
Tertiary (optional link):
- "Invite classmates" — shown only when onInvite prop provided

Compact variant: reduce bullets, show only primary CTA (compact=true).

Microcopy & confirmation flows:
- Create success header: "School created — you're the founder"
- Post-creation microflows: "Invite classmates" (share link) + "Write welcome post" (starter prompt)

---

## Analytics mapping (implement first)
Instrument at the page-level where callbacks are wired (feed/index.tsx:792-796). Prioritize top 6 events.

1) no_school_viewed
- When: NoSchoolState renders visible
- Props: { user_id, screen: "feed_no_school", source, compact (bool), variant }

2) no_school_cta_clicked
- When: User clicks a CTA in NoSchoolState
- Props: { user_id, screen, cta: "find"|"create"|"invite", source, variant }

3) search_school_started
- When: Search UI opens (from onSearch)
- Props: { user_id, screen, source }

4) create_school_started
- When: Create flow opened
- Props: { user_id, screen, source, variant }

5) create_school_completed
- When: Server confirms school doc exists and user is member
- Props: { user_id, school_id, screen, source }
- Note: verify server-side to prevent client spoofing

6) first_post_created_within_24h
- When: User posts first post within 24 hours of school join/creation
- Props: { user_id, school_id, time_since_join_s, used_starter_prompt }

Secondary (supporting) events:
- starter_prompt_used, invite_sent, push_sent/opened, deep_link_handled

Event destinations: Amplitude / Firebase + BigQuery export for cohort queries.

---

## High-conversion push templates (24h first-post retarget)
Personalize with tokens: {display_name}, {school_name}, {school_id}

Template A — Social Curiosity (Recommended)
- Title: See what's happening at {school_name}!
- Body: {display_name}, your classmates already posted about events and clubs — jump to the feed and say hi.
- Deep link: sera://school/{school_id}/feed

Template B — Starter Prompt
- Title: Start the conversation at {school_name}
- Body: Hey {display_name}, share your first post — try: "What club are you in?"
- Deep link: sera://compose?prefill=What%20club%20are%20you%20in%3F

Template C — Help & Community
- Title: Can we help you set up {school_name}?
- Body: Need ideas or an invite link? Tap for quick tips and invites.
- Deep link: sera://school/{school_id}/help

Delivery rules:
- Do not send if notifications disabled.
- Rate-limit: max 1 growth push per 72 hours.
- Log push_sent, push_opened, deep_link_handled.

---

## Starter prompts (UI modal after first feed open)
Show 3 quick prompts with one-tap to prefill compose: 
- "Which clubs should I check out?"
- "Anyone going to Friday's game?"
- "Looking for study partners for bio"

Instrument: starter_prompt_used { prompt_id }

---

## Conversion copy for Create flow (one-sentence hooks — A/B candidates)
Recommended primary hook:
- "Can't find your school? Create it yourself — bring your classmates together in minutes." (use this on the create button and create form header)

Alternates:
- "Start your school's space — create it and invite classmates in minutes." (action-first)
- "Create your school and be the first to welcome classmates." (leadership framing)

---

## Experiments & targets (first 2 weeks)
- CTA copy A/B test: "Find your school" (A) vs "Search for my school" (B) — metric: no_school_cta_clicked → search_school_started
- CTA layout: primary-only vs primary+secondary — metric: overall CTA CTR & create conversion
- Starter prompt vs no prompt — metric: starter_prompt_used → first_post_created_within_24h

Targets (week 1):
- no_school_viewed -> no_school_cta_clicked: 25% CTR
- create_school_started -> create_school_completed: 70% completion
- first_post_created_within_24h: 30% of new joiners

---

## Implementation notes & ownership
- Keep NoSchoolState pure (UI only). Fire analytics in callbacks where navigation is wired (app/(app)/feed/index.tsx:792-796).
- Protect create_school_completed with server-side verification (backend/lib or callable function).
- Add variant metadata (variant, experiment_id) to events for attribution.
- Assign owners: Analytics engineer (events), Growth (copy & pushes), Frontend (wiring), Backend (create verification).

---

## First Post nudge (short)
"Be the first to say hi — post a quick welcome or ask 'Which clubs should I join?' and start the conversation at your school."

---

Files updated/created in this sprint:
- components/ui/NoSchoolState.tsx
- app/(app)/feed/index.tsx (wiring)
- docs/GROWTH_STRATEGY.md (this file)
- STORE_LISTING.txt

Please review the copy variations and the CTA test plan. When you approve, I will: (1) draft exact TypeScript event interfaces for analytics, and (2) produce APNs/FCM push payloads for Template A. 

