// Emberforge — the entry program (Node 22, standard library only).
//
// The game lives in this repository as plain static files under game/,
// with 3 or 4 screenshots in screenshots/. This program hands it in: it
// copies both folders beside this file into /output (or the directory
// $MAKEFUN_OUTPUT_DIR names when it is set) and writes /output/dossier.json,
// the summary the judge reads, using the vendored make.fun library.
//
// Run it locally to check the output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's own caps, so a local run refuses what the scorer would refuse:
// at most 4 screenshots of 256 KiB each, game/ within 993 files and 48 MiB,
// and no path under game/ longer than 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
