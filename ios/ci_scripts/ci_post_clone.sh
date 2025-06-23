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

# Set up Node.js environment
export PATH="/usr/local/bin:/opt/homebrew/bin:/Users/local/Homebrew/bin:/usr/bin:/bin:/opt/local/bin:$PATH"

# Verify Node.js tools
echo "🔍 Verifying Node.js tools..."
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
    exit 1
fi

if command -v npm >/dev/null 2>&1; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm not found"
    exit 1
fi

# Set file permissions for CI scripts
echo "🔧 Setting execute permissions for CI scripts..."
chmod +x ios/ci_scripts/ci_pre_xcodebuild.sh
chmod +x ios/ci_scripts/ci_post_clone.sh

echo "✅ Post-clone setup completed successfully" 