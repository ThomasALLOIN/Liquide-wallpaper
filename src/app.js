(function startLiquidMarbleWallpaper() {
  "use strict";

  const layout = window.WallpaperLayout;
  const marble = window.MarbleConfig;
  const canvas = document.getElementById("wallpaper");
  const debugPanel = document.getElementById("debug");
  const debugHour = document.getElementById("debug-hour");
  const errorPanel = document.getElementById("render-error");
  const query = new URLSearchParams(window.location.search);
  const hostConfig = window.WallpaperHostConfig || {};
  const SEED_ROTATION_MS = 2 * 60 * 60 * 1000;
  const SEED_STORAGE_KEY = "liquide-wallpaper-rotating-seed-v1";
  document.documentElement.dataset.platform = query.get("platform") || hostConfig.platform || "web";

  const settings = {
    displayLayout: layout.normalizeMode(query.get("layout") || hostConfig.layout || 0),
    portraitShare: Number(query.get("portraitShare") || 36),
    landscapeAlignment: Number(query.get("align") || 1),
    flowSpeed: 16,
    intensity: 32,
    veinDensity: 36,
    veinWidth: 38,
    distortion: 46,
    surfaceGrain: 22,
    contrast: 72,
    randomSeed: 9287,
    dayReturn: 7,
    dimmingStart: 18,
    nightStart: 22,
    timeOffset: 0,
    dayBaseColor: marble.DEFAULT_COLORS.dayBase,
    dayVeinColor: marble.DEFAULT_COLORS.dayVein,
    nightBaseColor: marble.DEFAULT_COLORS.nightBase,
    nightVeinColor: marble.DEFAULT_COLORS.nightVein,
    quality: 0,
    frameRate: 1,
  };

  const runtime = {
    width: 1,
    height: 1,
    pixelRatio: 1,
    paused: false,
    lastFrame: 0,
    motionTime: 0,
    lastMotionUpdate: performance.now(),
    startedAt: performance.now(),
    fixedHour: query.has("hour") ? Number(query.get("hour")) : null,
    previewSpeed: Number(query.get("speed") || 0),
    fixedSeed: query.has("seed"),
    seedPeriod: null,
  };

  function normalizeSeed(value) {
    const numeric = Math.round(Number(value));
    if (!Number.isFinite(numeric)) return 9287;
    return Math.min(999999, Math.max(1, numeric));
  }

  function generateRandomSeed() {
    const values = new Uint32Array(1);
    window.crypto?.getRandomValues?.(values);
    return 1 + (values[0] || Math.floor(Math.random() * 999999)) % 999999;
  }

  function updateRotatingSeed(now = Date.now()) {
    if (runtime.fixedSeed) return false;
    const period = Math.floor(now / SEED_ROTATION_MS);
    if (runtime.seedPeriod === period) return false;
    runtime.seedPeriod = period;
    try {
      const saved = JSON.parse(window.localStorage.getItem(SEED_STORAGE_KEY) || "{}");
      settings.randomSeed = saved.period === period
        ? normalizeSeed(saved.seed)
        : generateRandomSeed();
      window.localStorage.setItem(SEED_STORAGE_KEY, JSON.stringify({ period, seed: settings.randomSeed }));
    } catch (error) {
      settings.randomSeed = generateRandomSeed();
      console.warn("Seed tournante non conservée", error);
    }
    return true;
  }

  if (runtime.fixedSeed) settings.randomSeed = normalizeSeed(query.get("seed"));

  const vertexShaderSource = `#version 300 es
    in vec2 a_position;
    out vec2 v_uv;

    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `#version 300 es
    precision highp float;

    in vec2 v_uv;
    out vec4 outColor;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_light;
    uniform float u_intensity;
    uniform float u_density;
    uniform float u_veinWidth;
    uniform float u_distortion;
    uniform float u_grain;
    uniform float u_contrast;
    uniform float u_seed;
    uniform float u_portrait;
    uniform float u_span;
    uniform float u_split;
    uniform vec4 u_leftFrame;
    uniform vec3 u_dayBase;
    uniform vec3 u_dayVein;
    uniform vec3 u_nightBase;
    uniform vec3 u_nightVein;

    float hash21(vec2 p) {
      p += vec2(u_seed * 0.01317, u_seed * 0.00731);
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.52;
      mat2 rotation = mat2(0.80, 0.60, -0.60, 0.80);
      for (int octave = 0; octave < 4; octave++) {
        value += amplitude * noise(p);
        p = rotation * p * 2.03 + vec2(7.1, 3.7);
        amplitude *= 0.5;
      }
      return value;
    }

    vec2 bendStrata(vec2 point, vec2 center, float twist, float radius) {
      vec2 delta = point - center;
      float normalizedRadius = length(delta) / max(radius, 0.001);
      float influence = exp(-normalizedRadius * normalizedRadius * 1.35);
      float angle = twist * influence;
      float cosine = cos(angle);
      float sine = sin(angle);
      return center + mat2(cosine, -sine, sine, cosine) * delta;
    }

    void main() {
      vec2 localUv = v_uv;
      vec2 localResolution = u_resolution;
      float portrait = u_portrait;

      if (u_span > 0.5) {
        if (v_uv.x < u_split) {
          localUv.x = v_uv.x / max(u_split, 0.001);
          localUv.y = (v_uv.y - u_leftFrame.y) / max(u_leftFrame.w, 0.001);
          localResolution = vec2(u_resolution.x * u_split, u_resolution.y * u_leftFrame.w);
          portrait = 0.0;
        } else {
          localUv = vec2((v_uv.x - u_split) / max(1.0 - u_split, 0.001), v_uv.y);
          localResolution = vec2(u_resolution.x * (1.0 - u_split), u_resolution.y);
          portrait = 1.0;
        }
      }

      float minimumSide = max(1.0, min(localResolution.x, localResolution.y));
      vec2 p = (localUv * localResolution - localResolution * 0.5) / minimumSide;
      float t = u_time;
      vec2 flowLandscape = vec2(t * 0.026, sin(t * 0.11) * 0.018);
      vec2 flowPortrait = vec2(sin(t * 0.09) * 0.016, -t * 0.029);
      vec2 flow = mix(flowLandscape, flowPortrait, portrait);

      p += vec2(5.37, -3.11) * portrait;
      p *= u_density;
      // La référence est stratifiée : une seule courbure large remplace les spirales liquides.
      float seedA = hash21(vec2(1.2, 7.4));
      float seedB = hash21(vec2(8.6, 2.7));
      float seedC = hash21(vec2(4.1, 9.3));
      const float TAU = 6.2831853;
      float motion = t * 0.14;
      vec2 orbit = vec2(
        sin(motion + seedA * TAU),
        cos(motion + seedB * TAU)
      );
      float distortionLevel = clamp((u_distortion - 0.45) / 2.25, 0.0, 1.0);
      float deformAmp = mix(0.06, 0.13, distortionLevel);
      float bend = mix(0.06, 0.55, u_intensity) * (1.0 + orbit.x * deformAmp);
      vec2 bendCenter = vec2(mix(-0.35, 0.45, seedB), mix(-0.20, 0.35, seedC));
      bendCenter += orbit * 0.012;
      vec2 curved = bendStrata(p, bendCenter, bend, mix(1.80, 2.60, seedB));

      float strataAngle = mix(-0.48, -0.18, seedA) - portrait * 0.14;
      float ca = cos(strataAngle);
      float sa = sin(strataAngle);
      vec2 q = mat2(ca, -sa, sa, ca) * curved;
      vec2 strata = vec2(q.x * 0.34, q.y * 1.25);
      strata.y += 0.38;

      vec2 slowWarp = vec2(
        fbm(strata * 0.28 + vec2(seedA * 5.2, seedB * -3.1) + flow * 0.11),
        fbm(strata * 0.34 + vec2(-4.7, 8.3) - flow * 0.09)
      ) - 0.5;
      float deformationBreath = 1.0 + orbit.y * deformAmp * 0.72;
      float warpAmount = mix(0.12, 0.42, distortionLevel) * deformationBreath;
      vec2 marbleDomain = strata + slowWarp * warpAmount;

      float macro = fbm(marbleDomain * 0.62 + flow * 0.035);
      float layer = fbm(
        marbleDomain * 1.25
        + slowWarp * 0.35
        + vec2(macro * 0.28, -macro * 0.20)
        - flow * 0.027
      );
      float geology = layer * 0.72 + macro * 0.28;
      float detail = fbm(marbleDomain * 2.40 + vec2(layer * 0.55, macro * -0.42));
      float veil = fbm(p * 0.24 + vec2(seedA * 2.7, seedB * 3.4) + flow * 0.014);
      float striation = fbm(
        vec2(marbleDomain.x * 0.72, marbleDomain.y * 4.10)
        + vec2(seedB * 4.1, seedC * -2.8)
        + flow * 0.018
      );
      vec2 crossDomain = mat2(0.94, -0.34, 0.34, 0.94) * marbleDomain;
      float crossStriation = fbm(
        vec2(crossDomain.x * 0.82, crossDomain.y * 3.35)
        + vec2(-6.4, 2.7)
        - flow * 0.012
      );
      vec2 microDomain = vec2(marbleDomain.x * 3.8, marbleDomain.y * 15.5);
      float microTexture = noise(
        microDomain + vec2(seedC * 9.7, seedA * -6.2) + flow * 0.025
      );
      float microLayer = noise(
        microDomain * 1.72 + vec2(-3.8, 11.6) - flow * 0.019
      );

      float contourTarget = mix(0.48, 0.56, seedC);
      float sheetField = geology
        + (macro - 0.5) * 0.075
        + (detail - 0.5) * mix(0.018, 0.042, distortionLevel);
      float sheetThreshold = contourTarget - 0.075
        + mix(0.045, -0.055, clamp(u_veinWidth * 4.0, 0.0, 1.0));
      float sheetSoftness = mix(0.105, 0.034, u_contrast);
      float veinSheet = smoothstep(
        sheetThreshold - sheetSoftness,
        sheetThreshold + sheetSoftness,
        sheetField
      );
      float edgeDistance = abs(sheetField - sheetThreshold);
      float brokenEdge = 1.0 - smoothstep(sheetSoftness * 0.22, sheetSoftness, edgeDistance);
      brokenEdge *= mix(0.38, 1.0, smoothstep(0.30, 0.76, detail));
      float secondaryDistance = abs(
        sheetField - sheetThreshold + mix(0.075, 0.125, seedA)
      );
      float secondaryLamina = 1.0 - smoothstep(0.008, 0.034, secondaryDistance);
      secondaryLamina *= mix(0.45, 1.0, smoothstep(0.24, 0.74, macro));
      // Une rampe anisotrope ouvre les iso-contours et les aligne sur les
      // strates. Les champs de bruit ne font ensuite que plier et interrompre
      // les filons, sans créer de boucles topographiques fermées.
      float markedWidth = clamp((u_veinWidth - 0.022) / 0.16, 0.0, 1.0);
      float markedScale = mix(0.82, 1.22, markedWidth);
      float bedAxis = marbleDomain.y * 0.115 + marbleDomain.x * 0.018;
      float portraitVeinShift = portrait * mix(0.055, 0.085, seedB);
      float markedField = bedAxis
        + (macro - 0.5) * 0.090
        + (layer - 0.5) * 0.055
        + (detail - 0.5) * 0.018
        + portraitVeinShift;
      float target0 = mix(-0.015, 0.035, seedA);
      float target1 = target0 + mix(0.085, 0.125, seedB);
      float target2 = target0 - mix(0.070, 0.105, seedC);
      float distance0 = abs(markedField - target0);
      float distance1 = abs(markedField - target1);
      float distance2 = abs(markedField - target2);
      float markedPixel = max(fwidth(markedField), 0.0008)
        * mix(1.24, 0.88, u_contrast);

      float core0 = 1.0 - smoothstep(markedPixel * 1.1, markedPixel * 3.0, distance0);
      float body0 = 1.0 - smoothstep(0.003, 0.017 * markedScale, distance0);
      float halo0 = 1.0 - smoothstep(0.014, 0.040 * markedScale, distance0);
      float core1 = 1.0 - smoothstep(markedPixel, markedPixel * 2.6, distance1);
      float body1 = 1.0 - smoothstep(0.0025, 0.013 * markedScale, distance1);
      float halo1 = 1.0 - smoothstep(0.011, 0.032 * markedScale, distance1);
      float core2 = 1.0 - smoothstep(markedPixel * 0.9, markedPixel * 2.3, distance2);
      float body2 = 1.0 - smoothstep(0.002, 0.0105 * markedScale, distance2);
      float halo2 = 1.0 - smoothstep(0.009, 0.027 * markedScale, distance2);

      float gate0 = smoothstep(
        0.30,
        0.58,
        detail * 0.60 + striation * 0.40
      );
      float gate1 = smoothstep(
        0.42,
        0.66,
        detail * 0.55 + macro * 0.45
      );
      float gate2 = smoothstep(
        0.46,
        0.68,
        detail * 0.50 + crossStriation * 0.50
      );
      float markedCore = max(
        core0 * gate0,
        max(core1 * gate1, core2 * gate2)
      );
      float markedBody = max(
        body0 * mix(0.25, 1.0, gate0),
        max(body1 * mix(0.25, 1.0, gate1), body2 * mix(0.25, 1.0, gate2))
      );
      float markedHalo = max(
        halo0,
        max(halo1 * mix(0.35, 1.0, gate1), halo2 * mix(0.35, 1.0, gate2))
      );

      // Les fractures croisées suivent un iso-contour déjà calculé. fwidth
      // conserve une âme de quelques pixels en Retina, 2K et 4K.
      float fractureDistance = abs(crossStriation - mix(0.53, 0.59, seedA));
      float fracturePixel = max(fwidth(crossStriation), 0.0008);
      float fractureCore = 1.0 - smoothstep(
        fracturePixel,
        fracturePixel * 2.5,
        fractureDistance
      );
      float fractureHalo = 1.0 - smoothstep(
        fracturePixel * 2.5,
        fracturePixel * 7.0,
        fractureDistance
      );
      float fractureGate = smoothstep(
        0.44,
        0.62,
        detail * 0.65 + macro * 0.35
      ) * mix(0.50, 1.0, markedHalo);
      float markedFracture = (fractureHalo * 0.08 + fractureCore * 0.26) * fractureGate;

      // Couche de traits contrastés inspirée des premiers essais : chaque
      // cellule porte un fragment court et seedé, parfois ramifié. Le champ
      // anisotrope garde les traits ouverts et alignés sur les strates.
      float traitAlong = marbleDomain.x * mix(5.4, 7.2, portrait)
        + marbleDomain.y * mix(0.42, 0.30, portrait)
        + seedB * 11.0;
      float traitCell = floor(traitAlong);
      float traitPhase = fract(traitAlong);
      float traitRandA = hash21(vec2(traitCell + 19.0, 41.0 + portrait * 13.0));
      float traitRandB = hash21(vec2(traitCell - 7.0, 83.0 + seedC * 9.0));
      float traitStart = mix(0.07, 0.23, traitRandA);
      float traitEnd = mix(0.58, 0.91, traitRandB);
      float traitWindow = smoothstep(traitStart, traitStart + 0.110, traitPhase)
        * (1.0 - smoothstep(traitEnd - 0.120, traitEnd, traitPhase));
      float traitRarityThreshold = mix(0.18, 0.08, portrait);
      traitWindow *= smoothstep(
        traitRarityThreshold,
        traitRarityThreshold + 0.20,
        traitRandA
      );
      float traitTextureGate = smoothstep(
        0.34,
        0.64,
        detail * 0.45 + striation * 0.35 + microLayer * 0.20
      );
      traitWindow *= mix(0.52, 1.0, traitTextureGate);

      float traitTarget = target0
        + mix(-0.050, 0.048, traitRandA)
        + (detail - 0.5) * 0.008
        + (microTexture - 0.5) * 0.004;
      float traitSigned = markedField - traitTarget;

      // Une inclusion mesurée en pixels évite l'effet « cheveu ». Sa gangue
      // diffuse l'intègre à la pierre, sans halo blanc ni boucle fermée.
      float detailCorePixels = mix(3.20, 2.45, u_contrast)
        * mix(0.94, 1.12, markedWidth);
      float detailShoulderPixels = mix(4.20, 6.80, portrait)
        * mix(1.05, 0.88, u_contrast);
      float detailTexture = smoothstep(
        0.34,
        0.66,
        microTexture * 0.42 + microLayer * 0.34 + detail * 0.24
      );

      // Inclusion A : fragment principal aux extrémités poudreuses.
      traitWindow *= 1.0 - markedCore * mix(0.30, 0.18, portrait);
      float traitPixel = max(
        length(vec2(dFdx(traitSigned), dFdy(traitSigned))),
        0.00001
      );
      float traitDistancePx = abs(traitSigned) / traitPixel;
      float traitTaper = mix(0.62, 1.0, traitWindow);
      float traitCoreMask = 1.0 - smoothstep(
        detailCorePixels * traitTaper - 0.45,
        detailCorePixels * traitTaper + 0.60,
        traitDistancePx
      );
      float traitCore = traitCoreMask * traitWindow;
      float traitOuter = 1.0 - smoothstep(
        detailCorePixels * traitTaper + 0.30,
        detailCorePixels * traitTaper + detailShoulderPixels,
        traitDistancePx
      );
      float traitShoulder = max(0.0, traitOuter - traitCoreMask * 0.58) * traitWindow;

      // Trait B : fragment indépendant entre les deux premières nappes.
      float traitAlongB = traitAlong * 0.87 + seedA * 5.70 + 0.37;
      float traitCellB = floor(traitAlongB);
      float traitPhaseB = fract(traitAlongB);
      float traitRandC = hash21(vec2(traitCellB + 53.0, 17.0 + portrait * 19.0));
      float traitRandD = fract(traitRandC * 1.6180339 + seedB * 0.73 + 0.17);
      float traitStartB = mix(0.08, 0.25, traitRandC);
      float traitEndB = mix(0.57, 0.90, traitRandD);
      float traitWindowB = smoothstep(traitStartB, traitStartB + 0.120, traitPhaseB)
        * (1.0 - smoothstep(traitEndB - 0.140, traitEndB, traitPhaseB));
      traitWindowB *= smoothstep(
        mix(0.42, 0.24, portrait),
        mix(0.64, 0.44, portrait),
        traitRandC
      );
      traitWindowB *= mix(0.62, 1.0, detailTexture);
      float traitSignB = mix(-1.0, 1.0, step(0.5, traitRandD));
      float traitTargetB = mix(target0, target1, mix(0.42, 0.68, traitRandC))
        + traitSignB * (traitPhaseB - 0.5) * mix(0.008, 0.022, traitRandD)
        + (detail - 0.5) * 0.006;
      float traitSignedB = markedField - traitTargetB;
      float traitPixelB = max(
        length(vec2(dFdx(traitSignedB), dFdy(traitSignedB))),
        0.00001
      );
      float traitDistancePxB = abs(traitSignedB) / traitPixelB;
      float traitTaperB = mix(0.58, 1.0, traitWindowB);
      float traitCoreMaskB = 1.0 - smoothstep(
        detailCorePixels * 0.92 * traitTaperB - 0.42,
        detailCorePixels * 0.92 * traitTaperB + 0.58,
        traitDistancePxB
      );
      float traitCoreB = traitCoreMaskB * traitWindowB;
      float traitOuterB = 1.0 - smoothstep(
        detailCorePixels * 0.92 * traitTaperB + 0.25,
        detailCorePixels * 0.92 * traitTaperB + detailShoulderPixels * 0.92,
        traitDistancePxB
      );
      float traitShoulderB = max(0.0, traitOuterB - traitCoreMaskB * 0.58) * traitWindowB;

      // Trait C : plus rare en paysage, mais assez dense sur le décor vertical.
      float traitAlongC = traitAlong * 1.13 - seedC * 4.90 + 0.61;
      float traitCellC = floor(traitAlongC);
      float traitPhaseC = fract(traitAlongC);
      float traitRandE = hash21(vec2(traitCellC - 31.0, 109.0 + portrait * 23.0));
      float traitRandF = fract(traitRandE * 2.4142136 + seedA * 0.61 + 0.29);
      float traitStartC = mix(0.10, 0.28, traitRandE);
      float traitEndC = mix(0.54, 0.86, traitRandF);
      float traitWindowC = smoothstep(traitStartC, traitStartC + 0.130, traitPhaseC)
        * (1.0 - smoothstep(traitEndC - 0.150, traitEndC, traitPhaseC));
      traitWindowC *= smoothstep(
        mix(0.56, 0.34, portrait),
        mix(0.78, 0.54, portrait),
        traitRandE
      );
      traitWindowC *= mix(0.58, 1.0, detailTexture);
      float traitSignC = mix(-1.0, 1.0, step(0.5, traitRandF));
      float traitTargetC = mix(target0, target2, mix(0.38, 0.64, traitRandE))
        + traitSignC * (traitPhaseC - 0.5) * mix(0.007, 0.020, traitRandF)
        + (microTexture - 0.5) * 0.005;
      float traitSignedC = markedField - traitTargetC;
      float traitPixelC = max(
        length(vec2(dFdx(traitSignedC), dFdy(traitSignedC))),
        0.00001
      );
      float traitDistancePxC = abs(traitSignedC) / traitPixelC;
      float traitTaperC = mix(0.56, 1.0, traitWindowC);
      float traitCoreMaskC = 1.0 - smoothstep(
        detailCorePixels * 0.86 * traitTaperC - 0.40,
        detailCorePixels * 0.86 * traitTaperC + 0.55,
        traitDistancePxC
      );
      float traitCoreC = traitCoreMaskC * traitWindowC;
      float traitOuterC = 1.0 - smoothstep(
        detailCorePixels * 0.86 * traitTaperC + 0.22,
        detailCorePixels * 0.86 * traitTaperC + detailShoulderPixels * 0.82,
        traitDistancePxC
      );
      float traitShoulderC = max(0.0, traitOuterC - traitCoreMaskC * 0.58) * traitWindowC;

      float detailTraits = max(
        traitCore,
        max(traitCoreB, traitCoreC)
      ) * mix(0.78, 1.0, detailTexture);
      float detailShoulders = max(
        traitShoulder,
        max(traitShoulderB, traitShoulderC)
      ) * mix(0.66, 1.0, detailTexture);
      float darkMass = smoothstep(
        0.47,
        0.68,
        macro + (layer - 0.5) * 0.18 + (detail - 0.5) * 0.07
      );
      float brokenFibers = smoothstep(0.62, 0.80, detail + (layer - 0.5) * 0.25);
      float fiberDistance = abs(detail - mix(0.48, 0.54, seedB));
      float fineFibers = 1.0 - smoothstep(0.007, 0.025, fiberDistance);
      fineFibers *= smoothstep(0.28, 0.72, layer) * (1.0 - brokenEdge * 0.55);
      float striationRidge = 1.0 - smoothstep(0.018, 0.085, abs(striation - 0.52));
      float crossRidge = 1.0 - smoothstep(0.010, 0.042, abs(crossStriation - 0.57));
      striationRidge *= mix(0.40, 1.0, smoothstep(0.24, 0.78, detail));
      crossRidge *= smoothstep(0.40, 0.82, macro);
      float chalkDust = smoothstep(0.54, 0.74, detail + (striation - 0.5) * 0.20);
      chalkDust *= mix(0.45, 1.0, smoothstep(0.26, 0.72, layer));
      float microRidge = 1.0 - smoothstep(
        0.018,
        0.070,
        abs(microTexture * 0.68 + microLayer * 0.32 - 0.52)
      );
      microRidge *= mix(0.38, 1.0, smoothstep(0.30, 0.76, detail));

      vec3 baseColor = mix(u_nightBase, u_dayBase, u_light);
      vec3 veinColor = mix(u_nightVein, u_dayVein, u_light);
      vec3 middleColor = mix(baseColor, veinColor, mix(0.68, 0.38, u_light));

      float stoneField = clamp(
        0.48
        + (macro - 0.5) * 0.78
        + (layer - 0.5) * 0.48
        + (detail - 0.5) * 0.12,
        0.0,
        1.0
      );
      stoneField = pow(stoneField, 0.70);
      vec3 stone = mix(baseColor, middleColor, stoneField);
      stone = mix(stone, middleColor, darkMass * mix(0.52, 0.35, u_light));

      float baseVein = clamp(
        veinSheet * 0.16 + brokenEdge * 0.07 + secondaryLamina * 0.10,
        0.0,
        0.38
      );
      vec3 color = mix(stone, veinColor, baseVein);
      color = mix(color, middleColor, brokenFibers * (1.0 - brokenEdge) * 0.26);
      color = mix(color, veinColor, fineFibers * mix(0.080, 0.20, u_grain));
      float mineralAccent = mix(1.65, 1.0, u_light);
      color = mix(
        color,
        veinColor,
        (striationRidge * 0.23
          + crossRidge * 0.12
          + chalkDust * 0.16
          + microRidge * 0.13) * mineralAccent
      );
      color += vec3((detail - 0.5) * mix(0.22, 0.19, u_light));
      color += vec3((microTexture - 0.5) * mix(0.11, 0.085, u_light));
      color += vec3((veil - 0.5) * mix(0.055, 0.085, u_light));
      float portraitVeinBoost = mix(1.0, 1.42, portrait);
      color = mix(color, middleColor, markedHalo * 0.05 * portraitVeinBoost);
      color = mix(
        color,
        veinColor,
        clamp(
          (markedBody * 0.33 + markedCore * 0.54) * portraitVeinBoost,
          0.0,
          mix(0.76, 0.84, portrait)
        )
      );
      color = mix(color, veinColor, markedFracture * mix(1.0, 1.25, portrait));

      vec3 detailShoulderColor = mix(
        middleColor,
        veinColor,
        0.30
      );
      float detailShoulderOpacity = detailShoulders
        * mix(0.18, 0.28, u_contrast)
        * mix(1.0, 1.35, portrait);
      color = mix(
        color,
        detailShoulderColor,
        clamp(detailShoulderOpacity, 0.0, 0.42)
      );

      vec3 detailTraitColor = mix(
        middleColor,
        veinColor,
        0.58
      );
      detailTraitColor += vec3((microTexture - 0.5) * 0.045);
      float detailTraitOpacity = detailTraits
        * mix(0.42, 0.58, u_contrast)
        * mix(1.0, 1.18, portrait);
      color = mix(
        color,
        detailTraitColor,
        clamp(detailTraitOpacity, 0.0, 0.68)
      );

      float topShadow = smoothstep(0.56, 0.98, localUv.y);
      topShadow *= mix(0.82, 1.08, veil);
      color *= 1.0 - topShadow * mix(0.72, 0.22, u_light);
      float bottomShadow = 1.0 - smoothstep(0.02, 0.38, localUv.y);
      bottomShadow *= mix(0.88, 1.06, macro);
      color *= 1.0 - bottomShadow * mix(0.55, 0.16, u_light);
      float vignette = smoothstep(0.70, 1.28, length((localUv - 0.5) * vec2(0.78, 1.0)));
      color *= 1.0 - vignette * mix(0.16, 0.07, u_light);

      // Grain fin et poussières très rares, proches d'une surface photographiée.
      float grain = (hash21(gl_FragCoord.xy) - 0.5) * u_grain * 0.018;
      color += grain;
      float sparkleNoise = hash21(floor(gl_FragCoord.xy * 0.72) + vec2(31.0, 17.0));
      float sparkle = step(mix(0.99995, 0.99940, u_grain), sparkleNoise);
      vec3 sparkleColor = mix(vec3(0.64), vec3(0.16), u_light);
      color = mix(color, sparkleColor, sparkle * mix(0.04, 0.16, u_grain));
      color = clamp(color, 0.0, 1.0);
      outColor = vec4(color, 1.0);
    }
  `;

  function showError(message) {
    errorPanel.hidden = false;
    errorPanel.textContent = message;
  }

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const details = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(details || "Compilation du shader impossible.");
    }
    return shader;
  }

  function createProgram(gl) {
    const program = gl.createProgram();
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const details = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(details || "Liaison du programme WebGL impossible.");
    }
    return program;
  }

  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    showError("WebGL 2 est nécessaire pour afficher le marbre monochrome.");
    return;
  }

  let program;
  try {
    program = createProgram(gl);
  } catch (error) {
    console.error(error);
    showError("Le shader du marbre monochrome n’a pas pu démarrer.");
    return;
  }

  gl.useProgram(program);
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uniformNames = [
    "u_resolution", "u_time", "u_light", "u_intensity", "u_density", "u_veinWidth",
    "u_distortion", "u_grain", "u_contrast", "u_seed", "u_portrait", "u_span", "u_split",
    "u_leftFrame", "u_dayBase", "u_dayVein", "u_nightBase", "u_nightVein",
  ];
  const uniforms = Object.fromEntries(uniformNames.map((name) => [name, gl.getUniformLocation(program, name)]));

  function resize() {
    runtime.width = Math.max(1, window.innerWidth);
    runtime.height = Math.max(1, window.innerHeight);
    runtime.pixelRatio = marble.getBackingScale(settings.quality, window.devicePixelRatio);
    canvas.width = Math.max(1, Math.round(runtime.width * runtime.pixelRatio));
    canvas.height = Math.max(1, Math.round(runtime.height * runtime.pixelRatio));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function getCurrentDate() {
    const date = new Date();
    date.setMinutes(date.getMinutes() + settings.timeOffset * 60);
    return date;
  }

  function getHour(nowMs) {
    if (Number.isFinite(runtime.fixedHour)) return marble.normalizeHour(runtime.fixedHour);
    if (runtime.previewSpeed > 0) {
      return marble.normalizeHour(((nowMs - runtime.startedAt) / 1000) * runtime.previewSpeed / 60);
    }
    const date = getCurrentDate();
    return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  }

  function sendColor(location, value) {
    gl.uniform3fv(location, marble.parseHexColor(value));
  }

  function advanceMotionTime(nowMs) {
    const elapsedSeconds = Math.min(
      0.25,
      Math.max(0, (nowMs - runtime.lastMotionUpdate) / 1000),
    );
    runtime.lastMotionUpdate = nowMs;
    if (!runtime.paused) {
      runtime.motionTime += elapsedSeconds * marble.getVeinMotionRate(settings.flowSpeed);
    }
    return runtime.motionTime;
  }

  function updateDebugPanel(hour, lightLevel, screenLayout) {
    const phase = marble.getPhase(lightLevel);
    debugHour.textContent = `Heure simulée : ${hour.toFixed(2)} h — ${phase} — blanc ${(lightLevel * 100).toFixed(0)} % — disposition ${screenLayout.mode}`;
  }

  function render(nowMs) {
    updateRotatingSeed();
    const hour = getHour(nowMs);
    const lightLevel = marble.getLightLevel(hour, settings);
    const screenLayout = layout.resolve(runtime.width, runtime.height, {
      mode: settings.displayLayout,
      portraitShare: settings.portraitShare,
      alignment: settings.landscapeAlignment,
    });
    const isSpan = screenLayout.mode === "span";
    const leftFrame = screenLayout.frames[0];
    const portrait = !isSpan && screenLayout.frames[0].role === "portrait";
    const split = isSpan ? screenLayout.frames[1].x / runtime.width : 1;

    gl.useProgram(program);
    gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.u_time, advanceMotionTime(nowMs));
    gl.uniform1f(uniforms.u_light, lightLevel);
    gl.uniform1f(uniforms.u_intensity, settings.intensity / 100);
    gl.uniform1f(uniforms.u_density, 1.45 + settings.veinDensity / 100 * 2.85);
    gl.uniform1f(uniforms.u_veinWidth, 0.022 + settings.veinWidth / 100 * 0.16);
    gl.uniform1f(uniforms.u_distortion, 0.45 + settings.distortion / 100 * 2.25);
    gl.uniform1f(uniforms.u_grain, settings.surfaceGrain / 100);
    gl.uniform1f(uniforms.u_contrast, settings.contrast / 100);
    gl.uniform1f(uniforms.u_seed, normalizeSeed(settings.randomSeed));
    gl.uniform1f(uniforms.u_portrait, portrait ? 1 : 0);
    gl.uniform1f(uniforms.u_span, isSpan ? 1 : 0);
    gl.uniform1f(uniforms.u_split, split);
    gl.uniform4f(
      uniforms.u_leftFrame,
      leftFrame.x / runtime.width,
      (runtime.height - leftFrame.y - leftFrame.height) / runtime.height,
      leftFrame.width / runtime.width,
      leftFrame.height / runtime.height,
    );
    sendColor(uniforms.u_dayBase, settings.dayBaseColor);
    sendColor(uniforms.u_dayVein, settings.dayVeinColor);
    sendColor(uniforms.u_nightBase, settings.nightBaseColor);
    sendColor(uniforms.u_nightVein, settings.nightVeinColor);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    document.body.dataset.role = screenLayout.mode;
    updateDebugPanel(hour, lightLevel, screenLayout);
  }

  function frame(nowMs) {
    const targetFps = marble.getTargetFps(settings.frameRate);
    if (!runtime.paused && nowMs - runtime.lastFrame >= 1000 / targetFps) {
      runtime.lastFrame = nowMs;
      render(nowMs);
    }
    window.requestAnimationFrame(frame);
  }

  window.livelyPropertyListener = function livelyPropertyListener(name, value) {
    const numericSettings = new Set([
      "displayLayout", "portraitShare", "landscapeAlignment", "flowSpeed", "intensity", "veinDensity",
      "veinWidth", "distortion", "surfaceGrain", "contrast", "dayReturn", "dimmingStart",
      "nightStart", "timeOffset", "quality", "frameRate",
    ]);
    const colorSettings = new Set(["dayBaseColor", "dayVeinColor", "nightBaseColor", "nightVeinColor"]);
    if (numericSettings.has(name)) settings[name] = Number(value);
    else if (colorSettings.has(name)) settings[name] = String(value);
    if (name === "quality") resize();
    render(performance.now());
  };

  window.livelyWallpaperPlaybackChanged = function livelyWallpaperPlaybackChanged(data) {
    try {
      runtime.paused = Boolean(JSON.parse(data).IsPaused);
      runtime.lastMotionUpdate = performance.now();
    } catch (error) {
      console.warn("Événement de pause Lively invalide", error);
    }
  };

  document.addEventListener("visibilitychange", () => {
    runtime.paused = document.hidden;
    runtime.lastMotionUpdate = performance.now();
    if (!runtime.paused) render(performance.now());
  });
  window.addEventListener("resize", () => {
    resize();
    render(performance.now());
  });

  debugPanel.hidden = query.get("debug") !== "1";
  updateRotatingSeed();
  resize();
  render(performance.now());
  window.requestAnimationFrame(frame);
})();
