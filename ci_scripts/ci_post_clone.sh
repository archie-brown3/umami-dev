#!/bin/bash
set -e
echo "Post-clone script starting"
npm ci
npx expo prebuild --platform ios --clean
cd ios && pod install && cd ..
echo "Post-clone script completed"
