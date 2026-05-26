// Resource gathering: chop trees for wood (axe), break rocks for stone + a chance of ore (pickaxe).
// Nodes have a few hit points so harvesting feels chunky; depleted nodes are removed.

import { game } from "../game/GameState";
import type { World } from "../game/World";
import type { Result } from "./farming";

export function tryChop(world: World, col: number, row: number): Result {
  const t = world.at(col, row);
  if (!t || !t.obj || t.obj.kind !== "tree") return { ok: false, msg: "" };
  t.obj.hp -= 1;
  game.addItem("wood", 1);
  if (t.obj.hp <= 0) {
    game.addItem("wood", 1); // felling bonus
    t.obj = null;
    return { ok: true, msg: "Chopped down the tree! (+2 wood)" };
  }
  return { ok: true, msg: "Chop! (+1 wood)" };
}

export function tryMine(world: World, col: number, row: number): Result {
  const t = world.at(col, row);
  if (!t || !t.obj || t.obj.kind !== "rock") return { ok: false, msg: "" };
  t.obj.hp -= 1;
  game.addItem("stone", 1);
  if (t.obj.hp <= 0) {
    let bonus = "";
    const roll = Math.random();
    if (roll < 0.12) {
      game.addItem("gold_ore", 1);
      bonus = " + gold ore!";
    } else if (roll < 0.42) {
      game.addItem("iron", 1);
      bonus = " + iron ore!";
    }
    t.obj = null;
    return { ok: true, msg: `Smashed the rock! (+1 stone${bonus})` };
  }
  return { ok: true, msg: "Mine! (+1 stone)" };
}
