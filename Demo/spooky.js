const back = () => document.querySelector("#spooky-back");
const front = () => document.querySelector("#spooky-front");
const rand = (min, max) => min + Math.random() * (max - min);

const GHOST_SVG = `
<svg viewBox="0 0 64 80">
  <path d="M6 78V32C6 14 18 3 32 3s26 11 26 29v46l-8-8-9 8-9-8-9 8-9-8Z" fill="#eafff1" fill-opacity=".95"/>
  <path d="M14 30c0-9 7-17 18-17" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="23" cy="34" rx="4.2" ry="6.5" fill="#12331a"/>
  <ellipse cx="41" cy="34" rx="4.2" ry="6.5" fill="#12331a"/>
  <ellipse cx="32" cy="51" rx="5.5" ry="7.5" fill="#12331a"/>
</svg>`;

const WITCH_SVG = `
<svg viewBox="0 0 160 84">
  <path d="M96 52l58-9c3 5 3 14 0 20l-58-3Z" fill="#b5832f" stroke="#7a521a" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M110 50l40-5M110 58l40 2" stroke="#7a521a" stroke-width="1.5" fill="none"/>
  <path d="M6 58L102 55" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round"/>
  <path d="M60 33c-8 9-6 19 2 22l38-3c-5-9-14-17-24-21Z" fill="#4a2380" stroke="#c9a0ff" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M96 52c8 2 16 8 20 16-10-3-18-8-24-14Z" fill="#4a2380" stroke="#c9a0ff" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M62 38L38 52" stroke="#c9a0ff" stroke-width="4" stroke-linecap="round"/>
  <circle cx="66" cy="26" r="8" fill="#d7f5d0" stroke="#7bbf7b" stroke-width="1.3"/>
  <path d="M71 28l-3 6 5-1Z" fill="#7bbf7b"/>
  <ellipse cx="66" cy="19" rx="19" ry="4.5" fill="#2e1459" stroke="#c9a0ff" stroke-width="1.5"/>
  <path d="M52 18C58 12 70 6 92 2c-6 6-9 11-10 16Z" fill="#2e1459" stroke="#c9a0ff" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M55 17h24" stroke="#6dff9a" stroke-width="3"/>
</svg>`;

function node(className, style = {}, html = "") {
  const el = document.createElement("div");
  el.className = className;
  Object.entries(style).forEach(([key, value]) => key.startsWith("--") ? el.style.setProperty(key, value) : (el.style[key] = value));
  if (html) el.innerHTML = html; // só markup fixo definido acima
  return el;
}

export function enableSpooky() {
  disableSpooky();
  const backLayer = back();
  const frontLayer = front();

  backLayer.append(node("mist"));
  for (let i = 0; i < 30; i++) {
    const size = rand(10, 48);
    backLayer.append(node("bubble", {
      left: `${rand(0, 98)}%`, width: `${size}px`, height: `${size}px`,
      animationDuration: `${rand(6, 14)}s`, animationDelay: `${rand(0, 9)}s`, "--sway": `${rand(10, 40)}px`,
    }));
  }

  for (let i = 0; i < 9; i++) {
    const size = rand(44, 92);
    frontLayer.append(node("ghost", {
      left: `${rand(3, 92)}%`, width: `${size}px`,
      animationDuration: `${rand(9, 16)}s`, animationDelay: `${rand(0.4, 8)}s`,
      "--sway": `${rand(10, 26)}px`,
    }, GHOST_SVG));
  }
  frontLayer.querySelectorAll(".ghost svg").forEach(svg => { svg.style.animationDuration = `${rand(1.8, 3.2)}s`; });

  for (let i = 0; i < 3; i++) {
    const witch = node("witch", {
      top: `${rand(6, 62)}%`, width: `${rand(150, 220)}px`,
      animationDuration: `${rand(13, 20)}s`, animationDelay: `${1 + i * 5 + rand(0, 3)}s`,
    }, WITCH_SVG);
    witch.querySelector("svg").style.animationDuration = `${rand(1.6, 2.6)}s`;
    frontLayer.append(witch);
  }
}

export function disableSpooky() {
  back().replaceChildren();
  front().replaceChildren();
}

export function playPortal({ x, y, color, onMid }) {
  const overlay = node("portal", { background: `radial-gradient(circle at ${x}px ${y}px, ${color}, transparent 70%)` });
  document.body.append(overlay);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !overlay.animate) { onMid(); overlay.remove(); return; }
  const animation = overlay.animate([
    { clipPath: `circle(0px at ${x}px ${y}px)`, opacity: 0.95, offset: 0 },
    { clipPath: `circle(160vmax at ${x}px ${y}px)`, opacity: 0.95, offset: 0.65 },
    { clipPath: `circle(160vmax at ${x}px ${y}px)`, opacity: 0, offset: 1 },
  ], { duration: 1200, easing: "ease-out" });
  setTimeout(onMid, 420);
  animation.onfinish = () => overlay.remove();
}
