// Machine panel (furnace / cheese maker / jam pot): load a raw input to process, see progress, or
// collect the finished good.

import { game } from "../game/GameState";
import type { WorldObject } from "../game/World";
import { recipesForMachine } from "../data/recipes";
import { itemName, itemColor } from "../data/items";
import { furnitureName } from "../data/furniture";
import { machineState } from "../systems/crafting";

export interface CraftCallbacks {
  load: (obj: WorldObject, inputId: string) => void;
  collect: (obj: WorldObject) => void;
}

export class CraftPanel {
  el: HTMLElement;
  private body: HTMLElement;
  private titleEl: HTMLElement;
  private cb: CraftCallbacks;
  private obj: WorldObject | null = null;

  constructor(onClose: () => void, cb: CraftCallbacks) {
    this.cb = cb;
    this.el = document.createElement("div");
    this.el.className = "panel";

    const head = document.createElement("div");
    head.className = "panel-head";
    this.titleEl = document.createElement("div");
    this.titleEl.className = "panel-title";
    const close = document.createElement("button");
    close.className = "panel-close";
    close.textContent = "x";
    close.addEventListener("click", onClose);
    head.append(this.titleEl, close);

    this.body = document.createElement("div");
    this.body.className = "panel-body";
    this.el.append(head, this.body);
  }

  open(obj: WorldObject): void {
    this.obj = obj;
    this.refresh();
  }

  refresh(): void {
    const obj = this.obj;
    if (!obj) return;
    this.titleEl.textContent = furnitureName(obj.kind);
    this.body.innerHTML = "";
    const state = machineState(obj);

    if (state === "done" && obj.output) {
      const row = document.createElement("div");
      row.className = "row";
      const sw = document.createElement("span");
      sw.className = "sw";
      sw.style.background = itemColor(obj.output);
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.textContent = `Ready: ${itemName(obj.output)}`;
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = "Collect";
      btn.addEventListener("click", () => {
        this.cb.collect(obj);
        this.refresh();
      });
      row.append(sw, nm, btn);
      this.body.appendChild(row);
      return;
    }

    if (state === "busy" && obj.input) {
      const hint = document.createElement("div");
      hint.className = "hint";
      const d = obj.daysLeft ?? 0;
      hint.textContent = `Processing ${itemName(obj.input)} — ${d} day${d > 1 ? "s" : ""} left. Sleep to advance.`;
      this.body.appendChild(hint);
      return;
    }

    // idle: list available recipes
    const lab = document.createElement("div");
    lab.className = "section-label";
    lab.textContent = "Process";
    this.body.appendChild(lab);
    for (const r of recipesForMachine(obj.kind)) {
      const have = game.count(r.input);
      const row = document.createElement("div");
      row.className = "row";
      const sw = document.createElement("span");
      sw.className = "sw";
      sw.style.background = itemColor(r.output);
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.textContent = `${itemName(r.input)} → ${itemName(r.output)}`;
      const qty = document.createElement("span");
      qty.className = "qty";
      qty.textContent = `x${have}`;
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = "Make";
      btn.disabled = have <= 0;
      btn.addEventListener("click", () => {
        this.cb.load(obj, r.input);
        this.refresh();
      });
      row.append(sw, nm, qty, btn);
      this.body.appendChild(row);
    }
  }
}
