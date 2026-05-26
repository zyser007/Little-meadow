// Placeholder drawing — chunky cozy shapes tinted to the reference palette. Everything draws in
// world pixels; the renderer has already applied the camera transform. Each tile is a raised block
// (top diamond + short skirt) so the meadow reads as isometric. Swapped for real PNGs later.

import { TILE_W, TILE_H } from "../game/iso";
import type { Tile, Crop } from "../game/World";
import { CROP_BY_ID, matureStage } from "../data/crops";
import { buildingDef } from "../data/buildings";
import type { Facing } from "../game/Player";

const HW = TILE_W / 2;
const HH = TILE_H / 2;
const SKIRT = 7;

const TERRAIN_TOP: Record<string, string> = {
  grass: "#7cc36a",
  path: "#caa472",
  water: "#5fb4d6",
  sand: "#e3cf9a",
};

function diamondPath(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - HH);
  ctx.lineTo(cx + HW, cy);
  ctx.lineTo(cx, cy + HH);
  ctx.lineTo(cx - HW, cy);
  ctx.closePath();
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r + amt)));
  g = Math.max(0, Math.min(255, Math.round(g + amt)));
  b = Math.max(0, Math.min(255, Math.round(b + amt)));
  return `rgb(${r},${g},${b})`;
}

export function drawTerrainTile(ctx: CanvasRenderingContext2D, tile: Tile, cx: number, cy: number): void {
  let top = TERRAIN_TOP[tile.terrain] ?? "#7cc36a";
  if (tile.tilled && tile.terrain !== "water") {
    top = tile.crop && tile.crop.watered ? "#5e3720" : "#7a4a2b";
  }
  const side = shade(top.startsWith("#") ? top : "#5a8a4a", -40);

  // skirt (two front faces) for the raised-block look
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.moveTo(cx - HW, cy);
  ctx.lineTo(cx, cy + HH);
  ctx.lineTo(cx + HW, cy);
  ctx.lineTo(cx + HW, cy + SKIRT);
  ctx.lineTo(cx, cy + HH + SKIRT);
  ctx.lineTo(cx - HW, cy + SKIRT);
  ctx.closePath();
  ctx.fill();

  // top face
  ctx.fillStyle = top.startsWith("#") ? top : top;
  diamondPath(ctx, cx, cy);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.10)";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (tile.terrain === "grass" && !tile.tilled) {
    // a couple of tufts, deterministic from the tile variant
    const v = tile.variant;
    ctx.strokeStyle = shade("#7cc36a", -28);
    ctx.lineWidth = 2;
    const n = v % 3;
    for (let i = 0; i <= n; i++) {
      const ox = (((v >> (i * 3)) % 9) - 4) * 6;
      const oy = (((v >> (i * 2 + 1)) % 5) - 2) * 4;
      ctx.beginPath();
      ctx.moveTo(cx + ox, cy + oy + 2);
      ctx.lineTo(cx + ox - 2, cy + oy - 3);
      ctx.moveTo(cx + ox, cy + oy + 2);
      ctx.lineTo(cx + ox + 2, cy + oy - 3);
      ctx.stroke();
    }
    if (v % 7 === 0) {
      ctx.fillStyle = ["#f2a6c0", "#f6d65b", "#d7a0ec"][v % 3];
      ctx.beginPath();
      ctx.arc(cx + (v % 5) - 2, cy + (v % 3), 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (tile.terrain === "water") {
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 2);
    ctx.quadraticCurveTo(cx - 4, cy - 6, cx + 6, cy - 2);
    ctx.stroke();
  }

  if (tile.tilled && tile.terrain !== "water") {
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - HW * 0.55 + i * 10, cy + 4 + i * 4);
      ctx.lineTo(cx + HW * 0.55 + i * 10, cy - 4 + i * 4);
      ctx.stroke();
    }
  }
}

