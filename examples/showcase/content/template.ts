// The look of the showcase slides. Everything inside the device frame is
// drawn with plain HTML/CSS — no app, no simulator, no image assets.

import type { RenderContext } from "store-shots";
import { accentHtml, escapeHtml } from "store-shots/html";

import { canvas } from "./config";
import type { Slide } from "./config";

// ---------------------------------------------------------------------------
// Layout constants (canvas is 1320x2868)

const CONTENT_ZONE = 760;
const DEVICE_WIDTH = 990;
const DEVICE_HEIGHT = 1980;
const DEVICE_BOTTOM = 90;

// ---------------------------------------------------------------------------
// Tone tokens: the marketing canvas and the mock UI both flip with the tone.

interface Tokens {
  accent: string;
  appBg: string;
  appCard: string;
  appText: string;
  appTextSub: string;
  badgeBg: string;
  badgeFg: string;
  textMain: string;
  textSub: string;
}

const LIGHT: Tokens = {
  accent: "#1663D9",
  appBg: "#F6F8FC",
  appCard: "#FFFFFF",
  appText: "#1C2433",
  appTextSub: "#8A94A8",
  badgeBg: "#1663D9",
  badgeFg: "#FFFFFF",
  textMain: "#0B2545",
  textSub: "rgba(11, 37, 69, 0.6)",
};

const DARK: Tokens = {
  accent: "#5CC0FF",
  appBg: "#0E1526",
  appCard: "#1A2338",
  appText: "#F2F5FB",
  appTextSub: "#7E88A0",
  badgeBg: "#5CC0FF",
  badgeFg: "#06182E",
  textMain: "#FFFFFF",
  textSub: "rgba(255, 255, 255, 0.72)",
};

// ---------------------------------------------------------------------------
// Mock to-do UI

interface Task {
  done?: boolean;
  label: string;
  tag?: string;
}

const TASKS: Task[] = [
  { done: true, label: "Buy oat milk", tag: "#7ED2A8" },
  { done: true, label: "Ship the design review", tag: "#F2B84B" },
  { label: "Book dentist appointment" },
  { label: "Water the plants", tag: "#7ED2A8" },
  { label: "Reply to Mia" },
  { label: "Plan the weekend trip", tag: "#F2B84B" },
  { label: "Read 20 pages" },
];

