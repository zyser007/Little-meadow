// Farming actions operate on the World + the GameState bag. Each returns a small Result so the
// controller can surface feedback via a toast. Growth is resolved on sleep (growCrops).

import { game } from "../game/GameState";
import type { World } from "../game/World";
import { CROP_BY_ID, CROP_BY_SEED, matureStage } from "../data/crops";
import { itemName } from "../data/items";

export interface Result {
  ok: boolean;
  msg: string;
}

export function tryTill(world: World, col: number, row: number): Result {
  const t = world.at(col, row);
  if (!t) return { ok: false, msg: "" };
  if (t.building) return { ok: false, msg: "" };
  if (t.terrain !== "grass") return { ok: false, msg: "Can only till grass." };
  if (t.tilled) return { ok: false, msg: "Already tilled." };
  if (t.crop) return { ok: false, msg: "" };
  t.tilled = true;
  return { ok: true, msg: "Tilled the soil." };
}

export function tryPlant(world: World, col: number, row: number): Result {
  const t = world.at(col, row);
  if (!t || t.building) return { ok: false, msg: "" };
  if (!t.tilled) return { ok: false, msg: "Till the soil first (Hoe)." };
  if (t.crop) return { ok: false, msg: "Something is already growing here." };
  const seedId = game.selectedSeed;
  if (!seedId) return { ok: false, msg: "Select a seed first." };
  const def = CROP_BY_SEED[seedId];
  if (!def) return { ok: false, msg: "That isn't a seed." };
  if (game.count(seedId) <= 0) return { ok: false, msg: `No ${itemName(seedId)} left.` };
  game.removeItem(seedId, 1);
  t.crop = { cropId: def.id, stage: 0, watered: false };
  return { ok: true, msg: `Planted ${def.name}.` };
}

export function tryWater(world: World, col: number, row: number): Result {
  const t = world.at(col, row);
  if (!t || t.building) return { ok: false, msg: "" };
  if (t.crop) {
    if (t.crop.watered) return { ok: false, msg: "Already watered." };
    t.crop.watered = true;
    return { ok: true, msg: "Watered the crop." };
  }
  if (t.tilled) return { ok: true, msg: "Watered the soil." };
  return { ok: false, msg: "Nothing to water here." };
}

export function tryHarvest(world: World, col: number, row: number): Result {
  const t = world.at(col, row);
  if (!t || !t.crop) return { ok: false, msg: "" };
  const def = CROP_BY_ID[t.crop.cropId];
  if (!def) return { ok: false, msg: "" };
  if (t.crop.stage < matureStage(def)) {
    const label = stageLabel(t.crop.stage, def.stages);
    return { ok: false, msg: `${def.name}: ${label}.` };
  }
  game.addItem(def.produceId, 1);
  t.crop = null; // stays tilled, ready to replant
  return { ok: true, msg: `Harvested ${def.name}! (+1 to bag)` };
}

// Advance every watered crop one stage and clear the watered flag (called on sleep).
export function growCrops(world: World): void {
  world.forEach((t) => {
    if (!t.crop) return;
    const def = CROP_BY_ID[t.crop.cropId];
    if (!def) return;
    if (t.crop.watered && t.crop.stage < matureStage(def)) {
      t.crop.stage += 1;
    }
    t.crop.watered = false;
  });
}

export function stageLabel(stage: number, stages: number): string {
  if (stage >= stages - 1) return "Ready to harvest";
  const labels = ["Seed", "Sprout", "Young", "Growing", "Almost ready"];
  return labels[Math.min(stage, labels.length - 1)];
}
