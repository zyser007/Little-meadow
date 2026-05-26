// Diagnostic: load a URL, capture console + page errors + failed requests, screenshot. Reports
// whether the game booted (window.LM present). Used to reproduce the GitHub Pages subpath.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = process.env.URL || "http://127.0.0.1:8099/Little-meadow/";
const exe = process.env.CHROME_PATH || undefined;
mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const logs = [];
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) => logs.push(`[reqfail] ${r.url()} :: ${r.failure()?.errorText}`));
page.on("response", (r) => {
  if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url()}`);
});

await page.goto(url, { waitUntil: "networkidle" }).catch((e) => logs.push(`[goto] ${e.message}`));
await page.waitForTimeout(1500);
const hasLM = await page.evaluate(() => !!window.LM).catch(() => false);
const canvasSize = await page
  .evaluate(() => {
    const c = document.getElementById("game");
    return c ? { w: c.width, h: c.height } : null;
  })
  .catch(() => null);

console.log("URL:", url);
console.log("booted (window.LM):", hasLM);
console.log("canvas:", JSON.stringify(canvasSize));
console.log("--- console / errors ---");
console.log(logs.length ? logs.join("\n") : "(none)");
await page.screenshot({ path: "screenshots/diag.png" });
await browser.close();
