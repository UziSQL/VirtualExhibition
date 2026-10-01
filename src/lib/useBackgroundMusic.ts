import { useCallback, useEffect, useRef, useState } from "react";

type MusicStatus =
  "off" | "starting" | "playing" | "suspended" | "blocked" | "error";
const VOLUME = 0.15;
const FADE_SECONDS = 1.8;

/** One player for the whole visit, independent of rooms, tours and scene remounts. */
export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const actions = useRef({ enter: () => {}, toggle: () => {} });
  const [status, setStatus] = useState<MusicStatus>("off");

  useEffect(() => {
    const audio = audioRef.current!;
    let context: AudioContext | undefined;
    let gain: GainNode | undefined;
    let source: MediaElementAudioSourceNode | undefined;
    let fadeTimer: ReturnType<typeof setInterval> | undefined;
    let wanted = false,
      initialized = false,
      interrupted = false;
    let disposed = false,
      pending = false,
      generation = 0;
    let currentStatus: MusicStatus = "off";
    audio.volume = VOLUME;

    const publish = (value: MusicStatus) => {
      currentStatus = value;
      if (!disposed) setStatus(value);
    };
    const silence = () => {
      clearInterval(fadeTimer);
      if (gain && context) {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);
      } else audio.volume = 0;
    };
    const stop = (value: MusicStatus) => {
      generation++;
      pending = false;
      silence();
      audio.pause();
      publish(value);
    };
    const hasExhibitMedia = () =>
      [...document.querySelectorAll<HTMLMediaElement>("audio, video")].some(
        (media) => media !== audio && !media.paused && !media.ended,
      );
    const fadeIn = () => {
      silence();
      if (gain && context) {
        // GainNode also controls volume on iOS, where audio.volume is ignored.
        gain.gain.linearRampToValueAtTime(
          VOLUME,
          context.currentTime + FADE_SECONDS,
        );
      } else {
        const started = performance.now();
        fadeTimer = setInterval(() => {
          const progress = Math.min(
            1,
            (performance.now() - started) / (FADE_SECONDS * 1000),
          );
          audio.volume = VOLUME * progress;
          if (progress === 1) clearInterval(fadeTimer);
        }, 40);
      }
    };
    const start = () => {
      if (disposed || !wanted || pending || currentStatus === "playing") return;
      interrupted = hasExhibitMedia();
      if (interrupted) {
        publish("suspended");
        return;
      }
      if (audio.error) audio.load();
      const ticket = ++generation;
      pending = true;
      publish("starting");
      try {
        if (!context && window.AudioContext) {
          context = new AudioContext();
          gain = context.createGain();
          gain.gain.value = 0;
          source = context.createMediaElementSource(audio);
          source.connect(gain);
          gain.connect(context.destination);
          audio.volume = 1; // Effective output level is controlled by GainNode.
        }
        silence();
        // Both calls must happen inside the user's click, before any await.
        const unlocked = context?.resume();
        const playing = audio.play();
        void Promise.all([unlocked, playing])
          .then(() => {
            if (disposed || ticket !== generation) return;
            pending = false;
            if (context && context.state !== "running") {
              wanted = false;
              stop("blocked");
              return;
            }
            publish("playing");
            fadeIn();
          })
          .catch((error: unknown) => {
            if (disposed || ticket !== generation) return;
            wanted = false;
            stop(
              error instanceof DOMException && error.name === "NotAllowedError"
                ? "blocked"
                : "error",
            );
          });
      } catch {
        wanted = false;
        stop("error");
      }
    };
    const refreshInterruption = () => {
      const active = hasExhibitMedia();
      if (active === interrupted) return;
      interrupted = active;
      if (!wanted) return;
      if (active) stop("suspended");
      else start();
    };
    const onMediaEvent = (event: Event) => {
      if (event.target !== audio && event.target instanceof HTMLMediaElement)
        refreshInterruption();
    };
    const onError = () => {
      wanted = false;
      stop("error");
    };
    const onPause = () => {
      // Reflect an external browser/OS pause without restarting against its wishes.
      if (
        audio.paused &&
        wanted &&
        !interrupted &&
        currentStatus === "playing"
      ) {
        wanted = false;
        stop("blocked");
      }
    };
    const mediaEvents = ["play", "pause", "ended", "emptied"];
    mediaEvents.forEach((name) =>
      document.addEventListener(name, onMediaEvent, true),
    );
    audio.addEventListener("error", onError);
    audio.addEventListener("pause", onPause);
    // Closing a playing exhibit may remove its player without emitting pause.
    const observer = new MutationObserver(refreshInterruption);
    observer.observe(document.body, { childList: true, subtree: true });
    actions.current = {
      enter: () => {
        if (initialized) return;
        initialized = true;
        wanted = true;
        start();
      },
      toggle: () => {
        initialized = true;
        wanted = !wanted;
        if (wanted) start();
        else stop("off");
      },
    };
    return () => {
      disposed = true;
      wanted = false;
      actions.current = { enter: () => {}, toggle: () => {} };
      observer.disconnect();
      mediaEvents.forEach((name) =>
        document.removeEventListener(name, onMediaEvent, true),
      );
      audio.removeEventListener("error", onError);
      audio.removeEventListener("pause", onPause);
      stop("off");
      source?.disconnect();
      gain?.disconnect();
      void context?.close().catch(() => {});
    };
  }, []);

  return {
    audioRef,
    status,
    enabled:
      status === "playing" || status === "starting" || status === "suspended",
    enter: useCallback(() => actions.current.enter(), []),
    toggle: useCallback(() => actions.current.toggle(), []),
  };
}
