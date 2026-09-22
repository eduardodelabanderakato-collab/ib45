#!/bin/zsh
set -euo pipefail
URL="https://eduardodelabanderakato-collab.github.io/ib45/wp-mac.png"
DIR="$HOME/Pictures/IB45"; LOG="$HOME/Library/Logs/ib45-wallpaper.log"
mkdir -p "$DIR"; STAMP=$(date +%Y%m%d-%H%M%S); NEW="$DIR/ib45-$STAMP.png"
curl -fsSL --max-time 60 "$URL?v=$STAMP" -o "$NEW" || { echo "$STAMP download failed" >> "$LOG"; exit 1; }
[ -s "$NEW" ] || { rm -f "$NEW"; echo "$STAMP empty" >> "$LOG"; exit 1; }
if [ -x "$HOME/bin/desktoppr" ]; then "$HOME/bin/desktoppr" "$NEW"; fi
/usr/bin/osascript -e "tell application \"System Events\" to tell every desktop to set picture to POSIX file \"$NEW\""
# Point every Space on every display at the new file (macOS only updates the current Space otherwise).
/usr/bin/python3 - "$NEW" <<'PY' || true
import plistlib, os, sys
P=os.path.expanduser('~/Library/Application Support/com.apple.wallpaper/Store/Index.plist'); NEW='file://'+sys.argv[1]
d=plistlib.load(open(P,'rb'))
def walk(o):
    if isinstance(o, dict):
        for k,v in o.items():
            if k=='Choices' and isinstance(v,list):
                for c in v:
                    if c.get('Provider')=='com.apple.wallpaper.choice.image':
                        cfg=plistlib.loads(c['Configuration'])
                        if cfg.get('url',{}).get('relative')!=NEW: cfg['url']['relative']=NEW; c['Configuration']=plistlib.dumps(cfg, fmt=plistlib.FMT_BINARY)
            walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
walk(d); plistlib.dump(d, open(P,'wb'), fmt=plistlib.FMT_BINARY)
PY
sleep 1; killall WallpaperAgent 2>/dev/null || true
ls -t "$DIR"/ib45-*.png | tail -n +4 | xargs rm -f 2>/dev/null || true
echo "$STAMP ok" >> "$LOG"
