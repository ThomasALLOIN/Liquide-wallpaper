const test = require("node:test");
const assert = require("node:assert/strict");
const layout = require("../src/layout.js");

test("le mode automatique distingue paysage et portrait", () => {
  assert.equal(layout.resolve(3840, 2160).frames[0].role, "landscape");
  assert.equal(layout.resolve(2160, 3840).frames[0].role, "portrait");
});

test("le profil étendu 4K crée un paysage gauche et un portrait droit", () => {
  const result = layout.resolve(6000, 3840, {
    mode: layout.MODES.SPAN,
    portraitShare: 36,
    alignment: 1,
  });
  const [left, right] = result.frames;
  assert.equal(result.mode, "span");
  assert.deepEqual(
    { role: left.role, x: left.x, y: left.y, width: left.width, height: left.height },
    { role: "landscape", x: 0, y: 840, width: 3840, height: 2160 },
  );
  assert.deepEqual(
    { role: right.role, x: right.x, y: right.y, width: right.width, height: right.height },
    { role: "portrait", x: 3840, y: 0, width: 2160, height: 3840 },
  );
});

test("la part portrait est bornée pour éviter une géométrie inutilisable", () => {
  const tooSmall = layout.resolve(1000, 600, { mode: 1, portraitShare: 5 });
  const tooLarge = layout.resolve(1000, 600, { mode: 1, portraitShare: 90 });
  assert.equal(tooSmall.frames[1].width, 200);
  assert.equal(tooLarge.frames[1].width, 550);
});

test("l’alignement du paysage accepte haut, centre et bas", () => {
  const top = layout.resolve(6000, 3840, { mode: 1, portraitShare: 36, alignment: 0 });
  const center = layout.resolve(6000, 3840, { mode: 1, portraitShare: 36, alignment: 1 });
  const bottom = layout.resolve(6000, 3840, { mode: 1, portraitShare: 36, alignment: 2 });
  assert.equal(top.frames[0].y, 0);
  assert.equal(center.frames[0].y, 840);
  assert.equal(bottom.frames[0].y, 1680);
});
