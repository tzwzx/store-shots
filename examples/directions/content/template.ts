// Three contrasting art directions for the same app, from the same data.
// Each direction returns its own body AND its own CSS — nothing is shared
// visually, which is the point: the engine only ever sees the final HTML.

import type { RenderContext } from "@tzwzx/store-shots";
import { accentHtml, escapeHtml } from "@tzwzx/store-shots/html";

import { canvas } from "./config";
import type { Direction, Slide } from "./config";

// ---------------------------------------------------------------------------
// Shared mock "Tidy" UI fragments (content only — each direction styles them).

interface Task {
  done?: boolean;
  label: string;
}

const TASKS: Task[] = [
  { done: true, label: "Buy oat milk" },
  { done: true, label: "Ship the design review" },
  { label: "Book dentist appointment" },
  { label: "Water the plants" },
  { label: "Reply to Mia" },
  { label: "Plan the weekend trip" },
];

const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.2 4.3L19 7" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const taskRowHtml = (task: Task): string => {
  const box = task.done
    ? `<span class="check done">${CHECK_SVG}</span>`
    : `<span class="check"></span>`;
  const cls = task.done ? "task task-done" : "task";
  return `<div class="${cls}">${box}<span class="task-label">${escapeHtml(task.label)}</span></div>`;
};

const tasksHtml = (count: number): string =>
  TASKS.slice(0, count).map(taskRowHtml).join("");

const prHtml = (slide: Slide): string =>
  slide.pr.lines
    .map((line) => `<div>${accentHtml(line, slide.pr.accent)}</div>`)
    .join("");

interface DirectionRender {
  body: string;
  css: string;
}

// ---------------------------------------------------------------------------
// full-bleed: the app IS the slide — UI edge-to-edge, copy on a top scrim.

const fullBleed = (slide: Slide): DirectionRender => ({
  body: `
    <div class="app">
      <div class="apphead">
        <div class="apptitle">Today</div>
        <div class="appsub">Monday &middot; 4 left</div>
      </div>
      <div class="tasks">${tasksHtml(6)}</div>
      <div class="fab"><svg width="60" height="60" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg></div>
    </div>
    <div class="scrim"></div>
    <div class="copy">
      <div class="pr">${prHtml(slide)}</div>
      <div class="sub">${escapeHtml(slide.sub)}</div>
    </div>`,
  css: `
  .dir-full-bleed { background: #F2F5FB; font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif; }
  .dir-full-bleed .app { position: absolute; inset: 0; }
  .dir-full-bleed .apphead { padding: 900px 100px 48px; }
  .dir-full-bleed .apptitle { font-size: 132px; font-weight: 800; letter-spacing: -0.02em; color: #1C2433; }
  .dir-full-bleed .appsub { margin-top: 16px; font-size: 52px; font-weight: 500; color: #8A94A8; }
  .dir-full-bleed .tasks { display: flex; flex-direction: column; gap: 30px; padding: 0 72px; }
  .dir-full-bleed .task {
    display: flex; align-items: center; gap: 44px;
    background: #FFFFFF; border-radius: 48px; padding: 52px 60px;
    box-shadow: 0 8px 32px rgba(12, 24, 48, 0.06);
  }
  .dir-full-bleed .check { width: 72px; height: 72px; flex: none; border-radius: 50%; border: 5px solid #8A94A8; }
  .dir-full-bleed .check.done { border-color: #1663D9; background: #1663D9; padding: 10px; }
  .dir-full-bleed .check svg { display: block; width: 100%; height: 100%; }
  .dir-full-bleed .task-label { font-size: 58px; font-weight: 600; color: #1C2433; }
  .dir-full-bleed .task-done .task-label { color: #8A94A8; text-decoration: line-through; }
  .dir-full-bleed .fab {
    position: absolute; right: 84px; bottom: 108px;
    width: 190px; height: 190px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(160deg, #2F6FE4, #1653BE);
    box-shadow: 0 24px 52px rgba(22, 83, 190, 0.45);
  }
  .dir-full-bleed .scrim {
    position: absolute; top: 0; left: 0; right: 0; height: 940px;
    background: linear-gradient(180deg, rgba(6, 19, 37, 0.97) 0%, rgba(6, 19, 37, 0.82) 46%, rgba(6, 19, 37, 0) 100%);
  }
  .dir-full-bleed .copy { position: absolute; top: 150px; left: 110px; right: 110px; }
  .dir-full-bleed .pr {
    font-size: 128px; line-height: 1.14; font-weight: 800;
    letter-spacing: -0.022em; color: #FFFFFF;
  }
  .dir-full-bleed .pr .accent { color: #7FC1FF; }
  .dir-full-bleed .sub { margin-top: 44px; font-size: 54px; font-weight: 500; color: rgba(255, 255, 255, 0.82); }`,
});

