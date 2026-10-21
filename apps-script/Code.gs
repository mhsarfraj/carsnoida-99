/** CarsNoida99 backend. Paste into Extensions > Apps Script of your Google Sheet (container-bound: no sheet ID needed).
 *  Deploy: Web app, Execute as: Me, Access: Anyone. Password hash lives in Script Properties, never in the sheet. */
const H = ['id','slug','title','brand','model','variant','year','price','marketPrice','km','fuel','transmission','owners','bodyType','color','rto','seats','engineCc','mileage','features','note','images','featured','published','views','created','updated','condition','insurance','warranty','service','status','costPrice','soldPrice'];
const LH = ['id','time','name','phone','email','type','carId','carTitle','budget','message','source','status','priority','followUp','notes','updated','timeline','preferredTime','lostReason','lastContact','repeat','history'];
const LNUM = ['budget','repeat'];
const LSTATUS = ['New','Contacted','Visit scheduled','Negotiation','Won','Lost'];
const NUM = ['year','price','marketPrice','km','owners','seats','engineCc','views','costPrice','soldPrice'];
const SESSION_SEC = 6 * 3600;

function setupSheets() {                       // run once from the editor; safe to re-run after updates (adds new columns)
  const ss = SpreadsheetApp.getActive();
  const mk = (n, h) => {
    const s = ss.getSheetByName(n) || ss.insertSheet(n);
    if (s.getMaxColumns() < h.length) s.insertColumnsAfter(s.getMaxColumns(), h.length - s.getMaxColumns());
    s.getRange(1, 1, 1, h.length).setValues([h]); s.setFrozenRows(1);
  };
  mk('Cars', H); mk('AdminUsers', ['username','role','created','lastLogin']);
  mk('ActivityLogs', ['time','user','action','recordId','detail']); mk('Settings', ['key','value']); mk('Leads', LH);
  try { formatSheets(); } catch (e) { console.log('format skipped: ' + e); }
}
/**
 * INITIAL ADMIN SETUP
 * Run setupSheets() first, then run setAdmin() once from the Apps Script editor.
 * Initial credentials: admin / 12345678. Sign in and change this immediately
 * from Admin > Account to a unique password of at least 10 characters.
 * Running this again resets the admin password and updates (not duplicates) the row.
 */
function setAdmin() {
  const USER = 'admin', PASS = '12345678';
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName('AdminUsers') || !ss.getSheetByName('ActivityLogs')) {
    throw new Error('Run setupSheets() first, then run setAdmin() again.');
  }
  setCred_(USER, PASS);
  const s = ss.getSheetByName('AdminUsers');
  const last = s.getLastRow();
  const rows = last > 1 ? s.getRange(2, 1, last - 1, 1).getDisplayValues() : [];
  const idx = rows.findIndex(r => String(r[0]).toLowerCase() === USER.toLowerCase());
  const values = [USER, 'owner', idx >= 0 ? s.getRange(idx + 2, 3).getValue() || new Date() : new Date(), ''];
  if (idx >= 0) s.getRange(idx + 2, 1, 1, 4).setValues([values]);
  else s.appendRow(values);
  log_(USER, 'admin_setup', '', 'Initial admin credentials reset');
}
function setCred_(user, pass) {
  const salt = Utilities.getUuid(), p = PropertiesService.getScriptProperties();
  p.setProperties({ ADMIN_USER: user, ADMIN_SALT: salt, ADMIN_HASH: hash_(pass, salt) });
}
function hash_(pass, salt) {
  let d = salt + pass;
  for (let i = 0; i < 2000; i++) d = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, d + salt));
  return d;
}
const out_ = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const ok_ = (d) => out_({ ok: true, data: d }), err_ = (m, code) => out_({ ok: false, error: m, code: code || 400 });
const sheet_ = () => { const s = SpreadsheetApp.getActive().getSheetByName('Cars'); if (s.getMaxColumns() < H.length) s.insertColumnsAfter(s.getMaxColumns(), H.length - s.getMaxColumns()); return s; };
const log_ = (u, a, id, d) => SpreadsheetApp.getActive().getSheetByName('ActivityLogs').appendRow([new Date(), u, a, id, String(d || '').slice(0, 200)]);

