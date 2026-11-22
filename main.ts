// main.ts — Node 22 entrypoint for make.fun bounty news-image-20261122.
// The 1024x1024 page for Sunday 22 November 2026 is committed as entry.png beside this file and is
// written to /output/entry.png unchanged, so every run writes the same bytes, with no network and no
// browser. To rebuild the image: node tools/page.mjs && node tools/shot.mjs.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const target = join(outDir, 'entry.png');

mkdirSync(outDir, { recursive: true });
writeFileSync(target, readFileSync(join(here, 'entry.png')));
console.log(`entry.png written to ${target}`);
