// Chest storage panel: move items one at a time between the Bag and the Chest.

import { game } from "../game/GameState";
import { itemName, itemColor } from "../data/items";

export class Storage {
  el: HTMLElement;
  private body: HTMLElement;
  private onChange: () => void;

  constructor(onClose: () => void, onChange: () => void) {
    this.onChange = onChange;

    this.el = document.createElement("div");
    this.el.className = "panel";

    const head = document.createElement("div");
    head.className = "panel-head";
    const title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = "Chest";
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

    this.section("Bag", Object.keys(game.inventory).filter((id) => game.count(id) > 0), "Store", (id) => {
      if (game.removeItem(id, 1)) game.addStore(id, 1);
    }, (id) => game.count(id), "Your bag is empty.");

    this.section("Chest", Object.keys(game.storage).filter((id) => game.countStore(id) > 0), "Take", (id) => {
      if (game.removeStore(id, 1)) game.addItem(id, 1);
    }, (id) => game.countStore(id), "The chest is empty.");
  }

  private section(
    label: string,
    ids: string[],
    action: string,
    move: (id: string) => void,
    countOf: (id: string) => number,
    emptyMsg: string,
  ): void {
    const lab = document.createElement("div");
    lab.className = "section-label";
    lab.textContent = label;
    this.body.appendChild(lab);
    if (ids.length === 0) {
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = emptyMsg;
      this.body.appendChild(e);
      return;
    }
    for (const id of ids) {
      const row = document.createElement("div");
      row.className = "row";
      const sw = document.createElement("span");
      sw.className = "sw";
      sw.style.background = itemColor(id);
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.textContent = itemName(id);
      const qty = document.createElement("span");
      qty.className = "qty";
      qty.textContent = `x${countOf(id)}`;
      const btn = document.createElement("button");
      btn.className = "btn sec";
      btn.textContent = action;
      btn.addEventListener("click", () => {
        move(id);
        this.onChange();
        this.refresh();
      });
      row.append(sw, nm, qty, btn);
      this.body.appendChild(row);
    }
  }
}
