import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const timestamp = new Date().toISOString();
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  console.log('=== Health Check ===');
  console.log(`[${timestamp}] Client IP: ${clientIp}`);
  console.log(`[${timestamp}] User Agent: ${userAgent}`);
  console.log('====================');

  res.status(200).json({
    status: 'ok',
    timestamp,
    serverTime: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    environment: process.env.NODE_ENV || 'development',
    clientIp,
  });
}
