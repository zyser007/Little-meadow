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
