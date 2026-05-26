// Game controller (the "Main scene"): owns world/player/camera/renderer/UI/input, runs the loop,
// routes taps to the active tool, and persists progress. Phase 1 = farming loop + economy + clock.

import "./styles.css";
import { Camera } from "./game/Camera";
import { World } from "./game/World";
import { Player } from "./game/Player";
import { game } from "./game/GameState";
import { loadGame, saveGame, clearSave } from "./game/save";
import { MINUTES_PER_SECOND, WAKE_MINUTES, formatClock, phaseOf } from "./game/time";
import { gridToScreen } from "./game/iso";
import { Renderer, type Highlight, type AnimalRender } from "./render/Renderer";
import { loadAssets } from "./render/assets";
import { InputManager } from "./input";
import { tryTill, tryPlant, tryWater, tryHarvest, growCrops, stageLabel, type Result } from "./systems/farming";
import { tryChop, tryMine } from "./systems/gathering";
import { feedAnimal, collectAnimal, produceOvernight } from "./systems/animals";
import { CROP_BY_ID, CROP_BY_SEED, CROPS, matureStage } from "./data/crops";
import { ENABLED_TOOLS, TOOL_BY_ID, type ToolId } from "./data/tools";
import { buildingDef } from "./data/buildings";
import { ANIMAL_BY_ID, HOUSE_CAPACITY, animalsForHouse, type AnimalHouse } from "./data/animals";
import { HUD } from "./ui/hud";
import { Toast } from "./ui/dialogue";
import { ActionBar } from "./ui/actionbar";
import { Bag } from "./ui/bag";
import { Shop } from "./ui/shop";
import { Storage } from "./ui/storage";
import { AnimalPanel } from "./ui/animals";

