// SPICE TIDE KITCHEN — the screenshot scenes behind ?shot=rush|title|served|dayend.
// Each scene composes a real World into one honest moment of play — the same
// orders, plate, stations and timers the rules themselves produce — so a
// screenshot is the game as it truly looks mid-rush, never a mock-up. The
// scenes are fixed: the same name always stages the same frame.

import { RECIPES } from './config.js';
import { SCREEN_DAY_END, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

function recipe(id) {
  return RECIPES.find((r) => r.id === id);
}

function order(id, recipeId, patience, maxPatience) {
  const found = recipe(recipeId);
  return { id, recipe: found, patience, maxPatience, price: found.price };
}

/** The cover scene: a full board, one dish mid-assembly, food on the stations. */
function stageRush(world) {
  world.day = 1;
  world.resetDay(7);
  world.screen = SCREEN_PLAY;
  world.coins = 260;
  world.totalCoins = 260;
  world.combo = 3;
  world.bestCombo = 3;
  world.served = 4;
  world.lost = 0;
  world.shiftLeft = 107;
  world.orders = [
    order(11, 'ricebowl', 38, 62),
    order(12, 'noodlewok', 52, 62),
    order(13, 'satayplate', 24, 62),
  ];
  // Mid-assembly: the Rice Bowl is one sambal short of the ticket.
  world.plate = ['rice', 'chicken', 'egg'];
  world.stock.satay = 1;
  world.stock.noodles = 1;
  world.stock.greens = 1;
  world.stations.grill.cooking = 'chicken';
  world.stations.grill.elapsed = 2.4;
  world.stations.grill.duration = 5;
  world.stations.fryer.cooking = 'egg';
  world.stations.fryer.elapsed = 1.1;
  world.stations.fryer.duration = 3;
  world.setMessage('Rice Bowl is one sambal away — the grill already has chicken coming!');
}

/** The serve scene: a finished plate under a glowing READY ticket, coins rising. */
function stageServed(world) {
  world.day = 1;
  world.resetDay(19);
  world.screen = SCREEN_PLAY;
  world.coins = 445;
  world.totalCoins = 445;
  world.combo = 4;
  world.bestCombo = 4;
  world.served = 5;
  world.shiftLeft = 83;
  world.orders = [
    order(21, 'ricebowl', 47, 62),
    order(22, 'volcano', 58, 62),
    order(23, 'noodlewok', 31, 62),
  ];
  world.plate = ['rice', 'chicken', 'egg', 'sambal'];
  world.stock.greens = 1;
  world.stock.satay = 2;
  world.stations.grill.cooking = 'satay';
  world.stations.grill.elapsed = 3.1;
  world.stations.grill.duration = 4;
  world.floaters.push({ text: '+185', sub: 'tip +65', t: 0.15, life: 2.2 });
  world.setMessage('Samudra Rice Bowl plated and ready — hit SERVE!');
}

/** The day-end scene: a three-star service, counted and closed. */
function stageDayEnd(world) {
  world.day = 1;
  world.resetDay(23);
  world.coins = 640;
  world.totalCoins = 640;
  world.served = 9;
  world.lost = 1;
  world.bestCombo = 6;
  world.screen = SCREEN_DAY_END;
}

/** Set `world` to the named scene (rush, title, served or dayend). */
export function stageShot(name, world) {
  if (name === 'served') stageServed(world);
  else if (name === 'dayend') stageDayEnd(world);
  else if (name === 'title') {
    world.day = 1;
    world.resetDay(7);
    world.screen = SCREEN_TITLE;
  } else stageRush(world);
}