export function drawTileHighlight(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string): void {
  ctx.save();
  diamondPath(ctx, cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.6, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCrop(ctx: CanvasRenderingContext2D, crop: Crop, cx: number, cy: number): void {
  const def = CROP_BY_ID[crop.cropId];
  if (!def) return;
  const mature = crop.stage >= matureStage(def);
  const t = def.stages > 1 ? crop.stage / (def.stages - 1) : 1;
  const h = 6 + t * 22;
  const baseY = cy + 5;

  ctx.save();
  ctx.strokeStyle = "#3f8f33";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  const stems = mature ? 3 : crop.stage === 0 ? 1 : 2;
  for (let i = 0; i < stems; i++) {
    const off = (i - (stems - 1) / 2) * 6;
    ctx.beginPath();
    ctx.moveTo(cx + off * 0.3, baseY);
    ctx.quadraticCurveTo(cx + off, baseY - h * 0.6, cx + off, baseY - h);
    ctx.stroke();
    ctx.fillStyle = "#5bb148";
    leaf(ctx, cx + off, baseY - h, 5);
  }

  if (mature) {
    ctx.fillStyle = def.color;
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, baseY - h - 1, 9, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.arc(cx - 3, baseY - h - 4, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawBuilding(ctx: CanvasRenderingContext2D, id: string, cx: number, cy: number): void {
  const def = buildingDef(id);
  const wall = def?.wall ?? "#f3e4c7";
  const roof = def?.roof ?? "#3f6fb0";

  // ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + HH - 2, HW * 0.8, HH * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  const w = 56;
  const wallTop = cy - 34;
  const wallBot = cy + 8;

  // wall
  ctx.fillStyle = wall;
  ctx.strokeStyle = "#8a5a3b";
  ctx.lineWidth = 2.5;
  roundRect(ctx, cx - w / 2, wallTop, w, wallBot - wallTop, 4);
  ctx.fill();
  ctx.stroke();

  // roof
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 8, wallTop + 6);
  ctx.lineTo(cx, wallTop - 26);
  ctx.lineTo(cx + w / 2 + 8, wallTop + 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.stroke();

  // door
  ctx.fillStyle = "#7a4a2b";
  roundRect(ctx, cx - 9, wallBot - 20, 18, 20, 3);
  ctx.fill();

  if (id === "shop") {
    // striped awning
    const ax = cx - w / 2;
    const aw = w;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#e25b4a" : "#fbeede";
      ctx.fillRect(ax + (aw / 6) * i, wallTop + 6, aw / 6, 8);
    }
    // sign
    ctx.fillStyle = "#caa05a";
    roundRect(ctx, cx - 12, wallTop + 16, 24, 10, 2);
    ctx.fill();
  } else {
    // window
    ctx.fillStyle = "#bfe3f2";
    roundRect(ctx, cx + 6, wallTop + 10, 12, 12, 2);
    ctx.fill();
    ctx.strokeStyle = "#8a5a3b";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  facing: Facing,
  moving: boolean,
  time: number,
): void {
  const bob = moving ? Math.sin(time * 12) * 1.6 : 0;
  const baseY = cy + 4 + bob;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // body (overalls)
  ctx.fillStyle = "#4f72b0";
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, cx - 8, baseY - 20, 16, 20, 5);
  ctx.fill();
  ctx.stroke();

  // head
  ctx.fillStyle = "#f1c89b";
  ctx.beginPath();
  ctx.arc(cx, baseY - 26, 8, 0, Math.PI * 2);
  ctx.fill();

  // straw hat
  ctx.fillStyle = "#e3b85e";
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 30, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 33, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // facing indicator (simple eyes / direction)
  ctx.fillStyle = "#3a2a1c";
  if (facing === "down") {
    ctx.beginPath();
    ctx.arc(cx - 3, baseY - 25, 1.5, 0, Math.PI * 2);
    ctx.arc(cx + 3, baseY - 25, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (facing === "left") {
    ctx.beginPath();
    ctx.arc(cx - 4, baseY - 25, 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (facing === "right") {
    ctx.beginPath();
    ctx.arc(cx + 4, baseY - 25, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawTree(ctx: CanvasRenderingContext2D, cx: number, cy: number, variant: number): void {
  const cherry = variant % 4 === 0;
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + HH - 2, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // trunk
  ctx.fillStyle = "#8a5a3b";
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, cx - 5, cy - 12, 10, 22, 3);
  ctx.fill();
  ctx.stroke();
  // canopy
  const leaf1 = cherry ? "#f4a9c4" : "#5aa64a";
  const leaf2 = cherry ? "#f7c1d6" : "#76c265";
  ctx.fillStyle = leaf1;
  blob(ctx, cx - 11, cy - 22, 14);
  blob(ctx, cx + 11, cy - 22, 14);
  blob(ctx, cx, cy - 34, 17);
  ctx.fillStyle = leaf2;
  blob(ctx, cx - 4, cy - 30, 11);
  blob(ctx, cx + 6, cy - 26, 9);
}

export function drawRock(ctx: CanvasRenderingContext2D, cx: number, cy: number, variant: number): void {
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + HH - 4, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 1.5;
  ctx.fillStyle = "#9aa0a6";
  blob(ctx, cx - 6, cy - 2, 11);
  blob(ctx, cx + 7, cy + 1, 9);
  ctx.fillStyle = "#b6bcc2";
  blob(ctx, cx, cy - 9, 10);
  // a couple of facets
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  blob(ctx, cx - 2, cy - 11, 4);
  if (variant % 3 === 0) {
    ctx.fillStyle = "#cdb37a";
    blob(ctx, cx + 5, cy - 2, 2.5);
  }
}

export function drawChest(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + HH - 4, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  ctx.fillStyle = "#9c6b3f";
  ctx.strokeStyle = "#5e3a23";
  ctx.lineWidth = 2;
  roundRect(ctx, cx - 16, cy - 12, 32, 22, 3);
  ctx.fill();
  ctx.stroke();
  // lid
  ctx.fillStyle = "#b5824f";
  roundRect(ctx, cx - 16, cy - 18, 32, 10, 4);
  ctx.fill();
  ctx.stroke();
  // metal bands + lock
  ctx.fillStyle = "#e8c24a";
  ctx.fillRect(cx - 3, cy - 18, 6, 28);
  ctx.strokeRect(cx - 3, cy - 18, 6, 28);
  ctx.fillStyle = "#f6e7b8";
  roundRect(ctx, cx - 3, cy - 9, 6, 6, 1);
  ctx.fill();
}

export function drawFurniture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: string,
  processing: boolean,
  done: boolean,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(x, y + HH - 4, 15, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 2;

  if (kind === "furnace") {
    ctx.fillStyle = "#6f7882";
    ctx.fillRect(x + 4, y - 30, 7, 10);
    ctx.strokeRect(x + 4, y - 30, 7, 10);
    ctx.fillStyle = "#8a93a0";
    roundRect(ctx, x - 14, y - 22, 28, 30, 4);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 12);
    ctx.lineTo(x + 14, y - 12);
    ctx.moveTo(x - 14, y - 2);
    ctx.lineTo(x + 14, y - 2);
    ctx.stroke();
    ctx.fillStyle = processing ? "#ff9b3d" : "#3a2a22";
    roundRect(ctx, x - 7, y - 6, 14, 10, 3);
    ctx.fill();
    if (processing) {
      ctx.fillStyle = "#ffd86b";
      roundRect(ctx, x - 4, y - 3, 8, 5, 2);
      ctx.fill();
    }
  } else if (kind === "cheese_maker") {
    ctx.fillStyle = "#b5824f";
    roundRect(ctx, x - 12, y - 18, 24, 26, 5);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#7a4a2b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 10);
    ctx.lineTo(x + 12, y - 10);
    ctx.moveTo(x - 12, y + 2);
    ctx.lineTo(x + 12, y + 2);
    ctx.stroke();
    ctx.fillStyle = "#cdb48a";
    ctx.beginPath();
    ctx.ellipse(x, y - 18, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#5e3a23";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 12, y - 8, 4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "jam_pot") {
    ctx.fillStyle = "#5e4636";
    ctx.beginPath();
    ctx.ellipse(x, y - 4, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#c8344f";
    ctx.beginPath();
    ctx.ellipse(x, y - 10, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (processing) {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      blob(ctx, x - 3, y - 11, 2);
      blob(ctx, x + 4, y - 12, 1.6);
    }
    ctx.strokeStyle = "#3a2a22";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y - 10, 12, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "lamp") {
    ctx.fillStyle = "#6f5a3a";
    ctx.fillRect(x - 2, y - 20, 4, 28);
    ctx.strokeRect(x - 2, y - 20, 4, 28);
    ctx.fillStyle = "rgba(246,214,91,0.4)";
    blob(ctx, x, y - 24, 10);
    ctx.fillStyle = "#f6d65b";
    blob(ctx, x, y - 24, 6);
  } else if (kind === "flower_pot") {
    ctx.fillStyle = "#c97b4a";
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 2);
    ctx.lineTo(x + 8, y - 2);
    ctx.lineTo(x + 6, y + 8);
    ctx.lineTo(x - 6, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#5bb148";
    blob(ctx, x, y - 6, 4);
    ctx.fillStyle = "#f2a6c0";
    blob(ctx, x - 4, y - 9, 3);
    blob(ctx, x + 4, y - 9, 3);
    blob(ctx, x, y - 12, 3);
  }

  if (processing && kind === "cheese_maker") {
    ctx.fillStyle = "rgba(180,180,180,0.5)";
    blob(ctx, x, y - 26, 3);
    blob(ctx, x + 4, y - 30, 2.5);
  }

  if (done) {
    ctx.fillStyle = "#fff7d6";
    ctx.strokeStyle = "#caa05a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - 30, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#5fae4e";
    ctx.beginPath();
    ctx.arc(x, y - 30, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawAnimal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  id: string,
  color: string,
  hasProduce: boolean,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (id === "chicken" || id === "duck") {
    ctx.strokeStyle = "#e0962f";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 2, y + 2);
    ctx.lineTo(x - 2, y + 5);
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + 2, y + 5);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(x, y - 3, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 6, y - 9, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e8923b";
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 9);
    ctx.lineTo(x + 14, y - 8);
    ctx.lineTo(x + 10, y - 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3a2a1c";
    ctx.beginPath();
    ctx.arc(x + 7, y - 10, 1, 0, Math.PI * 2);
    ctx.fill();
    if (id === "chicken") {
      ctx.fillStyle = "#d8463a";
      ctx.beginPath();
      ctx.arc(x + 5, y - 13, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = "#6e4a32";
    ctx.lineWidth = 2;
    for (const lx of [-7, -3, 3, 7]) {
      ctx.beginPath();
      ctx.moveTo(x + lx, y);
      ctx.lineTo(x + lx, y + 5);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    if (id === "sheep") {
      for (const [bx, by, br] of [
        [-7, -6, 7],
        [0, -9, 8],
        [7, -6, 7],
        [0, -3, 8],
      ]) {
        ctx.beginPath();
        ctx.arc(x + bx, y + by, br, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.ellipse(x, y - 6, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = id === "sheep" ? "#4a3a30" : color;
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.arc(x + 12, y - 9, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (id === "cow") {
      ctx.fillStyle = "#7a5236";
      ctx.beginPath();
      ctx.arc(x - 3, y - 7, 3, 0, Math.PI * 2);
      ctx.arc(x + 4, y - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#3a2a1c";
    ctx.beginPath();
    ctx.arc(x + 13, y - 10, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  if (hasProduce) {
    ctx.fillStyle = "#fff7d6";
    ctx.strokeStyle = "#caa05a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y - 20, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e8943b";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", x, y - 19);
    ctx.textAlign = "left";
  }
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
