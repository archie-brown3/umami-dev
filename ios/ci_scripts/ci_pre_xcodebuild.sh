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

# Add Node.js paths that are common in CI environments
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

# Try to find Node.js in CI environment
echo "🔍 Looking for Node.js..."
NODE_PATH=""
NPM_PATH=""

# Check common CI locations first
if [ -f "/usr/local/bin/node" ]; then
    NODE_PATH="/usr/local/bin/node"
    NPM_PATH="/usr/local/bin/npm"
    echo "✅ Found Node.js at: $NODE_PATH"
elif [ -f "/opt/homebrew/bin/node" ]; then
    NODE_PATH="/opt/homebrew/bin/node"
    NPM_PATH="/opt/homebrew/bin/npm"
    echo "✅ Found Node.js at: $NODE_PATH"
elif command -v node >/dev/null 2>&1; then
    NODE_PATH=$(command -v node)
    NPM_PATH=$(command -v npm)
    echo "✅ Found Node.js at: $NODE_PATH"
else
    echo "❌ Node.js not found in standard locations"
    echo "🔍 Searching for Node.js..."
    # Try to find node anywhere
    find /usr -name "node" -type f 2>/dev/null | head -5
    find /opt -name "node" -type f 2>/dev/null | head -5
    echo "PATH contents:"
    echo "$PATH" | tr ':' '\n'
    exit 1
fi

# Verify npm exists
if [ ! -f "$NPM_PATH" ]; then
    # Try to find npm in the same directory as node
    NODE_DIR=$(dirname "$NODE_PATH")
    if [ -f "$NODE_DIR/npm" ]; then
        NPM_PATH="$NODE_DIR/npm"
    else
        echo "❌ npm not found"
        exit 1
    fi
fi

# Get pod path - CocoaPods should be available in Xcode Cloud
POD_PATH=""
if command -v pod >/dev/null 2>&1; then
    POD_PATH=$(command -v pod)
    echo "✅ Found CocoaPods at: $POD_PATH"
elif [ -f "/usr/local/bin/pod" ]; then
    POD_PATH="/usr/local/bin/pod"
    echo "✅ Found CocoaPods at: $POD_PATH"
else
    echo "❌ CocoaPods not found"
    echo "🔍 Searching for CocoaPods..."
    find /usr -name "pod" -type f 2>/dev/null | head -5
    exit 1
fi

# Print versions
echo "Node version: $($NODE_PATH --version)"
echo "npm version: $($NPM_PATH --version)"
echo "CocoaPods version: $($POD_PATH --version)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in $(pwd)"
    echo "📁 Current directory contents:"
    ls -la
    exit 1
fi

echo "📦 Installing Node.js dependencies..."
$NPM_PATH ci

echo "🔧 Running Expo prebuild to generate iOS project..."
$NPM_PATH exec expo prebuild --platform ios --clean

echo "📱 Installing CocoaPods dependencies..."
cd ios
$POD_PATH install --repo-update

echo "✅ Pre-build script completed successfully" 