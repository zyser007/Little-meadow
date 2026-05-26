// Placeable furniture sold in the Shop's Build section. Machines are functional (see recipes.ts);
// lamp and flower pot are cosmetic. All are placed on a clear grass tile after purchase.

import type { ObjectKind } from "../game/World";

export interface FurnitureDef {
  id: ObjectKind;
  name: string;
  cost: number;
  functional: boolean;
  color: string;
}

export const FURNITURE: FurnitureDef[] = [
  { id: "furnace", name: "Furnace", cost: 120, functional: true, color: "#8a93a0" },
  { id: "cheese_maker", name: "Cheese Maker", cost: 150, functional: true, color: "#c9a06a" },
  { id: "jam_pot", name: "Jam Pot", cost: 140, functional: true, color: "#c8344f" },
  { id: "lamp", name: "Lamp", cost: 40, functional: false, color: "#f6d65b" },
  { id: "flower_pot", name: "Flower Pot", cost: 30, functional: false, color: "#f2a6c0" },
];

export const FURNITURE_BY_ID: Record<string, FurnitureDef> = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));

export function furnitureName(id: string): string {
  return FURNITURE_BY_ID[id]?.name ?? id;
}
