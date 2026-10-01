import { test, expect, type Page } from "@playwright/test";

const player = "audio[data-background-music]";
const musicButton = ".viewer-tools button[aria-pressed]";
type AudioProbe = {
  gain: GainNode;
  analyser: AnalyserNode;
  sources: number;
  ramps: { from: number; to: number; seconds: number }[];
};
type ProbedWindow = Window & { audioProbe: AudioProbe };

async function expectPlaying(page: Page) {
  await expect
    .poll(() =>
      page
        .locator(player)
        .evaluate(
          (el: HTMLAudioElement) =>
            !el.paused && el.currentTime > 0 && el.readyState >= 2,
        ),
    )
    .toBe(true);
}

test("Музыка: вход, тихое плавное включение, переходы, один плеер, экспонаты и повтор трека", async ({
  page,
}) => {
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const probe = { sources: 0, ramps: [] } as unknown as AudioProbe;
    (window as ProbedWindow).audioProbe = probe;
    const createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      const gain = createGain.call(this);
      probe.gain = gain;
      probe.analyser = this.createAnalyser();
      gain.connect(probe.analyser);
      const ramp = gain.gain.linearRampToValueAtTime.bind(gain.gain);
      gain.gain.linearRampToValueAtTime = (value, time) => {
        probe.ramps.push({
          from: gain.gain.value,
          to: value,
          seconds: time - this.currentTime,
        });
        return ramp(value, time);
      };
      return gain;
    };
    const createSource = AudioContext.prototype.createMediaElementSource;
    AudioContext.prototype.createMediaElementSource = function (media) {
      probe.sources++;
      return createSource.call(this, media);
    };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(player)).toHaveCount(1);
  expect(
    await page
      .locator(player)
      .evaluate((el: HTMLAudioElement) => el.paused && el.currentTime === 0),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Войти в музей", exact: true })
    .click();
  await expectPlaying(page);
  await expect
    .poll(() =>
      page.evaluate(() => (window as ProbedWindow).audioProbe.gain.gain.value),
    )
    .toBeCloseTo(0.15, 3);
  const ramp = await page.evaluate(
    () => (window as ProbedWindow).audioProbe.ramps[0],
  );
  expect(ramp.from).toBe(0);
  expect(ramp.to).toBe(0.15);
  expect(ramp.seconds).toBeGreaterThan(1.5);
  // Check decoded, non-silent audio at the actual output gain, not just play() calls.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const analyser = (window as ProbedWindow).audioProbe.analyser;
        const samples = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(samples);
        return samples.some((sample) => Math.abs(sample) > 0.00001);
      }),
    )
    .toBe(true);
  const beforeNavigation = await page
    .locator(player)
    .evaluate((el: HTMLAudioElement) => el.currentTime);
  for (const id of ["history", "heritage", "region"]) {
    await page.locator(`.room-button:has([data-hall-id="${id}"])`).click();
    await expectPlaying(page);
  }
  expect(
    await page
      .locator(player)
      .evaluate((el: HTMLAudioElement) => el.currentTime),
  ).toBeGreaterThan(beforeNavigation);
  await page.locator(musicButton).click();
  await expect
    .poll(() =>
      page.locator(player).evaluate((el: HTMLAudioElement) => el.paused),
    )
    .toBe(true);
  await page.locator('.room-button:has([data-hall-id="future"])').click();
  await expect(page.locator(musicButton)).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  const pausedAt = await page
    .locator(player)
    .evaluate((el: HTMLAudioElement) => el.currentTime);
  await page.locator(musicButton).click();
  await expectPlaying(page);
  expect(
    await page
      .locator(player)
      .evaluate((el: HTMLAudioElement) => el.currentTime),
  ).toBeGreaterThanOrEqual(pausedAt);

  // Audio and video players can overlap; the background waits for both to stop.
  await page.evaluate(async () => {
    for (const tag of ["audio", "video"] as const) {
      const media = document.createElement(tag);
      media.id = `exhibit-${tag}`;
      media.src = document.querySelector<HTMLAudioElement>(
        "audio[data-background-music]",
      )!.currentSrc;
      media.muted = true;
      document.body.append(media);
      await media.play();
    }
  });
  await expect
    .poll(() =>
      page.locator(player).evaluate((el: HTMLAudioElement) => el.paused),
    )
    .toBe(true);
  await page
    .locator("#exhibit-audio")
    .evaluate((el: HTMLAudioElement) => el.pause());
  expect(
    await page.locator(player).evaluate((el: HTMLAudioElement) => el.paused),
  ).toBe(true);
  await page.locator("#exhibit-video").evaluate((el) => el.remove());
  await expectPlaying(page);
  await page
    .locator("#exhibit-audio")
    .evaluate((el: HTMLAudioElement) => el.play());
  await expect
    .poll(() =>
      page.locator(player).evaluate((el: HTMLAudioElement) => el.paused),
    )
    .toBe(true);
  await page.locator(musicButton).click();
  await page.locator("#exhibit-audio").evaluate((el) => el.remove());
  expect(
    await page.locator(player).evaluate((el: HTMLAudioElement) => el.paused),
  ).toBe(true);
  await page.locator(musicButton).click();
  await expectPlaying(page);

  // The same media element loops and survives rapid toggles and scene remounts.
  await page.locator(player).evaluate((el: HTMLAudioElement) => {
    el.currentTime = el.duration - 0.3;
  });
  await expect
    .poll(() =>
      page
        .locator(player)
        .evaluate((el: HTMLAudioElement) => el.currentTime < 10 && !el.paused),
    )
    .toBe(true);
  await page.locator(musicButton).evaluate((el: HTMLButtonElement) => {
    el.click();
    el.click();
    el.click();
  });
  await expect(page.locator(musicButton)).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.locator(musicButton).click();
  await expectPlaying(page);
  await page.locator(".brand").click();
  await page
    .getByRole("button", { name: "Начать экскурсию", exact: true })
    .click();
  await expectPlaying(page);
  await expect(page.locator(player)).toHaveCount(1);
  expect(
    await page.evaluate(() => (window as ProbedWindow).audioProbe.sources),
  ).toBe(1);
  expect(errors).toEqual([]);
});

