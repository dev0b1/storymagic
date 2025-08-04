import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MagicSparkles } from '@/components/ui/magic-sparkles';
import { Settings, User, Volume2, Palette, ArrowLeft, Crown } from 'lucide-react';
import { Link } from 'wouter';

export default function SettingsPage() {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-pink-100 to-white relative">
      <MagicSparkles />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="bg-white/80">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Stories
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-purple-600" />
              <h1 className="font-magical text-3xl text-purple-800">Settings</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-800">
                <User className="w-5 h-5" />
                <span>Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <p className="text-gray-600">demo@gmail.com</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Plan</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Free Plan</span>
                  <Button size="sm" className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Upgrade
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Stories Created</Label>
                <p className="text-gray-600">1 of 2 (Free)</p>
              </div>
            </CardContent>
          </Card>

          {/* Audio Settings */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-800">
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
                  Auto-play Stories
                </Label>
                <Switch
                  id="auto-play"
                  checked={autoPlay}
                  onCheckedChange={setAutoPlay}
                />
              </div>
              <p className="text-xs text-gray-500">
                Audio narration uses character-specific voices for an immersive experience.
              </p>
            </CardContent>
          </Card>

          {/* Visual Settings */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-800">
                <Palette className="w-5 h-5" />
                <span>Visual Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="animations" className="text-sm font-medium text-gray-700">
                  Magical Animations
                </Label>
                <Switch
                  id="animations"
                  checked={animationsEnabled}
                  onCheckedChange={setAnimationsEnabled}
                />
              </div>
              <p className="text-xs text-gray-500">
                Enable sparkles, floating elements, and background animations during storytelling.
              </p>
            </CardContent>
          </Card>

          {/* Premium Features */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800">
                <Crown className="w-5 h-5" />
                <span>Premium Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-orange-700">
                <p>✨ Unlimited story generation</p>
                <p>📝 20,000 character input limit</p>
                <p>🎵 High-quality audio narration</p>
                <p>🎨 Exclusive magical backgrounds</p>
                <p>💾 Story export & sharing</p>
              </div>
              <Button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}