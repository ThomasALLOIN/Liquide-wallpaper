(function initWallpaperLayout(globalScope) {
  "use strict";

  const MODES = {
    AUTO: 0,
    SPAN: 1,
    LANDSCAPE: 2,
    PORTRAIT: 3,
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeMode(value) {
    if (typeof value === "string") {
      const names = { auto: 0, span: 1, landscape: 2, portrait: 3 };
      if (Object.hasOwn(names, value.toLowerCase())) return names[value.toLowerCase()];
    }
    const numeric = Number(value);
    return Number.isInteger(numeric) && numeric >= 0 && numeric <= 3 ? numeric : MODES.AUTO;
  }

  function verticalOffset(availableHeight, contentHeight, alignment) {
    if (alignment === 0) return 0;
    if (alignment === 2) return Math.max(0, availableHeight - contentHeight);
    return Math.max(0, (availableHeight - contentHeight) / 2);
  }

  function resolve(width, height, options = {}) {
    const safeWidth = Math.max(1, Number(width) || 1);
    const safeHeight = Math.max(1, Number(height) || 1);
    const mode = normalizeMode(options.mode);

    if (mode === MODES.SPAN) {
      const portraitShare = clamp(Number(options.portraitShare) || 36, 20, 55) / 100;
      const portraitWidth = safeWidth * portraitShare;
      const landscapeWidth = safeWidth - portraitWidth;
      const landscapeHeight = Math.min(safeHeight, landscapeWidth * 9 / 16);
      const requestedAlignment = Number(options.alignment);
      const alignment = clamp(
        Math.round(Number.isFinite(requestedAlignment) ? requestedAlignment : 1),
        0,
        2,
      );

      return {
        mode: "span",
        frames: [
          {
            role: "landscape",
            x: 0,
            y: verticalOffset(safeHeight, landscapeHeight, alignment),
            width: landscapeWidth,
            height: landscapeHeight,
          },
          {
            role: "portrait",
            x: landscapeWidth,
            y: 0,
            width: portraitWidth,
            height: safeHeight,
          },
        ],
      };
    }

    const forcedRole = mode === MODES.LANDSCAPE
      ? "landscape"
      : mode === MODES.PORTRAIT
        ? "portrait"
        : null;
    const role = forcedRole || (safeHeight > safeWidth * 1.08 ? "portrait" : "landscape");
    return {
      mode: role,
      frames: [{ role, x: 0, y: 0, width: safeWidth, height: safeHeight }],
    };
  }

  const api = { MODES, clamp, normalizeMode, verticalOffset, resolve };
  globalScope.WallpaperLayout = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