async function main(): Promise<void> {
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  const ui = document.getElementById("ui") as HTMLElement;

  const camera = new Camera();
  const world = new World();
  const player = new Player();

  // Fresh game unless a save exists.
  if (!loadGame(world, player)) {
    game.resetNewGame();
  }

  const assets = await loadAssets();
  const renderer = new Renderer(canvas, camera, assets);
  camera.fitToMap(world.cols, world.rows, renderer.viewW, renderer.viewH);

  // ---- UI ----
  const hud = new HUD(ui);
  const toast = new Toast(ui);

  const panelRoot = document.createElement("div");
  panelRoot.id = "panel-root";
  ui.appendChild(panelRoot);
  panelRoot.addEventListener("click", (e) => {
    if (e.target === panelRoot) closePanel();
  });
  function openPanel(el: HTMLElement): void {
    panelRoot.innerHTML = "";
    panelRoot.appendChild(el);
    panelRoot.classList.add("open");
  }
  function closePanel(): void {
    panelRoot.classList.remove("open");
    panelRoot.innerHTML = "";
  }

  const bag = new Bag(closePanel);
  const shop = new Shop(closePanel, () => refreshHud(), (m) => toast.show(m));
  const storage = new Storage(closePanel, () => save());
  function openStorage(): void {
    storage.refresh();
    openPanel(storage.el);
  }

  const animalPanel = new AnimalPanel(closePanel, {
    feed: (a) => act(feedAnimal(a)),
    collect: (a) => act(collectAnimal(a)),
    feedAll: (house) => {
      let n = 0;
      for (const a of animalsForHouse(game.animals, house)) {
        if (!a.fed && !a.hasProduce) {
          a.fed = true;
          n++;
        }
      }
      if (n > 0) {
        toast.show(`Fed ${n} animal${n > 1 ? "s" : ""}.`);
        save();
      }
    },
    collectAll: (house) => {
      let n = 0;
      for (const a of animalsForHouse(game.animals, house)) {
        if (a.hasProduce) {
          collectAnimal(a);
          n++;
        }
      }
      if (n > 0) {
        toast.show(`Collected from ${n} animal${n > 1 ? "s" : ""}.`);
        updateBar();
        save();
      } else {
        toast.show("Nothing to collect.");
      }
    },
    buy: (defId) => {
      const def = ANIMAL_BY_ID[defId];
      if (!def) return;
      if (animalsForHouse(game.animals, def.house).length >= HOUSE_CAPACITY[def.house]) {
        toast.show("This building is full.");
        return;
      }
      if (!game.spendGold(def.cost)) {
        toast.show("Not enough gold.");
        return;
      }
      game.addAnimal(defId);
      toast.show(`Bought a ${def.name.toLowerCase()}!`);
      refreshHud();
      save();
    },
  });
  function openAnimals(house: AnimalHouse): void {
    animalPanel.open(house);
    openPanel(animalPanel.el);
  }

  const bar = new ActionBar(ui, {
    onBag: () => {
      bag.refresh();
      openPanel(bag.el);
    },
    onTool: cycleTool,
    onSeed: cycleSeed,
    onShop: () => {
      shop.refresh();
      openPanel(shop.el);
    },
    onMap: () => toast.show("Map — coming soon."),
    onMenu: openMenu,
  });

  // ---- feedback / persistence helpers ----
  function save(): void {
    saveGame(world, player);
  }

  function act(r: Result): void {
    if (r.msg) toast.show(r.msg);
    if (r.ok) {
      updateBar();
      save();
    }
  }

  function dotColor(): string {
    const p = phaseOf(game.timeMinutes);
    return p === "night" ? "#aab0ff" : p === "evening" ? "#e8943b" : "#f6c83b";
  }

  function refreshHud(): void {
    hud.update(game.day, formatClock(game.timeMinutes), game.gold, dotColor());
  }

  function toolShort(id: ToolId): string {
    return TOOL_BY_ID[id]?.short ?? "Hand";
  }

  function updateBar(): void {
    const seedName = game.selectedSeed ? CROP_BY_SEED[game.selectedSeed]?.name ?? "none" : "none";
    bar.update(toolShort(game.selectedTool), seedName);
  }

  // ---- selection ----
  function cycleTool(): void {
    const ids = ENABLED_TOOLS.map((t) => t.id);
    const i = ids.indexOf(game.selectedTool);
    game.selectedTool = ids[(i + 1) % ids.length];
    updateBar();
    toast.show(`Tool: ${TOOL_BY_ID[game.selectedTool].name}`);
  }

  function ownedSeeds(): string[] {
    return CROPS.map((c) => c.seedId).filter((id) => game.count(id) > 0);
  }

  function cycleSeed(): void {
    const seeds = ownedSeeds();
    if (seeds.length === 0) {
      game.selectedSeed = null;
      updateBar();
      toast.show("No seeds — buy some at the Shop.");
      return;
    }
    const i = game.selectedSeed ? seeds.indexOf(game.selectedSeed) : -1;
    game.selectedSeed = seeds[(i + 1) % seeds.length];
    game.selectedTool = "hand"; // so the next tap on tilled soil plants
    updateBar();
    toast.show(`Selected ${CROP_BY_SEED[game.selectedSeed].name} Seeds.`);
  }

  // ---- interaction ----
  let highlight: Highlight | null = null;
  let highlightUntil = 0;

  function flash(col: number, row: number, color: string): void {
    highlight = { col, row, color };
    highlightUntil = performance.now() + 650;
  }

  function moveTo(col: number, row: number): void {
    if (world.isWalkable(col, row)) {
      player.setTarget(col, row);
      flash(col, row, "rgba(255,255,255,0.7)");
    }
  }

  function buildingAction(id: string): void {
    const def = buildingDef(id);
    if (def?.action === "sleep") {
      sleep();
    } else if (def?.action === "shop") {
      shop.refresh();
      openPanel(shop.el);
    } else if (def?.action === "animals") {
      openAnimals(id as AnimalHouse);
    } else {
      toast.show(def?.name ?? "");
    }
  }

  // Cache coop/barn tiles so animals can be drawn standing beside them.
  const houseTiles: Partial<Record<AnimalHouse, { col: number; row: number }>> = {};
  function recomputeHouseTiles(): void {
    houseTiles.coop = undefined;
    houseTiles.barn = undefined;
    world.forEach((t, c, r) => {
      if (t.building === "coop") houseTiles.coop = { col: c, row: r };
      if (t.building === "barn") houseTiles.barn = { col: c, row: r };
    });
  }
  recomputeHouseTiles();

  const ANIMAL_OFFSETS: Array<[number, number]> = [
    [0, 1], [1, 1], [-1, 1], [0, 2], [1, 2], [-1, 2], [2, 1], [-2, 1],
  ];
  function computeAnimalRenders(): AnimalRender[] {
    const out: AnimalRender[] = [];
    for (const house of ["coop", "barn"] as AnimalHouse[]) {
      const tile = houseTiles[house];
      if (!tile) continue;
      animalsForHouse(game.animals, house).forEach((a, i) => {
        const [dc, dr] = ANIMAL_OFFSETS[i % ANIMAL_OFFSETS.length];
        const gc = tile.col + dc;
        const gr = tile.row + dr;
        const s = gridToScreen(gc, gr);
        const def = ANIMAL_BY_ID[a.defId];
        out.push({ x: s.x, y: s.y, defId: a.defId, color: def ? def.color : "#fff", hasProduce: a.hasProduce, depth: gc + gr + 0.15 });
      });
    }
    return out;
  }

  function resolveTap(col: number, row: number): void {
    const t = world.at(col, row);
    if (!t) return;
    if (t.building) {
      buildingAction(t.building);
      return;
    }
    if (t.obj) {
      flash(col, row, "rgba(255,255,255,0.7)");
      if (t.obj.kind === "chest") {
        openStorage();
      } else if (t.obj.kind === "tree") {
        if (game.selectedTool === "axe") act(tryChop(world, col, row));
        else toast.show("Use the Axe to chop this tree.");
      } else if (t.obj.kind === "rock") {
        if (game.selectedTool === "pickaxe") act(tryMine(world, col, row));
        else toast.show("Use the Pickaxe to break this rock.");
      }
      return;
    }
    flash(col, row, "rgba(255,255,255,0.7)");
    const tool = game.selectedTool;

    // Harvest a mature crop regardless of tool.
    if (t.crop) {
      const cdef = CROP_BY_ID[t.crop.cropId];
      if (cdef && t.crop.stage >= matureStage(cdef)) {
        act(tryHarvest(world, col, row));
        return;
      }
    }

    // Tool-specific actions.
    if (tool === "hoe") {
      if (!t.crop && t.terrain === "grass" && !t.tilled) {
        act(tryTill(world, col, row));
        return;
      }
    } else if (tool === "watering_can") {
      if (t.crop && !t.crop.watered) {
        act(tryWater(world, col, row));
        return;
      }
      if (t.tilled && !t.crop) {
        act(tryWater(world, col, row));
        return;
      }
    } else if (t.tilled && !t.crop && game.selectedSeed) {
      // hand + seed + empty soil = plant
      act(tryPlant(world, col, row));
      return;
    }

    // Inspect a growing crop.
    if (t.crop) {
      const cdef = CROP_BY_ID[t.crop.cropId];
      const label = stageLabel(t.crop.stage, cdef ? cdef.stages : 4);
      toast.show(`${cdef ? cdef.name : "Crop"}: ${label}${t.crop.watered ? " (watered)" : " (needs water)"}`);
      return;
    }

    // Otherwise, walk there.
    moveTo(col, row);
  }

  function longPress(col: number, row: number): void {
    const t = world.at(col, row);
    if (!t || t.building) return;
    flash(col, row, "rgba(216,74,58,0.85)");
    if (t.crop) {
      t.crop = null;
      toast.show("Cleared the crop.");
      save();
    } else if (t.tilled) {
      t.tilled = false;
      toast.show("Cleared the soil.");
      save();
    } else {
      toast.show(`${t.terrain[0].toUpperCase()}${t.terrain.slice(1)}`);
    }
  }

  function sleep(): void {
    growCrops(world);
    produceOvernight();
    game.day += 1;
    game.timeMinutes = WAKE_MINUTES;
    save();
    closePanel();
    refreshHud();
    toast.show(`You slept. Day ${game.day} — good morning!`);
  }

  function openMenu(): void {
    const el = document.createElement("div");
    el.className = "panel";
    const head = document.createElement("div");
    head.className = "panel-head";
    const title = document.createElement("div");
    title.className = "panel-title";
    title.textContent = "Menu";
    const close = document.createElement("button");
    close.className = "panel-close";
    close.textContent = "x";
    close.addEventListener("click", closePanel);
    head.append(title, close);

    const body = document.createElement("div");
    body.className = "panel-body";

    const saveBtn = document.createElement("button");
    saveBtn.className = "btn";
    saveBtn.textContent = "Save Game";
    saveBtn.addEventListener("click", () => {
      save();
      toast.show("Game saved.");
    });

    const newBtn = document.createElement("button");
    newBtn.className = "btn sec";
    newBtn.textContent = "New Game";
    newBtn.addEventListener("click", () => {
      clearSave();
      game.resetNewGame();
      world.generate();
      player.col = player.fcol = 4;
      player.row = player.frow = 5;
      camera.fitToMap(world.cols, world.rows, renderer.viewW, renderer.viewH);
      recomputeHouseTiles();
      save();
      updateBar();
      refreshHud();
      closePanel();
      toast.show("New game started.");
    });

    const hint = document.createElement("div");
    hint.className = "hint";
    hint.innerHTML =
      "Tap the ground to walk. <b>Hoe</b> tills grass, pick a <b>Seed</b> then tap soil to plant, " +
      "<b>Watering Can</b> waters. <b>Axe</b> chops trees for wood, <b>Pickaxe</b> breaks rocks for " +
      "stone &amp; ore. Tap the <b>chest</b> to store items, or the <b>coop/barn</b> to feed animals and " +
      "collect eggs, milk &amp; wool. Tap your <b>house</b> to sleep — watered crops grow and fed animals " +
      "produce overnight. Harvest, then <b>sell</b> at the Shop. Long-press to clear a tile.";

    body.append(saveBtn, newBtn, hint);
    el.append(head, body);
    openPanel(el);
  }

  // ---- input ----
  new InputManager(canvas, camera, { onTap: resolveTap, onLongPress: longPress });

  window.addEventListener("resize", () => {
    renderer.resize();
    camera.fitToMap(world.cols, world.rows, renderer.viewW, renderer.viewH);
  });

  // ---- initial UI state ----
  updateBar();
  refreshHud();

  // ---- main loop ----
  let last = performance.now();
  let hudAcc = 0;
  function frame(now: number): void {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.timeMinutes += dt * MINUTES_PER_SECOND;
    player.update(dt);
    if (highlight && now > highlightUntil) highlight = null;
    renderer.render(world, player, game.timeMinutes, highlight, now / 1000, computeAnimalRenders());
    hudAcc += dt;
    if (hudAcc > 0.2) {
      refreshHud();
      hudAcc = 0;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---- debug / screenshot hooks ----
  function demoSetup(): void {
    const ids = CROPS.map((c) => c.id);
    let i = 0;
    for (let r = 5; r <= 8; r++) {
      for (let c = 4; c <= 8; c++) {
        const t = world.at(c, r);
        if (!t || t.building || t.terrain !== "grass") continue;
        t.tilled = true;
        const cropId = ids[i % ids.length];
        const def = CROP_BY_ID[cropId];
        t.crop = { cropId, stage: (i * 3 + r + c) % def.stages, watered: i % 2 === 0 };
        i++;
      }
    }
    player.col = player.fcol = 6;
    player.row = player.frow = 6;
    game.gold = 1250;
    game.addItem("wood", 8);
    game.addItem("stone", 5);
    game.addItem("iron", 2);
    game.addStore("wood", 4);
    game.addStore("carrot", 3);
    // stock the coop + barn so the animals are visible
    game.animals = [];
    game.nextAnimalUid = 1;
    ["chicken", "chicken", "duck", "cow", "sheep"].forEach((id) => game.addAnimal(id));
    game.animals.forEach((a, i) => {
      a.hasProduce = i % 2 === 0;
      a.fed = i % 2 === 1;
    });
    updateBar();
    refreshHud();
    save();
  }

  (window as unknown as Record<string, unknown>).LM = {
    game,
    world,
    player,
    camera,
    sleep,
    resolveTap,
    openShop: () => {
      shop.refresh();
      openPanel(shop.el);
    },
    openBag: () => {
      bag.refresh();
      openPanel(bag.el);
    },
    openStorage,
    openAnimals,
    feedAnimal,
    collectAnimal,
    openMenu,
    closePanel,
    demoSetup,
  };
}

void main();