function rows_() {
  const s = sheet_(), n = s.getLastRow(); if (n < 2) return [];
  return s.getRange(2, 1, n - 1, H.length).getValues().map(r => {
    const o = {}; H.forEach((k, i) => o[k] = r[i]);
    NUM.forEach(k => o[k] = Number(o[k]) || 0);
    o.features = String(o.features).split('|').filter(Boolean); o.images = String(o.images).split('|').filter(Boolean);
    o.featured = o.featured === true || o.featured === 'TRUE'; o.published = o.published === true || o.published === 'TRUE';
    o.created = o.created ? new Date(o.created).toISOString() : ''; o.updated = o.updated ? new Date(o.updated).toISOString() : '';
    return o;
  });
}
const pub_ = (c) => { const { views, costPrice, soldPrice, ...rest } = c; return rest; };
const lsheet_ = () => { const ss = SpreadsheetApp.getActive(); let s = ss.getSheetByName('Leads'); if (!s) { s = ss.insertSheet('Leads'); s.getRange(1, 1, 1, LH.length).setValues([LH]); s.setFrozenRows(1); }
  if (s.getMaxColumns() < LH.length) s.insertColumnsAfter(s.getMaxColumns(), LH.length - s.getMaxColumns());
  if (String(s.getRange(1, LH.length).getValue()) !== 'history') s.getRange(1, 1, 1, LH.length).setValues([LH]); return s; };
const iso_ = (v) => v ? new Date(v).toISOString() : '';
function lrows_() {
  const s = lsheet_(), n = s.getLastRow(); if (n < 2) return [];
  return s.getRange(2, 1, n - 1, LH.length).getValues().filter(r => r[0] !== '').map(r => { const o = {}; LH.forEach((k, i) => o[k] = r[i]); LNUM.forEach(k => o[k] = Number(o[k]) || 0);
    ['time', 'updated', 'lastContact'].forEach(k => o[k] = iso_(o[k])); o.followUp = o.followUp ? Utilities.formatDate(new Date(o.followUp), 'Asia/Kolkata', 'yyyy-MM-dd') : '';
    o.history = String(o.history || '').split('\n').filter(Boolean).map(h => { const p = h.split('|'); return { t: p[0], u: p[1], x: p.slice(2).join('|') }; }); return o; }).reverse();
}

const ver_ = () => PropertiesService.getScriptProperties().getProperty('VER') || '0';
function doGet(e) {                                // PUBLIC: published cars only. ?v=1 returns just a tiny change-version
  try {
    if (e && e.parameter && e.parameter.health === '1') return out_({ ok: true, service: 'CarsNoida99', version: ver_() });
    if (e && e.parameter && e.parameter.v) return out_({ ok: true, version: ver_() });
    if (e && e.parameter && e.parameter.settings === '1') return publicSettings_(false);
    if (e && e.parameter && e.parameter.photo === '1') return publicSettings_(true);
    const cache = CacheService.getScriptCache(), hit = cache.get('pub');
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
    const body = JSON.stringify({ ok: true, version: ver_(), data: rows_().filter(c => c.published).map(pub_) });
    if (body.length < 90000) cache.put('pub', body, 60);
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
  } catch (x) { return err_('Server error', 500); }
}

