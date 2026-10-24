#!/usr/bin/env node
/**
 * Screenshot helper driven through the Chrome DevTools Protocol.
 *
 * Headless Chrome on Windows clamps --window-size to roughly 500px wide, which
 * makes it useless for checking a 390px phone layout. Driving CDP lets us set
 * real device metrics, force dark mode and capture the full page.
 *
 * Usage:
 *   node tools/shoot.mjs <url> <out.png> [--w 1440] [--h 900] [--mobile] [--dark] [--viewport]
 *
 *   --mobile    use mobile emulation (device scale 2, touch, mobile UA)
 *   --dark      apply the site's dark class before capturing
 *   --viewport  capture only the viewport instead of the full page
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME =
  process.env.CHROME_PATH ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

const argv = process.argv.slice(2);
const [url, out] = argv;
if (!url || !out) {
  console.error("usage: node tools/shoot.mjs <url> <out.png> [--w N] [--h N] [--mobile] [--dark] [--viewport]");
  process.exit(1);
}

const flag = (name) => argv.includes(`--${name}`);
const value = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : fallback;
};

const width = value("w", 1440);
const height = value("h", 900);
const mobile = flag("mobile");
const themeArg = (() => {
  const i = argv.indexOf("--theme");
  return i >= 0 ? argv[i + 1] : null;
})();
const dark = themeArg ? themeArg === "dark" : flag("dark");
const forceTheme = Boolean(themeArg) || dark;
const viewportOnly = flag("viewport");

const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(path.join(tmpdir(), "cdp-"));

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--force-color-profile=srgb",
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${port}`,
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDevTools() {
  for (let i = 0; i < 100; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(150);
  }
  throw new Error("Chrome DevTools endpoint never came up");
}

async function openTarget() {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
    method: "PUT",
  });
  return res.json();
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const events = new Map();

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
      return;
    }
    const waiter = events.get(msg.method);
    if (waiter) {
      events.delete(msg.method);
      waiter(msg.params);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  const once = (method) =>
    new Promise((resolve) => events.set(method, resolve));

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });

  return { ready, send, once, close: () => ws.close() };
}

const main = async () => {
  await waitForDevTools();
  const target = await openTarget();
  const cdp = connect(target.webSocketDebuggerUrl);
  await cdp.ready;

  await cdp.send("Page.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: mobile ? 2 : 1,
    mobile,
  });
  if (mobile) {
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
    await cdp.send("Emulation.setUserAgentOverride", {
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
      platform: "Android",
    });
  }
  if (forceTheme) {
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }],
    });
  }

  const loaded = cdp.once("Page.loadEventFired");
  await cdp.send("Page.navigate", { url });
  await loaded;
  await sleep(1200);

  if (forceTheme) {
    // Mirror what the in-app toggle does so the class-based theme is applied.
    const expr = dark
      ? "localStorage.setItem('theme','dark');document.documentElement.classList.add('dark');"
      : "localStorage.setItem('theme','light');document.documentElement.classList.remove('dark');";
    await cdp.send("Runtime.evaluate", { expression: expr });
    await sleep(350);
  }

  const metrics = await cdp.send("Page.getLayoutMetrics");
  const content = metrics.cssContentSize ?? metrics.contentSize;
  const clip = viewportOnly
    ? { x: 0, y: 0, width, height, scale: 1 }
    : {
        x: 0,
        y: 0,
        width,
        height: Math.min(content.height, 20000),
        scale: 1,
      };

  const shot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: !viewportOnly,
    clip,
  });

  writeFileSync(out, Buffer.from(shot.data, "base64"));
  const kb = (Buffer.from(shot.data, "base64").length / 1024).toFixed(0);
  console.log(
    `${out}  ${width}x${Math.round(clip.height)}  ${kb} KB  ${forceTheme ? (dark ? "dark" : "light") : "system"}${mobile ? "  mobile" : ""}`,
  );

  cdp.close();
  chrome.kill();
  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  chrome.kill();
  process.exit(1);
});
