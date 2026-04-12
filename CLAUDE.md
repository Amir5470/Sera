# CLAUDE.md — Sera Project Context

> Drop this file in the root of the Sera project. It gives Claude full context on the codebase and project state.

---

## What Is Sera?

Sera is a student-led mobile app that connects an entire school in one place — classes, events, and people. It replaces fragmented tools like Discord, Saturn, and Google Classroom with one unified platform.

**Tagline:** "Your school, all in one place."  
**Developer:** Amir Mechkour, 14, Columbus, Ohio  
**Bundle ID:** `com.serahq.app`  
**Firebase Project:** `sera-hq`  
**Expo Account:** `hzma`  
**GitHub:** `github.com/Amir5470/Sera`

---

## Tech Stack

| Layer           | Technology / Version                  |
| --------------- | ------------------------------------- |
| Framework       | React Native 0.81.5                   |
| Build tool      | Expo SDK ~54.0.33                     |
| Routing         | Expo Router ~6.0.23                   |
| Language        | TypeScript ~5.9.2                     |
| Auth            | Firebase Auth ^11.x                   |
| Database        | Firestore (real-time)                 |
| File storage    | Firebase Storage (pending Blaze plan) |
| AI              | Anthropic Claude API (vision)         |
| Animation       | react-native-reanimated ~4.1.1        |
| Navigation      | @react-navigation/drawer ^7.x         |
| Target platform | Mobile (iOS + Android)                |

---

## Core Features (Current State)

### ✅ **Fully Built**

1. **Authentication** — Email/password sign-up/in with Firebase Auth. Google Sign-In deferred until EAS build.
2. **Onboarding** — 5-step flow: display name + username → profile photo placeholder → school autocomplete + grade → sports + interests → notifications + source. Supports edit mode from settings.
3. **Schedule** — AI vision scanner using Claude Haiku (`claude-haiku-4-5-20251001`). Two-photo flow: schedule → bell times. Review modal with editable emoji and times. Chronological sort with 12-hour time handling.
4. **Bell Schedules** — Crowdsourced daily voting system. Most-voted schedule type overrides period times. Resets at midnight.
5. **Class Rooms** — Auto-generated from schedule input. Real-time chat with auto-delete when last member leaves. Class identity = `nameLower + teacherLower + periodLower`.
6. **Clubs & Groups** — AI classifies class vs club during scan. Real-time chat with same structure as classes.
7. **School Feed** — Public posts with threaded replies. Author-only delete. Realtime updates via Firestore `onSnapshot`.
8. **Settings** — Edit profile, edit school, notifications, manage classes, sign out. Hidden from drawer via `drawerItemStyle: { display: 'none' }`.
9. **Drawer Navigation** — Feed, Schedule, Classes, Clubs. Settings pinned at bottom. Dynamic title shows school name on Feed.
10. **Splash Screen** — Logo shrink animation using Reanimated.
11. **Landing Page** — Slide-to-unlock mechanic for returning users. Dot grid background. "Next class" badge.

### ⬜ **Deferred / Not Yet Built**

- **Google Sign-In** — Blocked by OAuth redirect URI restrictions in Expo Go. Needs EAS build.
- **Profile Photos** — Firebase Storage requires Blaze plan upgrade.
- **Push Notifications** — Not yet implemented.
- **Tighter Firestore Security Rules** — Currently open to all authenticated users.

---

## Hard Constraints (Never Violate)

- **No DMs** — School-wide communication only, never person-to-person.
- **No anonymous posting** — Every post tied to a real account.
- **No teacher or admin accounts** — Fully student-led.
- **No school database integration** — All data is student-inputted.
- **No gradebook features** — That's Google Classroom's job.
- **No ads, no data selling.**

---

## Privacy & Legal Context (Ohio SB 29)

Ohio SB 29 (effective October 2024) requires technology providers that formally contract with school districts to protect student data. Sera is structured to stay outside this definition:

