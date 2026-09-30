import { test, expect } from "@playwright/test";
test("Каталог, вопросы, паспорт, сохранение и сброс", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Каталог", exact: true }).click();
  await page.getByRole("button", { name: /Первый шаг к суверенитету/ }).click();
  await expect(page.getByRole("dialog")).toContainText("25 октября 1990");
  await page
    .getByRole("button", { name: /Принятие закона о независимости/ })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Попробуйте" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Принятие Декларации о суверенитете/ })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Верно!" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /Мой паспорт/ }).click();
  await expect(page.getByRole("dialog")).toContainText("1 из 6");
  await expect(page.locator(".stamp.collected")).toHaveCount(1);
  await expect(page.getByRole("dialog")).toContainText("Ожидает материалов");
  await page.reload();
  await page.getByRole("button", { name: /Мой паспорт/ }).click();
  await expect(page.locator(".stamp.collected")).toHaveCount(1);
  await expect(page.getByRole("dialog")).toContainText("Вопрос решён");
  await page
    .getByRole("button", { name: "Сбросить прогресс", exact: true })
    .click();
  await page.getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(page.locator(".stamp.collected")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Сбросить прогресс", exact: true })
    .click();
  await page.getByRole("button", { name: "Да, сбросить всё" }).click();
  await expect(page.locator(".stamp.collected")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("3D, навигация, движение, столкновения, E и модальная блокировка", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Войти в музей", exact: true }),
  ).toBeEnabled();
  await page.screenshot({ path: "test-results/desktop.png" });
  await page
    .getByRole("button", { name: "Войти в музей", exact: true })
    .click();
  const canvas = page.locator(".scene-container canvas");
  await expect(canvas).toHaveAttribute("data-position", /2\.8\d,8\.5\d/);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(700);
  await page.keyboard.up("KeyW");
  const moved = await canvas.getAttribute("data-position");
  expect(moved).not.toMatch(/2\.8\d,8\.5\d/);
  await canvas.click({ position: { x: 650, y: 340 } });
  await expect
    .poll(() => page.evaluate(() => !!document.pointerLockElement))
    .toBe(true);
  await page.mouse.move(730, 400);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toContainText(
    "Продолжим путешествие?",
  );
  await expect
    .poll(() => page.evaluate(() => !!document.pointerLockElement))
    .toBe(false);
  await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  await page.getByRole("button", { name: "01 История" }).click();
  await expect(canvas).toHaveAttribute("data-position", /-10\.0\d,-8\.0\d/, {
    timeout: 30000,
  });
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(1800);
  await page.keyboard.up("KeyW");
  await expect(canvas).toHaveAttribute("data-walkable", "true");
  const pos = (await canvas.getAttribute("data-position"))!
    .split(",")
    .map(Number);
  expect(pos[0]).toBeGreaterThan(-12.6);
  await page.keyboard.press("KeyE");
  await expect(page.getByRole("dialog")).toBeVisible();
  const before = await canvas.getAttribute("data-position");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(400);
  await page.keyboard.up("KeyW");
  expect(await canvas.getAttribute("data-position")).toBe(before);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toContainText(
    "Продолжим путешествие?",
  );
});
test("Экскурсия, пауза, переходы и завершение", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Начать экскурсию", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Начать экскурсию", exact: true })
    .click();
  await expect(page.locator(".tour-card")).toContainText("Первый шаг");
  await expect(page.locator(".tour-card")).toContainText("ОСТАНОВКА", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Пауза", exact: true }).click();
  const canvas = page.locator(".scene-container canvas");
  const position = await canvas.getAttribute("data-position");
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(400);
  await page.keyboard.up("KeyW");
  expect(await canvas.getAttribute("data-position")).toBe(position);
  await page.getByRole("button", { name: "Далее", exact: true }).click();
  await expect(page.locator(".tour-card")).toContainText("Новая глава");
  await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  await expect(page.locator(".tour-card")).toContainText("ОСТАНОВКА");
  await page.getByRole("button", { name: "Назад", exact: true }).click();
  await expect(page.locator(".tour-card")).toContainText("Первый шаг");
  await page
    .getByRole("button", { name: "Завершить экскурсию", exact: true })
    .click();
  await expect(page.locator(".tour-card")).not.toBeVisible();
});
test("Пожелание остаётся локальным; портреты и символы загружаются", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Каталог", exact: true }).click();
  await expect(page.locator(".catalog-card img")).toHaveCount(5);
  await expect
    .poll(() =>
      page
        .locator(".catalog-card img")
        .evaluateAll((imgs) =>
          imgs.every(
            (i) =>
              (i as HTMLImageElement).complete &&
              (i as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await page.getByRole("button", { name: /Сохранить и передать/ }).click();
  await page
    .getByLabel("Моё пожелание Казахстану")
    .fill("Пусть знания открывают новые пути!");
  await page.getByRole("button", { name: "Сохранить пожелание" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Пожелание сохранено на этом устройстве.",
  );
  await page.reload();
  await page.getByRole("button", { name: "Каталог", exact: true }).click();
  await page.getByRole("button", { name: /Сохранить и передать/ }).click();
  await expect(page.getByLabel("Моё пожелание Казахстану")).toHaveValue(
    "Пусть знания открывают новые пути!",
  );
});
test("Мобильный экран: каталог, джойстик и обзор", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Войти в музей", exact: true }),
  ).toBeEnabled();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .getByRole("button", { name: "Войти в музей", exact: true })
    .click();
  await expect(page.locator(".joystick")).toBeVisible();
  await expect(page.locator(".look-pad")).toBeVisible();
  const canvas = page.locator(".scene-container canvas");
  await expect(canvas).toHaveAttribute("data-position", /2\.8\d,8\.5\d/);
  const before = await canvas.getAttribute("data-position");
  const stick = (await page.locator(".joystick").boundingBox())!;
  await page.mouse.move(stick.x + stick.width / 2, stick.y + 20);
  await page.mouse.down();
  await expect
    .poll(() => canvas.getAttribute("data-position"))
    .not.toBe(before);
  await page.mouse.up();
  const look = (await page.locator(".look-pad").boundingBox())!;
  await page.mouse.move(look.x + 30, look.y + 30);
  await page.mouse.down();
  await page.mouse.move(look.x + 70, look.y + 30, { steps: 5 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: "Каталог", exact: true }).click();
  await page.getByRole("button", { name: /Две струны/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Стилизованная иллюстрация",
  );
  await expect(
    page.getByRole("slider", { name: "Поворот модели" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/mobile-exhibit.png" });
  await page.setViewportSize({ width: 320, height: 720 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await context.close();
});
test("Полная экскурсия с уменьшением движения даёт пять честных отметок", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Начать экскурсию", exact: true })
    .click();
  for (let i = 0; i < 14; i++) {
    await expect(page.locator(".tour-card")).toContainText(
      `ЭКСКУРСИЯ · ${i + 1}/14`,
    );
    await expect(page.locator(".tour-card")).toContainText("ОСТАНОВКА");
    await expect(page.locator(".scene-container canvas")).toHaveAttribute(
      "data-walkable",
      "true",
    );
    await page
      .getByRole("button", {
        name: i === 13 ? "Завершить" : "Далее",
        exact: true,
      })
      .click();
  }
  await expect(page.locator(".tour-card")).not.toBeVisible();
  await page.getByRole("button", { name: /Мой паспорт/ }).click();
  await expect(page.locator(".stamp.collected")).toHaveCount(5);
  await expect(page.getByRole("dialog")).toContainText("Ожидает материалов");
});
test("Без WebGL открывается тот же каталог; ошибка картинки не ломает музей", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === "webgl2") return null;
      return original.apply(this, [type, ...args] as never);
    } as typeof original;
  });
  await page.route("**/images/flag.svg", (r) => r.abort());
  await page.goto("/");
  await expect(page.getByText("Музей доступен в каталоге")).toBeVisible();
  await page
    .getByRole("button", { name: "Открыть каталог", exact: true })
    .click();
  await page.getByRole("button", { name: /Под единым небом/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Изображение недоступно",
  );
  await expect(page.getByRole("dialog")).toContainText("Шакен Ниязбеков");
});
