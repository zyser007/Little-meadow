// Fishing: cast at a water tile with the rod to catch a weighted-random fish (or seaweed).

import { game } from "../game/GameState";
import type { World } from "../game/World";
import { itemName } from "../data/items";
import type { Result } from "./farming";

interface Catch {
  id: string;
  weight: number;
}

const TABLE: Catch[] = [
  { id: "anchovy", weight: 34 },
  { id: "carp", weight: 34 },
  { id: "salmon", weight: 14 },
  { id: "seaweed", weight: 18 },
];

export function tryFish(world: World, col: number, row: number): Result {
  const t = world.at(col, row);
  if (!t || t.terrain !== "water") return { ok: false, msg: "" };
  const total = TABLE.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  let pick = TABLE[0];
  for (const c of TABLE) {
    if (r < c.weight) {
      pick = c;
      break;
    }
    r -= c.weight;
  }
  game.addItem(pick.id, 1);
  return { ok: true, msg: `You caught ${itemName(pick.id)}!` };
}
