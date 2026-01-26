import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=800, height=480">
  <title>Test - Simple Static Page</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: #f0f0f0;
    }
    h1 { color: #333; }
    .info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>✅ Static Calendar Test Page</h1>
  <div class="info">
    <p><strong>This page loaded successfully!</strong></p>
    <p>Current time: ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</p>
    <p>If you're seeing this, the serverless function works correctly.</p>
    <p>There is NO JavaScript on this page.</p>
    <p>There is NO auto-refresh.</p>
    <p>There are NO network requests after initial load.</p>
  </div>
  <div class="info">
    <p><strong>If the page keeps refreshing:</strong></p>
    <ul>
      <li>Check if you have browser extensions interfering</li>
      <li>Disable "Auto-refresh" in DevTools</li>
      <li>Clear browser cache</li>
      <li>Try in incognito/private mode</li>
    </ul>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(200).send(html);
}
