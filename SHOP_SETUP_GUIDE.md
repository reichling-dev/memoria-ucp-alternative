# Shop & Pricing Setup Guide

## 🎯 Overview

Your application now has a complete shop/pricing system with PayPal integration! Users can purchase in-game coins, premium subscriptions, and cosmetics.

## 📁 New Files Created

### Pages
- **`/pricing`** - Main shop page where users browse and purchase items
- **`/admin/transactions`** - Admin dashboard to view all payments

### API Routes
- **`/api/payments/create-order`** - Creates PayPal orders
- **`/api/payments/capture`** - Captures and confirms payments
- **`/api/payments/transactions`** - Lists all transactions (admin)

### Configuration
- **`src/lib/config.ts`** - Updated with shop products and PayPal config

## 🔧 Setup Instructions

### Step 1: Get PayPal API Credentials

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Create a new app/project
3. Copy your **Client ID** (looks like a long string)
4. Generate a **Secret** key (will be hidden after first view)

### Step 2: Set Environment Variables

Add these to your `.env.local` file:

```env
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=YOUR_CLIENT_ID_HERE
PAYPAL_SECRET=YOUR_SECRET_HERE

# Optional: Discord webhook for payment notifications
DISCORD_PAYMENT_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

### Step 3: Restart Your Application

After adding env variables, restart the Next.js server:

```bash
npm run dev
```

## 📦 Available Products

### Coins Packages
- **100 Coins** - $4.99
- **500 Coins** - $19.99 (+ 50 bonus)
- **1000 Coins** - $34.99 (+ 200 bonus) ⭐
- **5000 Coins** - $149.99 (+ 1000 bonus)

### Premium Subscriptions
- **1 Month** - $9.99
- **3 Months** - $24.99 (+ 2 months bonus) ⭐
- **1 Year** - $79.99 (+ 6 months bonus)

### Bundle Deals
- **Starter Bundle** - $29.99 (500 coins + 1 month premium)
- **Ultimate Bundle** - $89.99 (2000 coins + 3 months premium) ⭐

## 🛠️ Customizing Products

Edit products in `src/lib/config.ts`:

```typescript
export const shopConfig: ShopConfig = {
  enabled: true,
  paypal: {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    enabled: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  },
  products: [
    // Add your products here
    {
      id: 'coins-100',
      name: '100 Coins',
      description: 'Small starter pack of coins',
      price: 4.99,
      currency: 'USD',
      icon: '💰',
      category: 'coins',
      features: ['100 In-Game Coins', 'Instant Delivery', '7-Day Support'],
    },
    // ... more products
  ],
}
```

## 💳 Payment Flow

1. **User Clicks "Buy Now"**
   - User must be signed in
   - Payment details collected

2. **Order Created**
   - Creates PayPal order
   - Order record saved locally

3. **User Approves Payment**
   - Redirected to PayPal checkout
   - User enters payment info

4. **Payment Captured**
   - PayPal confirms payment
   - Transaction recorded
   - Discord notification sent (if webhook configured)

5. **Success Confirmation**
   - User sees confirmation page
   - Transaction saved in admin panel

## 📊 Admin Dashboard

### Viewing Transactions

1. Go to **Admin Panel** → **Transactions**
2. View all payments made:
   - Order ID
   - Product purchased
   - User ID
   - Amount paid
   - Payment status
   - Timestamp

3. **Search/Filter** by:
   - Order ID
   - User ID
   - Email
   - Product ID

4. **Export** transaction data

## 🔔 Discord Notifications

When enabled, the system sends notifications to Discord:

```
💰 New Payment Received
Order ID: order_1704994800000_abc123def456
Amount: $19.99 USD
Product ID: coins-500
User ID: 988722788292526099
Payer Email: user@example.com
Status: completed
```

### Setting Up Discord Webhook

1. In your Discord server, right-click channel → **Edit Channel**
2. Go to **Integrations** → **Webhooks**
3. Create a new webhook and copy the URL
4. Add to `.env.local`:
   ```env
   DISCORD_PAYMENT_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```

## 📁 Data Storage

Transactions are stored in JSON files:

- **Orders:** `data/orders.json`
- **Transactions:** `data/transactions.json`

⚠️ **Production Note:** For production, consider using a proper database instead of JSON files.

## 🔐 Security Considerations

✅ **Implemented:**
- PayPal payment verification
- User authentication required
- Order validation
- Secure transaction recording

⚠️ **To Do for Production:**
- Migrate to database (PostgreSQL, MongoDB, etc.)
- Add payment webhook verification signatures
- Implement rate limiting
- Add fraud detection
- Use environment-based URLs instead of hardcoded
- Add transaction logging/auditing

## 🐛 Troubleshooting

### PayPal Integration Not Working

1. **Check env variables** - Make sure `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set
2. **Verify credentials** - Test in PayPal sandbox first
3. **Check webhook URL** - PayPal must be able to reach your server
4. **Review logs** - Check browser console and server logs for errors

### Transactions Not Saving

1. Check `data/` directory exists
2. Ensure file write permissions
3. Check browser dev tools Network tab

### Discord Notifications Not Sending

1. Verify webhook URL is correct
2. Check webhook permissions in Discord
3. Ensure channel still exists
4. Check server logs for errors

## 📈 Next Features to Add

- 🎁 Gift cards
- 📈 Sales/discount codes
- 📊 Sales analytics
- 🔄 Refund system
- 💳 Stripe integration (alternative payment)
- 📧 Email receipts
- 🏪 User purchase history
- ⭐ Product recommendations

## 📞 Support

For PayPal integration help: https://developer.paypal.com/docs/
For Next.js issues: https://nextjs.org/docs

---

**Setup Complete!** 🎉

Users can now visit `/pricing` to browse and purchase items, and admins can view all transactions in the admin panel.
