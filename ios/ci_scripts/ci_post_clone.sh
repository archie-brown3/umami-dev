#!/bin/bash

set -e

echo "🔧 Post-clone setup script starting..."

# Print environment info
echo "📊 Post-clone environment:"
echo "PWD: $(pwd)"
echo "CI_PRIMARY_REPOSITORY_PATH: $CI_PRIMARY_REPOSITORY_PATH"

# Navigate to the repository root
if [ -n "$CI_PRIMARY_REPOSITORY_PATH" ]; then
    cd "$CI_PRIMARY_REPOSITORY_PATH"
else
    echo "❌ CI_PRIMARY_REPOSITORY_PATH not set"
    exit 1
fi

echo "Repository root: $(pwd)"

# Verify repository structure
echo "📁 Repository structure:"
ls -la

# Check critical files
echo "🔍 Checking critical files..."
for file in package.json app.config.ts ios/Podfile; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check for iOS directory structure
echo "🔍 Verifying iOS project structure..."
if [ -d "ios" ]; then
    echo "✅ ios directory exists"
    if [ -f "ios/Podfile" ]; then
        echo "✅ Podfile exists"
    else
        echo "❌ Podfile missing"
        exit 1
    fi
    if [ -d "ios/ci_scripts" ]; then
        echo "✅ ci_scripts directory exists"
    else
        echo "❌ ci_scripts directory missing"
        exit 1
    fi
else
    echo "❌ ios directory missing"
    exit 1
fi

# Set file permissions for CI scripts
echo "🔧 Setting execute permissions for CI scripts..."
chmod +x ios/ci_scripts/ci_pre_xcodebuild.sh
chmod +x ios/ci_scripts/ci_post_clone.sh

# Verify CI scripts exist and are executable
echo "🔍 Verifying CI scripts..."
if [ -x "ios/ci_scripts/ci_pre_xcodebuild.sh" ]; then
    echo "✅ ci_pre_xcodebuild.sh is executable"
else
    echo "❌ ci_pre_xcodebuild.sh not found or not executable"
    exit 1
fi

if [ -x "ios/ci_scripts/ci_post_clone.sh" ]; then
    echo "✅ ci_post_clone.sh is executable"
else
    echo "❌ ci_post_clone.sh not found or not executable"
    exit 1
fi

# Print Xcode Cloud configuration info
echo "🔍 Checking Xcode Cloud configuration..."
if [ -f ".xcode-cloud-config.json" ]; then
    echo "✅ .xcode-cloud-config.json exists"
    echo "📄 Configuration preview:"
    head -10 .xcode-cloud-config.json
else
    echo "❌ .xcode-cloud-config.json missing"
    exit 1
fi

echo "✅ Post-clone setup completed successfully"
echo "📝 Note: Node.js tools will be verified in the pre-build script" 