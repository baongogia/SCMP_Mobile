#!/bin/bash
set -e

echo "⚠️  Closing Xcode..."
killall Xcode || true

echo "🧹 Cleaning DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData
echo "✅ DerivedData cleaned."

echo "🧹 Cleaning CocoaPods..."
cd ios
rm -rf Pods
rm -f Podfile.lock

echo "📦 Installing Pods..."
pod install

echo "✅ Done! please open Xcode and try building again."
open poolcenter.xcworkspace
