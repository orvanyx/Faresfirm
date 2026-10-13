# Fares Hamad Hoteil Al Monajem Maintenance Establishment - single-page site with Freddy guide bot

Static site, no build step.

```
fares-website-v2/
  index.html
  README.md
  assets/
    css/style.css            all styling (sheet theme + Freddy)
    js/freddy-data.js        avatar definition as a JS global (same data as the .json)
    js/avatar.js             renderer for *.avatar.json (CSS 3D, animations, blinking)
    js/bot.js                Freddy behaviour: follow scroll, explain hovers, moods, sleep
    data/freddy.avatar.json  original export, kept as the source of truth
```

## Make Freddy explain something
Add `data-bot="text"` to any element. Optional `data-mood="happy"` picks an animation
(any name from the avatar file: idle, happy, excited, thinking, searching, proud, playful ...).
Sections use `data-section data-mood="..."` and optional `data-bot-section="greeting"`.

## Update the avatar
Re-export from the avatar tool, replace `assets/data/freddy.avatar.json`, then regenerate `freddy-data.js`:
```powershell
"window.FREDDY_AVATAR = " + (Get-Content assets/data/freddy.avatar.json -Raw) + ";" | Set-Content assets/js/freddy-data.js -Encoding utf8
```

## Run locally (Windows)
```powershell
cd fares-website-v2
py -m http.server 8080
```
Deploy on Cloudflare Pages: framework None, no build command, output directory `/`.
