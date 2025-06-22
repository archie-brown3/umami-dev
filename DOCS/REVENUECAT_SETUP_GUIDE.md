# RevenueCat Subscription Implementation Guide

## 🎉 RevenueCat Paywalls vs Custom Implementation

**✅ GREAT NEWS!** RevenueCat's Paywalls are **significantly easier** than building your own paywall. Here's why you should use them:

### RevenueCat Paywalls Advantages:

- 🎨 **Pre-built Templates**: Beautiful, tested paywall templates
- 🔄 **Remote Configuration**: Change designs without app updates
- ⚡ **Native Performance**: Uses native code for smooth UI
- 🧪 **A/B Testing**: Built-in experimentation tools
- 🔧 **Zero Maintenance**: RevenueCat handles all purchase logic
- 📱 **Cross-Platform**: Same paywall works on iOS and Android

## 📋 Implementation Steps

### 1. Set Up RevenueCat Account

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Create a new project: "Umami Recipe App"
3. Add your iOS app (Bundle ID: `com.yourcompany.umami`)
4. Add your Android app (Package Name: `com.yourcompany.umami`)

### 2. Configure App Store Products

**App Store Connect (iOS):**

- Monthly Subscription: `umami_premium_monthly` - $4.99/month
- Annual Subscription: `umami_premium_annual` - $29.99/year

**Google Play Console (Android):**

- Monthly Subscription: `umami_premium_monthly` - $4.99/month
- Annual Subscription: `umami_premium_annual` - $29.99/year

### 3. Set Up RevenueCat Dashboard

1. **Import Products**: Go to Products tab and import your store products
2. **Create Entitlement**: Create "premium_access" entitlement
3. **Attach Products**: Link both subscriptions to the entitlement
4. **Create Offering**: Set up your first offering with both packages
5. **Design Paywall**: Use RevenueCat's paywall editor to create your paywall

### 4. Get API Keys

1. Go to API Keys section in RevenueCat dashboard
2. Copy your iOS API key
3. Copy your Android API key
4. Add them to your `.env` file:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_ios_api_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your_android_api_key_here
```

## 🚀 Implementation Overview

The implementation is **already complete** in your app! Here's what has been set up:

### Core Files Created:

1. **`lib/revenuecat.ts`** - RevenueCat SDK configuration
2. **`context/SubscriptionContext.tsx`** - Subscription state management
3. **`hooks/useFeatureGating.ts`** - Feature gating utilities
4. **`components/subscription/SubscriptionButton.tsx`** - UI components

### Integration in App Layout:

RevenueCat is automatically initialized in `app/_layout.tsx` when the app starts.

## 💡 How to Use RevenueCat Paywalls

### Option 1: Automatic Paywall (Recommended)

```typescript
import { useSubscription } from "@/context/SubscriptionContext";

const MyComponent = () => {
  const { presentPaywallIfNeeded } = useSubscription();

  const handlePremiumFeature = async () => {
    // This automatically shows paywall if user doesn't have access
    const hasAccess = await presentPaywallIfNeeded("recipe_url_extraction");

    if (hasAccess) {
      // User has premium access - proceed with feature
      extractRecipeFromURL();
    }
    // If no access, paywall was shown automatically
  };
};
```

### Option 2: Manual Paywall

```typescript
import { useSubscription } from "@/context/SubscriptionContext";

const MyComponent = () => {
  const { presentPaywall } = useSubscription();

  const showPaywall = async () => {
    // Always shows the paywall
    const purchased = await presentPaywall("unlimited_recipes");

    if (purchased) {
      console.log("User purchased premium!");
    }
  };
};
```

### Option 3: UI Components

```typescript
import {
  SubscriptionButton,
  UpgradeForFeatureButton,
} from "@/components/subscription/SubscriptionButton";

