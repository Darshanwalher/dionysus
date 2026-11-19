/**
 * usePerfTier: automatically adapts animation work to power state and real frame rate.
 *
 *   "high"  plugged in and running at ~60/120+ fps: full 3D, particle ripples, crisp 1:1 scrub.
 *   "mid"   on battery, energy saver, or ~35-50 fps: buttery-smooth 2D GPU transforms,
 *           smoothed scrub (0.7) that eliminates trackpad jitter, zero compositor stalls.
 *   "low"   lightest: native compositor scrolling, simplified loops.
 *
 * How it reacts:
 *  - unplug the charger  -> drops to "mid" immediately, preserving silky 60fps scrolling without dropped frames.
 *  - plug back in        -> restores "high" performance mode once plugged in and frames are fast.
 *  - ?perf=high | mid | low in the URL forces a tier for testing.
 */
import { useEffect, useState } from "react";

const listeners = new Set();
let tier = "high";
let started = false;
let onBattery = false;

const fpsToTier = (fps) => (fps >= 48 ? "high" : fps >= 30 ? "mid" : "low");
// While on battery never claim "high", so battery life is preserved and animations never hitch
const cap = (t) => (onBattery && t === "high" ? "mid" : t);

function setTier(next) {
  if (next === tier) return;
  tier = next;
  if (typeof document !== "undefined") {
    document.documentElement.dataset.perf = next;
    document.documentElement.dataset.battery = String(onBattery);
  }
  listeners.forEach((fn) => fn(next));
}

/** Median fps over ~45 frames (first frames are skipped: warm-up). */
function probe(frames = 45) {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    const dts = [];
    let last = performance.now();
    let warm = 6;
    const loop = (now) => {
      const dt = now - last;
      last = now;
      if (warm-- <= 0 && dt < 250) dts.push(dt);
      if (document.hidden) return resolve(null);
      if (dts.length < frames) return requestAnimationFrame(loop);
      dts.sort((a, b) => a - b);
      resolve(1000 / dts[Math.floor(dts.length / 2)]);
    };
    requestAnimationFrame(loop);
  });
}

const remeasure = () =>
  probe().then((fps) => {
    if (fps) setTier(cap(fpsToTier(fps)));
  });

/** Keeps watching for sustained drops in frame rate. */
function monitor() {
  let bad = 0;
  let buf = [];
  let last = performance.now();
  const loop = (now) => {
    if (tier === "low") return;
    const dt = now - last;
    last = now;
    if (!document.hidden && dt < 250) buf.push(dt);
    if (buf.length >= 75) {
      buf.sort((a, b) => a - b);
      const fps = 1000 / buf[37];
      buf = [];
      if (fps < (tier === "high" ? 42 : 28)) {
        if (++bad >= 2) {
          setTier(tier === "high" ? "mid" : "low");
          bad = 0;
        }
      } else {
        bad = 0;
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  document.documentElement.dataset.perf = tier;
  document.documentElement.dataset.battery = String(onBattery);

  // Testing switch: ?perf=high | mid | low
  const forced = new URLSearchParams(window.location.search).get("perf");
  if (forced === "high" || forced === "mid" || forced === "low") {
    setTier(forced);
    return;
  }

  // Power state API (Chromium / Edge / Opera)
  navigator.getBattery?.()
    .then((b) => {
      const apply = () => {
        onBattery = !b.charging;
        document.documentElement.dataset.battery = String(onBattery);
        if (onBattery) {
          if (tier === "high") setTier("mid");
          setTimeout(remeasure, 1800);
        } else {
          // Plugged in -> recheck and promote back to high if fast
          setTimeout(() => {
            probe(30).then((fps) => {
              if (fps && fps >= 48) setTier("high");
            });
          }, 1200);
        }
      };
      onBattery = !b.charging;
      document.documentElement.dataset.battery = String(onBattery);
      if (onBattery && tier === "high") setTier("mid");
      b.addEventListener("chargingchange", apply);
    })
    .catch(() => {});

  const run = () =>
    probe().then((fps) => {
      if (fps) setTier(cap(fpsToTier(fps)));
      monitor();
    });
  if (document.readyState === "complete") setTimeout(run, 600);
  else window.addEventListener("load", () => setTimeout(run, 600), { once: true });
}

export default function usePerfTier() {
  const [t, setT] = useState(tier);
  useEffect(() => {
    start();
    listeners.add(setT);
    setT(tier);
    return () => listeners.delete(setT);
  }, []);
  return t;
}

export const isOnBattery = () => onBattery;
export const getPerfTier = () => tier;
