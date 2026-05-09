# OT Drug Chart v2 — Deployment Guide

## What changed in v2
- ✅ Log Use tab simplified — no staff name or patient/reference fields
- ✅ **Bidirectional Google Sheets sync** — app pushes logs TO Sheets AND pulls stock FROM Sheets
- ✅ Auto-pull every 5 minutes when connected
- ✅ Manual "Pull from Sheets" button on Stock tab and dashboard
- ✅ Sync status bar shows last sync time

---

## Files
```
ot-drug-chart-v2/
├── index.html       ← Full PWA app
├── manifest.json    ← Install config
├── sw.js            ← Service worker (offline + push)
├── Code.gs          ← Google Apps Script (copy this into Apps Script)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

---

## Deploy (5 minutes, free)

**Netlify (easiest):**
1. Go to netlify.com → sign up free
2. "Add new site" → "Deploy manually"
3. Drag the `ot-drug-chart-v2` folder onto the page
4. Get your URL (e.g. `https://ot-drugs.netlify.app`) → share with staff

**GitHub Pages:**
1. New repo → upload all files → Settings → Pages → main branch

---

## Google Sheets setup (bidirectional sync)

### 1. Create the sheet
- New sheet named `OT Drug Chart`
- Create two tabs: `Logs` and `Stock`

**Logs tab — row 1 headers:**
| Timestamp | Drug | Qty Used | Notes | Stock After | Threshold |

**Stock tab — row 1 headers:**
| Drug | Stock | Threshold | Max |

### 2. Paste the Apps Script
- Extensions → Apps Script → delete existing → paste `Code.gs` contents
- Change `ALERT_EMAIL` to the OT lead's email

### 3. Deploy as Web App
- Deploy → New deployment → Type: Web app
- Execute as: **Me**
- Who has access: **Anyone**
- Click Deploy → **copy the URL**

### 4. Connect the app
- Open the OT Drug Chart app → Settings (CONFIG tab)
- Paste the URL → Save
- Tap "Pull stock from Sheets now" to test

---

## How bidirectional sync works

| Direction | When | What |
|-----------|------|------|
| App → Sheets | On every log entry | Writes to Logs tab, updates Stock tab |
| App → Sheets | On every stock edit | Updates Stock tab |
| Sheets → App | Every 5 minutes (auto) | Reads Stock tab, updates app |
| Sheets → App | Manual tap | "Pull from Sheets" button |

**The Stock tab in Google Sheets is the single source of truth.** 
A pharmacist or manager can update quantities directly in the sheet, and the app will pull those changes automatically.

---

## Email alerts

- **Low stock alert** — fires automatically when any drug hits or drops to its threshold
- **Daily summary** — add a trigger in Apps Script: Triggers → Add trigger → `sendDailySummary` → Time-driven → Day timer → 7am–8am

---

## Install on phones

**Android (Chrome):** Open URL → 3-dot menu → Add to Home Screen

**iPhone (Safari):** Open URL → Share button → Add to Home Screen

---

## Push notifications

Settings → Push notifications toggle → Accept permission → test in Alerts tab
