// Coop / Barn panel: feed and collect from each animal, and buy more (up to capacity).

import { game } from "../game/GameState";
import {
  ANIMAL_BY_ID,
  HOUSE_CAPACITY,
  animalsForHouse,
  defsForHouse,
  type Animal,
  type AnimalHouse,
} from "../data/animals";

export interface AnimalCallbacks {
  feed: (a: Animal) => void;
  collect: (a: Animal) => void;
  feedAll: (house: AnimalHouse) => void;
  collectAll: (house: AnimalHouse) => void;
  buy: (defId: string) => void;
}

export class AnimalPanel {
  el: HTMLElement;
  private body: HTMLElement;
  private titleEl: HTMLElement;
  private cb: AnimalCallbacks;
  private house: AnimalHouse = "coop";

  constructor(onClose: () => void, cb: AnimalCallbacks) {
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

  open(house: AnimalHouse): void {
    this.house = house;
    this.refresh();
  }

  refresh(): void {
    const house = this.house;
    this.titleEl.textContent = house === "coop" ? "Coop" : "Barn";
    this.body.innerHTML = "";

    const animals = animalsForHouse(game.animals, house);

    // quick actions
    const quick = document.createElement("div");
    quick.style.display = "flex";
    quick.style.gap = "8px";
    const feedAll = document.createElement("button");
    feedAll.className = "btn";
    feedAll.textContent = "Feed All";
    feedAll.disabled = !animals.some((a) => !a.fed && !a.hasProduce);
    feedAll.addEventListener("click", () => {
      this.cb.feedAll(house);
      this.refresh();
    });
    const collectAll = document.createElement("button");
    collectAll.className = "btn sec";
    collectAll.textContent = "Collect All";
    collectAll.disabled = !animals.some((a) => a.hasProduce);
    collectAll.addEventListener("click", () => {
      this.cb.collectAll(house);
      this.refresh();
    });
    quick.append(feedAll, collectAll);
    this.body.appendChild(quick);

    // animal list
    const lab = document.createElement("div");
    lab.className = "section-label";
    lab.textContent = `Animals (${animals.length}/${HOUSE_CAPACITY[house]})`;
    this.body.appendChild(lab);

    if (animals.length === 0) {
      const e = document.createElement("div");
      e.className = "empty";
      e.textContent = "No animals yet — buy one below!";
      this.body.appendChild(e);
    } else {
      for (const a of animals) {
        const def = ANIMAL_BY_ID[a.defId];
        const row = document.createElement("div");
        row.className = "row";
        const sw = document.createElement("span");
        sw.className = "sw";
        sw.style.background = def.color;
        const nm = document.createElement("span");
        nm.className = "nm";
        nm.textContent = def.name;
        const status = document.createElement("span");
        status.className = "qty";
        status.textContent = a.hasProduce ? "ready" : a.fed ? "fed" : "hungry";

        const btn = document.createElement("button");
        if (a.hasProduce) {
          btn.className = "btn";
          btn.textContent = "Collect";
          btn.addEventListener("click", () => {
            this.cb.collect(a);
            this.refresh();
          });
        } else if (!a.fed) {
          btn.className = "btn sec";
          btn.textContent = "Feed";
          btn.addEventListener("click", () => {
            this.cb.feed(a);
            this.refresh();
          });
        } else {
          btn.className = "btn sec";
          btn.textContent = "Fed";
          btn.disabled = true;
        }
        row.append(sw, nm, status, btn);
        this.body.appendChild(row);
      }
    }

    // buy options
    const buyLab = document.createElement("div");
    buyLab.className = "section-label";
    buyLab.textContent = "Buy";
    this.body.appendChild(buyLab);
    const atCapacity = animals.length >= HOUSE_CAPACITY[house];
    for (const def of defsForHouse(house)) {
      const row = document.createElement("div");
      row.className = "row";
      const sw = document.createElement("span");
      sw.className = "sw";
      sw.style.background = def.color;
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.textContent = `${def.name} (→ ${def.produceId})`;
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.textContent = `${def.cost}G`;
      btn.disabled = atCapacity || game.gold < def.cost;
      btn.addEventListener("click", () => {
        this.cb.buy(def.id);
        this.refresh();
      });
      row.append(sw, nm, btn);
      this.body.appendChild(row);
    }
    if (atCapacity) {
      const e = document.createElement("div");
      e.className = "hint";
      e.textContent = "This building is full.";
      this.body.appendChild(e);
    }
  }
}