test("Блокировка музыки браузером: доступно ручное включение", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let blockedOnce = false;
    HTMLMediaElement.prototype.play = function () {
      if (this.matches("[data-background-music]") && !blockedOnce) {
        blockedOnce = true;
        return Promise.reject(
          new DOMException("Autoplay blocked", "NotAllowedError"),
        );
      }
      return play.call(this);
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Войти в музей", exact: true })
    .click();
  await expect(page.locator(musicButton)).toHaveAttribute(
    "aria-label",
    "Включить фоновую музыку",
  );
  await expect(page.locator(musicButton)).toHaveAttribute(
    "title",
    /Браузер приостановил/,
  );
  expect(
    await page.locator(player).evaluate((el: HTMLAudioElement) => el.paused),
  ).toBe(true);
  await page.locator(musicButton).click();
  await expectPlaying(page);
  expect(errors).toEqual([]);
});

test("Мобильная кнопка музыки: ошибка файла, повторная загрузка и выключение", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/audio/moonlight.mp3", (route) => route.abort());
  await page.goto("/");
  await page
    .getByRole("button", { name: "Войти в музей", exact: true })
    .click();
  await expect(page.locator(musicButton)).toHaveAttribute(
    "aria-label",
    "Повторить загрузку фоновой музыки",
  );
  await page.unroute("**/audio/moonlight.mp3");
  await page.locator(musicButton).click();
  await expectPlaying(page);
  await expect(page.locator(musicButton)).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.locator(musicButton).click();
  expect(
    await page.locator(player).evaluate((el: HTMLAudioElement) => el.paused),
  ).toBe(true);
});
