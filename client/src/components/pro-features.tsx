import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Zap, 
  Volume2, 
  Download, 
  FileText, 
  Infinity,
  CheckCircle,
  Crown,
  ArrowRight
} from 'lucide-react';

interface ProFeaturesProps {
  onUpgrade: () => void;
  currentPlan?: 'free' | 'premium';
}

export function ProFeatures({ onUpgrade, currentPlan = 'free' }: ProFeaturesProps) {
  const features = [
    {
      icon: <Infinity className="w-5 h-5" />,
      title: "Unlimited Stories",
      description: "Generate as many stories as you want, whenever you want",
      free: "2 stories per session",
      premium: "Unlimited stories"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Larger Content",
      description: "Process longer documents and more complex content",
      free: "600 characters max",
      premium: "20,000 characters max"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Bigger PDFs",
      description: "Upload larger PDF files for processing",
      free: "5MB max",
      premium: "20MB max"
    },
    {
      icon: <Volume2 className="w-5 h-5" />,
      title: "Premium TTS",
      description: "High-quality voices from ElevenLabs and OpenAI",
      free: "Browser TTS only",
      premium: "ElevenLabs + OpenAI voices"
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: "Audio Downloads",
      description: "Save your narrated stories as MP3 files",
      free: "Text only",
      premium: "MP3 with background music"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Priority Processing",
      description: "Faster story generation and audio processing",
      free: "Standard queue",
      premium: "Priority processing"
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "2 stories per session",
        "600 character limit",
        "5MB PDF uploads",
        "Browser TTS",
        "Basic audio controls",
        "Standard processing"
      ],
      buttonText: "Current Plan",
      popular: false,
      disabled: currentPlan === 'free'
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "per month",
      features: [
        "Unlimited stories",
        "20,000 character limit",
        "20MB PDF uploads",
        "Premium TTS voices",
        "Advanced audio controls",
        "Audio downloads",
        "Priority processing",
        "Story history",
        "Premium support"
      ],
      buttonText: currentPlan === 'premium' ? "Current Plan" : "Upgrade Now",
      popular: true,
      disabled: currentPlan === 'premium'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Premium Features Overview */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-yellow-500 mr-2" />
          <h2 className="text-3xl font-bold text-gray-900">Premium Features</h2>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Unlock the full potential of StoryMagic AI with premium features designed for power users and professionals.
        </p>
      </div>

      {/* Feature Comparison */}
      <div className="grid gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs font-medium text-gray-500 mb-1">Free Plan</div>
                      <div className="text-sm text-gray-700">{feature.free}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="text-xs font-medium text-purple-600 mb-1 flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        Premium
                      </div>
                      <div className="text-sm text-purple-700 font-medium">{feature.premium}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pricing Plans */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h3>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-purple-500 shadow-xl' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-4 py-1">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-800 hover:bg-gray-900'}`}
                  onClick={onUpgrade}
                  disabled={plan.disabled}
                >
                  {plan.buttonText}
                  {!plan.disabled && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      {currentPlan === 'free' && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Unlock Premium?</h3>
          <p className="text-purple-100 mb-6">
            Get unlimited stories, premium TTS voices, and advanced audio controls.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3"
            onClick={onUpgrade}
          >
            <Crown className="w-5 h-5 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      )}
    </div>
  );
}
