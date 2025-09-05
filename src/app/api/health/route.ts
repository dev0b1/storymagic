import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-service';

export async function GET() {
  const health = {
    status: 'ok' as 'ok' | 'degraded' | 'error',
    timestamp: new Date().toISOString(),
    database: {
      configured: true,
      connected: false,
      error: null as string | null,
    },
  };

  try {
    const ok = await DatabaseService.validateDatabase();
    health.database.connected = ok;
    if (!ok) {
      health.status = 'degraded';
      health.database.error = 'Tables missing or inaccessible';
    }
  } catch (e: any) {
    health.status = 'error';
    health.database.connected = false;
    health.database.error = e?.message || 'Unknown error';
  }

  const code = health.status === 'ok' ? 200 : health.status === 'degraded' ? 503 : 500;
  return NextResponse.json(health, { status: code });
}


