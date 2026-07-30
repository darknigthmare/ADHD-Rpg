import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "index.html");
const cssPath = path.join(root, "assets", "css", "app.css");
const html = fs.readFileSync(indexPath, "utf8");
const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
const css = fs.readFileSync(cssPath, "utf8");
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function checkSyntax(label, source) {
  try {
    new Function(source);
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
  }
}

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
inlineScripts.forEach((match, index) => checkSyntax(`inline script ${index + 1}`, match[1]));

const localScripts = [...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)]
  .map(match => match[1])
  .filter(source => !/^(?:https?:|data:)/i.test(source));

for (const source of localScripts) {
  const scriptPath = path.resolve(root, source.split(/[?#]/)[0]);
  if (!fs.existsSync(scriptPath)) {
    errors.push(`missing script: ${source}`);
    continue;
  }
  checkSyntax(source, fs.readFileSync(scriptPath, "utf8"));
}

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)]
  .map(match => match[1])
  .filter(id => !id.includes("${"));
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) errors.push(`duplicate ids: ${duplicateIds.join(", ")}`);

assert(!/\son(?:click|change|input|submit|keydown|keyup)\s*=/i.test(markup), "inline event handler found");
assert(!html.includes("&times;"), "legacy text close icon found");
assert(!html.includes("Console Error:"), "raw console error message found");
assert(html.includes("createFreshDefaultState"), "full default state factory is missing");
assert(html.includes('id="import-save-file"'), "JSON backup import control is missing");
assert((html.match(/\bdata-settings-tab=/g) || []).length === 4, "settings must expose four focused tabs");
assert((html.match(/\bdata-settings-panel=/g) || []).length === 4, "settings tab panels are incomplete");
assert(html.includes("card.id = `coop-quest-${quest.id}`"), "cooperative quest ids are not namespaced");
assert((html.match(/checkRandomEvents\(\{ allowSpawn: arenaCleared/g) || []).length >= 2, "random events are not connected to all quest completion paths");
assert(css.includes("minmax(0, 1fr)"), "responsive form grid guard is missing");
assert(css.includes("grid-template-columns: repeat(5, minmax(0, 1fr)) minmax(8.75rem, 0.82fr)"), "desktop navigation grid guard is missing");
assert(css.includes("--battle-props-alpha-shift"), "premium prop grounding offsets are missing");
assert(css.includes(".battle-bg:not(.biome-camp) .battle-objects"), "premium props must preserve the dedicated camp scene");
assert(css.includes("background-repeat: no-repeat !important"), "premium props must render as a single scene layer");
assert(css.includes("compact-arena .battle-bg.active:not(.biome-camp) .battle-objects"), "compact arena prop guard is missing");
assert(!css.includes("background-size: max(100%, 980px)"), "legacy repeated premium prop sizing is still active");
assert(!/body\.theme-noir\s*\{[^}]*\bfilter\s*:/s.test(css), "film noir must not filter the body or displace fixed UI");
assert(html.includes("function syncDeviceStickyOffsets()"), "mobile sticky offset synchronization is missing");
assert(html.includes("window.requestAnimationFrame(syncDeviceStickyOffsets)"), "mobile sticky offsets must be remeasured after layout");
assert(html.includes('id="arena-rest-message"'), "shared centered rest message is missing from the battle viewport");
assert((html.match(/- RAID"/g) || []).length >= 10, "each visual theme must expose a coherent raid arena title");

function checkReference(reference, baseDir, label) {
  if (/^(?:https?:|data:|#|mailto:|javascript:|\$|\{|%23)/i.test(reference)) return;
  const clean = reference.split(/[?#]/)[0];
  if (!clean || clean.includes("${") || clean.includes("var(")) return;
  const resolved = path.resolve(baseDir, clean);
  if (!fs.existsSync(resolved)) errors.push(`${label}: ${reference}`);
}

for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) {
  checkReference(match[1], root, "missing HTML asset");
}

for (const match of css.matchAll(/url\(["']?([^\)"']+)["']?\)/gi)) {
  checkReference(match[1].trim(), path.dirname(cssPath), "missing CSS asset");
}

for (const match of html.matchAll(/["'`](assets\/[^"'`]+?\.(?:png|webp|svg|mp3|wav))(?:[?#][^"'`]*)?["'`]/gi)) {
  checkReference(match[1], root, "missing script asset");
}

const premiumThemes = [
  "arcane",
  "cyberpunk",
  "horror",
  "inferno",
  "medieval",
  "noir",
  "sartorius",
  "scifi",
  "stargate",
  "zombie"
];

for (const theme of premiumThemes) {
  for (const kind of ["monster", "boss"]) {
    for (let index = 1; index <= 16; index += 1) {
      const file = path.join(root, "assets", "monsters", "unique", `${theme}_${kind}_${String(index).padStart(2, "0")}.png`);
      if (!fs.existsSync(file)) errors.push(`missing premium sprite: ${path.relative(root, file)}`);
    }
  }
  for (const layer of ["back.webp", "floor.webp", "props.png"]) {
    const file = path.join(root, "assets", "backgrounds", "layers", theme, layer);
    if (!fs.existsSync(file)) errors.push(`missing premium scene layer: ${path.relative(root, file)}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`NeuroQuest checks OK: ${inlineScripts.length} inline scripts, ${localScripts.length} local scripts, ${ids.length} unique ids, ${premiumThemes.length * 32} premium sprites.`);
}
