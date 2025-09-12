import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseUser } from '@/lib/server-auth';
import { DatabaseService } from '@/lib/database-service';

export async function GET(req: NextRequest) {
  try {
    const user = await requireSupabaseUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    let flashcards;
    if (documentId) {
      flashcards = await DatabaseService.getFlashcardsByDocument(documentId, user.id);
    } else {
      flashcards = await DatabaseService.getUserFlashcards(user.id);
    }

    return NextResponse.json(flashcards);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      { message: 'Failed to fetch flashcards' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSupabaseUser(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, front, back, hint, difficulty, category } = body;

    if (!documentId || !front || !back) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const flashcard = await DatabaseService.createFlashcard({
      document_id: documentId,
      user_id: user.id,
      front,
      back,
      hint,
      difficulty: difficulty || 'medium',
      category
    });

    return NextResponse.json({
      message: 'Flashcard created successfully',
      flashcard
    });
  } catch (error) {
    console.error('Error creating flashcard:', error);
    return NextResponse.json(
      { message: 'Failed to create flashcard' },
      { status: 500 }
    );
  }
}
