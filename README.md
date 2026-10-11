# Fares Hamad Hoteil Al Monajem Maintenance Establishment - Website

Static website (HTML, CSS, JS). No build step.

## Structure
- `index.html` - home page with the two activity selectors
- `industrial-equipment/` - machines, spare parts, how to order
- `electrical-testing-maintenance/` - testing, maintenance, reports
- `contact/` - call, WhatsApp, email, enquiry form
- `assets/css/base.css` - shared design tokens, header, footer, tabs
- `assets/css/<page>.css` - one stylesheet per activity so each can look different
- `assets/js/` - menu, tabs, contact form

## Run locally on Windows (PowerShell)
```powershell
cd fares-website
py -m http.server 8080
```
Open http://localhost:8080

## Deploy to Cloudflare Pages
1. Push this folder to GitHub.
2. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git.
3. Framework preset: None. Build command: leave empty. Build output directory: `/`
4. Save and deploy. Add your domain under Custom domains.

## Adding a new activity
1. Copy `electrical-testing-maintenance/` to a new folder and edit it.
2. Add `assets/css/<new>.css`.
3. Add a card in `index.html` and a link in the header and footer.
