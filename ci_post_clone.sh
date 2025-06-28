#!/bin/bash

set -e

echo "🚀 [Xcode Cloud] Starting post-clone script..."

# Log environment info
echo "📍 Current directory: $(pwd)"
echo "📁 Directory contents:"
ls -la

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm ci

# Verify Expo CLI is available
echo "🔧 Checking Expo CLI..."
npx expo --version

# Run Expo prebuild to generate iOS project files
echo "🔨 Running Expo prebuild for iOS..."
npx expo prebuild --platform ios --clean

# Verify iOS directory was created
echo "📱 Verifying iOS files were generated..."
if [ -d "ios" ]; then
    echo "✅ iOS directory exists"
    ls -la ios/
else
    echo "❌ iOS directory not found!"
    exit 1
fi

# Verify CocoaPods configuration files exist
echo "🔍 Checking CocoaPods configuration..."
if [ -f "ios/Pods/Target Support Files/Pods-Umami/Pods-Umami.debug.xcconfig" ]; then
    echo "✅ CocoaPods configuration files found"
else
    echo "⚠️  CocoaPods configuration files not found, but this is expected before pod install"
fi

# Install CocoaPods dependencies
echo "📲 Installing CocoaPods dependencies..."
cd ios
pod install --repo-update
cd ..

# Final verification
echo "🔍 Final verification..."
if [ -f "ios/Pods/Target Support Files/Pods-Umami/Pods-Umami.debug.xcconfig" ]; then
    echo "✅ CocoaPods configuration files successfully created"
else
    echo "❌ CocoaPods configuration files still missing!"
    exit 1
fi

echo "🎉 Post-clone script completed successfully!"
echo "📊 Build should now proceed with proper CocoaPods configuration" 