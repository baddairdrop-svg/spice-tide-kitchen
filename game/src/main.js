// SPICE TIDE KITCHEN — the entry point: canvas, loop and sound wiring.
// Owns nothing but the frame clock: it steps the World at a fixed 60 Hz
// (so timers and patience behave the same on every machine), draws it with
// the renderer, and turns world events into sounds. A ?seed= picks the
// day's crowd and ?shot= stages one of the screenshot scenes from shots.js
// instead of the title screen.

import { STEP, VIEW } from './config.js';
import { World, EVENT_DAY_OVER, EVENT_LOST, EVENT_READY } from './world.js';
import { drawFrame } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';
import { soundDayClear, soundLose, soundReady } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 7) || 7;
const world = new World(seed);

if (params.has('shot')) {
  stageShot(params.get('shot'), world);
} else {
  attachInput(canvas, world);
}

const status = document.getElementById('status');
let lastStatus = '';
function announce() {
  const line = world.screen === 'play'
    ? `Day ${world.day}. ${world.coins} coins. ${world.orders.length} orders waiting. ${world.message}`
    : world.message;
  if (line !== lastStatus) {
    lastStatus = line;
    if (status) status.textContent = line;
  }
}

let accumulator = 0;
let previous = performance.now();

function frame(now) {
  const elapsed = Math.min(0.25, (now - previous) / 1000);
  previous = now;
  accumulator += elapsed;
  while (accumulator >= STEP) {
    const events = world.step(STEP);
    if (events & EVENT_READY) soundReady();
    if (events & EVENT_LOST) soundLose();
    if (events & EVENT_DAY_OVER) soundDayClear();
    accumulator -= STEP;
  }
  drawFrame(ctx, world, now / 1000);
  announce();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
