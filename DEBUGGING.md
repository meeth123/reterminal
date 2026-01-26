# Debugging Guide for reTerminal E1002

This guide helps you debug issues when the reTerminal device gets stuck or doesn't display content properly.

## Quick Diagnostic Tools

### 1. On-Screen Debug Console

**Access the debug console:**
- Double-click the bottom-right corner of the screen
- Or press `Ctrl+Shift+D` if you have a keyboard connected

**What it shows:**
- Device information (User Agent, Platform, etc.)
- Real-time console logs
- JavaScript errors
- Network request details

**Actions available:**
- Clear logs
- Reload page
- Export debug info (for sharing with support)

### 2. Diagnostic Test Page

**Access at:** `https://reterminal.vercel.app/diagnostic`

This page runs automated tests:
- ✅ Browser capability detection
- ✅ Health check API connectivity
- ✅ Calendar events API test
- ✅ Network speed measurement

**Best for:** Identifying which component is failing (browser, network, or API)

## Using Serial Monitor (Advanced)

The reTerminal E1002 runs ESP32-S3 firmware and can output debug logs via serial connection.

### Step 1: Access SenseCraft HMI

1. Open Chrome or Edge browser (Safari/Firefox won't work)
2. Go to https://sensecraft.seeed.cc/hmi
3. Click "Advanced Tools" or "Firmware Flasher"

### Step 2: Connect Serial Monitor

1. Click the "Connect Serial Monitor" button
2. Select the USB port that shows "USB JTAG" or "USB Serial"
3. Click "Connect"

### Step 3: View Logs

The serial monitor will show:
- Device boot messages
- Network connection status
- HTTP requests and responses
- JavaScript console.log output (if supported by firmware)
- Error messages

### What to Look For:

```
Common Issues in Serial Logs:

❌ "Failed to connect to WiFi"
   → Check WiFi credentials in device settings

❌ "DNS lookup failed"
   → Network/router issue, device can't resolve domain names

❌ "HTTP Error 404" or "HTTP Error 500"
   → API endpoint issue, check Vercel deployment

❌ "Out of memory"
   → Page too complex, need to optimize

❌ "JavaScript error" or "Uncaught exception"
   → Browser compatibility issue, check polyfills

✅ "200 OK" responses
   → API working correctly
```

## Common Issues & Solutions

### Issue: Stuck on "Loading Calendar..."

**Possible Causes:**
1. **Network timeout** - Slow or unstable WiFi connection
2. **API not responding** - Vercel deployment or env vars issue
3. **JavaScript error** - Browser compatibility problem
4. **Memory issue** - Device running out of RAM

**Debug Steps:**
1. Access diagnostic page: `/diagnostic`
2. Check which test fails
3. Look at serial monitor for specific errors
4. Use debug console to see JavaScript errors

### Issue: Page Shows Error Message

**What to check:**
1. Read the error message displayed
2. Check user agent shown (identifies browser version)
3. Try reloading the page
4. Check Vercel logs for API errors

### Issue: Blank Page

**Possible Causes:**
1. JavaScript failed to load
2. React app failed to initialize
3. CSS not loading

**Debug Steps:**
1. Open `/diagnostic` to see if anything works
2. Check serial monitor for "script error" messages
3. Verify network connectivity

## Environment Variables (Vercel)

If API tests fail, verify these are set in Vercel:

```
GOOGLE_SERVICE_ACCOUNT_JSON=<entire JSON file contents>
GOOGLE_CALENDAR_ID=your-email@gmail.com
```

**How to check:**
1. Go to Vercel dashboard
2. Project Settings → Environment Variables
3. Verify both variables exist and have correct values
4. Redeploy if you changed anything

## Collecting Debug Information

To share debug info with support:

1. **From Debug Console:**
   - Open debug console (double-click corner)
   - Click "Export Debug Info"
   - Copy the JSON from serial monitor or browser console

2. **From Diagnostic Page:**
   - Access `/diagnostic`
   - Take screenshot of all test results

3. **From Serial Monitor:**
   - Copy all text from serial monitor
   - Look for error messages (lines starting with ❌ or "Error")

4. **From Vercel Logs:**
   - Go to Vercel → Project → Logs
   - Look for requests from your device IP
   - Copy any error responses

## Testing Checklist

Before reporting an issue, test:

- [ ] Can you access `https://reterminal.vercel.app/diagnostic`?
- [ ] Does health check test pass?
- [ ] Does events API test pass?
- [ ] Are there errors in debug console?
- [ ] What does serial monitor show?
- [ ] Is device connected to WiFi?
- [ ] Are Vercel env vars set correctly?

## Additional Resources

- [SenseCraft HMI Documentation](https://sensecraft-hmi-docs.seeed.cc/en/)
- [reTerminal E1002 Wiki](https://wiki.seeedstudio.com/getting_started_with_reterminal_e1002/)
- [Vercel Logs](https://vercel.com/meeth123/reterminal/logs)

## Quick Fixes

**Try these first:**

1. **Hard Refresh:** Hold Shift and click reload
2. **Clear Cache:** In device settings, clear browser cache
3. **Restart Device:** Power cycle the reTerminal
4. **Check WiFi:** Verify internet connection works
5. **Test on Computer:** Does https://reterminal.vercel.app work on your laptop?
