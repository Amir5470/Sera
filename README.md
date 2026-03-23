# Sera 🌅

> **Your school, all in one place.**

Sera is a student-led mobile app that connects an entire school in one place — your classes, your events, your people. Built with React Native + Firebase, designed for students by a student.

---

## The Problem

School communication is broken and fragmented:

- **Discord** — every class needs its own server, nothing connects
- **Saturn** — schedules only, no communication layer
- **Google Classroom** — teacher-controlled, formal, not social
- **Group chats** — chaotic, no structure

Sera replaces all of it.

---

## Core Features

| Feature | Description |
|---|---|
| 📅 **Schedule** | Manually input your classes. See your full day or week at a glance. |
| 💬 **Class Rooms** | Auto-generated chat room per class. Share notes, pin homework and test dates. |
| 📣 **School Feed** | The town square for your whole school — sports, events, spirit week, announcements. |
| 🎯 **Clubs & Groups** | Create or join any club or team. Chat, share files, and manage events. |

---

## What Sera Is Not

- ❌ No DMs — school-wide communication only
- ❌ No anonymous posting
- ❌ No teacher or admin accounts — fully student-led
- ❌ No school database integration — no legal/data issues
- ❌ Not a gradebook
- ❌ No ads, no data selling

---

## Tech Stack

- **React Native** + **Expo** — cross-platform mobile
- **Firebase Auth** — sign in / authentication
- **Firestore** — real-time database
- **Firebase Storage** — file and note sharing

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- Expo CLI: `npm install -g expo-cli`
- Firebase project with Auth, Firestore, and Storage enabled

### Installation

```bash
git clone https://github.com/amir5470/sera.git
cd sera
npm install
```

### Environment Setup

Create a `.env` file in the project root and add your Firebase config:

```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### Running the App

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `i` for iOS Simulator / `a` for Android Emulator.

---

## Privacy & Legal

Sera is designed to stay compliant with student data policies, which governs technology providers that contract with school districts.

- Sera **never formally contracts** with a school district
- All data is **student-inputted** — nothing is pulled from school systems
- Clear Privacy Policy and Terms of Service — **data is never sold or shared**
- Willing to sign additional agreements if a school requests it

---

## Brand

**Name:** Sera ('SAIR'-uh) — Italian/Spanish for "evening," the time people sit down and actually connect.

**Color Palette:**

| Token | Value | Use |
|---|---|---|
| Background | `#0D0A1A` | Deep night |
| Primary Accent | `#F97316` | Sunset orange — sun, logo, CTAs |
| Secondary Accent | `#FFD166` | Golden yellow — highlights |
| Primary Text | `#FFFFFF` | White |
| Muted Text | `rgba(255,255,255,0.45)` | Subtext |

---s

## Roadmap

- [x] Project brief and pitch deck
- [X] Firebase project setup
- [X] Auth flow (sign up / sign in)
- [ ] Schedule input + display
- [ ] Class Rooms (auto-generated per class)
- [ ] School Feed
- [ ] Clubs & Groups
- [ ] Beta launch at Worthington school

---

## Developer

**Amir Mechkour** — 14 y/o high school freshman, Columbus, Ohio

- Portfolio: [amir5470.github.io/Portfolio](https://amir5470.github.io/Portfolio)

---

*Sera is a student-led project. Built for students. Run by students.*
