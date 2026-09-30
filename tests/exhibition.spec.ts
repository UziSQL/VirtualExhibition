import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("Все шесть залов показывают фотографии и иллюстрации на 3D-стендах", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => errors.push(request.url()));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(response.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = page.locator(".scene-container canvas");
  const rooms = [
    ["history", ["declaration", "independence", "timeline"]],
    ["symbols", ["flag", "emblem", "anthem"]],
    ["heritage", ["dombra", "yurt", "ornament"]],
    ["people", ["abai", "shokan", "satpayev"]],
    ["region", ["shahtinsk", "dolinka", "karkaraly"]],
    ["future", ["learn", "care"]],
  ] as const;
  await mkdir("artifacts/review", { recursive: true });
  for (const [name, ids] of rooms) {
    await page.locator(`.room-button:has([data-hall-id="${name}"])`).click();
    await expect(
      page.locator(".room-button.current .hall-title"),
    ).toHaveAttribute("data-hall-id", name);
    await expect
      .poll(async () => {
        const states = JSON.parse(
          (await canvas.getAttribute("data-panel-images")) || "{}",
        );
        return ids.every((id) => states[id] === "loaded");
      })
      .toBe(true);
    if (name === "heritage")
      await page.screenshot({ path: "artifacts/review/heritage-hall.png" });
  }
  const states = JSON.parse(
    (await canvas.getAttribute("data-panel-images")) || "{}",
  );
  expect(Object.keys(states)).toHaveLength(17);
  expect(errors).toEqual([]);
});

test("Автор, полное название школы, лицензии и тексты на мобильном экране", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".school-credit").click();
  await expect(page.getByRole("dialog")).toContainText("Об авторе выставки");
  await expect(page.locator(".author-name")).toHaveText("Шайхина А.У.");
  await expect(page.locator(".credits-list")).toContainText(
    "Учитель казахского языка и литературы.",
  );
  const organization = page.locator(".credits-list dd").nth(2);
  await expect(organization).toHaveText(
    "Коммунальное государственное учреждение «Общеобразовательная школа № 6» отдела образования города Шахтинска управления образования Карагандинской области.",
  );
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await organization.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await mkdir("artifacts/review", { recursive: true });
  await page.screenshot({ path: "artifacts/review/author-mobile.png" });
  await page
    .getByRole("button", { name: "Источники и материалы", exact: true })
    .last()
    .click();
  await expect(page.locator(".sources-list .license-link")).toHaveCount(8);
  await expect(page.getByRole("dialog")).not.toContainText(
    /сохранены локально|в эту версию|React|Three\.js|WebGL|localStorage|Авторы выставки ещё/,
  );
});

test("Сбой фотографии: история доступна, повторная загрузка восстанавливает 3D-стенд", async ({
  page,
}) => {
  await page.route("**/images/yurt.jpg", (route) => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: /03 Мәдени мұра/ }).click();
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page
            .locator(".scene-container canvas")
            .getAttribute("data-panel-images")) || "{}",
        ).yurt,
    )
    .toBe("error");
  await expect(page.locator(".image-load-notice")).toContainText(
    "Повторить загрузку изображений",
  );
  await page.getByRole("button", { name: "Каталог", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Дом, который путешествует/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Изображение недоступно",
  );
  await expect(page.getByRole("dialog")).toContainText(
    "Юрта — переносное жилище",
  );
  await page.unroute("**/images/yurt.jpg");
  await page
    .getByRole("dialog")
    .getByRole("button", {
      name: "Повторить загрузку изображений",
      exact: true,
    })
    .click();
  await expect(page.locator(".exhibit-figure img")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".exhibit-figure img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page
            .locator(".scene-container canvas")
            .getAttribute("data-panel-images")) || "{}",
        ).yurt,
    )
    .toBe("loaded");
  await expect(page.locator(".image-load-notice")).not.toBeVisible();
});