function doPost(e) {
  let q; try { q = JSON.parse(e && e.postData && e.postData.contents || '{}'); } catch (x) { return err_('Bad JSON'); }
  if (!q || typeof q !== 'object' || Array.isArray(q)) return err_('Invalid request');
  const cache = CacheService.getScriptCache();
  try {
    if (q.action === 'view') return view_(q.id);
    if (q.action === 'login') return login_(q, cache);
    if (q.action === 'lead') return lead_(q, cache);
    const user = cache.get('s_' + hash_(String(q.token || ''), 'tok'));   // authorise EVERY admin call
    if (!q.token || !user) return err_('Session expired. Please sign in again.', 401);
    switch (q.action) {
      case 'logout': cache.remove('s_' + hash_(q.token, 'tok')); return ok_(true);
      case 'list': return ok_(rows_());
      case 'save': return locked_(() => save_(q.car, user, q.reqId, cache));
      case 'delete': return locked_(() => del_(q.id, user));
      case 'flag': return locked_(() => flag_(q.id, q.field, user));
      case 'password': return pw_(q, user);
      case 'logs': return ok_(logs_());
      case 'leads': return ok_(lrows_());
      case 'leadSave': return locked_(() => leadSave_(q.lead, user));
      case 'leadDelete': return locked_(() => leadDel_(q.id, user));
      case 'settings': return ok_(settings_());
      case 'settingsSave': return locked_(() => settingsSave_(q.settings, user));
      case 'formatSheet': formatSheets(); log_(user, 'format_sheet', '', ''); return ok_(true);
      default: return err_('Unknown action');
    }
  } catch (x) { return err_(String(x.message || x), 500); }
}
function locked_(fn) {
  const l = LockService.getScriptLock(); if (!l.tryLock(15000)) return err_('Server busy, retry', 503);
  try { const r = fn(); CacheService.getScriptCache().remove('pub'); PropertiesService.getScriptProperties().setProperty('VER', String(Date.now())); return r; } finally { l.releaseLock(); }
}
function login_(q, cache) {
  if (!String(q.username || '').trim() || String(q.username).length > 100 || String(q.password || '').length > 300) return err_('Enter your username and password');
  const key = 'f_' + Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(q.username).toLowerCase()));
  const fails = Number(cache.get(key) || 0); if (fails >= 5) return err_('Too many attempts. Try again in 15 minutes.', 429);
  const p = PropertiesService.getScriptProperties().getProperties();
  if (!p.ADMIN_HASH) return err_('Admin not set up yet (run setAdmin).', 500);
  const good = String(q.username).toLowerCase() === String(p.ADMIN_USER).toLowerCase() && hash_(String(q.password), p.ADMIN_SALT) === p.ADMIN_HASH;
  if (!good) { cache.put(key, String(fails + 1), 900); log_('?', 'login_failed', '', q.username); return err_('Invalid username or password', 401); }
  cache.remove(key);
  const token = Utilities.getUuid() + Utilities.getUuid(); cache.put('s_' + hash_(token, 'tok'), p.ADMIN_USER, SESSION_SEC);
  log_(p.ADMIN_USER, 'login', '', ''); return ok_({ token, user: p.ADMIN_USER, expiresIn: SESSION_SEC });
}
function pw_(q, user) {
  const p = PropertiesService.getScriptProperties().getProperties();
  if (hash_(String(q.oldPassword), p.ADMIN_SALT) !== p.ADMIN_HASH) return err_('Current password is wrong', 401);
  if (String(q.newPassword).length < 10) return err_('New password must be at least 10 characters');
  setCred_(p.ADMIN_USER, String(q.newPassword)); log_(user, 'password_changed', '', ''); return ok_(true);
}
const safeUrl_ = (u) => /^(https:\/\/|cars\/|\.\/cars\/)[^\s<>"']+$/.test(u);
function clean_(c) {
  const t = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 200);
  const o = { id: t(c.id, 40), title: t(c.title), brand: t(c.brand, 60), model: t(c.model, 60), variant: t(c.variant, 80), fuel: t(c.fuel, 20), transmission: t(c.transmission, 20),
    bodyType: t(c.bodyType, 30), color: t(c.color, 30), rto: t(c.rto, 60), mileage: t(c.mileage, 40), condition: t(c.condition, 20), insurance: t(c.insurance, 80), warranty: t(c.warranty, 60), service: t(c.service, 80), status: t(c.status, 20) || 'Available', note: t(c.note, 1500), slug: t(c.slug, 120) };
  NUM.forEach(k => o[k] = Number(c[k]) || 0);
  if (!o.brand || !o.model) throw new Error('Brand and model are required');
  if (o.year < 1980 || o.year > new Date().getFullYear() + 1) throw new Error('Enter a valid year');
  if (o.price <= 0) throw new Error('Price must be greater than 0');
  o.features = (c.features || []).map(f => t(f, 80).replace(/\|/g, '/')).filter(Boolean).slice(0, 30);
  o.images = (c.images || []).map(i => t(i, 500)).filter(Boolean).slice(0, 12);
  if (o.images.some(i => !safeUrl_(i))) throw new Error('Image URLs must start with https://');
  if (['Available', 'Reserved', 'Sold'].indexOf(o.status) < 0) o.status = 'Available';
  o.featured = !!c.featured; o.published = !!c.published;
  o.title = o.title || [o.year, o.brand, o.model, o.variant].filter(Boolean).join(' ');
  return o;
}
function save_(car, user, reqId, cache) {
  if (reqId && cache.get('r_' + reqId)) return ok_(JSON.parse(cache.get('r_' + reqId)));   // duplicate-submit guard
  const o = clean_(car), s = sheet_(), now = new Date();
  const ids = s.getLastRow() > 1 ? s.getRange(2, 1, s.getLastRow() - 1, 1).getValues().map(r => String(r[0])) : [];
  const idx = o.id ? ids.indexOf(o.id) : -1;
  let row;
  if (idx >= 0) { const old = s.getRange(idx + 2, 1, 1, H.length).getValues()[0]; o.views = Number(old[H.indexOf('views')]) || 0; o.created = old[H.indexOf('created')]; o.slug = old[1]; row = idx + 2; }
  else {
    o.id = o.id && !ids.includes(o.id) ? o.id : 'c' + Utilities.getUuid().slice(0, 8);
    o.slug = (o.slug || o.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); o.views = 0; o.created = now; row = s.getLastRow() + 1;
  }
  o.updated = now;
  const vals = H.map(k => k === 'features' || k === 'images' ? o[k].join('|') : o[k]);
  s.getRange(row, 1, 1, H.length).setValues([vals]);
  log_(user, idx >= 0 ? 'update' : 'create', o.id, o.title);
  const res = { id: o.id }; if (reqId) cache.put('r_' + reqId, JSON.stringify(res), 300); return ok_(res);
}
function find_(id) { const s = sheet_(); const n = s.getLastRow(); if (n < 2) return 0; const i = s.getRange(2, 1, n - 1, 1).getValues().findIndex(r => String(r[0]) === String(id)); return i < 0 ? 0 : i + 2; }
function del_(id, user) { const r = find_(id); if (!r) return err_('Car not found', 404); sheet_().deleteRow(r); log_(user, 'delete', id, ''); return ok_(true); }
function flag_(id, field, user) {
  if (field !== 'published' && field !== 'featured') return err_('Bad field'); const r = find_(id); if (!r) return err_('Car not found', 404);
  const c = sheet_().getRange(r, H.indexOf(field) + 1), v = !(c.getValue() === true); c.setValue(v);
  sheet_().getRange(r, H.indexOf('updated') + 1).setValue(new Date()); log_(user, field + '=' + v, id, ''); return ok_(v);
}
function view_(id) {   // public analytics: real view counter, throttled by lock tryLock so it never blocks users
  const l = LockService.getScriptLock(); if (!l.tryLock(2000)) return ok_(false);
  try { const r = find_(id); if (r) { const c = sheet_().getRange(r, H.indexOf('views') + 1); c.setValue((Number(c.getValue()) || 0) + 1); } } finally { l.releaseLock(); }
  return ok_(true);
}
function logs_() { const s = SpreadsheetApp.getActive().getSheetByName('ActivityLogs'), n = s.getLastRow(); if (n < 2) return []; return s.getRange(Math.max(2, n - 49), 1, Math.min(50, n - 1), 5).getValues().reverse().map(r => ({ time: new Date(r[0]).toISOString(), user: r[1], action: r[2], recordId: r[3], detail: r[4] })); }

