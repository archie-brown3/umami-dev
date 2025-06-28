#!/bin/bash

set -e

echo "🚀 Starting Xcode Cloud post-clone script..."
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo "📦 Installing npm dependencies..."
npm ci

echo "🔧 Running Expo prebuild..."
npx expo prebuild --platform ios --clean

echo "📱 Installing CocoaPods..."
cd ios
pod install
cd ..

echo "✅ Post-clone script completed successfully!"
echo "Final verification:"
ls -la ios/
echo "Checking for critical files:"
ls -la ios/Pods/Target\ Support\ Files/Pods-Umami/ || echo "CocoaPods files not found"

echo "🎯 Ready for Xcode build!"
