import { DatabaseService } from './database-service';

export interface PaddleSubscription {
  id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  plan_id: string;
  customer_id: string;
  next_billed_at?: string;
  cancel_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaddleCustomer {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export class PaddleService {
  private static readonly PADDLE_VENDOR_ID = process.env.PADDLE_VENDOR_ID;
  private static readonly PADDLE_API_KEY = process.env.PADDLE_API_KEY;
  private static readonly PADDLE_ENVIRONMENT = process.env.PADDLE_ENVIRONMENT || 'sandbox';

  static async initializePaddle() {
    if (typeof window === 'undefined') return;

    const { Paddle } = await import('@paddle/paddle-js');
    
    return Paddle.initialize({
      vendor: this.PADDLE_VENDOR_ID!,
      environment: this.PADDLE_ENVIRONMENT as 'sandbox' | 'production',
      token: this.PADDLE_API_KEY!,
    });
  }

  static async openCheckout(productId: string, userId: string, userEmail: string) {
    if (typeof window === 'undefined') return;

    const paddle = await this.initializePaddle();
    
    return paddle.Checkout.open({
      items: [
        {
          priceId: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: userEmail,
        customData: {
          user_id: userId,
        },
      },
      customData: {
        user_id: userId,
      },
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en',
        allowLogout: false,
        frameTarget: 'checkout-container',
        frameInitialHeight: 450,
        frameStyle: 'width: 100%; min-width: 312px; background-color: transparent; border: none;',
      },
      eventCallback: (data: any) => {
        console.log('Paddle event:', data);
        this.handlePaddleEvent(data, userId);
      },
    });
  }

  static async handlePaddleEvent(event: any, userId: string) {
    console.log('Handling Paddle event:', event);
    
    switch (event.name) {
      case 'checkout.completed':
        await this.handleCheckoutCompleted(event.data, userId);
        break;
      case 'subscription.created':
        await this.handleSubscriptionCreated(event.data, userId);
        break;
      case 'subscription.updated':
        await this.handleSubscriptionUpdated(event.data, userId);
        break;
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(event.data, userId);
        break;
      case 'subscription.past_due':
        await this.handleSubscriptionPastDue(event.data, userId);
        break;
      default:
        console.log('Unhandled Paddle event:', event.name);
    }
  }

  private static async handleCheckoutCompleted(data: any, userId: string) {
    try {
      console.log('Checkout completed:', data);
      
      // Update user profile to premium
      await DatabaseService.updateUserProfile(userId, {
        is_premium: true,
        subscription_status: 'active',
        subscription_id: data.subscription_id,
        subscription_end_date: data.next_billed_at ? new Date(data.next_billed_at) : undefined,
      });

      // Redirect to dashboard or show success message
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard?subscription=success';
      }
    } catch (error) {
      console.error('Error handling checkout completed:', error);
    }
  }

  private static async handleSubscriptionCreated(data: any, userId: string) {
    try {
      console.log('Subscription created:', data);
      
      await DatabaseService.updateUserProfile(userId, {
        is_premium: true,
        subscription_status: 'active',
        subscription_id: data.id,
        subscription_end_date: data.next_billed_at ? new Date(data.next_billed_at) : undefined,
      });
    } catch (error) {
      console.error('Error handling subscription created:', error);
    }
  }

  private static async handleSubscriptionUpdated(data: any, userId: string) {
    try {
      console.log('Subscription updated:', data);
      
      await DatabaseService.updateUserProfile(userId, {
        subscription_status: data.status,
        subscription_end_date: data.next_billed_at ? new Date(data.next_billed_at) : undefined,
      });
    } catch (error) {
      console.error('Error handling subscription updated:', error);
    }
  }

  private static async handleSubscriptionCancelled(data: any, userId: string) {
    try {
      console.log('Subscription cancelled:', data);
      
      await DatabaseService.updateUserProfile(userId, {
        is_premium: false,
        subscription_status: 'cancelled',
        subscription_end_date: data.cancel_at ? new Date(data.cancel_at) : undefined,
      });
    } catch (error) {
      console.error('Error handling subscription cancelled:', error);
    }
  }

  private static async handleSubscriptionPastDue(data: any, userId: string) {
    try {
      console.log('Subscription past due:', data);
      
      await DatabaseService.updateUserProfile(userId, {
        subscription_status: 'past_due',
      });
    } catch (error) {
      console.error('Error handling subscription past due:', error);
    }
  }

  static async getSubscriptionStatus(userId: string) {
    try {
      const userProfile = await DatabaseService.getUserProfile(userId);
      return {
        isPremium: userProfile?.is_premium || false,
        status: userProfile?.subscription_status || 'free',
        subscriptionId: userProfile?.subscription_id,
        subscriptionEndDate: userProfile?.subscription_end_date,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return {
        isPremium: false,
        status: 'free',
        subscriptionId: null,
        subscriptionEndDate: null,
      };
    }
  }

  static async cancelSubscription(userId: string) {
    try {
      const userProfile = await DatabaseService.getUserProfile(userId);
      if (!userProfile?.subscription_id) {
        throw new Error('No active subscription found');
      }

      // In a real implementation, you would call Paddle's API to cancel the subscription
      // For now, we'll just update the local database
      await DatabaseService.updateUserProfile(userId, {
        is_premium: false,
        subscription_status: 'cancelled',
      });

      return { success: true };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
}
