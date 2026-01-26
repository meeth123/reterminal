import { useState, useEffect } from 'react';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export function DebugOverlay() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState({
    userAgent: '',
    platform: '',
    language: '',
    online: true,
    cookiesEnabled: false,
  });

  useEffect(() => {
    // Capture device information
    setDeviceInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      online: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled,
    });

    // Override console methods to capture logs
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };

    const addLog = (level: 'info' | 'warn' | 'error', args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      setLogs(prev => [...prev.slice(-19), {
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
      }]);
    };

    console.log = (...args) => {
      originalConsole.log(...args);
      addLog('info', args);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      addLog('warn', args);
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      addLog('error', args);
    };

    // Global error handler
    const errorHandler = (event: ErrorEvent) => {
      addLog('error', ['Uncaught Error:', event.message, 'at', event.filename, 'line', event.lineno]);
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      addLog('error', ['Unhandled Promise Rejection:', event.reason]);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
      >
        Show Debug Console
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-auto p-4 text-white font-mono text-xs">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
          <h2 className="text-lg font-bold">🔍 Debug Console</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>

        {/* Device Info */}
        <div className="mb-4 p-3 bg-gray-800 rounded">
          <h3 className="font-bold mb-2">📱 Device Information</h3>
          <div className="space-y-1 text-xs">
            <div><strong>User Agent:</strong> {deviceInfo.userAgent}</div>
            <div><strong>Platform:</strong> {deviceInfo.platform}</div>
            <div><strong>Language:</strong> {deviceInfo.language}</div>
            <div><strong>Online:</strong> {deviceInfo.online ? '✅ Yes' : '❌ No'}</div>
            <div><strong>Cookies:</strong> {deviceInfo.cookiesEnabled ? '✅ Enabled' : '❌ Disabled'}</div>
            <div><strong>Current Time:</strong> {new Date().toLocaleString()}</div>
            <div><strong>Timezone Offset:</strong> {new Date().getTimezoneOffset()} minutes</div>
          </div>
        </div>

        {/* Logs */}
        <div className="p-3 bg-gray-900 rounded">
          <h3 className="font-bold mb-2">📋 Console Logs (Last 20)</h3>
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded ${
                    log.level === 'error' ? 'bg-red-900 text-red-200' :
                    log.level === 'warn' ? 'bg-yellow-900 text-yellow-200' :
                    'bg-gray-800 text-gray-200'
                  }`}
                >
                  <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setLogs([])}
            className="bg-gray-700 px-3 py-2 rounded hover:bg-gray-600"
          >
            Clear Logs
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 px-3 py-2 rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
          <button
            onClick={() => {
              const debugInfo = {
                deviceInfo,
                logs,
                timestamp: new Date().toISOString(),
              };
              console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
              alert('Debug info logged to console. Copy from serial monitor.');
            }}
            className="bg-green-600 px-3 py-2 rounded hover:bg-green-700"
          >
            Export Debug Info
          </button>
        </div>
      </div>
    </div>
  );
}
