# reTerminal Dashboard

A web dashboard for the reTerminal E-Ink display featuring an auto-rotating tab system with Google Calendar integration.

## Features

- **Auto-rotating tabs** - Configurable interval (default: 10 minutes)
- **Google Calendar integration** - View today's events via OAuth 2.0
- **Full attendee access** - See who's invited to meetings (OAuth bypasses org restrictions)
- **E-Ink optimized** - No animations or transitions for clean display rendering
- **Extensible** - Easy to add new widget tabs

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google Calendar OAuth 2.0

#### Production Setup (Vercel)

1. **Add Upstash Redis Integration**
   - Go to Vercel dashboard → Your Project → Integrations
   - Search for "Upstash Redis" and add integration
   - Create new database: `reterminal-oauth-tokens`
   - This automatically adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables

2. **Create OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project: "reTerminal Calendar"
   - Enable the Google Calendar API
   - Configure OAuth consent screen:
     - User Type: **Internal** (if using Google Workspace) or **External**
     - Add scope: `https://www.googleapis.com/auth/calendar.events`
     - Add your email as test user
   - Create OAuth 2.0 Client ID:
     - Type: **Web application**
     - Authorized redirect URI: `http://localhost:3000/oauth/callback`

3. **Add Environment Variables to Vercel**
   - `GOOGLE_OAUTH_CLIENT_ID` - From OAuth credentials
   - `GOOGLE_OAUTH_CLIENT_SECRET` - From OAuth credentials
   - `GOOGLE_CALENDAR_ID` - Your email (e.g., meeth@quizizz.com)

4. **Run OAuth Setup Locally**
   ```bash
   npm run oauth:setup
   ```
   - This opens your browser for authorization
   - Tokens are stored in Upstash Redis
   - Only needs to run once (tokens auto-refresh)

5. **Verify OAuth Setup**
   ```bash
   npm run oauth:verify
   ```

#### Local Development (Optional - Service Account)

For local development, you can optionally use a Service Account:
1. Create Service Account in Google Cloud Console
2. Download JSON key as `service-account.json`
3. Share your calendar with the service account email
4. Set `GOOGLE_SERVICE_ACCOUNT_PATH=./service-account.json` in `.env`

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```
GOOGLE_CALENDAR_ID=your-email@gmail.com
GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=xxx
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
PORT=3002
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

1. **Setup Upstash Redis** (see step 2 in Setup)
2. **Add OAuth Credentials** to Vercel environment variables:
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`
   - `GOOGLE_CALENDAR_ID`
3. **Push code to GitHub** and import in Vercel
4. **Run OAuth setup locally**: `npm run oauth:setup`
   - Authorizes your Google account
   - Stores tokens in Upstash Redis
   - Tokens auto-refresh, no need to re-authorize
5. **Deploy**

The API routes in `api/` directory will be automatically deployed as serverless functions.

Check OAuth status at: `https://your-app.vercel.app/api/oauth-status`

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
| `npm run oauth:setup` | Run OAuth authorization (one-time) |
| `npm run oauth:verify` | Verify OAuth tokens are working |
