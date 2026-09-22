# IB45 System — Design Spec (2026-09-22)

## Purpose
Eduardo (IB DP1, Brazil; Math AA HL, Physics HL, Econ HL, Chem SL, English A Lit SL, Portuguese A Lit SL) wants a 45. One month in, grades are 5/4/6/7/5/6 because a routine never started. This system makes *starting* automatic and keeps every subject within 14 days of test-ready. Claude is strategist and organizer, not tutor (per-subject Claude agents handle content).

## Operating principles
1. **Chat is the control room.** Eduardo reports tests, changes, nightly results here. Claude edits the state file, regenerates, republishes. Eduardo operates no tool.
2. **Always-ready.** Rolling retrieval keeps every subject within 14 days of test-ready; a test announcement starts a finishing sprint (ramp), never a learning sprint.
3. **One class ahead.** Sprint 1 of every study day = pre-learn tomorrow's three classes, 15 min each.
4. **Sleep is the frame.** Hard stop 21:15, reading ≥30 min, lights out 22:45 (recommended; he currently does 23:30), wake 07:00.
5. **Phone leaves the room** every sprint. Focus Flight runs one flight per sprint.
6. **Ignition weeks 1–3:** the only metric is days started / 5 (Sprint 1 happened, even 10 min). Full load from week 4 if ignition holds.
7. **No streaks.** All metrics are counts and 7-day rolling rates.
8. **Fewer hours, more feedback:** support labs, tutors, and teacher essay feedback are fixed blocks.

## Fixed facts
- School 08:00–15:10 Mon–Fri. Day 1 = English, Econ, Math; Day 2 = Chem, Portuguese, Physics. Tue 2026-09-22 = Day 1. Rotation counts *school days*; holidays are entered as overrides in the state file.
- Soccer Mon/Wed 16:30–18:00 (CAS). Home ~15:40 on non-lab days, ~16:50 after a lab.
- Support Labs 15:20–16:20: Tue = IB Physics / IB Chemistry / EE; Wed = IB Chemistry / Math / TOK; Thu = Portuguese / English / TOK / College Essay.
- Tutors: Physics Thu 19:00–20:00; Math Fri 19:30–20:30.
- Dinner 20:00. Evening block 20:45–21:15. Friday evening free. Saturday afternoon+evening protected. Sunday: SAT 09:00–10:30, mini-diagnostics 10:45–12:00, flexible afternoon block, review 18:00–18:30.
- SAT booked Nov 2026 but not a priority; likely March 2027, target 1550+. PeakScore paused.
- Devices: iPhone 17 Pro (1206×2622), iPad Air M3 13" (render 2752×2752, content in centre 2064 square), Mac (macOS 26.5). Focus Flight installed (App Intents, no duration param → destination via "Get Destination Recommendation").
- Outlook connector is a parent's calendar. Never write to it.

## Weekly template
| Day | 15:20–16:20 | Afternoon | Evening |
|---|---|---|---|
| Mon | Library: Sprint 1 (15:20–16:10) | Soccer; Sprint 2 18:30–19:20 | 20:45–21:15 retrieval + report |
| Tue | Physics lab (Chem when Chem test ≤14d) | S1 17:00–17:50, S2 18:00–18:50, S3 19:00–19:40 | same |
| Wed | Chem lab (Math lab when Math test ≤14d or Math readiness lowest) | Soccer; S1 18:30–19:20 | same |
| Thu | Portuguese / English lab, alternating (bring draft) | S1 17:00–17:50, S2 18:00–18:50, Physics tutor 19:00–20:00 | same |
| Fri | — | S1 16:20–17:10, S2 17:20–18:10, S3 18:20–19:00, Math tutor 19:30–20:30 | free |
| Sat | — | 09:00–12:00: mixed problem set (rotating HL, 50% current / 50% older, shuffled, 90 min) + timed language essay alternate weeks | free |
| Sun | — | SAT 09:00–10:30; mini-diagnostics 10:45–12:00 (2 subjects, timed, mark-scheme); flexible block 14:00–15:30 (ramp / IA / catch-up) | Review 18:00–18:30 |

Sprint contents: S1 = pre-learn tomorrow's classes. S2 = HL problem set / homework due. S3 = languages reading (15–20 pp/day) or Econ/Chem writing. Evening = retrieval (Tier A daily, Tier B every 3–4 days, Tier C fortnightly via Saturday set) + nightly report.

