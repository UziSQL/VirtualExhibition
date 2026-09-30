import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const out = process.env.REVIEW_OUT || "artifacts/review";
const url = process.env.REVIEW_URL || "http://127.0.0.1:5173/";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [],
  failures = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("requestfailed", (request) => failures.push(request.url()));
page.on("response", (response) => {
  if (response.status() >= 400)
    failures.push(`${response.status()} ${response.url()}`);
});
await page.goto(url);
await page
  .getByRole("button", { name: "Войти в музей", exact: true })
  .waitFor();
await page.waitForFunction(
  () => !document.querySelector(".welcome-actions button")?.disabled,
);
await page.screenshot({ path: `${out}/home.png` });
await page.getByRole("button", { name: "Войти в музей", exact: true }).click();
await page.waitForFunction(
  () =>
    document.querySelector(".scene-container canvas")?.dataset.position ===
    "2.80,8.50",
);
await page.screenshot({ path: `${out}/atrium.png` });
for (const [id, exhibits] of [
  ["history", ["declaration", "independence", "timeline"]],
  ["symbols", ["flag", "emblem", "anthem"]],
  ["heritage", ["dombra", "yurt", "ornament"]],
  ["people", ["abai", "shokan", "satpayev"]],
  ["region", ["shahtinsk", "dolinka", "karkaraly"]],
  ["future", ["learn", "care"]],
]) {
  await page.locator(`.room-button:has([data-hall-id="${id}"])`).click();
  await page.waitForFunction(
    (id) =>
      document.querySelector(".room-button.current .hall-title")?.dataset
        .hallId === id,
    id,
  );
  await page.waitForFunction((ids) => {
    const states = JSON.parse(
      document.querySelector(".scene-container canvas")?.dataset.panelImages ||
        "{}",
    );
    return ids.every((id) => states[id] === "loaded");
  }, exhibits);
  // Let the periodic raycast and its React caption settle before capture.
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${id}-hall.png` });
  console.log(
    id,
    await page
      .locator(".scene-container canvas")
      .getAttribute("data-panel-images"),
  );
}
const panelImages = JSON.parse(
  await page
    .locator(".scene-container canvas")
    .getAttribute("data-panel-images"),
);
await page.getByRole("button", { name: "Об авторе", exact: true }).click();
await page.screenshot({ path: `${out}/author-desktop.png` });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: `${out}/author-mobile.png` });
const overflow = await page.evaluate(() => ({
  viewport: innerWidth,
  body: document.documentElement.scrollWidth,
  modal: document.querySelector(".modal-body").scrollWidth,
  modalWidth: document.querySelector(".modal-body").clientWidth,
}));
await page.getByRole("button", { name: "Закрыть", exact: true }).click();
await page.setViewportSize({ width: 1440, height: 960 });
await page.getByRole("button", { name: "Каталог", exact: true }).click();
// A contact sheet shows the exact downloaded assets, with no cropping.
await page.evaluate(() => {
  document.querySelector(".modal").style.cssText =
    "width:1400px;max-width:99vw;max-height:none;position:absolute;top:0;transform:none;margin:0 auto;";
  document.querySelector(".modal-body").style.cssText =
    "overflow:visible;max-height:none";
  document.querySelector(".catalog-grid").style.gridTemplateColumns =
    "repeat(4,1fr)";
  document.querySelectorAll("img").forEach((img) => (img.loading = "eager"));
});
await page.waitForFunction(() =>
  [...document.querySelectorAll(".catalog-card img")].every(
    (i) => i.complete && i.naturalWidth > 0,
  ),
);
await page.screenshot({ path: `${out}/collection.png`, fullPage: true });
const report = { errors, failures, panelImages, overflow };
await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
await browser.close();
