// SPICE TIDE KITCHEN — the world: game state and the rules of the kitchen.
// This file owns everything that changes while you play: the order board,
// the stations, the plate being assembled, the shift clock, coins, hearts
// and combo. It knows nothing about pixels or keyboards; the renderer only
// reads it, and the input handler only calls the verbs defined here
// (startCook, addToPlate, servePlate, clearPlate, startDay, ...).

import { COOK_SECONDS, INGREDIENTS, MAX_ORDERS, MAX_PLATE, SHIFT_SECONDS, START_HEARTS, STATIONS, dayConfig, recipesForDay } from './config.js';
import { makeRandom, pick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_DAY_END = 'dayEnd';
export const SCREEN_DAY_FAILED = 'dayFailed';

export const EVENT_NONE = 0;
export const EVENT_READY = 1;   // a station finished cooking
export const EVENT_SERVED = 2;  // an order was served
export const EVENT_LOST = 4;    // an order walked out
export const EVENT_DAY_OVER = 8;

let orderSerial = 0;

function newOrder(next, day) {
  const cfg = dayConfig(day);
  const recipe = pick(next, recipesForDay(day));
  orderSerial += 1;
  return {
    id: orderSerial,
    recipe,
    patience: cfg.patience,
    maxPatience: cfg.patience,
    price: recipe.price,
  };
}

function emptyStation(id) {
  return { id, cooking: null, elapsed: 0, duration: 0 };
}

export class World {
  constructor(seed = 7) {
    this.baseSeed = seed;
    this.screen = SCREEN_TITLE;
    this.day = 1;
    this.totalCoins = 0;
    this.bestCombo = 0;
    this.resetDay(seed);
  }

  /** Set up a fresh day: empty board, cold stations, full hearts. */
  resetDay(seed = this.baseSeed + this.day * 101) {
    this.next = makeRandom(seed);
    this.coins = 0;
    this.hearts = START_HEARTS;
    this.combo = 0;
    this.served = 0;
    this.lost = 0;
    this.shiftLeft = SHIFT_SECONDS;
    this.orders = [];
    this.spawnIn = 0;
    this.plate = [];
    this.stock = {};
    for (const id of Object.keys(INGREDIENTS)) this.stock[id] = 0;
    this.stations = { grill: emptyStation('grill'), wok: emptyStation('wok'), fryer: emptyStation('fryer') };
    this.floaters = [];
    this.message = 'First orders coming in — fire up the grill!';
    this.messageT = 0;
    this.shake = 0;
    this.lastServe = null;
    // The rush opens with a full board so the kitchen is never idle.
    for (let i = 0; i < MAX_ORDERS; i += 1) this.orders.push(newOrder(this.next, this.day));
  }

  startDay(day) {
    this.day = day;
    this.resetDay();
    this.screen = SCREEN_PLAY;
  }

  /** Begin cooking `itemId` on its station, if that station is free. */
  startCook(itemId) {
    const ingredient = INGREDIENTS[itemId];
    if (!ingredient || ingredient.from === 'pantry') return false;
    const station = this.stations[ingredient.from];
    if (station.cooking !== null) {
      this.setMessage(`${STATIONS[ingredient.from].name} is busy — one dish at a time!`);
      return false;
    }
    station.cooking = itemId;
    station.elapsed = 0;
    station.duration = COOK_SECONDS[itemId];
    return true;
  }

  /**
   * Put one of `itemId` on the assembly plate. Pantry items are unlimited;
   * cooked items come out of the station tray's stock. Returns true when
   * the item landed on the plate.
   */
  addToPlate(itemId) {
    const ingredient = INGREDIENTS[itemId];
    if (!ingredient) return false;
    if (this.plate.length >= MAX_PLATE) {
      this.setMessage('The plate is full — serve it or clear it!');
      return false;
    }
    if (ingredient.from !== 'pantry') {
      if (this.stock[itemId] <= 0) {
        const stationName = STATIONS[ingredient.from].name;
        this.setMessage(`No ${ingredient.short} ready — cook it on the ${stationName}!`);
        return false;
      }
      this.stock[itemId] -= 1;
    }
    this.plate.push(itemId);
    return true;
  }

  /** Take the last item off the plate, back to the tray or the pantry. */
  removeLastFromPlate() {
    const itemId = this.plate.pop();
    if (itemId && INGREDIENTS[itemId].from !== 'pantry') this.stock[itemId] += 1;
    return itemId;
  }

  clearPlate() {
    while (this.plate.length > 0) this.removeLastFromPlate();
  }

  /** How the current plate differs from a recipe: missing and extra items. */
  plateDiff(recipe) {
    const missing = [];
    const extra = [...this.plate];
    for (const itemId of recipe.items) {
      const at = extra.indexOf(itemId);
      if (at === -1) missing.push(itemId);
      else extra.splice(at, 1);
    }
    return { missing, extra };
  }

  plateMatches(recipe) {
    const diff = this.plateDiff(recipe);
    return diff.missing.length === 0 && diff.extra.length === 0;
  }

  /**
   * Serve the plate. With `orderId`, serve that ticket (and explain, in the
   * message line, exactly what is missing or extra when it does not match).
   * Without one, serve whichever order the plate matches. Returns the order
   * served, or null.
   */
  servePlate(orderId = null) {
    if (this.plate.length === 0) {
      this.setMessage('The plate is empty — build a dish first!');
      return null;
    }
    let order = null;
    if (orderId !== null) {
      order = this.orders.find((o) => o.id === orderId) ?? null;
      if (order && !this.plateMatches(order.recipe)) {
        const diff = this.plateDiff(order.recipe);
        const parts = [];
        if (diff.missing.length > 0) parts.push(`missing ${diff.missing.map((i) => INGREDIENTS[i].short).join(', ')}`);
        if (diff.extra.length > 0) parts.push(`extra ${diff.extra.map((i) => INGREDIENTS[i].short).join(', ')}`);
        this.setMessage(`Not ${order.recipe.name}: ${parts.join(' • ')}`);
        this.shake = 0.35;
        return null;
      }
    } else {
      order = this.orders.find((o) => this.plateMatches(o.recipe)) ?? null;
      if (!order) {
        this.setMessage('That plate matches no order on the board!');
        this.shake = 0.35;
        return null;
      }
    }
    if (!order) return null;
    const patienceFrac = Math.max(0, order.patience / order.maxPatience);
    const tip = Math.round(order.price * 0.5 * patienceFrac) + this.combo * 5;
    const gained = order.price + tip;
    this.coins += gained;
    this.totalCoins += gained;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.served += 1;
    this.lastServe = { name: order.recipe.name, gained, tip, x: 0, y: 0 };
    this.floaters.push({ text: `+${gained}`, sub: tip > 0 ? `tip +${tip}` : '', t: 0, life: 1.6 });
    this.orders = this.orders.filter((o) => o.id !== order.id);
    this.spawnIn = Math.min(this.spawnIn, 1.2);
    this.plate = [];
    this.setMessage(`Served ${order.recipe.name}! +${gained} coins${this.combo > 1 ? ` — combo ×${this.combo}` : ''}`);
    return order;
  }

  setMessage(text) {
    this.message = text;
    this.messageT = 0;
  }

  /** Stars earned for the day that just ended: 1 for finishing, up to 3. */
  stars() {
    const goal = dayConfig(this.day).goal;
    if (this.coins >= goal) return 3;
    if (this.coins >= Math.round(goal * 0.7)) return 2;
    if (this.coins >= Math.round(goal * 0.4)) return 1;
    return 0;
  }

  /**
   * Advance the world by `dt` seconds. Returns a bitmask of EVENT_* flags
   * so the caller can play the right sounds without the world knowing
   * anything about audio.
   */
  step(dt) {
    let events = EVENT_NONE;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
    this.messageT += dt;
    for (const floater of this.floaters) floater.t += dt;
    this.floaters = this.floaters.filter((f) => f.t < f.life);
    if (this.screen !== SCREEN_PLAY) return events;

    this.shiftLeft = Math.max(0, this.shiftLeft - dt);

    // Stations cook; a finished item drops into the station's tray stock.
    for (const station of Object.values(this.stations)) {
      if (station.cooking !== null) {
        station.elapsed += dt;
        if (station.elapsed >= station.duration) {
          this.stock[station.cooking] += 1;
          station.cooking = null;
          station.elapsed = 0;
          events |= EVENT_READY;
        }
      }
    }

    // Patience drains; an empty bar is a customer walking out.
    const cfg = dayConfig(this.day);
    const survivors = [];
    for (const order of this.orders) {
      order.patience -= dt;
      if (order.patience <= 0) {
        this.lost += 1;
        this.hearts -= 1;
        this.combo = 0;
        events |= EVENT_LOST;
        this.setMessage(`The ${order.recipe.name} order walked out!`);
      } else {
        survivors.push(order);
      }
    }
    this.orders = survivors;

    // Fresh orders walk in while there is room on the board.
    if (this.orders.length < MAX_ORDERS) {
      this.spawnIn -= dt;
      if (this.spawnIn <= 0) {
        this.orders.push(newOrder(this.next, this.day));
        this.spawnIn = cfg.spawnEvery;
      }
    }

    if (this.hearts <= 0) {
      this.screen = SCREEN_DAY_FAILED;
      events |= EVENT_DAY_OVER;
    } else if (this.shiftLeft <= 0) {
      this.screen = SCREEN_DAY_END;
      events |= EVENT_DAY_OVER;
    }
    return events;
  }
}
