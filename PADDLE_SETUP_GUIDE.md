# Paddle Integration Setup Guide

## 🚀 Paddle Configuration

### 1. Create Paddle Account
1. Go to [paddle.com](https://paddle.com)
2. Create a new account or sign in
3. Complete the onboarding process

### 2. Create Products
1. Go to Products in your Paddle dashboard
2. Create a new product called "StudyFlow Pro"
3. Set the price to $29/month (recurring)
4. Copy the Product ID (starts with `pri_`)

### 3. Environment Variables

Add these to your `.env.local` file:

```env
# Paddle Configuration
PADDLE_VENDOR_ID=your_paddle_vendor_id
PADDLE_API_KEY=your_paddle_api_key
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret
PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_PRODUCT_ID=pri_your_product_id

# For production, change to:
# PADDLE_ENVIRONMENT=production
```

### 4. Get Your Paddle Credentials

#### Vendor ID
1. Go to Developer Tools > Authentication in Paddle dashboard
2. Copy your Vendor ID

#### API Key
1. Go to Developer Tools > Authentication
2. Generate a new API key
3. Copy the key (starts with `live_` or `test_`)

#### Webhook Secret
1. Go to Developer Tools > Webhooks
2. Create a new webhook endpoint: `https://yourdomain.com/api/paddle/webhook`
3. Select these events:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`
   - `subscription.past_due`
   - `transaction.completed`
4. Copy the webhook secret

### 5. Test the Integration

#### Sandbox Testing
1. Set `PADDLE_ENVIRONMENT=sandbox`
2. Use Paddle's test card numbers:
   - Success: `4000 0000 0000 0002`
   - Decline: `4000 0000 0000 0003`
   - 3D Secure: `4000 0000 0000 3220`

#### Test Webhook
1. Use Paddle's webhook testing tool
2. Send test events to your webhook endpoint
3. Verify the events are handled correctly

### 6. Production Setup

#### Go Live Checklist
- [ ] Change `PADDLE_ENVIRONMENT=production`
- [ ] Update webhook URL to production domain
- [ ] Test with real payment methods
- [ ] Verify webhook events in production
- [ ] Set up monitoring and alerts

### 7. Paddle Features Used

#### Checkout
- Overlay checkout for seamless UX
- Custom data to track user IDs
- Automatic subscription creation

#### Webhooks
- Real-time subscription updates
- Automatic user status changes
- Billing event handling

#### Customer Portal
- Self-service subscription management
- Payment method updates
- Billing history access

### 8. Integration Points

#### Frontend
- `PaddleCheckout` component for upgrade flows
- `PaddleService` for client-side operations
- Subscription status management

#### Backend
- Webhook handler for server-side events
- Database updates for subscription changes
- User profile management

### 9. Security Considerations

#### Webhook Security
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Validate event data before processing

#### API Security
- Keep API keys secure
- Use environment variables
- Never expose secrets in client code

### 10. Monitoring & Analytics

#### Track These Metrics
- Conversion rate from free to paid
- Churn rate and cancellation reasons
- Revenue per user
- Payment success rates

#### Set Up Alerts
- Failed webhook deliveries
- Payment failures
- Subscription cancellations
- API errors

### 11. Common Issues & Solutions

#### Checkout Not Opening
- Verify Paddle is initialized
- Check product ID is correct
- Ensure user is authenticated

#### Webhook Not Receiving Events
- Check webhook URL is accessible
- Verify webhook secret matches
- Check Paddle dashboard for delivery status

#### Subscription Status Not Updating
- Verify webhook handler is working
- Check database connection
- Review webhook event logs

### 12. Paddle Dashboard Features

#### Analytics
- Revenue tracking
- Conversion metrics
- Customer insights
- Payment analytics

#### Customer Management
- View customer details
- Manage subscriptions
- Handle refunds
- Customer support tools

### 13. Testing Checklist

#### Sandbox Testing
- [ ] Create test subscription
- [ ] Test webhook events
- [ ] Verify database updates
- [ ] Test subscription cancellation
- [ ] Test payment failures

#### Production Testing
- [ ] Test with real payment method
- [ ] Verify webhook in production
- [ ] Test subscription lifecycle
- [ ] Monitor error rates
- [ ] Test customer portal

### 14. Support & Resources

#### Paddle Documentation
- [Paddle API Docs](https://developer.paddle.com/)
- [Webhook Guide](https://developer.paddle.com/webhooks)
- [Checkout Integration](https://developer.paddle.com/guides/checkout)

#### Support Channels
- Paddle Support: support@paddle.com
- Developer Community: [Paddle Community](https://community.paddle.com/)

Your Paddle integration is now ready for production! 🎉

## 🎯 Next Steps

1. **Test thoroughly** in sandbox mode
2. **Set up monitoring** for webhook events
3. **Configure analytics** to track conversions
4. **Go live** with production credentials
5. **Monitor performance** and optimize conversion rates

The integration provides a complete subscription management system with secure payments, automatic billing, and real-time updates.
