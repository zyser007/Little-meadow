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
