# Post-Launch Growth Strategy — NoSchoolState Component (Draft)

Date: 2026-04-12
Author: Claude Code (draft for review)

★ Insight ─────────────────────────────────────
- No-school dropoff is a high-leverage place to increase activation: a concise benefit-first pitch + 1 clear CTA dramatically improves conversion.
- Trackable, small events (view → click → create → invite → first post) map cleanly to the onboarding funnel and make it easy to run short experiments.
- Push notifications should feel school-centric and social (what your classmates are doing) rather than product-first ("Post now").
───────────────────────────────────────────────

## Overview

This document outlines the analytics, notification templates, and conversion copy for the new NoSchoolState UI. The goal: reduce drop-off when a user cannot find their school, increase user-initiated school creation, and drive first-post/first-engagement within 24 hours.

---

## 1) Analytics Mapping

Naming conventions: snake_case event names. Use consistent property keys: user_id, school_id (nullable), source ("onboarding", "feed", "settings"), variant (A/B label), screen (component/page name).

Primary events (minimal required):

- no_school_viewed
  - When: NoSchoolState component renders and is visible to the user
  - Properties: { user_id, screen, source, compact (bool), timestamp }
  - Purpose: baseline exposure metric

- no_school_cta_clicked
  - When: any CTA inside the component is tapped (primary/secondary/tertiary)
  - Properties: { user_id, screen, source, cta: "find" | "create" | "invite", variant }
  - Purpose: measure intent & CTA effectiveness

- search_school_started
  - When: user opens the school search flow from NoSchoolState
  - Properties: { user_id, school_id: null, screen, source, variant }
  - Purpose: track discovery intent

- create_school_started
  - When: user opens the create/claim school flow from NoSchoolState
  - Properties: { user_id, screen, source, variant }
  - Purpose: funnel into creation flow

- create_school_completed
  - When: school doc created AND user is added as founder/admin in the school members subcollection
  - Properties: { user_id, school_id, screen, source, variant }
  - Purpose: successful creation metric

- invite_sent
  - When: user triggers an invite (share sheet or link generation)
  - Properties: { user_id, school_id (if created), invite_method: "share_sheet"|"link", recipients_estimated }
  - Purpose: viral activation vector

- no_school_invite_clicked
  - When: user taps Invite classmates link in NoSchoolState
  - Properties: { user_id, screen, source }

- first_post_created_within_24h
  - When: user creates their first post within 24 hours of selecting/creating a school
  - Properties: { user_id, school_id, time_since_school_join (s), source }
  - Purpose: measure early engagement

- no_school_cta_variant_exposed
  - When: variant (A/B) is shown for CTA copy or layout
  - Properties: { user_id, variant, screen, experiment_id }
  - Purpose: A/B test attribution

Recommended downstream destinations: Amplitude / Firebase Analytics + export to BigQuery for cohort and retention analysis.

Event priority: Mark the top 5 as critical to implement in the launch sprint: no_school_viewed, no_school_cta_clicked, create_school_started, create_school_completed, first_post_created_within_24h.

Implementation notes:
- Fire events client-side at the page-level where callbacks are wired (keep component pure).
- Add server-side verification for create_school_completed if possible (to avoid client spoofing).
- Attach experiment/variant metadata via assignment service or existing feature-flag tool.

---

## 2) Notification Strategy (Push templates)

Context: Target users who have selected a school but haven't posted in their first 24 hours. Each template includes personalization tokens and a deep link. Keep tone friendly, school-centric, and low-friction.

Timing: 24 hours after school join/selection if user has not made their first post. Consider retarget at 72 hours with a different angle.

Template A — Social Curiosity (Recommended)
Title: See what's happening at {school_name}!
Body: {display_name}, your classmates already posted about events and clubs — tap to jump into the school feed and say hi.
Deep link: sera://school/{school_id}/feed
Reasoning: Leans on FOMO and social proof.

Template B — Starter Prompt
Title: Start the conversation at {school_name}
Body: Hey {display_name}, share your first post — a quick "What club are you in?" gets replies fast.
Deep link: sera://compose?prefill=What%20club%20are%20you%20in%3F
Reasoning: Reduces friction by suggesting a starter prompt.

