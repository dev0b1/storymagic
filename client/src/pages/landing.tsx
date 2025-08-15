import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  FileText, 
  Volume2, 
  Download, 
  Star, 
  Zap, 
  BookOpen, 
  GraduationCap,
  Briefcase,
  Code,
  History,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Pause,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function Landing() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setLocation] = useLocation();

  const navigate = (path: string) => setLocation(path);

  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Smart PDF Processing",
      description: "Upload any PDF and our AI extracts key information, preserving all important facts while making content engaging and memorable."
    },
    {
      icon: <Volume2 className="w-6 h-6" />,
      title: "Professional TTS Narration",
      description: "High-quality text-to-speech with ElevenLabs and OpenAI, plus ambient background music for immersive listening."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-Powered Story Generation",
      description: "Transform boring content into engaging narratives using OpenRouter's advanced AI models with intelligent fallbacks."
    },
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: "Educational Focus",
      description: "Perfect for students, researchers, and professionals who need to understand and retain complex information."
    }
  ];

  const useCases = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Academic Papers",
      description: "Transform research papers into clear, memorable narratives"
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      title: "Business Reports",
      description: "Make corporate documents engaging and actionable"
    },
    {
      icon: <Code className="w-5 h-5" />,
      title: "Technical Docs",
      description: "Break down complex concepts into digestible stories"
    },
    {
      icon: <History className="w-5 h-5" />,
      title: "Historical Content",
      description: "Bring the past to life with compelling narratives"
    }
  ];

  const premiumFeatures = [
    "Unlimited story generation",
    "Up to 20,000 characters per story",
    "20MB PDF uploads",
    "Premium TTS voices (ElevenLabs)",
    "Advanced audio controls",
    "Priority processing",
    "Story history & analytics"
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
        "Basic audio controls"
      ],
      buttonText: "Start Free",
      popular: false
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
        "Story history",
        "Priority support"
      ],
      buttonText: "Go Premium",
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-purple-600 mr-3" />
              <h1 className="text-5xl font-bold text-gray-900 font-magical">
                StoryMagic AI
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform boring PDFs and text into immersive, narrated stories that help you understand and remember key information. 
              Powered by advanced AI with professional text-to-speech and ambient audio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
                onClick={() => navigate('/auth')}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start Creating Stories
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-purple-200 text-purple-700 hover:bg-purple-50 px-8 py-3 text-lg"
                onClick={() => navigate('/auth')}
              >
                <Play className="w-5 h-5 mr-2" />
                See Demo
              </Button>
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-purple-600 hover:bg-purple-50 px-8 py-3 text-lg"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/demo-login', { method: 'POST' });
                    const user = await response.json();
                    localStorage.setItem('userId', user.id);
                    localStorage.setItem('userEmail', user.email);
                    localStorage.setItem('userName', user.name || '');
                    localStorage.setItem('isPremium', user.is_premium ? 'true' : 'false');
                    localStorage.setItem('storiesGenerated', user.stories_generated?.toString() || '0');
                    navigate('/dashboard');
                  } catch (error) {
                    console.error('Demo login failed:', error);
                  }
                }}
              >
                🚀 Try Demo (Instant Access)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose StoryMagic AI?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI with professional audio production to create an unparalleled learning experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perfect For Every Content Type
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're studying, working, or just want to make content more engaging, StoryMagic AI adapts to your needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                      {useCase.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900">{useCase.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{useCase.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div id="demo-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Experience the Magic
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how StoryMagic AI transforms content and creates immersive audio experiences.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Advanced Audio Controls
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Play/Pause</h4>
                    <p className="text-sm text-gray-600">Control narration playback</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <SkipBack className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Skip Controls</h4>
                    <p className="text-sm text-gray-600">Forward/backward 10 seconds</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Audio Download</h4>
                    <p className="text-sm text-gray-600">Save stories as MP3 files</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Background Music</h4>
                    <p className="text-sm text-gray-600">Ambient sounds for immersion</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Try It Now
                </h4>
                <p className="text-gray-600 mb-6">
                  Upload a PDF or paste some text to see StoryMagic AI in action
                </p>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  Start Creating
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start free and upgrade when you're ready for more.
            </p>
          </div>
          
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
                    onClick={() => navigate('/auth')}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Content?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of users who are already making their content more engaging and memorable with StoryMagic AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg"
              onClick={() => navigate('/auth')}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-3 text-lg"
              onClick={() => navigate('/auth')}
            >
              View Premium Features
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-400 mr-2" />
                <span className="text-xl font-bold">StoryMagic AI</span>
              </div>
              <p className="text-gray-400">
                Transforming content into engaging, memorable stories with AI-powered narration.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>PDF Processing</li>
                <li>AI Story Generation</li>
                <li>Text-to-Speech</li>
                <li>Audio Controls</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Use Cases</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Education</li>
                <li>Business</li>
                <li>Research</li>
                <li>Content Creation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Status</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 StoryMagic AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