- Never formally contracts with a school district
- All data is student-inputted, never pulled from school systems
- Clear Privacy Policy and Terms of Service
- Willing to sign comfort agreements if a school requests

**When writing code that touches user data:** Keep this in mind. Don't collect anything that isn't explicitly needed. Flag any security concerns in Firestore rules or data handling.

---

## Brand & Design

**App name:** Sera (pronounced SAIR-uh)  
**Meaning:** Italian/Spanish for "evening" — when people sit down and connect.

### Color Palette (constants/colors.ts)

```typescript
background: "#0D0A1A"; // deep night
background2: "#000000"; // used on auth screens
primary: "#F97316"; // sunset orange — CTAs, icons, logo
secondary: "#FFD166"; // golden yellow — highlights
text: "#FFFFFF";
muted: "rgba(255,255,255,0.45)";
card: "#1A1530";
border: "rgba(255,255,255,0.1)";
```

**Full sunset palette** (used in splash screen animation only):
`#0D0A1A`, `#1A0A2E`, `#3D1C6B`, `#7B2D8B`, `#C0392B`, `#FF6B35`, `#F97316`, `#FFD166`

**Design principle:** Only use two accent colors at a time in the UI. Keep the app dark, clean, and minimal. The full sunset palette is reserved for the splash screen.

### Typography

- Clean, minimal, premium feel
- Body: Regular (400)
- Headings: Medium (500)
- App name: 6px letter spacing when displayed large
- No all-caps in UI except for labels

---

## Firestore Database Structure

```
schools/
  {schoolId}/
    name, nameLower, city, createdAt

    classes/
      {classId}/                       ← class identity: nameLower + teacherLower + periodLower
        name, nameLower, teacher, teacherLower, period, periodLower, createdAt
        emoji, startTime, endTime       ← stored on class doc, not member doc
        members/
          {userId}/
            joinedAt
        messages/
          {messageId}/
            text, authorName, authorId, createdAt

    clubs/
      {clubId}/                        ← same structure as classes
        name, nameLower, teacher, createdAt
        members/
          {userId}/
            joinedAt
        messages/
          {messageId}/
            text, authorName, authorId, createdAt

    posts/
      {postId}/
        text, authorName, authorId, type, createdAt
        reactions/
          {reactionId}/
            text, authorName, authorId, parentId, type, createdAt

    users/
      {userId}/
        uid, onboardingComplete, displayName, etc

    bellSchedules/
      {dateKey}/                       ← YYYY-MM-DD format
        scheduleType (e.g., "Regular", "Early Release")
        votes {userId: scheduleType}
        periods/
          {period}/
            startTime, endTime

userIndex/
  {userId}/
    uid, schoolId, displayName, username, grade, school, city,
    sports, interests, notifications, heardFrom, onboardingComplete
```

---

## File Structure

