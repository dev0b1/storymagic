import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DemoVideosGrid } from '@/components/ui/demo-video-player';
import { 
  BookOpen, 
  FileText, 
  Volume2, 
  Download, 
  Star, 
  Zap, 
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
  SkipForward,
  Mic,
  HeadphonesIcon,
  Brain,
  Podcast,
  Sparkles
} from 'lucide-react';
import { useLocation } from 'wouter';
import { safeNavigate } from '@/lib/navigation';

export default function Landing() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setLocation] = useLocation();

  const navigate = (path: string) => safeNavigate(setLocation, path);

  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Document Intelligence',
      description: 'Upload PDFs or paste text. AudioCraft analyzes content type and optimizes narration accordingly.'
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: '4 Professional Modes',
      description: 'Lecture for education, Guide for processes, Narrative for engagement, Podcast for discussions.'
    },
    {
      icon: <HeadphonesIcon className="w-6 h-6" />,
      title: 'Premium Audio Quality',
      description: 'ElevenLabs and OpenAI TTS with background music mixing and professional sound design.'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Processing',
      description: 'Generate high-quality audio content in minutes, not hours. Perfect for busy professionals.'
    }
  ];

  const useCases = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Course Content',
      description: 'Turn course topics into clear audio lectures'
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      title: 'Business Docs',
      description: 'Create engaging audio summaries of reports'
    },
    {
      icon: <Code className="w-5 h-5" />,
      title: 'Technical Docs',
      description: 'Explain complex topics with Lecture mode'
    },
    {
      icon: <History className="w-5 h-5" />,
      title: 'Research Papers',
      description: 'Generate podcasts or narratives from PDFs'
    }
  ];

  const premiumFeatures = [
    'Unlimited story generation',
    'Up to 20,000 characters per story',
    '20MB PDF uploads',
    'Premium TTS voices (ElevenLabs)',
    'Advanced audio controls',
    'Priority processing',
    'Story history & analytics'
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '10 stories per session',
        '600 character limit',
        '5MB PDF uploads',
        'Browser TTS',
        'Basic audio controls'
      ],
      buttonText: 'Start Free',
      popular: false
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: 'per month',
      features: [
        'Unlimited stories',
        '20,000 character limit',
        '20MB PDF uploads',
        'Premium TTS voices',
        'Advanced audio controls',
        'Story history',
        'Priority support'
      ],
      buttonText: 'Go Premium',
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative overflow-hidden professional-background">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8 flex-col xs:flex-row">
              <div className="w-12 h-12 xs:w-16 xs:h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-4 xs:mb-0 xs:mr-4 shadow-lg">
                <Sparkles className="w-6 h-6 xs:w-8 xs:h-8 text-white" />
              </div>
              <h1 className="text-4xl xs:text-6xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent text-center xs:text-left">
                AudioCraft
              </h1>
            </div>
            <h2 className="text-2xl xs:text-3xl font-bold text-gray-800 mb-6 text-center">
              Craft Engaging Audio from
              <span className="block text-purple-600">Any Document or Text</span>
            </h2>
            <p className="text-lg xs:text-xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed text-center">
              Transform PDFs, documents, and text into professional-quality audio with AI-powered narration and immersive soundscapes. 
              Perfect for students, professionals, creators, and anyone who learns better through listening.
              <span className="block mt-2 text-base xs:text-lg font-medium text-purple-600">"Turn any text into your personal audiobook" 📚➡️🎧</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="bg-gradient-professional hover:opacity-90 text-white px-8 sm:px-10 py-4 text-lg font-promptbook rounded-xl animate-professional-pulse min-h-[48px]"
                onClick={() => navigate('/auth')}
              >
                <BookOpen className="w-5 h-5 mr-3" />
                Start Creating
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-promptbook-blue text-promptbook-blue hover:bg-blue-50 px-8 sm:px-10 py-4 text-lg font-promptbook rounded-xl min-h-[48px]"
                onClick={() => document.getElementById('demo-videos')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="w-5 h-5 mr-3" />
                Watch Demos
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-promptbook font-bold text-promptbook-blue mb-2">4</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Professional Modes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-promptbook font-bold text-promptbook-blue mb-2">20MB</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Max PDF Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-promptbook font-bold text-promptbook-blue mb-2">2-3min</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">Processing Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-promptbook font-bold text-gray-900 mb-6">
              Powerful Features for Every Content Type
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              AudioCraft combines advanced AI with professional audio production to deliver 
              high-quality narration that matches your content's purpose and audience.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center card-professional hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-professional rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-promptbook mb-3">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-gray-600">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-promptbook font-bold text-gray-900 mb-6">
              Built for Everyone
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From students to professionals, AudioCraft transforms how people consume and share knowledge through audio.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index} className="card-professional hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="pt-8 pb-6">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-gradient-professional rounded-xl flex items-center justify-center text-white mr-4 flex-shrink-0">
                      {useCase.icon}
                    </div>
                    <div>
                      <h3 className="font-promptbook font-semibold text-lg text-gray-900 mb-2">{useCase.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{useCase.description}</p>
                    </div>
                  </div>
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
              See how AudioCraft AI transforms content and creates immersive audio experiences.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
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
            
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-6 sm:p-8 order-1 lg:order-2">
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Try It Now
                </h4>
                <p className="text-gray-600 mb-6">
                  Upload a PDF or paste some text to see AudioCraft AI in action
                </p>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white min-h-[48px] w-full sm:w-auto"
                >
                  Start Creating
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Trusted by Users Worldwide</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of students, professionals, and creators who are transforming how they consume content with AudioCraft.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-sm sm:text-base text-gray-600">Documents Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-sm sm:text-base text-gray-600">User Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-sm sm:text-base text-gray-600">Languages Supported</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From students to executives, AudioCraft is changing how people consume written content.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "AudioCraft has revolutionized my research workflow. I can now listen to academic papers 
                during my commute and absorb information 3x faster. The AI narration is surprisingly natural."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  SC
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Dr. Sarah Chen</div>
                  <div className="text-sm text-gray-600">PhD Student, Stanford</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "As a busy executive, AudioCraft lets me stay informed with industry reports while 
                multitasking. The professional voice quality and background audio create an immersive experience."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  MJ
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Michael Johnson</div>
                  <div className="text-sm text-gray-600">CEO, TechStart Inc.</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "AudioCraft is a game-changer for accessibility. Students with reading difficulties can 
                now engage with course materials effectively. The educational mode is perfectly tailored."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  ER
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Emma Rodriguez</div>
                  <div className="text-sm text-gray-600">Professor, UC Berkeley</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Videos Section */}
      <div id="demo-videos" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-promptbook font-bold text-gray-900 mb-6">
              Experience Each Mode
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              See and hear how AudioCraft adapts to different content types and purposes. 
              Each mode is designed for specific use cases and audiences.
            </p>
          </div>
          <DemoVideosGrid className="animate-slide-up" />
          
          <div className="text-center mt-16">
            <p className="text-lg text-gray-600 mb-6">
              Ready to try it with your own content?
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-professional hover:opacity-90 text-white px-8 py-3 text-lg font-promptbook rounded-xl"
              onClick={() => navigate('/auth')}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Start Creating Audio
            </Button>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-promptbook font-bold text-gray-900 mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Start free and scale as you grow. All plans include our core features with premium options for professional use.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative card-professional hover:shadow-2xl transition-all duration-300 ${plan.popular ? 'ring-2 ring-promptbook-blue shadow-xl scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-professional text-white px-6 py-2 text-sm font-promptbook">
                      <Star className="w-4 h-4 mr-2" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-3xl font-promptbook font-bold">{plan.name}</CardTitle>
                  <div className="mt-6">
                    <span className="text-5xl font-promptbook font-bold text-gray-900">{plan.price}</span>
                    <span className="text-lg text-gray-600 ml-2 font-medium">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-8">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-promptbook-success mr-4 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    size="lg"
                    className={`w-full py-4 text-lg font-promptbook rounded-xl ${plan.popular ? 'bg-gradient-professional hover:opacity-90 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
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
      <div className="py-24 bg-gradient-professional">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-promptbook font-bold text-white mb-8">
            Transform Your Content Today
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Join students, professionals, and creators who use AudioCraft to create engaging audio content. 
            Start with our free plan and experience the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-promptbook-blue hover:bg-gray-200 px-10 py-4 text-lg font-promptbook rounded-xl shadow-lg"
              onClick={() => navigate('/auth')}
            >
              <BookOpen className="w-5 h-5 mr-3" />
              Start Creating Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-white text-promptbook-blue hover:bg-gray-200 hover:text-promptbook-blue px-10 py-4 text-lg font-promptbook rounded-xl"
              onClick={() => navigate('/auth')}
            >
              View Pricing Plans
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center mr-3">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">AudioCraft</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Craft professional-quality audio from any document or text with AI-powered narration and immersive soundscapes. The ultimate audio content platform for students, professionals, and creators.
              </p>
            </div>
            <div>
              <h3 className="font-promptbook font-semibold mb-6 text-lg">Features</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Document Processing</li>
                <li className="hover:text-white transition-colors cursor-pointer">AI Audio Generation</li>
                <li className="hover:text-white transition-colors cursor-pointer">Professional TTS</li>
                <li className="hover:text-white transition-colors cursor-pointer">Advanced Controls</li>
              </ul>
            </div>
            <div>
              <h3 className="font-promptbook font-semibold mb-6 text-lg">Use Cases</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Education & Training</li>
                <li className="hover:text-white transition-colors cursor-pointer">Business Content</li>
                <li className="hover:text-white transition-colors cursor-pointer">Research & Analysis</li>
                <li className="hover:text-white transition-colors cursor-pointer">Content Marketing</li>
              </ul>
            </div>
            <div>
              <h3 className="font-promptbook font-semibold mb-6 text-lg">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Documentation</li>
                <li className="hover:text-white transition-colors cursor-pointer">Help Center</li>
                <li className="hover:text-white transition-colors cursor-pointer">Contact Support</li>
                <li className="hover:text-white transition-colors cursor-pointer">System Status</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
            <p className="text-gray-400 text-sm mb-4 sm:mb-0">
              &copy; 2024 AudioCraft. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">API Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
