// Top HUD: day + clock pill (top-left) and gold pill (top-right).

export class HUD {
  private dayTxt: HTMLSpanElement;
  private clockEl: HTMLSpanElement;
  private goldTxt: HTMLSpanElement;
  private dot: HTMLSpanElement;

  constructor(parent: HTMLElement) {
    const top = document.createElement("div");
    top.id = "hud-top";

    const day = document.createElement("div");
    day.className = "hud-pill hud-day";
    this.dot = document.createElement("span");
    this.dot.className = "hud-dot";
    this.dot.style.background = "#f6c83b";
    this.dayTxt = document.createElement("span");
    this.clockEl = document.createElement("span");
    this.clockEl.className = "hud-clock";
    day.append(this.dot, this.dayTxt, this.clockEl);

    const gold = document.createElement("div");
    gold.className = "hud-pill hud-gold";
    const gdot = document.createElement("span");
    gdot.className = "hud-dot";
    gdot.style.background = "#e8c24a";
    this.goldTxt = document.createElement("span");
    gold.append(gdot, this.goldTxt);

    top.append(day, gold);
    parent.appendChild(top);
  }

  update(day: number, clock: string, gold: number, dotColor: string): void {
    this.dayTxt.textContent = `Day ${day}`;
    this.clockEl.textContent = clock;
    this.goldTxt.textContent = `${gold} G`;
    this.dot.style.background = dotColor;
  }
}
