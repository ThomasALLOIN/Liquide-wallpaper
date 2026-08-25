const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const root = join(__dirname, "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const app = readFileSync(join(root, "src", "app.js"), "utf8");
const styles = readFileSync(join(root, "src", "styles.css"), "utf8");
const livelyProperties = JSON.parse(readFileSync(join(root, "LivelyProperties.json"), "utf8"));

test("le fond ne présente aucun menu ni réglage intégré", () => {
  assert.doesNotMatch(html, /settings-toggle|settings-panel|data-setting=/);
  assert.doesNotMatch(app, /openSettings|closeSettings|syncMenuControls/);
  assert.doesNotMatch(styles, /settings-toggle|settings-panel/);
});

test("aucune heure n’est affichée sur le fond d’écran", () => {
  assert.doesNotMatch(html, /id="clock"|clock-time|clock-phase/);
  assert.doesNotMatch(app, /showClock|clockTime|clockPhase/);
  assert.equal(livelyProperties.showClock, undefined);
});

test("la seed pilote le shader et se renouvelle automatiquement toutes les deux heures", () => {
  assert.match(app, /uniform float u_seed/);
  assert.match(app, /normalizeSeed\(settings\.randomSeed\)/);
  assert.match(app, /SEED_ROTATION_MS = 2 \* 60 \* 60 \* 1000/);
  assert.match(app, /Math\.floor\(now \/ SEED_ROTATION_MS\)/);
  assert.match(app, /window\.crypto\?\.getRandomValues/);
  assert.equal(livelyProperties.randomSeed, undefined);
  assert.equal(livelyProperties.intensity.value, 32);
});

test("les grandes veines possèdent un mouvement organique réglable", () => {
  assert.match(app, /float motion = t \* 0\.14/);
  assert.match(app, /bendCenter \+= orbit \* 0\.012/);
  assert.match(app, /flowLandscape/);
  assert.match(app, /getVeinMotionRate\(settings\.flowSpeed\)/);
  assert.match(app, /runtime\.motionTime \+= elapsedSeconds/);
  assert.equal(livelyProperties.flowSpeed.value, 16);
  assert.equal(livelyProperties.flowSpeed.max, 400);
  assert.equal(livelyProperties.flowSpeed.text, "Vitesse des veines");
});

test("déplacement et déformation utilisent la même phase d’animation", () => {
  assert.match(app, /float deformAmp = mix\(0\.06, 0\.13, distortionLevel\)/);
  assert.match(app, /float bend = mix\(0\.06, 0\.55, u_intensity\)/);
  assert.match(app, /deformationBreath/);
  assert.match(app, /warpAmount = mix\(0\.12, 0\.42, distortionLevel\)/);
  assert.doesNotMatch(app, /deformationTime|u_deformationTime/);
  assert.match(livelyProperties.flowSpeed.help, /déplacement, la torsion et la déformation/);
});

test("la matière suit des strates minérales non périodiques", () => {
  for (const field of [
    "strataAngle", "veinSheet", "markedHalo", "markedCore", "markedFracture",
    "striationRidge", "chalkDust", "microTexture",
  ]) {
    assert.match(app, new RegExp(`\\b${field}\\b`));
  }
  assert.match(app, /vec2 strata = vec2\(q\.x \* 0\.34, q\.y \* 1\.25\)/);
  assert.doesNotMatch(app, /marbleWave|sin\(phase \* 6\.2831853\)/);
  assert.doesNotMatch(app, /applyVortex\(/);
});

test("les veines marquées combinent une âme, un corps et un halo irréguliers", () => {
  assert.match(app, /float bedAxis = marbleDomain\.y \* 0\.115 \+ marbleDomain\.x \* 0\.018/);
  assert.match(app, /float portraitVeinShift = portrait \* mix\(0\.055, 0\.085, seedB\)/);
  assert.match(app, /float target1 = target0 \+ mix\(0\.085, 0\.125, seedB\)/);
  assert.match(app, /float target2 = target0 - mix\(0\.070, 0\.105, seedC\)/);
  assert.match(app, /float gate0 = smoothstep/);
  assert.match(app, /halo1 \* mix\(0\.35, 1\.0, gate1\)/);
  assert.match(app, /float markedBody = max/);
  assert.match(app, /float markedCore = max/);
  assert.match(app, /float fracturePixel = max\(fwidth\(crossStriation\), 0\.0008\)/);
  assert.match(app, /markedCore \* 0\.54/);
  assert.match(app, /float portraitVeinBoost = mix\(1\.0, 1\.42, portrait\)/);
  assert.doesNotMatch(app, /pathA|pathB|veinUv/);
  assert.doesNotMatch(app, /nightCore|dayCore|coreColor/);
});

test("la couche de traits contrastés reste segmentée et peu coûteuse", () => {
  for (const field of [
    "traitCell", "traitWindow", "traitCore", "traitCoreMask",
    "traitCoreB", "traitCoreC", "detailTraits", "detailShoulders",
  ]) {
    assert.match(app, new RegExp(`\\b${field}\\b`));
  }
  assert.match(app, /float traitCell = floor\(traitAlong\)/);
  assert.match(app, /float traitRarityThreshold = mix\(0\.18, 0\.08, portrait\)/);
  assert.match(app, /float traitAlongB = traitAlong \* 0\.87/);
  assert.match(app, /float traitAlongC = traitAlong \* 1\.13/);
  assert.match(app, /float detailCorePixels = mix\(3\.20, 2\.45, u_contrast\)/);
  assert.match(app, /float detailShoulderPixels = mix\(4\.20, 6\.80, portrait\)/);
  assert.equal((app.match(/length\(vec2\(dFdx\(/g) || []).length, 3);
  assert.doesNotMatch(app, /branchCore|branchShoulder/);
  assert.match(app, /vec3 detailShoulderColor = mix/);
  assert.match(app, /vec3 detailTraitColor = mix/);
  assert.match(app, /clamp\(detailTraitOpacity, 0\.0, 0\.68\)/);
  assert.equal((app.match(/fbm\(/g) || []).length, 9);
});
