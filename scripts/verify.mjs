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

  // sell roundtrip
  const goldBefore = game.gold;
  out.goldBefore = goldBefore;
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
}));

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
];

let ok = true;
for (const [name, pass] of checks) {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}`);
  if (!pass) ok = false;
}
console.log(ok ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
process.exit(ok ? 0 : 1);
