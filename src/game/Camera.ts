// 2D camera: world<->screen in CSS pixels. Supports fit-to-screen, drag-pan and pinch/wheel
// zoom (clamped). The renderer applies (translate(offset) then scale(zoom)) on top of a DPR scale.

import { mapBounds } from "./iso";

export class Camera {
  offsetX = 0;
  offsetY = 0;
  zoom = 1;
  minZoom = 0.3;
  maxZoom = 2.4;

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return { x: wx * this.zoom + this.offsetX, y: wy * this.zoom + this.offsetY };
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return { x: (sx - this.offsetX) / this.zoom, y: (sy - this.offsetY) / this.zoom };
  }

  // Center the whole map in the view, leaving headroom for the top/bottom UI bars.
  fitToMap(cols: number, rows: number, viewW: number, viewH: number): void {
    const b = mapBounds(cols, rows);
    const worldW = b.maxX - b.minX;
    const worldH = b.maxY - b.minY;
    const padTop = 70;
    const padBottom = 86;
    const availW = viewW * 0.96;
    const availH = Math.max(80, viewH - padTop - padBottom);
    const z = Math.min(availW / worldW, availH / worldH);
    this.zoom = clamp(z, this.minZoom, this.maxZoom);
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    this.offsetX = viewW / 2 - cx * this.zoom;
    this.offsetY = padTop + availH / 2 - cy * this.zoom;
  }

  panBy(dx: number, dy: number): void {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  // Zoom keeping the world point under (sx,sy) fixed on screen.
  zoomAt(factor: number, sx: number, sy: number): void {
    const before = this.screenToWorld(sx, sy);
    this.zoom = clamp(this.zoom * factor, this.minZoom, this.maxZoom);
    const after = this.screenToWorld(sx, sy);
    this.offsetX += (after.x - before.x) * this.zoom;
    this.offsetY += (after.y - before.y) * this.zoom;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
