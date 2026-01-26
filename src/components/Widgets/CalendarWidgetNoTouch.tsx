import { useState, useEffect, useCallback } from 'react';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  allDay: boolean;
}

interface CalendarData {
  events: CalendarEvent[];
  date: string;
}

function formatTime(isoString: string, allDay: boolean): string {
  if (allDay) return 'All Day';

  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function getTodayString(): string {
  // Use India timezone (IST) to determine today's date
  const today = new Date();
  return today.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// Simplified no-touch version for reTerminal E1002 (no touch screen)
export function CalendarWidgetNoTouch() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [debugStatus, setDebugStatus] = useState<string>('Initializing...');
  const [fetchAttempt, setFetchAttempt] = useState<number>(0);
  const [heartbeat, setHeartbeat] = useState<number>(0);

  // Heartbeat to prove JavaScript is running
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartbeat(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = useCallback(async () => {
    const attempt = fetchAttempt + 1;
    setFetchAttempt(attempt);
    setDebugStatus(`[${attempt}] Starting fetch...`);
    console.log(`[CalendarWidgetNoTouch] Attempt ${attempt}: Fetching events...`);

    try {
      setDebugStatus(`[${attempt}] Getting date...`);
      const date = getTodayString();
      const url = `/api/events?date=${date}`;
      setDebugStatus(`[${attempt}] URL: ${url}`);
      console.log('[CalendarWidgetNoTouch] Fetching from:', url);

      setDebugStatus(`[${attempt}] Creating fetch request...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[CalendarWidgetNoTouch] Timeout triggered!');
        setDebugStatus(`[${attempt}] Timeout after 10s`);
        controller.abort();
      }, 10000);

      setDebugStatus(`[${attempt}] Sending fetch...`);
      const fetchStart = Date.now();
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const fetchDuration = Date.now() - fetchStart;
      setDebugStatus(`[${attempt}] Response received (${fetchDuration}ms)`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setDebugStatus(`[${attempt}] Parsing JSON...`);
      const result = await response.json();
      console.log('[CalendarWidgetNoTouch] Success! Events:', result.events?.length || 0);

      setDebugStatus(`[${attempt}] Success! ${result.events?.length || 0} events`);
      setData(result);
      setError(null);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('[CalendarWidgetNoTouch] Error:', err);

      const errorMsg = err instanceof Error ? err.message : 'Network error';
      const errorDetail = err instanceof Error ? err.name : 'Unknown';
      setDebugStatus(`[${attempt}] ERROR: ${errorDetail} - ${errorMsg}`);
      setError(errorMsg);

      // Auto-retry after 30 seconds if error
      setTimeout(() => {
        console.log('[CalendarWidgetNoTouch] Auto-retrying after error...');
        setDebugStatus(`[${attempt}] Will retry in 30s...`);
        fetchEvents();
      }, 30000);
    }
  }, [fetchAttempt]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto-refresh every 2 minutes (configurable)
  // Faster refresh for E-Ink display to ensure up-to-date info
  useEffect(() => {
    const REFRESH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

    const interval = setInterval(() => {
      console.log('[CalendarWidgetNoTouch] Auto-refresh triggered');
      fetchEvents();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Show loading state with debug info
  if (!data && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Calendar</h2>
          <p className="text-slate-600">Connecting to API...</p>

          {/* Debug status */}
          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
            <p className="text-sm font-mono text-blue-900">{debugStatus}</p>
            <p className="text-xs text-blue-700 mt-2">Attempt #{fetchAttempt}</p>
            <p className="text-xs text-blue-600 mt-2">Heartbeat: {heartbeat}s (JS running ✓)</p>
          </div>

          <p className="text-sm text-slate-400 mt-4">No touch required - fully automatic</p>
          <p className="text-xs text-slate-400 mt-2">Time: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    );
  }

  // Show error with auto-retry message and debug info
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Connection Error</h2>
          <p className="text-lg text-red-600 mb-4">{error}</p>

          {/* Debug status */}
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <p className="text-sm font-mono text-red-900">{debugStatus}</p>
            <p className="text-xs text-red-700 mt-2">Attempt #{fetchAttempt}</p>
          </div>

          <p className="text-slate-600 mt-4">Auto-retrying in 30 seconds...</p>
          <p className="text-sm text-slate-400 mt-6">
            Device: {navigator.userAgent.substring(0, 80)}
          </p>
        </div>
      </div>
    );
  }

  // Show calendar data
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 pb-4 border-b-2 border-slate-300">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            {data ? formatDateHeader(data.date) : 'Today'}
          </h1>
          <p className="text-lg text-slate-600">Your Schedule</p>
        </header>

        {/* Events List */}
        {!data || data.events.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-4">✓</div>
            <p className="text-2xl text-slate-500 font-semibold">No events scheduled</p>
            <p className="text-slate-400 mt-2">Enjoy your free time!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.events.map((event) => (
              <div
                key={event.id}
                className="bg-white border-2 border-slate-200 rounded-lg p-6"
              >
                <div className="flex items-start gap-6">
                  {/* Time */}
                  <div className="w-32 flex-shrink-0">
                    <div className="text-2xl font-bold text-slate-700">
                      {formatTime(event.start, event.allDay)}
                    </div>
                    {!event.allDay && (
                      <div className="text-sm text-slate-500 mt-1">
                        to {formatTime(event.end, false)}
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                      {event.summary}
                    </h3>
                    {event.location && (
                      <p className="text-lg text-slate-600">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-400">
            {data?.events.length || 0} event{data?.events.length !== 1 ? 's' : ''}
            {lastUpdate && ` • Updated ${lastUpdate}`}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Auto-refreshes every 2 minutes
          </p>
        </footer>

        {/* Error banner if there's a transient error */}
        {error && data && (
          <div className="fixed bottom-4 left-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 text-center">
            <p className="text-yellow-800 font-semibold">
              ⚠️ {error} - Will retry shortly
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
