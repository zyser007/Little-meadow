// Bottom action bar matching the reference: Bag / Tool / Seed / Shop / Map / Menu. The Tool and
// Seed buttons show the current selection as a sub-label and highlight when active.

export interface ActionHandlers {
  onBag: () => void;
  onTool: () => void;
  onSeed: () => void;
  onShop: () => void;
  onMap: () => void;
  onMenu: () => void;
}

export class ActionBar {
  private toolBtn: HTMLButtonElement;
  private toolSub: HTMLSpanElement;
  private seedBtn: HTMLButtonElement;
  private seedSub: HTMLSpanElement;

  constructor(parent: HTMLElement, h: ActionHandlers) {
    const bar = document.createElement("div");
    bar.id = "actionbar";

    const mk = (label: string, sub: string, onClick: () => void) => {
      const b = document.createElement("button");
      b.className = "ab-btn";
      const l = document.createElement("span");
      l.textContent = label;
      const s = document.createElement("span");
      s.className = "ab-sub";
      s.textContent = sub;
      b.append(l, s);
      b.addEventListener("click", onClick);
      bar.appendChild(b);
      return { b, s };
    };

    mk("Bag", "items", h.onBag);
    const tool = mk("Tool", "Hand", h.onTool);
    this.toolBtn = tool.b;
    this.toolSub = tool.s;
    const seed = mk("Seed", "none", h.onSeed);
    this.seedBtn = seed.b;
    this.seedSub = seed.s;
    mk("Shop", "buy/sell", h.onShop);
    mk("Map", "soon", h.onMap);
    mk("Menu", "save", h.onMenu);

    parent.appendChild(bar);
  }

  update(toolName: string, seedName: string): void {
    this.toolSub.textContent = toolName;
    this.seedSub.textContent = seedName;
    this.toolBtn.classList.toggle("active", toolName !== "Hand");
    this.seedBtn.classList.toggle("active", seedName !== "none");
  }
}
