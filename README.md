# 🏆 ACE ICPC | CF GRIND

Your personal Codeforces competitive programming coach — analytics, training plans, smart recommendations, and AI-generated hints, all running entirely client-side in a Chrome extension.

> Think GitHub Copilot + Duolingo + Striver A2Z + a Codeforces analytics dashboard, packed into your browser toolbar.

---

## ✨ Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Profile Dashboard** | Handle, rating, max rating, rank, contribution, friends, org, country |
| 2 | **Submission Analyzer** | Total solved, rating-bucket breakdown, topic breakdown, monthly activity |
| 3 | **Topic Strength Engine** | Strongest/weakest topics, confidence scoring, radar chart |
| 4 | **Grind Coach** | Personalized roadmap toward a target rating, with weekly estimate |
| 5 | **Smart Recommendations** | Unsolved problems matched to weak topics & nearby rating, with diversity constraints |
| 6 | **Contest Analytics** | Rating graph, best/worst contest, avg gain/loss, volatility, contest table |
| 7 | **Problem Page Assistant** | Injected sidebar on Codeforces problem pages comparing problem difficulty to you |
| 8 | **AI Hint Generator** | Hint 1 → 2 → 3, Approach, Related Concepts — never reveals code (Gemini/OpenAI) |
| 9 | **Streak System** | Daily solve tracking, current/longest streak, weekly heatmap |
| 10 | **Settings** | Handle, theme, AI provider/key, cache controls, JSON export |
| 11 | **Dark Mode** | Persisted theme across popup, settings, and content sidebar |
| 12 | **Error Handling** | Invalid handles, API outages, rate limits, missing data — all handled gracefully |
| 13 | **Performance** | Caching, request de-duplication, retries with backoff, timeouts |

---

## 🏗 Architecture

```
                ┌─────────────────────┐
                │   Codeforces API     │
                └──────────┬───────────┘
                           │
                ┌──────────▼───────────┐
                │  services/codeforcesApi │  retry + timeout + dedup
                └──────────┬───────────┘
                           │
        ┌──────────────────┼───────────────────┐
        ▼                  ▼                   ▼
 submissionAnalyzer   contestAnalytics     streakSystem
        │                  │                   │
        ▼                  │                   │
 topicStrengthEngine        │                   │
        │                  │                   │
        ▼                  │                   │
   grindCoach        recommendationEngine       │
        │                  │                   │
        └──────────┬───────┴───────────┬───────┘
                   ▼                   ▼
              popup/popup.ts     content/content.ts
            (tabbed dashboard)   (in-page sidebar +
                                  AI hint generator)
                   │
                   ▼
            storage/storage.ts (chrome.storage.local + TTL cache)
```

**Layers**

- `services/` — pure business logic: API client, analyzers, scoring engines, AI providers. No DOM access.
- `storage/` — thin wrapper around `chrome.storage.local` with a generic TTL cache helper.
- `components/` — reusable UI helpers (Chart.js wrappers).
- `popup/`, `settings/`, `content/`, `background/` — entry points that wire services into UI.
- `types/`, `constants/`, `utils/` — shared primitives.

---

## 📦 Tech Stack

- TypeScript (strict mode)
- Chrome Extension Manifest V3
- Vite (3 build targets: popup/settings pages, background service worker, content script)
- Chart.js (radar, line, bar charts)
- ESLint + Prettier
- Vitest for unit tests
- Zero backend — 100% client-side, talks directly to the Codeforces API and your chosen AI provider

---

## 🚀 Installation & Build

```bash
npm install
npm run build
```

This produces a `dist/` folder containing the unpacked extension.

### Load into Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

The extension icon will appear in your toolbar. Click it, enter a Codeforces handle, and explore the tabs.

### Development

```bash
npm run dev      # watches and rebuilds on change
npm run lint     # ESLint
npm run format   # Prettier
npm run test     # Vitest unit tests
```

After any change, reload the extension from `chrome://extensions` (or use the dev watch + manual reload) to see updates.

---

## ⚙️ Configuring AI Hints

1. Open the extension popup → click the ⚙️ icon (or right-click the extension icon → Options).
2. Choose **Gemini** or **OpenAI** as your provider.
3. Paste your API key. It is stored only in `chrome.storage.local` on your machine and sent directly to the provider's API when you request a hint — never to any Anthropic/Ace server, because there isn't one.
4. Visit any Codeforces problem page (`/contest/.../problem/...` or `/problemset/problem/...`). A sidebar will appear with Hint 1 / Hint 2 / Hint 3 / Approach / Related Concepts buttons.

Hints are designed to escalate gradually and **never include code or pseudocode**.

---

## 🧠 How the scoring works

- **Topic confidence** blends solve-rate with attempt volume, so a topic with 1/1 solved doesn't outrank one with 40/50.
- **Grind plan** picks your 3 weakest attempted topics, scales problem quotas to the size of your rating gap, and always includes a contest-participation goal.
- **Recommendations** score unsolved problems on rating proximity + weak-topic match, then apply a diversity cap (max 3 per primary tag) so your list isn't dominated by one tag.
- **Streaks** count consecutive calendar days with at least one `OK` verdict, with a grace day if today hasn't been solved yet.

---

## 🖼 Screenshots

> Add screenshots of the popup tabs (Profile, Topics, Grind Coach, Recommend, Contests, Streak) and the in-page problem sidebar here once you've loaded the extension locally.

```
screenshots/
  profile-tab.png
  topics-radar.png
  grind-coach.png
  recommendations.png
  contest-analytics.png
  streak.png
  problem-sidebar.png
```

---

## 🗺 Future Roadmap

- [ ] Friend/leaderboard comparisons
- [ ] Virtual contest scheduler with reminders
- [ ] Editorial-aware hint grounding (fetch and summarize editorials post-contest)
- [ ] Per-topic spaced-repetition scheduling
- [ ] Codeforces Gym integration for ICPC-style team practice
- [ ] Export training plan to calendar (.ics)
- [ ] Offline-first caching of full problemset for instant recommendations

---

## 📁 Project Structure

```
src/
  background/    background.ts            – MV3 service worker
  content/       content.ts, content.css  – problem-page sidebar + AI hints
  popup/         popup.html/ts/css         – main tabbed dashboard
  settings/      settings.html/ts/css      – options page
  services/      codeforcesApi.ts          – API client (retry/timeout/dedup)
                 submissionAnalyzer.ts     – solved/topic/rating stats
                 topicStrengthEngine.ts    – strongest/weakest topics
                 grindCoach.ts             – personalized roadmap
                 recommendationEngine.ts   – problem recommendations
                 contestAnalytics.ts       – rating history stats
                 streakSystem.ts           – streak tracking
                 settingsService.ts        – settings persistence
                 ai/                       – provider-agnostic hint generation
  storage/       storage.ts                – chrome.storage.local + TTL cache
  components/    charts.ts                 – Chart.js wrappers
  types/         index.ts                  – shared TypeScript types
  constants/     index.ts                  – shared constants
  utils/         index.ts                  – shared helpers
public/
  manifest.json
  icons/
scripts/
  copy-static.js – copies manifest/icons/content.css into dist/ post-build
```

---

## ⚠️ Disclaimer

This is an independent, community-built tool and is not affiliated with or endorsed by Codeforces. AI hints are generated by third-party LLM providers (Google Gemini or OpenAI) using the API key you supply; quality and accuracy are not guaranteed.
