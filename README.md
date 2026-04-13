<div align="center">

<img width="1200" height="475" alt="ROG Stream Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

<br/>

# ⚡ ROG STREAM

**Free. Ad-free. No redirects. Just anime.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[**Live Demo**](https://rog-stream.vercel.app) · [**Report Bug**](https://github.com/beyondbday69/rog-stream/issues) · [**Request Feature**](https://github.com/beyondbday69/rog-stream/issues)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About

ROG Stream is a full-featured anime streaming web app built with React and TypeScript. It delivers a clean, ad-free experience with zero redirects — just press play. Supports both global anime (via AniWatch API) and regional anime (via AnimeSalt API), with Firebase-powered user accounts, watch history, progress tracking, and AI-assisted discovery via Google Gemini.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎬 **Stream Anime** | Global + regional library with sub/dub support |
| ⏭️ **Autoplay / Auto-next** | Timer-based episode progression with countdown overlay |
| 📋 **Episode Tracker** | Firestore-synced watch history and per-anime progress |
| 🔍 **Smart Search** | Live suggestions, genre filtering, schedule view |
| 🤖 **AI Discovery** | Google Gemini integration for recommendations |
| 👤 **Auth System** | Google OAuth, email/password, or guest demo mode |
| 🛡️ **No Ads / No Redirects** | Sandboxed iframes, proxy layer strips tracking |
| 📱 **PWA** | Installable, offline-ready via service worker |
| 🎨 **Hero Slides** | Custom Cloudinary-powered hero carousel |
| ⭐ **MAL Ratings** | Live scores + community reviews via Jikan v4 |
| 🗂️ **Watchlist** | Save anime as Watching / On Hold / Completed |
| 📺 **HLS Player** | hls.js + Plyr for native adaptive streaming |

---

## 🛠 Tech Stack

**Frontend**
- [React 19](https://react.dev) + [TypeScript 5](https://typescriptlang.org)
- [Vite 5](https://vitejs.dev) — lightning-fast dev server + bundler
- [Tailwind CSS](https://tailwindcss.com) — utility-first styling
- [Framer Motion](https://www.framer.com/motion/) — animations
- [React Router v7](https://reactrouter.com) — client-side routing
- [TanStack Query v5](https://tanstack.com/query) — async data + caching

**Backend / Services**
- [Firebase](https://firebase.google.com) — Auth, Firestore, Storage
- [Vercel Serverless](https://vercel.com/docs/functions) — `/api/proxy` CORS proxy
- [Cloudinary](https://cloudinary.com) — profile photo + hero slide hosting
- [Jikan v4](https://jikan.moe) — MAL scores, episode durations, reviews
- [Google Gemini](https://ai.google.dev) — AI-powered anime recommendations

**APIs**
- [AniWatch API](https://aniwatchapi-seven-teal.vercel.app) — global anime source
- [AnimeSalt API](https://animesalt-api-lovat.vercel.app) — regional anime source

**Streaming**
- [hls.js](https://github.com/video-dev/hls.js/) — HLS adaptive bitrate
- [Plyr](https://plyr.io/) — custom video player UI

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [npm](https://npmjs.com) v9+
- A Firebase project ([create one](https://console.firebase.google.com))
- A Google Gemini API key ([get one](https://aistudio.google.com/app/apikey))

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/beyondbday69/rog-stream.git
cd rog-stream

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys (see below)

# 4. Run the dev server
npm run dev
```

App runs at `http://localhost:3000`.

---

## 🔐 Environment Variables

Create `.env.local` in the project root:

```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Firebase — copy from your Firebase project settings
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# Cloudinary (for profile photo uploads)
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=

# Optional: Custom anime API base URL
VITE_API_BASE_URL=https://aniwatchapi-seven-teal.vercel.app/aniwatch
```

> ⚠️ **Never commit `.env.local` to version control.** It is already in `.gitignore`.

---

## 📁 Project Structure

```
rog-stream/
├── api/
│   └── proxy.ts          # Vercel serverless CORS proxy
├── components/
│   ├── AnimeCard.tsx
│   ├── BottomNav.tsx
│   ├── Hero.tsx
│   ├── Navbar.tsx
│   ├── Trackpad.tsx
│   ├── VideoPlayer.tsx   # HLS + Plyr player
│   └── ...
├── context/
│   └── AuthContext.tsx   # Firebase auth state
├── pages/
│   ├── Home.tsx
│   ├── Watch.tsx         # Global anime player + autoplay
│   ├── RegionalWatch.tsx # Regional anime player + autoplay
│   ├── AnimeDetail.tsx
│   ├── Search.tsx
│   ├── Genres.tsx
│   ├── Schedule.tsx
│   ├── Profile.tsx
│   └── Admin.tsx
├── services/
│   ├── api.ts            # TanStack Query wrapper + URL builder
│   ├── firebase.ts       # Firestore helpers
│   └── gemini.ts         # Gemini AI client
├── public/
│   ├── sw.js             # Service worker (PWA)
│   └── manifest.json
├── types.ts
├── vercel.json
└── vite.config.ts
```

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all `.env.local` keys as **Environment Variables** in your [Vercel project settings](https://vercel.com/docs/projects/environment-variables) before deploying.

The `vercel.json` SPA rewrite is already configured — no extra setup needed.

### Firebase Hosting (Alternative)

```bash
npm run build
firebase deploy --only hosting
```

---

## 🔒 Security

| Issue | Status | Recommendation |
|---|---|---|
| SSRF via open proxy | ⚠️ Known | Add allowlist of trusted domains in `api/proxy.ts` |
| Firebase config in source | ⚠️ Known | Move to `VITE_*` env vars; lock Firestore rules |
| Cloudinary unsigned preset | ⚠️ Known | Move preset name to `VITE_CLOUDINARY_UPLOAD_PRESET` |
| API key in localStorage | ⚠️ Known | Move API key to server-side env, serve via proxy |
| iframe sandbox escape | ✅ Fixed | `allow-scripts allow-forms` (removed `allow-same-origin`) |
| Demo session bypass | ℹ️ Low | No sensitive data exposed in demo mode |

> Lock your Firebase Firestore rules so only authenticated users can read/write their own data:
> ```js
> match /users/{userId} {
>   allow read, write: if request.auth != null && request.auth.uid == userId;
> }
> ```

---

## 🤝 Contributing

Contributions are welcome!

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feat/your-feature

# 3. Commit your changes
git commit -m "feat: add your feature"

# 4. Push and open a PR
git push origin feat/your-feature
```

Please follow the existing code style (TypeScript strict, Tailwind classes, no inline styles).

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

Built with ❤️ by [beyondbday69](https://github.com/beyondbday69)

⭐ Star this repo if you find it useful!

</div>
