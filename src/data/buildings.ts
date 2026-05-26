// Buildings occupy a single tile (placeholders drawn taller than the tile). Tapping a
// building triggers its action. Phase 1 pre-places a house (sleep) and a shop.

export type BuildingAction = "sleep" | "shop" | "animals" | "none";

export interface BuildingDef {
  id: string;
  name: string;
  action: BuildingAction;
  wall: string;
  roof: string;
}

export const BUILDINGS: Record<string, BuildingDef> = {
  house: { id: "house", name: "Home", action: "sleep", wall: "#f3e4c7", roof: "#3f6fb0" },
  shop: { id: "shop", name: "Shop", action: "shop", wall: "#f3e4c7", roof: "#c0533f" },
  coop: { id: "coop", name: "Coop", action: "animals", wall: "#e8d2a8", roof: "#b9844a" },
  barn: { id: "barn", name: "Barn", action: "animals", wall: "#d98b5a", roof: "#8a4a2e" },
  well: { id: "well", name: "Well", action: "none", wall: "#b7bcc2", roof: "#7d848c" },
};

export function buildingDef(id: string): BuildingDef | undefined {
  return BUILDINGS[id];
}
