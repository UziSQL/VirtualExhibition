import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const out = "artifacts/room-names";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const errors = [],
  failures = [],
  signs = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => failures.push(request.url()));
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(response.url());
  });
  await page.goto("http://127.0.0.1:5173/");
  const canvas = page.locator(".scene-container canvas");
  for (const [i, id] of [
    "history",
    "symbols",
    "heritage",
    "people",
    "region",
    "future",
  ].entries()) {
    const side = i % 2 ? 1 : -1,
      z = Math.floor(i / 2) * 8 - 8;
    await page.locator(`.room-button:has([data-hall-id="${id}"])`).click();
    await page.waitForFunction(
      ({ side, z }) =>
        document.querySelector(".scene-container canvas")?.dataset.position ===
        `${(side * 8.9).toFixed(2)},${z.toFixed(2)}`,
      { side, z },
    );
    // Walk back through the real doorway, then look up at its sign from ~3.5 m.
    await page.keyboard.down("KeyS");
    await page.waitForFunction(
      () =>
        Math.abs(
          parseFloat(
            document.querySelector(".scene-container canvas")?.dataset.position,
          ),
        ) < 1.3,
    );
    await page.keyboard.up("KeyS");
    const box = await canvas.boundingBox();
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    await page.mouse.click(x, y);
    await page.waitForFunction(() => !!document.pointerLockElement);
    await page.mouse.move(x, y - 225);
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${out}/${id}-entrance.png`,
      fullPage: true,
    });
    signs.push({ id, position: await canvas.getAttribute("data-position") });
    console.log(id, signs.at(-1).position);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  }
  await page
    .getByRole("button", { name: "Вернуться в атриум", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector(".scene-container canvas")?.dataset.position ===
      "2.80,8.50",
  );
  await page.screenshot({ path: `${out}/atrium.png`, fullPage: true });
  await page.getByRole("button", { name: "Каталог", exact: true }).click();
  await page.screenshot({ path: `${out}/catalog-desktop.png` });
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('.room-button:has([data-hall-id="symbols"])').click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: `${out}/navigation-${width}.png`,
      fullPage: true,
    });
    await page.locator(".rooms-label").click();
    await page.screenshot({ path: `${out}/map-${width}.png` });
    await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  }
  const fonts = await page.evaluate(() =>
    document.fonts.check('500 72px "Noto Serif Variable"', "Ә Ғ Қ Ң Ө Ұ Ү Һ І"),
  );
  const report = { errors, failures, signs, fonts };
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
