# 🚀 TestFlight Deployment Guide

## Quick Start (Currently Running)

✅ **EAS Build is now creating your TestFlight build!**

```bash
# Currently executing:
npx eas build --platform ios --profile preview
```

## Complete TestFlight Process

### Step 1: Build for TestFlight ✅ IN PROGRESS

```bash
npx eas build --platform ios --profile preview
```

**What this does:**

- Creates an iOS .ipa file optimized for distribution
- Uses Apple's cloud build servers
- Takes 10-15 minutes
- Automatically signs with your Apple Developer certificates

### Step 2: Submit to App Store Connect

Once the build completes, you'll see a link like:

```
✅ Build completed!
🔗 https://expo.dev/builds/xyz123
```

**Submit the build:**

```bash
npx eas submit --platform ios --latest
```

**OR submit manually:**

1. Download the .ipa from the EAS build page
2. Upload to App Store Connect via Xcode or Transporter

### Step 3: Configure TestFlight

1. **Go to App Store Connect**: https://appstoreconnect.apple.com
2. **Select your app** (or create if first time)
3. **Go to TestFlight tab**
4. **Select the build** you just uploaded
5. **Add test information:**
   - What to test
   - App description
   - Test notes
6. **Add internal testers** (up to 100)
7. **Submit for review** (external testers require Apple review)

### Step 4: Invite Testers

**Internal Testers (No Review Required):**

- Up to 100 testers
- Must be added to your Apple Developer team
- Get access immediately after upload

**External Testers (Apple Review Required):**

- Up to 10,000 testers
- Anyone with email address
- Requires Apple review (1-3 days)

## App Store Connect Setup

### First Time Setup

1. **Apple Developer Account**: https://developer.apple.com
2. **Create App ID**:
   - Bundle ID: `io.recipesaver.app` (matches your app.json)
   - Name: "Umami Recipe App"
3. **App Store Connect**: Create new app with same bundle ID

### Certificate Management

EAS handles certificates automatically, but if needed:

```bash
# View certificates
npx eas credentials

# Configure if needed
npx eas credentials:configure
```

## Build Profiles Explained

Your `eas.json` has three profiles:

### `development`

```bash
npx eas build --platform ios --profile development
```

- For testing native features during development
- Not for TestFlight

### `preview` ✅ CURRENT

```bash
npx eas build --platform ios --profile preview
```

- **Perfect for TestFlight**
- Internal distribution
- Production-like but allows testing

### `production`

```bash
npx eas build --platform ios --profile production
```

- For final App Store submission
- Production build

## Next Steps After Build Completes

1. **Check build status:**

   ```bash
   npx eas build:list
   ```

2. **Download build (optional):**

   - Go to the build URL shown
   - Download .ipa if needed

3. **Submit to TestFlight:**

   ```bash
   npx eas submit --platform ios --latest
   ```

4. **Monitor progress:**
   - App Store Connect → TestFlight
   - Check processing status

## Troubleshooting

### Apple Developer Setup Required

- **Apple Developer Program**: $99/year membership required
- **Certificates**: EAS creates automatically
- **Bundle ID**: Must match `io.recipesaver.app`

### Common Issues

- **Bundle ID mismatch**: Update in App Store Connect
- **Certificate issues**: Run `npx eas credentials`
- **Build failures**: Check logs in EAS dashboard

## TestFlight Benefits

✅ **Real device testing**
✅ **Crash reporting**  
✅ **Analytics**
✅ **Multiple versions**
✅ **User feedback**
✅ **Beta distribution**

## Timeline

- **EAS Build**: 10-15 minutes ⏱️
- **App Store processing**: 5-30 minutes
- **TestFlight available**: Immediately for internal testers
- **External review**: 1-3 days (if needed)

Your app is **production-ready** with excellent build infrastructure! 🎉

## Current Status

✅ **EAS configured**
✅ **Build in progress**
⏳ **Waiting for completion**
📱 **Ready for TestFlight**