const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.2 4.3L19 7" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const statusBarHtml = (t: Tokens): string => `
  <div class="statusbar">
    <span>9:41</span>
    <span class="statusicons">
      <svg width="34" height="24" viewBox="0 0 34 24"><g fill="${t.appText}"><rect x="0" y="14" width="6" height="9" rx="1.5"/><rect x="9" y="10" width="6" height="13" rx="1.5"/><rect x="18" y="6" width="6" height="17" rx="1.5"/><rect x="27" y="2" width="6" height="21" rx="1.5"/></g></svg>
      <svg width="48" height="24" viewBox="0 0 48 24"><rect x="1" y="3" width="40" height="18" rx="5" fill="none" stroke="${t.appText}" stroke-width="2.4"/><rect x="4.5" y="6.5" width="30" height="11" rx="2.5" fill="${t.appText}"/><rect x="43" y="8.5" width="4" height="7" rx="2" fill="${t.appText}"/></svg>
    </span>
  </div>`;

const taskRowHtml = (t: Tokens, task: Task): string => {
  const box = task.done
    ? `<span class="check done">${CHECK_SVG}</span>`
    : `<span class="check"></span>`;
  const tag = task.tag
    ? `<span class="tag" style="background:${task.tag}"></span>`
    : "";
  const cls = task.done ? "task task-done" : "task";
  return `<div class="${cls}">${box}<span class="task-label">${escapeHtml(task.label)}</span>${tag}</div>`;
};

const listScreenHtml = (t: Tokens): string => `
  ${statusBarHtml(t)}
  <div class="apphead">
    <div class="apptitle">Today</div>
    <div class="appsub">Monday &middot; 5 left</div>
  </div>
  <div class="tasks">${TASKS.map((task) => taskRowHtml(t, task)).join("")}</div>
  <div class="fab"><svg width="52" height="52" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg></div>`;

const addSheetHtml = (t: Tokens): string => `
  ${listScreenHtml(t)}
  <div class="dim"></div>
  <div class="sheet">
    <div class="handle"></div>
    <div class="field">Call the bank<span class="caret"></span></div>
    <div class="chips"><span class="chip chip-on">Today</span><span class="chip">Tomorrow</span><span class="chip">Someday</span></div>
    <div class="addbtn">Add task</div>
  </div>`;

// ---------------------------------------------------------------------------
// Slide bodies

const deviceHtml = (slide: Slide, t: Tokens): string => {
  const screen = slide.screen === "add" ? addSheetHtml(t) : listScreenHtml(t);
  const frame =
    slide.tone === "dark"
      ? "linear-gradient(150deg, #54565a, #2c2e31 46%, #45474a)"
      : "linear-gradient(150deg, #f1f2f5, #c1c4ca 46%, #e3e5e9)";
  return `
      <div class="device" style="background:${frame}">
        <div class="bezel"><div class="screen">${screen}</div></div>
      </div>`;
};

const standardBodyHtml = (slide: Slide, t: Tokens): string => {
  const badge = slide.badge
    ? `<div class="badge">${escapeHtml(slide.badge)}</div>`
    : "";
  const pr = slide.pr.lines
    .map((line) => `<div>${accentHtml(line, slide.pr.accent)}</div>`)
    .join("");
  return `
      <div class="content">
        <div class="pr">${pr}</div>
        <div class="sub">${escapeHtml(slide.sub)}</div>
        ${badge}
      </div>
      ${deviceHtml(slide, t)}`;
};

const iconBodyHtml = (slide: Slide): string => {
  const pr = slide.pr.lines
    .map((line) => `<div>${accentHtml(line, slide.pr.accent)}</div>`)
    .join("");
  return `
      <div class="pr pr-icon">${pr}</div>
      <div class="app-icon">${CHECK_SVG}</div>
      <div class="sub sub-icon">${escapeHtml(slide.sub)}</div>`;
};

// ---------------------------------------------------------------------------

export const renderSlideHtml = (slide: Slide, _ctx: RenderContext): string => {
  const t = slide.tone === "dark" ? DARK : LIGHT;
  const body =
    slide.screen === "icon" ? iconBodyHtml(slide) : standardBodyHtml(slide, t);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${canvas.width}px; height: ${canvas.height}px; }
  .canvas {
    position: relative;
    width: ${canvas.width}px; height: ${canvas.height}px;
    overflow: hidden;
    background: linear-gradient(168deg, ${slide.bg[0]}, ${slide.bg[1]});
    font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif;
  }

  /* --- marketing copy zone --- */
  .content {
    position: absolute; top: 0; left: 140px;
    width: 1040px; height: ${CONTENT_ZONE}px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 30px; padding-top: 90px;
  }
  .pr {
    font-size: 104px; line-height: 122px; font-weight: 800;
    letter-spacing: -0.022em; color: ${t.textMain}; text-align: center;
  }
  .pr .accent { color: ${t.accent}; }
  .sub { font-size: 44px; font-weight: 500; color: ${t.textSub}; text-align: center; }
  .badge {
    margin-top: 4px; padding: 16px 42px; border-radius: 999px;
    background: ${t.badgeBg}; color: ${t.badgeFg}; font-size: 40px; font-weight: 700;
  }

  /* --- device frame --- */
  .device {
    position: absolute; left: ${(canvas.width - DEVICE_WIDTH) / 2}px; bottom: ${DEVICE_BOTTOM}px;
    width: ${DEVICE_WIDTH}px; height: ${DEVICE_HEIGHT}px;
    padding: 6px; border-radius: 150px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35), 0 48px 100px rgba(0, 0, 0, 0.45);
  }
  .bezel { width: 100%; height: 100%; padding: 16px; border-radius: 144px; background: #060606; }
  .screen {
    position: relative; width: 100%; height: 100%;
    border-radius: 128px; overflow: hidden; background: ${t.appBg};
    color: ${t.appText};
  }

  /* --- mock to-do UI --- */
  .statusbar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 40px 70px 0; font-size: 40px; font-weight: 600;
  }
  .statusicons { display: flex; gap: 14px; align-items: center; }
  .apphead { padding: 60px 64px 36px; }
  .apptitle { font-size: 92px; font-weight: 800; letter-spacing: -0.02em; }
  .appsub { margin-top: 12px; font-size: 40px; font-weight: 500; color: ${t.appTextSub}; }
  .tasks { display: flex; flex-direction: column; gap: 22px; padding: 0 48px; }
  .task {
    display: flex; align-items: center; gap: 32px;
    background: ${t.appCard}; border-radius: 36px; padding: 38px 44px;
    box-shadow: 0 6px 24px rgba(12, 24, 48, ${slide.tone === "dark" ? "0.5" : "0.06"});
  }
  .check {
    width: 56px; height: 56px; flex: none; border-radius: 50%;
    border: 4px solid ${t.appTextSub};
  }
  .check.done { border-color: ${t.accent}; background: ${t.accent}; padding: 8px; }
  .check svg { display: block; width: 100%; height: 100%; }
  .task-label { font-size: 45px; font-weight: 600; flex: 1; }
  .task-done .task-label { color: ${t.appTextSub}; text-decoration: line-through; }
  .tag { width: 22px; height: 22px; border-radius: 50%; flex: none; }
  .fab {
    position: absolute; right: 60px; bottom: 84px;
    width: 148px; height: 148px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(160deg, #2F6FE4, #1653BE);
    box-shadow: 0 18px 40px rgba(22, 83, 190, 0.45);
  }

  /* --- add-task sheet --- */
  .dim { position: absolute; inset: 0; background: rgba(8, 14, 28, 0.42); }
  .sheet {
    position: absolute; left: 0; right: 0; bottom: 0;
    padding: 28px 56px 72px; border-radius: 72px 72px 0 0;
    background: ${t.appCard};
  }
  .handle { width: 96px; height: 10px; margin: 0 auto 44px; border-radius: 999px; background: ${t.appTextSub}; opacity: 0.4; }
  .field {
    display: flex; align-items: center;
    padding: 40px 44px; border-radius: 32px;
    background: ${t.appBg}; font-size: 46px; font-weight: 600;
  }
  .caret { width: 4px; height: 52px; margin-left: 6px; background: ${t.accent}; }
  .chips { display: flex; gap: 20px; margin-top: 36px; }
  .chip {
    padding: 18px 38px; border-radius: 999px; font-size: 36px; font-weight: 600;
    background: ${t.appBg}; color: ${t.appTextSub};
  }
  .chip-on { background: rgba(22, 99, 217, 0.12); color: ${t.accent}; }
  .addbtn {
    margin-top: 44px; padding: 40px; border-radius: 36px; text-align: center;
    background: ${t.accent}; color: #fff; font-size: 46px; font-weight: 700;
  }

  /* --- icon slide --- */
  .pr-icon { position: absolute; top: 620px; left: 140px; width: 1040px; }
  .app-icon {
    position: absolute; left: ${(canvas.width - 460) / 2}px; top: 1210px;
    width: 460px; height: 460px; padding: 110px; border-radius: 104px;
    background: linear-gradient(160deg, #2F6FE4, #123E93);
    box-shadow: 0 34px 72px rgba(0, 0, 0, 0.5);
  }
  .app-icon svg { display: block; width: 100%; height: 100%; }
  .sub-icon { position: absolute; top: 1810px; left: 140px; width: 1040px; }
</style>
</head>
<body>
  <div class="canvas">${body}</div>
</body>
</html>`;
};
