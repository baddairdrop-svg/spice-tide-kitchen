// SPICE TIDE KITCHEN — the renderer: every pixel of the game.
// Canvas 2D, flat illustration, no image files: the kitchen wall, the order
// tickets, the stations, the counter bins and every dish are drawn from
// shapes here. It also owns the geometry of the clickable things (counter
// tiles and cook buttons) so the input handler tests exactly what is drawn.

import { COUNTER_ORDER, COOK_SECONDS, INGREDIENTS, LAYOUT, RECIPES, STATIONS, VIEW, dayConfig } from './config.js';
import { SCREEN_DAY_END, SCREEN_DAY_FAILED, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

const INK = '#2b1c10';
const PAPER = '#fff6e3';
const WOOD = '#8a5a33';
const WOOD_DARK = '#6e4525';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, align = 'left', weight = '700', font = 'system-ui, sans-serif') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function heart(ctx, x, y, size, filled) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.9);
  ctx.bezierCurveTo(x - size * 1.2, y + size * 0.1, x - size * 0.6, y - size, x, y - size * 0.25);
  ctx.bezierCurveTo(x + size * 0.6, y - size, x + size * 1.2, y + size * 0.1, x, y + size * 0.9);
  ctx.fillStyle = filled ? '#e23b3b' : 'rgba(255,255,255,0.25)';
  ctx.fill();
}

function star(ctx, x, y, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(angle) * rad;
    const py = y + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#ffc93c' : 'rgba(255,255,255,0.2)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.stroke();
}

function coinIcon(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffc93c';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#c9930a';
  ctx.stroke();
  text(ctx, '$', x, y + 1, r * 1.1, '#8a6100', 'center', '900');
}

// ---------------------------------------------------------------------------
// Food art. Every ingredient is one small drawing, used identically on the
// order tickets, in the counter bins and on the assembly plate, so a player
// learns a dish by its picture and never has to read under pressure.
// ---------------------------------------------------------------------------

