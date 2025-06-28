#!/bin/bash

set -e

echo "🚀 [Xcode Cloud] Post-clone script starting..."
echo "📍 Working directory: $(pwd)"
echo "📁 Repository structure:"
ls -la

echo "📦 Installing npm dependencies..."
npm ci

echo "🔧 Verifying Expo CLI..."
npx expo --version

echo "🔨 Generating iOS project with Expo prebuild..."
npx expo prebuild --platform ios --clean

echo "📱 Verifying iOS project generation..."
if [ -d "ios" ]; then
    echo "✅ iOS directory exists"
    ls -la ios/
else
    echo "❌ ERROR: iOS directory not created!"
    exit 1
fi

echo "📲 Installing CocoaPods dependencies..."
cd ios
pod install
cd ..

echo "🔍 Final verification of CocoaPods configuration..."
if [ -f "ios/Pods/Target Support Files/Pods-Umami/Pods-Umami.debug.xcconfig" ]; then
    echo "✅ SUCCESS: CocoaPods configuration files created!"
else
    echo "❌ ERROR: CocoaPods configuration files missing!"
    exit 1
fi

echo "🎉 Post-clone script completed successfully!" 