#!/usr/bin/env bash
# ==============================================================================
# Codeforces Problem Tag Hider - Chrome Web Store Packager
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "📦 Packaging Codeforces Problem Tag Hider"
echo "=================================================="

# 1. Validate manifest.json syntax
echo "🔍 Validating manifest.json..."
python3 -m json.tool manifest.json > /dev/null
echo "✅ manifest.json is valid JSON."

# 2. Extract version
VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
echo "🏷️  Version: v${VERSION}"

# 3. Create dist directory
DIST_DIR="$SCRIPT_DIR/dist"
mkdir -p "$DIST_DIR"

ZIP_NAME="codeforces-tag-hider-v${VERSION}.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

# Remove existing zip
rm -f "$ZIP_PATH"

echo "📁 Bundling production assets into $ZIP_NAME..."

# Zip ONLY the files required by Chrome Web Store / Brave
zip -r -q "$ZIP_PATH" \
  manifest.json \
  content.js \
  content.css \
  popup.html \
  popup.js \
  icons/icon16.png \
  icons/icon48.png \
  icons/icon128.png

echo "✅ Package created successfully: $ZIP_PATH"
echo ""
echo "📊 Package Contents:"
unzip -l "$ZIP_PATH"
echo ""
ZIP_SIZE=$(du -h "$ZIP_PATH" | cut -f1)
echo "📦 Total archive size: $ZIP_SIZE"
echo ""
echo "🚀 Ready to upload to Chrome Web Store Developer Dashboard!"
echo "   File: dist/$ZIP_NAME"
echo "=================================================="
