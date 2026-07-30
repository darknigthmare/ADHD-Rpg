import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
const compactText = value => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const ids = [...markup.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1]);
const idSet = new Set(ids);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

const functionNames = [...html.matchAll(/\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)]
  .map(match => match[1]);
const duplicateFunctions = [...new Set(functionNames.filter((name, index) => functionNames.indexOf(name) !== index))];

const labelTargets = [...markup.matchAll(/<label\b[^>]*\bfor=["']([^"']+)["'][^>]*>/gi)]
  .map(match => match[1]);
const orphanLabels = [...new Set(labelTargets.filter(target => !idSet.has(target)))];
const implicitlyLabelledIds = [...markup.matchAll(/<label\b[^>]*>[\s\S]*?<(?:input|select|textarea)\b[^>]*\bid=["']([^"']+)["'][^>]*>[\s\S]*?<\/label>/gi)]
  .map(match => match[1]);

const controlsWithoutName = [];
for (const match of markup.matchAll(/<(button|input|select|textarea)\b([^>]*)>([\s\S]*?)<\/\1>|<(input)\b([^>]*)\/?>/gi)) {
  const tag = (match[1] || match[4] || "").toLowerCase();
  const attrs = match[2] || match[5] || "";
  const body = match[3] || "";
  const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1] || "(sans id)";
  const type = attrs.match(/\btype=["']([^"']+)["']/i)?.[1] || "";
  if (tag === "input" && (type.toLowerCase() === "hidden" || /\bhidden\b/i.test(attrs))) continue;
  const hasAria = /\baria-label(?:ledby)?=["'][^"']+["']/i.test(attrs);
  const hasLabel = id !== "(sans id)" && (labelTargets.includes(id) || implicitlyLabelledIds.includes(id));
  const hasText = tag === "button" && compactText(body).length > 0;
  const hasAltName = /\b(?:placeholder|title)=["'][^"']+["']/i.test(attrs);
  if (!hasAria && !hasLabel && !hasText && !hasAltName) controlsWithoutName.push(`${tag}#${id}`);
}

const titleOnlyIconButtons = [];
for (const match of markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
  const attrs = match[1];
  const body = match[2];
  const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1] || "(sans id)";
  const text = compactText(body);
  const hasAria = /\baria-label(?:ledby)?=/i.test(attrs);
  const hasTitle = /\btitle=/i.test(attrs);
  if (!text && !hasAria && hasTitle) titleOnlyIconButtons.push(id);
}

const longParagraphs = [...markup.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
  .map(match => compactText(match[2]))
  .filter(text => text.length > 180)
  .map(text => ({ length: text.length, sample: text.slice(0, 120) }));

const referencedIds = [...html.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)].map(match => match[1]);
const expectedDynamicIds = new Set([
  "btn-toggle-solo-proposals",
  "arena-hero-wrapper",
  "arena-switcher-ui",
  "weather-night-overlay",
  "arena-monster-pomo",
  "arena-hero-weapon",
  "prepare-tomorrow-btn",
  "onboarding-done-btn",
  "adhd-guide-next-btn",
  "save-my-day-btn",
  "world-settings-name",
  "world-settings-theme",
  "world-create-input"
]);
const missingReferencedIds = [...new Set(referencedIds.filter(id => !idSet.has(id) && !expectedDynamicIds.has(id)))];
const dynamicReferencedIds = [...new Set(referencedIds.filter(id => expectedDynamicIds.has(id)))];
const inlineHandlers = [...markup.matchAll(/\son(click|change|input|submit|keydown|keyup)\s*=/gi)]
  .map(match => match[1].toLowerCase());
const unusedNamedFunctions = functionNames.filter(name => {
  const occurrences = html.match(new RegExp(`\\b${name.replace(/[$]/g, "\\$&")}\\b`, "g")) || [];
  return occurrences.length === 1;
});

const result = {
  metrics: {
    htmlBytes: Buffer.byteLength(html),
    markupIds: ids.length,
    functions: functionNames.length,
    potentiallyUnusedFunctions: unusedNamedFunctions.length,
    inlineStyles: (markup.match(/\sstyle=["']/gi) || []).length,
    importantRules: (fs.readFileSync(path.join(root, "assets", "css", "app.css"), "utf8").match(/!important/g) || []).length,
    inlineHandlers: inlineHandlers.length
  },
  duplicateIds,
  duplicateFunctions,
  orphanLabels,
  controlsWithoutName,
  titleOnlyIconButtons,
  longParagraphs,
  missingReferencedIds,
  dynamicReferencedIds,
  unusedNamedFunctions
};

console.log(JSON.stringify(result, null, 2));
