#!/usr/bin/env bash
# Regenerates the Xcode project and runs the tests of one scheme.
# Usage: ./ios/scripts/test.sh [scheme]   (default PokuExpenses; PokuExpensesUI for UI tests)
set -euo pipefail
cd "$(dirname "$0")/.." && xcodegen generate --quiet
xcodebuild test -project PokuExpenses.xcodeproj \
  -scheme "${1:-PokuExpenses}" \
  -destination "platform=iOS Simulator,name=${IOS_SIM:-iPhone 17}" -quiet
