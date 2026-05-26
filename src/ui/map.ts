// Map screen: a simple top-down minimap of the farm drawn from the world grid.

import type { World } from "../game/World";
import type { Player } from "../game/Player";

const TERRAIN_COLOR: Record<string, string> = {
  grass: "#7cc36a",
  path: "#caa472",
  water: "#5fb4d6",
  sand: "#e3cf9a",
};

export class MapPanel {
  el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private cell = 18;

  constructor(onClose: () => void) {
    this.el = document.createElement("div");
    this.el.className = "panel";

    const head = document.createElement("div");
    head.className = "panel-head";
    const title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = "Map";
    const close = document.createElement("button");
    close.className = "panel-close";
    close.textContent = "x";
    close.addEventListener("click", onClose);
    head.append(title, close);

    const body = document.createElement("div");
    body.className = "panel-body";
    body.style.alignItems = "center";
    this.canvas = document.createElement("canvas");
    this.canvas.style.borderRadius = "10px";
    this.canvas.style.border = "2px solid #8a5a3b";
    const legend = document.createElement("div");
    legend.className = "hint";
    legend.textContent = "Blue roof = home · markers = buildings, animals' barns, trees, rocks & machines · dot = you.";
    body.append(this.canvas, legend);

    this.el.append(head, body);
  }

  render(world: World, player: Player): void {
    const cell = this.cell;
    this.canvas.width = world.cols * cell;
    this.canvas.height = world.rows * cell;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    world.forEach((t, c, r) => {
      let color = TERRAIN_COLOR[t.terrain] ?? "#7cc36a";
      if (t.tilled && t.terrain !== "water") color = "#7a4a2b";
      ctx.fillStyle = color;
      ctx.fillRect(c * cell, r * cell, cell, cell);
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.strokeRect(c * cell, r * cell, cell, cell);

      const cx = c * cell + cell / 2;
      const cy = r * cell + cell / 2;
      if (t.building) {
        ctx.fillStyle =
          t.building === "house"
            ? "#3f6fb0"
            : t.building === "shop"
              ? "#c0533f"
              : t.building === "coop"
                ? "#b9844a"
                : t.building === "barn"
                  ? "#8a4a2e"
                  : "#7d848c";
        ctx.fillRect(c * cell + 3, r * cell + 3, cell - 6, cell - 6);
      } else if (t.obj) {
        ctx.fillStyle =
          t.obj.kind === "tree"
            ? "#3f8f33"
            : t.obj.kind === "rock"
              ? "#9aa0a6"
              : t.obj.kind === "chest"
                ? "#9c6b3f"
                : t.obj.kind === "sign"
                  ? "#caa05a"
                  : "#8a93a0";
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else if (t.crop) {
        ctx.fillStyle = "#5bb148";
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // player marker
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#d84a3a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.fcol * cell + cell / 2, player.frow * cell + cell / 2, cell * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
