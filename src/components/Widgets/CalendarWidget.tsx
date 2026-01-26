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

  const isToday = selectedDate === getTodayString();

  const fetchEvents = useCallback(async (date: string) => {
    console.log('[CalendarWidget] Fetching events for date:', date);
    try {
      setLoading(true);
      const url = `/api/events?date=${date}`;
      console.log('[CalendarWidget] Fetching from URL:', url);
      
      const response = await fetch(url);
      console.log('[CalendarWidget] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CalendarWidget] Error response:', errorText);
        throw new Error('Failed to fetch events');
      }
      
      const result = await response.json();
      console.log('[CalendarWidget] Received data:', JSON.stringify(result, null, 2));
      console.log('[CalendarWidget] Events count:', result.events?.length || 0);
      
      setData(result);
      setError(null);
    } catch (err) {
      console.error('[CalendarWidget] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
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
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-slate-500">Loading calendar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-red-800">Error</h2>
        <p className="text-red-600">{error}</p>
        <p className="text-sm text-red-500 mt-2">
          Make sure the backend is running and the service account is configured.
        </p>
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
