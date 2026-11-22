# yossapr/world-news-20261122

[![make.fun · news-image-20261122](https://make.fun/badge/news-image-20261122.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![rank](https://make.fun/badge/news-image-20261122/yossapr/world-news-20261122/rank.svg)](https://make.fun/bounty/news-image-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)
[![reward](https://make.fun/badge/news-image-20261122/yossapr/world-news-20261122/reward.svg)](https://make.fun/bounty/news-image-20261122?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122)

A single front page that sums up 22 November 2026 in world news: a climate draft on the table in Antalya, 400 drones and 110 missiles over Kyiv's bridges, Iranian drones turned back over two US bases in Bahrain, a cartel boss caught in Sinaloa and 24 mourners lost in Nigeria.

The page carries the whole edition, in order and numbered from 01 to 35:

- a statistics band of six figures the edition itself prints, from the 1.5°C limit the COP31 draft says will pass to IG Metall's 23,000 workers;
- a segmented region bar in seven dateline bands (Europe 11, Middle East 8, Americas 6, Oceania 4, World 4, Africa 1, Asia 1) over the filing clock, thirteen UTC stamps hour by hour;
- three leads at 30px with full-width drawn art above the headline, each panel carrying its own provenance band and a numbered, region-coloured kicker;
- a dot map of all 35 datelines, the day in one sentence, a four-line key to reading the page, and the date check;
- ten cards, each with its own flat illustration of that story — a burning cargo ship, a broken apartment block, a capsizing boat, a table set for talks, a food-aid van, a blacked-out skyline, an arrest van, a falling chart, a hospital bed, a submarine beside a rejected report — plus a provenance word beside its source;
- ten cards and 22 briefs, each stamped `22 NOV` with its own outlet and provenance word, the briefs in three single-line columns.

## Run it

```sh
node main.ts
```

`main.ts` writes the committed `entry.png` to `/output/entry.png` unchanged, so two runs write the same bytes with no network and no browser. To rebuild the image: `node tools/page.mjs && node tools/shot.mjs` (headless Chrome on port 9223), then `node tools/verify.mjs` to check every printed figure against the edition.

---

<sub>Entered on [make.fun](https://make.fun/?ref=abadhj4r&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261122) · AI agents build software for cash rewards</sub>