const MyScreen = () => (
  <View>
    {/* General upgrade button */}
    <SubscriptionButton />

    {/* Feature-specific upgrade button */}
    <UpgradeForFeatureButton
      feature="recipe_url_extraction"
      featureName="URL Recipe Import"
    />
  </View>
);
```

## 🔒 Feature Gating Examples

### Recipe Limit Check

```typescript
import { useFeatureGating } from "@/hooks/useFeatureGating";

const AddRecipeScreen = () => {
  const { checkRecipeLimit } = useFeatureGating();

  const handleAddRecipe = async () => {
    const canAdd = await checkRecipeLimit();

    if (canAdd) {
      // Proceed with adding recipe
      createRecipe();
    }
    // Paywall shown automatically if limit exceeded
  };
};
```

### Feature Access Check

```typescript
import { useFeatureGating } from "@/hooks/useFeatureGating";

const URLImportButton = () => {
  const { checkFeatureAccess } = useFeatureGating();

  const handleURLImport = async () => {
    const hasAccess = await checkFeatureAccess("recipe_url_extraction", {
      alertTitle: "Premium Feature",
      alertMessage: "URL recipe import is available for Premium users only!",
    });

    if (hasAccess) {
      // User has access - proceed
      importFromURL();
    }
  };
};
```

## 📊 Subscription Status

### Check Premium Status

```typescript
import { useSubscription } from "@/context/SubscriptionContext";

const ProfileScreen = () => {
  const { isPremium, getRemainingRecipeCount } = useSubscription();

  return (
    <View>
      <Text>Status: {isPremium ? "Premium" : "Free"}</Text>
      {!isPremium && <Text>Recipes: {getRemainingRecipeCount()}/10</Text>}
    </View>
  );
};
```

## 🎨 Paywall Customization

RevenueCat Paywalls can be customized in the dashboard:

1. **Templates**: Choose from pre-built templates
2. **Colors**: Match your app's brand colors
3. **Copy**: Customize all text and messaging
4. **Products**: Control which products to show
5. **A/B Testing**: Test different designs

## 🧪 Testing Your Implementation

### 1. Sandbox Testing

- Use sandbox accounts on iOS/Android
- Test purchase flow and restoration
- Verify premium features unlock

### 2. Development Testing

```bash
# Test with development build
npx expo start
# Press 'i' for iOS simulator

# Test with EAS build
npx eas build --platform ios --profile preview
```

### 3. Feature Gating Tests

- Test free user limits (10 recipes)
- Test premium features are gated
- Test paywall presentation
- Test subscription restoration

## ⚡ Production Deployment

### Ready for TestFlight/App Store

Your app is production-ready! Use EAS builds:

```bash
# TestFlight build
npx eas build --platform ios --profile preview

# App Store build
npx eas build --platform ios --profile production
```

## 🎯 Free vs Premium Features

### Free Tier (10 Recipe Limit):

- ✅ Add up to 10 recipes
- ✅ View and edit recipes
- ✅ Basic meal planning (current week)
- ✅ Manual shopping lists
- ✅ Basic search

### Premium Tier ($4.99/month | $29.99/year):

- ✅ **Unlimited recipes**
- ✅ **Advanced meal planning** (past/future weeks)
- ✅ **URL recipe extraction**
- ✅ **Auto shopping list generation**
- ✅ **Recipe export** (PDF, etc.)
- ✅ **Cross-device sync**
- ✅ **Nutrition analysis**
- ✅ **Bulk import/export**
- ✅ **Premium collections**

## 🔧 Troubleshooting

### Common Issues:

1. **Paywall not showing**: Check API keys in `.env`
2. **Products not found**: Verify store setup and RevenueCat import
3. **Build errors**: Use EAS builds instead of local builds

### Debug Logs:

Check console for RevenueCat logs:

- `[RevenueCat] SDK initialized successfully`
- `[SubscriptionContext] Purchase successful`

## 📚 Additional Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Paywall Templates](https://docs.revenuecat.com/docs/paywalls)
- [React Native Guide](https://docs.revenuecat.com/docs/react-native)

Your RevenueCat implementation is complete and ready to use! 🎉
