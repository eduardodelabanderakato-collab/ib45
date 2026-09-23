# Operating the IB45 system (for Claude)

**The app ('Life', a Claude Artifact):** https://claude.ai/artifact/1yfwsi3bMVerDih52BtTSD — source `app/template.html`, build `node app/build-app.js "<name>"` → `app/index.html`, republish with the Artifact tool (same path keeps the URL). Data lives in the artifact DB (ArtifactData tool): `state/{subjects,assessments,tour,stanford}`, `plan/<date>` (one per day, from `app/seed/plan/*.json`), `days/<date>` (his ticks/starts/report), `audit/<date>` (nightly, from Focus Flight), `errors/<id>`, `stanford/progress`, `contract/main`. Weekly: regenerate seeds (`node -e` script in git history / rerun the seed step), batch-set `plan/*` for the next 14 days.


Source of truth: `data/state.json`. Only Claude edits it. Eduardo reports in chat; he never operates a tool.
Live: https://eduardodelabanderakato-collab.github.io/ib45/ (dashboard) · `wp-iphone.png` · `wp-ipad.png` · `wp-mac.png`
Repo: eduardodelabanderakato-collab/ib45 · GitHub Actions builds on push and daily at 05:30 America/Sao_Paulo.

## When Eduardo reports something
- **New assessment** → append to `assessments`: `{id, subject, type: test|report|essay|oral, title (short!), date, ramp: science|language|report}`. Ramp tasks auto-appear in S2/FLEX and countdowns. Titles must be short (wallpaper pills wrap otherwise).
- **Holiday / no school** → push the ISO date into `rotation.holidays`.
- **Rotation drift** ("today was Day 2") → set `rotation.anchorDate` + `anchorType` to that day.
- **Nightly report** → append to `log`: `{date, started, sprintsDone, sprintsPlanned, errorsAdded, errorsClosed, retrieval, note}`. Reply with tomorrow's first sprint (S1) written out. Missed day → only "what's tomorrow's first block?". Never compute streaks.
- **Topic taught / consolidated** → update `subjects.<id>.topics[].status` (new|taught|learning|shaky|solid); shift `subjects.<id>.next` when a topic is taught so S1 pre-learns the right thing.
- **Specific task for a day** → `assignments["YYYY-MM-DD"] = [{slot, subject, title, steps:[...]}]`. Slots: LAB S1 S2 S3 TUTOR EVE SAT1 SAT2 SATBLK DIAG FLEX REVIEW. Steps are concrete actions ("Redo the Math test, cold, timed"), 1–4 per block, ≤ 60 chars each. Never a bare subject name.
- **Sunday review** → fill `assignments` for the next 7 days, update `subjects.*.grade`, keep past assessments with `result`.
- **Early-delivery rule**: every report/essay/assignment gets an early draft milestone for teacher feedback (ramp `report` already has −5). Languages: essay to teacher 5 school days before it's needed.

## Publish
`npm test && git add -A && git commit -m "plan: <what changed>" && git push` → Actions rebuilds (~3 min). Devices refresh at their scheduled times.
Force Mac now: `launchctl kickstart -k gui/$(id -u)/com.eduardo.ib45wallpaper`. Preview a date locally: `IB45_DATE=2026-09-30 node src/build.js && open site/index.html`.

## Devices
- Mac: LaunchAgent `~/Library/LaunchAgents/com.eduardo.ib45wallpaper.plist` runs `scripts/mac/ib45-wallpaper.sh` at 06:45 / 12:00 / 16:00 / 20:30 and at login. Log: `~/Library/Logs/ib45-wallpaper.log`.
- iPhone / iPad: see `scripts/ios-shortcut.md` (one-time Shortcut + two Time-of-Day automations).

## Invariants (do not break)
Friday evening free · Saturday afternoon/evening free · hard stop 21:15 · no streak counters · Sprint 1 = pre-learn tomorrow · phone out of the room · never write to the Outlook connector (it is a parent's calendar) · design stays Liquid Glass Ice (he rejected four other directions).
