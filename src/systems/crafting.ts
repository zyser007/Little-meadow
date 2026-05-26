// Processing machines (furnace / cheese maker / jam pot). Load an input from the bag, it processes
// over a number of sleeps, then the output is collected back into the bag.

import { game } from "../game/GameState";
import type { World, WorldObject, ObjectKind } from "../game/World";
import { recipeFor } from "../data/recipes";
import { itemName } from "../data/items";
import type { Result } from "./farming";

const MACHINE_KINDS: ObjectKind[] = ["furnace", "cheese_maker", "jam_pot"];

export function isMachine(kind: ObjectKind): boolean {
  return MACHINE_KINDS.includes(kind);
}

export function machineState(obj: WorldObject): "idle" | "busy" | "done" {
  if (obj.output) return "done";
  if ((obj.daysLeft ?? 0) > 0) return "busy";
  return "idle";
}

export function loadMachine(obj: WorldObject, inputId: string): Result {
  if (obj.output) return { ok: false, msg: "Collect the finished item first." };
  if ((obj.daysLeft ?? 0) > 0) return { ok: false, msg: "Still processing." };
  const r = recipeFor(obj.kind, inputId);
  if (!r) return { ok: false, msg: "That can't be processed here." };
  if (game.count(inputId) <= 0) return { ok: false, msg: `No ${itemName(inputId)} in your bag.` };
  game.removeItem(inputId, 1);
  obj.input = inputId;
  obj.daysLeft = r.days;
  return { ok: true, msg: `Processing ${itemName(inputId)}...` };
}

export function collectMachine(obj: WorldObject): Result {
  if (!obj.output) return { ok: false, msg: "" };
  const name = itemName(obj.output);
  game.addItem(obj.output, 1);
  obj.output = null;
  return { ok: true, msg: `Collected ${name}.` };
}

// On sleep: advance every loaded machine; when a machine finishes, its output becomes collectable.
export function processMachines(world: World): void {
  world.forEach((t) => {
    const o = t.obj;
    if (!o || !o.input) return;
    if ((o.daysLeft ?? 0) > 0) {
      o.daysLeft = (o.daysLeft ?? 0) - 1;
      if (o.daysLeft <= 0) {
        const r = recipeFor(o.kind, o.input);
        o.output = r ? r.output : null;
        o.input = null;
        o.daysLeft = 0;
      }
    }
  });
}
