// Headless capture of the prototype at a phone viewport. Drives the game via window.LM so the
// shots are deterministic. Usage: node scripts/screenshot.mjs  (dev server must be running).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = process.env.URL || "http://127.0.0.1:5173/";
const outDir = "screenshots";
mkdirSync(outDir, { recursive: true });

const exe = process.env.CHROME_PATH || undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log("PAGE ERROR:", m.text());
});
page.on("pageerror", (e) => console.log("PAGE EXCEPTION:", e.message));

const shot = async (name) => {
  await page.screenshot({ path: `${outDir}/${name}.png` });
  console.log("saved", name);
};

await page.goto(url, { waitUntil: "load" });
await page.evaluate(() => {
  try {
    localStorage.clear();
  } catch {}
});
await page.reload({ waitUntil: "load" });
await page.waitForFunction(() => !!window.LM, null, { timeout: 15000 });
await page.waitForTimeout(600);
await shot("01-start");

await page.evaluate(() => window.LM.demoSetup());
await page.waitForTimeout(500);
await shot("02-farm-day");

await page.evaluate(() => {
  window.LM.game.timeMinutes = 19 * 60 + 30;
});
await page.waitForTimeout(400);
await shot("03-evening");

await page.evaluate(() => {
  window.LM.game.timeMinutes = 22 * 60 + 30;
});
await page.waitForTimeout(400);
await shot("04-night");

await page.evaluate(() => {
  window.LM.game.timeMinutes = 9 * 60;
  window.LM.openShop();
});
await page.waitForTimeout(400);
await shot("05-shop");

await page.evaluate(() => {
  window.LM.closePanel();
  window.LM.openBag();
});
await page.waitForTimeout(400);
await shot("06-bag");

await page.evaluate(() => {
  window.LM.closePanel();
  window.LM.openStorage();
});
await page.waitForTimeout(400);
await shot("07-chest");

await page.evaluate(() => {
  window.LM.closePanel();
  window.LM.openAnimals("coop");
});
await page.waitForTimeout(400);
await shot("08-coop");

await page.evaluate(() => {
  const { world } = window.LM;
  world.forEach((t) => {
    if (t.obj && t.obj.kind === "furnace") {
      t.obj.input = null;
      t.obj.daysLeft = 0;
      t.obj.output = null;
    }
  });
  window.LM.closePanel();
  window.LM.openMachine("furnace");
});
await page.waitForTimeout(400);
await shot("09-craft");

await page.evaluate(() => {
  window.LM.closePanel();
  window.LM.openMap();
});
await page.waitForTimeout(400);
await shot("10-map");

await page.evaluate(() => {
  window.LM.closePanel();
  window.LM.resolveTap(4, 4); // tap the signpost
});
await page.waitForTimeout(300);
await shot("11-dialogue");

await browser.close();
console.log("done");
