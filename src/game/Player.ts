// Player entity. Holds a logical target tile and a fractional position that lerps toward it so
// movement looks smooth. Facing is derived from the move direction (4-way) for the directional art.

export type Facing = "down" | "up" | "left" | "right";

const SPEED = 5.5; // tiles per second

export class Player {
  col: number;
  row: number;
  fcol: number;
  frow: number;
  facing: Facing = "down";
  moving = false;

  constructor(col = 4, row = 5) {
    this.col = col;
    this.row = row;
    this.fcol = col;
    this.frow = row;
  }

  setTarget(col: number, row: number): void {
    this.col = col;
    this.row = row;
    this.moving = true;
    const dc = col - this.fcol;
    const dr = row - this.frow;
    if (Math.abs(dc) > Math.abs(dr)) {
      this.facing = dc >= 0 ? "right" : "left";
    } else if (Math.abs(dr) > 0.0001) {
      this.facing = dr >= 0 ? "down" : "up";
    }
  }

  update(dt: number): void {
    if (!this.moving) return;
    const dc = this.col - this.fcol;
    const dr = this.row - this.frow;
    const dist = Math.hypot(dc, dr);
    const step = SPEED * dt;
    if (dist <= step || dist < 0.001) {
      this.fcol = this.col;
      this.frow = this.row;
      this.moving = false;
      return;
    }
    this.fcol += (dc / dist) * step;
    this.frow += (dr / dist) * step;
  }
}