export function drawFood(ctx, id, cx, cy, r) {
  const food = INGREDIENTS[id];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  ctx.strokeStyle = 'rgba(43,28,16,0.55)';
  if (id === 'rice') {
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r * 0.95, r * 0.5, 0, 0, Math.PI * 2); ctx.fillStyle = food.shade; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.8, r * 0.62, 0, Math.PI, Math.PI * 2); ctx.fillStyle = food.main; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = food.accent;
    for (const [dx, dy] of [[-0.35, -0.3], [0.1, -0.45], [0.4, -0.2], [-0.05, -0.15]]) {
      ctx.beginPath(); ctx.moveTo(r * dx, r * dy); ctx.lineTo(r * (dx + 0.18), r * (dy - 0.08)); ctx.stroke();
    }
  } else if (id === 'sambal' || id === 'curry') {
    ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.1); ctx.lineTo(r * 0.9, -r * 0.1); ctx.lineTo(r * 0.55, r * 0.6); ctx.lineTo(-r * 0.55, r * 0.6); ctx.closePath();
    ctx.fillStyle = '#3f6d8e'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -r * 0.12, r * 0.82, r * 0.3, 0, 0, Math.PI * 2); ctx.fillStyle = food.main; ctx.fill();
    ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.2, r * 0.16, 0, Math.PI * 2); ctx.fillStyle = food.accent; ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.16, r * 0.12, 0, Math.PI * 2); ctx.fillStyle = food.accent; ctx.fill();
    if (id === 'sambal') { ctx.beginPath(); ctx.moveTo(r * 0.05, -r * 0.3); ctx.quadraticCurveTo(r * 0.5, -r * 0.75, r * 0.72, -r * 0.55); ctx.strokeStyle = '#7fae3f'; ctx.lineWidth = r * 0.14; ctx.stroke(); }
  } else if (id === 'chicken') {
    ctx.beginPath(); ctx.ellipse(-r * 0.15, -r * 0.05, r * 0.68, r * 0.55, -0.5, 0, Math.PI * 2); ctx.fillStyle = food.main; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = food.shade; ctx.lineWidth = r * 0.1;
    for (const off of [-0.3, 0, 0.3]) { ctx.beginPath(); ctx.moveTo(r * (off - 0.35), -r * 0.32); ctx.lineTo(r * (off + 0.05), r * 0.05); ctx.stroke(); }
    ctx.strokeStyle = '#f3e9d2'; ctx.lineWidth = r * 0.16;
    ctx.beginPath(); ctx.moveTo(r * 0.3, r * 0.28); ctx.lineTo(r * 0.78, r * 0.72); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 0.82, r * 0.76, r * 0.16, 0, Math.PI * 2); ctx.fillStyle = '#f3e9d2'; ctx.fill();
  } else if (id === 'satay') {
    for (const shift of [-0.45, 0, 0.45]) {
      ctx.save(); ctx.translate(r * shift, 0); ctx.rotate(0.5);
      ctx.strokeStyle = '#d9b380'; ctx.lineWidth = r * 0.09;
      ctx.beginPath(); ctx.moveTo(0, -r * 0.95); ctx.lineTo(0, r * 0.95); ctx.stroke();
      ctx.fillStyle = food.main;
      for (const yy of [-0.5, -0.05, 0.4]) { roundRect(ctx, -r * 0.24, r * yy, r * 0.48, r * 0.36, r * 0.1); ctx.fill(); }
      ctx.fillStyle = food.accent;
      roundRect(ctx, -r * 0.24, -r * 0.05, r * 0.48, r * 0.12, r * 0.05); ctx.fill();
      ctx.restore();
    }
  } else if (id === 'noodles') {
    ctx.beginPath(); ctx.moveTo(-r * 0.95, -r * 0.05); ctx.lineTo(r * 0.95, -r * 0.05); ctx.lineTo(r * 0.6, r * 0.65); ctx.lineTo(-r * 0.6, r * 0.65); ctx.closePath();
    ctx.fillStyle = '#b03a2e'; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = food.main; ctx.lineWidth = r * 0.13;
    for (const yy of [-0.42, -0.24, -0.08]) { ctx.beginPath(); ctx.moveTo(-r * 0.6, r * yy); ctx.quadraticCurveTo(0, r * (yy - 0.22), r * 0.6, r * yy); ctx.stroke(); }
    ctx.strokeStyle = '#7a4a21'; ctx.lineWidth = r * 0.09;
    ctx.beginPath(); ctx.moveTo(r * 0.25, -r * 0.35); ctx.lineTo(r * 0.8, -r * 0.95); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r * 0.5, -r * 0.28); ctx.lineTo(r * 0.98, -r * 0.8); ctx.stroke();
  } else if (id === 'greens') {
    for (const [dx, dy, rot] of [[-0.4, 0.15, -0.6], [0, -0.15, 0], [0.42, 0.15, 0.6], [-0.15, 0.35, -0.2], [0.25, 0.38, 0.3]]) {
      ctx.save(); ctx.translate(r * dx, r * dy); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.42, r * 0.2, 0, 0, Math.PI * 2); ctx.fillStyle = food.main; ctx.fill();
      ctx.strokeStyle = food.accent; ctx.lineWidth = r * 0.06;
      ctx.beginPath(); ctx.moveTo(-r * 0.38, 0); ctx.lineTo(r * 0.38, 0); ctx.stroke();
      ctx.restore();
    }
  } else if (id === 'egg') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, r * 0.1);
    ctx.bezierCurveTo(-r * 0.85, -r * 0.55, -r * 0.2, -r * 0.75, r * 0.25, -r * 0.6);
    ctx.bezierCurveTo(r * 0.85, -r * 0.45, r * 0.9, r * 0.25, r * 0.5, r * 0.5);
    ctx.bezierCurveTo(r * 0.05, r * 0.8, -r * 0.65, r * 0.6, -r * 0.8, r * 0.1);
    ctx.closePath(); ctx.fillStyle = food.main; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 0.05, -r * 0.02, r * 0.36, 0, Math.PI * 2); ctx.fillStyle = food.accent; ctx.fill();
    ctx.beginPath(); ctx.arc(-r * 0.08, -r * 0.14, r * 0.12, 0, Math.PI * 2); ctx.fillStyle = '#ffd970'; ctx.fill();
  } else if (id === 'shallot') {
    ctx.fillStyle = food.main;
    for (const [dx, dy, rot] of [[-0.45, 0.2, 0.4], [-0.15, -0.1, -0.3], [0.2, 0.05, 0.7], [0.45, 0.3, -0.5], [0, 0.35, 0.1], [-0.3, -0.35, 0.9], [0.35, -0.3, -0.8]]) {
      ctx.save(); ctx.translate(r * dx, r * dy); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.3, r * 0.11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = food.accent;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Clickable geometry, shared with input.js.
// ---------------------------------------------------------------------------

export function tileRect(index) {
  const panel = LAYOUT.counter;
  const w = 128;
  const gap = 10;
  const total = COUNTER_ORDER.length * w + (COUNTER_ORDER.length - 1) * gap;
  const startX = panel.x + (panel.w - total) / 2;
  return { x: startX + index * (w + gap), y: panel.y + 44, w, h: 124 };
}

export function cookButtonRect(stationIndex, itemIndex) {
  const card = LAYOUT.stations[stationIndex];
  const w = (card.w - 24) / 2;
  return { x: card.x + 8 + itemIndex * (w + 8), y: card.y + card.h - 52, w, h: 42 };
}

export function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// ---------------------------------------------------------------------------
// The play scene.
// ---------------------------------------------------------------------------

function drawBackground(ctx, t) {
  ctx.fillStyle = '#f3e3c2';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Wall tiles above the counter line.
  ctx.fillStyle = '#eed9ae';
  for (let x = 0; x < VIEW.width; x += 64) {
    for (let y = 64; y < 452; y += 64) {
      if (((x + y) / 64) % 2 === 0) ctx.fillRect(x, y, 64, 64);
    }
  }
  // A shelf with jars and hanging pans, drawn behind the order board area.
  ctx.fillStyle = WOOD;
  ctx.fillRect(0, 452, VIEW.width, 8);
}

function drawHeader(ctx, world) {
  const h = LAYOUT.header;
  ctx.fillStyle = '#40260f';
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(0, h.h - 6, h.w, 6);
  text(ctx, 'SPICE TIDE KITCHEN', 20, 30, 24, '#ffd98a', 'left', '900');
  text(ctx, `DAY ${world.day}`, 330, 30, 20, '#ffffff', 'left', '800');
  // Shift clock: a draining bar with the time left written on it.
  const frac = Math.max(0, world.shiftLeft / 150);
  roundRect(ctx, 470, 14, 300, 32, 8); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
  roundRect(ctx, 472, 16, 296 * frac, 28, 6); ctx.fillStyle = frac < 0.18 ? '#e23b3b' : '#7fc24a'; ctx.fill();
  const mm = Math.floor(world.shiftLeft / 60);
  const ss = Math.floor(world.shiftLeft % 60).toString().padStart(2, '0');
  text(ctx, `SHIFT ${mm}:${ss}`, 620, 31, 17, '#ffffff', 'center', '900');
  coinIcon(ctx, 806, 30, 13);
  text(ctx, `${world.coins}`, 826, 31, 21, '#ffd98a', 'left', '900');
  text(ctx, `goal ${dayConfig(world.day).goal}`, 920, 31, 14, 'rgba(255,255,255,0.65)', 'left', '600');
  for (let i = 0; i < 3; i += 1) heart(ctx, 1052 + i * 34, 26, 13, i < world.hearts);
  if (world.combo >= 2) text(ctx, `COMBO ×${world.combo}`, 1170, 31, 18, '#ff9d3c', 'left', '900');
}

function drawTickets(ctx, world) {
  world.orders.forEach((order, i) => {
    const r = LAYOUT.tickets[i];
    const matches = world.plate.length > 0 && world.plateMatches(order.recipe);
    ctx.save();
    ctx.shadowColor = 'rgba(60,35,5,0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.restore();
    if (matches) {
      roundRect(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12);
      ctx.lineWidth = 4; ctx.strokeStyle = '#58b368'; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 10, 6, 0, Math.PI * 2); ctx.fillStyle = '#c0392b'; ctx.fill();
    text(ctx, order.recipe.name, r.x + 14, r.y + 30, 16, INK, 'left', '900');
    text(ctx, `${order.price} coins`, r.x + r.w - 14, r.y + 30, 13, '#8a6100', 'right', '800');
    order.recipe.items.forEach((itemId, j) => {
      drawFood(ctx, itemId, r.x + 34 + j * 46, r.y + 68, 17);
      text(ctx, INGREDIENTS[itemId].short, r.x + 34 + j * 46, r.y + 94, 10.5, '#6b543a', 'center', '700');
    });
    // Patience bar: full and green is a happy customer; short and red walks.
    const frac = Math.max(0, order.patience / order.maxPatience);
    roundRect(ctx, r.x + 14, r.y + r.h - 16, r.w - 28, 9, 4); ctx.fillStyle = '#e5d9bd'; ctx.fill();
    roundRect(ctx, r.x + 14, r.y + r.h - 16, (r.w - 28) * frac, 9, 4);
    ctx.fillStyle = frac < 0.3 ? '#e23b3b' : frac < 0.6 ? '#e8a13c' : '#58b368'; ctx.fill();
    if (matches) text(ctx, 'READY — CLICK TO SERVE!', r.x + r.w / 2, r.y + 50, 13, '#2f7a3d', 'center', '900');
  });
  if (world.orders.length === 0) {
    text(ctx, 'No orders — the next customer is on their way…', 428, 130, 18, '#6b543a', 'center', '700');
  }
}

function drawMenuPanel(ctx, world) {
  const r = LAYOUT.menuPanel;
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fillStyle = '#40260f'; ctx.fill();
  text(ctx, "TODAY'S MENU", r.x + 16, r.y + 20, 15, '#ffd98a', 'left', '900');
  const todays = RECIPES.filter((recipe) => recipe.unlockDay <= world.day);
  todays.forEach((recipe, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = r.x + 16 + col * 200;
    const y = r.y + 48 + row * 26;
    text(ctx, recipe.name, x, y, 12.5, '#ffffff', 'left', '700');
    text(ctx, `${recipe.price}`, x + 168, y, 12.5, '#ffd98a', 'right', '800');
  });
}

const PLATE_SLOTS = [[0, -18], [-52, 6], [52, 6], [-30, 40], [30, 40], [0, 58]];

function drawPlatePanel(ctx, world, t) {
  const p = LAYOUT.platePanel;
  roundRect(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fillStyle = '#fffaf0'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#d8c49a'; ctx.stroke();
  text(ctx, 'ASSEMBLY PLATE', p.x + 18, p.y + 22, 16, INK, 'left', '900');
  text(ctx, world.plate.length === 0 ? 'click ingredients below to build a dish' : `${world.plate.length} of 6 on the plate`, p.x + p.w - 18, p.y + 22, 13, '#6b543a', 'right', '600');
  // The plate itself, on its wooden board.
  roundRect(ctx, p.x + 28, p.y + 44, 300, 192, 14); ctx.fillStyle = WOOD; ctx.fill();
  roundRect(ctx, p.x + 32, p.y + 48, 292, 184, 12); ctx.fillStyle = WOOD_DARK; ctx.fill();
  const cx = p.x + 178;
  const cy = p.y + 140;
  ctx.beginPath(); ctx.arc(cx, cy, 86, 0, Math.PI * 2); ctx.fillStyle = '#fdfdf8'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#cfd4d8'; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 64, 0, Math.PI * 2); ctx.strokeStyle = '#e3e7ea'; ctx.stroke();
  if (world.plate.length === 0) {
    text(ctx, 'empty plate', cx, cy, 15, '#9aa0a3', 'center', '600');
  }
  world.plate.forEach((itemId, i) => {
    const [dx, dy] = PLATE_SLOTS[i % PLATE_SLOTS.length];
    drawFood(ctx, itemId, cx + dx, cy + dy, 26);
  });
  // The contents list, so a half-built dish can be checked at a glance.
  const listX = p.x + 344;
  if (world.plate.length === 0) {
    text(ctx, 'Recipes are on the', listX, p.y + 84, 13.5, '#6b543a', 'left', '600');
    text(ctx, 'tickets above. Cooked', listX, p.y + 104, 13.5, '#6b543a', 'left', '600');
    text(ctx, 'items come from the', listX, p.y + 124, 13.5, '#6b543a', 'left', '600');
    text(ctx, 'stations on the right.', listX, p.y + 144, 13.5, '#6b543a', 'left', '600');
  } else {
    world.plate.forEach((itemId, i) => {
      drawFood(ctx, itemId, listX + 10, p.y + 66 + i * 27, 10);
      text(ctx, INGREDIENTS[itemId].short, listX + 28, p.y + 67 + i * 27, 13.5, INK, 'left', '700');
    });
  }
  // Serve and clear.
  const serve = LAYOUT.serveButton;
  const ready = world.plate.length > 0;
  roundRect(ctx, serve.x, serve.y - 200 + 200, serve.w, serve.h, 12);
  ctx.fillStyle = ready ? '#58b368' : '#b9beb9'; ctx.fill();
  text(ctx, 'SERVE', serve.x + serve.w / 2, serve.y + 22, 22, '#ffffff', 'center', '900');
  text(ctx, 'Enter / Space', serve.x + serve.w / 2, serve.y + 44, 11.5, 'rgba(255,255,255,0.85)', 'center', '700');
  const clear = LAYOUT.clearButton;
  roundRect(ctx, clear.x, clear.y, clear.w, clear.h, 12);
  ctx.fillStyle = '#e8ddc4'; ctx.fill();
  text(ctx, 'Clear plate  ⌫', clear.x + clear.w / 2, clear.y + clear.h / 2, 15, INK, 'center', '800');
  // Rising coin floaters from the last serve.
  for (const floater of world.floaters) {
    const k = floater.t / floater.life;
    ctx.globalAlpha = 1 - k;
    text(ctx, floater.text, serve.x + serve.w / 2, serve.y - 14 - k * 56, 30, '#c9930a', 'center', '900');
    if (floater.sub) text(ctx, floater.sub, serve.x + serve.w / 2, serve.y + 16 - k * 56, 14, '#8a6100', 'center', '800');
    ctx.globalAlpha = 1;
  }
}

function drawStations(ctx, world, t) {
  const panel = LAYOUT.stationsPanel;
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 12);
  ctx.fillStyle = '#33241a'; ctx.fill();
  text(ctx, 'COOKING STATIONS — click a dish to start it, cooked food waits in the tray', panel.x + 18, panel.y + 22, 14.5, '#ffd98a', 'left', '900');
  Object.values(STATIONS).forEach((station, si) => {
    const card = LAYOUT.stations[si];
    roundRect(ctx, card.x, card.y, card.w, card.h, 10);
    ctx.fillStyle = '#4a3220'; ctx.fill();
    text(ctx, station.name, card.x + card.w / 2, card.y + 18, 15, '#ffffff', 'center', '900');
    // The appliance: flames for the grill, a wok arc, a fry pan.
    const cx = card.x + card.w / 2;
    const cy = card.y + 74;
    if (station.id === 'grill') {
      ctx.fillStyle = '#222'; roundRect(ctx, cx - 58, cy - 26, 116, 52, 8); ctx.fill();
      ctx.strokeStyle = '#666'; ctx.lineWidth = 4;
      for (let gx = -44; gx <= 44; gx += 22) { ctx.beginPath(); ctx.moveTo(cx + gx, cy - 22); ctx.lineTo(cx + gx, cy + 22); ctx.stroke(); }
      if (world.stations.grill.cooking) {
        for (let f = 0; f < 4; f += 1) {
          const fx = cx - 36 + f * 24;
          const fh = 14 + Math.sin(t * 11 + f * 1.7) * 5;
          ctx.beginPath(); ctx.moveTo(fx - 8, cy + 26); ctx.quadraticCurveTo(fx, cy + 26 - fh, fx + 8, cy + 26); ctx.closePath();
          ctx.fillStyle = f % 2 ? '#ff9d3c' : '#e2543e'; ctx.fill();
        }
      }
    } else if (station.id === 'wok') {
      ctx.beginPath(); ctx.arc(cx, cy - 6, 52, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 10; ctx.strokeStyle = '#222'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 78, cy - 22); ctx.lineTo(cx - 54, cy - 12); ctx.lineTo(cx + 54, cy - 12); ctx.lineTo(cx + 78, cy - 22); ctx.strokeStyle = '#222'; ctx.lineWidth = 7; ctx.stroke();
      if (world.stations.wok.cooking) {
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3;
        for (let s = 0; s < 3; s += 1) {
          const sx = cx - 24 + s * 24;
          const sy = cy - 34 - ((t * 26 + s * 13) % 22);
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + 6, sy - 8, sx, sy - 16); ctx.stroke();
        }
      }
    } else {
      ctx.beginPath(); ctx.ellipse(cx, cy, 58, 30, 0, 0, Math.PI * 2); ctx.fillStyle = '#222'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, cy - 4, 48, 22, 0, 0, Math.PI * 2); ctx.fillStyle = '#f0a13c'; ctx.fill();
      if (world.stations.fryer.cooking) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let b = 0; b < 6; b += 1) {
          const bx = cx - 36 + ((b * 29 + Math.floor(t * 3) * 7) % 72);
          const by = cy - 10 + ((b * 17) % 14);
          ctx.beginPath(); ctx.arc(bx, by, 3.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    const state = world.stations[station.id];
    if (state.cooking) {
      const frac = Math.min(1, state.elapsed / state.duration);
      drawFood(ctx, state.cooking, cx, cy - 4, 24);
      roundRect(ctx, card.x + 12, card.y + 116, card.w - 24, 12, 6); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
      roundRect(ctx, card.x + 12, card.y + 116, (card.w - 24) * frac, 12, 6); ctx.fillStyle = station.colour; ctx.fill();
      text(ctx, `${INGREDIENTS[state.cooking].short} ${(state.duration - state.elapsed).toFixed(0)}s`, card.x + card.w / 2, card.y + 106, 12.5, '#ffd98a', 'center', '800');
    } else {
      text(ctx, 'idle — pick a dish below', card.x + card.w / 2, card.y + 112, 12, 'rgba(255,255,255,0.55)', 'center', '600');
    }
    station.makes.forEach((itemId, ii) => {
      const btn = cookButtonRect(si, ii);
      const busy = state.cooking !== null;
      roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8);
      ctx.fillStyle = busy ? '#5d4a36' : station.colour; ctx.fill();
      drawFood(ctx, itemId, btn.x + 15, btn.y + btn.h / 2, 10);
      text(ctx, INGREDIENTS[itemId].short, btn.x + 29, btn.y + 15, 11.5, '#ffffff', 'left', '800');
      const stock = world.stock[itemId];
      text(ctx, `${COOK_SECONDS[itemId]}s  [${station.keys[ii]}]${stock > 0 ? `  ×${stock}` : ''}`, btn.x + 29, btn.y + 31, 10.5, stock > 0 ? '#ffd98a' : 'rgba(255,255,255,0.8)', 'left', '700');
    });
  });
}

function drawCounter(ctx, world) {
  const panel = LAYOUT.counter;
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 12);
  ctx.fillStyle = WOOD; ctx.fill();
  roundRect(ctx, panel.x + 4, panel.y + 4, panel.w - 8, 34, 8); ctx.fillStyle = WOOD_DARK; ctx.fill();
  text(ctx, 'THE COUNTER — pantry is endless; cooked dishes wait in the tray (badge = ready count)', panel.x + 18, panel.y + 21, 15, '#ffe9bd', 'left', '900');
  COUNTER_ORDER.forEach((itemId, i) => {
    const r = tileRect(i);
    const food = INGREDIENTS[itemId];
    const isPantry = food.from === 'pantry';
    const stock = world.stock[itemId];
    const dim = !isPantry && stock === 0;
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fillStyle = dim ? '#d9cbb2' : '#fff6e3';
    ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#6e4525'; ctx.stroke();
    ctx.globalAlpha = dim ? 0.45 : 1;
    drawFood(ctx, itemId, r.x + r.w / 2, r.y + 46, 30);
    ctx.globalAlpha = 1;
    text(ctx, food.short, r.x + r.w / 2, r.y + 86, 15, INK, 'center', '900');
    text(ctx, isPantry ? 'PANTRY' : `${STATIONS[food.from].short} · ${stock} ready`, r.x + r.w / 2, r.y + 106, 11, dim ? '#a33' : '#6b543a', 'center', '800');
    roundRect(ctx, r.x + 6, r.y + 6, 22, 22, 6); ctx.fillStyle = '#40260f'; ctx.fill();
    text(ctx, food.key, r.x + 17, r.y + 18, 13, '#ffd98a', 'center', '900');
  });
}

