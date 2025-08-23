import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, User, Volume2, Crown } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  userEmail?: string;
  isPremium?: boolean;
  storiesGenerated?: number;
}

export function SettingsModal({ 
  isOpen, 
  onClose, 
  onUpgrade,
  userEmail = 'demo@gmail.com',
  isPremium = false,
  storiesGenerated = 0
}: SettingsModalProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <User className="w-5 h-5" />
                <span>Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <p className="text-gray-600">{userEmail}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Plan</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">
                    {isPremium ? 'Premium Plan' : 'Free Plan'}
                  </span>
                  {!isPremium && (
                    <Button size="sm" onClick={onUpgrade}>
                      <Crown className="w-3 h-3 mr-1" />
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Stories Created</Label>
                <p className="text-gray-600">
                  {isPremium 
                    ? `${storiesGenerated} created` 
                    : `${storiesGenerated} of 10 (Free)`
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Audio Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <Volume2 className="w-5 h-5" />
                <span>Audio Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="audio-enabled" className="text-sm font-medium text-gray-700">
                  Enable Audio Generation
                </Label>
                <Switch
                  id="audio-enabled"
                  checked={audioEnabled}
                  onCheckedChange={setAudioEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-play" className="text-sm font-medium text-gray-700">
                  Auto-play Audio
                </Label>
                <Switch
                  id="auto-play"
                  checked={autoPlay}
                  onCheckedChange={setAutoPlay}
                />
              </div>
              <p className="text-xs text-gray-500">
                Audio narration uses high-quality TTS for the best listening experience.
              </p>
            </CardContent>
          </Card>

          {/* Premium Features */}
          {!isPremium && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <span>Premium Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="space-y-2">
                    <p>✨ Unlimited audio generation</p>
                    <p>📝 20,000 character input limit</p>
                  </div>
                  <div className="space-y-2">
                    <p>🎵 Premium voice options</p>
                    <p>💾 Enhanced audio quality</p>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-professional hover:opacity-90" 
                  onClick={() => {
                    onUpgrade();
                    onClose();
                  }}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
