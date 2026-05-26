// Central mutable game state (Godot-autoload style singleton). Holds currency, the bag, the
// calendar/clock and the active tool/seed selection. World + Player are owned by the controller.

import type { ToolId } from "../data/tools";

export class GameState {
  gold = 150;
  inventory: Record<string, number> = {};
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

  addGold(n: number): void {
    this.gold += n;
  }

  spendGold(n: number): boolean {
    if (this.gold < n) return false;
    this.gold -= n;
    return true;
  }

  resetNewGame(): void {
    this.gold = 150;
    this.inventory = { turnip_seed: 5, carrot_seed: 3 };
    this.day = 1;
    this.timeMinutes = 6 * 60;
    this.selectedTool = "hand";
    this.selectedSeed = "turnip_seed";
  }
}

export const game = new GameState();
