// Isometric coordinate helpers. gridToScreen returns the CENTER of a tile's diamond in
// world pixels; screenToGrid inverts it. Picking rounds to the nearest tile (forgiving for
// touch). A grid step of +col moves screen (+TILE_W/2, +TILE_H/2); +row moves (-TILE_W/2, +TILE_H/2).

export const TILE_W = 96;
export const TILE_H = 48;

const HW = TILE_W / 2;
const HH = TILE_H / 2;

export interface Vec2 {
  x: number;
  y: number;
}

export function gridToScreen(col: number, row: number): Vec2 {
  return { x: (col - row) * HW, y: (col + row) * HH };
}

export function screenToGridF(x: number, y: number): { col: number; row: number } {
  const a = x / HW;
  const b = y / HH;
  return { col: (a + b) / 2, row: (b - a) / 2 };
}

export function pickTile(x: number, y: number): { col: number; row: number } {
  const f = screenToGridF(x, y);
  return { col: Math.round(f.col), row: Math.round(f.row) };
}

// Axis-aligned world-pixel bounds covering an entire cols x rows map (tile centers + half extents).
export function mapBounds(cols: number, rows: number): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [c, r] of [
    [0, 0],
    [cols - 1, 0],
    [0, rows - 1],
    [cols - 1, rows - 1],
  ]) {
    const s = gridToScreen(c, r);
    minX = Math.min(minX, s.x);
    maxX = Math.max(maxX, s.x);
    minY = Math.min(minY, s.y);
    maxY = Math.max(maxY, s.y);
  }
  // pad by a half tile so diamond corners are inside the bounds
  return { minX: minX - HW, minY: minY - HH, maxX: maxX + HW, maxY: maxY + HH };
}
