// Story-sized share images (1080 × 1920, the size Instagram and WhatsApp Status use), drawn on a canvas in the browser.
import { recipeById } from "../data/recipes";
import { fmt } from "../state/derived";
import { journeyLines, mealName, planKcalPerDay, SHARE_MEALS, WEEKDAYS, type JourneyStats, type SharedPlan } from "./share";

const W = 1080;
const H = 1920;
const FONT = `"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
const INK = "#11180d";
const MUTED = "#5b6552";
const LIME = "#c3ee6a";
const TILES = ["#c8ef7e", "#fdd667", "#ffa564", "#e6e8de"];
const MEAL_EMOJI = { Breakfast: "🍳", Lunch: "🍛", Snacks: "🍌", Dinner: "🍲" } as const;

function canvas() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't available in this browser.");
  return { c, ctx };
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, weight: number, color: string, maxWidth?: number) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  let out = s;
  if (maxWidth && ctx.measureText(out).width > maxWidth) {
    while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
    out = `${out.trimEnd()}…`;
  }
  ctx.fillText(out, x, y);
}

function frame(ctx: CanvasRenderingContext2D, title: string, subtitle: string, link: string) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#f7f9ef");
  g.addColorStop(1, "#e4f4c6");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.beginPath();
  ctx.arc(W - 90, 110, 260, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(195, 238, 106, 0.35)";
  ctx.fill();
  box(ctx, 80, 96, 76, 76, 22, LIME);
  text(ctx, "🥗", 98, 150, 40, 400, INK);
  text(ctx, "Nutrintel", 176, 150, 44, 800, INK);
  text(ctx, title, 80, 300, 84, 800, INK, W - 160);
  text(ctx, subtitle, 80, 368, 40, 600, MUTED, W - 160);
  ctx.textBaseline = "alphabetic";
  text(ctx, "Eat well. Move more. Feel good.", 80, H - 120, 36, 700, INK);
  text(ctx, link.replace(/^https?:\/\//, ""), 80, H - 70, 32, 600, MUTED);
}

const toBlob = (c: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't make the image."))), "image/png"));

export async function planStory(shared: SharedPlan, link: string): Promise<Blob> {
  await document.fonts?.ready;
  const { c, ctx } = canvas();
  const kcal = planKcalPerDay(shared);
  frame(ctx, "My meal plan", `${shared.title}${kcal ? ` · about ${fmt(kcal)} kcal a day` : ""}`, link);
  const days = [...new Set(shared.items.map((it) => it.day))].sort((a, b) => a - b);
  const top = 430;
  const rowGap = 18;
  const rowH = Math.min(260, (H - 230 - top - rowGap * (days.length - 1)) / Math.max(1, days.length));
  days.forEach((day, i) => {
    const y = top + i * (rowH + rowGap);
    box(ctx, 80, y, W - 160, rowH, 32, "rgba(255,255,255,0.88)");
    box(ctx, 80, y, 14, rowH, 7, TILES[i % TILES.length]);
    text(ctx, WEEKDAYS[day], 122, y + 56, 38, 800, INK);
    const meals = SHARE_MEALS.map((m) => shared.items.find((it) => it.day === day && it.meal === m)).filter((x) => x !== undefined);
    const lineH = Math.min(46, (rowH - 80) / Math.max(1, Math.ceil(meals.length / 2)));
    meals.forEach((it, j) => {
      const r = recipeById(it.recipeId);
      if (!r) return;
      const col = j % 2;
      const x = 122 + col * 430;
      const ly = y + 100 + Math.floor(j / 2) * lineH;
      text(ctx, `${MEAL_EMOJI[it.meal]} ${r.name}`, x, ly, Math.max(22, lineH * 0.62), 600, INK, 410);
      if (lineH >= 46) text(ctx, mealName(it.meal), x + 52, ly + 26, 20, 600, MUTED);
    });
  });
  return toBlob(c);
}

export async function journeyStory(stats: JourneyStats, showWeight: boolean, link: string): Promise<Blob> {
  await document.fonts?.ready;
  const { c, ctx } = canvas();
  frame(ctx, "My health journey", "Small steps, every day", link);
  const lines = journeyLines(stats, showWeight);
  const top = 470;
  const h = 250;
  lines.forEach((l, i) => {
    const y = top + i * (h + 30);
    box(ctx, 80, y, W - 160, h, 40, TILES[i % TILES.length]);
    text(ctx, l.value, 130, y + 135, 96, 800, INK, W - 260);
    text(ctx, l.label, 130, y + 200, 38, 600, "rgba(17,24,13,0.75)", W - 260);
  });
  return toBlob(c);
}
