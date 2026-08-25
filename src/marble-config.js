(function initMarbleConfig(globalScope) {
  "use strict";

  const DEFAULT_COLORS = {
    dayBase: "#e7e5df",
    dayVein: "#181a1d",
    nightBase: "#08090b",
    nightVein: "#7c7d80",
  };

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeHour(hour) {
    return ((Number(hour) % 24) + 24) % 24;
  }

  function smoothstep(edge0, edge1, value) {
    if (edge0 === edge1) return value < edge0 ? 0 : 1;
    const t = clamp((value - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  }

  function parseHexColor(hex) {
    const fallback = [0, 0, 0];
    if (typeof hex !== "string") return fallback;
    const clean = hex.trim().replace("#", "");
    const expanded = clean.length === 3
      ? clean.split("").map((part) => part + part).join("")
      : clean;
    if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return fallback;
    const value = Number.parseInt(expanded, 16);
    return [
      ((value >> 16) & 255) / 255,
      ((value >> 8) & 255) / 255,
      (value & 255) / 255,
    ];
  }

  function mixColor(colorA, colorB, amount) {
    const t = clamp(amount);
    return colorA.map((channel, index) => channel + (colorB[index] - channel) * t);
  }

  function getLightLevel(hour, options = {}) {
    const normalized = normalizeHour(hour);
    const dayReturn = Number.isFinite(options.dayReturn) ? options.dayReturn : 7;
    const dimmingStart = Number.isFinite(options.dimmingStart) ? options.dimmingStart : 18;
    const requestedNightStart = Number.isFinite(options.nightStart) ? options.nightStart : 22;
    const nightStart = Math.max(dimmingStart + 0.25, requestedNightStart);
    const morning = smoothstep(dayReturn, Math.min(dayReturn + 1.5, dimmingStart), normalized);
    const evening = 1 - smoothstep(dimmingStart, nightStart, normalized);
    return clamp(morning * evening);
  }

  function getPhase(lightLevel) {
    if (lightLevel <= 0.04) return "Nuit";
    if (lightLevel < 0.82) return "Transition";
    return "Jour";
  }

  function resolvePalette(lightLevel, colors = DEFAULT_COLORS) {
    const light = smoothstep(0.02, 0.98, lightLevel);
    const dayBase = parseHexColor(colors.dayBase || DEFAULT_COLORS.dayBase);
    const dayVein = parseHexColor(colors.dayVein || DEFAULT_COLORS.dayVein);
    const nightBase = parseHexColor(colors.nightBase || DEFAULT_COLORS.nightBase);
    const nightVein = parseHexColor(colors.nightVein || DEFAULT_COLORS.nightVein);
    return {
      base: mixColor(nightBase, dayBase, light),
      vein: mixColor(nightVein, dayVein, light),
    };
  }

  function getRenderScale(quality) {
    return [0.6, 0.78, 1][clamp(Math.round(Number(quality) || 0), 0, 2)];
  }

  function getBackingScale(quality, devicePixelRatio = 1) {
    const numericRatio = Number(devicePixelRatio);
    const safeRatio = Number.isFinite(numericRatio) ? clamp(numericRatio, 1, 2) : 1;
    return getRenderScale(quality) * safeRatio;
  }

  function getTargetFps(frameRate) {
    return [15, 24, 30][clamp(Math.round(Number(frameRate) || 0), 0, 2)];
  }

  function getVeinMotionRate(flowSpeed) {
    const numericSpeed = Number(flowSpeed);
    return clamp(Number.isFinite(numericSpeed) ? numericSpeed : 0, 0, 400) / 100;
  }

  const api = {
    DEFAULT_COLORS,
    clamp,
    normalizeHour,
    smoothstep,
    parseHexColor,
    mixColor,
    getLightLevel,
    getPhase,
    resolvePalette,
    getRenderScale,
    getBackingScale,
    getTargetFps,
    getVeinMotionRate,
  };

  globalScope.MarbleConfig = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
