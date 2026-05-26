// Crafting recipes for the processing machines. A machine takes one input item and yields one
// output after `days` sleeps. Multiple inputs can map to the same output (e.g. any fruit -> jam).

import type { ObjectKind } from "../game/World";

export interface Recipe {
  machine: ObjectKind;
  input: string;
  output: string;
  days: number;
}

export const RECIPES: Recipe[] = [
  { machine: "furnace", input: "iron", output: "iron_bar", days: 1 },
  { machine: "furnace", input: "gold_ore", output: "gold_bar", days: 1 },
  { machine: "cheese_maker", input: "milk", output: "cheese", days: 1 },
  { machine: "jam_pot", input: "strawberry", output: "jam", days: 1 },
  { machine: "jam_pot", input: "tomato", output: "jam", days: 1 },
  { machine: "jam_pot", input: "pumpkin", output: "jam", days: 1 },
];

export function recipesForMachine(machine: ObjectKind): Recipe[] {
  return RECIPES.filter((r) => r.machine === machine);
}

export function recipeFor(machine: ObjectKind, input: string): Recipe | undefined {
  return RECIPES.find((r) => r.machine === machine && r.input === input);
}
