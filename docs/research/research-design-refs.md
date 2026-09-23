# Design Brief: IB45 Lock-Screen Wallpaper + Dashboard

Target: auto-generated lock screen (iPhone 17 Pro 402x874pt, iPad, Mac) plus a web dashboard for a 16-year-old IB student. Content per render: 3-5 study blocks with exact tasks, two test countdowns, one weekly rate. Brief written 2026-09-22.

The rejection ("too plain, looks AI") is almost always the same failure: symmetric card layouts on a gradient, one sans at one weight, nothing anchored to an edge, no single focal number. Every reference below wins by doing the opposite: one dominant number, edge-anchored left-aligned text, a real grid, and type that changes *size* by 8-10x between levels, not just weight.

---

## 1. References (real, linkable)

| # | Reference | Why it works | Mode |
|---|---|---|---|
| 1 | Bloomberg Terminal, official UX post on colour: https://www.bloomberg.com/ux/2021/10/14/designing-the-terminal-for-color-accessibility/ (design tokens summarised at https://www.shadcn.io/design/bloomberg) | Zero rounding, hard hairline borders, amber/orange on black, dense tabular columns, colour used only as semantic status. Density that *earns* the dark ground. | Dark |
| 2 | Flighty (Apple Design Award 2023): https://developer.apple.com/news/?id=970ncww4 and analysis https://blakecrosley.com/guides/design/flighty | "One line per flight" borrowed from airport boards; status colour per row, essentials only. Direct model for "one line per study block". | Dark + light |
| 3 | Frankfurt Airport split-flap board in monospaced Univers: https://fontid.co/20119/monospaced-univers-split-departure-board-frankfurt-airport | Fixed-width columns, every row identical height, the *board* is the design. | Dark |
| 4 | Teenage Engineering (Univers TE, monospaced labels): https://typ.io/s/4ozt and https://blakecrosley.com/guides/design/teenage-engineering | Small caps labels, mono numbers, tiny type on big empty panels, "constraints as aesthetic". Labels sit on the grid, not in pills. | Light (grey/white) |
| 5 | Nothing OS 3.0 dot-matrix lock screen: https://www.androidauthority.com/nothing-os-3-hands-on-3488739/ | Ndot dot-matrix clock + three widgets; monochrome with one red; dot texture reads as hardware, not as "UI". | Dark |
| 6 | Josef Muller-Brockmann, Tonhalle/Musica Viva posters: https://socks-studio.com/2016/11/30/joseph-muller-brockmann-musica-viva-posters-for-the-zurich-tonhalle/ and https://swissgrid.posterhouse.org/ | Strict column grid, Akzidenz-Grotesk, programme lists set as ragged-left text hanging off a rule; geometry as the only "decoration". | Both |
| 7 | NASA Graphics Standards Manual 1975 (Danne & Blackburn): https://standardsmanual.com/products/nasa-graphics-standards-manual and PDF https://www.nasa.gov/wp-content/uploads/2015/01/nasa_graphics_manual_nhb_1430-2_jan_1976.pdf | Helvetica, red worm, hard grid, huge margins, one accent. The "elite institutional" register. | Light |
| 8 | Braun / Dieter Rams "Das Programm" archive: https://the-brandidentity.com/project/systems-studios-das-programm-researches-documents-dieter-rams-iconic-work-braun and https://fontsinuse.com/designers/3001/dieter-rams | All-lowercase Akzidenz, precise gridwork, product photography given air. Restraint that still feels expensive. | Light |
| 9 | Linear marketing site tokens: https://designmd.cc/benchmarks/linear and https://github.com/voltagent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md | Canvas #010102, Inter at -1.5px tracking for display, one lavender accent, Berkeley Mono for data. Shows how to do dark without cards. | Dark |
| 10 | Raycast site tokens: https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md | Canvas #040506, 98% achromatic, coral #ff6363 rationed to one moment, photographic grain not generated gradient, hairline borders instead of shadows. | Dark |
| 11 | Panic Nova site: https://design.withfudge.com/share/nova.app-design and https://nova.app/ | Near-black navy with starfield particles, magenta accent, big bold display type carries the page. Vibrant *and* serious. | Dark |
| 12 | Apple Watch Modular Ultra face: https://appleinsider.com/articles/26/05/03/apple-watch-ultras-modular-face-is-being-simplified-for-watchos-27 | Large clock top two-thirds, a row of three small complications beneath, edge-anchored data. Same band logic as a lock screen. | Dark |
| 13 | Departure Mono (Helena Zhang) specimen: https://departuremono.com/ | Pixel mono with box-drawing characters; set at multiples of 11px. Flip-board voice without kitsch. | Dark |
| 14 | Doto on Google Fonts: https://fonts.google.com/specimen/Doto | Variable dot-matrix, 6x10 raster, ROND axis. The legal, free Ndot. | Either |
| 15 | Ben Vessey "Dynamo" schedule-wallpapers via Shortcuts: https://completesense.gumroad.com/l/QKVpdK | Proof that a generated iOS wallpaper with live schedule text can look designed if the type is set like a poster. | Dark |
| 16 | Dribbble typographic-wallpaper tag (browse, cherry-pick): https://dribbble.com/tags/typographic-wallpaper | Useful for spotting the cliches to avoid (see do-nots). | Mixed |