function drawFooter(ctx, world) {
  const f = LAYOUT.footer;
  ctx.fillStyle = '#40260f';
  ctx.fillRect(f.x, f.y, f.w, f.h);
  text(ctx, world.message, 20, f.y + 24, 17, '#ffe9bd', 'left', '800');
  text(ctx, 'Keys 1–9 add ingredient · Q/W grill · E/R wok · T/Y fryer · Enter serve · ⌫ clear · click a ticket to serve it', 20, f.y + 52, 13.5, 'rgba(255,255,255,0.6)', 'left', '600');
  text(ctx, `served ${world.served} · walked out ${world.lost}`, 1264, f.y + 24, 14, 'rgba(255,255,255,0.75)', 'right', '700');
}

// ---------------------------------------------------------------------------
// Title and end-of-day screens.
// ---------------------------------------------------------------------------

function drawChefHat(ctx, cx, cy, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.arc(-26, 6, 24, 0, Math.PI * 2);
  ctx.arc(0, -8, 30, 0, Math.PI * 2);
  ctx.arc(26, 6, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.fillRect(-46, 8, 92, 26);
  ctx.fillStyle = '#e2543e';
  ctx.fillRect(-46, 30, 92, 7);
  ctx.restore();
}

function drawTitle(ctx, world, t) {
  drawBackground(ctx, t);
  ctx.fillStyle = 'rgba(43,24,8,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  roundRect(ctx, 190, 56, 900, 608, 24);
  ctx.fillStyle = '#fff6e3'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = WOOD; ctx.stroke();
  drawChefHat(ctx, 640, 128, 1.1);
  text(ctx, 'SPICE TIDE KITCHEN', 640, 196, 54, '#40260f', 'center', '900');
  text(ctx, 'the harbour cooking rush — grill, wok and fry to order, plate it right, beat the clock', 640, 234, 17.5, '#6b543a', 'center', '700');
  // The recipe book, shown in full: this is the game you are about to play.
  const bookX = 250;
  text(ctx, 'THE RECIPE BOOK', bookX, 276, 16, '#c0392b', 'left', '900');
  RECIPES.forEach((recipe, i) => {
    const y = 308 + i * 40;
    text(ctx, recipe.name, bookX, y, 17, INK, 'left', '800');
    recipe.items.forEach((itemId, j) => drawFood(ctx, itemId, bookX + 268 + j * 40, y, 14));
    text(ctx, `${recipe.price} coins`, bookX + 500, y, 15, '#8a6100', 'left', '800');
    if (recipe.unlockDay > 1) text(ctx, `day ${recipe.unlockDay}+`, bookX + 590, y, 12.5, '#a33', 'left', '700');
  });
  text(ctx, 'HOW TO PLAY', bookX, 540, 16, '#c0392b', 'left', '900');
  text(ctx, 'Click a station dish to cook it, click counter ingredients to build the plate on the left,', bookX, 566, 15.5, '#4a3826', 'left', '600');
  text(ctx, 'then SERVE before the ticket patience runs out. Fast serves earn tips; three walk-outs end the day.', bookX, 590, 15.5, '#4a3826', 'left', '600');
  const pulse = 0.85 + Math.sin(t * 4) * 0.15;
  roundRect(ctx, 440, 632 - 22, 400, 0 + 44, 12);
  ctx.fillStyle = '#58b368'; ctx.globalAlpha = pulse; ctx.fill(); ctx.globalAlpha = 1;
  text(ctx, 'CLICK OR PRESS ENTER TO OPEN', 640, 632, 19, '#ffffff', 'center', '900');
}

function drawDayPanel(ctx, world, failed) {
  drawBackground(ctx, 0);
  ctx.fillStyle = 'rgba(43,24,8,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  roundRect(ctx, 340, 120, 600, 480, 24);
  ctx.fillStyle = '#fff6e3'; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = WOOD; ctx.stroke();
  if (failed) {
    text(ctx, 'THE KITCHEN IS', 640, 196, 40, '#c0392b', 'center', '900');
    text(ctx, 'OVERWHELMED', 640, 240, 40, '#c0392b', 'center', '900');
    text(ctx, `Three customers walked out on day ${world.day}.`, 640, 282, 17, '#6b543a', 'center', '700');
  } else {
    text(ctx, `DAY ${world.day} COMPLETE!`, 640, 190, 42, '#40260f', 'center', '900');
    const earned = world.stars();
    for (let i = 0; i < 3; i += 1) star(ctx, 576 + i * 64, 248, 30, i < earned);
    text(ctx, earned === 3 ? 'A perfect service — the harbour is talking about you!' : 'The shift bell rings. Time to count the till.', 640, 300, 16.5, '#6b543a', 'center', '700');
  }
  const rows = [
    ['Coins earned', `${world.coins}  (goal ${dayConfig(world.day).goal})`],
    ['Orders served', `${world.served}`],
    ['Customers lost', `${world.lost}`],
    ['Best combo', `×${world.bestCombo}`],
    ['All-time coins', `${world.totalCoins}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 348 + i * 38;
    text(ctx, label, 420, y, 18, '#6b543a', 'left', '700');
    text(ctx, value, 860, y, 18, INK, 'right', '900');
  });
  roundRect(ctx, 440, 548, 400, 44, 12);
  ctx.fillStyle = failed ? '#e2543e' : '#58b368'; ctx.fill();
  text(ctx, failed ? `RETRY DAY ${world.day} — ENTER` : `START DAY ${world.day + 1} — ENTER`, 640, 571, 18, '#ffffff', 'center', '900');
}

/** Draw the whole game for the world's current screen. `t` is wall-clock seconds, for animation only. */
export function drawFrame(ctx, world, t) {
  ctx.save();
  if (world.shake > 0) {
    const dx = Math.sin(t * 70) * 6 * world.shake;
    ctx.translate(dx, 0);
  }
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world, t);
  } else if (world.screen === SCREEN_DAY_END) {
    drawDayPanel(ctx, world, false);
  } else if (world.screen === SCREEN_DAY_FAILED) {
    drawDayPanel(ctx, world, true);
  } else {
    drawBackground(ctx, t);
    drawHeader(ctx, world);
    drawTickets(ctx, world);
    drawMenuPanel(ctx, world);
    drawPlatePanel(ctx, world, t);
    drawStations(ctx, world, t);
    drawCounter(ctx, world);
    drawFooter(ctx, world);
  }
  ctx.restore();
}

export { SCREEN_PLAY };
