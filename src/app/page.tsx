import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Brain, BookOpen, Upload, Shuffle, Lightbulb, Clock, Users, Star, CheckCircle, ArrowRight, Coffee, GraduationCap, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-50">
      {/* Header */}
      <header className="relative z-10 px-4 py-6 bg-white/90 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent">
                StudyFlow
            </span>
              <p className="text-xs text-slate-600 font-medium">AI Study Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="ghost" className="text-slate-700 hover:text-slate-800 hover:bg-slate-50">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                Start Studying Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-4 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 10,000+ Students & Professionals
            </Badge>
            <h1 className="text-6xl md:text-8xl font-bold text-slate-900 mb-8 leading-tight">
              Transform Your PDFs Into
              <span className="block bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 bg-clip-text text-transparent">
                Smart Study Materials
            </span>
          </h1>
            <p className="text-2xl md:text-3xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Stop spending hours creating flashcards manually. Our AI intelligently extracts key concepts from your documents and creates 
              <span className="font-semibold text-slate-800"> interactive study materials</span> in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link href="/auth">
                <Button size="lg" className="text-xl px-12 py-6 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                  <Zap className="w-6 h-6 mr-3" />
                  Start Free Trial
              </Button>
            </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="text-xl px-12 py-6 border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300">
                  <BookOpen className="w-6 h-6 mr-3" />
                  See How It Works
              </Button>
            </Link>
            </div>
            
            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-8 text-slate-600">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span className="font-medium">10,000+ Active Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Save 5+ Hours/Week</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-slate-500" />
                <span className="font-medium">4.9/5 Rating</span>
              </div>
            </div>
          </div>

          {/* Hero Demo - From This To This */}
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
              <div className="grid lg:grid-cols-3 gap-8 items-center">
                {/* Before */}
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Before StudyFlow</h3>
                    <p className="text-slate-600">Manual, time-consuming process</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                          <span className="text-sm font-medium text-slate-700">Read 50-page textbook</span>
                        </div>
                        <p className="text-xs text-slate-500">2-3 hours of reading</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                          <span className="text-sm font-medium text-slate-700">Manually create flashcards</span>
                        </div>
                        <p className="text-xs text-slate-500">3-4 hours of writing</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                          <span className="text-sm font-medium text-slate-700">Organize and categorize</span>
                        </div>
                        <p className="text-xs text-slate-500">1-2 hours of organizing</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-sm font-semibold text-slate-800">Total: 6-9 hours</p>
                      <p className="text-xs text-slate-500">Overwhelming and inefficient</p>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <ArrowRight className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 mt-3">AI Magic</p>
                </div>

                {/* After */}
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">With StudyFlow</h3>
                    <p className="text-slate-600">Automated, intelligent process</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200">
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-slate-700">Upload PDF</span>
                        </div>
                        <p className="text-xs text-slate-500">30 seconds</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-slate-700">AI extracts key concepts</span>
                        </div>
                        <p className="text-xs text-slate-500">Automatic</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-slate-700">Smart flashcards ready</span>
                        </div>
                        <p className="text-xs text-slate-500">With hints & categories</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-sm font-semibold text-green-700">Total: 30 seconds</p>
                      <p className="text-xs text-slate-500">Start studying immediately</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Results */}
              <div className="mt-8 pt-8 border-t border-slate-200">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="p-4">
                    <div className="text-3xl font-bold text-slate-900 mb-2">95%</div>
                    <div className="text-sm text-slate-600">Time Saved</div>
                  </div>
                  <div className="p-4">
                    <div className="text-3xl font-bold text-slate-900 mb-2">50+</div>
                    <div className="text-sm text-slate-600">Smart Flashcards</div>
                  </div>
                  <div className="p-4">
                    <div className="text-3xl font-bold text-slate-900 mb-2">Instant</div>
                    <div className="text-sm text-slate-600">Ready to Study</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 px-4 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-slate-100 text-slate-700 border-slate-200">
              <Zap className="w-4 h-4 mr-2" />
              Why Students Love StudyFlow
            </Badge>
            <h2 className="text-5xl font-bold text-slate-900 mb-6">
              Everything You Need to
              <span className="block bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
                Study Smarter
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Stop struggling with dense textbooks. Our AI does the heavy lifting so you can focus on learning.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-slate-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Instant PDF Processing</h3>
                <p className="text-slate-600 leading-relaxed">
                  Upload any PDF - textbooks, research papers, lecture notes. Our AI extracts key concepts in seconds, not hours.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-slate-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Smart Flashcards</h3>
                <p className="text-slate-600 leading-relaxed">
                  AI-generated flashcards with hints, difficulty levels, and categories. Study what matters most, not everything.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-slate-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">AI Summaries</h3>
                <p className="text-slate-600 leading-relaxed">
                  Get comprehensive summaries of your documents. Perfect for quick reviews and understanding main concepts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-slate-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shuffle className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Adaptive Study</h3>
                <p className="text-slate-600 leading-relaxed">
                  Randomize cards, track progress, and focus on difficult concepts. Study smarter with spaced repetition.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-slate-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lightbulb className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Smart Hints</h3>
                <p className="text-slate-600 leading-relaxed">
                  Get helpful hints without spoiling the answer. Learn progressively and build confidence.
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-slate-300">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Progress Tracking</h3>
                <p className="text-slate-600 leading-relaxed">
                  See your improvement over time. Track accuracy, study time, and identify areas that need more attention.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="demo" className="relative z-10 px-4 py-20 bg-gradient-to-br from-slate-50 to-stone-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white text-slate-700 border-slate-200">
              <Coffee className="w-4 h-4 mr-2" />
              Simple as 1-2-3
            </Badge>
            <h2 className="text-5xl font-bold text-slate-900 mb-6">
              From PDF to Mastery in
              <span className="block bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
                3 Simple Steps
              </span>
          </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              No complex setup, no learning curve. Just upload, process, and study.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                  <span className="text-white font-bold text-3xl">1</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Upload className="w-4 h-4 text-slate-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Upload Your PDF</h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                Drag and drop any PDF - textbooks, research papers, lecture notes. We support all formats and sizes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                  <span className="text-white font-bold text-3xl">2</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Brain className="w-4 h-4 text-slate-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">AI Magic Happens</h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                Our AI reads, understands, and extracts key concepts. Creates flashcards and summaries automatically.
              </p>
            </div>
            
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                  <span className="text-white font-bold text-3xl">3</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-4 h-4 text-slate-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Study & Excel</h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                Start studying immediately with smart flashcards, hints, and progress tracking. Ace your exams!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 px-4 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-slate-100 text-slate-700 border-slate-200">
              <Star className="w-4 h-4 mr-2" />
              Simple, Transparent Pricing
            </Badge>
            <h2 className="text-5xl font-bold text-slate-900 mb-6">
              Choose Your
              <span className="block bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
                Study Plan
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Start free, upgrade when you're ready. No hidden fees, no surprises.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="border-slate-200 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Free Trial</h3>
                  <div className="text-4xl font-bold text-slate-900 mb-2">$0</div>
                  <p className="text-slate-600">Perfect for trying out StudyFlow</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>3 PDF uploads</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Up to 50 flashcards per PDF</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Basic study features</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Progress tracking</span>
                  </li>
                </ul>
                
                <Link href="/auth">
                  <Button className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-slate-300 hover:shadow-2xl transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-2">
                  Most Popular
                </Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">StudyFlow Pro</h3>
                  <div className="text-4xl font-bold text-slate-900 mb-2">$29<span className="text-lg text-slate-600">/month</span></div>
                  <p className="text-slate-600">For serious students & professionals</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span><strong>Unlimited</strong> PDF uploads</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span><strong>Unlimited</strong> flashcards</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>AI-powered summaries</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Advanced study modes</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Export flashcards</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Priority support</span>
                  </li>
                </ul>
                
                <Link href="/auth">
                  <Button className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg">
                    Start Pro Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-slate-600 mb-4">
              <strong>30-day money-back guarantee</strong> • Cancel anytime • No setup fees
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-slate-500">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>Instant access</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-20 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Transform Your
            <span className="block">Study Game?</span>
          </h2>
          <p className="text-2xl text-slate-200 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join 10,000+ students who've already saved hundreds of hours and improved their grades with StudyFlow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
          <Link href="/auth">
              <Button size="lg" className="text-xl px-12 py-6 bg-white text-slate-700 hover:bg-slate-50 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                <Zap className="w-6 h-6 mr-3" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="text-xl px-12 py-6 border-2 border-white text-white hover:bg-white hover:text-slate-700 transition-all duration-300">
                <BookOpen className="w-6 h-6 mr-3" />
                See Demo
            </Button>
          </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="text-white">
              <div className="text-3xl font-bold mb-2">10,000+</div>
              <div className="text-slate-200">Happy Students</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold mb-2">5+ Hours</div>
              <div className="text-slate-200">Saved Per Week</div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-bold mb-2">4.9/5</div>
              <div className="text-slate-200">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">StudyFlow</span>
              </div>
              <p className="text-gray-400">
                AI-powered study assistant that transforms your PDFs into smart flashcards and summaries.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 StudyFlow. All rights reserved. Made with ❤️ for students worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
