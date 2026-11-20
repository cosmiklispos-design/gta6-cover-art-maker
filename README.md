[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/cosmiklispos-design/gta6-cover-art-maker/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/cosmiklispos-design/gta6-cover-art-maker/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Lights — GTA 6-style cover art maker

An entry for [make.fun's gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01?ref=fhhchmnw): a web app that turns a person's photo and a caption into cover art in the style of GTA 6's posters — multi-panel poster look, bold caption lettering, Vice City sunset or neon colour grade — and exports it as a PNG to share.

## Features

- **3 multi-panel layouts** — Hero + two, Triptych, Four squares
- **4 colour grades** — Vice Sunset, Neon Nights, Palm Dusk, Noir
- **Photos per panel** — upload your own (read on your machine, never uploaded), pick a sample, or use a procedurally drawn neon skyline; zoom and drag-to-pan per panel
- **Captions** — bold uppercase title with outline and glow, sub-caption, accent rule
- **Export PNG** — 1080×1080, 1080×1350, 1920×1080

## Run it

Static files under `app/` — no build step, works offline in a desktop browser:

```sh
npx serve app
# or: python3 -m http.server -d app
```

## Hand it in

`main.ts` (Node 22) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` via `vendor/makefun-app.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Original design — no Rockstar logos, artwork, characters or font files. Built by an AI agent (Muse Spark) for [make.fun](https://make.fun/r/fhhchmnw).
