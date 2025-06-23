#!/bin/bash

set -e

echo "🚀 Starting Xcode Cloud pre-build script"

# Print environment info for debugging
echo "📊 Environment info:"
echo "PWD: $(pwd)"
echo "USER: $USER"
echo "HOME: $HOME"
echo "CI_WORKSPACE: $CI_WORKSPACE"
echo "CI_PRIMARY_REPOSITORY_PATH: $CI_PRIMARY_REPOSITORY_PATH"
echo "NODE_BINARY: $NODE_BINARY"

# Determine the correct workspace directory
WORKSPACE_DIR=""
if [ -n "$CI_PRIMARY_REPOSITORY_PATH" ]; then
    WORKSPACE_DIR="$CI_PRIMARY_REPOSITORY_PATH"
elif [ -n "$CI_WORKSPACE" ]; then
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

# Enhanced Node.js discovery for Xcode Cloud
echo "🔧 Setting up Node.js environment for Xcode Cloud..."

# Set up comprehensive PATH for Xcode Cloud
export PATH="/usr/local/bin:/opt/homebrew/bin:/Users/local/Homebrew/bin:/usr/bin:/bin:/opt/local/bin:$PATH"

# Try to source Node.js from .xcode.env if it exists
if [ -f "ios/.xcode.env" ]; then
    echo "📄 Sourcing .xcode.env..."
    source ios/.xcode.env
fi

if [ -f "ios/.xcode.env.local" ]; then
    echo "📄 Sourcing .xcode.env.local..."
    source ios/.xcode.env.local
fi

# Enhanced Node.js discovery with multiple strategies
NODE_PATH=""
NPM_PATH=""
NPX_PATH=""

echo "🔍 Searching for Node.js in Xcode Cloud environment..."

# Strategy 1: Check if NODE_BINARY is set by Xcode Cloud
if [ -n "$NODE_BINARY" ] && [ -f "$NODE_BINARY" ]; then
    NODE_PATH="$NODE_BINARY"
    echo "✅ Found Node.js via NODE_BINARY: $NODE_PATH"
fi

# Strategy 2: Check command availability
if [ -z "$NODE_PATH" ] && command -v node >/dev/null 2>&1; then
    NODE_PATH=$(command -v node)
    echo "✅ Found Node.js via command: $NODE_PATH"
fi

# Strategy 3: Check common Xcode Cloud locations
if [ -z "$NODE_PATH" ]; then
    echo "🔍 Checking common Xcode Cloud Node.js locations..."
    for path in \
        "/usr/local/bin/node" \
        "/opt/homebrew/bin/node" \
        "/Users/local/Homebrew/bin/node" \
        "/Users/local/.nvm/versions/node/*/bin/node" \
        "/var/folders/*/T/*/node" \
        "$HOME/.nvm/versions/node/*/bin/node" \
        "/usr/bin/node" \
        "/bin/node"; do
        
        # Handle glob patterns
        if [[ "$path" == *"*"* ]]; then
            for expanded_path in $path; do
                if [ -f "$expanded_path" ]; then
                    NODE_PATH="$expanded_path"
                    echo "✅ Found Node.js at: $NODE_PATH"
                    break 2
                fi
            done
        elif [ -f "$path" ]; then
            NODE_PATH="$path"
            echo "✅ Found Node.js at: $NODE_PATH"
            break
        fi
    done
fi

# Strategy 4: Try to install Node.js if not found
if [ -z "$NODE_PATH" ]; then
    echo "⚠️ Node.js not found, attempting to install..."
    
    # Try using homebrew if available
    if command -v brew >/dev/null 2>&1; then
        echo "🍺 Installing Node.js via Homebrew..."
        brew install node
        if command -v node >/dev/null 2>&1; then
            NODE_PATH=$(command -v node)
            echo "✅ Node.js installed via Homebrew: $NODE_PATH"
        fi
    fi
    
    # Try using package manager
    if [ -z "$NODE_PATH" ] && command -v apt-get >/dev/null 2>&1; then
        echo "📦 Installing Node.js via apt-get..."
        apt-get update && apt-get install -y nodejs npm
        if command -v node >/dev/null 2>&1; then
            NODE_PATH=$(command -v node)
            echo "✅ Node.js installed via apt-get: $NODE_PATH"
        fi
    fi
fi

# Final check for Node.js
if [ -z "$NODE_PATH" ]; then
    echo "❌ Node.js could not be found or installed"
    echo "🔍 Available commands:"
    which -a node || echo "node command not found"
    echo "🔍 PATH: $PATH"
    echo "🔍 Contents of common directories:"
    ls -la /usr/local/bin/ | grep node || echo "No node in /usr/local/bin/"
    ls -la /opt/homebrew/bin/ | grep node || echo "No node in /opt/homebrew/bin/"
    exit 1
