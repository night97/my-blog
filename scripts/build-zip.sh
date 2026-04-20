#!/bin/bash
#
# Build script to create my-blog.zip for Docker deployment
# Excludes unnecessary files like node_modules, .next, uploads, etc.
#

# Output filename
OUTPUT="my-blog.zip"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Creating $OUTPUT from $PROJECT_DIR..."
echo "Excluding: node_modules, .next, .git, uploads, .DS_Store"

cd "$PROJECT_DIR/.."
zip -r "$OUTPUT" my-blog \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*.next*" \
  -x "*/uploads/*" \
  -x "*.DS_Store*" \
  -x "*.env*" \
  -x "*.tar.gz" \
  2>/dev/null

if [ -f "$OUTPUT" ]; then
  echo -e "\n✅ Done! Created:"
  ls -lh "$OUTPUT"
  echo -e "\n📦 Output: $PWD/$OUTPUT"
else
  echo -e "\n❌ Error: Failed to create $OUTPUT"
  exit 1
fi