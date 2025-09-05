import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-service';
import { requireSupabaseUser } from '@/lib/server-auth';

export async function GET(req: Request) {
  const user = await requireSupabaseUser(req);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const rows = await DatabaseService.getUserStories(user.id, 10);
  return NextResponse.json(rows);
}


