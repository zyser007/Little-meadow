// Functional check of the core loop through the real game code (tools -> resolveTap -> systems),
// plus a save/load roundtrip. Exits non-zero on failure. Dev server must be running.
import { chromium } from "playwright";

const url = process.env.URL || "http://127.0.0.1:5173/";
const exe = process.env.CHROME_PATH || undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await (await browser.newContext()).newPage();
page.on("pageerror", (e) => console.log("PAGE EXCEPTION:", e.message));

await page.goto(url, { waitUntil: "load" });
await page.evaluate(() => {
  try {
    localStorage.clear();
  } catch {}
});
await page.reload({ waitUntil: "load" });
await page.waitForFunction(() => !!window.LM, null, { timeout: 15000 });

const result = await page.evaluate(() => {
  const { game, world, resolveTap, sleep } = window.LM;
  let target = null;
  world.forEach((t, c, r) => {
    if (!target && t.terrain === "grass" && !t.building && !t.crop) target = [c, r];
  });
  const [c, r] = target;
  const out = {};

  game.selectedTool = "hoe";
  resolveTap(c, r);
  out.tilled = world.at(c, r).tilled;

  game.selectedTool = "hand";
  game.selectedSeed = "turnip_seed";
  const seedsBefore = game.count("turnip_seed");
  resolveTap(c, r);
  out.planted = !!world.at(c, r).crop;
  out.seedConsumed = seedsBefore - game.count("turnip_seed");

  // water + sleep until mature (turnip = 4 stages, mature stage 3)
  for (let i = 0; i < 6; i++) {
    const crop = world.at(c, r).crop;
    if (crop && crop.stage >= 3) break;
    game.selectedTool = "watering_can";
    resolveTap(c, r); // waters
    out.watered = world.at(c, r).crop.watered;
    sleep();
  }
  out.stageAfterGrowth = world.at(c, r).crop.stage;
  out.dayAfter = game.day;

  game.selectedTool = "hand";
  const produceBefore = game.count("turnip");
  resolveTap(c, r); // harvest (mature)
  out.harvested = game.count("turnip") - produceBefore;
  out.cropCleared = world.at(c, r).crop === null;

  // gathering: chop a tree to nothing
  let tree = null;
  world.forEach((t, tc, tr) => {
    if (!tree && t.obj && t.obj.kind === "tree") tree = [tc, tr];
  });
  if (tree) {
    game.selectedTool = "axe";
    const woodBefore = game.count("wood");
    let guard = 0;
    while (world.at(tree[0], tree[1]).obj && guard++ < 12) resolveTap(tree[0], tree[1]);
    out.treeGone = world.at(tree[0], tree[1]).obj === null;
    out.woodGained = game.count("wood") - woodBefore;
  }

  // gathering: mine a rock to nothing
  let rock = null;
  world.forEach((t, rc, rr) => {
    if (!rock && t.obj && t.obj.kind === "rock") rock = [rc, rr];
  });
  if (rock) {
    game.selectedTool = "pickaxe";
    const stoneBefore = game.count("stone");
    let guard = 0;
    while (world.at(rock[0], rock[1]).obj && guard++ < 12) resolveTap(rock[0], rock[1]);
    out.rockGone = world.at(rock[0], rock[1]).obj === null;
    out.stoneGained = game.count("stone") - stoneBefore;
  }

  // storage roundtrip (same move semantics as the chest panel)
  if (game.count("wood") > 0) {
    const w = game.count("wood");
    game.removeItem("wood", 1);
    game.addStore("wood", 1);
    out.stored = game.countStore("wood") >= 1 && game.count("wood") === w - 1;
    game.removeStore("wood", 1);
    game.addItem("wood", 1);
    out.took = game.count("wood") === w;
  }

  out.cell = [c, r];
  return out;
});

