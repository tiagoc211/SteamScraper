<div align="center">

<img src="docs/assets/logo-animation.svg" alt="CS:MARKET GLASSES" width="100%"/>

<h1>CS:MARKET&nbsp;GLASSES</h1>

<p><strong>Real-time CS2 skin price tracking, float &amp; pattern analytics, and market intelligence.</strong></p>

<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19"/>
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js + Express 5"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Aiven-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Three.js-WebGL-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js"/>
  <img src="https://img.shields.io/badge/i18n-8_languages-FF6B6B?style=for-the-badge" alt="8 languages"/>
</p>

</div>

---

## Overview

**CS:MARKET GLASSES** is a full-stack web platform for tracking **Counter-Strike 2** skin prices straight from the Steam Community Market. It pulls live listings, extracts **float values** and **paint seeds** directly from Steam, stores historical price data, and surfaces market trends through a polished, animated interface.

The platform is resilient by design: when Steam throttles or blocks its listing endpoints, the backend transparently falls back to its **own PostgreSQL price database**, so the experience never breaks.

> [!NOTE]
> The UI ships in **8 languages** (English, Portuguese, Spanish, French, German, Japanese, Russian, Simplified Chinese) with automatic browser-language detection.

---

## Screenshots

### Home
A WebGL-powered hero with the animated **TrueFocus** logo, floating Katowice 2014 stickers, and a live "last searches" ticker.

![Home page](docs/assets/home.png)

### Browse Skins
Grid of live listings with per-item **float bars**, **paint seed** badges, rarity colouring, and a powerful filter sidebar (price range, wear, pattern seed, StatTrak™, sorting by price / float / pattern).

![Browse skins](docs/assets/browse.png)

### Skin Detail
Every listing for a given skin with its exact float, pattern, applied stickers, and price — sortable and filterable.

![Skin detail](docs/assets/skin-detail.png)

### Analytics
Market trend analysis: top movers, price changes over configurable time windows, and historical charts driven by the price-history engine.

![Analytics](docs/assets/analytics.png)

### Subscriptions
Tiered plans (Free → Básico → Profissional → Trader → Enterprise) with per-tier search quotas, result limits, price alerts, and API access.

![Subscriptions](docs/assets/subscriptions.png)

---

## Features

- 🎯 **Direct float & pattern extraction** — reads float values and paint seeds straight from Steam inspect links (no third-party float service required).
- 📈 **Price history engine** — scheduled jobs build historical price series and compute movers/changes per time window.
- 🛡️ **Resilient fetching** — a smart fetcher detects when Steam blocks the render endpoint and seamlessly falls back to the local price database.
- 🔍 **Advanced filtering** — filter by price, wear, pattern seed, StatTrak™; sort by price, float, or pattern.
- 🔐 **Steam OpenID login** — sign in with your Steam account via Passport.
- 💳 **Subscription tiers** — quota-based plans with rate limiting and search-usage tracking.
- 📊 **Admin dashboard** — manage users, roles, logs, and featured listings.
- 🌍 **Internationalisation** — 8 fully translated locales with browser detection.
- ✨ **Modern UI** — React 19, Three.js / React Three Fiber backgrounds, Framer Motion + GSAP animations.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, React Router 7, Three.js · React Three Fiber · Drei, Framer Motion, GSAP, react-i18next, Axios, SweetAlert2 |
| **Backend** | Node.js, Express 5, Passport (Steam OpenID), express-session, express-rate-limit, Helmet, jose (JWT), node-cache, cheerio |
| **Database** | PostgreSQL (`pg`) — listings, price history, users, roles, subscriptions, logs |
| **Networking** | node-fetch, https/socks proxy agents (residential proxy support), p-limit for concurrency control |

---

## Architecture

```mermaid
flowchart LR
    U[User] -->|HTTPS| FE[React 19 SPA<br/>:3000]
    FE -->|/api/*| BE[Express 5 API<br/>:3001]
    BE -->|fetch + proxy| STEAM[Steam Community Market]
    BE -->|fallback / history| DB[(PostgreSQL)]
    BE -->|OpenID| STEAMID[Steam Login]
    STEAM -. blocked / throttled .-> BE
    BE -. serves cached data .-> DB
```

