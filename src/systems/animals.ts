// Animal husbandry: feed an animal, collect its produce, and resolve overnight production on sleep.

import { game } from "../game/GameState";
import { ANIMAL_BY_ID, type Animal } from "../data/animals";
import { itemName } from "../data/items";
import type { Result } from "./farming";

export function feedAnimal(a: Animal): Result {
  if (a.fed) return { ok: false, msg: "Already fed today." };
  a.fed = true;
  const def = ANIMAL_BY_ID[a.defId];
  return { ok: true, msg: `Fed the ${def ? def.name.toLowerCase() : "animal"}.` };
}

export function collectAnimal(a: Animal): Result {
  if (!a.hasProduce) return { ok: false, msg: "Nothing to collect yet." };
  const def = ANIMAL_BY_ID[a.defId];
  if (!def) return { ok: false, msg: "" };
  game.addItem(def.produceId, 1);
  a.hasProduce = false;
  return { ok: true, msg: `Collected ${itemName(def.produceId)}.` };
}

// On sleep: every fed animal yields produce for the morning; feeding must be repeated each day.
export function produceOvernight(): void {
  for (const a of game.animals) {
    if (a.fed) {
      a.hasProduce = true;
      a.fed = false;
    }
  }
}
