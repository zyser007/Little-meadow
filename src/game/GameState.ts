// Central mutable game state (Godot-autoload style singleton). Holds currency, the bag, the
// calendar/clock and the active tool/seed selection. World + Player are owned by the controller.

import type { ToolId } from "../data/tools";
import type { Animal } from "../data/animals";

export class GameState {
  gold = 150;
  inventory: Record<string, number> = {};
  storage: Record<string, number> = {}; // contents of the chest
  animals: Animal[] = [];
  nextAnimalUid = 1;
  day = 1;
  timeMinutes = 6 * 60; // 06:00
  selectedTool: ToolId = "hand";
  selectedSeed: string | null = null;

  count(id: string): number {
    return this.inventory[id] ?? 0;
  }

  addItem(id: string, n = 1): void {
    this.inventory[id] = this.count(id) + n;
  }

  removeItem(id: string, n = 1): boolean {
    if (this.count(id) < n) return false;
    const left = this.count(id) - n;
    if (left <= 0) delete this.inventory[id];
    else this.inventory[id] = left;
    return true;
  }

  countStore(id: string): number {
    return this.storage[id] ?? 0;
  }

  addStore(id: string, n = 1): void {
    this.storage[id] = this.countStore(id) + n;
  }

  removeStore(id: string, n = 1): boolean {
    if (this.countStore(id) < n) return false;
    const left = this.countStore(id) - n;
    if (left <= 0) delete this.storage[id];
    else this.storage[id] = left;
    return true;
  }

  addGold(n: number): void {
    this.gold += n;
  }

  spendGold(n: number): boolean {
    if (this.gold < n) return false;
    this.gold -= n;
    return true;
  }

  addAnimal(defId: string): Animal {
    const a: Animal = { uid: this.nextAnimalUid++, defId, fed: false, hasProduce: false };
    this.animals.push(a);
    return a;
  }

  resetNewGame(): void {
    this.gold = 150;
    this.inventory = { turnip_seed: 5, carrot_seed: 3 };
    this.storage = {};
    this.animals = [];
    this.nextAnimalUid = 1;
    // a starter chicken with an egg ready to collect on day one
    this.addAnimal("chicken");
    this.animals[0].hasProduce = true;
    this.day = 1;
    this.timeMinutes = 6 * 60;
    this.selectedTool = "hand";
    this.selectedSeed = "turnip_seed";
  }
}

export const game = new GameState();
