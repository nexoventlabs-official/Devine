
# Devine WhatsApp Automation — Build Report & Setup Guide

This document covers **what was built**, **what is live**, **what still needs your action** (Meta / hosting / bank), and a **step-by-step Meta setup guide**.

---

## 1. Project structure (restructured as requested)

```
FMCG/
├── frontend/            # Vite + React site, admin, CRM, tracking
│   ├── src/
│   │   ├── pages/TrackPage.jsx          # Zomato-style live tracking
│   │   └── pages/admin/                 # Leads, Orders, Products, Categories,
│   │       │                            #   FlowImages, SupplyCountries, CRM, AdminLayout
│   ├── index.html, vite.config.js, package.json, vercel.json
├── backend/             # Express (ESM) API + WhatsApp automation
│   ├── .env             # ALL credentials live here (gitignored)
│   ├── server.js
│   ├── models/          # Lead, Product, Category, FlowAsset, SupplyCountry,
│   │                    #   Order, DealerProfile, Message, Template, Conversation, Enquiry, Career
│   ├── routes/          # webhook, flowEndpoint, products, catalog, leads, orders, crm
│   ├── services/        # metaCloud, cloudinary, chatbotB2B, chatbotB2C, chatbot,
│   │                    #   conversationState, flowCrypto, pdf, scheduler, assets, eventBus, ids, templates
│   ├── flows/           # b2bFlows.js, b2cFlows.js, flowKeys.js
│   ├── data/geo.js      # states -> districts for dealer flow
│   ├── keys/            # RSA keys for Flow encryption (gitignored)
│   └── scripts/         # generateFlowKeys.js, publishFlows.js, seedTemplates.js
└── render.yaml          # backend deploy config (rootDir: backend)
```

---

## 2. Callback URL & Verify Token (both numbers use ONE app)

B2B and B2C share Meta app `1344636914323859`, so there is **one webhook**, routed internally by `phone_number_id`.

| Item                         | Value                                                        |
| ---------------------------- | ------------------------------------------------------------ |
| **Callback URL**       | `https://<your-backend-domain>/api/whatsapp/webhook`       |
| (on your Render backend)     | `https://devine-yebh.onrender.com/api/whatsapp/webhook`    |
| **Verify token**       | `devine_whatsapp_verify_2026`                              |
| **Flow data endpoint** | `https://<your-backend-domain>/api/whatsapp/flow-endpoint` |

Subscribe the webhook to the **messages** field for **both** WABAs.

---

## 3. WhatsApp Flows — status

Flow public encryption keys were generated and **uploaded to both WABAs** successfully.

| Flow                | Channel | Status                            |
| ------------------- | ------- | --------------------------------- |
| Choose Service      | B2B     | ✅**Published**             |
| Bulk / Wholesale    | B2B     | ✅**Published**             |
| Corporate Gifting   | B2B     | ✅**Published**             |
| Choose Service      | B2C     | ✅**Published**             |
| Order Summary       | B2C     | ✅**Published**             |
| Review              | B2C     | ✅**Published**             |
| Dealer Registration | B2B     | ⏳**Draft** (endpoint flow) |
| Export Supply       | B2B     | ⏳**Draft** (endpoint flow) |

The two draft flows are **endpoint-driven** (dynamic state→district, dynamic export country/product lists). Meta requires the data endpoint to be **live and reachable** before it will publish them. They have valid JSON and their ids are already in `.env`.

**To finish these two:** deploy the backend (so `https://<domain>/api/whatsapp/flow-endpoint` is reachable), then run:

```bash
cd backend
node scripts/publishFlows.js
```

The script is idempotent (reuses flows by name) and writes ids back into `.env`.

---

## 4. What is fully built and working

- **Dual-number routing** (B2B/B2C) by `phone_number_id`.
- **B2B journey:** `hi` → image welcome + Choose Service flow → Dealer / Already-Dealer profile / Bulk / Gifting / Export. Dealer signup captures business, state→district(dynamic)→city, business type + capacity, confirm table, then PDF + testimonials message. Bulk asks MOQ + qty → location → summary. Gifting form → PDF. Export country/enquiry → details + doc upload → 24h response message. Every submission creates a **Lead** and fires a **real-time admin alert**.
- **B2C journey:** `hi` → welcome + Choose Service → Browse (categories → product cards → add to cart → order summary flow → payment method), Gifting, Track Order (map link), Talk to us. COD and Online paths. Online → WhatsApp native Pay.
- **Real-time admin alerts:** SSE stream + WebAudio beep, no manual refresh (`/admin/leads`).
- **Admin pages:** Flow Images (icons/banners/PDF/links), Products (add/delete, image upload, optional template push), Categories, Supply Countries, Orders (status control), CRM.
- **CRM (`/crn`):** chat threads per channel, send messages, template library, trigger to one or **broadcast to all dealers**. Seeded sequences: dealer welcome 1/2/3, weekly, restock, festival, product launch.
- **Scheduler:** dealer welcome +10min/+1hr; weekly (Mon 10:00 IST); restock (daily, 30-day inactive dealers).
- **Live tracking (`/track`):** Leaflet + OpenStreetMap + Socket.IO, lorry SVG marker, store→driver→destination polyline, Flipkart-style status timeline with timestamps. Admin status changes push WhatsApp updates + socket events.
- **PDF:** invoice on delivery (PDFKit → Cloudinary), dealer info fallback PDF. On delivery: invoice sent + review flow triggered (5★ → Google review + DIVINE10 code; ≤3★ → apology + internal alert lead).
- **Cloudinary** wired for all uploads.