**Request flow for a skin lookup** (`GET /api/skin/:marketHashName`):

1. The API requests live listings from Steam through the resilient fetcher.
2. If Steam returns JSON, floats & patterns are extracted and returned (`source: "steam"`).
3. If Steam blocks the endpoint (HTML response), the API falls back to PostgreSQL (`source: "database_fallback"`), keeping the UI fully functional.

---

## API Reference

All routes are mounted under `/api`:

| Endpoint | Purpose |
|----------|---------|
| `GET  /api/skin/:marketHashName` | Live listings for a skin (with DB fallback) |
| `GET  /api/inspect` | Extract float / pattern from a Steam inspect link |
| `GET  /api/items` | Item catalogue / lookups |
| `GET  /api/trends` | Market trend & price-change analytics |
| `GET  /api/featured` | Featured listings |
| `GET  /api/logs` | Application logs (admin) |
| `GET/POST /api/users` | User management |
| `GET/POST /api/roles` | Role management |
| `GET/POST /api/subscriptions` | Subscription plans & status |
| `POST /api/tokens/buy` | Token / plan purchase |
| `GET  /auth/steam` | Steam OpenID login |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- A **PostgreSQL** database (local or cloud, e.g. Aiven)
- A **Steam Web API key** ([get one here](https://steamcommunity.com/dev/apikey))

### 1. Clone

```bash
git clone https://github.com/<your-username>/SteamScraper.git
cd SteamScraper
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
DATABASE_URL=postgres://user:password@host:port/dbname
PORT=3001
DOMAIN=http://localhost:3001
CORS_ORIGIN=http://localhost:3000
STEAM_API_KEY=your_steam_api_key
SESSION_SECRET=your_session_secret
ADMIN_STEAMIDS=7656119...
ADMIN_IDS=1
```

Start the API:

```bash
node src/server.js
```

The backend runs at **http://localhost:3001**.

### 3. Frontend

```bash
cd ../frontend
npm install
npm start
```

The app opens at **http://localhost:3000** (it will offer port 3002 if 3000 is busy).

### 4. Database setup

SQL schema files live in [`backend/src/db`](backend/src/db) (`tables.sql`, `price_history.sql`, `newtables.sql`, `featured_listings.sql`). Apply them to your PostgreSQL instance, then optionally seed sample data with the helper scripts in `backend/` (e.g. `seed_price_history.js`, `populate_price_history_from_listings.js`).

---

## Project Structure

```
SteamScraper/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express app entry (port 3001)
│   │   ├── routes/            # API route handlers
│   │   ├── db/                # PostgreSQL access + SQL schema
│   │   ├── auth/              # Steam OpenID strategy
│   │   ├── middleware/        # auth & admin guards
│   │   └── utils/             # float extractor, price history helpers
│   └── *.js                   # DB seed / migration scripts
├── frontend/
│   └── src/
│       ├── pages/             # Home, Browse, Skin detail, Analytics, Subscriptions, Admin
│       ├── components/        # UI, background (WebGL), layout, skin cards
│       ├── locales/           # 8 language translations
│       ├── i18n/              # i18next config
│       └── api/               # Axios API clients
└── docs/assets/               # README media
```

---

## Internationalisation

Translations live in `frontend/src/locales/<lang>/`. Supported locales:

`en` · `pt` · `es` · `fr` · `de` · `ja` · `ru` · `zh-CN`

The active language is auto-detected from the browser and can be switched from the navbar globe icon.

---

## License

This project is provided as-is for educational and portfolio purposes. Counter-Strike 2 and the Steam Community Market are trademarks of Valve Corporation; this project is not affiliated with or endorsed by Valve.

<div align="center">
  <sub>Built with React 19, Express 5 &amp; PostgreSQL.</sub>
</div>