// ---------------------------------------------------------------------------
// editorial: typography-led — oversized serif headline, no device, one card.

const editorial = (slide: Slide): DirectionRender => ({
  body: `
    <div class="copy">
      <div class="kicker">Tidy &middot; quick capture</div>
      <div class="pr">${prHtml(slide)}</div>
      <div class="rule"></div>
      <div class="sub">${escapeHtml(slide.sub)}</div>
    </div>
    <div class="stat"><span class="stat-num">4</span><span class="stat-label">left today</span></div>
    <div class="card">${taskRowHtml({ label: "Call the bank" })}</div>`,
  css: `
  .dir-editorial { background: #F5F0E8; font-family: "Iowan Old Style", "Palatino", Georgia, serif; }
  .dir-editorial .copy { position: absolute; top: 300px; left: 130px; right: 110px; }
  .dir-editorial .kicker {
    margin-bottom: 72px;
    font-family: -apple-system, "Helvetica Neue", sans-serif;
    font-size: 42px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase;
    color: #8A8272;
  }
  .dir-editorial .pr {
    font-size: 196px; line-height: 1.05; font-weight: 600;
    letter-spacing: -0.015em; color: #1D1A15;
  }
  .dir-editorial .pr .accent { font-style: italic; color: #1663D9; }
  .dir-editorial .rule { width: 340px; height: 8px; margin: 96px 0 72px; background: #1D1A15; }
  .dir-editorial .sub { font-size: 58px; line-height: 1.4; color: #6E675B; }
  .dir-editorial .stat { position: absolute; left: 130px; top: 1560px; }
  .dir-editorial .stat-num { display: block; font-size: 440px; line-height: 1; color: #1663D9; }
  .dir-editorial .stat-label {
    display: block; margin-top: 28px;
    font-family: -apple-system, "Helvetica Neue", sans-serif;
    font-size: 46px; font-weight: 600; letter-spacing: 0.34em; text-transform: uppercase;
    color: #1D1A15;
  }
  .dir-editorial .card {
    position: absolute; left: 130px; right: 130px; bottom: 260px;
    background: #FFFFFF; border-radius: 40px; padding: 24px 36px;
    box-shadow: 0 30px 80px rgba(70, 58, 34, 0.18);
  }
  .dir-editorial .task { display: flex; align-items: center; gap: 44px; padding: 40px 32px; }
  .dir-editorial .check { width: 68px; height: 68px; flex: none; border-radius: 50%; border: 5px solid #B9B1A2; }
  .dir-editorial .task-label {
    font-family: -apple-system, "Helvetica Neue", sans-serif;
    font-size: 56px; font-weight: 600; color: #1D1A15;
  }`,
});

// ---------------------------------------------------------------------------
// collage: tilted, overlapping UI cards on a saturated gradient.

