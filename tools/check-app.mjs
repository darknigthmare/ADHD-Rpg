import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "index.html");
const cssPath = path.join(root, "assets", "css", "app.css");
const html = fs.readFileSync(indexPath, "utf8");
const errors = [];

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

const css = fs.readFileSync(cssPath, "utf8");
for (const match of css.matchAll(/url\(["']?([^\)"']+)["']?\)/gi)) {
  checkReference(match[1].trim(), path.dirname(cssPath), "missing CSS asset");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`NeuroQuest checks OK: ${inlineScripts.length} inline scripts, ${localScripts.length} local scripts, ${ids.length} unique ids.`);
}