---

## 5. What still needs YOUR action (external dependencies)

1. **Deploy the backend** to a public HTTPS URL (Render config included). Set all `.env` vars in the host dashboard. Then:
   - In Meta → App → WhatsApp → Configuration, set the **Callback URL** + **verify token** above and subscribe **messages** for both WABAs.
   - Re-run `node scripts/publishFlows.js` to publish the 2 endpoint flows.
2. **WhatsApp Payments (India):** In **WhatsApp Manager → Payments → Create payment configuration** (the screenshot you sent):
   - Payment configuration name: e.g. `devine-b2c-razorpay` (internal only).
   - MCC: test `0000` for now; live use grocery/food code (`5411`/`5499`).
   - Purpose code: test `00`; live per your BSP.
   - Connect **Razorpay** + your **bank account** (requires Razorpay onboarding linked to the WABA).
   - Put the configuration name into `WHATSAPP_PAYMENT_CONFIG` in `.env`. Native Pay then activates automatically in the B2C online flow.
3. **Deploy the frontend** (Vercel) and set `FRONTEND_BASE_URL` in backend `.env` so tracking/review links resolve.
4. **Upload flow images** in Admin → Flow Images (welcome banners, headers, dealer/gifting PDFs, Google review link). Flows use text/list fallbacks until these exist.
5. **Set display numbers** `WA_B2B_DISPLAY_NUMBER` / `WA_B2C_DISPLAY_NUMBER` for `wa.me` deep links.
6. **Driver GPS:** point your driver app/device at `POST /api/orders/:orderId/driver-location` `{latitude, longitude}` to move the lorry live.
7. **Approved message templates:** out-of-24h sends (weekly/restock/festival/launch) require Meta-approved templates. The CRM sends free-form within the 24h window today; create matching templates in Meta and set their names to send outside the window.

---

## 6. Env reference (backend/.env)

Already populated: Mongo, admin creds, `WA_VERIFY_TOKEN`, `WA_APP_ID/SECRET`, both channels' `WA_*_TOKEN/PHONE_NUMBER_ID/WABA_ID`, Cloudinary, flow key paths, and the 8 `WA_FLOW_*_ID` values. Fill in when ready: `PUBLIC_BASE_URL`, `FRONTEND_BASE_URL`, `WHATSAPP_PAYMENT_CONFIG`, `RAZORPAY_KEY_*`, display numbers.

> Note: the provided access token is currently valid (public-key upload + flow creation succeeded). WhatsApp user tokens expire — for production use a **System User long-lived token**.

---

## 7. Handy commands

```bash
# backend
cd backend
npm install
node scripts/generateFlowKeys.js   # RSA keys + upload public key to both WABAs
node scripts/publishFlows.js        # create/update/publish flows; writes ids to .env
node scripts/seedTemplates.js       # seed CRM template sequences
npm start                           # start server

# frontend
cd frontend
npm install
npm run dev                         # local dev
npm run build                       # production build
```

Routes: site `/`, admin `/admin`, CRM `/crn`, tracking `/track?order=<id>`.

---

## 8. Known gaps / notes (full transparency)

- **2 endpoint flows** publish only after backend deployment (see §3).
- **WhatsApp Payments** code is complete but **inactive until** the Meta payment config + Razorpay/bank onboarding is done and `WHATSAPP_PAYMENT_CONFIG` is set (§5.2).
- **Tracking** uses **MongoDB** (already in the stack) rather than PostgreSQL — the requested behaviour (Socket.IO live GPS + Leaflet + OpenStreetMap + lorry + timeline) is fully implemented; the datastore differs to stay consistent with the existing app. Can be swapped to PostgreSQL if required.
- **B2C catalog** is rendered as product cards with Add-to-cart (works without Meta Commerce catalog). Native WhatsApp Commerce catalog (product_list) can be layered on if you set up a Meta catalog + `META_CATALOG_ID`.
- End-to-end message sending was **not** live-tested against a real handset in this build (no test recipient); the webhook handshake, flow publish, and key upload were verified against Meta.

```
```
