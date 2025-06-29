#!/bin/bash
set -e

echo "🚀 Root post-clone script starting..."

# Install npm dependencies
echo "📦 Installing dependencies..."
npm ci

# Run Expo prebuild
echo "🔧 Running prebuild..."
npx expo prebuild --platform ios --clean

# Install CocoaPods
echo "📱 Installing pods..."
cd ios && pod install && cd ..

echo "✅ Root post-clone completed!" 