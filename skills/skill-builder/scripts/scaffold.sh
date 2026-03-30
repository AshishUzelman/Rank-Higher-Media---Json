#!/bin/bash
# Creates a Claude Code skill folder structure.
# Usage: scaffold.sh <skill_name> [--with-scripts] [--with-references]

set -e

SKILL_NAME="$1"
if [[ -z "$SKILL_NAME" ]]; then
  echo "Usage: scaffold.sh <skill_name> [--with-scripts] [--with-references]"
  exit 1
fi

INSTALL_DIR="$HOME/.claude/skills/$SKILL_NAME"

mkdir -p "$INSTALL_DIR"

[[ "$*" == *"--with-scripts"* ]]     && mkdir -p "$INSTALL_DIR/scripts"
[[ "$*" == *"--with-references"* ]]  && mkdir -p "$INSTALL_DIR/references/examples"

# Only write SKILL.md skeleton if one doesn't already exist
if [[ ! -f "$INSTALL_DIR/SKILL.md" ]]; then
  cat > "$INSTALL_DIR/SKILL.md" << SKILLEOF
---
name: $SKILL_NAME
description:
---

# Skill Name

## Overview

## Instructions

### Step 1:

## Examples

## Common Issues
SKILLEOF
fi

echo "Scaffolded: $INSTALL_DIR"
