# Production Readiness Tasks - Authentication & Subscriptions

## Current Status

- Build infrastructure is excellent (EAS builds working)
- Basic Supabase and RevenueCat implementations exist but need verification
- Apple Sign In partially implemented
- Email/password auth needs implementation
- RevenueCat subscription flow needs testing

## Task Breakdown

### 1. Email/Password Authentication

- [ ] **Setup Tasks**

  - [ ] Configure Supabase project settings for email auth
  - [ ] Set up email templates in Supabase dashboard
  - [ ] Configure password policies

- [ ] **Implementation Tasks**

  - [ ] Create AuthEmailPassword component
  - [ ] Implement form validation
  - [ ] Add error handling
  - [ ] Create password reset flow
  - [ ] Add email verification flow

- [ ] **Testing Tasks**
  - [ ] Test sign up flow
  - [ ] Test sign in flow
  - [ ] Test password reset
  - [ ] Test email verification
  - [ ] Test error states
  - [ ] Test network error handling

### 2. Apple Sign In

- [ ] **Setup Tasks**

  - [ ] Verify Apple Developer account status
  - [ ] Configure Associated Domains capability
  - [ ] Set up Sign in with Apple in App Store Connect
  - [ ] Update Supabase OAuth settings

- [ ] **Implementation Tasks**

  - [ ] Verify AppleAuthService implementation
  - [ ] Add proper error handling
  - [ ] Implement user data persistence
  - [ ] Add session management

- [ ] **Testing Tasks**
  - [ ] Test on physical iOS device
  - [ ] Test on iOS simulator
  - [ ] Test sign in flow
  - [ ] Test sign out flow
  - [ ] Test session persistence
  - [ ] Test error scenarios

### 3. RevenueCat Subscriptions

- [ ] **Setup Tasks**

  - [ ] Configure products in App Store Connect
    - Monthly: umami_premium_monthly ($4.99)
    - Annual: umami_premium_annual ($29.99)
  - [ ] Set up RevenueCat dashboard
  - [ ] Configure webhooks
  - [ ] Set up sandbox testing accounts

- [ ] **Implementation Tasks**

  - [ ] Verify RevenueCat initialization
  - [ ] Implement subscription purchase flow
  - [ ] Add restore purchases functionality
  - [ ] Implement receipt validation
  - [ ] Add subscription status tracking

- [ ] **Testing Tasks**
  - [ ] Test purchase flow with sandbox account
  - [ ] Test subscription renewal
  - [ ] Test subscription cancellation
  - [ ] Test restore purchases
  - [ ] Test offline behavior
  - [ ] Test receipt validation

### 4. Integration Testing

- [ ] **Auth Flow Testing**

  - [ ] Test auth state persistence
  - [ ] Test switching between auth methods
  - [ ] Test deep linking
  - [ ] Test session expiry handling

- [ ] **Subscription Integration**
  - [ ] Test subscription state after auth method switch
  - [ ] Test purchase flow with different auth methods
  - [ ] Verify subscription status persistence

### 5. Production Environment Setup

- [ ] **Environment Variables**

  - [ ] Set up production Supabase project
  - [ ] Configure production RevenueCat keys
  - [ ] Set up proper key management in EAS

- [ ] **Analytics & Monitoring**
  - [ ] Set up error tracking
  - [ ] Configure analytics for auth flows
  - [ ] Set up subscription tracking
  - [ ] Configure crash reporting

### 6. Documentation

- [ ] **User Documentation**

  - [ ] Document sign-up process
  - [ ] Document subscription management
  - [ ] Create troubleshooting guide

- [ ] **Developer Documentation**
  - [ ] Document auth implementation
  - [ ] Document subscription implementation
  - [ ] Add deployment guide

## Required Environment Variables

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_production_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_key

# RevenueCat
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_ios_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_key

# Apple Sign In (if needed)
EXPO_PUBLIC_APPLE_SERVICE_ID=your_service_id
```

## Testing Credentials

- **Supabase Project**: [Add your project reference]
- **RevenueCat API Key**: appl_PabMdDPuoCIpyQwQAFPLodjCsdG
- **Bundle ID**: [Add your bundle ID]

## Build Commands

```bash
# Development
npx expo start

# TestFlight Build
npx eas build --platform ios --profile preview

# Production Build
npx eas build --platform ios --profile production
```

## Next Steps

1. Start with email/password authentication implementation
2. Move to Apple Sign In verification
3. Implement RevenueCat subscription flow
4. Perform integration testing
5. Deploy to TestFlight for beta testing
6. Prepare for App Store submission