```
Sera/
├── app/
│   ├── _layout.tsx              ← Root layout (auth gate + onboarding check)
│   ├── index.tsx                ← Splash screen / initial app entry
│   ├── landing.tsx              ← Landing page (slide to unlock)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── step1.tsx            ← Display name + username
│   │   ├── step2.tsx            ← Profile photo (placeholder)
│   │   ├── step3.tsx            ← School autocomplete + grade
│   │   ├── step4.tsx            ← Sports + interests
│   │   └── step5.tsx            ← Notifications + source
│   └── (app)/
│       ├── _layout.tsx          ← Drawer navigation layout
│       ├── feed/
│       │   ├── _layout.tsx
│       │   ├── index.tsx        ← School feed
│       │   └── [postId].tsx     ← Post detail with replies
│       ├── schedule.tsx         ← AI schedule scan + manage
│       ├── classes/
│       │   ├── _layout.tsx
│       │   ├── index.tsx        ← List of user's class rooms
│       │   └── [classId].tsx    ← Real-time class chat
│       ├── clubs/
│       │   ├── _layout.tsx
│       │   ├── index.tsx        ← List of user's clubs
│       │   └── [clubId].tsx     ← Real-time club chat
│       └── settings/
│           ├── _layout.tsx
│           ├── index.tsx        ← Settings menu
│           ├── edit-profile.tsx
│           ├── edit-school.tsx
│           └── notifications.tsx
├── assets/
│   └── images/
│       ├── Sera logo B.png              ← Black logo (auth screens)
│       ├── Sera logo W.png              ← White logo
│       ├── Sera-Logo-Transparent-Wtext.png
│       └── Sera-Logo-Transparent-Btext.png
├── components/
│   ├── animated-helpers.tsx     ← PressableScale component
│   └── ui/                      ← Reusable UI components
├── constants/
│   ├── colors.ts                ← Brand color tokens
│   ├── fonts.ts
│   └── styles.ts                ← Shared styles
├── hooks/
│   ├── useAuth.ts               ← Firebase auth state + AsyncStorage UID cache
│   ├── useProfile.ts            ← Listens to userIndex/{uid}
│   ├── useFeed.ts               ← Realtime feed posts
│   ├── useSchedule.ts           ← (legacy) User classes
│   ├── useClassRooms.ts         ← User's joined classes
│   ├── useClubs.ts              ← User's joined clubs
│   ├── useClassChat.ts          ← Realtime messages for class/club
│   ├── useReplies.ts            ← Realtime replies for feed post
│   └── useBellSchedules.ts      ← Daily bell schedule with voting
├── lib/
│   ├── firebase.ts              ← Firebase app init
│   ├── auth.ts                  ← signUp, signIn, logOut
│   ├── profile.ts               ← saveProfile, completeOnboarding
│   ├── posts.ts                 ← createPost, deletePost, addReply
│   ├── classes.ts               ← joinOrCreateClass, leaveClass
│   ├── chat.ts                  ← sendMessage
│   ├── schools.ts               ← searchSchools, findOrCreateSchool
│   ├── bellSchedules.ts         ← submitBellSchedule, voteForSchedule
│   └── haptics.ts               ← successNotification helper
├── scripts/
│   └── reset-project.js
├── .env                         ← EXPO_PUBLIC_ANTHROPIC_KEY
├── app.json
├── package.json
├── tsconfig.json
├── eas.json
├── CLAUDE.md                    ← This file
└── README.md
```

---

## Key Technical Patterns & Learnings

### Firebase Auth Persistence

- **Issue:** `initializeAuth` with `getReactNativePersistence` crashes in Expo Go + New Architecture.
- **Solution:** Use `getAuth(app)` only. Manually cache UID in AsyncStorage (`sera_uid` key) via `useAuth.ts`.
- **On logout:** Clear AsyncStorage UID key in `auth.ts`.

### Display Names

- **Never use** `user.displayName` from Firebase Auth — it's empty for email/password users.
- **Always use** `profile?.displayName` from Firestore `userIndex`.
- **Fallback chain:** `profile?.displayName || user?.displayName || 'Student'`

### Navigation Flow

```
index.tsx (splash) → landing.tsx
  ↓ if not logged in → (auth)/sign-in or sign-up
  ↓ if logged in but onboarding incomplete → (onboarding)/step1
  ↓ if logged in + onboarding complete → (app)/feed
```

### Class Identity & Data Model

- **Class ID:** Compound key = `nameLower + teacherLower + periodLower`
- **Class fields:** `emoji`, `startTime`, `endTime`, `period`, `teacher` live on the **class doc**, not the member doc.
- **Auto-delete:** Classes/clubs auto-delete when last member leaves (checked via `getCountFromServer` in `leaveClass`).

### Schedule AI Scanner

- **Model:** `claude-haiku-4-5-20251001` (must use exact string — other IDs return 404)
- **API Key:** `EXPO_PUBLIC_ANTHROPIC_KEY` in `.env` (never commit to GitHub)
- **Required header:** `anthropic-version: 2023-06-01`
- **Flow:** Photo 1 (schedule) → extract classes → Photo 2 (bell times) → extract period times → `mergeTimes()` matches periods → review modal → save to Firestore
- **Time parsing:** 12-hour format without AM/PM — times under 7:00 assumed PM (add 12 hours)

