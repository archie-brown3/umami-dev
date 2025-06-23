#!/bin/bash

set -e

echo "🎉 Xcode Cloud post-build script"

# Change to the root directory
cd "$CI_WORKSPACE"

echo "📊 Build completed successfully!"
echo "📱 iOS build artifacts generated"

# Optional: Display some build information
if [ -n "$CI_ARCHIVE_PATH" ]; then
    echo "📦 Archive path: $CI_ARCHIVE_PATH"
fi

if [ -n "$CI_PRODUCT_BUNDLE_IDENTIFIER" ]; then
    echo "📱 Bundle ID: $CI_PRODUCT_BUNDLE_IDENTIFIER"
fi

echo "✅ Post-build script completed" 