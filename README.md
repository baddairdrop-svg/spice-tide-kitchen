# Spice Tide Kitchen

An original harbour cooking-rush game that plays offline in a desktop browser from static files — no build step, no network, no libraries.

**Play it:** `node serve.ts`, then open http://localhost:8080

## The game

You run a harbour kitchen through a 150-second lunch rush. Order tickets pin up on the board, each with a recipe, a price and a draining patience bar. Three cooking stations — the char grill, the wok station and the fry pan — cook one dish at a time, and cooked food waits in the tray. Pantry staples (steamed rice, volcano sambal, coconut curry) come straight off the counter. Build each dish on the assembly plate, serve it before patience runs out, and fast serves earn tips and build a combo. Three walk-outs end the day; hit the coin goal for three stars and unlock new recipes on later days.

Six original recipes share ingredients on purpose — one grill run can feed two different orders — so the game is about planning a route through the kitchen while the clock and the patience bars burn down.

## Controls

- **Mouse:** click station dishes to cook, counter ingredients to plate, a ticket (or SERVE) to serve
- **1–9:** add a counter ingredient · **Q/W** grill · **E/R** wok · **T/Y** fryer
- **Enter / Space:** serve · **Backspace:** take the last item off the plate · **M:** mute

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output and writes `dossier.json`
- `game/index.html` — the page; `game/src/` holds the game, one job per file:
  - `config.js` — layout, ingredients, stations, recipes, day tuning
  - `world.js` — state and rules: orders, stations, plate, clock, scoring
  - `render.js` — all drawing, including every dish's food art
  - `input.js` — mouse and keyboard, translated into world verbs
  - `audio.js` — WebAudio-synthesized sounds, no audio files
  - `random.js` — the seeded RNG that deals each day's orders
  - `shots.js` — the deterministic screenshot scenes (`?shot=rush|title|served|dayend`)
  - `main.js` — canvas, the fixed-step loop, sound wiring
- `screenshots/` — four real renders of the game, staged by `shots.js`
- `vendor/makefun-game.ts` — the make.fun dossier library, unchanged from the kit

MIT licensed. Everything — names, art, recipes, sounds — is original to this entry.
