// Crop content table. Real sprites later replace placeholders; growth is day-based:
// each watered crop advances one stage when the player sleeps. Mature stage = stages-1.

export interface CropDef {
  id: string;
  name: string;
  seedId: string; // inventory item id for the seed
  produceId: string; // inventory item id for the harvested produce
  stages: number; // number of visual growth stages including mature
  seedCost: number; // shop buy price (gold)
  sellPrice: number; // produce sell price (gold)
  color: string; // placeholder produce/foliage tint
}

export const CROPS: CropDef[] = [
  { id: "carrot", name: "Carrot", seedId: "carrot_seed", produceId: "carrot", stages: 4, seedCost: 8, sellPrice: 18, color: "#e8923b" },
  { id: "turnip", name: "Turnip", seedId: "turnip_seed", produceId: "turnip", stages: 4, seedCost: 10, sellPrice: 22, color: "#c98fd0" },
  { id: "cabbage", name: "Cabbage", seedId: "cabbage_seed", produceId: "cabbage", stages: 5, seedCost: 20, sellPrice: 45, color: "#8fc46a" },
  { id: "corn", name: "Corn", seedId: "corn_seed", produceId: "corn", stages: 5, seedCost: 15, sellPrice: 35, color: "#f2cf4a" },
  { id: "wheat", name: "Wheat", seedId: "wheat_seed", produceId: "wheat", stages: 4, seedCost: 6, sellPrice: 14, color: "#e3c878" },
  { id: "pumpkin", name: "Pumpkin", seedId: "pumpkin_seed", produceId: "pumpkin", stages: 5, seedCost: 30, sellPrice: 70, color: "#e07b2e" },
  { id: "tomato", name: "Tomato", seedId: "tomato_seed", produceId: "tomato", stages: 4, seedCost: 18, sellPrice: 40, color: "#d8463a" },
  { id: "strawberry", name: "Strawberry", seedId: "strawberry_seed", produceId: "strawberry", stages: 4, seedCost: 25, sellPrice: 55, color: "#d83a55" },
];

export const CROP_BY_ID: Record<string, CropDef> = Object.fromEntries(CROPS.map((c) => [c.id, c]));
export const CROP_BY_SEED: Record<string, CropDef> = Object.fromEntries(CROPS.map((c) => [c.seedId, c]));

export function matureStage(def: CropDef): number {
  return def.stages - 1;
}
