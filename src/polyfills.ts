// Polyfills for older browsers (ESP32-S3 based devices may have older WebKit)

// Fetch API polyfill check
if (typeof window !== 'undefined' && !window.fetch) {
  console.error('Fetch API not supported - this browser is too old');
  // Add a global flag for fallback handling
  (window as any).__FETCH_NOT_SUPPORTED__ = true;
}

// Promise polyfill check
if (typeof Promise === 'undefined') {
  console.error('Promise not supported - this browser is too old');
  (window as any).__PROMISE_NOT_SUPPORTED__ = true;
}

// Object.fromEntries polyfill (ES2019)
if (!Object.fromEntries) {
  Object.fromEntries = function<T = any>(entries: Iterable<readonly [PropertyKey, T]>): { [k: string]: T } {
    const obj: any = {};
    for (const [key, value] of entries) {
      obj[key] = value;
    }
    return obj;
  };
}

// String.prototype.padStart polyfill (ES2017)
if (!String.prototype.padStart) {
  String.prototype.padStart = function(targetLength: number, padString: string = ' ') {
    if (this.length >= targetLength) {
      return String(this);
    }
    targetLength = targetLength - this.length;
    if (targetLength > padString.length) {
      padString += padString.repeat(targetLength / padString.length);
    }
    return padString.slice(0, targetLength) + String(this);
  };
}

// Array.prototype.includes polyfill (ES2016)
if (!Array.prototype.includes) {
  Array.prototype.includes = function<T>(searchElement: T, fromIndex?: number): boolean {
    const O = Object(this);
    const len = parseInt(O.length, 10) || 0;
    if (len === 0) return false;

    const n = parseInt(fromIndex as any, 10) || 0;
    let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

    while (k < len) {
      if (O[k] === searchElement) return true;
      k++;
    }
    return false;
  };
}

// Add more detailed browser capability detection
export function detectBrowserCapabilities() {
  const capabilities = {
    fetch: typeof fetch !== 'undefined',
    promise: typeof Promise !== 'undefined',
    asyncAwait: true, // Will be tested below
    localStorage: false,
    sessionStorage: false,
    serviceWorker: 'serviceWorker' in navigator,
    webWorker: typeof Worker !== 'undefined',
    es6: false,
  };

  // Test async/await support
  try {
    eval('(async () => {})');
  } catch (e) {
    capabilities.asyncAwait = false;
  }

  // Test localStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    capabilities.localStorage = true;
  } catch (e) {
    capabilities.localStorage = false;
  }

  // Test sessionStorage
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
    capabilities.sessionStorage = true;
  } catch (e) {
    capabilities.sessionStorage = false;
  }

  // Test ES6 features
  try {
    eval('const test = () => {};');
    capabilities.es6 = true;
  } catch (e) {
    capabilities.es6 = false;
  }

  console.log('[Polyfills] Browser capabilities:', capabilities);
  return capabilities;
}

// Initialize capability detection
detectBrowserCapabilities();
