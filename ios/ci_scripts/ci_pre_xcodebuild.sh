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

# Add comprehensive Node.js paths including the Homebrew paths we see in PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:/Users/local/Homebrew/bin:/usr/bin:/bin:$PATH"

# Try to find Node.js in CI environment
echo "🔍 Looking for Node.js..."
NODE_PATH=""
NPM_PATH=""

# Check all possible locations including the Homebrew paths we see
POSSIBLE_NODE_LOCATIONS=(
    "/usr/local/bin/node"
    "/opt/homebrew/bin/node"
    "/Users/local/Homebrew/bin/node"
    "/usr/bin/node"
    "/bin/node"
)

POSSIBLE_NPM_LOCATIONS=(
    "/usr/local/bin/npm"
    "/opt/homebrew/bin/npm"
    "/Users/local/Homebrew/bin/npm"
    "/usr/bin/npm"
    "/bin/npm"
)

# Try each location
for node_loc in "${POSSIBLE_NODE_LOCATIONS[@]}"; do
    if [ -f "$node_loc" ]; then
        NODE_PATH="$node_loc"
        echo "✅ Found Node.js at: $NODE_PATH"
        break
    fi
done

# If still not found, try command -v as last resort
if [ -z "$NODE_PATH" ] && command -v node >/dev/null 2>&1; then
    NODE_PATH=$(command -v node)
    echo "✅ Found Node.js via command at: $NODE_PATH"
fi

# Try to find npm in the same locations
for npm_loc in "${POSSIBLE_NPM_LOCATIONS[@]}"; do
    if [ -f "$npm_loc" ]; then
        NPM_PATH="$npm_loc"
        echo "✅ Found npm at: $NPM_PATH"
        break
    fi
done

# If still not found, try command -v as last resort
if [ -z "$NPM_PATH" ] && command -v npm >/dev/null 2>&1; then
    NPM_PATH=$(command -v npm)
    echo "✅ Found npm via command at: $NPM_PATH"
fi

# If Node.js is still not found, try to install it using Homebrew
if [ -z "$NODE_PATH" ]; then
    echo "❌ Node.js not found in any location"
    echo "🔍 Attempting to install Node.js using Homebrew..."
    
    # Check if Homebrew is available
    BREW_PATH=""
    if [ -f "/Users/local/Homebrew/bin/brew" ]; then
        BREW_PATH="/Users/local/Homebrew/bin/brew"
    elif [ -f "/opt/homebrew/bin/brew" ]; then
        BREW_PATH="/opt/homebrew/bin/brew"
    elif [ -f "/usr/local/bin/brew" ]; then
        BREW_PATH="/usr/local/bin/brew"
    elif command -v brew >/dev/null 2>&1; then
        BREW_PATH=$(command -v brew)
    fi
    
    if [ -n "$BREW_PATH" ]; then
        echo "✅ Found Homebrew at: $BREW_PATH"
        echo "📦 Installing Node.js..."
        $BREW_PATH install node
        
        # Try to find Node.js again after installation
        for node_loc in "${POSSIBLE_NODE_LOCATIONS[@]}"; do
            if [ -f "$node_loc" ]; then
                NODE_PATH="$node_loc"
                echo "✅ Node.js installed successfully at: $NODE_PATH"
                break
            fi
        done
        
        for npm_loc in "${POSSIBLE_NPM_LOCATIONS[@]}"; do
            if [ -f "$npm_loc" ]; then
                NPM_PATH="$npm_loc"
                echo "✅ npm available at: $NPM_PATH"
                break
            fi
        done
    else
        echo "❌ Homebrew not found, cannot install Node.js"
        echo "🔍 Available executables in common paths:"
        find /usr/local/bin -name "*node*" 2>/dev/null || echo "No node executables in /usr/local/bin"
        find /Users/local/Homebrew/bin -name "*node*" 2>/dev/null || echo "No node executables in /Users/local/Homebrew/bin"
        exit 1
    fi
fi

# Final check
if [ -z "$NODE_PATH" ] || [ -z "$NPM_PATH" ]; then
    echo "❌ Failed to locate Node.js and npm"
    exit 1
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