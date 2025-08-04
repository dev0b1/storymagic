import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, Sparkles, Star } from 'lucide-react';

interface StoryLimitsProps {
  storiesGenerated: number;
  isPremium: boolean;
  maxStories: number;
}

export function StoryLimits({ storiesGenerated, isPremium, maxStories }: StoryLimitsProps) {
  const remainingStories = Math.max(0, maxStories - storiesGenerated);
  const progressPercentage = (storiesGenerated / maxStories) * 100;

  if (isPremium) {
    return (
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Premium User
            </Badge>
          </div>
          <CardTitle className="text-yellow-800">Unlimited Stories</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-yellow-700">
            ✨ Generate unlimited magical stories with premium features!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all duration-300 ${
      remainingStories === 0 
        ? 'bg-red-50 border-red-200' 
        : 'bg-purple-50 border-purple-200'
    }`}>
      <CardHeader className="text-center">
        <CardTitle className={
          remainingStories === 0 ? 'text-red-800' : 'text-purple-800'
        }>
          Free Plan Limits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className={`text-sm ${
            remainingStories === 0 ? 'text-red-600' : 'text-purple-600'
          }`}>
            {storiesGenerated} of {maxStories} stories used
          </p>
          <Progress 
            value={progressPercentage} 
            className="mt-2"
            data-testid="progress-stories"
          />
        </div>
        
        {remainingStories === 0 ? (
          <div className="text-center space-y-3">
            <p className="text-red-700 font-medium">
              You've reached your free story limit!
            </p>
            <Button 
              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
              data-testid="button-upgrade-premium"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-purple-700">
              {remainingStories} {remainingStories === 1 ? 'story' : 'stories'} remaining
            </p>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2 flex items-center justify-center">
            <Star className="w-4 h-4 mr-1" />
            Premium Features
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-purple-600">
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Unlimited stories</span>
            </div>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Audio narration</span>
            </div>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Background music</span>
            </div>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Story downloads</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}