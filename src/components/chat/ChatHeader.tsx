import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Crown, 
  LogOut, 
  Star, 
  BarChart3,
  History,
  Settings
} from 'lucide-react';

interface ChatHeaderProps {
  onSignOut: () => void;
  onUpgrade: () => void;
  onShowRecent: () => void;
  onShowSettings: () => void;
  isPremium: boolean;
  remainingCredits?: number;
  totalGenerated?: number;
}

export function ChatHeader({ 
  onSignOut, 
  onUpgrade, 
  onShowRecent,
  onShowSettings,
  isPremium, 
  remainingCredits = 0, 
  totalGenerated = 0 
}: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-professional rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="font-promptbook text-lg sm:text-2xl font-bold text-gray-900">
                AudioCraft
              </h1>
              {isPremium && (
                <Badge className="bg-gradient-professional text-white px-2 py-0.5 text-xs hidden sm:inline-flex">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Credits Display */}
            <div className="hidden sm:flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {isPremium 
                  ? `${totalGenerated} created`
                  : `Credits Left: ${remainingCredits}`
                }
              </span>
            </div>

            {/* Recent Audio Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onShowRecent}
              className="text-xs"
            >
              <History className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Recent Audio</span>
            </Button>

            {/* Settings Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onShowSettings}
              className="text-xs"
            >
              <Settings className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Button>

            {/* Upgrade Button */}
            {!isPremium && (
              <Button
                size="sm"
                className="bg-gradient-professional text-white hover:opacity-90 text-xs px-3 py-1.5"
                onClick={onUpgrade}
              >
                <Star className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Upgrade</span>
              </Button>
            )}

            {/* Sign Out */}
            <Button 
              onClick={onSignOut}
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
        
        {/* Mobile Credits Display */}
        <div className="mt-3 sm:hidden">
          <div className="flex items-center justify-center bg-gray-100 rounded-lg px-4 py-2">
            <BarChart3 className="h-4 w-4 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              {isPremium 
                ? `${totalGenerated} created`
                : `Credits Left: ${remainingCredits}`
              }
            </span>
            {isPremium && (
              <Badge className="bg-gradient-professional text-white px-2 py-1 text-xs ml-2">
                <Crown className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
