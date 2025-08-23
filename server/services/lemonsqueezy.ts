import { db } from '../supabase';
import type { InsertSubscription } from '@shared/schema';

export interface LemonSqueezyConfig {
  apiKey: string;
  storeId: string;
  variantId: string;
  webhookSecret: string;
}

export interface LemonSqueezyCustomer {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface LemonSqueezyCheckout {
  id: string;
  url: string;
  custom_fields: Record<string, any>;
  meta: {
    user_id: string;
  };
}

export interface LemonSqueezySubscription {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  customer_id: string;
  status: 'on_trial' | 'active' | 'paused' | 'past_due' | 'unpaid' | 'cancelled' | 'expired';
  trial_ends_at?: string;
  billing_anchor?: number;
  urls: {
    update_payment_method: string;
    customer_portal: string;
  };
  renews_at: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
}

export class LemonSqueezyService {
  private config: LemonSqueezyConfig;
  private baseUrl = 'https://api.lemonsqueezy.com/v1';

  constructor(config: LemonSqueezyConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Lemon Squeezy API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Create a checkout session
   */
  async createCheckout({
    email,
    name,
    userId,
    customFields = {}
  }: {
    email: string;
    name?: string;
    userId: string;
    customFields?: Record<string, any>;
  }): Promise<{ checkoutUrl: string; checkoutId: string }> {
    const data = {
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            enabled_variants: [parseInt(this.config.variantId)],
            redirect_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?payment=success`,
            receipt_button_text: 'Go to Dashboard',
            receipt_link_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`,
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: true,
          },
          checkout_data: {
            email: email,
            name: name || '',
            custom: {
              user_id: userId,
              ...customFields
            }
          },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: this.config.storeId
            }
          },
          variant: {
            data: {
              type: 'variants',
              id: this.config.variantId
            }
          }
        }
      }
    };

    const response = await this.makeRequest('/checkouts', 'POST', data);
    
    return {
      checkoutUrl: response.data.attributes.url,
      checkoutId: response.data.id
    };
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<LemonSqueezySubscription> {
    const response = await this.makeRequest(`/subscriptions/${subscriptionId}`);
    return response.data.attributes;
  }

  /**
   * Get customer subscriptions
   */
  async getCustomerSubscriptions(customerId: string): Promise<LemonSqueezySubscription[]> {
    const response = await this.makeRequest(`/subscriptions?filter[customer_id]=${customerId}`);
    return response.data.map((sub: any) => sub.attributes);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.makeRequest(`/subscriptions/${subscriptionId}`, 'DELETE');
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<LemonSqueezySubscription> {
    const data = {
      data: {
        type: 'subscriptions',
        id: subscriptionId,
        attributes: {
          cancelled: false
        }
      }
    };
    
    const response = await this.makeRequest(`/subscriptions/${subscriptionId}`, 'PATCH', data);
    return response.data.attributes;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha256', this.config.webhookSecret)
                      .update(payload, 'utf8')
                      .digest('hex');
    
    return hash === signature;
  }

  /**
   * Get orders with filtering
   */
  async getOrders(filters: Record<string, string> = {}): Promise<any[]> {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/orders${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeRequest(endpoint);
    return response.data;
  }

  /**
   * Get specific order
   */
  async getOrder(orderId: string): Promise<any> {
    const response = await this.makeRequest(`/orders/${orderId}`);
    return response.data.attributes;
  }
}

// Default configuration
export const lemonSqueezyService = new LemonSqueezyService({
  apiKey: process.env.LEMONSQUEEZY_API_KEY || '',
  storeId: process.env.LEMONSQUEEZY_STORE_ID || '',
  variantId: process.env.LEMONSQUEEZY_VARIANT_ID || '',
  webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '',
});

