# CarsNoida99 login repair

The most common cause of the login failure in the previous ZIP was that the Apps Script source contained a placeholder initial password (`CHANGE-ME-TO-A-LONG-PASSPHRASE`). The login cannot work until an admin credential is initialized in the same Apps Script project that is deployed to the URL in `config.js`.

## Repair steps

1. Open the Google Sheet used by CarsNoida99 → **Extensions → Apps Script**.
2. Replace the backend with `apps-script/Code.gs` from this ZIP and save.
3. Run `setupSheets` once; approve permissions.
4. Run `setAdmin`; approve permissions. It updates the existing `admin` row instead of creating duplicate admin rows.
5. Deploy → **Manage deployments** → edit → select **New version** → Deploy. If this is a new backend, create a new Web app deployment and update `config.js`.
6. Use username `admin` and password `12345678` once. Immediately change it in **Admin → Account** to a unique password of 10+ characters.
7. Clear stale session by signing out/reloading. If still stuck, wait 15 minutes if the failed-login rate limit was triggered.

## Confirm endpoint

Open your configured URL with `?health=1` appended. A working deployment should return JSON containing `"ok":true` and `"service":"CarsNoida99"`. If it does not, the URL may point to an older deployment or another Apps Script project.

Never publish passwords in `config.js`, HTML, or the Google Sheet. `config.js` should contain only the public Apps Script URL and business settings.
