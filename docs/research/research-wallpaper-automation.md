# Daily wallpaper automation: iOS/iPadOS Shortcuts, macOS launchd, Focus Flight, GitHub Pages

Research date: 2026-09-22. Local machine: macOS 26.5.2 (25F84), FocusFlight.app 2.0 (build 265) installed in /Applications.

---

## 1. iOS / iPadOS 17+ Shortcuts: fetch PNG and set wallpaper, unattended

### 1a. Build the shortcut ("Set Study Wallpaper")

1. Shortcuts app > Shortcuts tab > `+` > name it `Set Study Wallpaper`.
2. Add action **Date** (returns current date).
3. Add action **Format Date** (input: Date) > Date Format: **Custom** > `yyyyMMddHHmm`. This is the cache-buster.
4. Add action **URL** > `https://<user>.github.io/<repo>/iphone.png?v=` then insert the *Formatted Date* variable right after `?v=`.
5. Add action **Get Contents of URL** (input: URL). Method GET, no headers needed. Output is the PNG file.
6. Add action **Set Wallpaper Photo** (search "Set Wallpaper"). Configure:
   - Input: *Contents of URL*.
   - "Wallpaper": pick the *existing* wallpaper set (lock-screen/home-screen pair) you want to update. On iOS 16.2+ the action targets one of your saved wallpaper sets rather than replacing the whole set, and Apple's release notes say it "can now set photos for wallpapers that use iOS 16's new widgets and customization options" ([Apple: What's new in Shortcuts](https://support.apple.com/en-us/101583); [iDB on 16.2 actions](https://www.idownloadblog.com/2022/12/13/ios-16-2-new-shortcuts-actions/)).
   - Toggle **Lock Screen** and/or **Home Screen** (both supported; enable both for the same image, or duplicate the shortcut with a second URL for a separate home image).
   - Tap **Show More** and turn **Show Preview OFF**, and turn off "Crop to subject"/perspective-style options; otherwise the automation stops for confirmation every run ([microideation](https://blog.microideation.com/2024/06/29/setting-up-light-and-dark-wallpaper-in-ios-17-using-shortcut-automations/); [24hourwallpaper setup](https://24hourwallpaper.com/24hoursetup/)).
7. **Run it once manually** (play button) and tap *Allow* on the privacy prompts (network access to your github.io host, wallpaper access). Automations that hit an un-approved prompt silently fail.
8. In the shortcut's detail sheet (the `i` / settings icon) > **Privacy** > ensure **Allow Running When Locked** is on ([Automators Talk](https://talk.automators.fm/t/why-do-some-time-triggered-shortcuts-run-on-a-locked-iphone-and-others-fail/18608)).

### 1b. Personal automation (Time of Day, no confirmation)

1. Shortcuts > **Automation** tab > `+` (New Automation).
2. Choose **Time of Day** > set `06:30` > Repeat: **Daily**.
3. Below the time picker choose **Run Immediately** (not *Run After Confirmation*). On iOS 17+ Apple renamed "Don't Ask Before Running" to "Run After Confirmation" and added "Run Immediately"; when you choose Run Immediately the "Notify When Run" toggle disappears because Apple forces a notification for immediate automations ([Matthew Cassinelli](https://matthewcassinelli.com/automations-run-immediately-shortcuts-notifications/)). Time of Day is on Apple's list of triggers that may run without confirmation ([Apple Support](https://support.apple.com/en-au/guide/shortcuts/apd602971e63/ios)).
4. **Next** > pick `Set Study Wallpaper` > **Done**.
5. Repeat for `15:30`. (One automation per time; automations cannot hold two times.)
6. Repeat 1a-1b on the iPad with `ipad.png`.

### 1c. Known limitations and gotchas

- **Lock Screen and Home Screen**: both are supported as toggles in Set Wallpaper Photo. The action edits an existing wallpaper *set*; the set must be a plain **Photo** wallpaper, not Photo Shuffle, Astronomy, Emoji, etc. ([WeeklyDots](https://www.weeklydots.com/blog/automate-iphone-wallpaper-shortcuts)). Create the set manually once (long-press Lock Screen > `+` > Photos), add your widgets, then point the action at it. Widgets on that set persist across runs in iOS 16.2+/17; older reports of a "black home screen" or lost widgets came from the iOS 16.0-16.1 legacy-wallpaper era ([Apple Dev Forums 711093](https://developer.apple.com/forums/thread/711093)).
- **iOS 18 / iOS 26**: the action still exists and works the same way; no removal in Apple's release notes. iPadOS caveat: landscape may show black if the image is not square-ish ([Apple Dev Forums 732973](https://developer.apple.com/forums/thread/732973)); see sizes below.
- **Locked device**: even with Run Immediately, users report intermittent "device needs to be unlocked" stalls, especially when a Focus (Sleep) is active at trigger time ([Apple Community](https://discussions.apple.com/thread/255156629); [Automators Talk](https://talk.automators.fm/t/why-do-some-time-triggered-shortcuts-run-on-a-locked-iphone-and-others-fail/18608)). Mitigations: Allow Running When Locked on, avoid 06:30 if Sleep Focus ends at 07:00, keep the shortcut to the three actions above (no Photos-library writes), and run once manually after any edit to re-grant prompts. launchd-style "catch-up" does not exist: a missed trigger is skipped until the next day.
- **Caching**: Get Contents of URL uses the system URL cache and honours GitHub's `Cache-Control: max-age=600`; the `?v=<timestamp>` query string above guarantees a fresh fetch (see section 4).

### 1d. Image dimensions and safe areas

Native pixel sizes (portrait) ([Use Your Loaf](https://useyourloaf.com/blog/iphone-17-screen-sizes/); [Hexnode](https://www.hexnode.com/mobile-device-management/help/what-are-the-different-ios-wallpaper-sizes/); [Apple iPad Pro 11 M4 specs](https://support.apple.com/en-us/119892)):

| Device | Points | Pixels (@3x / @2x) |
|---|---|---|
| iPhone 15 Pro | 393 x 852 | 1179 x 2556 |
| iPhone 16 Pro / 17 Pro | 402 x 874 | 1206 x 2622 |
| iPhone 17 Pro Max | 440 x 956 | 1320 x 2868 |
| iPad Pro 11" (M4/M5) | 834 x 1210 | 1668 x 2420 |
| iPad Pro 13" (M4/M5) | 1032 x 1376 | 2064 x 2752 |

Recommendations:
- iPhone: render exactly at the device's pixel size (1206 x 2622 for a 16/17 Pro). iOS scales other sizes with centre-crop, which shifts text.
- iPad: render a **square** 2752 x 2752 (or 2420 x 2420 for the 11") so portrait and landscape both centre-crop cleanly; keep all text inside the centre 2064 x 2752 / 2752 x 2064 intersection, i.e. a centred 2064 x 2064 square ([Hexnode](https://www.hexnode.com/mobile-device-management/help/what-are-the-different-ios-wallpaper-sizes/); [MacRumors](https://forums.macrumors.com/threads/ipad-wallpaper-sizing.2291875/)).
- Safe areas (Apple publishes no official wallpaper template; these are measured heuristics in points, multiply by 3 on iPhone, 2 on iPad):
  - iPhone Lock Screen: top 0-300 pt is date, clock and the widget row (Dynamic Island at 0-60 pt); bottom 0-120 pt is Flashlight/Camera buttons and the home indicator. Put text in the band ~320-730 pt (16/17 Pro) and keep it left-aligned with 24 pt side margins.
  - iPhone Home Screen: the app grid covers ~120-720 pt and the dock ~740-850 pt, so only the Lock Screen is reliably readable; keep Home Screen decorative or place a single line at y ~ 100 pt if your first app row is empty.
  - iPad Lock Screen: clock and widgets occupy the top ~260 pt; dock the bottom ~110 pt. Put text in the centre square.
- Use high-contrast text with a soft dark scrim behind it; iOS applies its own legibility blur only under the clock.

---

## 2. macOS 26 (Tahoe) / 15 (Sequoia): set wallpaper on all displays and spaces from a script

### 2a. Methods

- **AppleScript / System Events** (all displays, all spaces on that display):
  ```bash
  osascript -e 'tell application "System Events" to tell every desktop to set picture to POSIX file "/Users/you/Pictures/wp/wallpaper-1758560000.png"'
  ```
  Requires an Automation (TCC) grant for the calling process to control System Events ([techearl](https://techearl.com/set-mac-wallpaper-command-line)).
- **desktoppr** (Armin Briegel). Same underlying NSWorkspace API, no Apple Events / TCC prompt, sets all screens with one call: `desktoppr /path/file.png`; `desktoppr 0 file.png` for one screen; `desktoppr https://…/mac.png` downloads to `~/Library/Application Support/desktoppr/` then sets; `desktoppr scale fill`; must run **as the user** (LaunchAgent, not LaunchDaemon); insert `sleep 1` between successive calls; install with `brew install --cask desktoppr` (binary at `/usr/local/bin/desktoppr`) ([desktoppr README](https://github.com/scriptingosx/desktoppr/blob/main/README.md); [Scripting OS X](https://scriptingosx.com/2024/01/using-desktoppr-in-a-managed-environment/)). It is currently *not* installed on this Mac.

### 2b. Gotchas

1. **Same path = no redraw.** Since Sonoma the wallpaper store (`~/Library/Application Support/com.apple.wallpaper/Store/Index.plist`, plus `~/Library/Containers/com.apple.wallpaper.extension.image/` on Tahoe) caches the path; overwriting the file at the same path leaves the old image on screen ([macos-wallpaper #44](https://github.com/sindresorhus/macos-wallpaper/issues/44); [techearl](https://techearl.com/set-mac-wallpaper-command-line); [bartreardon on Tahoe](https://bartreardon.github.io/2025/12/04/adding-wallpaper-folders-to-macos-system-settings.html)). Fix: write to a **new timestamped filename** each run and delete older files; fallback `killall WallpaperAgent` (Sonoma+) forces a re-read.
2. **Spaces on Tahoe.** After a programmatic set, "Show on all Spaces" can flip OFF, and later runs only change the active Space ([Apple Dev Forums 814926](https://developer.apple.com/forums/thread/814926), unanswered). `every desktop` covers displays, not Spaces. Workarounds: keep one Space per display, or re-enable "Show on all Spaces" in System Settings > Wallpaper after the first automated run and verify it sticks; `killall WallpaperAgent` after setting is the most reliable nudge.
3. **launchd timing.** `StartCalendarInterval` fires missed jobs on wake ("Unlike cron … launchd will start the job the next time the computer wakes up"), coalesced into one; `StartInterval` firings during sleep are simply missed ([launchd.plist(5)](https://leancrew.com/all-this/man/man5/launchd.plist.html)). Use StartCalendarInterval plus `RunAtLoad` for login.
4. The System Events route from a LaunchAgent may trigger a one-time Automation permission dialog for `osascript`; desktoppr avoids it.

### 2c. Shell script: `~/Library/Scripts/update-wallpaper.sh`

```bash
#!/bin/zsh
set -euo pipefail
URL="https://<user>.github.io/<repo>/mac.png"
DIR="$HOME/Pictures/StudyWallpaper"
LOG="$HOME/Library/Logs/update-wallpaper.log"
mkdir -p "$DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
NEW="$DIR/wallpaper-$STAMP.png"

# Cache-bust and fail loudly; keep old file if download fails
if ! curl -fsSL --max-time 60 "$URL?v=$STAMP" -o "$NEW"; then
  echo "$STAMP download failed" >> "$LOG"; exit 1
fi
[ -s "$NEW" ] || { echo "$STAMP empty file" >> "$LOG"; rm -f "$NEW"; exit 1; }

if [ -x /usr/local/bin/desktoppr ]; then
  /usr/local/bin/desktoppr "$NEW"
else
  /usr/bin/osascript -e "tell application \"System Events\" to tell every desktop to set picture to POSIX file \"$NEW\""
fi
sleep 1
killall WallpaperAgent 2>/dev/null || true   # force re-read on Sonoma+/Tahoe

# keep the 3 newest files
ls -t "$DIR"/wallpaper-*.png | tail -n +4 | xargs -r rm -f
echo "$STAMP ok $NEW" >> "$LOG"
```

`chmod +x ~/Library/Scripts/update-wallpaper.sh`

### 2d. LaunchAgent: `~/Library/LaunchAgents/com.eduardo.studywallpaper.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.eduardo.studywallpaper</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>/Users/eduardokato/Library/Scripts/update-wallpaper.sh</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>6</integer><key>Minute</key><integer>35</integer></dict>
    <dict><key>Hour</key><integer>15</integer><key>Minute</key><integer>35</integer></dict>
  </array>
  <key>StandardOutPath</key>
  <string>/Users/eduardokato/Library/Logs/update-wallpaper.out</string>
  <key>StandardErrorPath</key>
  <string>/Users/eduardokato/Library/Logs/update-wallpaper.err</string>
</dict>
</plist>
```

Load and test:
```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.eduardo.studywallpaper.plist
launchctl kickstart -k gui/$(id -u)/com.eduardo.studywallpaper   # run now
launchctl print gui/$(id -u)/com.eduardo.studywallpaper | head    # status
```
(Times are 5 min after the Pages push to cover the up-to-10-minute publish delay; add a `StartInterval` of 3600 instead if you prefer hourly polling, accepting sleep misses.) Pattern follows the Scripting OS X LaunchAgent example ([Scripting OS X](https://scriptingosx.com/2024/07/building-a-launchd-installer-pkg-for-desktoppr-and-other-tools/)).

---

## 3. Focus Flight (net.cementpla.FocusFlights): what is actually exposed

Public docs: none. focusflight.net, the [App Store page](https://apps.apple.com/us/app/focusflight-deepfocus-timer/id6648771147) and the official [docs.focus.flights](https://docs.focus.flights/) hub (Craft site; only a translation co-creation page exists) mention no URL scheme or Shortcuts parameters. Findings from the installed bundle (`/Applications/FocusFlight.app`, v2.0 build 265, LSMinimumSystemVersion 14.0):

- `Info.plist` registers **`CFBundleURLSchemes = ["focusflights"]`**. No host/path/query key strings are identifiable in the binary; the scheme's grammar is **undocumented**. The entitlements also declare `applinks:focus.flights`, and the site's AASA (`https://focus.flights/.well-known/apple-app-site-association`) whitelists **`/start-journey/*`**, which maps to the intent `StartJourneyUniversalLinkIntent` (parameter `destination`, IATA). So `https://focus.flights/start-journey/<IATA>` is the app's own deep-link form (the web URL itself returns 404; it exists only to be intercepted).
- App Intents (`Contents/Resources/Metadata.appintents/extract.actionsdata`):

| Shortcuts action | Intent | Parameters | Opens app |
|---|---|---|---|
| Start Journey | `StartJourneyIntent` | `destination` (IATA code, optional) | yes |
| Start Journey (link) | `StartJourneyUniversalLinkIntent` | `destination` (IATA, optional) | yes |
| Take Off | `QuickStartJourneyIntent` | none ("Quickly start a journey with a recommended destination"); Siri phrase "Take off in FocusFlight" | yes |
| Get Destination Recommendation | `DestinationRecommendationIntent` | `departure` (IATA), `recommendationCount` (default 3), `preferredMaxMinutes` (default 60) -> returns list of IATA codes | no |
| Get Current Airport | `GetCurrentAirportIntent` | none -> returns IATA | no |
| Pause / Resume | `FocusPauseIntent` | none | no |
| Mute | `FocusSoundMuteIntent` | none | no |

**There is no duration parameter anywhere.** Session length is derived from the route (departure -> destination); the app UI lets you pick 5-180 min but the intents only take airports. So "start N minutes" is achieved indirectly: ask `Get Destination Recommendation` with `preferredMaxMinutes = N` and feed the first result to `Start Journey`, or hard-code a destination whose flight time from your home airport equals the block length (check in the app's map once; keep a small table like `{25: "XXX", 50: "YYY", 90: "ZZZ"}`).

### Recommended approach on macOS (CLI -> Shortcuts -> App Intent)

1. In Shortcuts on the Mac create `FF Start`:
   - **Get Current Airport** (FocusFlight).
   - **Get Destination Recommendation**: Departure = *Current Airport*, Recommendation Count 1, Preferred Max Minutes = **Shortcut Input** (Number).
   - **Get Item from List** > First Item.
   - **Start Journey**: Destination = *Item from List*.
2. Run from any script (the CLI treats piped text as text input, which is exactly what we want):
   ```bash
   echo 50 | shortcuts run "FF Start"          # 50-minute-ish block
   shortcuts run "FF Pause"                    # shortcut containing Pause / Resume
   ```
   Syntax per Apple: `shortcuts run "Name" [-i file] [-o file]`; `shortcuts list`; `shortcuts view "Name"` ([Apple Support](https://support.apple.com/guide/shortcuts-mac/run-shortcuts-from-the-command-line-apd455c82f02/mac)).
3. Alternatives if you want zero Shortcuts dependency: `open "https://focus.flights/start-journey/GRU"` (LaunchServices routes associated-domain links to the app; confirm once) or `open "focusflights://"` (launches app only). Test the scheme by hand before relying on it, since it is undocumented and may change.
4. Hook into the study scheduler: at block start call `shortcuts run "FF Start"` from the same LaunchAgent pattern as section 2, or add a second `StartCalendarInterval` array for block times.

---

## 4. GitHub Pages: caching, propagation, query strings, repo growth

- Headers: Pages (fronted by Fastly) sends **`Cache-Control: max-age=600`** plus an ETag; not configurable ([community discussion 11884](https://github.com/orgs/community/discussions/11884); [Fastly case study](https://www.fastly.com/customers/github)).
- Propagation: "It can take up to 10 minutes for changes to your site to publish after you push" ([GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)); community reports up to ~20 min including CDN. Schedule device fetches 10-15 min after the push.
- **`?v=timestamp` works**: Pages is a static origin, so any query string returns the file, and the edge/browser/URLSession caches key on the full URL, so a new value bypasses the 600 s cache. Filename fingerprinting is even safer but forces you to update the URL in every shortcut, so keep fixed names plus the query string.
- Limits: repo recommended <= 1 GB, published site <= 1 GB, soft 100 GB/month bandwidth, soft 10 builds/hour (not applied to custom Actions workflows), 10-minute deploy timeout, 429 on abuse ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)). Three ~1-2 MB PNGs twice a day is ~2-4 GB/year of *history* if committed normally, which would blow the 1 GB recommendation in months.
- Avoid bloat (pick one):
  1. **Actions artifact deploy (best)**: Pages source = "GitHub Actions"; a scheduled workflow renders the PNGs and runs `actions/upload-pages-artifact` + `actions/deploy-pages`. Nothing is committed, no history growth, and the 10 builds/hour cap does not apply.
  2. **Single-commit orphan branch**: keep source on `main`, publish from `gh-pages` with `git checkout --orphan gh-pages && git add *.png && git commit -m wallpapers && git push --force origin gh-pages` each run (or `git commit --amend` + `push --force-with-lease`) ([stjudecloud PR 334](https://github.com/stjudecloud/workflows/pull/334); [safjan.com](https://safjan.com/git-checkout-orphan-gh-pages-performance-results/)). Note that pushes made by a workflow using `GITHUB_TOKEN` do **not** trigger a branch-based Pages build; use a PAT or method 1 ([GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)).
  Force-pushed history still needs `git gc`/GitHub's periodic pruning to reclaim space, but the served repo stays small.

---

## 5. Alternative to static PNGs: render a web page on-device?

- Shortcuts has no "screenshot a web page" action. **Get Contents of Web Page** returns readable text/rich text, not a rendering. The only render path is **Make PDF** (input: URL) followed by **Make Image from PDF Page** ([Jellycuts docs](https://docs.jellycuts.com/Documentation/Shortcuts/imageFromPDF.html)), which yields a paginated, A4/Letter-shaped PDF render with no control over viewport size, fonts, or JS timing; then Set Wallpaper Photo would centre-crop it. It is fragile and iPad rotation makes it worse.
- On macOS you could render locally (`/usr/bin/safaridriver`, headless Chrome `--screenshot`, or `wkhtmltoimage`) but that only solves the Mac, not the iPhone/iPad.

**Conclusion: server-rendered PNGs (one per device at native pixel size, published to GitHub Pages) are the right approach.** They give exact dimensions and safe-area control, need only three built-in actions on iOS, and one `curl` on macOS.

---

## Sources

- Apple: [Enable/disable personal automation](https://support.apple.com/en-au/guide/shortcuts/apd602971e63/ios), [What's new in Shortcuts](https://support.apple.com/en-us/101583), [Run shortcuts from the command line](https://support.apple.com/guide/shortcuts-mac/run-shortcuts-from-the-command-line-apd455c82f02/mac), [iPad Pro 11 M4 specs](https://support.apple.com/en-us/119892)
- [Matthew Cassinelli: Run Immediately](https://matthewcassinelli.com/automations-run-immediately-shortcuts-notifications/), [WeeklyDots](https://www.weeklydots.com/blog/automate-iphone-wallpaper-shortcuts), [microideation](https://blog.microideation.com/2024/06/29/setting-up-light-and-dark-wallpaper-in-ios-17-using-shortcut-automations/), [24hourwallpaper](https://24hourwallpaper.com/24hoursetup/), [iDownloadBlog 16.2 actions](https://www.idownloadblog.com/2022/12/13/ios-16-2-new-shortcuts-actions/), [Automators Talk locked-phone thread](https://talk.automators.fm/t/why-do-some-time-triggered-shortcuts-run-on-a-locked-iphone-and-others-fail/18608), [Apple Community 255156629](https://discussions.apple.com/thread/255156629), [Dev Forums 711093](https://developer.apple.com/forums/thread/711093), [Dev Forums 732973](https://developer.apple.com/forums/thread/732973)
- Sizes: [Use Your Loaf iPhone 17](https://useyourloaf.com/blog/iphone-17-screen-sizes/), [Hexnode wallpaper sizes](https://www.hexnode.com/mobile-device-management/help/what-are-the-different-ios-wallpaper-sizes/), [MacRumors iPad sizing](https://forums.macrumors.com/threads/ipad-wallpaper-sizing.2291875/)
- macOS: [desktoppr README](https://github.com/scriptingosx/desktoppr/blob/main/README.md), [desktoppr managed](https://scriptingosx.com/2024/01/using-desktoppr-in-a-managed-environment/), [desktoppr LaunchAgent pkg](https://scriptingosx.com/2024/07/building-a-launchd-installer-pkg-for-desktoppr-and-other-tools/), [techearl osascript](https://techearl.com/set-mac-wallpaper-command-line), [macos-wallpaper #44](https://github.com/sindresorhus/macos-wallpaper/issues/44), [Dev Forums 814926 (Tahoe Spaces)](https://developer.apple.com/forums/thread/814926), [bartreardon Tahoe wallpaper store](https://bartreardon.github.io/2025/12/04/adding-wallpaper-folders-to-macos-system-settings.html), [launchd.plist(5)](https://leancrew.com/all-this/man/man5/launchd.plist.html)
- Focus Flight: local bundle inspection (`/Applications/FocusFlight.app` Info.plist, entitlements, `Metadata.appintents/extract.actionsdata`), `https://focus.flights/.well-known/apple-app-site-association`, [App Store](https://apps.apple.com/us/app/focusflight-deepfocus-timer/id6648771147), [focusflight.net](https://focusflight.net/), [docs.focus.flights](https://docs.focus.flights/)
- GitHub Pages: [limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [creating a site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [caching discussion 11884](https://github.com/orgs/community/discussions/11884), [Fastly/GitHub](https://www.fastly.com/customers/github), [orphan gh-pages PR](https://github.com/stjudecloud/workflows/pull/334), [safjan orphan branch](https://safjan.com/git-checkout-orphan-gh-pages-performance-results/)
- Alternative: [Jellycuts: Make Image from PDF Page](https://docs.jellycuts.com/Documentation/Shortcuts/imageFromPDF.html)
