#!/bin/bash

set -e

echo "🚀 Starting Xcode Cloud pre-build script"

# Change to the root directory
cd "$CI_WORKSPACE"

echo "📦 Installing Node.js dependencies..."
npm ci

echo "🔧 Running Expo prebuild to generate iOS project..."
npx expo prebuild --platform ios --clean

echo "📱 Installing CocoaPods dependencies..."
cd ios
pod install --repo-update

echo "✅ Pre-build script completed successfully" 