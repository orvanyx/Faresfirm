# Fares Hamad Hoteil Al Monajem Maintenance Establishment - website

Plain HTML, CSS and JS. No build step. **All styling is in one file: `assets/css/style.css`.**

```
fares-website-v3/
├── index.html                      Home (3 service buttons, intro, steps)
├── industrial-equipment/index.html Machines | Spare parts | Gallery | How to order
├── maintenance/index.html          Services | Process | Gallery
├── electric-testing/index.html     Coming soon page
├── assets/
│   ├── css/style.css               the single stylesheet
│   ├── js/site.js                  tabs, gallery filter, lightbox
│   ├── js/freddy.js                Freddy: renderer + behaviour
│   ├── js/freddy-data.js           Freddy's avatar data (JS copy of the JSON)
│   ├── data/freddy.avatar.json     original avatar export
│   └── img/gallery/*.svg           sample gallery images (replace with real photos)
├── _headers                        Cloudflare Pages headers
└── .gitignore
```

## Replace the sample gallery images
1. Put your photos in `assets/img/gallery/` (jpg or webp, about 800x600).
2. In `industrial-equipment/index.html` or `maintenance/index.html`, change the `src` of the image
   and the caption text. `data-brand="Atlas Copco"` or `"Ingersoll Rand"` controls the brand filter.

## Make Freddy explain something
Add `data-bot="text"` to any element. Optional `data-mood="happy"` picks an animation
(idle, happy, excited, thinking, searching, proud, playful, curious ... any name in the avatar file).
Sections can use `data-section data-mood="..."` so Freddy's mood follows where you scroll.

## Side buttons
The three fixed buttons are the `<nav class="rail">` block on every page. On phones (700px and below)
they become a bottom bar so they never cover content.

## Run locally (Windows PowerShell)
```powershell
cd fares-website-v3
py -m http.server 8080
```
Open http://localhost:8080

## Deploy to Cloudflare Pages
Workers & Pages > Create > Pages > Connect to Git. Framework preset: None. Build command: empty. Output directory: `/`.
