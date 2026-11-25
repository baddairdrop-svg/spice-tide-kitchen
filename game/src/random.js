// SPICE TIDE KITCHEN — a tiny seeded random number generator.
// Orders must be reproducible: the same seed deals the same rush, which is
// what lets the screenshot scenes stage an exact frame and lets a player
// retry a day against the same crowd. Mulberry32 is small, fast and good
// enough for dealing dinner orders.

export function makeRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `list` with the given generator. */
export function pick(next, list) {
  return list[Math.floor(next() * list.length) % list.length];
}

/** A whole number from `low` to `high`, both ends included. */
export function intBetween(next, low, high) {
  return low + Math.floor(next() * (high - low + 1));
}
