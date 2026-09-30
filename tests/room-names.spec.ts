import { test, expect, type Locator } from "@playwright/test";
import { atrium, halls, type NamedPlace } from "../src/data/museum";

async function expectTitle(title: Locator, place: NamedPlace) {
  await expect(title.locator('[lang="kk"]')).toHaveText(
    `${place.number ? place.number + " " : ""}${place.names.kk}`,
  );
  await expect(title.locator('[lang="ru"]')).toHaveText(place.names.ru);
  await expect(title.locator(".hall-title-number")).toHaveCount(
    place.number ? 1 : 0,
  );
  const layout = await title.evaluate((el) => {
    const primary = el.querySelector<HTMLElement>('[lang="kk"]')!;
    const secondary = el.querySelector<HTMLElement>('[lang="ru"]')!;
    return {
      ratio:
        parseFloat(getComputedStyle(secondary).fontSize) /
        parseFloat(getComputedStyle(primary).fontSize),
      uppercase: getComputedStyle(primary).textTransform,
      below:
        secondary.getBoundingClientRect().top >=
        primary.getBoundingClientRect().bottom,
      fits: [primary, secondary].every(
        (node) => node.scrollWidth <= node.clientWidth + 1,
      ),
    };
  });
  expect(layout.ratio).toBeGreaterThanOrEqual(0.6);
  expect(layout.ratio).toBeLessThanOrEqual(0.7);
  expect(layout.uppercase).toBe("none");
  expect(layout.below).toBe(true);
  expect(layout.fits).toBe(true);
}

test("Полные двуязычные названия: иерархия, каталог, экскурсия и мобильная навигация", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const hall of halls) {
    await expectTitle(
      page.locator(`.room-button [data-hall-id="${hall.id}"]`),
      hall,
    );
  }
  await page
    .getByRole("button", { name: "Начать экскурсию", exact: true })
    .click();
  await expectTitle(page.locator(".tour-card .hall-title"), halls[0]);
  await expect(page.locator(".tour-exhibit-title")).toHaveText(
    "Первый шаг к суверенитету",
  );
  await page
    .getByRole("button", { name: "Завершить экскурсию", exact: true })
    .click();
  await page.getByRole("button", { name: "Каталог", exact: true }).click();
  for (const hall of halls) {
    await expectTitle(
      page.locator(`.filter-row [data-hall-id="${hall.id}"]`),
      hall,
    );
    await expectTitle(
      page.locator(`.catalog-card [data-hall-id="${hall.id}"]`).first(),
      hall,
    );
  }
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const hall of halls) {
      const title = page.locator(`.room-button [data-hall-id="${hall.id}"]`);
      await title.click(); // Automatically scrolls the actual navigation strip.
      await expectTitle(title, hall);
      await expectTitle(page.locator(".location-tag .hall-title"), hall);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.locator(".rooms-label").click();
    await expectTitle(page.locator(".map-atrium .hall-title"), atrium);
    for (const hall of halls) {
      await expectTitle(
        page.locator(`.map-room [data-hall-id="${hall.id}"]`),
        hall,
      );
    }
    expect(
      await page
        .locator(".modal-body")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  }
  expect(errors).toEqual([]);
});