// save/load roundtrip: reload and confirm day + harvested produce persisted
const dayBeforeReload = result.dayAfter;
await page.reload({ waitUntil: "load" });
await page.waitForFunction(() => !!window.LM, null, { timeout: 15000 });
const persisted = await page.evaluate(() => ({
  day: window.LM.game.day,
  turnip: window.LM.game.count("turnip"),
  animals: window.LM.game.animals.length,
}));

// animal loop: feed -> sleep produces -> collect
const animal = await page.evaluate(() => {
  const { game, sleep, feedAnimal, collectAnimal } = window.LM;
  let a = game.animals[0];
  if (!a) a = game.addAnimal("chicken");
  a.fed = false;
  a.hasProduce = false;
  const fed = feedAnimal(a).ok && a.fed === true;
  sleep();
  const produced = a.hasProduce === true && a.fed === false;
  const eggBefore = game.count("egg");
  const res = collectAnimal(a);
  const collected = res.ok && game.count("egg") === eggBefore + 1 && a.hasProduce === false;
  return { fed, produced, collected };
});

// crafting loop: load furnace -> sleep -> collect bar
const craft = await page.evaluate(() => {
  const { game, world, sleep, loadMachine, collectMachine } = window.LM;
  let furnace = null;
  world.forEach((t) => {
    if (!furnace && t.obj && t.obj.kind === "furnace") furnace = t.obj;
  });
  if (!furnace) return { found: false };
  furnace.input = null;
  furnace.daysLeft = 0;
  furnace.output = null;
  game.addItem("iron", 1);
  const loaded = loadMachine(furnace, "iron").ok && furnace.input === "iron" && (furnace.daysLeft || 0) > 0;
  sleep();
  const finished = furnace.output === "iron_bar" && furnace.input === null;
  const before = game.count("iron_bar");
  const collected = collectMachine(furnace).ok && game.count("iron_bar") === before + 1 && !furnace.output;
  return { found: true, loaded, finished, collected };
});

// fishing: cast at a water tile
const fish = await page.evaluate(() => {
  const { game, world, tryFish } = window.LM;
  let w = null;
  world.forEach((t, c, r) => {
    if (!w && t.terrain === "water") w = [c, r];
  });
  if (!w) return { found: false };
  const ids = ["anchovy", "carp", "salmon", "seaweed"];
  const before = ids.reduce((s, id) => s + game.count(id), 0);
  const res = tryFish(w[0], w[1]);
  const after = ids.reduce((s, id) => s + game.count(id), 0);
  return { found: true, ok: res.ok, gained: after - before };
});

await browser.close();

const checks = [
  ["tilled grass", result.tilled === true],
  ["planted crop", result.planted === true],
  ["seed consumed", result.seedConsumed === 1],
  ["watered crop", result.watered === true],
  ["grew to mature stage 3", result.stageAfterGrowth === 3],
  ["day advanced past 1", result.dayAfter > 1],
  ["harvested 1 produce", result.harvested === 1],
  ["crop cleared after harvest", result.cropCleared === true],
  ["save/load kept day", persisted.day === dayBeforeReload],
  ["save/load kept produce", persisted.turnip >= 1],
  ["chopped tree away", result.treeGone === true],
  ["got wood from tree", result.woodGained >= 2],
  ["mined rock away", result.rockGone === true],
  ["got stone from rock", result.stoneGained >= 1],
  ["stored item in chest", result.stored === true],
  ["took item from chest", result.took === true],
  ["save/load kept animals", persisted.animals >= 1],
  ["fed an animal", animal.fed === true],
  ["animal produced overnight", animal.produced === true],
  ["collected animal produce", animal.collected === true],
  ["machine persisted in save", craft.found === true],
  ["loaded furnace", craft.loaded === true],
  ["furnace finished overnight", craft.finished === true],
  ["collected crafted bar", craft.collected === true],
  ["found water to fish", fish.found === true],
  ["caught a fish", fish.ok === true && fish.gained === 1],
];

let ok = true;
for (const [name, pass] of checks) {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}`);
  if (!pass) ok = false;
}
console.log(ok ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(ok ? 0 : 1);
