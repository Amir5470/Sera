# CLAUDE.md — Sera

This file gives Claude context about the Sera project so it can assist effectively.

---

## What Is Sera?

Sera is a student-led mobile app that connects an entire school in one place — classes, events, and people. It replaces fragmented tools like Discord, Saturn, and Google Classroom with one unified app.

**Tagline:** "Your school, all in one place."  
**Developer:** Amir Mechkour, 14, Columbus, Ohio

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (JavaScript) |
| Build tool | Expo |
| Auth | Firebase Auth |
| Database | Firestore (real-time) |
| File storage | Firebase Storage |
| Target platform | Mobile (iOS + Android) |

The developer is comfortable with HTML, CSS, JavaScript, Firebase, and Google APIs. This is their first React Native project.

---

## Core Features (MVP)

1. **Schedule** — Students manually input classes (name, teacher, period). No school database integration.
2. **Class Rooms** — Auto-generated chat room per class. Class-wide messaging only (no DMs). File/note sharing, pinnable homework and test dates.
3. **School Feed** — Public feed for the entire school. Sports, events, spirit week, announcements. Anyone can post.
4. **Clubs & Groups** — Students can create or join groups. Same structure as class rooms. Open or invite-only.

---

## Hard Constraints (Never Violate These)

- **No DMs** — Sera is school-wide communication only, never person-to-person
- **No anonymous posting** — every post is tied to a real account
- **No teacher or admin accounts** — fully student-led
- **No school database integration** — all data is student-inputted; this keeps Sera out of Ohio SB 29 scope
- **No gradebook features** — that's Google Classroom's job
- **No ads, no data selling**

---

## Privacy & Legal Context

Ohio SB 29 (effective October 2024) requires technology providers that formally contract with school districts to protect student data. Sera is structured to stay outside this definition:

- Never formally contracts with a school district
- All data is student-inputted, never pulled from school systems
- Clear Privacy Policy and Terms of Service
- Willing to sign comfort agreements if a school requests

When writing any code that touches user data, keep this in mind. Don't collect anything that isn't explicitly needed.

---

## Brand & Design

**App name:** Sera (pronounced SAIR-uh)  
**Meaning:** Italian/Spanish for "evening" — when people sit down and connect

### Color Palette (UI)

```
Background:      #0D0A1A   (deep night)
Primary accent:  #F97316   (sunset orange — CTAs, logo, sun)
Secondary:       #FFD166   (golden yellow — highlights)
Text:            #FFFFFF
Muted text:      rgba(255, 255, 255, 0.45)
```

Only use two accent colors at a time in the UI. The full sunset palette (`#1A0A2E`, `#3D1C6B`, `#7B2D8B`, etc.) is reserved for the splash screen animation only.

### Typography

- Clean, minimal, premium feel
- Body: Regular (400)
- Headings: Medium (500)
- App name: 6px letter spacing when displayed large
- No all-caps in UI except for labels

### Design Principle

Keep the app dark, clean, and minimal. Don't scatter the sunset colors across the interface — that's for the splash screen.

---

## Onboarding Goal

Under 60 seconds from install to inside the app. Keep the sign-up and schedule input flows as short as possible.

---

## Distribution Strategy

- Starting with one school (Worthington, Ohio area)
- Getting 10–20 real users from existing friend group first
- Formal pitch to school administration with a deck
- Word of mouth if the product is good — schools come to Sera, not the other way around

---

## What Claude Should Know When Helping

- This is an early-stage student project — keep code clear and well-commented
- Prefer simple, readable solutions over clever ones
- React Native + Expo is the stack; don't suggest web-only alternatives
- Firebase is already chosen — don't suggest alternatives like Supabase or PocketBase
- The developer knows JavaScript well but is newer to React Native specifically
- Firestore security rules matter a lot here given the student data context — flag any security concerns
- Mobile-first means touch targets, performance on older phones, and offline-tolerant UI all matter
- When in doubt, keep it simple — this is an MVP

---

## File Structure (Expected)

```
sera/
├── app/                  # Expo Router screens
│   ├── (auth)/           # Sign in / sign up
│   ├── (tabs)/           # Main tab navigation
│   │   ├── feed.tsx      # School Feed
│   │   ├── schedule.tsx  # Schedule view
│   │   ├── classes.tsx   # Class Rooms
│   │   └── groups.tsx    # Clubs & Groups
├── components/           # Reusable UI components
├── firebase/             # Firebase config and helpers
├── hooks/                # Custom React hooks
├── constants/            # Colors, fonts, layout values
│   └── Colors.ts         # Brand color tokens
└── CLAUDE.md             # This file
```

---

*Last updated: project kickoff*