// The tile grid. Each tile has a base terrain, an optional tilled flag, an optional crop, and an
// optional building. Buildings occupy their single tile (drawn taller). The default map is a small
// meadow with a pond, a path, and pre-placed home + shop.

export type Terrain = "grass" | "path" | "water" | "sand";

export interface Crop {
  cropId: string;
  stage: number;
  watered: boolean;
}

export interface Tile {
  terrain: Terrain;
  tilled: boolean;
  crop: Crop | null;
  building: string | null; // building def id
  variant: number; // small per-tile cosmetic seed (grass tufts etc.)
}

export const MAP_COLS = 12;
export const MAP_ROWS = 12;

export class World {
  cols: number;
  rows: number;
  tiles: Tile[];

  constructor(cols = MAP_COLS, rows = MAP_ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.tiles = new Array(cols * rows);
    this.generate();
  }

  private idx(col: number, row: number): number {
    return row * this.cols + col;
  }

  inBounds(col: number, row: number): boolean {
    return col >= 0 && row >= 0 && col < this.cols && row < this.rows;
  }

  at(col: number, row: number): Tile | null {
    if (!this.inBounds(col, row)) return null;
    return this.tiles[this.idx(col, row)];
  }

  isWalkable(col: number, row: number): boolean {
    const t = this.at(col, row);
    if (!t) return false;
    if (t.building) return false;
    return t.terrain !== "water";
  }

  generate(): void {
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.tiles[this.idx(c, r)] = {
          terrain: "grass",
          tilled: false,
          crop: null,
          building: null,
          variant: Math.floor(rnd() * 1000),
        };
      }
    }

    // Pond in the bottom-left, ringed with sand.
    const pond: Array<[number, number]> = [
      [1, 9], [2, 9], [1, 10], [2, 10],
    ];
    for (const [c, r] of pond) this.setTerrain(c, r, "water");
    for (let r = 8; r <= 11; r++) {
      for (let c = 0; c <= 3; c++) {
        const t = this.at(c, r);
        if (t && t.terrain === "grass" && this.nextToWater(c, r)) t.terrain = "sand";
      }
    }

    // A path running between the home (top-left) and the shop (top-right).
    for (let c = 2; c <= 9; c++) this.setTerrain(c, 2, "path");
    for (let r = 2; r <= 4; r++) this.setTerrain(2, r, "path");

    // Pre-placed buildings.
    this.setBuilding(1, 1, "house");
    this.setBuilding(9, 1, "shop");
  }

  private nextToWater(col: number, row: number): boolean {
    return (
      this.at(col + 1, row)?.terrain === "water" ||
      this.at(col - 1, row)?.terrain === "water" ||
      this.at(col, row + 1)?.terrain === "water" ||
      this.at(col, row - 1)?.terrain === "water"
    );
  }

  private setTerrain(col: number, row: number, terrain: Terrain): void {
    const t = this.at(col, row);
    if (t) t.terrain = terrain;
  }

  setBuilding(col: number, row: number, id: string): void {
    const t = this.at(col, row);
    if (t) {
      t.building = id;
      t.crop = null;
      t.tilled = false;
    }
  }

  forEach(cb: (tile: Tile, col: number, row: number) => void): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        cb(this.tiles[this.idx(c, r)], c, r);
      }
    }
  }

  serialize(): SerializedTile[] {
    return this.tiles.map((t) => ({
      t: t.terrain,
      d: t.tilled ? 1 : 0,
      c: t.crop ? [t.crop.cropId, t.crop.stage, t.crop.watered ? 1 : 0] : null,
      b: t.building,
      v: t.variant,
    }));
  }

  restore(data: SerializedTile[]): void {
    if (!Array.isArray(data) || data.length !== this.tiles.length) return;
    for (let i = 0; i < data.length; i++) {
      const s = data[i];
      this.tiles[i] = {
        terrain: s.t,
        tilled: s.d === 1,
        crop: s.c ? { cropId: s.c[0], stage: s.c[1], watered: s.c[2] === 1 } : null,
        building: s.b,
        variant: s.v,
      };
    }
  }
}

export interface SerializedTile {
  t: Terrain;
  d: number;
  c: [string, number, number] | null;
  b: string | null;
  v: number;
}
