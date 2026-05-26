// Transient toast used for action feedback and inspect messages.

export class Toast {
  private el: HTMLDivElement;
  private timer = 0;

  constructor(parent: HTMLElement) {
    this.el = document.createElement("div");
    this.el.id = "toast";
    parent.appendChild(this.el);
  }

  show(msg: string): void {
    if (!msg) return;
    this.el.textContent = msg;
    this.el.classList.add("show");
    if (this.timer) clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.el.classList.remove("show"), 1700);
  }
}

// Dialogue box (NPC / signpost) — a named, tappable message panel above the action bar.
export class DialogueBox {
  private el: HTMLDivElement;
  private nameEl: HTMLDivElement;
  private textEl: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.el = document.createElement("div");
    this.el.id = "dialogue";
    this.nameEl = document.createElement("div");
    this.nameEl.className = "dlg-name";
    this.textEl = document.createElement("div");
    this.textEl.className = "dlg-text";
    this.el.append(this.nameEl, this.textEl);
    this.el.addEventListener("click", () => this.hide());
    parent.appendChild(this.el);
  }

  show(name: string, text: string): void {
    this.nameEl.textContent = name;
    this.textEl.textContent = text;
    this.el.classList.add("show");
  }

  hide(): void {
    this.el.classList.remove("show");
  }
}
