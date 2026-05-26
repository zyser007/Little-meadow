// Shop panel: buy seeds (left) and sell produce/resources you own (right).

import { game } from "../game/GameState";
import { CROPS } from "../data/crops";
import { ITEMS } from "../data/items";
import { FURNITURE } from "../data/furniture";

export class Shop {
  el: HTMLElement;
  private body: HTMLElement;
  private onChange: () => void;
  private toast: (msg: string) => void;
  private onBuild: (id: string) => void;

  constructor(onClose: () => void, onChange: () => void, toast: (msg: string) => void, onBuild: (id: string) => void) {
    this.onChange = onChange;
    this.toast = toast;
    this.onBuild = onBuild;

    this.el = document.createElement("div");
    this.el.className = "panel";

    const head = document.createElement("div");
    head.className = "panel-head";
    const title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = "Shop";
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

    // Buy seeds
    const buyLab = document.createElement("div");
    buyLab.className = "section-label";
    buyLab.textContent = "Buy Seeds";
    this.body.appendChild(buyLab);
    for (const c of CROPS) {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = `Buy ${c.seedCost}G`;
      btn.disabled = game.gold < c.seedCost;
      btn.addEventListener("click", () => this.buy(c.seedId, c.seedCost, `${c.name} Seeds`));
      this.body.appendChild(this.makeRow(c.color, c.name, "", btn));
    }

    // Sell produce / resources
    const sellLab = document.createElement("div");
    sellLab.className = "section-label";
    sellLab.textContent = "Sell";
    this.body.appendChild(sellLab);
    const sellable = Object.keys(game.inventory).filter((id) => {
      const d = ITEMS[id];
      return d && d.kind !== "seed" && d.sellPrice > 0 && game.count(id) > 0;
    });
    if (sellable.length === 0) {
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = "Nothing to sell yet. Harvest some crops!";
      this.body.appendChild(e);
    } else {
      for (const id of sellable) {
        const d = ITEMS[id];
        const btn = document.createElement("button");
        btn.className = "btn sec";
        btn.textContent = `Sell ${d.sellPrice}G`;
        btn.addEventListener("click", () => this.sell(id, d.sellPrice, d.name));
        this.body.appendChild(this.makeRow(d.color, d.name, `x${game.count(id)}`, btn));
      }
    }

    // Build / furniture (buy then place on the farm)
    const buildLab = document.createElement("div");
    buildLab.className = "section-label";
    buildLab.textContent = "Build";
    this.body.appendChild(buildLab);
    for (const f of FURNITURE) {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = `${f.cost}G`;
      btn.disabled = game.gold < f.cost;
      btn.addEventListener("click", () => this.onBuild(f.id));
      this.body.appendChild(this.makeRow(f.color, f.name, "", btn));
    }
  }

  private makeRow(color: string, name: string, qty: string, btn: HTMLButtonElement): HTMLElement {
    const row = document.createElement("div");
    row.className = "row";
    const sw = document.createElement("span");
    sw.className = "sw";
    sw.style.background = color;
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = name;
    row.append(sw, nm);
    if (qty) {
      const q = document.createElement("span");
      q.className = "qty";
      q.textContent = qty;
      row.appendChild(q);
    }
    row.appendChild(btn);
    return row;
  }

  private buy(seedId: string, cost: number, label: string): void {
    if (!game.spendGold(cost)) {
      this.toast("Not enough gold.");
      return;
    }
    game.addItem(seedId, 1);
    this.toast(`Bought ${label}.`);
    this.onChange();
    this.refresh();
  }

  private sell(id: string, price: number, label: string): void {
    if (!game.removeItem(id, 1)) return;
    game.addGold(price);
    this.toast(`Sold ${label} (+${price}G).`);
    this.onChange();
    this.refresh();
  }
}
