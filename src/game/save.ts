// Local save/load to localStorage. Stores GameState fields plus the World grid and Player position.

import { game } from "./GameState";
import type { World, SerializedTile } from "./World";
import type { Player, Facing } from "./Player";
import type { ToolId } from "../data/tools";

const KEY = "little-meadow-save-v1";

interface SaveData {
  v: number;
  gold: number;
  inventory: Record<string, number>;
  day: number;
  timeMinutes: number;
  selectedTool: ToolId;
  selectedSeed: string | null;
  player: { col: number; row: number; facing: Facing };
  tiles: SerializedTile[];
}

export function saveGame(world: World, player: Player): void {
  const data: SaveData = {
    v: 1,
    gold: game.gold,
    inventory: game.inventory,
    day: game.day,
    timeMinutes: game.timeMinutes,
    selectedTool: game.selectedTool,
    selectedSeed: game.selectedSeed,
    player: { col: player.col, row: player.row, facing: player.facing },
    tiles: world.serialize(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage may be unavailable; ignore */
  }
}

export function loadGame(world: World, player: Player): boolean {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return false;
  }
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as SaveData;
    game.gold = data.gold ?? 150;
    game.inventory = data.inventory ?? {};
    game.day = data.day ?? 1;
    game.timeMinutes = data.timeMinutes ?? 6 * 60;
    game.selectedTool = data.selectedTool ?? "hand";
    game.selectedSeed = data.selectedSeed ?? null;
    if (data.tiles) world.restore(data.tiles);
    if (data.player) {
      player.col = data.player.col;
      player.row = data.player.row;
      player.fcol = data.player.col;
      player.frow = data.player.row;
      player.facing = data.player.facing ?? "down";
    }
    return true;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
