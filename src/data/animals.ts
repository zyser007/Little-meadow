// Animal content + live instances. Animals live in a coop (chicken/duck) or barn (cow/sheep).
// Daily loop: feed an animal -> it produces its item overnight (on sleep) -> collect next morning.

export type AnimalHouse = "coop" | "barn";

export interface AnimalDef {
  id: string;
  name: string;
  house: AnimalHouse;
  produceId: string;
  cost: number;
  color: string; // placeholder body tint
}

export interface Animal {
  uid: number;
  defId: string;
  fed: boolean;
  hasProduce: boolean;
}

export const ANIMALS: AnimalDef[] = [
  { id: "chicken", name: "Chicken", house: "coop", produceId: "egg", cost: 80, color: "#f4f0e6" },
  { id: "duck", name: "Duck", house: "coop", produceId: "egg", cost: 90, color: "#f2cf4a" },
  { id: "cow", name: "Cow", house: "barn", produceId: "milk", cost: 220, color: "#efe4d0" },
  { id: "sheep", name: "Sheep", house: "barn", produceId: "wool", cost: 180, color: "#efe9df" },
];

export const ANIMAL_BY_ID: Record<string, AnimalDef> = Object.fromEntries(ANIMALS.map((a) => [a.id, a]));

export const HOUSE_CAPACITY: Record<AnimalHouse, number> = { coop: 4, barn: 4 };

export function animalsForHouse(list: Animal[], house: AnimalHouse): Animal[] {
  return list.filter((a) => ANIMAL_BY_ID[a.defId]?.house === house);
}

export function defsForHouse(house: AnimalHouse): AnimalDef[] {
  return ANIMALS.filter((a) => a.house === house);
}
