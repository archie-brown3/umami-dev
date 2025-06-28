#!/bin/bash

set -e

echo "🚀 [Xcode Cloud] Post-clone script detected and running!"
echo "📍 Current directory: $(pwd)"
echo "📁 Repository contents:"
ls -la

echo "📦 Installing npm dependencies..."
npm ci

echo "🔧 Checking Expo CLI..."
npx expo --version

echo "🔨 Running Expo prebuild for iOS..."
npx expo prebuild --platform ios --clean

echo "📱 Verifying iOS files..."
if [ -d "ios" ]; then
    echo "✅ iOS directory created successfully"
    ls -la ios/
else
    echo "❌ iOS directory not found!"
    exit 1
fi

echo "📲 Installing CocoaPods..."
cd ios
pod install
cd ..

echo "🔍 Verifying CocoaPods configuration..."
if [ -f "ios/Pods/Target Support Files/Pods-Umami/Pods-Umami.debug.xcconfig" ]; then
    echo "✅ CocoaPods configuration created successfully!"
else
    echo "❌ CocoaPods configuration missing!"
    exit 1
fi

echo "🎉 Post-clone script completed successfully!" 