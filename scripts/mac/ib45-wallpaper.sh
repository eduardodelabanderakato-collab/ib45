#!/bin/zsh
set -euo pipefail
URL="https://eduardodelabanderakato-collab.github.io/ib45/wp-mac.png"
DIR="$HOME/Pictures/IB45"; LOG="$HOME/Library/Logs/ib45-wallpaper.log"
mkdir -p "$DIR"; STAMP=$(date +%Y%m%d-%H%M%S); NEW="$DIR/ib45-$STAMP.png"
curl -fsSL --max-time 60 "$URL?v=$STAMP" -o "$NEW" || { echo "$STAMP download failed" >> "$LOG"; exit 1; }
[ -s "$NEW" ] || { rm -f "$NEW"; echo "$STAMP empty" >> "$LOG"; exit 1; }
/usr/bin/osascript -e "tell application \"System Events\" to tell every desktop to set picture to POSIX file \"$NEW\""
sleep 1; killall WallpaperAgent 2>/dev/null || true
ls -t "$DIR"/ib45-*.png | tail -n +4 | xargs rm -f 2>/dev/null || true
echo "$STAMP ok" >> "$LOG"
