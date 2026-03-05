# 👁 WatchCV

Know when your CV is opened. WatchCV lets you embed invisible tracking into your CV PDF and generate trackable redirect links — then see every open logged in real time with a per-day chart.

Built with **React + TypeScript + Tailwind CSS** on the frontend and **Netlify serverless functions + MongoDB** on the backend.

![WatchCV](https://raw.githubusercontent.com/ChrisGrigg38/WatchCV/refs/heads/master/images/watchcv.png)

---

## How It Works

- **PDF Tracking** — Select your CV PDF and WatchCV injects a JavaScript action into it. Every time the PDF is opened in Adobe Acrobat, a tracking event is silently recorded. The PDF never leaves your browser — all injection happens client-side.
- **Link Tracking** — Paste any URL and generate a trackable redirect link. When someone clicks it, the visit is recorded and they are immediately redirected to the destination.
- **Dashboard** — All your tracked CVs and links are remembered via a browser cookie. Click any entry to see a line chart of opens over time and a log of recent events with IP addresses.
- **Auto Cleanup** — Stale trackings (no activity for a configurable number of days) are automatically purged from the database.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Serverless functions | Node.js on Netlify Functions |
| Database | MongoDB Atlas |
| PDF manipulation | pdf-lib |
| Charts | Recharts |
| Testing | Jest, React Testing Library |
| Hosting | Netlify |

---

## Project Structure

```
watchcv/
├── netlify.toml                  # Netlify build + functions config
├── package.json                  # Root dependencies (functions + scripts)
├── env.example                   # Environment variable template
├── scripts/
│   └── setup-mongodb.js          # One-time DB setup script
├── netlify/
│   └── functions/
│       ├── utils/
│       │   ├── mongodb.js         # Shared MongoDB connection
│       │   └── ipUtils.js         # IP address + range helpers
│       ├── createTracking.js      # POST /api/createTracking
│       ├── addTracking.js         # POST|GET /api/addTracking
│       ├── updateTracking.js      # POST /api/updateTracking
│       ├── getTracking.js         # GET /api/getTracking
│       ├── redirect.js            # GET /api/redirect
│       └── removeStaleTrackings.js
└── webapp/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── types/index.ts
        ├── api/trackingApi.ts
        ├── hooks/
        │   ├── useTrackings.ts
        │   └── usePDFTrackings.ts
        └── components/
            ├── PdfInjector.tsx
            ├── TrackingLink.tsx
            ├── TrackingList.tsx
            ├── TrackingDetail.tsx
            └── ViewsChart.tsx
```

---

## Prerequisites

Before you begin make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) — install globally:

```bash
npm install -g netlify-cli
```

You will also need a free [MongoDB Atlas](https://www.mongodb.com/atlas) account with a cluster ready. Have your connection string handy before proceeding.

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/watchcv.git
cd watchcv
```

### 2. Install all dependencies

This installs both the root (functions) dependencies and the webapp dependencies in one command:

```bash
npm run install:all
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp env.example .env
```

Then open `.env` and set your values:

```env
# Your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority

# The name of the database to create/use
MONGODB_DB_NAME=watchcv

# Minimum time (in minutes) between tracking creations from the same IP range
IP_RANGE_COOLDOWN_MINUTES=60

# Maximum number of new trackings allowed globally per hour
MAX_TRACKINGS_PER_HOUR=100

# Minimum time (in seconds) between addTracking events for the same trackingId
ADD_TRACKING_COOLDOWN_SECONDS=30

# Number of days of inactivity before a tracking is considered stale and deleted
STALE_DATA_DAYS=30
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### 4. Set up the MongoDB database

This creates the required collections and indexes in your MongoDB Atlas cluster:

```bash
npm run setup-db
```

You should see output confirming the collections and indexes were created.

---

## Running Locally

WatchCV requires two processes running simultaneously — the Vite dev server for the frontend and the Netlify CLI for the serverless functions.

### Step 1 — Start the Vite frontend dev server

Open a terminal, navigate into the webapp folder and start Vite:

```bash
cd webapp
npm run dev
```

Vite will start on **http://localhost:5173**. Leave this terminal running.

### Step 2 — Start the Netlify dev server

Open a second terminal in the **root** directory of the project. First build the project, then start Netlify dev:

```bash
netlify build
npm run dev
```

Netlify CLI will start on **http://localhost:8888** and proxy through to the Vite server on port 5173. It also handles your serverless functions and injects your `.env` variables.

> Always open **http://localhost:8888** in your browser, not port 5173 directly. The 8888 port is where the API routes and function proxying are wired up.

---

## Running Tests

Tests live in `webapp/src/` and use Jest with React Testing Library.

```bash
cd webapp
npm test
```

To run in watch mode during development:

```bash
npm run test:watch
```

---

## Deploying to Netlify

### Option A — Netlify CLI

```bash
netlify login
netlify init
netlify deploy --prod
```

### Option B — GitHub integration

1. Push the repository to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) and click **Add new site → Import from Git**
3. Select your repository
4. Set the build settings:
   - **Base directory:** `webapp`
   - **Build command:** `npm run build`
   - **Publish directory:** `webapp/dist`
   - **Functions directory:** `netlify/functions`
5. Go to **Site settings → Environment variables** and add all the keys from `env.example` with your real values
6. Trigger a deploy

---

## API Reference

All functions are available under `/api/` in production and `/.netlify/functions/` locally via the Netlify CLI proxy.

| Endpoint | Method | Description |
|---|---|---|
| `/api/createTracking` | `POST` | Creates a new tracking ID. Returns `{ trackingId }`. Rate limited per IP range and globally per hour. |
| `/api/addTracking` | `POST` or `GET` | Records a tracking event for a given `trackingId`. Accepts POST with JSON body or GET with `?trackingId=` query param (for Adobe Acrobat `app.launchURL` support). |
| `/api/updateTracking` | `POST` | Updates the `lastUpdatedAt` timestamp on a tracking event. Requires `trackingId` and `eventId`. |
| `/api/getTracking` | `GET` | Returns the tracking record and all its events. Requires `?trackingId=` query param. |
| `/api/redirect` | `GET` | Records a tracking event then immediately 302 redirects to the destination. Requires `?trackingId=` and `?url=` query params. |
| `/api/removeStaleTrackings` | `GET` or `POST` | Deletes all trackings and their events where `lastUpdatedAt` is older than `STALE_DATA_DAYS`. Intended to be called on a schedule. |

---

## Scheduled Cleanup

To automatically purge stale trackings, configure `removeStaleTrackings` as a [Netlify Scheduled Function](https://docs.netlify.com/functions/scheduled-functions/). Add the following to the top of `netlify/functions/removeStaleTrackings.js`:

```js
exports.config = {
  schedule: "@daily"
};
```

This will run the cleanup once per day automatically at no extra cost within Netlify's free tier limits.

---

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | — | MongoDB Atlas connection string. Required. |
| `MONGODB_DB_NAME` | `watchcv` | Name of the MongoDB database. |
| `IP_RANGE_COOLDOWN_MINUTES` | `60` | How long (minutes) to block a /24 IP range from creating a new tracking. |
| `MAX_TRACKINGS_PER_HOUR` | `100` | Global cap on new trackings created per hour. |
| `ADD_TRACKING_COOLDOWN_SECONDS` | `30` | Minimum seconds between recorded events for the same tracking ID. |
| `STALE_DATA_DAYS` | `30` | Days of inactivity after which a tracking and its events are deleted. |

---

## License

MIT