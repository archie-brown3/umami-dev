#!/bin/bash

set -e

echo "🚀 Starting Xcode Cloud pre-build script"

# Print environment info for debugging
echo "📊 Environment info:"
echo "PWD: $(pwd)"
echo "USER: $USER"
echo "HOME: $HOME"
echo "CI_WORKSPACE: $CI_WORKSPACE"

# Determine the correct workspace directory
WORKSPACE_DIR=""
if [ -n "$CI_WORKSPACE" ]; then
    WORKSPACE_DIR="$CI_WORKSPACE"
elif [ -d "/Volumes/workspace/repository" ]; then
    WORKSPACE_DIR="/Volumes/workspace/repository"
else
    # Fallback: go up two directories from the script location
    WORKSPACE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
fi

echo "Using workspace directory: $WORKSPACE_DIR"

# Change to the root directory
cd "$WORKSPACE_DIR"
echo "Changed to workspace: $(pwd)"

# List contents to verify we're in the right place
echo "📁 Workspace contents:"
ls -la

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in $(pwd)"
    echo "📁 Current directory contents:"
    ls -la
    exit 1
fi

# Set up Node.js environment
echo "🔧 Setting up Node.js environment..."
export PATH="/usr/local/bin:/opt/homebrew/bin:/Users/local/Homebrew/bin:/usr/bin:/bin:$PATH"

# Find Node.js
NODE_PATH=""
if command -v node >/dev/null 2>&1; then
    NODE_PATH=$(command -v node)
    echo "✅ Found Node.js at: $NODE_PATH"
else
    echo "❌ Node.js not found"
    exit 1
fi

# Find npm
NPM_PATH=""
if command -v npm >/dev/null 2>&1; then
    NPM_PATH=$(command -v npm)
    echo "✅ Found npm at: $NPM_PATH"
else
    echo "❌ npm not found"
    exit 1
fi

# Find npx
NPX_PATH=""
if command -v npx >/dev/null 2>&1; then
    NPX_PATH=$(command -v npx)
    echo "✅ Found npx at: $NPX_PATH"
else
    echo "❌ npx not found"
    exit 1
fi

# Print versions
echo "📦 Tool versions:"
echo "Node: $($NODE_PATH --version)"
echo "npm: $($NPM_PATH --version)"
echo "npx: $($NPX_PATH --version)"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
$NPM_PATH ci

# Set up CI environment variables
echo "🔧 Setting up CI environment variables..."
export CI=1
export EXPO_NO_TELEMETRY=1
export EXPO_NO_DOCTOR=1
export EXPO_BETA=0
export NODE_ENV=production

# Run Expo prebuild to generate iOS project
echo "🔧 Running Expo prebuild to generate iOS project..."
$NPX_PATH expo prebuild --platform ios --clean --non-interactive

# Change to iOS directory
cd ios
echo "📱 Changed to iOS directory: $(pwd)"

# Check if CocoaPods is available
POD_PATH=""
if command -v pod >/dev/null 2>&1; then
    POD_PATH=$(command -v pod)
    echo "✅ Found CocoaPods at: $POD_PATH"
else
    echo "❌ CocoaPods not found"
    exit 1
fi

echo "CocoaPods version: $($POD_PATH --version)"

# Clean any existing Pods installation
echo "🧹 Cleaning existing Pods installation..."
rm -rf Pods
rm -f Podfile.lock

# Install CocoaPods dependencies
echo "📱 Installing CocoaPods dependencies..."
$POD_PATH install --repo-update --verbose

# Verify that the xcconfig files were created
echo "🔍 Verifying xcconfig files..."
if [ -d "Pods/Target Support Files" ]; then
    echo "✅ CocoaPods Target Support Files directory exists"
    ls -la "Pods/Target Support Files" | head -10
else
    echo "❌ CocoaPods Target Support Files directory not found"
    exit 1
fi

echo "✅ Pre-build script completed successfully" 