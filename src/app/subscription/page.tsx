'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaddleCheckout } from '@/components/paddle/PaddleCheckout';
import { PaddleService } from '@/lib/paddle-service';
import { CheckCircle, XCircle, Clock, CreditCard, Settings } from 'lucide-react';

interface SubscriptionStatus {
  isPremium: boolean;
  status: string;
  subscriptionId: string | null;
  subscriptionEndDate: Date | null;
}

export default function SubscriptionPage() {
  const { user } = useUser();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscriptionStatus();
    }
  }, [user]);

  const loadSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      const status = await PaddleService.getSubscriptionStatus(user.id);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscriptionStatus?.subscriptionId) return;
    
    try {
      await PaddleService.cancelSubscription(user.id);
      await loadSubscriptionStatus();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-600 mb-2">Authentication Required</h2>
            <p className="text-slate-500">Please sign in to manage your subscription.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Subscription Management</h1>
          <p className="text-xl text-slate-600">Manage your StudyFlow subscription and billing</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Current Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Plan:</span>
                <Badge 
                  variant={subscriptionStatus?.isPremium ? 'default' : 'secondary'}
                  className={subscriptionStatus?.isPremium ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}
                >
                  {subscriptionStatus?.isPremium ? 'StudyFlow Pro' : 'Free Trial'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Status:</span>
                <Badge 
                  variant="outline"
                  className={
                    subscriptionStatus?.status === 'active' 
                      ? 'border-green-500 text-green-700' 
                      : subscriptionStatus?.status === 'cancelled'
                      ? 'border-red-500 text-red-700'
                      : 'border-yellow-500 text-yellow-700'
                  }
                >
                  {subscriptionStatus?.status === 'active' && <CheckCircle className="w-4 h-4 mr-1" />}
                  {subscriptionStatus?.status === 'cancelled' && <XCircle className="w-4 h-4 mr-1" />}
                  {subscriptionStatus?.status === 'past_due' && <Clock className="w-4 h-4 mr-1" />}
                  {subscriptionStatus?.status || 'free'}
                </Badge>
              </div>

              {subscriptionStatus?.subscriptionEndDate && (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Next Billing:</span>
                  <span className="text-slate-600">
                    {new Date(subscriptionStatus.subscriptionEndDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {subscriptionStatus?.subscriptionId && (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Subscription ID:</span>
                  <span className="text-sm text-slate-500 font-mono">
                    {subscriptionStatus.subscriptionId.slice(0, 8)}...
                  </span>
                </div>
              )}

              {subscriptionStatus?.isPremium && subscriptionStatus?.status === 'active' && (
                <Button 
                  onClick={handleCancelSubscription}
                  variant="outline"
                  className="w-full border-red-200 text-red-700 hover:bg-red-50"
                >
                  Cancel Subscription
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Upgrade Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {subscriptionStatus?.isPremium ? 'Manage Subscription' : 'Upgrade Plan'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscriptionStatus?.isPremium ? (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Pro Plan Active</h3>
                    <p className="text-green-600">
                      You have access to all StudyFlow Pro features including unlimited PDF uploads, 
                      AI summaries, and advanced study modes.
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Unlimited PDF uploads</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Unlimited flashcards</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>AI-powered summaries</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Advanced study modes</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Export flashcards</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Priority support</span>
                    </div>
                  </div>
                </div>
              ) : (
                <PaddleCheckout 
                  userId={user.id}
                  userEmail={user.email || ''}
                  planType="free"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Billing Information */}
        {subscriptionStatus?.isPremium && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Payment Method</h4>
                  <p className="text-slate-600">Manage your payment method through Paddle's secure portal.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Billing History</h4>
                  <p className="text-slate-600">View your billing history and download invoices.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
