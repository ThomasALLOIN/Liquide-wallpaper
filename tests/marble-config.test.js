const test = require("node:test");
const assert = require("node:assert/strict");
const marble = require("../src/marble-config.js");

test("le marbre reste blanc pendant la journée", () => {
  assert.equal(marble.getLightLevel(12), 1);
  assert.equal(marble.getLightLevel(18), 1);
  assert.equal(marble.getPhase(marble.getLightLevel(12)), "Jour");
});

test("le marbre s’assombrit progressivement puis devient noir", () => {
  const evening = marble.getLightLevel(20);
  assert.ok(evening > 0.45 && evening < 0.55);
  assert.equal(marble.getLightLevel(22), 0);
  assert.equal(marble.getLightLevel(2), 0);
  assert.equal(marble.getPhase(marble.getLightLevel(20)), "Transition");
  assert.equal(marble.getPhase(marble.getLightLevel(23)), "Nuit");
});

test("la palette inverse le contraste entre le jour et la nuit", () => {
  const day = marble.resolvePalette(1);
  const night = marble.resolvePalette(0);
  assert.ok(day.base[0] > day.vein[0]);
  assert.ok(night.base[0] < night.vein[0]);
});

test("les couleurs hexadécimales courtes et longues sont reconnues", () => {
  assert.deepEqual(marble.parseHexColor("#fff"), [1, 1, 1]);
  assert.deepEqual(marble.parseHexColor("#000000"), [0, 0, 0]);
});

test("les profils de performance ont des valeurs déterministes", () => {
  assert.equal(marble.getRenderScale(0), 0.6);
  assert.equal(marble.getRenderScale(1), 0.78);
  assert.equal(marble.getRenderScale(2), 1);
  assert.equal(marble.getBackingScale(0, 2), 1.2);
  assert.equal(marble.getBackingScale(1, 2), 1.56);
  assert.equal(marble.getBackingScale(2, 3), 2);
  assert.equal(marble.getTargetFps(0), 15);
  assert.equal(marble.getTargetFps(1), 24);
  assert.equal(marble.getTargetFps(2), 30);
});

test("la vitesse des veines peut être réglée ou complètement arrêtée", () => {
  assert.equal(marble.getVeinMotionRate(0), 0);
  assert.equal(marble.getVeinMotionRate(18), 0.18);
  assert.equal(marble.getVeinMotionRate(100), 1);
  assert.equal(marble.getVeinMotionRate(150), 1);
});
