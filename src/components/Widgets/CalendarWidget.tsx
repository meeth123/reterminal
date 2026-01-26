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

function addDays(dateStr: string, days: number): string {
  // Parse the date string (YYYY-MM-DD) and add days
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  date.setDate(date.getDate() + days);

  // Format back to YYYY-MM-DD
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  const newDay = String(date.getDate()).padStart(2, '0');
  return `${newYear}-${newMonth}-${newDay}`;
}

export function CalendarWidget() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [data, setData] = useState<CalendarData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<string>('Initializing...');

  const isToday = selectedDate === getTodayString();

  const fetchEvents = useCallback(async (date: string) => {
    console.log('[CalendarWidget] Fetching events for date:', date);
    console.log('[CalendarWidget] Current time:', new Date().toISOString());
    console.log('[CalendarWidget] User Agent:', navigator.userAgent);

    try {
      setLoading(true);
      setError(null);
      setLoadingProgress('Starting...');

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('[CalendarWidget] Request timeout after 15 seconds');
        setLoading(false);
        setError('Request timeout - API took too long to respond. Click Retry or Skip Loading.');
      }, 15000);

      const url = `/api/events?date=${date}`;
      console.log('[CalendarWidget] Fetching from URL:', url);
      console.log('[CalendarWidget] Full URL:', window.location.origin + url);

      // Test health check first
      setLoadingProgress('Testing API connection...');
      console.log('[CalendarWidget] Testing health endpoint...');
      const healthResponse = await fetch('/api/health');
      console.log('[CalendarWidget] Health check status:', healthResponse.status);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('[CalendarWidget] Health check data:', healthData);
      }

      setLoadingProgress('Fetching calendar events...');
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });
      console.log('[CalendarWidget] Response status:', response.status);
      console.log('[CalendarWidget] Response headers:', Object.fromEntries(response.headers.entries()));

      // Clear timeout on successful response
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CalendarWidget] Error response:', errorText);
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
      }

      setLoadingProgress('Processing response...');
      const result = await response.json();
      console.log('[CalendarWidget] Received data:', JSON.stringify(result, null, 2));
      console.log('[CalendarWidget] Events count:', result.events?.length || 0);

      setLoadingProgress('Complete!');
      setData(result);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('[CalendarWidget] Fetch error:', err);
      console.error('[CalendarWidget] Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(selectedDate);
  }, [selectedDate, fetchEvents]);

  const goToPrevDay = () => {
    console.log('[CalendarWidget] goToPrevDay clicked, current:', selectedDate);
    const newDate = addDays(selectedDate, -1);
    console.log('[CalendarWidget] Going to previous day:', newDate);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    console.log('[CalendarWidget] goToNextDay clicked, current:', selectedDate);
    const newDate = addDays(selectedDate, 1);
    console.log('[CalendarWidget] Going to next day:', newDate);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    console.log('[CalendarWidget] goToToday clicked');
    setSelectedDate(getTodayString());
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-center">
          <p className="text-lg text-slate-700 font-semibold mb-2">Loading calendar...</p>
          <p className="text-sm text-slate-500">{loadingProgress}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log('[CalendarWidget] Skip loading clicked');
              setLoading(false);
              setError('Loading skipped by user');
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Skip Loading
          </button>
          <button
            onClick={() => {
              console.log('[CalendarWidget] Retry clicked');
              fetchEvents(selectedDate);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
          <button
            onClick={() => {
              console.log('[CalendarWidget] Open diagnostic clicked');
              window.location.href = '/diagnostic';
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Diagnostic
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          If stuck for more than 10 seconds, click "Skip Loading"
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-red-800">Error Loading Calendar</h2>
        <p className="text-red-600 mt-2">{error}</p>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-red-500">
            Make sure the backend is running and the service account is configured.
          </p>
          <p className="text-xs text-slate-600">
            User Agent: {navigator.userAgent.substring(0, 60)}...
          </p>
          <p className="text-xs text-slate-600">
            Time: {new Date().toLocaleString()}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Date Header with Navigation */}
      <header className="border-b border-slate-200 pb-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goToPrevDay}
            className="px-4 py-3 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-lg font-bold text-slate-700 text-xl cursor-pointer select-none"
            aria-label="Previous day"
          >
            ◀
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-slate-800">
              {formatDateHeader(data.date)}
            </h1>
            <p className="text-sm text-slate-500">
              {isToday ? "Today's Schedule" : 'Schedule'}
            </p>
          </div>

          <button
            type="button"
            onClick={goToNextDay}
            className="px-4 py-3 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 rounded-lg font-bold text-slate-700 text-xl cursor-pointer select-none"
            aria-label="Next day"
          >
            ▶
          </button>
        </div>

        {/* Today button - only show when not viewing today */}
        {!isToday && (
          <div className="mt-3 text-center">
            <button
              onClick={goToToday}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Today
            </button>
          </div>
        )}
      </header>

      {/* Events List */}
      {data.events.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-lg text-slate-500">No events scheduled</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200">
          {data.events.map((event) => (
            <li key={event.id} className="py-3">
              <div className="flex gap-4">
                {/* Time Column */}
                <div className="w-24 flex-shrink-0">
                  <span className="text-sm font-medium text-slate-600">
                    {formatTime(event.start, event.allDay)}
                  </span>
                  {!event.allDay && (
                    <>
                      <span className="text-slate-400 mx-1">–</span>
                      <span className="text-sm text-slate-500">
                        {formatTime(event.end, false)}
                      </span>
                    </>
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">
                    {event.summary}
                  </h3>
                  {event.location && (
                    <p className="text-sm text-slate-500 truncate">
                      📍 {event.location}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Event Count */}
      <footer className="text-sm text-slate-400 pt-2">
        {data.events.length} event{data.events.length !== 1 ? 's' : ''}
      </footer>
    </div>
  );
}
