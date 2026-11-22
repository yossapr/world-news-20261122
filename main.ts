// main.ts — writes this repository's front page for Sunday 22 November 2026 to /output/entry.png.
// The image is rendered at build time by tools/ (see README); the program copies it verbatim, so
// two runs write identical bytes and nothing is fetched.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });

const source = join(here, 'entry.png');
const target = join(outDir, 'entry.png');
copyFileSync(source, target);
console.log(`entry.png: ${target}`);
