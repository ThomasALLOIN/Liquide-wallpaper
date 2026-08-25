const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const root = join(__dirname, "..");
const packageInfo = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const macSource = readFileSync(join(root, "platforms", "macos", "Sources", "main.m"), "utf8");
const macPlist = readFileSync(join(root, "platforms", "macos", "Info.plist"), "utf8");
const rootInfo = JSON.parse(readFileSync(join(root, "LivelyInfo.json"), "utf8"));
const windowsInfo = JSON.parse(readFileSync(join(root, "platforms", "windows", "LivelyInfo.json"), "utf8"));
const rootProperties = JSON.parse(readFileSync(join(root, "LivelyProperties.json"), "utf8"));
const windowsProperties = JSON.parse(readFileSync(join(root, "platforms", "windows", "LivelyProperties.json"), "utf8"));

test("le projet déclare deux distributions séparées", () => {
  assert.deepEqual(packageInfo.os, ["darwin", "win32"]);
  assert.equal(typeof packageInfo.scripts["package:macos"], "string");
  assert.equal(typeof packageInfo.scripts["package:windows"], "string");
});

test("la version macOS force le paysage 1470 × 956", () => {
  assert.match(macSource, /WallpaperWidth = 1470\.0/);
  assert.match(macSource, /WallpaperHeight = 956\.0/);
  assert.match(macSource, /WallpaperHostConfig/);
  assert.match(macSource, /layout: 'landscape'/);
  assert.match(macSource, /loadFileURL:indexURL/);
  assert.doesNotMatch(macSource, /components\.queryItems/);
  assert.match(macSource, /kCGDesktopIconWindowLevelKey/);
  assert.match(macPlist, /<key>CFBundlePackageType<\/key>\s*<string>APPL<\/string>/);
  assert.match(macPlist, /<key>LSMinimumSystemVersion<\/key>\s*<string>13\.0<\/string>/);
});

test("les métadonnées de compatibilité correspondent au dossier Windows", () => {
  assert.deepEqual(rootInfo, windowsInfo);
  assert.deepEqual(rootProperties, windowsProperties);
});

test("l’hôte macOS ne présente aucun menu ni lanceur", () => {
  const app = readFileSync(join(root, "src", "app.js"), "utf8");
  assert.doesNotMatch(app, /WallpaperController|openSettings|closeSettings/);
  assert.doesNotMatch(macSource, /NSStatusItem|NSPanel|wallpaperSettings|openSettings/);
  assert.match(macSource, /self\.window\.ignoresMouseEvents = YES/);
});
