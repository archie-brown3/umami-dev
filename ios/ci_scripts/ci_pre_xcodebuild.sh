#!/bin/bash

set -e

echo "🚀 Starting Xcode Cloud pre-build script"

# Print environment info for debugging
echo "📊 Environment info:"
echo "PWD: $(pwd)"
echo "USER: $USER"
echo "HOME: $HOME"
echo "CI_WORKSPACE: $CI_WORKSPACE"

# Change to the root directory
cd "$CI_WORKSPACE"
echo "Changed to workspace: $(pwd)"

# Try to find and use Node.js
echo "🔍 Looking for Node.js..."
NODE_PATH=""
if command -v node >/dev/null 2>&1; then
    NODE_PATH=$(command -v node)
    echo "✅ Found Node.js at: $NODE_PATH"
elif [ -f "/usr/local/bin/node" ]; then
    NODE_PATH="/usr/local/bin/node"
    echo "✅ Found Node.js at: $NODE_PATH"
elif [ -f "/opt/homebrew/bin/node" ]; then
    NODE_PATH="/opt/homebrew/bin/node"
    echo "✅ Found Node.js at: $NODE_PATH"
else
    echo "❌ Node.js not found"
    exit 1
fi

# Get npm path
NPM_PATH=""
if command -v npm >/dev/null 2>&1; then
    NPM_PATH=$(command -v npm)
    echo "✅ Found npm at: $NPM_PATH"
elif [ -f "/usr/local/bin/npm" ]; then
    NPM_PATH="/usr/local/bin/npm"
    echo "✅ Found npm at: $NPM_PATH"
elif [ -f "/opt/homebrew/bin/npm" ]; then
    NPM_PATH="/opt/homebrew/bin/npm"
    echo "✅ Found npm at: $NPM_PATH"
else
    echo "❌ npm not found"
    exit 1
fi

# Get pod path
POD_PATH=""
if command -v pod >/dev/null 2>&1; then
    POD_PATH=$(command -v pod)
    echo "✅ Found CocoaPods at: $POD_PATH"
elif [ -f "/usr/local/bin/pod" ]; then
    POD_PATH="/usr/local/bin/pod"
    echo "✅ Found CocoaPods at: $POD_PATH"
elif [ -f "/opt/homebrew/bin/pod" ]; then
    POD_PATH="/opt/homebrew/bin/pod"
    echo "✅ Found CocoaPods at: $POD_PATH"
else
    echo "❌ CocoaPods not found"
    exit 1
fi

# Print versions
echo "Node version: $($NODE_PATH --version)"
echo "npm version: $($NPM_PATH --version)"
echo "CocoaPods version: $($POD_PATH --version)"

echo "📦 Installing Node.js dependencies..."
$NPM_PATH ci

echo "🔧 Running Expo prebuild to generate iOS project..."
$NPM_PATH exec expo prebuild --platform ios --clean

echo "📱 Installing CocoaPods dependencies..."
cd ios
$POD_PATH install --repo-update

echo "✅ Pre-build script completed successfully" 