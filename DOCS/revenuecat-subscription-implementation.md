# RevenueCat Subscription Implementation Guide

## What is RevenueCat?

RevenueCat is a service that makes it easy to add subscriptions and in-app purchases to your mobile app. Think of it as a middleman that handles all the complicated subscription logic so you don't have to deal with Apple's and Google's complex payment systems directly.

### Why Use RevenueCat?

- **Simplified Integration**: Instead of learning Apple's StoreKit and Google's Billing Library, you use one simple SDK
- **Cross-Platform**: Works on both iOS and Android with the same code
- **Analytics**: See how much money you're making and which features users love
- **Server Validation**: Prevents piracy and subscription fraud
- **Customer Support**: Built-in tools to help users with subscription issues

## Umami App Subscription Strategy

### Free Tier (Basic Users)

Free users can use the core recipe management features but with limitations:

**What Free Users CAN Do:**

- Add up to 10 recipes
- View and edit their recipes
- Basic meal planning (current week only)
- Manual shopping list creation
- Basic recipe search and filtering

**What Free Users CANNOT Do:**

- Add unlimited recipes (limited to 10)
- Access advanced meal planning (past/future weeks)
- Generate shopping lists from meal plans
- Use recipe text extraction from URLs
- Export recipes or meal plans
- Sync across multiple devices
- Access premium recipe collections
- Use advanced search filters
- Access nutrition analysis features
- Use bulk import/export features

### Premium Tier ($4.99/month or $29.99/year)

Premium users get access to all features:

**Premium Features:**

- Unlimited recipe storage
- Advanced meal planning (unlimited date ranges)
- Automatic shopping list generation from meal plans
- Recipe extraction from any URL
- Cross-device sync with cloud backup
- Export recipes to PDF or other formats
- Premium recipe collections and recommendations
- Advanced search and filtering options
- Nutrition analysis and tracking
- Bulk import/export capabilities
- Priority customer support
- Early access to new features

## Implementation Steps

### 1. Set Up RevenueCat Account

