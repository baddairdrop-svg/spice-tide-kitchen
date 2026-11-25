// SPICE TIDE KITCHEN — configuration: the kitchen's fixed facts.
// Canvas size, layout rectangles shared by the renderer and the input handler,
// the ingredient catalogue, the cooking stations and the recipe book.
// Everything the other files need to agree on lives here, and nowhere else.

export const VIEW = { width: 1280, height: 720 };

export const STEP = 1 / 60;

// The shift clock: one day of service, in seconds. Orders arrive, patience
// drains, and when the clock runs out the day is scored.
export const SHIFT_SECONDS = 150;
export const START_HEARTS = 3;
export const MAX_ORDERS = 3;
export const MAX_PLATE = 6;

// Layout rectangles (x, y, width, height) in canvas pixels. The renderer draws
// into these and the input handler hit-tests against the same numbers, so a
// button can never look clickable in one place and act in another.
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 60 },
  tickets: [
    { x: 16, y: 68, w: 264, h: 124 },
    { x: 296, y: 68, w: 264, h: 124 },
    { x: 576, y: 68, w: 264, h: 124 },
  ],
  menuPanel: { x: 856, y: 68, w: 408, h: 124 },
  platePanel: { x: 16, y: 200, w: 604, h: 252 },
  plateCentre: { x: 218, y: 316, w: 0, h: 0 },
  serveButton: { x: 452, y: 316, w: 152, h: 56 },
  clearButton: { x: 452, y: 384, w: 152, h: 44 },
  stationsPanel: { x: 636, y: 200, w: 628, h: 252 },
  stations: [
    { x: 652, y: 244, w: 192, h: 192 },
    { x: 860, y: 244, w: 192, h: 192 },
    { x: 1068, y: 244, w: 180, h: 192 },
  ],
  counter: { x: 16, y: 460, w: 1248, h: 180 },
  footer: { x: 0, y: 648, w: 1280, h: 72 },
};

// The nine things that can land on a plate. `from` is either "pantry" (take it
// straight off the counter) or the id of the station that cooks it. Colours
// are the renderer's palette for that food, so the bins, the tickets and the
// plate all draw the same dish the same way.
export const INGREDIENTS = {
  rice:    { id: 'rice',    name: 'Steamed Rice',    short: 'Rice',    from: 'pantry', key: '1', main: '#f7f2df', shade: '#ddd2ac', accent: '#b8a86b' },
  sambal:  { id: 'sambal',  name: 'Volcano Sambal',  short: 'Sambal',  from: 'pantry', key: '2', main: '#d63a22', shade: '#a52312', accent: '#ff8a5c' },
  curry:   { id: 'curry',   name: 'Coconut Curry',   short: 'Curry',   from: 'pantry', key: '3', main: '#f0a13c', shade: '#c67a1e', accent: '#ffd98a' },
  chicken: { id: 'chicken', name: 'Grilled Chicken', short: 'Chicken', from: 'grill',  key: '4', main: '#b06a35', shade: '#7e451d', accent: '#e8a35f' },
  satay:   { id: 'satay',   name: 'Satay Skewers',   short: 'Satay',   from: 'grill',  key: '5', main: '#8a4b24', shade: '#5f3013', accent: '#d98e4a' },
  noodles: { id: 'noodles', name: 'Stir Noodles',    short: 'Noodles', from: 'wok',    key: '6', main: '#f2c14e', shade: '#cf9827', accent: '#ffe9a3' },
  greens:  { id: 'greens',  name: 'Wok Greens',      short: 'Greens',  from: 'wok',    key: '7', main: '#4d9b4d', shade: '#2f6b2f', accent: '#8fd07e' },
  egg:     { id: 'egg',     name: 'Fried Egg',       short: 'Egg',     from: 'fryer',  key: '8', main: '#fdfdf6', shade: '#e8e4ce', accent: '#ffb921' },
  shallot: { id: 'shallot', name: 'Crispy Shallots', short: 'Shallots', from: 'fryer', key: '9', main: '#e0aa4e', shade: '#b57f2a', accent: '#ffdf94' },
};

// Counter order: pantry first, then each station's pair, left to right.
export const COUNTER_ORDER = ['rice', 'sambal', 'curry', 'chicken', 'satay', 'noodles', 'greens', 'egg', 'shallot'];

// The three cooking stations. Each cooks one item at a time; `cookSeconds`
// lives on the item each station makes, so a station card and the recipe book
// never disagree about how long dinner takes.
export const STATIONS = {
  grill: { id: 'grill', name: 'CHAR GRILL', short: 'GRILL', makes: ['chicken', 'satay'], keys: ['Q', 'W'], colour: '#e2543e' },
  wok:   { id: 'wok',   name: 'WOK STATION', short: 'WOK', makes: ['noodles', 'greens'], keys: ['E', 'R'], colour: '#3e8e5a' },
  fryer: { id: 'fryer', name: 'FRY PAN',     short: 'FRY PAN', makes: ['egg', 'shallot'],    keys: ['T', 'Y'], colour: '#d99a26' },
};

export const COOK_SECONDS = { chicken: 5, satay: 4, noodles: 4, greens: 3, egg: 3, shallot: 2.5 };

// The recipe book. `items` is the exact multiset a plate must hold to serve
// the dish; `price` is in coins; `unlockDay` is the first day the dish can be
// ordered. Recipes share ingredients on purpose: one grill run can feed two
// different orders, which is where the route-planning lives.
export const RECIPES = [
  { id: 'ricebowl', name: 'Samudra Rice Bowl', items: ['rice', 'chicken', 'egg', 'sambal'], price: 120, unlockDay: 1 },
  { id: 'noodlewok', name: 'Tide Noodle Wok', items: ['noodles', 'greens', 'satay', 'sambal'], price: 130, unlockDay: 1 },
  { id: 'satayplate', name: 'Golden Satay Plate', items: ['rice', 'satay', 'shallot', 'curry'], price: 125, unlockDay: 1 },
  { id: 'volcano', name: 'Volcano Egg Rice', items: ['rice', 'egg', 'shallot', 'sambal', 'greens'], price: 150, unlockDay: 1 },
  { id: 'currybowl', name: "Captain's Curry Bowl", items: ['rice', 'chicken', 'curry', 'greens'], price: 145, unlockDay: 2 },
  { id: 'feast', name: 'Harbour Feast Platter', items: ['noodles', 'chicken', 'egg', 'satay'], price: 170, unlockDay: 3 },
];

// Per-day tuning: the coin goal for three stars, the patience each new order
// starts with, and how fast fresh orders walk in.
export const DAYS = [
  { day: 1, goal: 500, patience: 62, spawnEvery: 7 },
  { day: 2, goal: 700, patience: 55, spawnEvery: 6 },
  { day: 3, goal: 900, patience: 49, spawnEvery: 5 },
];

export function dayConfig(day) {
  if (day <= DAYS.length) return DAYS[day - 1];
  // Past the written book the kitchen just keeps getting busier.
  const last = DAYS[DAYS.length - 1];
  const extra = day - DAYS.length;
  return { day, goal: last.goal + extra * 200, patience: Math.max(38, last.patience - extra * 3), spawnEvery: Math.max(4, last.spawnEvery - extra * 0.5) };
}

export function recipesForDay(day) {
  return RECIPES.filter((recipe) => recipe.unlockDay <= day);
}