---

## 2. Three directions

### Direction A: DEPARTURES (flip-board / terminal)

Refs: Flighty (#2), Frankfurt board (#3), Bloomberg (#1), Departure Mono (#13).

Palette
- Canvas `#0A0A0C` (not pure black; grain needs a floor)
- Board rule / dim text `#2A2A2E`
- Primary text `#EDE8DC` (warm paper white, never `#FFFFFF`)
- NOW amber `#FFB000` (Bloomberg-adjacent; only for the current block and the primary countdown)
- Blaugrana garnet `#A50044` for "overdue / today's test"
- Blaugrana blue `#004D98` for "tomorrow"

Type (Google Fonts)
- Display numerals: **Archivo Black** or **Archivo** variable at `wdth` 125, weight 900
- Board rows: **JetBrains Mono** (tabular figures, `ss` off) at 15-17pt
- Micro labels: JetBrains Mono 11pt uppercase +0.12em
- Optional flavour: **Doto** for the weekly rate only (ROND 100, weight 700)

Texture: 1px horizontal hairlines every 8pt in `#141416` (scanlines), 3-4% monochrome grain, faint inner vignette. No gradients at all.

Timeline: a literal board. Fixed columns `HH:MM | SUBJ | TASK | STATUS`, one row per block, every row exactly 44pt tall, rules between rows. The current block row is amber text on canvas with a 2pt amber left bar; past rows drop to `#5A5A60`. Task text truncates with a hard cut, not ellipsis; the row is allowed to be dense.

Countdown: two split-flap cells, each two digits, 64pt Archivo Black in `#EDE8DC` on `#151517` tiles with a 1px horizontal split line through the middle; label under each in mono caps (`PAPER 1 · 14 OCT`). Primary countdown is amber, secondary is white.

Weekly rate: a 5-char Doto readout (`31.5H`) in the lower-right corner with a 12-segment tick bar beneath.

Do not
1. No rounded corners over 2px anywhere; the board is square.
2. No glow/bloom on text (that is the "AI CRT" tell); glow only as a 1px stroke, if at all.
3. No green "terminal" text; amber plus warm white only.
4. No icons or emoji in the status column; use words (`NOW`, `NEXT`, `DONE`).
5. No centred anything; all columns left-aligned, numbers tabular.

### Direction B: TONHALLE (Swiss editorial poster)

Refs: Muller-Brockmann (#6), NASA manual (#7), Braun (#8), Teenage Engineering (#4).

Palette
- Paper `#F3EFE6` (light) or Ink `#111111` (dark twin; generate both, pick per hour of day)
- Ink `#111111` / Paper text on dark `#F3EFE6`
- Stanford cardinal `#8C1515` as the single accent (the "target" colour)
- Secondary neutral `#8A857B`
- Optional second accent for tomorrow only: blaugrana blue `#004D98`

Type
- Display: **Instrument Serif** (italic for the countdown numeral, roman for the day)
- Text: **Space Grotesk** 500 for tasks; **Inter Tight** 400 for secondary lines
- Labels: Space Grotesk 600 uppercase 11pt +0.10em
- Alternative pairing: **Fraunces** (opsz 144, SOFT 50) + **Archivo**

Texture: 5% paper grain; one halftone dot field (dot pitch 4pt) clipped to a single rectangle in the bottom-right, cardinal on paper. No gradient, no blur. Depth comes from the hairline grid: draw the 4-column grid lines at 4% opacity so the poster shows its construction.

Timeline: a single 1pt vertical rule at x=88pt. Times hang to the LEFT of the rule in Instrument Serif 26pt; block title and task sit RIGHT of the rule in Space Grotesk 17/15pt, ragged, no boxes. The current block gets a solid cardinal square (8x8) on the rule and its title jumps to 34pt. Blocks are separated by space (24pt), not by lines.

Countdown: one giant Instrument Serif italic numeral (days), 168pt, bleeding off the left edge by ~12pt so the counter of the digit is cut; the second countdown is 56pt, stacked beneath, roman. Label to the right in caps.

Weekly rate: `31.5 h` in Instrument Serif 40pt with the `h` in Space Grotesk; a 1pt rule under it whose length is the % of target.

Do not
1. No cards, no boxes, no background tints behind text; the grid and rule do all the structuring.
2. No drop shadows; not even on the numeral.
3. Never mix more than two typefaces plus the mono for the rate.
4. No "quote of the day" or motivational line; the poster is the schedule.
5. No symmetric top/bottom margins; top margin is tight to the clock zone, bottom is generous.

### Direction C: NOCTURNE (blaugrana aurora, elite-vibrant)

Refs: Nova (#11), Raycast (#10), Linear (#9), Nothing (#5).

Palette
- Canvas `#07102A` (navy black, not neutral black)
- Aurora stops: `#004D98` -> `#A50044` -> `#FF6B4E`, confined to the bottom 35% and left 60%, blurred 120pt, 55% opacity
- Text `#F4F1EA`
- Dim text `#7C86A3`
- Accent hot coral `#FF5A36` (only on the current block marker and the primary countdown)
- Ring track `#1C2646`

Type
- Display: **Unbounded** 700 (chevron stems read as sporty without being a game font) or **Syne** 800 for a more fashion register
- Text: **Bricolage Grotesque** 500 (opsz 48 for titles, 12 for small)
- Data: **JetBrains Mono** 13pt tabular

Texture: aurora mesh (only three colour blobs, never five), 6% grain on top of the mesh so it stops looking generated, 24pt dot grid at 5% opacity across the whole canvas. Grain is mandatory: an un-grained mesh is the number-one AI tell.

Timeline: horizontal 24-hour strip, 12pt tall, spanning full width at y=~330: dim track, study blocks as solid segments, the current block in coral, a 1pt white "now" tick. Below the strip, the 3-5 blocks as a left-aligned list: time in mono, title in Bricolage 22pt, task in 15pt dim. Only the current block's task is full-brightness.

Countdown: a 3pt arc ring, 120pt diameter, anchored bottom-left, coral fill = fraction of prep window elapsed; the day count in Unbounded 64pt sits inside. The second countdown is text only, right of the ring.

Weekly rate: Unbounded 28pt `31.5h` with a mono `/ 35 target` beside it, top-right of the band.

Do not
1. No glassmorphism panels (frosted rectangles with 1px white borders) over the aurora.
2. No more than three mesh colours and never a full-canvas mesh; keep it in one corner.
3. No pill badges; status is conveyed by brightness and the coral marker.
4. No Inter for headings; Inter is allowed only in the web dashboard body copy.
5. No two focal numbers at equal size; the ring numeral wins, everything else drops by 2 scale steps.

Recommended pick: build A and C first. A satisfies "know exactly what to do" the hardest; C satisfies "magnificent". B is the safe institutional fallback and the best fit for the Mac/iPad wallpaper where the canvas is wide.

---

## 3. Lock-screen constraints (iPhone 17 Pro, 402x874pt)

Reserved zones
- Top 0-300pt: date line, Liquid Glass clock (iOS 26 lets the user stretch it to ~230pt tall), widget row. Apple's own guidance reserves roughly the top 200px + widget row; treat 300pt as the floor (guidance summary: https://sizedesk.com/iphone-wallpaper-size/; iOS 26 clock behaviour: https://appleinsider.com/inside/ios-26/tips/ios-26-how-to-customize-the-iphones-lock-screen-clock).
- Bottom 754-874pt: flashlight/camera buttons and home indicator.
- Usable band: y 300-754, 454pt tall, full 402pt wide. Keep 24pt side margins (354pt live width).

How the good ones use the band
- One focal number: the primary countdown or the current block title. Everything else is at most 1/3 of its size.
- Edge-anchor: hang the number off the left edge (Direction B) or lock the board to both edges (Direction A). Centred composition in this band reads as a widget, not a poster.
- Top of band = "now": the first 90pt of the band carries what to do this minute; the lower band carries the rest of the day; the countdown sits in the last 130pt above the buttons so it is glanceable with the thumb resting.
- Left column for time, right for content, like every timetable since SBB (https://eguide.ch/en/objekt/sbb/).
- Let the wallpaper acknowledge the clock: in A, start the board's first hairline exactly at y=300 so the clock appears to sit on top of the board; in B, the vertical rule starts at y=300 and runs to y=754 so the clock reads as the poster's headline.
- Design for the clock being either compact or stretched: nothing critical between y=230 and y=300.

Suggested band layout (all directions)
- y 300-390: NOW block (title + exact task) at display size
- y 390-600: remaining blocks (3-4 rows)
- y 600-640: weekly rate
- y 640-754: countdown 1 (focal) + countdown 2 (secondary)

iPad and Mac: same band logic; iPad portrait 1024x1366pt gives a 2.5x taller band, so add tomorrow's first block and expand the timeline; Mac gets a two-column layout (board left, countdowns right) with the same type scale x1.5. Web dashboard: the same components at the same relative scale, on the same canvas colour, so the phone and the site look like one object.

---

## 4. Type scale (402pt canvas)

Modular scale, ratio ~1.5 with a jump to hero. Baseline grid 8pt. Column grid 4 cols x 79.5pt, 12pt gutters, 24pt margins.

| Role | Size | Line-height | Tracking | Face |
|---|---|---|---|---|
| Hero numeral (countdown days) | 168pt (B) / 132pt (A, C) | 0.82 | -0.04em | Instrument Serif it / Archivo Black / Unbounded |
| Display (NOW block title) | 44pt | 0.95 | -0.03em | as per direction |
| Secondary countdown | 56pt | 0.9 | -0.03em | same as hero |
| Subhead (other block titles) | 22pt | 1.05 | -0.02em | Space Grotesk 500 / Bricolage 500 |
| Body (exact task) | 15pt | 1.25 | -0.005em | same |
| Times | 15pt | 1.0 | 0 | JetBrains Mono tabular |
| Labels / caps | 11pt | 1.0 | +0.10em, uppercase | grotesk 600 or mono |
| Weekly rate | 40pt | 0.9 | -0.02em | direction display face or Doto |

Rules that make it read as a poster, not a UI
- Negative tracking above 22pt, positive tracking below 12pt, zero in between.
- Line-height under 1.0 for anything above 40pt; let descenders touch the next line.
- Left-align every text element; the only right-aligned items are numbers in a column.
- Adjacent hierarchy levels differ by at least 1.45x in size, never by weight alone.
- Maximum two weights per face on the phone canvas.
- Numbers always tabular (`font-variant-numeric: tabular-nums`) so rows stay ruled.
- Text colour steps: 100% / 62% / 38% opacity of the text colour; no fourth grey.
- Text never sits on top of a gradient hot-spot; in C, the aurora is clipped away from any text rectangle by 16pt.

---

## Universal do-nots (the "looks AI" list)

1. Rounded cards with soft shadows floating on a flat or mesh gradient.
2. Emoji or line icons as bullets; use type and rules.
3. Everything centred, or symmetric top/bottom margins.
4. Three identical pill badges (status chips) in a row.
5. Inter (or SF) at one weight for every level; no size jumps.
6. Un-grained gradients, glow on text, glassmorphism panels.
7. Pure `#000000` or `#FFFFFF`; use `#0A0A0C` / `#F3EFE6`.
8. A motivational quote; the schedule *is* the message.
9. Equal-size focal numbers; pick one hero.
10. Decorative sparklines or rings that encode nothing.