fi

# Find npm and npx relative to Node.js
NODE_DIR=$(dirname "$NODE_PATH")
NPM_PATH="$NODE_DIR/npm"
NPX_PATH="$NODE_DIR/npx"

# Verify npm exists
if [ ! -f "$NPM_PATH" ]; then
    echo "⚠️ npm not found at expected location: $NPM_PATH"
    if command -v npm >/dev/null 2>&1; then
        NPM_PATH=$(command -v npm)
        echo "✅ Found npm via command: $NPM_PATH"
    else
        echo "❌ npm not found anywhere"
        exit 1
    fi
fi

# Verify npx exists
if [ ! -f "$NPX_PATH" ]; then
    echo "⚠️ npx not found at expected location: $NPX_PATH"
    if command -v npx >/dev/null 2>&1; then
        NPX_PATH=$(command -v npx)
        echo "✅ Found npx via command: $NPX_PATH"
    else
        echo "❌ npx not found anywhere"
        exit 1
    fi
fi

# Print versions
echo "📦 Tool versions:"
echo "Node: $($NODE_PATH --version)"
echo "npm: $($NPM_PATH --version)"
echo "npx: $($NPX_PATH --version)"

# Install Node.js dependencies with better error handling
echo "📦 Installing Node.js dependencies..."
if ! $NPM_PATH ci; then
    echo "❌ npm ci failed, trying npm install..."
    if ! $NPM_PATH install; then
        echo "❌ npm install also failed"
        exit 1
    fi
fi

# Set up CI environment variables (these should already be set by Xcode Cloud config)
echo "🔧 Setting up CI environment variables..."
export CI=1
export EXPO_NO_TELEMETRY=1
export EXPO_NO_DOCTOR=1
export EXPO_BETA=0
export NODE_ENV=production
export EXPO_USE_COMMUNITY_AUTOLINKING=0
export RCT_NEW_ARCH_ENABLED=0

# Check if expo is available
if ! $NPX_PATH expo --version >/dev/null 2>&1; then
    echo "❌ Expo CLI not available"
    exit 1
fi

# Run Expo prebuild to generate iOS project
echo "🔧 Running Expo prebuild to generate iOS project..."
if ! $NPX_PATH expo prebuild --platform ios --clean --non-interactive; then
    echo "❌ Expo prebuild failed"
    exit 1
fi

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
    # Try to install CocoaPods
    echo "🔧 Installing CocoaPods..."
    if command -v gem >/dev/null 2>&1; then
        gem install cocoapods --user-install
        export PATH="$HOME/.gem/bin:$PATH"
        if command -v pod >/dev/null 2>&1; then
            POD_PATH=$(command -v pod)
            echo "✅ CocoaPods installed at: $POD_PATH"
        else
            echo "❌ CocoaPods installation failed"
            exit 1
        fi
    else
        echo "❌ gem command not found, cannot install CocoaPods"
        exit 1
    fi
fi

echo "CocoaPods version: $($POD_PATH --version)"

# Clean any existing Pods installation
echo "🧹 Cleaning existing Pods installation..."
rm -rf Pods
rm -f Podfile.lock

# Install CocoaPods dependencies with better error handling
echo "📱 Installing CocoaPods dependencies..."
if ! $POD_PATH install --repo-update --verbose; then
    echo "❌ pod install failed, trying without repo update..."
    if ! $POD_PATH install --verbose; then
        echo "❌ pod install failed completely"
        exit 1
    fi
fi

# Verify that the xcconfig files were created
echo "🔍 Verifying xcconfig files..."
if [ -d "Pods/Target Support Files" ]; then
    echo "✅ CocoaPods Target Support Files directory exists"
    ls -la "Pods/Target Support Files" | head -10
    
    # Count xcconfig files
    xcconfig_count=$(find "Pods/Target Support Files" -name "*.xcconfig" | wc -l)
    echo "📊 Found $xcconfig_count xcconfig files"
    
    if [ "$xcconfig_count" -gt 0 ]; then
        echo "✅ xcconfig files successfully created"
    else
        echo "❌ No xcconfig files found"
        exit 1
    fi
else
    echo "❌ CocoaPods Target Support Files directory not found"
    exit 1
fi

# Verify workspace exists
if [ -f "Umami.xcworkspace/contents.xcworkspacedata" ]; then
    echo "✅ Xcode workspace exists and is valid"
else
    echo "❌ Xcode workspace not found or invalid"
    exit 1
fi

echo "✅ Pre-build script completed successfully" 