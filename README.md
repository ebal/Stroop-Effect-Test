# Stroop Effect Test

A browser-based [Stroop effect](https://en.wikipedia.org/wiki/Stroop_effect) test built with Vue 3 and Vite. You're shown a color name rendered in an ink color and must click the swatch matching the **ink color**, ignoring what the word says — the classic cognitive-interference task from Stroop's 1935 research. Most trials are deliberately incongruent (word ≠ ink color), which is what produces the measurable slowdown the test is named for.

## Features

- **Two game modes**: Color Match (tap the ink color — the classic task) and Word Match (tap what the word says — the "word reading" control condition, which shows much less interference).
- **Four difficulty tiers** that scale on two axes at once — more color choices and a higher incongruent ratio:

  | Difficulty | Colors | Duration | Incongruent / Congruent mix |
  | --- | --- | --- | --- |
  | Easy | 4 | 30 s | 50% / 50% |
  | Medium | 6 | 60 s | 65% / 35% |
  | Hard | 8 | 60 s | 80% / 20% |
  | Very Hard | 10 | 90 s | 90% / 10% |

- **End-of-round stats**: accuracy, average response time, interference score (avg RT<sub>incongruent</sub> − avg RT<sub>congruent</sub>), and a speed/accuracy-weighted total score.
- **Score history**: the last 20 rounds per mode + difficulty, with a sparkline trend, stored in the browser via `localStorage` — no backend, no login.
- **About / How to Play** page with live untimed practice trials.
- Mobile-first layout with large tap targets.

See [`SPEC.md`](./SPEC.md) for the full design rationale and changelog.

## Installation

### Requirements

- [Node.js](https://nodejs.org/) 20+ and npm — for local development.
- [Docker](https://www.docker.com/) and Docker Compose — for the containerized deployment.

### From source

```bash
git clone <this-repo-url>
cd stroop
npm install
```

## Usage

### Local development

```bash
npm run dev
```

Starts the Vite dev server (with hot reload) — open the printed local URL in your browser.

### Production build

```bash
npm run build   # outputs static files to ./dist
npm run preview # serve the build locally to sanity-check it
```

### Docker (recommended for deployment)

The app ships as two plain, unmodified official images — no custom Dockerfile:

- `stroop` — `nginx:alpine`, serves the pre-built `./dist` folder read-only. Always-on; starting/stopping it never triggers a build.
- `builder` — `node:20-alpine`, runs `npm install && npm run build` to (re)produce `./dist`. Only runs on demand, under the `build` profile.

Build the app and start serving it:

```bash
docker compose --profile build run --rm builder   # build ./dist
docker compose up -d                               # serve it on http://localhost:8888
```

Since `./dist` is bind-mounted straight into the nginx container, re-running the `builder` after a source change picks up immediately — no restart needed. To stop the service:

```bash
docker compose stop
```

## Project structure

```
stroop/
├── SPEC.md
├── docker-compose.yml
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.js
    ├── App.vue
    ├── components/
    │   ├── MainMenu.vue
    │   ├── AboutPage.vue
    │   ├── HistoryPage.vue
    │   ├── GameScreen.vue
    │   ├── ResultsScreen.vue
    │   └── ColorButton.vue
    ├── composables/
    │   ├── useStroopGame.js      # trial generation, timer, scoring logic
    │   ├── useBestScores.js      # localStorage read/write, keyed by mode + difficulty
    │   └── useScoreHistory.js    # rolling per-round log, keyed by mode + difficulty
    └── constants/
        └── colors.js             # color palette, difficulty tiers, game modes
```

## License

[MIT](./LICENSE)
