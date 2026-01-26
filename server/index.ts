import dotenv from 'dotenv';
dotenv.config();

// Debug: Log env vars right after loading
console.log('[ENV] GOOGLE_CALENDAR_ID:', process.env.GOOGLE_CALENDAR_ID);
console.log('[ENV] GOOGLE_SERVICE_ACCOUNT_PATH:', process.env.GOOGLE_SERVICE_ACCOUNT_PATH);
console.log('[ENV] PORT:', process.env.PORT);

import express from 'express';
import cors from 'cors';
import path from 'path';
import { getEventsForDate } from './calendar';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/events', async (req, res) => {
  try {
    const date = req.query.date as string | undefined;
    const data = await getEventsForDate(date);
    res.json(data);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
