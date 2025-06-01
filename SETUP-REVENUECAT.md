# RevenueCat Setup Guide for Recipe App

## 🚀 **Your App is Code-Ready! Now Configure RevenueCat Dashboard:**

### **Step 1: RevenueCat Dashboard Setup**

1. **Create RevenueCat Project**

   - Go to https://app.revenuecat.com
   - Create new project: "Recipe App"

2. **Connect to App Store**

   - Navigate to Project Settings → App Store Connect
   - Upload your App Store Connect API Key
   - Select your app bundle ID

3. **Create Products** (In App Store Connect)

   - Monthly: `recipe_premium_monthly` ($2.99/month)
   - Annual: `recipe_premium_annual` ($19.99/year)

4. **Create Entitlement**

   - Name: `premium_access`
   - Description: "Access to all premium recipe features"

5. **Create Offering**

   - Name: `default`
   - Add both monthly and annual products

6. **Get API Keys**
   - iOS: Copy API key to `.env.local`
   - Android: Copy API key to `.env.local`

### **Step 2: Environment Variables**

Update your `.env.local`:

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=rcat_ios_your_actual_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=rcat_android_your_actual_key_here
```

### **Step 3: Test Setup**

1. **Development Testing:**

   ```bash
   npx expo start
   # Test paywall UI and feature gating
   ```

2. **Real Purchase Testing:**
   ```bash
   npx eas build --platform ios --profile preview
   # Upload to TestFlight
   # Test with sandbox Apple ID
   ```

## ✅ **Current Integration Status:**

### **✅ COMPLETE - Code Integration:**

- [x] RevenueCat SDK installed and configured
- [x] SubscriptionContext with entitlement logic
- [x] Paywall component with purchase flow
- [x] Feature gating throughout app
- [x] Premium buttons in headers
- [x] Proper user ID linking

### **⚠️ PENDING - Dashboard Configuration:**

- [ ] RevenueCat project created
- [ ] App Store Connect linked
- [ ] Products created in App Store
- [ ] "premium_access" entitlement configured
- [ ] Default offering created
- [ ] API keys added to environment

## 🎯 **How Entitlements Work:**

1. **User purchases subscription** → RevenueCat processes payment
2. **RevenueCat grants entitlement** → `premium_access` becomes active
3. **App checks entitlements** → `info.entitlements.active["premium_access"]`
4. **Features unlock** → `isPremium = true` throughout app
5. **Premium buttons disappear** → User sees full feature access

## 🧪 **Testing Premium Features:**

Once configured, test this flow:

1. Tap Premium button → Paywall opens
2. Select subscription → Apple/Google payment
3. Purchase completes → Premium features unlock
4. Premium buttons disappear → Full access granted

Your code is production-ready! Just need RevenueCat dashboard setup.