const collage = (slide: Slide): DirectionRender => ({
  body: `
    <div class="copy">
      <div class="pr">${prHtml(slide)}</div>
      <div class="sub">${escapeHtml(slide.sub)}</div>
    </div>
    <div class="card card-a"><div class="cardhead">Today</div>${tasksHtml(3)}</div>
    <div class="card card-b">
      <div class="field">Call the bank<span class="caret"></span></div>
      <div class="addbtn">Add task</div>
    </div>
    <div class="card card-c"><span class="big">4</span><span class="small">done before lunch</span></div>`,
  css: `
  .dir-collage { background: linear-gradient(150deg, #1663D9 0%, #6C2BD9 100%); font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif; }
  .dir-collage .copy { position: absolute; top: 210px; left: 110px; right: 110px; text-align: center; }
  .dir-collage .pr {
    font-size: 124px; line-height: 1.13; font-weight: 800;
    letter-spacing: -0.022em; color: #FFFFFF;
  }
  .dir-collage .pr .accent { color: #FFD84D; }
  .dir-collage .sub { margin-top: 40px; font-size: 52px; font-weight: 500; color: rgba(255, 255, 255, 0.85); }
  .dir-collage .card {
    position: absolute; background: #FFFFFF; border-radius: 56px;
    box-shadow: 0 48px 110px rgba(10, 15, 40, 0.42);
  }
  .dir-collage .card-a { left: 70px; top: 1030px; width: 900px; padding: 64px 56px; transform: rotate(-7deg); }
  .dir-collage .cardhead { margin: 0 0 40px 12px; font-size: 76px; font-weight: 800; letter-spacing: -0.02em; color: #1C2433; }
  .dir-collage .task { display: flex; align-items: center; gap: 36px; padding: 34px 20px; border-bottom: 3px solid #EEF1F7; }
  .dir-collage .task:last-child { border-bottom: none; }
  .dir-collage .check { width: 62px; height: 62px; flex: none; border-radius: 50%; border: 5px solid #8A94A8; }
  .dir-collage .check.done { border-color: #1663D9; background: #1663D9; padding: 9px; }
  .dir-collage .check svg { display: block; width: 100%; height: 100%; }
  .dir-collage .task-label { font-size: 50px; font-weight: 600; color: #1C2433; }
  .dir-collage .task-done .task-label { color: #8A94A8; text-decoration: line-through; }
  .dir-collage .card-b { right: -60px; top: 1660px; width: 820px; padding: 60px 56px; transform: rotate(5deg); }
  .dir-collage .field {
    display: flex; align-items: center;
    padding: 46px 50px; border-radius: 36px;
    background: #F2F5FB; font-size: 52px; font-weight: 600; color: #1C2433;
  }
  .dir-collage .caret { width: 5px; height: 58px; margin-left: 8px; background: #1663D9; }
  .dir-collage .addbtn {
    margin-top: 44px; padding: 44px; border-radius: 40px; text-align: center;
    background: #1663D9; color: #fff; font-size: 52px; font-weight: 700;
  }
  .dir-collage .card-c {
    left: 120px; top: 2270px; width: 640px; padding: 64px 72px;
    display: flex; align-items: baseline; gap: 32px; transform: rotate(-4deg);
  }
  .dir-collage .big { font-size: 170px; line-height: 1; font-weight: 800; color: #1663D9; }
  .dir-collage .small { font-size: 46px; font-weight: 600; color: #8A94A8; }`,
});

const DIRECTIONS: Record<Direction, (slide: Slide) => DirectionRender> = {
  collage,
  editorial,
  "full-bleed": fullBleed,
};

export const renderSlideHtml = (slide: Slide, _ctx: RenderContext): string => {
  const { body, css } = DIRECTIONS[slide.direction](slide);
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${canvas.width}px; height: ${canvas.height}px; }
  .canvas { position: relative; width: ${canvas.width}px; height: ${canvas.height}px; overflow: hidden; }
${css}
</style>
</head>
<body>
  <div class="canvas dir-${slide.direction}">${body}</div>
</body>
</html>`;
};
