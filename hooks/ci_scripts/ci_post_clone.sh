#!/bin/bash
set -e

echo "🔥 FORCING COMPLETE REBUILD FOR XCODE CLOUD"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Clean everything
echo "🧹 Cleaning build artifacts..."
rm -rf ios/build
rm -rf node_modules/.cache
rm -rf ~/.expo/cache

# Force prebuild
echo "🔧 Force prebuilding..."
npx expo prebuild --platform ios --clean --clear

# Install pods with update
echo "📱 Installing pods with repo update..."
cd ios
rm -rf Pods Podfile.lock build
pod install --repo-update
cd ..

echo "✅ Complete rebuild finished!" 