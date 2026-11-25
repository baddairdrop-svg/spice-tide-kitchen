// SPICE TIDE KITCHEN — input: mouse and keyboard, translated into world verbs.
// Nothing here keeps game state; a click or a key only finds what it hit
// (using the renderer's own geometry) and calls the matching World method,
// then plays the matching sound. The canvas is scaled to fit the window, so
// pointer positions are converted back into the game's 1280×720 space first.

import { COUNTER_ORDER, INGREDIENTS, LAYOUT, STATIONS, VIEW } from './config.js';
import { SCREEN_DAY_END, SCREEN_DAY_FAILED, SCREEN_PLAY, SCREEN_TITLE } from './world.js';
import { cookButtonRect, inside, tileRect } from './render.js';
import { soundAdd, soundCookStart, soundError, soundServe, toggleMuted, unlockAudio } from './audio.js';

function toGameCoords(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW.width,
    y: ((clientY - rect.top) / rect.height) * VIEW.height,
  };
}

function tryAdd(world, itemId) {
  if (world.addToPlate(itemId)) soundAdd();
  else soundError();
}

function tryCook(world, itemId) {
  if (world.startCook(itemId)) soundCookStart();
  else soundError();
}

function tryServe(world, orderId = null) {
  if (world.servePlate(orderId)) soundServe();
  else soundError();
}

/** Handle one pointer position in game coordinates. Returns true if it landed on something. */
export function handlePoint(world, x, y) {
  unlockAudio();
  if (world.screen === SCREEN_TITLE) {
    world.startDay(1);
    return true;
  }
  if (world.screen === SCREEN_DAY_END) {
    world.startDay(world.day + 1);
    return true;
  }
  if (world.screen === SCREEN_DAY_FAILED) {
    world.startDay(world.day);
    return true;
  }
  if (world.screen !== SCREEN_PLAY) return false;

  for (let i = 0; i < world.orders.length; i += 1) {
    if (inside(x, y, LAYOUT.tickets[i])) {
      tryServe(world, world.orders[i].id);
      return true;
    }
  }
  if (inside(x, y, LAYOUT.serveButton)) {
    tryServe(world);
    return true;
  }
  if (inside(x, y, LAYOUT.clearButton)) {
    world.clearPlate();
    world.setMessage('Plate cleared — everything back in the tray.');
    return true;
  }
  const stationList = Object.values(STATIONS);
  for (let si = 0; si < stationList.length; si += 1) {
    for (let ii = 0; ii < stationList[si].makes.length; ii += 1) {
      if (inside(x, y, cookButtonRect(si, ii))) {
        tryCook(world, stationList[si].makes[ii]);
        return true;
      }
    }
  }
  for (let i = 0; i < COUNTER_ORDER.length; i += 1) {
    if (inside(x, y, tileRect(i))) {
      tryAdd(world, COUNTER_ORDER[i]);
      return true;
    }
  }
  return false;
}

/** Handle one key (KeyboardEvent.key). Returns true when the game used it. */
export function handleKey(world, key) {
  unlockAudio();
  if (key === 'm' || key === 'M') {
    const nowMuted = toggleMuted();
    world.setMessage(nowMuted ? 'Sound off.' : 'Sound on.');
    return true;
  }
  if (world.screen === SCREEN_TITLE) {
    if (key === 'Enter' || key === ' ') { world.startDay(1); return true; }
    return false;
  }
  if (world.screen === SCREEN_DAY_END) {
    if (key === 'Enter' || key === ' ') { world.startDay(world.day + 1); return true; }
    return false;
  }
  if (world.screen === SCREEN_DAY_FAILED) {
    if (key === 'Enter' || key === ' ') { world.startDay(world.day); return true; }
    return false;
  }
  if (world.screen !== SCREEN_PLAY) return false;

  if (key === 'Enter' || key === ' ') {
    tryServe(world);
    return true;
  }
  if (key === 'Backspace' || key === 'Delete') {
    world.removeLastFromPlate();
    return true;
  }
  const upper = key.toUpperCase();
  for (const station of Object.values(STATIONS)) {
    station.makes.forEach((itemId, ii) => {
      if (upper === station.keys[ii]) tryCook(world, itemId);
    });
  }
  if (Object.values(STATIONS).some((s) => s.keys.includes(upper))) return true;
  for (const itemId of COUNTER_ORDER) {
    if (INGREDIENTS[itemId].key === key) {
      tryAdd(world, itemId);
      return true;
    }
  }
  return false;
}

/** Wire a canvas to the world: pointerdown and keydown, in game coordinates. */
export function attachInput(canvas, world) {
  canvas.addEventListener('pointerdown', (event) => {
    const point = toGameCoords(canvas, event.clientX, event.clientY);
    handlePoint(world, point.x, point.y);
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Backspace' || event.key === ' ') event.preventDefault();
    handleKey(world, event.key);
  });
}
