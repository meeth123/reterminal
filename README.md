# reTerminal Dashboard

A web dashboard for the reTerminal E-Ink display featuring an auto-rotating tab system with Google Calendar integration.

## Features

- **Auto-rotating tabs** - Configurable interval (default: 10 minutes)
- **Google Calendar integration** - View today's events via Service Account
- **E-Ink optimized** - No animations or transitions for clean display rendering
- **Extensible** - Easy to add new widget tabs

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Calendar Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable the Google Calendar API
4. Create a Service Account under "Credentials"
5. Create and download a JSON key for the service account
6. Save the JSON file as `service-account.json` in the project root
7. Share your Google Calendar with the service account email (found in the JSON file)

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```
GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json
GOOGLE_CALENDAR_ID=your-email@gmail.com
PORT=3001
```

### 4. Run Development

Start both frontend and backend:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1 - Frontend (Vite dev server)
npm run dev

# Terminal 2 - Backend (Express API)
npm run dev:server
```

Open http://localhost:5173 in your browser.

### 5. Production Build

```bash
# Build frontend
npm run build

# Start production server (serves both API and static files)
npm start
```

## Adding New Tabs

1. Create a new widget component in `src/components/Widgets/`
2. Add it to `src/config/tabs.tsx`:

```tsx
import { MyWidget } from '../components/Widgets/MyWidget';

export const tabs: TabConfig[] = [
  { id: 'calendar', label: 'Calendar', component: CalendarWidget },
  { id: 'mywidget', label: 'My Widget', component: MyWidget },
];
```

The RotationManager will automatically include the new tab in rotation.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Deploying to Vercel

The app is configured for Vercel deployment with serverless functions:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: Paste the entire contents of your service account JSON file
   - `GOOGLE_CALENDAR_ID`: Your calendar ID (email address)
4. Deploy

The API routes in `api/` directory will be automatically deployed as serverless functions.

## Debugging

If the reTerminal device gets stuck on "Loading Calendar..." or shows errors:

1. **Access Diagnostic Page**: https://reterminal.vercel.app/diagnostic
2. **Open Debug Console**: Double-click bottom-right corner or press `Ctrl+Shift+D`
3. **Check Serial Monitor**: See [DEBUGGING.md](./DEBUGGING.md) for detailed instructions

See [DEBUGGING.md](./DEBUGGING.md) for comprehensive debugging guide.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run dev:server` | Start Express backend |
| `npm run dev:all` | Start both concurrently |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |
