import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-service';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('paddle-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = verifyPaddleSignature(body, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Paddle webhook event:', event);

    // Handle different event types
    switch (event.event_type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.data);
        break;
      case 'subscription.past_due':
        await handleSubscriptionPastDue(event.data);
        break;
      case 'transaction.completed':
        await handleTransactionCompleted(event.data);
        break;
      default:
        console.log('Unhandled Paddle event:', event.event_type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Paddle webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function verifyPaddleSignature(body: string, signature: string): boolean {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('PADDLE_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

async function handleSubscriptionCreated(data: any) {
  try {
    const userId = data.custom_data?.user_id;
    if (!userId) {
      console.error('No user_id in subscription data');
      return;
    }

    await DatabaseService.updateUserProfile(userId, {
      is_premium: true,
      subscription_status: 'active',
      subscription_id: data.id,
      subscription_end_date: data.next_billed_at ? new Date(data.next_billed_at) : undefined,
    });

    console.log('Subscription created for user:', userId);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(data: any) {
  try {
    const userId = data.custom_data?.user_id;
    if (!userId) {
      console.error('No user_id in subscription data');
      return;
    }

    await DatabaseService.updateUserProfile(userId, {
      subscription_status: data.status,
      subscription_end_date: data.next_billed_at ? new Date(data.next_billed_at) : undefined,
    });

    console.log('Subscription updated for user:', userId);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionCancelled(data: any) {
  try {
    const userId = data.custom_data?.user_id;
    if (!userId) {
      console.error('No user_id in subscription data');
      return;
    }

    await DatabaseService.updateUserProfile(userId, {
      is_premium: false,
      subscription_status: 'cancelled',
      subscription_end_date: data.cancel_at ? new Date(data.cancel_at) : undefined,
    });

    console.log('Subscription cancelled for user:', userId);
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

async function handleSubscriptionPastDue(data: any) {
  try {
    const userId = data.custom_data?.user_id;
    if (!userId) {
      console.error('No user_id in subscription data');
      return;
    }

    await DatabaseService.updateUserProfile(userId, {
      subscription_status: 'past_due',
    });

    console.log('Subscription past due for user:', userId);
  } catch (error) {
    console.error('Error handling subscription past due:', error);
  }
}

async function handleTransactionCompleted(data: any) {
  try {
    const userId = data.custom_data?.user_id;
    if (!userId) {
      console.error('No user_id in transaction data');
      return;
    }

    // Update user to premium if transaction is successful
    if (data.status === 'completed') {
      await DatabaseService.updateUserProfile(userId, {
        is_premium: true,
        subscription_status: 'active',
      });
    }

    console.log('Transaction completed for user:', userId);
  } catch (error) {
    console.error('Error handling transaction completed:', error);
  }
}
