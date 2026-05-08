# OT Drug Chart — PWA Deployment Guide

## What's in this folder

```
ot-drug-chart/
├── index.html        ← Main app (all logic + UI)
├── manifest.json     ← PWA install config
├── sw.js             ← Service worker (offline + push notifications)
├── icons/
│   ├── icon-192.png  ← App icon (home screen)
│   └── icon-512.png  ← App icon (splash screen)
└── README.md         ← This file
```

---

## Deploy to Netlify (recommended — free, 5 minutes)

1. Go to **netlify.com** and sign up free
2. Click **"Add new site" → "Deploy manually"**
3. Drag and drop the entire `ot-drug-chart` folder onto the page
4. Netlify gives you a URL like `https://ot-drug-chart.netlify.app`
5. Share that URL with all OT staff

That's it. Done.

---

## Deploy to GitHub Pages (also free)

1. Create a free account at **github.com**
2. Click **New repository** → name it `ot-drug-chart` → Public → Create
3. Upload all files (drag and drop in the browser)
4. Go to **Settings → Pages → Source: main branch → /root**
5. Your URL: `https://yourusername.github.io/ot-drug-chart`

---

## Install on phones (staff instructions)

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the 3-dot menu → "Add to Home screen"
3. Tap "Add" — the app icon appears on your home screen

### iPhone (Safari)
1. Open the app URL in Safari (must be Safari, not Chrome)
2. Tap the Share button (box with arrow at bottom)
3. Scroll down → "Add to Home Screen"
4. Tap "Add" — the app icon appears on your home screen

The app then works like a native app — full screen, no browser bar, works offline.

---

## Connect to Google Sheets

1. Create your Google Sheet with two tabs: `Logs` and `Stock`
2. Add headers:
   - Logs tab: Timestamp | Drug | Qty Used | Staff | Patient | Notes
   - Stock tab: Drug | Stock | Threshold | Max
3. Go to Extensions → Apps Script → paste the Code.gs script
4. Deploy → New deployment → Web app → Anyone → Copy URL
5. In the OT Drug Chart app → Settings tab → paste the URL → Save

Every log entry now syncs automatically to your sheet.

---

## Enable email alerts

In your Apps Script (Code.gs):
- Change `ALERT_EMAIL` to the OT lead's email address
- Add a trigger: Extensions → Apps Script → Triggers → Add trigger
  - Function: `sendDailySummary`
  - Time-driven: Day timer, 7am–8am

---

## Enable push notifications (phones)

1. Open the app on the phone
2. Go to Settings tab
3. Toggle "Push notifications" ON
4. Accept the permission prompt
5. Test with the "Send test notification" button in the Alerts tab

Notifications fire automatically when any drug drops to or below its reorder threshold.

---

## Features

- ✅ Works offline (data stored on device)
- ✅ Syncs to Google Sheets when online
- ✅ Email alerts on low/critical stock
- ✅ Push notifications on phone
- ✅ Daily stock summary email
- ✅ Installs as a home screen app (no App Store needed)
- ✅ Works on Android and iPhone
- ✅ Prevents over-ordering with max stock levels
- ✅ Full audit log of all usage
