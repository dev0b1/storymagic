import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-service';
import { requireSupabaseUser } from '@/lib/server-auth';

export async function GET(req: Request) {
  try {
    const user = await requireSupabaseUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let dbUser = await DatabaseService.getUser(user.id);
    
    // If user doesn't exist, create them
    if (!dbUser) {
      const email = user.email || `${user.id}@demo.com`;
      dbUser = await DatabaseService.createUser({
        id: user.id,
        email: email,
        name: email.split('@')[0],
        is_premium: false,
        stories_generated: 0
      });
    }
    
    return NextResponse.json(dbUser);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ message: 'Failed to get user info' }, { status: 500 });
  }
}