### Bell Schedules

- **Daily voting system:** Each school has a `bellSchedules/{dateKey}` doc (YYYY-MM-DD format).
- **Most-voted schedule type** overrides period times for that day.
- **Resets at midnight** — new date key created automatically.

### Settings & Edit Mode

- **Edit mode:** Onboarding steps support `edit=true` query param to return to settings after saving.
- **Hidden from drawer:** Settings pages use `drawerItemStyle: { display: 'none' }` in `_layout.tsx`.

---

## Environment Variables

`.env` in project root:

```
EXPO_PUBLIC_ANTHROPIC_KEY=sk-ant-api03-...
```

**Never commit this to GitHub.**

---

## Known Issues / Blockers

- **Google Sign-In:** OAuth redirect URI restrictions in Expo Go. Needs EAS build to enable.
- **Firebase persistence:** `getReactNativePersistence` unavailable in New Architecture + Expo Go. Using AsyncStorage UID cache as workaround.
- **Profile photos:** Firebase Storage requires Blaze plan upgrade.
- **`newArchEnabled: false`** in `app.json` has no effect in Expo Go (always enabled).

---

## Current Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ Tighten before production launch.**

---

## What Claude Should Know When Helping

### General Approach

- This is an early-stage student project — keep code clear and well-commented.
- Prefer simple, readable solutions over clever ones.
- The developer knows JavaScript well but is newer to React Native specifically.
- Mobile-first means touch targets, performance on older phones, and offline-tolerant UI all matter.

### Stack Choices (Don't Suggest Alternatives)

- React Native + Expo is the stack — don't suggest web-only alternatives.
- Firebase is already chosen — don't suggest Supabase, PocketBase, etc.
- Expo Router is the routing system — don't suggest React Navigation v6 standalone.

### Security & Privacy

- Firestore security rules matter a lot given the student data context — flag any security concerns.
- Keep Ohio SB 29 compliance in mind when touching user data collection.
- Don't collect anything that isn't explicitly needed for core features.

### Design Constraints

- Stick to the two-color accent system (`#F97316` and `#FFD166`).
- Don't scatter the sunset palette across the UI.
- Keep the app dark, clean, and minimal.

### Onboarding Goal

- Under 60 seconds from install to inside the app.
- Keep sign-up and schedule input flows as short as possible.

---

## Distribution Strategy

- Starting with one school (Worthington, Ohio area)
- Getting 10–20 real users from existing friend group first
- Formal pitch to school administration with a deck
- Word of mouth if the product is good — schools come to Sera, not the other way around

---

## What's Next

### Launch Prep (Recommended Next Steps)

1. Set up EAS build to unlock Google Sign-In
2. Test with 10-20 friends from school (beta)
3. Gather feedback, fix bugs
4. Tighten Firestore security rules before wider rollout

### Future Features (Post-MVP)

- Push notifications for new posts/messages
- Profile photos (requires Blaze plan)
- Media uploads in feed
- More feed features (reactions beyond replies)

---

Last updated: April 2026 — Feature-complete MVP

### Launch Prep (Recommended Next Steps)

1. Set up EAS build to unlock Google Sign-In
2. Test with 10-20 friends from school (beta)
3. Gather feedback, fix bugs
4. Tighten Firestore security rules before wider rollout

### Future Features (Post-MVP)

- Push notifications for new posts/messages
- Profile photos (requires Blaze plan)
- Media uploads in feed
- More feed features (reactions beyond replies)

---

Last updated: April 2026 — Feature-complete MVP

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                        | Use when                                               |
| --------------------------- | ------------------------------------------------------ |
| `detect_changes`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context`        | Need source snippets for review — token-efficient      |
| `get_impact_radius`         | Understanding blast radius of a change                 |
| `get_affected_flows`        | Finding which execution paths are impacted             |
| `query_graph`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview` | Understanding high-level codebase structure            |
| `refactor_tool`             | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
