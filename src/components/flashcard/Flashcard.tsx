'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashcardProps {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  onAnswer?: (correct: boolean) => void;
  showAnswer?: boolean;
  className?: string;
}

export function Flashcard({
  id,
  front,
  back,
  hint,
  difficulty = 'medium',
  category,
  onAnswer,
  showAnswer = false,
  className
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answered, setAnswered] = useState<'correct' | 'incorrect' | null>(null);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setShowHint(false);
    }
  };

  const handleAnswer = (correct: boolean) => {
    setAnswered(correct ? 'correct' : 'incorrect');
    onAnswer?.(correct);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div className="relative">
        {/* Category and Difficulty Badges */}
        <div className="flex justify-between items-center mb-4">
          {category && (
            <Badge variant="outline" className="text-sm">
              {category}
            </Badge>
          )}
          <Badge className={cn("text-sm", getDifficultyColor(difficulty))}>
            {difficulty}
          </Badge>
        </div>

        {/* Flashcard */}
        <Card 
          className={cn(
            "relative h-64 cursor-pointer transition-all duration-500 transform-gpu",
            "hover:shadow-lg",
            isFlipped && "rotate-y-180",
            answered === 'correct' && "ring-2 ring-green-500",
            answered === 'incorrect' && "ring-2 ring-red-500"
          )}
          onClick={handleFlip}
        >
          <CardContent className="h-full flex items-center justify-center p-6">
            <div className="text-center">
              {!isFlipped ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Question</h3>
                  <p className="text-xl font-medium text-gray-900 leading-relaxed">
                    {front}
                  </p>
                  {hint && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(!showHint);
                      }}
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {showHint ? 'Hide Hint' : 'Show Hint'}
                    </Button>
                  )}
                  {showHint && hint && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">{hint}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Answer</h3>
                  <p className="text-xl font-medium text-gray-900 leading-relaxed">
                    {back}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Answer Buttons */}
        {isFlipped && !answered && (
          <div className="flex justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                handleAnswer(false);
              }}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Incorrect
            </Button>
            <Button
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                handleAnswer(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Correct
            </Button>
          </div>
        )}

        {/* Flip Button */}
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleFlip();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {isFlipped ? 'Show Question' : 'Show Answer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