/* ---------------- LEADS / ENQUIRIES (saved in the "Leads" sheet) ---------------- */
const tl_ = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').replace(/^[=+\-@]/, "'$&").trim().slice(0, n || 200);   // also blocks spreadsheet formula injection
const TYPES = ['Buy', 'Sell', 'Test drive', 'Finance', 'Callback', 'Other'], PRIOS = ['Hot', 'Warm', 'Cold'];
const phoneKey_ = (p) => String(p || '').replace(/\D/g, '').slice(-10);
const hist_ = (old, user, text) => { const line = new Date().toISOString() + '|' + user + '|' + String(text).replace(/[\n|]/g, ' ').slice(0, 300); const all = (String(old || '') ? String(old).split('\n') : []).concat(line); while (all.join('\n').length > 6000) all.shift(); return all.join('\n'); };
function lead_(q, cache) {                         // PUBLIC: website enquiry form. Rate limited + honeypot.
  if (q.website) return ok_(true);                  // honeypot field filled by bots
  const name = tl_(q.name, 80), phone = String(q.phone || '').replace(/[^\d+]/g, '').slice(0, 15);
  if (!name) return err_('Please enter your name');
  if (phone.replace(/\D/g, '').length < 10) return err_('Please enter a valid phone number');
  const rk = 'l_' + phone, n = Number(cache.get(rk) || 0); if (n >= 5) return err_('Too many enquiries. Please call us instead.', 429);
  cache.put(rk, String(n + 1), 600);
  const type = TYPES.indexOf(q.type) >= 0 ? q.type : 'Buy';
  const l = LockService.getScriptLock(); if (!l.tryLock(10000)) return err_('Server busy, please try again', 503);
  let row;
  try {
    const s = lsheet_(), cnt = s.getLastRow() > 1 ? s.getRange(2, LH.indexOf('phone') + 1, s.getLastRow() - 1, 1).getValues().filter(r => phoneKey_(r[0]) === phoneKey_(phone)).length : 0;
    const id = 'L' + Utilities.getUuid().slice(0, 6).toUpperCase(), now = new Date(), src = tl_(q.source, 40) || 'Website';
    row = { id, time: now, name, phone, email: tl_(q.email, 100), type, carId: tl_(q.carId, 40), carTitle: tl_(q.carTitle, 120), budget: Number(q.budget) || 0, message: tl_(q.message, 1200), source: src, status: 'New',
      priority: cnt > 0 || type === 'Test drive' || type === 'Finance' || q.timeline === 'Immediately' ? 'Hot' : 'Warm', followUp: new Date(now.getTime()), notes: '', updated: now,
      timeline: tl_(q.timeline, 30), preferredTime: tl_(q.preferredTime, 30), lostReason: '', lastContact: '', repeat: cnt, history: '' };
    row.history = hist_('', 'website', type + ' enquiry received via ' + src + (cnt ? ' (repeat enquiry #' + (cnt + 1) + ')' : ''));
    s.appendRow(LH.map(k => row[k]));
    log_('website', 'lead_' + type.toLowerCase().replace(' ', '_'), id, name);
  } finally { l.releaseLock(); }
  try { notify_(row); } catch (x) { console.log('notify failed ' + x); }
  return ok_({ id: row.id });
}
function notify_(r) {                              // optional e-mail alert: set "Notification e-mail" in CRM > Website
  const to = String(settingsMap_().notify_email || '').trim(); if (!to || !/^[^@\s]+@[^@\s]+$/.test(to)) return;
  MailApp.sendEmail({ to, subject: '🔔 New ' + r.type + ' enquiry: ' + r.name + (r.carTitle ? ' · ' + r.carTitle : ''), body: ['Name: ' + r.name, 'Phone: ' + r.phone, r.email ? 'Email: ' + r.email : '', 'Type: ' + r.type, r.carTitle ? 'Car: ' + r.carTitle : '', r.timeline ? 'Buying timeline: ' + r.timeline : '', r.preferredTime ? 'Best time to call: ' + r.preferredTime : '', r.message ? 'Message: ' + r.message : '', r.repeat ? 'Repeat enquirer (' + (r.repeat + 1) + ' enquiries)' : '', '', 'WhatsApp: https://wa.me/' + (String(r.phone).replace(/\D/g, '').length === 10 ? '91' : '') + String(r.phone).replace(/\D/g, '')].filter(x => x !== '').join('\n') });
}
function leadSave_(L, user) {
  L = L || {}; const s = lsheet_(), n = s.getLastRow(), now = new Date();
  const ids = n > 1 ? s.getRange(2, 1, n - 1, 1).getValues().map(r => String(r[0])) : [], idx = L.id ? ids.indexOf(String(L.id)) : -1;
  if (idx < 0) {                                       // manual lead added by dealer (walk-in / phone call)
    const name = tl_(L.name, 80), phone = String(L.phone || '').replace(/[^\d+]/g, '').slice(0, 15); if (!name || !phone) throw new Error('Name and phone are required');
    const id = 'L' + Utilities.getUuid().slice(0, 6).toUpperCase(), when = L.time && !isNaN(new Date(L.time)) ? new Date(L.time) : now;
    const cnt = n > 1 ? s.getRange(2, LH.indexOf('phone') + 1, n - 1, 1).getValues().filter(r => phoneKey_(r[0]) === phoneKey_(phone)).length : 0;
    const row = { id, time: when, name, phone, email: tl_(L.email, 100), type: TYPES.indexOf(L.type) >= 0 ? L.type : 'Buy', carId: tl_(L.carId, 40), carTitle: tl_(L.carTitle, 120), budget: Number(L.budget) || 0, message: tl_(L.message, 1200), source: tl_(L.source, 40) || 'Walk-in',
      status: LSTATUS.indexOf(L.status) >= 0 ? L.status : 'New', priority: PRIOS.indexOf(L.priority) >= 0 ? L.priority : 'Warm', followUp: L.followUp ? new Date(L.followUp + 'T09:00:00+05:30') : '', notes: tl_(L.notes, 2000), updated: now,
      timeline: tl_(L.timeline, 30), preferredTime: tl_(L.preferredTime, 30), lostReason: tl_(L.lostReason, 60), lastContact: '', repeat: cnt, history: '' };
    row.history = hist_('', user, 'Enquiry added manually (' + row.source + ')'); s.appendRow(LH.map(k => row[k])); log_(user, 'lead_add', id, name); return ok_({ id });
  }
  const r = idx + 2, cur = s.getRange(r, 1, 1, LH.length).getValues()[0], get = (k) => cur[LH.indexOf(k)], upd = {}; let h = String(get('history') || '');
  const note = (t) => { h = hist_(h, user, t); };
  if (L.status !== undefined && LSTATUS.indexOf(L.status) >= 0 && L.status !== get('status')) { upd.status = L.status; note('Status: ' + get('status') + ' → ' + L.status); if (L.status === 'Contacted') upd.lastContact = now; }
  if (L.priority !== undefined && PRIOS.indexOf(L.priority) >= 0 && L.priority !== get('priority')) { upd.priority = L.priority; note('Priority set to ' + L.priority); }
  if (L.followUp !== undefined) { const nf = L.followUp ? new Date(L.followUp + 'T09:00:00+05:30') : ''; const of = get('followUp') ? Utilities.formatDate(new Date(get('followUp')), 'Asia/Kolkata', 'yyyy-MM-dd') : ''; if (String(L.followUp || '') !== of) { upd.followUp = nf; note(L.followUp ? 'Follow-up set for ' + L.followUp : 'Follow-up cleared'); } }
  if (L.notes !== undefined) upd.notes = tl_(L.notes, 2000);
  if (L.lostReason !== undefined) upd.lostReason = tl_(L.lostReason, 60);
  if (L.addNote) note('Note: ' + tl_(L.addNote, 280));
  if (L.logContact) { upd.lastContact = now; note('Contacted: ' + tl_(L.logContact === true ? 'call / message' : L.logContact, 60)); }
  ['name', 'email', 'type', 'carTitle', 'message', 'timeline', 'preferredTime'].forEach(k => { if (L[k] !== undefined) upd[k] = tl_(L[k], k === 'message' ? 1200 : 120); });
  if (L.phone !== undefined) upd.phone = String(L.phone).replace(/[^\d+]/g, '').slice(0, 15);
  if (L.budget !== undefined) upd.budget = Number(L.budget) || 0;
  upd.updated = now; upd.history = h;
  const row = LH.map((k, i) => upd[k] !== undefined ? upd[k] : cur[i]); s.getRange(r, 1, 1, LH.length).setValues([row]);   // one write per save
  log_(user, 'lead_update', L.id, upd.status || ''); return ok_(true);
}
function leadDel_(id, user) {
  const s = lsheet_(), n = s.getLastRow(); if (n < 2) return err_('Lead not found', 404);
  const i = s.getRange(2, 1, n - 1, 1).getValues().findIndex(r => String(r[0]) === String(id)); if (i < 0) return err_('Lead not found', 404);
  s.deleteRow(i + 2); log_(user, 'lead_delete', id, ''); return ok_(true);
}

