#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist/macos"
APP_NAME="Liquide-Wallpaper.app"
APP_PATH="$DIST_DIR/$APP_NAME"
EXECUTABLE_NAME="Liquide-Wallpaper"
ARCHIVE_PATH="$DIST_DIR/Liquide-Wallpaper-macOS.zip"
DMG_PATH="$DIST_DIR/Liquide-Wallpaper-macOS.dmg"

mkdir -p "$DIST_DIR"
TEMP_BUILD="$(mktemp -d "/private/tmp/liquide-wallpaper-build.XXXXXX")"
APP_BUILD_PATH="$TEMP_BUILD/$APP_NAME"
ARCHIVE_BUILD_PATH="$TEMP_BUILD/Liquide-Wallpaper-macOS.zip"
DMG_BUILD_PATH="$TEMP_BUILD/Liquide-Wallpaper-macOS.dmg"

cleanup() {
  rm -rf "$TEMP_BUILD"
}
trap cleanup EXIT

for command_name in xcrun codesign ditto hdiutil plutil sips; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Outil macOS manquant : $command_name" >&2
    exit 1
  fi
done

for required_path in \
  "$PROJECT_ROOT/index.html" \
  "$PROJECT_ROOT/src" \
  "$PROJECT_ROOT/icon/Icon-iOS-Default-1024x1024@1x.png" \
  "$SCRIPT_DIR/Info.plist" \
  "$SCRIPT_DIR/Sources/main.m"; do
  if [[ ! -e "$required_path" ]]; then
    echo "Fichier requis manquant : $required_path" >&2
    exit 1
  fi
done

plutil -lint "$SCRIPT_DIR/Info.plist" >/dev/null
mkdir -p "$APP_BUILD_PATH/Contents/MacOS" "$APP_BUILD_PATH/Contents/Resources/web"

cp "$SCRIPT_DIR/Info.plist" "$APP_BUILD_PATH/Contents/Info.plist"
cp "$PROJECT_ROOT/index.html" "$APP_BUILD_PATH/Contents/Resources/web/index.html"
cp -R "$PROJECT_ROOT/src" "$APP_BUILD_PATH/Contents/Resources/web/src"

ICON_BASE="$TEMP_BUILD/AppIcon-base.png"
ICON_ICNS="$TEMP_BUILD/AppIcon.icns"
sips --resampleHeightWidth 512 512 \
  "$PROJECT_ROOT/icon/Icon-iOS-Default-1024x1024@1x.png" --out "$ICON_BASE" >/dev/null 2>&1
sips -s format icns "$ICON_BASE" --out "$ICON_ICNS" >/dev/null
cp "$ICON_ICNS" "$APP_BUILD_PATH/Contents/Resources/AppIcon.icns"

echo "Compilation universelle arm64 + x86_64…"
xcrun clang \
    -fobjc-arc \
    -O2 \
    -mmacosx-version-min=13.0 \
    -arch arm64 \
    -arch x86_64 \
    -framework AppKit \
    -framework CoreGraphics \
    -framework WebKit \
    "$SCRIPT_DIR/Sources/main.m" \
    -o "$APP_BUILD_PATH/Contents/MacOS/$EXECUTABLE_NAME"

chmod +x "$APP_BUILD_PATH/Contents/MacOS/$EXECUTABLE_NAME"
codesign --force --deep --sign - "$APP_BUILD_PATH" >/dev/null
codesign --verify --deep --strict "$APP_BUILD_PATH"

ditto -c -k --sequesterRsrc --keepParent "$APP_BUILD_PATH" "$ARCHIVE_BUILD_PATH"
hdiutil create \
  -volname "Liquide-Wallpaper" \
  -srcfolder "$APP_BUILD_PATH" \
  -ov \
  -format UDZO \
  "$DMG_BUILD_PATH" >/dev/null

rm -rf "$APP_PATH"
mv "$APP_BUILD_PATH" "$APP_PATH"
rm -f "$ARCHIVE_PATH"
mv "$ARCHIVE_BUILD_PATH" "$ARCHIVE_PATH"
rm -f "$DMG_PATH"
mv "$DMG_BUILD_PATH" "$DMG_PATH"
codesign --verify --deep --strict "$APP_PATH"

echo "Application créée : $APP_PATH"
echo "Archive de transport : $ARCHIVE_PATH"
echo "Image disque : $DMG_PATH"
