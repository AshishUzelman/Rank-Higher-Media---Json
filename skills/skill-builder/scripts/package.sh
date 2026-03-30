#!/bin/bash
# Installs a skill to ~/.claude/skills/ and zips it for Claude.ai upload.
# Usage: package.sh <skill_dir>

set -e

SKILL_DIR="$1"
if [[ -z "$SKILL_DIR" ]]; then
  echo "Usage: package.sh <skill_dir>"
  exit 1
fi

if [[ ! -d "$SKILL_DIR" ]]; then
  echo "Error: '$SKILL_DIR' is not a directory"
  exit 1
fi

SKILL_NAME=$(basename "$SKILL_DIR")
ZIP_FILE="$(dirname "$SKILL_DIR")/${SKILL_NAME}.zip"

# Install to ~/.claude/skills/
mkdir -p "$HOME/.claude/skills"
cp -r "$SKILL_DIR" "$HOME/.claude/skills/"

# Zip for Claude.ai upload
(cd "$(dirname "$SKILL_DIR")" && zip -r "$ZIP_FILE" "$SKILL_NAME" --quiet)

echo "✓ Installed: $HOME/.claude/skills/$SKILL_NAME"
echo "✓ Zipped:    $ZIP_FILE"