/* ---------------- WEBSITE SETTINGS (owner photo, banner, reviews, alerts) ---------------- */
const SKEYS = ['owner_name', 'owner_role', 'owner_quote', 'banner_text', 'banner_on', 'reviews', 'hours', 'notify_email', 'sheet_url', 'about_text'];
const PUBKEYS = ['owner_name', 'owner_role', 'owner_quote', 'banner_text', 'banner_on', 'reviews', 'hours', 'about_text'];
const CHUNK = 40000;
function settingsMap_() {
  const s = SpreadsheetApp.getActive().getSheetByName('Settings'); if (!s) return {}; const n = s.getLastRow(); if (n < 2) return {};
  const m = {}; s.getRange(2, 1, n - 1, 2).getValues().forEach(r => { if (r[0]) m[String(r[0])] = String(r[1] == null ? '' : r[1]); }); return m;
}
function photoOf_(m) { let p = '', i = 0; while (m['owner_photo_' + i] !== undefined) p += m['owner_photo_' + i++]; return p; }
function settings_() { const m = settingsMap_(), o = {}; SKEYS.forEach(k => o[k] = m[k] || ''); o.owner_photo = photoOf_(m); return o; }
function publicSettings_(photo) {
  const cache = CacheService.getScriptCache(), ck = photo ? 'sphoto' : 'sset', hit = cache.get(ck);
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  const m = settingsMap_(); let d;
  if (photo) d = { owner_photo: photoOf_(m) }; else { d = {}; PUBKEYS.forEach(k => d[k] = m[k] || ''); d.has_photo = !!m['owner_photo_0']; d.photo_v = m['photo_v'] || ''; }
  const body = JSON.stringify({ ok: true, data: d }); if (body.length < 95000) cache.put(ck, body, 300);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
function settingsSave_(S, user) {
  S = S || {}; const m = settingsMap_();
  SKEYS.forEach(k => { if (S[k] !== undefined) m[k] = k === 'reviews' ? String(S[k]).slice(0, 8000) : tl_(S[k], k === 'owner_quote' || k === 'about_text' ? 600 : 200); });
  if (S.reviews !== undefined) { try { const r = JSON.parse(S.reviews); if (!Array.isArray(r)) throw 0; m.reviews = JSON.stringify(r.slice(0, 12).map(x => ({ name: tl_(x.name, 60), car: tl_(x.car, 80), stars: Math.max(1, Math.min(5, Number(x.stars) || 5)), text: tl_(x.text, 400) }))); } catch (e) { throw new Error('Reviews are not valid'); } }
  if (S.owner_photo !== undefined) {
    Object.keys(m).forEach(k => { if (/^owner_photo_\d+$/.test(k)) delete m[k]; });
    const p = String(S.owner_photo);
    if (p) { if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(p)) throw new Error('Photo must be a JPEG, PNG or WebP image'); if (p.length > CHUNK * 3) throw new Error('Photo is too large. Use a smaller image.'); for (let i = 0; i * CHUNK < p.length; i++) m['owner_photo_' + i] = p.slice(i * CHUNK, (i + 1) * CHUNK); }
    m.photo_v = String(Date.now());
  }
  const sh = SpreadsheetApp.getActive().getSheetByName('Settings') || SpreadsheetApp.getActive().insertSheet('Settings'), keys = Object.keys(m);
  sh.clear(); sh.getRange(1, 1, 1, 2).setValues([['key', 'value']]); if (keys.length) sh.getRange(2, 1, keys.length, 2).setValues(keys.map(k => [k, m[k]])); sh.setFrozenRows(1);
  const c = CacheService.getScriptCache(); c.remove('sset'); c.remove('sphoto'); log_(user, 'settings_saved', '', ''); return ok_(true);
}

