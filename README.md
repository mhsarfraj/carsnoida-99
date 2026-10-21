# CarsNoida99 — Professional Showroom + Dealer CRM Portal

A modern, responsive used-car marketplace with a separate dealer portal for inventory management. The refreshed visual system uses a premium midnight-blue and warm-gold palette, a split hero layout, clear calls to action, polished inventory cards, and a more structured CRM-style admin dashboard. The project uses **HTML/CSS/JavaScript + Google Apps Script + Google Sheets**; Node.js/npm is not required.


## What's new in v4.0 (CRM rebuilt: simpler, live, smarter)

**After updating, do this once:** paste the new `apps-script/Code.gs`, run `setupSheets` (it also formats your sheet and creates a live **Summary** tab), then Deploy → Manage deployments → Edit → New version.

- **Live CRM:** new enquiries appear automatically (checks every 40 s) with an alert sound, a badge and a count in the browser tab title.
- **Home:** greeting with what needs you today, clickable KPIs, date-range chips, Today's focus, live activity feed, 14-day trend, funnel, ageing stock.
- **Enquiries:** List, Board (drag and drop) and Follow-ups in one tab. Smart filters (New, Hot, Due, No follow-up, Sell requests, Test drives), sorting, bulk actions, lead score.
- **Lead panel:** stage buttons, priority, follow-up quick dates, WhatsApp message templates, call and email, private notes, quick-note timeline, lost reason, repeat-enquirer detection.
- **Customers** (grouped by phone), **Cars** (stock, days in stock, enquiries per car, Sold & profit), **Reports** (response time, win rate by source, lost reasons).
- **Website tab:** upload the shop owner photo, edit name, quote, about text, hours, announcement bar and customer reviews from the CRM. The website updates itself. No file editing.
- **E-mail alert** for every website enquiry (set it in Website tab).
- **Better Google Sheet:** Leads tab now has coloured stages and priorities, dropdowns, overdue follow-ups in red, filters, frozen headers, rupee formats, timeline/history column, plus a live **Summary** tab with charts. Re-run any time from CRM → Settings → Format my sheet.
- Dark mode, mobile bottom navigation, global search (press /), shortcuts (N new, R refresh).
- Website enquiry forms now also ask buying timeline and best time to call.

## Included

- `index.html` — redesigned public showroom homepage and marketplace, filters, search, car details, compare/saved cars, EMI estimate, sell enquiry and WhatsApp links.
- `admin.html` — separate dealer login and CRM-style inventory management portal, with dashboard, car management, activity logs and account settings.
- `admin.html` — admin login, dashboard, inventory CRUD, publish/feature toggles, activity log and password change.
- `config.js` — the Apps Script Web App `/exec` URL and WhatsApp/site settings.
- `apps-script/Code.gs` — complete server-side API, password hashing, session tokens, rate limiting, validation, activity logging and Sheets setup.
- `data/cars.js` and `data/cars.json` — starter inventory data.
- `cars/`, `logo/`, `premium-assets/` — supplied car photos and visual assets.
- `LOGIN_FIX.md` — step-by-step login repair checklist.

## Quick local preview

1. Extract this ZIP to a normal folder (do not open the HTML from inside the ZIP).
2. Open `index.html` to preview the public site.
3. To preview admin in local demo mode, temporarily set `API_URL: ""` in `config.js`, then sign in with `demo` / `demo`. Demo changes stay only in that browser and are **not real authentication**.
4. Restore the real `/exec` URL before going live.

## Set up the live backend from scratch

1. Create a new Google Sheet at https://sheets.new.
2. Open **Extensions → Apps Script**.
3. Replace the editor contents with the full `apps-script/Code.gs` file from this ZIP. Save.
4. From the function dropdown, select `setupSheets` and click **Run**. Approve Google permissions. This creates/updates `Cars`, `AdminUsers`, `ActivityLogs`, and `Settings`.
5. Select `setAdmin` and click **Run**. Approve permissions if asked. This initializes the first admin account.
6. Initial sign-in: username **`admin`**, password **`12345678`**. This is a temporary setup password. After signing in, open **Account → Change password** and set a unique password with at least 10 characters. Do not share or reuse the temporary password.
7. Click **Deploy → New deployment → Select type: Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Click Deploy and copy the URL ending in `/exec`.
8. Paste that URL into `config.js` as `API_URL`. Keep the `/exec` suffix. Save the file.
9. If already deployed, use **Deploy → Manage deployments → Edit → New version → Deploy** after every backend code change. The URL generally remains the same for an existing deployment.
10. Upload all extracted files and folders to your static host (e.g. GitHub Pages). Ensure `config.js`, `data/`, `cars/`, `logo/`, `apps-script/`, and `index.html`/`admin.html` are uploaded together.
11. Open `admin.html`, sign in, add or import inventory, and verify that the public site only displays published cars.

## Login troubleshooting

- **Invalid username/password:** run `setAdmin` from the same Apps Script project connected to the deployed URL, then deploy a **New version**. Sign in with `admin` / `12345678` and change it immediately.
- **Admin not set up yet:** run `setupSheets`, then `setAdmin`.
- **Network / JSON response error:** check that `config.js` contains the Web App `/exec` URL, deployment access is **Anyone**, and the latest version is deployed.
- **Session expired:** sign in again; sessions expire after 6 hours.
- **Too many attempts:** wait 15 minutes before retrying.
- **Stale session:** sign out, reload the page, then sign in again.
- **Password lost:** run `setAdmin` to reset the initial password, deploy a new version, sign in and change the password immediately.
- **Do not put passwords in `config.js` or in Google Sheets.** Password hashes are stored in Script Properties.

## Security and operating notes

- Admin API actions require a server-validated session token. Passwords are salted and hashed server-side; repeated failed logins are rate-limited.
- The first-run password is intentionally simple only to get setup unstuck. Change it immediately and keep the Apps Script project private to trusted editors.
- The web app endpoint is public by design so the public site can fetch published cars. Admin writes remain token-protected.
- Apps Script/Sheets are suitable for small dealership inventories and moderate traffic, not high-volume transactional workloads. The public listing cache may delay updates by up to 60 seconds.
- The project is static and does not require `npm install` or a local database.

## Deploy checklist

- [ ] `setupSheets` completed successfully
- [ ] `setAdmin` completed successfully
- [ ] Apps Script deployed as Web app, execute as Me, access Anyone
- [ ] `config.js` contains the correct `/exec` URL
- [ ] Login succeeds and temporary password is changed
- [ ] Create/edit/publish/unpublish/delete a test car
- [ ] Published car appears on `index.html`
- [ ] Hidden car does not appear publicly
- [ ] Test on phone and desktop
