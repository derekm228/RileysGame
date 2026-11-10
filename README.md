# Miraculous Ladybug

A 2D side-scrolling browser platformer. Follow the bad guy's footprints across the city rooftops, then chase him down and catch him!

## Play

```sh
npm install
npm run dev      # opens http://localhost:8080
```

**Controls:** ← → (or A/D) to move, ↑ / Space / W to jump (hold for a higher jump).
On phones and tablets, on-screen ◀ ▶ ▲ buttons appear (play in landscape).

## Build for the web

```sh
npm run build    # static site in dist/
npm run preview
```

## Publish on GitHub Pages

Pushing to `main` builds and deploys automatically (`.github/workflows/deploy.yml`).
One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
The game will be at https://derekm228.github.io/RileysGame/

## Where things live

| File | What it does |
| --- | --- |
| `src/level.ts` | The level layout: ground, pits, rooftops, crates, and where the footprints go |
| `src/art/textures.ts` | All the art (drawn in code). Swap in hand-drawn PNGs here later |
| `src/objects/Player.ts` | How the heroine runs and jumps |
| `src/objects/TouchControls.ts` | On-screen buttons for phones and tablets |
| `src/objects/Villain.ts` | How the bad guy waits, runs away, and leaves tracks |
| `src/scenes/` | Title screen, the game, and the win screen |
| `src/audio.ts` | Sound effects |
