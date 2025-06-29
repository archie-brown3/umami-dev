#!/bin/bash
set -e

echo "🚀 Post-clone script starting..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install dependencies with clean cache
echo "📦 Installing npm dependencies..."
npm ci --cache /tmp/empty-cache

# Verify environment variables
echo "🔍 Checking environment variables..."
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ ERROR: EXPO_PUBLIC_SUPABASE_URL not set"
  exit 1
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "❌ ERROR: EXPO_PUBLIC_SUPABASE_ANON_KEY not set"
  exit 1
fi

echo "✅ Environment variables validated"

# Prebuild with clean state
echo "🔧 Running Expo prebuild..."
npx expo prebuild --platform ios --clean --no-install

# Install CocoaPods
echo "📱 Installing CocoaPods..."
cd ios
pod install --repo-update
cd ..

echo "✅ Post-clone script completed successfully!"