## Subject engines
- **Math/Physics/Chem (practice-driven):** per topic: problem set + "explain-why" list. Test-ready = last diagnostic ≥85% AND all errors closed (two spaced correct reattempts) AND explain-list answerable cold. Resources: Kognity (phys/chem), Revision Village, textbooks, Grade Gorilla, Nikolaidis (math).
- **Econ (hybrid):** diagram-from-blank + definitions + one real-world example per subtopic as a ready evaluation paragraph; P3 calculations drilled. Kognity econ, EconplusDal.
- **English/Portuguese (feedback loop):** timed essay per fortnight (alternating; Portuguese gets the full essay 3 of 4 fortnights until 16/20 holds), sent to teacher 5 school days before needed with the 4-line note; feedback log (criterion | what I did | what examiner wants | fix rule); redraft named paragraphs within 48h; 12-item self-check + 3 anti-ENEM rules; quote bank tagged with global-issue candidates.
- **Error log** is the primary record (kept by Eduardo on paper/notes; counts reported nightly).

## 14-day ramps
- Sciences/Math: −14 diagnose cold; −13..−9 red topics; −8..−5 mixed sets; −4/−3 full timed paper; −2 error-only pass; −1 light, early stop.
- Language A: −14 confirm format; −12 timed essay 1 → teacher; −8 feedback → log → redraft −7; −5 timed essay 2; −3 feedback/redraft; −1 read best essay + descriptors.
- Compress by dropping middle days, never −12/−8 (languages) or −14/−4 (sciences).

## Architecture
- Repo `IB45` → GitHub `eduardodelabanderakato-collab/ib45`, GitHub Pages via Actions (site never committed; no repo bloat).
- `data/state.json` (only Claude edits): routine, rotation anchor + holiday overrides, assessments, subjects + topics (imported from Triage seed, 122 topics) with status, assigned tasks per day, feedback log, daily log (nightly reports), settings (device sizes, timezone America/Sao_Paulo).
- `src/plan.js` (pure): given state + date → the day's blocks with concrete tasks, countdowns with ramp day, readiness rollups, week-rates. Unit-tested with `node src/test.js`.
- `src/build.js`: renders `site/index.html` (dashboard: Today / Countdowns / Readiness / Rules) and `site/wp-iphone.png`, `site/wp-ipad.png`, `site/wp-mac.png` via Playwright (local: installed Chrome; CI: Playwright chromium). Text placed in lock-screen safe band.
- `.github/workflows/publish.yml`: on push to main + cron daily 05:30 BRT (08:30 UTC) → build → deploy-pages.
- Device pickup: iOS/iPadOS Shortcut (URL with `?v=timestamp` → Get Contents of URL → Set Wallpaper Photo, preview off) + Time-of-Day automations 06:45 and 16:00, Run Immediately. Mac: `~/Library/Scripts/ib45-wallpaper.sh` + LaunchAgent `com.eduardo.ib45wallpaper` at 06:45/16:00 + RunAtLoad, timestamped filenames, `killall WallpaperAgent`.
- Focus Flight (phase 2): Mac Shortcut "FF Start" (Get Current Airport → Get Destination Recommendation(preferredMaxMinutes=input) → Start Journey); `echo 50 | shortcuts run "FF Start"`.
- Persistence across Claude sessions: memory file `project_ib45_system.md` points here; `docs/OPERATING.md` documents how Claude updates state and republishes.

## Rituals
- **Nightly 21:15 (2 min):** sprints done/planned, errors added/closed, retrieval y/n, one line "what the plan got wrong". Claude logs it and replies with tomorrow's first sprint. Missed day → only "what's tomorrow's first block?".
- **Sunday 18:00–18:30:** capture → rates → next 5 school days' pre-learn → anything ≤14d gets a ramp → block weekend → one change. Claude rebuilds week, republishes.
- **60-second capture:** any announcement → one line (subject | what | date | topics) in phone notes/paper → to Claude that night.

## Initial state (week of 2026-09-22)
- Assessments: Portuguese test Fri 2026-09-25; Physics test Fri 2026-09-25; Chem lab report due Sun 2026-10-04; Math test (exp & logs) taken 2026-09-22 pending; Econ test pending.
- Assigned work: redo latest Math, English, Portuguese tests (error log each); Kognity Econ 2.5 Elasticities in full (read + all section questions) by Sun 2026-09-27; Portuguese practice essay written and sent tonight 2026-09-22 with the 4-line note; Chem lab report skeleton by Sun 2026-09-27, draft to teacher by Wed 2026-09-30.
- Positions: Math after 1.5/2.9 exp & logs → next 2.16 modulus, 3.x trig; Physics A.2 forces → momentum, circular, A.3; Econ 2.5 → 2.6, 2.7; Chem: ask teacher current unit (unknown).

## Out of scope (YAGNI)
Accounts, sync, notifications beyond wallpaper, streaks/badges, calendar integration (parent's account), AI features inside the page, content tutoring.

## Testing
- `node src/test.js`: rotation across holidays, lab/tutor placement per weekday, ramp-day computation, language vs science ramp selection, rates never streaks, week template invariants (Friday evening free, Sat PM free, hard stop 21:15).
- Build smoke: PNGs exist at exact pixel sizes; HTML contains today's blocks.
- Manual: Pages URL serves updated PNG within 15 min; Mac wallpaper changes; iPhone shortcut run once manually.
