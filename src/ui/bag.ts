// Bag panel: lists everything in the player's inventory grouped by kind with placeholder swatches.

import { game } from "../game/GameState";
import { ITEMS, type ItemKind } from "../data/items";

export class Bag {
  el: HTMLElement;
  private body: HTMLElement;

  constructor(onClose: () => void) {
    this.el = document.createElement("div");
    this.el.className = "panel";

    const head = document.createElement("div");
    head.className = "panel-head";
    const title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = "Bag";
    const close = document.createElement("button");
    close.className = "panel-close";
    close.textContent = "x";
    close.addEventListener("click", onClose);
    head.append(title, close);

    this.body = document.createElement("div");
    this.body.className = "panel-body";

    this.el.append(head, this.body);
  }

  refresh(): void {
    this.body.innerHTML = "";
    const groups: Array<[ItemKind, string]> = [
      ["seed", "Seeds"],
      ["produce", "Produce"],
      ["resource", "Resources"],
    ];
    let any = false;
    for (const [kind, label] of groups) {
      const ids = Object.keys(game.inventory).filter((id) => ITEMS[id]?.kind === kind && game.count(id) > 0);
      if (ids.length === 0) continue;
      any = true;
      const lab = document.createElement("div");
      lab.className = "section-label";
      lab.textContent = label;
      this.body.appendChild(lab);
      for (const id of ids) {
        const def = ITEMS[id];
        const row = document.createElement("div");
        row.className = "row";
        const sw = document.createElement("span");
        sw.className = "sw";
        sw.style.background = def.color;
        const nm = document.createElement("span");
        nm.className = "nm";
        nm.textContent = def.name;
        const qty = document.createElement("span");
        qty.className = "qty";
        qty.textContent = `x${game.count(id)}`;
        row.append(sw, nm, qty);
        this.body.appendChild(row);
      }
    }
    if (!any) {
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = "Your bag is empty. Buy seeds at the Shop!";
      this.body.appendChild(e);
    }
  }
}
