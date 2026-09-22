# iPhone / iPad wallpaper (one-time, ~5 min each)

1. Lock Screen: long-press → + → Photos → pick any photo → Add. This creates the plain-photo wallpaper set the shortcut will update. Add widgets if you like.
2. Shortcuts → + → name it `IB45 Wallpaper`. Actions, in order:
   - **Date**
   - **Format Date** → Custom → `yyyyMMddHHmm`
   - **URL** → `https://eduardodelabanderakato-collab.github.io/ib45/wp-iphone.png?v=` then insert the *Formatted Date* variable right after `?v=` (iPad: use `wp-ipad.png`)
   - **Get Contents of URL**
   - **Set Wallpaper Photo** → input = Contents of URL → choose the wallpaper set from step 1 → Lock Screen ON, Home Screen ON → Show More → **Show Preview OFF**
3. Run it once by hand (play button). Tap Allow on both prompts.
4. Shortcut settings (ⓘ) → Privacy → **Allow Running When Locked** ON.
5. Automation tab → + → **Time of Day** 07:05 → Daily → **Run Immediately** → pick `IB45 Wallpaper` → Done. Repeat for 16:05.
