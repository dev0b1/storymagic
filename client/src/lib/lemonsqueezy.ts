export interface LemonSqueezyConfig {
  storeId: string;
  productId: string;
  variantId: string;
  publicKey: string;
}

export interface CheckoutData {
  checkoutUrl: string;
  checkoutId: string;
}

export interface SubscriptionStatus {
  is_premium: boolean;
  subscription_status: string;
  subscription_end_date?: string | null;
}

export class LemonSqueezyService {
  private config: LemonSqueezyConfig;

  constructor(config: LemonSqueezyConfig) {
    this.config = config;
  }

  /**
   * Create a checkout session for StoryMagic Premium
   */
  async createCheckout(userEmail: string, userId: string): Promise<CheckoutData> {
    try {
      const response = await fetch('/api/payment/lemonsqueezy/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          email: userEmail,
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const data = await response.json();
      return {
        checkoutUrl: data.checkout_url,
        checkoutId: data.checkout_id,
      };
    } catch (error) {
      console.error('Lemon Squeezy checkout creation failed:', error);
      throw error;
    }
  }

  /**
   * Redirect user to Lemon Squeezy checkout
   */
  redirectToCheckout(checkoutUrl: string) {
    // Use window.location.href for better compatibility
    window.location.href = checkoutUrl;
  }

  /**
   * Open checkout in new tab (alternative)
   */
  openCheckoutInNewTab(checkoutUrl: string) {
    const newWindow = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      // Fallback if popup was blocked
      window.location.href = checkoutUrl;
    }
  }

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      const response = await fetch('/api/subscription/status', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get subscription status');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      throw error;
    }
  }

  /**
   * Check if user is premium
   */
  async isPremium(userId: string): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus(userId);
      return status.is_premium;
    } catch (error) {
      console.error('Failed to check premium status:', error);
      return false;
    }
  }

  /**
   * Handle post-payment success (called after user returns from Lemon Squeezy)
   */
  async handlePaymentSuccess(userId: string): Promise<void> {
    try {
      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh subscription status
      await this.getSubscriptionStatus(userId);
      
      // Trigger a refresh of user data in the app
      window.dispatchEvent(new CustomEvent('subscription-updated'));
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }
}

// Default configuration - will be loaded from environment
export const lemonSqueezyConfig: LemonSqueezyConfig = {
  storeId: process.env.VITE_LEMONSQUEEZY_STORE_ID || '',
  productId: process.env.VITE_LEMONSQUEEZY_PRODUCT_ID || '',
  variantId: process.env.VITE_LEMONSQUEEZY_VARIANT_ID || '',
  publicKey: process.env.VITE_LEMONSQUEEZY_PUBLIC_KEY || '',
};

export const lemonSqueezyService = new LemonSqueezyService(lemonSqueezyConfig);
