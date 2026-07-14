# Rail Rush — 3D Endless Runner

A browser Subway Surfers–style endless runner built with **Three.js** and **Vite**.

## Play live

**https://abdulsamad183.github.io/subway-surfers-3d/**

### Enable GitHub Pages (one-time)

1. Open [Pages settings](https://github.com/abdulsamad183/subway-surfers-3d/settings/pages)
2. **Source:** Deploy from a branch
3. **Branch:** `gh-pages` → `/ (root)` → Save

Pushes to `main` rebuild and update `gh-pages` automatically.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Controls

| Action | Keyboard | Touch |
|--------|----------|-------|
| Lane left | ← or A | Swipe left |
| Lane right | → or D | Swipe right |
| Jump | ↑, W, or Space | Swipe up |
| Slide under | ↓ or S | Swipe down |
| Skateboard (10s) | Double-tap Space / F / Shift | Double-tap |

Start with **5 skateboards**. Collect more teal board pickups on the track. Yellow-striped hanging blocks require a slide.

## Features

- 3-lane rail surfing with jump & slide
- Trains, barriers, and overhead bars
- Coin pickup + high score (saved locally)
- Procedural city skyline, dusk lighting, shadows
- Keyboard + mobile swipe support
