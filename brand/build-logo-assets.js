// Regenerates every logo asset the site serves, from the master artwork in
// this folder. Run from the repo root:  node brand/build-logo-assets.js
//
// The masters are 1662x1221 PNGs supplied by the designer. Everything under
// public/ and the browser-tab icon are derived, so never hand-edit those —
// change the master or this script and re-run.
//
// Requires sharp, which is already a dependency of next.

const fs = require("fs");
const sharp = require("sharp");

const SRC = __dirname + "/Nedi logo - transparent.png";
const PUB = "public/";

// Measured from the master by scanning the alpha channel, not eyeballed.
// The lockup is three stacked bands: emblem y155-539, "NEDI" y741-900,
// tagline y1036-1065, with content spanning x155-1506.
const CONTENT = { left: 155, top: 155, width: 1506 - 155 + 1, height: 1065 - 155 + 1 };
const EMBLEM = { left: 450, top: 155, width: 1211 - 450 + 1, height: 539 - 155 + 1 };
const GLYPH_N = { left: 385, top: 741, width: 551 - 385 + 1, height: 900 - 741 + 1 };

// The artwork sits flush against its own bounding box, so clear space is added
// back here — without it the tagline collides with whatever sits below it.
const PAD = { top: 60, bottom: 60, left: 60, right: 60, background: { r: 0, g: 0, b: 0, alpha: 0 } };

// The designer's reversed variant lightens the gold for dark grounds. Reusing
// the light-background gold instead goes muddy against navy.
const GOLD_ON_DARK = [225, 173, 102];

// Derive the dark-background version from the transparent master rather than
// keying out the reversed master's background — using the true alpha means no
// halo on the antialiased edges.
async function recolorForDarkBackground(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.from(data);
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    if (out[o + 3] === 0) continue;
    if (out[o] - out[o + 2] > 40) {
      // Warm pixel: this is the gold.
      [out[o], out[o + 1], out[o + 2]] = GOLD_ON_DARK;
    } else {
      // Neutral pixel: the dark ink, which becomes white.
      out[o] = out[o + 1] = out[o + 2] = 255;
    }
  }
  return sharp(out, { raw: { width, height, channels } }).png().toBuffer();
}

const png = { compressionLevel: 9, palette: true };

(async () => {
  const master = sharp(SRC);

  // Full lockup. 900px wide covers a 450px render at 2x device pixel ratio.
  await master.clone().extract(CONTENT).extend(PAD).resize({ width: 900 })
    .png(png).toFile(PUB + "logo-lockup.png");
  const lockup = await master.clone().extract(CONTENT).extend(PAD).resize({ width: 900 }).png().toBuffer();
  await sharp(await recolorForDarkBackground(lockup)).png(png).toFile(PUB + "logo-lockup-dark.png");

  // Emblem alone, for contexts with at least ~76px of height available —
  // below that its hairline strokes drop under one device pixel.
  await master.clone().extract(EMBLEM).extend(PAD).resize({ width: 600 })
    .png(png).toFile(PUB + "logo-emblem.png");
  const emblem = await master.clone().extract(EMBLEM).extend(PAD).resize({ width: 600 }).png().toBuffer();
  await sharp(await recolorForDarkBackground(emblem)).png(png).toFile(PUB + "logo-emblem-dark.png");

  // Browser-tab icon. The emblem is unreadable at 16px, so this uses the
  // designer's own N from the wordmark, white on the site's midnight.
  const n = await master.clone().extract(GLYPH_N).resize({ width: 300, fit: "inside" }).png().toBuffer();
  const nWhite = await recolorForDarkBackground(n);
  const m = await sharp(nWhite).metadata();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: "#0c1730" } })
    .composite([{ input: nWhite, left: Math.round((512 - m.width) / 2), top: Math.round((512 - m.height) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile("src/app/icon.png");

  for (const f of ["logo-lockup.png", "logo-lockup-dark.png", "logo-emblem.png", "logo-emblem-dark.png"]) {
    const meta = await sharp(PUB + f).metadata();
    console.log(f.padEnd(24), `${meta.width}x${meta.height}`, `${Math.round(fs.statSync(PUB + f).size / 1024)}KB`);
  }
  const icon = await sharp("src/app/icon.png").metadata();
  console.log("src/app/icon.png".padEnd(24), `${icon.width}x${icon.height}`, `${Math.round(fs.statSync("src/app/icon.png").size / 1024)}KB`);
})();
