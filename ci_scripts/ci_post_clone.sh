#!/bin/bash
set -e

echo "Post-clone script starting"

# Install dependencies
npm ci

# Prebuild
npx expo prebuild --platform ios --clean

# Install pods
cd ios
pod install
cd ..

echo "Post-clone script completed"
