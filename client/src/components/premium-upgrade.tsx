import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Sparkles, 
  Crown, 
  CheckCircle, 
  Zap, 
  Volume2, 
  FileText, 
  Star,
  Loader2,
  CreditCard
} from 'lucide-react';
import { lemonSqueezyService } from '@/lib/lemonsqueezy';
import { useToast } from '@/hooks/use-toast';

interface PremiumUpgradeProps {
  user?: {
    id: string;
    email: string;
    name?: string;
    is_premium: boolean;
  };
  trigger?: React.ReactNode;
  className?: string;
}

export function PremiumUpgrade({ user, trigger, className }: PremiumUpgradeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Please sign in first",
        description: "You need to be signed in to upgrade to premium.",
        variant: "destructive",
      });
      return;
    }

    if (user.is_premium) {
      toast({
        title: "Already Premium",
        description: "You're already a premium user!",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    try {
      const checkout = await lemonSqueezyService.createCheckout(user.email, user.id);
      
      // Redirect to Lemon Squeezy checkout
      lemonSqueezyService.redirectToCheckout(checkout.checkoutUrl);
      
      // Close the dialog
      setIsOpen(false);
    } catch (error) {
      console.error('Upgrade failed:', error);
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "Failed to start upgrade process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const premiumFeatures = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: "Unlimited Stories",
      description: "Generate as many audio stories as you want"
    },
    {
      icon: <FileText className="w-5 h-5 text-blue-500" />,
      title: "20,000 Character Limit",
      description: "Process much longer documents and texts"
    },
    {
      icon: <Volume2 className="w-5 h-5 text-purple-500" />,
      title: "Premium TTS Voices",
      description: "Access to ElevenLabs high-quality voices"
    },
    {
      icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
      title: "Advanced Audio Controls",
      description: "Background music, speed control, and more"
    },
    {
      icon: <Star className="w-5 h-5 text-orange-500" />,
      title: "Priority Processing",
      description: "Your stories are processed first"
    }
  ];

  const defaultTrigger = (
    <Button 
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
    >
      <Crown className="w-4 h-4 mr-2" />
      Upgrade to Premium
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild className={className}>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Upgrade to AudioCraft Premium
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Unlock the full power of AI-powered audio storytelling
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Pricing Card */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-2">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold">
                <span className="text-4xl">$9.99</span>
                <span className="text-lg text-gray-600 ml-2">per month</span>
              </CardTitle>
              <CardDescription className="text-lg">
                Everything you need for professional audio content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Free vs Premium</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="font-medium text-gray-600">Feature</div>
                  <div className="font-medium text-gray-600 text-center">Free</div>
                  <div className="font-medium text-purple-600 text-center">Premium</div>
                  
                  <div>Stories per session</div>
                  <div className="text-center text-gray-500">10</div>
                  <div className="text-center text-purple-600 font-semibold">Unlimited</div>
                  
                  <div>Character limit</div>
                  <div className="text-center text-gray-500">600</div>
                  <div className="text-center text-purple-600 font-semibold">20,000</div>
                  
                  <div>PDF upload size</div>
                  <div className="text-center text-gray-500">5MB</div>
                  <div className="text-center text-purple-600 font-semibold">20MB</div>
                  
                  <div>TTS Quality</div>
                  <div className="text-center text-gray-500">Browser</div>
                  <div className="text-center text-purple-600 font-semibold">ElevenLabs</div>
                </div>
              </div>

              <Button 
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 text-lg font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Upgrade Now - $9.99/month
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Secure payment powered by Lemon Squeezy. Cancel anytime.
              </p>
            </CardContent>
          </Card>

          {/* Testimonial */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
            <p className="text-gray-700 italic mb-2">
            "AudioCraft has revolutionized how I consume research papers. Instead of spending hours reading, 
            I now listen to engaging audio summaries during my commute. The premium voices are incredible!"
            </p>
            <p className="text-sm text-gray-600 font-semibold">- Sarah Chen, PhD Student</p>
          </div>

          {/* Guarantee */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact version for smaller spaces
export function PremiumUpgradeCompact({ user, className }: PremiumUpgradeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Please sign in first",
        description: "You need to be signed in to upgrade to premium.",
        variant: "destructive",
      });
      return;
    }

    if (user.is_premium) {
      toast({
        title: "Already Premium",
        description: "You're already a premium user!",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    try {
      const checkout = await lemonSqueezyService.createCheckout(user.email, user.id);
      lemonSqueezyService.redirectToCheckout(checkout.checkoutUrl);
    } catch (error) {
      console.error('Upgrade failed:', error);
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "Failed to start upgrade process.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleUpgrade}
      disabled={isLoading}
      size="sm"
      className={`bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Crown className="w-4 h-4 mr-2" />
      )}
      {isLoading ? 'Processing...' : 'Go Premium'}
    </Button>
  );
}
