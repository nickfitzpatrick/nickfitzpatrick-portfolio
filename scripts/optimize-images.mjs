// Makes small AVIF/WebP copies of the project images in public/images/ so cards
// never ship a multi-megabyte PNG. Runs before `dev` and `build`; skips files
// that are already up to date. Output: public/images/opt/ + src/data/images.json
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'public/images';
const OUT = 'public/images/opt';
const WIDTHS = [640, 1024, 1600];
const FORMATS = { avif: { quality: 55, effort: 4 }, webp: { quality: 78 } };

await mkdir(OUT, { recursive: true });
await mkdir('src/data', { recursive: true });
const manifest = {};
const newer = async (a, b) => { try { return (await stat(a)).mtimeMs >= (await stat(b)).mtimeMs; } catch { return false; } };

for (const file of (await readdir(SRC)).sort()) {
  if (!/\.(png|jpe?g)$/i.test(file)) continue;
  const src = path.join(SRC, file);
  const { width, height } = await sharp(src).metadata();
  const name = path.parse(file).name;
  const widths = WIDTHS.filter((w) => w < width);
  if (!widths.length || widths.at(-1) < Math.min(width, 1600)) widths.push(Math.min(width, 1600));
  for (const w of widths) {
    for (const [ext, opts] of Object.entries(FORMATS)) {
      const out = path.join(OUT, `${name}-${w}.${ext}`);
      if (await newer(out, src)) continue;
      await sharp(src).resize({ width: w })[ext](opts).toFile(out);
    }
  }
  manifest[`/images/${file}`] = { width, height, widths, base: `/images/opt/${name}` };
}
await writeFile('src/data/images.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`images: ${Object.keys(manifest).length} optimised`);
