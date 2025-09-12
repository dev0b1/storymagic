'use client';

import { useState, useEffect } from 'react';
import { Flashcard } from './Flashcard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shuffle, RotateCcw, BarChart3, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashcardData {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

interface FlashcardDeckProps {
  flashcards: FlashcardData[];
  onSessionComplete?: (stats: SessionStats) => void;
  className?: string;
}

interface SessionStats {
  totalCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  timeSpent: number;
}

export function FlashcardDeck({ flashcards, onSessionComplete, className }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalCards: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    accuracy: 0,
    timeSpent: 0
  });
  const [sessionStartTime] = useState(Date.now());
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  useEffect(() => {
    setSessionStats(prev => ({
      ...prev,
      totalCards: flashcards.length
    }));
  }, [flashcards.length]);

  const handleAnswer = (correct: boolean) => {
    setSessionStats(prev => ({
      ...prev,
      correctAnswers: correct ? prev.correctAnswers + 1 : prev.correctAnswers,
      incorrectAnswers: !correct ? prev.incorrectAnswers + 1 : prev.incorrectAnswers,
      accuracy: ((correct ? prev.correctAnswers + 1 : prev.correctAnswers) / (prev.correctAnswers + prev.incorrectAnswers + 1)) * 100
    }));
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Session complete
      const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
      const finalStats = {
        ...sessionStats,
        timeSpent
      };
      setSessionStats(finalStats);
      setIsSessionComplete(true);
      onSessionComplete?.(finalStats);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShuffle = () => {
    setIsShuffled(!isShuffled);
    // In a real implementation, you would shuffle the flashcards array
    // For now, we'll just reset to the beginning
    setCurrentIndex(0);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSessionStats({
      totalCards: flashcards.length,
      correctAnswers: 0,
      incorrectAnswers: 0,
      accuracy: 0,
      timeSpent: 0
    });
    setIsSessionComplete(false);
  };

  if (flashcards.length === 0) {
    return (
      <Card className={cn("w-full max-w-2xl mx-auto", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Flashcards Available</h3>
          <p className="text-gray-500 text-center">
            Upload a PDF to generate flashcards and start studying.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isSessionComplete) {
    return (
      <Card className={cn("w-full max-w-2xl mx-auto", className)}>
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Study Session Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{sessionStats.correctAnswers}</div>
              <div className="text-sm text-green-700">Correct</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{sessionStats.incorrectAnswers}</div>
              <div className="text-sm text-red-700">Incorrect</div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{sessionStats.accuracy.toFixed(1)}%</div>
            <div className="text-sm text-blue-700">Accuracy</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {Math.floor(sessionStats.timeSpent / 60)}:{(sessionStats.timeSpent % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-700">Time Spent</div>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={handleRestart} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Study Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
      {/* Progress and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">
                Card {currentIndex + 1} of {flashcards.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShuffle}
                className={cn(
                  "transition-colors",
                  isShuffled && "bg-blue-100 text-blue-700"
                )}
              >
                <Shuffle className="w-4 h-4 mr-2" />
                {isShuffled ? 'Shuffled' : 'Shuffle'}
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {sessionStats.correctAnswers} correct, {sessionStats.incorrectAnswers} incorrect
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Flashcard */}
      <Flashcard
        key={`${currentCard.id}-${currentIndex}`}
        {...currentCard}
        onAnswer={handleAnswer}
      />

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {flashcards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                index === currentIndex ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