1. Go to [RevenueCat.com](https://www.revenuecat.com) and create an account
2. Create a new project called "Umami Recipe App"
3. Add your iOS app (Bundle ID: `com.yourcompany.umami`)
4. Add your Android app (Package Name: `com.yourcompany.umami`)
5. Configure your App Store Connect and Google Play Console connections

### 2. Install RevenueCat SDK

```bash
npm install react-native-purchases
cd ios && pod install
```

### 3. Create Products in App Stores

**App Store Connect (iOS):**

- Monthly Subscription: `umami_premium_monthly` - $4.99/month
- Annual Subscription: `umami_premium_annual` - $29.99/year

**Google Play Console (Android):**

- Monthly Subscription: `umami_premium_monthly` - $4.99/month
- Annual Subscription: `umami_premium_annual` - $29.99/year

### 4. Configure RevenueCat Dashboard

1. Add the product IDs you created in the app stores
2. Create an Entitlement called "premium_access"
3. Attach both subscription products to this entitlement
4. Set up webhook endpoints (optional, for server-side validation)

### 5. Code Implementation

#### A. Initialize RevenueCat

```typescript
// services/subscriptionService.ts
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

const REVENUECAT_API_KEY = {
  ios: "your_ios_api_key_here",
  android: "your_android_api_key_here",
};

export const initializeRevenueCat = async (userId?: string) => {
  try {
    await Purchases.configure({
      apiKey:
        Platform.OS === "ios"
          ? REVENUECAT_API_KEY.ios
          : REVENUECAT_API_KEY.android,
      appUserID: userId, // Optional: link to your user system
    });

    console.log("RevenueCat initialized successfully");
  } catch (error) {
    console.error("Failed to initialize RevenueCat:", error);
  }
};
```

#### B. Create Subscription Context

```typescript
// context/SubscriptionContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import Purchases, { CustomerInfo } from "react-native-purchases";
import { useAuth } from "./AuthContext";

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: any;
  purchasePackage: (packageToPurchase: any) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      initializeRevenueCat(user.id);
      checkSubscriptionStatus();
      loadOfferings();
    }
  }, [user?.id]);

  const checkSubscriptionStatus = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      // Check if user has premium entitlement
      const hasPremium =
        info.entitlements.active["premium_access"] !== undefined;
      setIsPremium(hasPremium);
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      setOfferings(offerings);
    } catch (error) {
      console.error("Error loading offerings:", error);
    }
  };

  const purchasePackage = async (packageToPurchase: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { customerInfo } = await Purchases.purchasePackage(
        packageToPurchase
      );
      setCustomerInfo(customerInfo);

      const hasPremium =
        customerInfo.entitlements.active["premium_access"] !== undefined;
      setIsPremium(hasPremium);
      return hasPremium;
    } catch (error) {
      console.error("Error purchasing package:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);

      const hasPremium =
        info.entitlements.active["premium_access"] !== undefined;
      setIsPremium(hasPremium);
      return hasPremium;
    } catch (error) {
      console.error("Error restoring purchases:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        customerInfo,
        offerings,
        purchasePackage,
        restorePurchases,
        checkSubscriptionStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
};
```

#### C. Create Paywall Component

```typescript
// components/subscription/Paywall.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSubscription } from "@/context/SubscriptionContext";

interface PaywallProps {
  feature: string;
  onClose: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ feature, onClose }) => {
  const { offerings, purchasePackage, isLoading } = useSubscription();

  const handlePurchase = async (packageToPurchase: any) => {
    const success = await purchasePackage(packageToPurchase);
    if (success) {
      onClose();
    }
  };

  if (!offerings?.current) {
    return <Text>Loading subscription options...</Text>;
  }

  const monthlyPackage = offerings.current.monthly;
  const annualPackage = offerings.current.annual;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock {feature}</Text>
      <Text style={styles.subtitle}>
        Upgrade to Premium to access this feature and many more!
      </Text>

      <View style={styles.packagesContainer}>
        {annualPackage && (
          <TouchableOpacity
            style={[styles.packageButton, styles.popularPackage]}
            onPress={() => handlePurchase(annualPackage)}
            disabled={isLoading}
          >
            <Text style={styles.popularBadge}>MOST POPULAR</Text>
            <Text style={styles.packageTitle}>Annual Plan</Text>
            <Text style={styles.packagePrice}>$29.99/year</Text>
            <Text style={styles.packageSavings}>Save 50%!</Text>
          </TouchableOpacity>
        )}

        {monthlyPackage && (
          <TouchableOpacity
            style={styles.packageButton}
            onPress={() => handlePurchase(monthlyPackage)}
            disabled={isLoading}
          >
            <Text style={styles.packageTitle}>Monthly Plan</Text>
            <Text style={styles.packagePrice}>$4.99/month</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Maybe Later</Text>
      </TouchableOpacity>
    </View>
  );
};
```

#### D. Feature Gating Logic

```typescript
// hooks/useFeatureGating.ts
import { useSubscription } from "@/context/SubscriptionContext";
import { useState } from "react";

export const useFeatureGating = () => {
  const { isPremium } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");

  const checkFeatureAccess = (feature: string): boolean => {
    if (isPremium) return true;

    // Show paywall for premium features
    setBlockedFeature(feature);
    setShowPaywall(true);
    return false;
  };

  const checkRecipeLimit = (currentCount: number): boolean => {
    if (isPremium) return true;

    if (currentCount >= 10) {
      setBlockedFeature("unlimited recipes");
      setShowPaywall(true);
      return false;
    }

    return true;
  };

  return {
    isPremium,
    showPaywall,
    blockedFeature,
    setShowPaywall,
    checkFeatureAccess,
    checkRecipeLimit,
  };
};
```

### 6. Integration Points in Your App

#### Recipe Creation Limit

```typescript
// In AddRecipe component
const { checkRecipeLimit } = useFeatureGating();

const handleAddRecipe = () => {
  if (!checkRecipeLimit(recipes.length)) {
    return; // Paywall will show automatically
  }

  // Proceed with recipe creation
  addRecipe(recipeData);
};
```

#### URL Extraction Feature

```typescript
// In URLExtraction component
const { checkFeatureAccess } = useFeatureGating();

const handleExtractFromURL = () => {
  if (!checkFeatureAccess("recipe URL extraction")) {
    return; // Paywall will show
  }

  // Proceed with URL extraction
  extractRecipeFromUrl(url);
};
```

#### Advanced Meal Planning

```typescript
// In MealPlan component
const { checkFeatureAccess } = useFeatureGating();

const handleDateChange = (date: Date) => {
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneWeekAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (date < oneWeekAgo || date > oneWeekAhead) {
    if (!checkFeatureAccess("advanced meal planning")) {
      return; // Paywall will show
    }
  }

  // Proceed with date change
  setSelectedDate(date);
};
```

## Testing Your Implementation

### 1. Sandbox Testing

- Use sandbox accounts for testing subscriptions
- Test purchase flow, restoration, and cancellation
- Verify that premium features unlock correctly

### 2. Feature Gating Tests

- Test that free users hit paywalls at the right times
- Verify premium users can access all features
- Test subscription restoration on new devices

### 3. Edge Cases

- Test offline behavior
- Test subscription expiration
- Test failed payments and renewals

## Best Practices

### 1. User Experience

- Don't spam users with paywalls
- Show value before asking for payment
- Provide clear benefits for upgrading
- Allow users to try premium features briefly

### 2. Error Handling

- Handle network errors gracefully
- Provide clear error messages
- Offer alternative actions when purchases fail

### 3. Analytics

- Track which features drive conversions
- Monitor subscription retention rates
- A/B test different paywall designs

## Revenue Optimization Tips

1. **Free Trial**: Offer 7-day free trial for premium features
2. **Feature Previews**: Let users see premium features but limit usage
3. **Timing**: Show paywall when users are most engaged
4. **Social Proof**: Show how many users upgraded
5. **Urgency**: Limited-time offers for new users

## Maintenance and Updates

- Monitor RevenueCat dashboard regularly
- Update subscription prices seasonally
- Add new premium features based on user feedback
- Keep subscription logic updated with app store changes

## Common Pitfalls to Avoid

1. **Don't** make basic features premium (like viewing recipes)
2. **Don't** show paywalls immediately on app open
3. **Don't** forget to handle subscription restoration
4. **Don't** ignore failed payment notifications
5. **Don't** make the free tier completely useless

## Support and Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [React Native Purchases Guide](https://docs.revenuecat.com/docs/react-native)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Billing Policies](https://play.google.com/about/developer-content-policy/)

This implementation will help you monetize your Umami recipe app while providing a great user experience for both free and premium users!
