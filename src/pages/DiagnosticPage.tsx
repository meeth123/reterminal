import { useState, useEffect } from 'react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  message: string;
  duration?: number;
}

export function DiagnosticPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Browser Detection', status: 'pending', message: '' },
    { name: 'Health Check API', status: 'pending', message: '' },
    { name: 'Events API', status: 'pending', message: '' },
    { name: 'Network Speed', status: 'pending', message: '' },
  ]);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) =>
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runTests = async () => {
    // Test 1: Browser Detection
    updateTest(0, { status: 'running' });
    try {
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        hasFetch: typeof fetch !== 'undefined',
        hasPromise: typeof Promise !== 'undefined',
      };
      updateTest(0, {
        status: 'success',
        message: JSON.stringify(info, null, 2),
      });
    } catch (err) {
      updateTest(0, {
        status: 'failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    // Test 2: Health Check API
    updateTest(1, { status: 'running' });
    const healthStart = Date.now();
    try {
      const response = await fetch('/api/health');
      const duration = Date.now() - healthStart;
      const data = await response.json();

      if (response.ok) {
        updateTest(1, {
          status: 'success',
          message: `Success! Response: ${JSON.stringify(data, null, 2)}`,
          duration,
        });
      } else {
        updateTest(1, {
          status: 'failed',
          message: `HTTP ${response.status}: ${response.statusText}`,
          duration,
        });
      }
    } catch (err) {
      updateTest(1, {
        status: 'failed',
        message: `Network Error: ${err instanceof Error ? err.message : 'Unknown'}`,
        duration: Date.now() - healthStart,
      });
    }

    // Test 3: Events API
    updateTest(2, { status: 'running' });
    const eventsStart = Date.now();
    try {
      const response = await fetch('/api/events?date=2026-01-26');
      const duration = Date.now() - eventsStart;
      const data = await response.json();

      if (response.ok) {
        updateTest(2, {
          status: 'success',
          message: `Success! Found ${data.events?.length || 0} events. Response: ${JSON.stringify(data, null, 2)}`,
          duration,
        });
      } else {
        updateTest(2, {
          status: 'failed',
          message: `HTTP ${response.status}: ${JSON.stringify(data)}`,
          duration,
        });
      }
    } catch (err) {
      updateTest(2, {
        status: 'failed',
        message: `Network Error: ${err instanceof Error ? err.message : 'Unknown'}`,
        duration: Date.now() - eventsStart,
      });
    }

    // Test 4: Network Speed
    updateTest(3, { status: 'running' });
    const speedStart = Date.now();
    try {
      const response = await fetch('/api/health');
      await response.text();
      const duration = Date.now() - speedStart;

      let speed = 'Good';
      if (duration > 2000) speed = 'Very Slow';
      else if (duration > 1000) speed = 'Slow';
      else if (duration > 500) speed = 'Moderate';

      updateTest(3, {
        status: 'success',
        message: `Network Speed: ${speed} (${duration}ms)`,
        duration,
      });
    } catch (err) {
      updateTest(3, {
        status: 'failed',
        message: `Failed to measure: ${err instanceof Error ? err.message : 'Unknown'}`,
      });
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '⚙️';
      case 'success': return '✅';
      case 'failed': return '❌';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 border-gray-300';
      case 'running': return 'bg-blue-50 border-blue-300';
      case 'success': return 'bg-green-50 border-green-300';
      case 'failed': return 'bg-red-50 border-red-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            🔧 reTerminal Diagnostics
          </h1>
          <p className="text-slate-600">
            Testing system capabilities and API connectivity
          </p>
        </header>

        <div className="space-y-4 mb-6">
          {tests.map((test) => (
            <div
              key={test.name}
              className={`border-2 rounded-lg p-4 ${getStatusColor(test.status)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getStatusIcon(test.status)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1">
                    {test.name}
                    {test.duration !== undefined && (
                      <span className="text-sm text-gray-600 ml-2">
                        ({test.duration}ms)
                      </span>
                    )}
                  </h3>
                  {test.message && (
                    <pre className="text-xs bg-white p-2 rounded overflow-auto whitespace-pre-wrap font-mono">
                      {test.message}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={runTests}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            🔄 Run Tests Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700"
          >
            ← Back to Calendar
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">💡 Troubleshooting Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• If health check fails: Check network connectivity</li>
            <li>• If events API fails: Check Vercel environment variables</li>
            <li>• If network is slow: Consider local caching</li>
            <li>• Access this page at: <code className="bg-blue-100 px-1 rounded">https://reterminal.vercel.app/diagnostic</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
