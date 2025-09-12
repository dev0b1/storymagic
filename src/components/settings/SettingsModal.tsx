'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Crown, FileText, BarChart3, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  isPremium: boolean;
  documentsProcessed: number;
}

export function SettingsModal({
  isOpen,
  onClose,
  userEmail,
  isPremium,
  documentsProcessed
}: SettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">StudyFlow User</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{userEmail}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">Account Type</span>
                </div>
                <Badge variant={isPremium ? "default" : "secondary"}>
                  {isPremium ? "Premium" : "Free"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{documentsProcessed}</div>
                  <div className="text-sm text-blue-700">Documents Processed</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {documentsProcessed * 5}
                  </div>
                  <div className="text-sm text-green-700">Flashcards Generated</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Features */}
          {!isPremium && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  Upgrade to Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Unlimited PDF uploads</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Advanced AI processing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Export flashcards</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Priority support</span>
                  </div>
                </div>
                
                <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          )}

          {/* App Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                About StudyFlow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <p>StudyFlow is an AI-powered study assistant that converts your PDF documents into interactive flashcards for efficient learning.</p>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">Today</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
