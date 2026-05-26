// Canvas renderer. Draws terrain in isometric depth order, then tall entities (crops, buildings,
// player) sorted back-to-front, then a full-screen day/night tint. DPR-aware.

import { Camera } from "../game/Camera";
import { World } from "../game/World";
import { Player } from "../game/Player";
import { gridToScreen } from "../game/iso";
import { tintFor, skyColor } from "../game/time";
import type { AssetMap } from "./assets";
import { drawTerrainTile, drawCrop, drawBuilding, drawPlayer, drawTileHighlight, drawTree, drawRock, drawChest } from "./sprites";

export interface Highlight {
  col: number;
  row: number;
  color: string;
}

interface Entity {
  depth: number;
  draw: () => void;
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera: Camera;
  assets: AssetMap;
  dpr = 1;
  viewW = 0;
  viewH = 0;

  constructor(canvas: HTMLCanvasElement, camera: Camera, assets: AssetMap) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
    this.camera = camera;
    this.assets = assets;
    this.resize();
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.viewW = this.canvas.clientWidth || window.innerWidth;
    this.viewH = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.round(this.viewW * this.dpr);
    this.canvas.height = Math.round(this.viewH * this.dpr);
  }

  render(world: World, player: Player, timeMin: number, highlight: Highlight | null, time: number): void {
    const { ctx } = this;

    // sky backdrop
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = skyColor(timeMin);
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // world transform: DPR -> camera pan -> camera zoom
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.translate(this.camera.offsetX, this.camera.offsetY);
    ctx.scale(this.camera.zoom, this.camera.zoom);

    // terrain in isometric depth order (increasing col+row)
    const maxD = world.cols + world.rows - 2;
    for (let d = 0; d <= maxD; d++) {
      const cStart = Math.max(0, d - (world.rows - 1));
      const cEnd = Math.min(world.cols - 1, d);
      for (let c = cStart; c <= cEnd; c++) {
        const r = d - c;
        const tile = world.at(c, r);
        if (!tile) continue;
        const s = gridToScreen(c, r);
        drawTerrainTile(ctx, tile, s.x, s.y);
      }
    }

    if (highlight) {
      const s = gridToScreen(highlight.col, highlight.row);
      drawTileHighlight(ctx, s.x, s.y, highlight.color);
    }

    // tall entities, sorted back-to-front
    const entities: Entity[] = [];
    world.forEach((tile, c, r) => {
      const s = gridToScreen(c, r);
      if (tile.building) {
        entities.push({ depth: c + r, draw: () => drawBuilding(ctx, tile.building as string, s.x, s.y) });
      }
      if (tile.obj) {
        const obj = tile.obj;
        entities.push({
          depth: c + r,
          draw: () => {
            if (obj.kind === "tree") drawTree(ctx, s.x, s.y, obj.variant);
            else if (obj.kind === "rock") drawRock(ctx, s.x, s.y, obj.variant);
            else drawChest(ctx, s.x, s.y);
          },
        });
      }
      if (tile.crop) {
        const crop = tile.crop;
        entities.push({ depth: c + r + 0.1, draw: () => drawCrop(ctx, crop, s.x, s.y) });
      }
    });
    const ps = gridToScreen(player.fcol, player.frow);
    entities.push({
      depth: player.fcol + player.frow + 0.2,
      draw: () => drawPlayer(ctx, ps.x, ps.y, player.facing, player.moving, time),
    });
    entities.sort((a, b) => a.depth - b.depth);
    for (const e of entities) e.draw();

    // day/night tint (screen space)
    const tint = tintFor(timeMin);
    if (tint.a > 0) {
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.fillStyle = `rgba(${tint.r},${tint.g},${tint.b},${tint.a})`;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
  }
}