/* ---------------- GOOGLE SHEET FORMATTING + SUMMARY (run formatSheets once, or use CRM > Settings) ---------------- */
function formatSheets() {
  const ss = SpreadsheetApp.getActive(), NAVY = '#0d2b4e', col = (h, k) => h.indexOf(k) + 1;
  const head = (s, n) => { const r = s.getRange(1, 1, 1, n); r.setBackground(NAVY).setFontColor('#ffffff').setFontWeight('bold').setVerticalAlignment('middle').setHorizontalAlignment('left'); s.setRowHeight(1, 34); s.setFrozenRows(1); };
  const widths = (s, w) => Object.keys(w).forEach(k => s.setColumnWidth(+k, w[k]));
  const L = lsheet_(), max = 2000;
  head(L, LH.length); L.setFrozenColumns(3);
  const w = {}; LH.forEach((k, i) => w[i + 1] = { id: 80, time: 150, name: 150, phone: 120, email: 170, type: 95, carId: 70, carTitle: 220, budget: 105, message: 280, source: 100, status: 120, priority: 85, followUp: 110, notes: 260, updated: 150, timeline: 110, preferredTime: 110, lostReason: 130, lastContact: 150, repeat: 70, history: 360 }[k] || 100); widths(L, w);
  const body = L.getRange(2, 1, max - 1, LH.length); body.setVerticalAlignment('top').setFontSize(10);
  ['message', 'notes', 'history', 'carTitle'].forEach(k => L.getRange(2, col(LH, k), max - 1, 1).setWrap(true));
  ['time', 'updated', 'lastContact'].forEach(k => L.getRange(2, col(LH, k), max - 1, 1).setNumberFormat('dd mmm yyyy, hh:mm'));
  L.getRange(2, col(LH, 'followUp'), max - 1, 1).setNumberFormat('dd mmm yyyy');
  L.getRange(2, col(LH, 'budget'), max - 1, 1).setNumberFormat('[>=10000000]"₹"##\\,##\\,##\\,##0;[>=100000]"₹"##\\,##\\,##0;"₹"##,##0');
  const dv = (k, list) => L.getRange(2, col(LH, k), max - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build());
  dv('status', LSTATUS); dv('priority', PRIOS); dv('type', TYPES);
  L.getBandings().forEach(b => b.remove()); L.getRange(1, 1, max, LH.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  const rules = [], paint = (k, text, bg, fg) => rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(text).setBackground(bg).setFontColor(fg).setBold(true).setRanges([L.getRange(2, col(LH, k), max - 1, 1)]).build());
  [['New', '#dbeafe', '#1d4ed8'], ['Contacted', '#fef3c7', '#92400e'], ['Visit scheduled', '#ede9fe', '#6d28d9'], ['Negotiation', '#ffedd5', '#c2410c'], ['Won', '#dcfce7', '#15803d'], ['Lost', '#fee2e2', '#b91c1c']].forEach(a => paint('status', a[0], a[1], a[2]));
  [['Hot', '#fee2e2', '#b91c1c'], ['Warm', '#fef3c7', '#92400e'], ['Cold', '#dbeafe', '#1d4ed8']].forEach(a => paint('priority', a[0], a[1], a[2]));
  const fc = col(LH, 'followUp'), sc = col(LH, 'status'), fl = L.getRange(2, fc, max - 1, 1), A = (c) => L.getRange(2, c).getA1Notation().replace(/\d+/, '');
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($' + A(fc) + '2<>"",$' + A(fc) + '2<TODAY(),$' + A(sc) + '2<>"Won",$' + A(sc) + '2<>"Lost")').setBackground('#fecaca').setFontColor('#991b1b').setBold(true).setRanges([fl]).build());
  L.setConditionalFormatRules(rules);
  if (L.getFilter()) L.getFilter().remove(); L.getRange(1, 1, Math.max(2, L.getLastRow()), LH.length).createFilter();
  L.setTabColor('#f5a623');
  const C = sheet_(); head(C, H.length); C.setFrozenColumns(3); C.setTabColor('#16467c');
  [['price', '"₹"##,##0'], ['marketPrice', '"₹"##,##0'], ['costPrice', '"₹"##,##0'], ['soldPrice', '"₹"##,##0'], ['km', '#,##0']].forEach(a => C.getRange(2, col(H, a[0]), max - 1, 1).setNumberFormat(a[1]));
  C.getRange(2, col(H, 'status'), max - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Available', 'Reserved', 'Sold'], true).build());
  const cr = [['Available', '#dcfce7', '#15803d'], ['Reserved', '#fef3c7', '#92400e'], ['Sold', '#fee2e2', '#b91c1c']].map(a => SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(a[0]).setBackground(a[1]).setFontColor(a[2]).setRanges([C.getRange(2, col(H, 'status'), max - 1, 1)]).build()); C.setConditionalFormatRules(cr);
  C.setColumnWidth(col(H, 'title'), 260); C.setColumnWidth(col(H, 'images'), 200); C.setColumnWidth(col(H, 'note'), 260); C.setColumnWidth(col(H, 'features'), 220);
  summarySheet_();
}
function summarySheet_() {
  const ss = SpreadsheetApp.getActive(); let s = ss.getSheetByName('Summary'); if (!s) s = ss.insertSheet('Summary', 0); s.clear(); s.getCharts().forEach(c => s.removeChart(c));
  const lc = (k) => 'Leads!' + String.fromCharCode(64 + LH.indexOf(k) + 1) + '2:' + String.fromCharCode(64 + LH.indexOf(k) + 1), cc = (k) => 'Cars!' + (H.indexOf(k) < 26 ? String.fromCharCode(65 + H.indexOf(k)) : 'A' + String.fromCharCode(65 + H.indexOf(k) - 26)) + '2:' + (H.indexOf(k) < 26 ? String.fromCharCode(65 + H.indexOf(k)) : 'A' + String.fromCharCode(65 + H.indexOf(k) - 26));
  s.setHiddenGridlines(true); s.setTabColor('#16a34a'); s.setColumnWidths(1, 1, 220); s.setColumnWidths(2, 1, 110); s.setColumnWidths(3, 1, 40); s.setColumnWidths(4, 1, 200); s.setColumnWidths(5, 1, 110);
  s.getRange('A1').setValue('CarsNoida99 · Live Summary').setFontSize(18).setFontWeight('bold').setFontColor('#0d2b4e'); s.getRange('A2').setValue('Updates automatically from the Leads and Cars tabs. Do not type in this sheet.').setFontColor('#64748b');
  const kpi = [['Total enquiries', '=COUNTA(' + lc('id') + ')'], ['New today', '=COUNTIFS(' + lc('time') + ',">="&TODAY())'], ['Last 7 days', '=COUNTIFS(' + lc('time') + ',">="&(TODAY()-7))'], ['Follow-ups due', '=COUNTIFS(' + lc('followUp') + ',"<="&TODAY(),' + lc('status') + ',"<>Won",' + lc('status') + ',"<>Lost",' + lc('followUp') + ',"<>")'], ['Hot leads open', '=COUNTIFS(' + lc('priority') + ',"Hot",' + lc('status') + ',"<>Won",' + lc('status') + ',"<>Lost")'], ['Conversion rate', '=IFERROR(COUNTIF(' + lc('status') + ',"Won")/COUNTA(' + lc('id') + '),0)'], ['Cars published', '=COUNTIF(' + cc('published') + ',TRUE)'], ['Cars sold', '=COUNTIF(' + cc('status') + ',"Sold")']];
  s.getRange(4, 1, kpi.length, 2).setValues(kpi); s.getRange(4, 1, kpi.length, 1).setFontWeight('bold'); s.getRange(4, 2, kpi.length, 1).setFontSize(13).setFontWeight('bold').setHorizontalAlignment('right').setFontColor('#0d2b4e'); s.getRange(9, 2).setNumberFormat('0.0%');
  s.getRange(4, 1, kpi.length, 2).setBorder(true, true, true, true, true, true, '#e3e9f2', SpreadsheetApp.BorderStyle.SOLID).setBackground('#f8fafc');
  const tb = (r, c, title, items, key) => { s.getRange(r, c, 1, 2).setValues([[title, 'Count']]).setBackground('#0d2b4e').setFontColor('#fff').setFontWeight('bold'); s.getRange(r + 1, c, items.length, 2).setValues(items.map(i => [i, '=COUNTIF(' + lc(key) + ',"' + i + '")'])); };
  tb(14, 1, 'Enquiries by status', LSTATUS, 'status'); tb(14, 4, 'Enquiries by type', TYPES, 'type'); tb(23, 1, 'Priority', PRIOS, 'priority'); tb(23, 4, 'Source', ['Website', 'Walk-in', 'WhatsApp', 'CarWale', 'CarTrade', 'Instagram'], 'source');
  s.getCharts().forEach(c => s.removeChart(c));
  s.insertChart(s.newChart().asColumnChart().addRange(s.getRange(14, 1, LSTATUS.length + 1, 2)).setPosition(3, 7, 0, 0).setOption('title', 'Enquiries by status').setOption('colors', ['#16467c']).setOption('legend', { position: 'none' }).setOption('width', 460).setOption('height', 280).build());
  s.insertChart(s.newChart().asPieChart().addRange(s.getRange(14, 4, TYPES.length + 1, 2)).setPosition(18, 7, 0, 0).setOption('title', 'Enquiries by type').setOption('width', 460).setOption('height', 280).build());
}
