'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Star } from 'lucide-react';
import { PaddleService } from '@/lib/paddle-service';

interface PaddleCheckoutProps {
  userId: string;
  userEmail: string;
  planType: 'free' | 'pro';
}

export const PaddleCheckout: React.FC<PaddleCheckoutProps> = ({ 
  userId, 
  userEmail, 
  planType 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paddleInitialized, setPaddleInitialized] = useState(false);

  useEffect(() => {
    const initPaddle = async () => {
      try {
        await PaddleService.initializePaddle();
        setPaddleInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Paddle:', error);
      }
    };

    initPaddle();
  }, []);

  const handleUpgrade = async () => {
    if (!paddleInitialized) {
      console.error('Paddle not initialized');
      return;
    }

    setIsLoading(true);
    
    try {
      // Replace with your actual Paddle product ID
      const productId = process.env.NEXT_PUBLIC_PADDLE_PRODUCT_ID || 'pri_01h8xce4x86pqf5h1fq7x3m5nt';
      
      await PaddleService.openCheckout(productId, userId, userEmail);
    } catch (error) {
      console.error('Failed to open checkout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (planType === 'free') {
    return (
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
          
          <Button 
            onClick={handleUpgrade}
            disabled={!paddleInitialized || isLoading}
            className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            {isLoading ? 'Loading...' : 'Upgrade to Pro'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-slate-300 hover:shadow-2xl transition-all duration-300 relative">
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <Badge className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-2">
          <Star className="w-4 h-4 mr-2" />
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
        
        <Button 
          onClick={handleUpgrade}
          disabled={!paddleInitialized || isLoading}
          className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg"
        >
          {isLoading ? 'Loading...' : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Start Pro Trial
            </>
          )}
        </Button>
        
        <div className="text-center mt-4">
          <p className="text-sm text-slate-500">
            30-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
