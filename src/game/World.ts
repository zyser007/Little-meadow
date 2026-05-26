// The tile grid. Each tile has a base terrain, an optional tilled flag, an optional crop, and an
// optional building. Buildings occupy their single tile (drawn taller). The default map is a small
// meadow with a pond, a path, and pre-placed home + shop.

export type Terrain = "grass" | "path" | "water" | "sand";

export interface Crop {
  cropId: string;
  stage: number;
  watered: boolean;
}

export type ObjectKind = "tree" | "rock" | "chest";

export interface WorldObject {
  kind: ObjectKind;
  hp: number; // remaining hits for resource nodes (ignored by chest)
  variant: number; // cosmetic seed (e.g. tree colour)
}

export interface Tile {
  terrain: Terrain;
  tilled: boolean;
  crop: Crop | null;
  building: string | null; // building def id
  obj: WorldObject | null; // tree / rock / chest occupying the tile
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
    if (t.building || t.obj) return false;
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
          obj: null,
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
    this.setBuilding(4, 1, "coop");
    this.setBuilding(6, 1, "barn");
    this.setBuilding(9, 1, "shop");

    // A storage chest beside the home.
    this.setObject(2, 1, "chest", 0, 0);

    // Scatter trees and rocks on clear grass, away from the starter field.
    const trees: Array<[number, number]> = [
      [0, 3], [3, 0], [5, 0], [7, 0], [10, 3], [11, 5], [0, 6], [10, 9], [2, 11], [9, 11], [11, 8],
    ];
    trees.forEach(([c, r], i) => this.placeObjectIfClear(c, r, "tree", 3, i));
    const rocks: Array<[number, number]> = [
      [0, 8], [3, 11], [8, 0], [11, 10], [0, 11],
    ];
    rocks.forEach(([c, r], i) => this.placeObjectIfClear(c, r, "rock", 3, i));
  }

  private inStarterField(col: number, row: number): boolean {
    return col >= 4 && col <= 8 && row >= 5 && row <= 8;
  }

  private placeObjectIfClear(col: number, row: number, kind: ObjectKind, hp: number, variant: number): void {
    const t = this.at(col, row);
    if (!t) return;
    if (t.terrain !== "grass" || t.building || t.obj || t.tilled) return;
    if (this.inStarterField(col, row)) return;
    if (col === 4 && row === 5) return; // keep the player's spawn clear
    t.obj = { kind, hp, variant };
  }

  setObject(col: number, row: number, kind: ObjectKind, hp: number, variant: number): void {
    const t = this.at(col, row);
    if (!t) return;
    t.obj = { kind, hp, variant };
    t.crop = null;
    t.tilled = false;
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
      o: t.obj ? [t.obj.kind, t.obj.hp, t.obj.variant] : null,
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
        obj: s.o ? { kind: s.o[0], hp: s.o[1], variant: s.o[2] } : null,
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
  o: [ObjectKind, number, number] | null;
  v: number;
}
