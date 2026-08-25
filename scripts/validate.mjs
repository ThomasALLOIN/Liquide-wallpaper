import { access, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const requiredFiles = [
  "Apercu-Windows.cmd",
  "Construire-Lively-Windows.cmd",
  "Construire-macOS.command",
  "Verifier-Windows.cmd",
  "INSTALLATION-WINDOWS.md",
  "INSTALLATION-macOS.md",
  "index.html",
  "LivelyInfo.json",
  "LivelyProperties.json",
  "assets/thumbnail.png",
  "assets/windows-brand.png",
  "icon/Icon-iOS-Default-1024x1024@1x.png",
  "src/app.js",
  "src/marble-config.js",
  "src/layout.js",
  "src/styles.css",
  "scripts/package-windows.ps1",
  "platforms/windows/README.md",
  "platforms/windows/LivelyInfo.json",
  "platforms/windows/LivelyProperties.json",
  "platforms/windows/package-windows.ps1",
  "platforms/macos/README.md",
  "platforms/macos/Info.plist",
  "platforms/macos/Sources/main.m",
  "platforms/macos/build-macos.sh",
];

for (const file of requiredFiles) await access(join(root, file));

const info = JSON.parse(await readFile(join(root, "LivelyInfo.json"), "utf8"));
const properties = JSON.parse(await readFile(join(root, "LivelyProperties.json"), "utf8"));
const platformInfo = JSON.parse(await readFile(join(root, "platforms/windows/LivelyInfo.json"), "utf8"));
const platformProperties = JSON.parse(await readFile(join(root, "platforms/windows/LivelyProperties.json"), "utf8"));
const packageInfo = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const indexHtml = await readFile(join(root, "index.html"), "utf8");
if (info.FileName !== "index.html" || info.Type !== 1) {
  throw new Error("LivelyInfo.json ne décrit pas un fond d’écran web valide.");
}
if (!properties.displayLayout || !properties.flowSpeed || !properties.dayBaseColor || !properties.nightBaseColor || !properties.quality) {
  throw new Error("Les contrôles Lively essentiels sont absents.");
}
if (JSON.stringify(info) !== JSON.stringify(platformInfo) || JSON.stringify(properties) !== JSON.stringify(platformProperties)) {
  throw new Error("Les métadonnées Lively de compatibilité ne correspondent pas à la plateforme Windows.");
}
if (properties.flowSpeed.type !== "slider" || properties.flowSpeed.value !== 16 ||
    properties.flowSpeed.min !== 0 || properties.flowSpeed.max !== 100 ||
    properties.flowSpeed.text !== "Vitesse des veines" ||
    !properties.flowSpeed.help.includes("déplacement, la torsion et la déformation")) {
  throw new Error("Le mouvement des veines doit être réglable de 0 à 100 dans Lively.");
}
if (properties.intensity.value !== 32 || properties.veinDensity.value !== 36 ||
    properties.veinWidth.value !== 38 || properties.distortion.value !== 46 ||
    properties.surfaceGrain.value !== 22 || properties.contrast.value !== 72) {
  throw new Error("Les réglages initiaux doivent conserver le profil graphite stratifié validé.");
}
if (Object.hasOwn(properties, "showClock") || /id="clock"|clock-time|clock-phase/.test(indexHtml)) {
  throw new Error("L’heure ne doit plus être affichée ni configurable sur le fond d’écran.");
}
if (!Array.isArray(packageInfo.os) || !packageInfo.os.includes("win32") || !packageInfo.os.includes("darwin")) {
  throw new Error("Le projet doit déclarer Windows et macOS.");
}

const macSource = await readFile(join(root, "platforms/macos/Sources/main.m"), "utf8");
const macPlist = await readFile(join(root, "platforms/macos/Info.plist"), "utf8");
if (!macSource.includes("WallpaperWidth = 1470.0") || !macSource.includes("WallpaperHeight = 956.0")) {
  throw new Error("La surface macOS doit rester fixée à 1470 × 956.");
}
if (!macSource.includes("WallpaperHostConfig") || !macSource.includes("layout: 'landscape'") || !macSource.includes("kCGDesktopIconWindowLevelKey")) {
  throw new Error("L’hôte macOS doit forcer le paysage et rester au niveau du Bureau.");
}
if (!macSource.includes("loadFileURL:indexURL") || macSource.includes("components.queryItems")) {
  throw new Error("WKWebView doit charger l’URL de fichier brute, sans paramètres de requête.");
}
if (!macSource.includes("self.window.ignoresMouseEvents = YES") ||
    macSource.includes("NSStatusItem") || macSource.includes("NSPanel") ||
    macSource.includes("wallpaperSettings")) {
  throw new Error("macOS doit rester entièrement traversant aux clics et ne présenter aucun menu.");
}
if (!macPlist.includes("<string>APPL</string>") || !macPlist.includes("<string>Liquide-Wallpaper</string>")) {
  throw new Error("Info.plist ne décrit pas un bundle d’application macOS valide.");
}

for (const script of ["src/marble-config.js", "src/layout.js", "src/app.js", "scripts/serve.mjs"]) {
  const result = spawnSync(process.execPath, ["--check", join(root, script)], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `Syntaxe invalide : ${script}`);
}

if (process.platform === "darwin") {
  const plistResult = spawnSync("plutil", ["-lint", join(root, "platforms/macos/Info.plist")], { encoding: "utf8" });
  if (plistResult.status !== 0) throw new Error(plistResult.stderr || "Info.plist macOS invalide.");
}

console.log(`Validation réussie : ${requiredFiles.length} fichiers essentiels, plateformes Windows et macOS valides.`);
