#!/bin/bash
set -e

echo "Pre-xcodebuild script starting"

# Ensure we're in the correct directory
cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install npm dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm ci
fi

# Run Expo prebuild if iOS directory is not properly configured
if [ ! -f "ios/Pods/Pods.xcodeproj/project.pbxproj" ]; then
    echo "Running Expo prebuild..."
    npx expo prebuild --platform ios --clean
    
    echo "Installing CocoaPods..."
    cd ios
    pod install
    cd ..
fi

echo "Pre-xcodebuild script completed" 