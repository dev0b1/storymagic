import { db } from '../supabase';
import type { InsertSubscription } from '@shared/schema';

export interface PaystackConfig {
  secretKey: string;
  publicKey: string;
  baseUrl: string;
}

export interface PaystackCustomer {
  id: number;
  customer_code: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface PaystackTransaction {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  authorization: {
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    bin: string;
    bank: string;
    channel: string;
    reusable: boolean;
    country_code: string;
    account_name: string;
  };
  customer: PaystackCustomer;
  // add metadata as used by verification handler
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaystackSubscription {
  id: number;
  customer: number;
  plan: number;
  status: string;
  start: string;
  end: string;
  created_at: string;
  updated_at: string;
}

export class PaystackService {
  private config: PaystackConfig;

  constructor(config: PaystackConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.secretKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Paystack API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createCustomer(email: string, name?: string): Promise<PaystackCustomer> {
    const data = {
      email,
      first_name: name?.split(' ')[0] || '',
      last_name: name?.split(' ').slice(1).join(' ') || '',
    };

    const response = await this.makeRequest('/customer', 'POST', data);
    return response.data;
  }

  async initializeTransaction(data: {
    email: string;
    amount: number;
    reference: string;
    callback_url: string;
    metadata?: Record<string, any>;
  }) {
    const payload = {
      ...data,
      amount: data.amount * 100, // Convert to kobo
      currency: 'NGN',
    };

    const response = await this.makeRequest('/transaction/initialize', 'POST', payload);
    return response.data;
  }

  async verifyTransaction(reference: string): Promise<PaystackTransaction> {
    const response = await this.makeRequest(`/transaction/verify/${reference}`);
    return response.data;
  }

  async createSubscription(data: {
    customer: string;
    plan: string;
    start_date: string;
  }): Promise<PaystackSubscription> {
    const response = await this.makeRequest('/subscription', 'POST', data);
    return response.data;
  }

  async getSubscription(subscriptionId: string): Promise<PaystackSubscription> {
    const response = await this.makeRequest(`/subscription/${subscriptionId}`);
    return response.data;
  }

  async createPlan(data: {
    name: string;
    amount: number;
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
    description?: string;
  }) {
    const payload = {
      ...data,
      amount: data.amount * 100, // Convert to kobo
      currency: 'NGN',
    };

    const response = await this.makeRequest('/plan', 'POST', payload);
    return response.data;
  }

  async getPlans(): Promise<any[]> {
    const response = await this.makeRequest('/plan');
    return response.data;
  }
}

// Default configuration
export const paystackService = new PaystackService({
  secretKey: process.env.PAYSTACK_SECRET_KEY || '',
  publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  baseUrl: 'https://api.paystack.co',
});

