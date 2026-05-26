// Item registry: seeds + produce (derived from CROPS) plus gatherable resources.
// `kind` drives how the Bag groups things and whether the Shop will buy/sell them.

import { CROPS } from "./crops";

export type ItemKind = "seed" | "produce" | "resource";

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  sellPrice: number; // 0 = not sellable
  color: string; // placeholder swatch / sprite tint
}

const registry: Record<string, ItemDef> = {};

function register(def: ItemDef): void {
  registry[def.id] = def;
}

// Seeds + produce come straight from the crop table so the two never drift apart.
for (const c of CROPS) {
  register({ id: c.seedId, name: `${c.name} Seeds`, kind: "seed", sellPrice: Math.max(1, Math.floor(c.seedCost / 2)), color: c.color });
  register({ id: c.produceId, name: c.name, kind: "produce", sellPrice: c.sellPrice, color: c.color });
}

// Resources (used by gathering/crafting in later phases; defined now so the Bag/Shop handle them).
register({ id: "wood", name: "Wood", kind: "resource", sellPrice: 4, color: "#9c6b3f" });
register({ id: "stone", name: "Stone", kind: "resource", sellPrice: 5, color: "#9aa0a6" });
register({ id: "iron", name: "Iron Ore", kind: "resource", sellPrice: 12, color: "#b7c0c8" });
register({ id: "gold_ore", name: "Gold Ore", kind: "resource", sellPrice: 25, color: "#e8c24a" });
register({ id: "milk", name: "Milk", kind: "resource", sellPrice: 30, color: "#f4f0e6" });
register({ id: "egg", name: "Egg", kind: "resource", sellPrice: 14, color: "#f6e7b8" });
register({ id: "wool", name: "Wool", kind: "resource", sellPrice: 22, color: "#efe9df" });

// Crafted goods (furnace / cheese maker / jam pot) — higher value than their inputs.
register({ id: "iron_bar", name: "Iron Bar", kind: "resource", sellPrice: 35, color: "#c2cbd3" });
register({ id: "gold_bar", name: "Gold Bar", kind: "resource", sellPrice: 90, color: "#f0cf5a" });
register({ id: "cheese", name: "Cheese", kind: "resource", sellPrice: 85, color: "#f2c84a" });
register({ id: "jam", name: "Jam", kind: "resource", sellPrice: 95, color: "#c8344f" });

// Fish (caught with the rod at water).
register({ id: "anchovy", name: "Anchovy", kind: "resource", sellPrice: 18, color: "#8fb8c8" });
register({ id: "carp", name: "Carp", kind: "resource", sellPrice: 35, color: "#a7b86a" });
register({ id: "salmon", name: "Salmon", kind: "resource", sellPrice: 70, color: "#e8896a" });
register({ id: "seaweed", name: "Seaweed", kind: "resource", sellPrice: 4, color: "#5a8a5a" });

export const ITEMS: Record<string, ItemDef> = registry;

export function itemDef(id: string): ItemDef | undefined {
  return registry[id];
}

export function itemName(id: string): string {
  return registry[id]?.name ?? id;
}

export function itemColor(id: string): string {
  return registry[id]?.color ?? "#cccccc";
}