Template C — Help & Community
Title: Can we help you set up {school_name}?
Body: Need ideas for your first post or to invite classmates? Tap for quick tips and an invite link you can send.
Deep link: sera://school/{school_id}/help
Reasoning: Supportive tone for less social users; nudges toward invites if they don't post.

Personalization tokens to support: {display_name}, {school_name}, {school_id}, {top_club_name} (if available), {mutual_friends_count} (optional).

Delivery constraints:
- Respect notification preferences (do not send if user disabled notifications during onboarding).
- Rate-limit: max 1 growth push per user per 72 hours; backoff if ignored.
- Logging: track push_sent, push_opened, and deep_link_handled to measure conversion.

---

## 3) Conversion Copy — "Create a school" flow

Goal: one empowering headline that overcomes friction and ownership anxiety.

Recommended primary hook (1 sentence):
"Can't find your school? Create it yourself — bring your classmates together in minutes."

Alternative phrasings (A/B test candidates):
- "Start your school's space — create it and invite classmates in minutes." (more action-oriented)
- "Create your school and be the first to welcome classmates." (appeals to leadership)
- "No school found? Build your school's community — quick, private, student-led." (privacy emphasis)

Microcopy for the create flow (suggested):
- Button: "Create a school"
- Confirmation header: "School created — you're the founder"
- Confirmation body: "You can invite classmates or add a quick post to welcome everyone." (Buttons: "Invite classmates" / "Write welcome post")

UX guidance:
- Default to a minimal create form: school name + city (auto-suggest) + optional privacy note. Avoid extra fields.
- After creation, show a short 2-step wizard: (1) invite classmates (share link), (2) post a welcome message using a starter prompt.
- Add a soft badge on the confirmation screen: "You created this school — you can edit it in settings." (reassures ownership without requiring admin roles)

---

## Measurements & Targets (suggested)
- Exposure -> CTA click (no_school_viewed → no_school_cta_clicked): target 25% click-through in first week
- CTA click → create started (find/create split): target 10% of viewers start creation flow
- Create started → create completed: target 70% completion (keep form tiny)
- First post within 24h: target 30% of newly created/joined users

These targets are intentionally aggressive but provide clear optimization levers.

---

## Experiment ideas (first 2 weeks)
1) CTA copy A/B: "Find your school" vs "Search for my school" vs "Create a school" (prioritize recommended primary CTA)
2) Primary CTA prominence: single-primary vs side-by-side primary+secondary (test conversion to create flow)
3) Invite CTA placement: inline link vs modal post-create flow

---

## Next steps / Implementation checklist
- [ ] Instrument critical events: no_school_viewed, no_school_cta_clicked, create_school_started, create_school_completed, first_post_created_within_24h (Analytics engineer)
- [ ] Add push templates to notification service and schedule 24-hour retarget (Growth/Product)
- [ ] Wire NoSchoolState callbacks to navigate & fire events (Lead Architect)
- [ ] Create small experiment in feature-flag system for CTA copy variants (Product/Analytics)
- [ ] Design review for NoSchoolState visual & microcopy (Designer)

---

## Appendix: Quick event JSON examples

no_school_cta_clicked example:
{
  "event": "no_school_cta_clicked",
  "user_id": "u_123",
  "timestamp": "2026-04-12T12:00:00Z",
  "screen": "feed_no_school",
  "cta": "create",
  "variant": "cta_v1"
}

create_school_completed example:
{
  "event": "create_school_completed",
  "user_id": "u_123",
  "school_id": "s_456",
  "timestamp": "2026-04-12T12:14:00Z",
  "screen": "create_school_form",
  "source": "no_school_state"
}

---

## First Post nudge

One-sentence hook to encourage a user who just joined to be the first to post:

"Be the first to say hi — post a quick welcome or ask 'Which clubs should I join?' and start the conversation at your school."

---

Please review this draft and let me know which CTAs and notification template you prefer (A/B/C), and whether to file the instrumentation tickets directly in the sprint board. I can then convert this draft into a launch checklist and commit a final copy to docs/ with timestamps and assigned owners.
