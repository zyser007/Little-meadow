// Pointer input for the canvas. A quick press without drag = tap (routed to the active tool). A
// drag pans the camera; two fingers (or wheel) zoom. A still press > 500ms = long-press (inspect).
// Works for touch and mouse via Pointer Events.

import { Camera } from "./game/Camera";
import { pickTile } from "./game/iso";

export interface InputCallbacks {
  onTap: (col: number, row: number) => void;
  onLongPress: (col: number, row: number) => void;
}

interface Ptr {
  x: number;
  y: number;
}

const TAP_MOVE_THRESHOLD = 12; // px before a press becomes a drag
const LONG_PRESS_MS = 500;

export class InputManager {
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private cb: InputCallbacks;
  private pointers = new Map<number, Ptr>();
  private start: { x: number; y: number; t: number } | null = null;
  private dragging = false;
  private pinchDist = 0;
  private longPressTimer = 0;

  constructor(canvas: HTMLCanvasElement, camera: Camera, cb: InputCallbacks) {
    this.canvas = canvas;
    this.camera = camera;
    this.cb = cb;
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onUp);
    canvas.addEventListener("pointerleave", this.onUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
  }

  private rel(e: PointerEvent): Ptr {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private tileAt(p: Ptr): { col: number; row: number } {
    const w = this.camera.screenToWorld(p.x, p.y);
    return pickTile(w.x, w.y);
  }

  private clearLongPress(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = 0;
    }
  }

  private onDown = (e: PointerEvent): void => {
    this.canvas.setPointerCapture?.(e.pointerId);
    const p = this.rel(e);
    this.pointers.set(e.pointerId, p);

    if (this.pointers.size === 1) {
      this.start = { x: p.x, y: p.y, t: performance.now() };
      this.dragging = false;
      this.clearLongPress();
      this.longPressTimer = window.setTimeout(() => {
        if (!this.dragging && this.start) {
          this.dragging = true; // consume so pointerup won't also fire a tap
          const t = this.tileAt({ x: this.start.x, y: this.start.y });
          this.cb.onLongPress(t.col, t.row);
        }
      }, LONG_PRESS_MS);
    } else if (this.pointers.size === 2) {
      this.clearLongPress();
      this.dragging = true;
      this.pinchDist = this.currentPinchDist();
    }
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.pointers.has(e.pointerId)) return;
    const prev = this.pointers.get(e.pointerId)!;
    const p = this.rel(e);
    this.pointers.set(e.pointerId, p);

    if (this.pointers.size >= 2) {
      const d = this.currentPinchDist();
      if (this.pinchDist > 0) {
        const center = this.pinchCenter();
        this.camera.zoomAt(d / this.pinchDist, center.x, center.y);
      }
      this.pinchDist = d;
      return;
    }

    if (this.start) {
      const moved = Math.hypot(p.x - this.start.x, p.y - this.start.y);
      if (moved > TAP_MOVE_THRESHOLD) {
        this.dragging = true;
        this.clearLongPress();
      }
      if (this.dragging) {
        this.camera.panBy(p.x - prev.x, p.y - prev.y);
      }
    }
  };

  private onUp = (e: PointerEvent): void => {
    if (!this.pointers.has(e.pointerId)) return;
    const wasSingle = this.pointers.size === 1;
    this.pointers.delete(e.pointerId);
    this.clearLongPress();

    if (wasSingle && this.start && !this.dragging) {
      const t = this.tileAt({ x: this.start.x, y: this.start.y });
      this.cb.onTap(t.col, t.row);
    }
    if (this.pointers.size === 0) {
      this.start = null;
      this.dragging = false;
    }
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const r = this.canvas.getBoundingClientRect();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    this.camera.zoomAt(factor, e.clientX - r.left, e.clientY - r.top);
  };

  private currentPinchDist(): number {
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  private pinchCenter(): Ptr {
    const pts = [...this.pointers.values()];
    return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
  }
}
