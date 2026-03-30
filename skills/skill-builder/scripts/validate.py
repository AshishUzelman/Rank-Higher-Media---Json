#!/usr/bin/env python3
"""Validates a Claude Code skill folder against the Agent Skills spec.

Usage: python3 validate.py <skill_dir>
Exit 0: valid. Exit 1: invalid (errors printed to stdout).
"""

import sys
import os
import re


def parse_frontmatter(content):
    """Extract and parse YAML frontmatter. Returns dict or None on error."""
    if not content.startswith('---'):
        return None, "SKILL.md must start with '---' (YAML frontmatter)"
    parts = content.split('---', 2)
    if len(parts) < 3:
        return None, "SKILL.md frontmatter not closed (missing closing '---')"
    fm_text = parts[1]
    try:
        import yaml
        fm = yaml.safe_load(fm_text)
    except ImportError:
        # Fallback: simple line-by-line key:value parsing
        fm = {}
        for line in fm_text.strip().splitlines():
            if ':' in line:
                k, _, v = line.partition(':')
                fm[k.strip()] = v.strip()
    except Exception as e:
        return None, f"Invalid YAML frontmatter: {e}"
    return fm, None


def validate_skill(skill_dir):
    errors = []
    skill_name = os.path.basename(skill_dir.rstrip('/'))

    # 1. SKILL.md must exist (exact case)
    skill_md_path = os.path.join(skill_dir, 'SKILL.md')
    if not os.path.exists(skill_md_path):
        errors.append("SKILL.md not found (must be exactly 'SKILL.md', case-sensitive)")
        return errors

    with open(skill_md_path, 'r') as f:
        content = f.read()

    fm, parse_error = parse_frontmatter(content)
    if parse_error:
        errors.append(parse_error)
        return errors
    if not fm:
        errors.append("Frontmatter is empty")
        return errors

    # 2. Validate name
    name = str(fm.get('name', '')).strip()
    if not name:
        errors.append("'name' field is required")
    else:
        valid_name = re.match(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?$', name)
        if not valid_name:
            errors.append(
                f"'name' must be kebab-case (lowercase letters, numbers, hyphens only, "
                f"no leading/trailing hyphens): got '{name}'"
            )
        if len(name) > 64:
            errors.append(f"'name' must be 64 characters or fewer: got {len(name)}")
        if name.startswith('claude') or name.startswith('anthropic'):
            errors.append(f"'name' cannot start with 'claude' or 'anthropic' (reserved): got '{name}'")
        if name != skill_name:
            errors.append(
                f"'name' field ('{name}') must match folder name ('{skill_name}')"
            )

    # 3. Validate description
    description = str(fm.get('description', '')).strip()
    if not description:
        errors.append("'description' field is required")
    else:
        if len(description) > 1024:
            errors.append(f"'description' must be 1024 characters or fewer: got {len(description)}")
        if '<' in description or '>' in description:
            errors.append("'description' must not contain XML angle brackets (< or >)")

    return errors


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: validate.py <skill_dir>")
        sys.exit(1)

    skill_dir = sys.argv[1]
    if not os.path.isdir(skill_dir):
        print(f"Error: '{skill_dir}' is not a directory")
        sys.exit(1)

    errors = validate_skill(skill_dir)
    if errors:
        print("VALIDATION FAILED:")
        for e in errors:
            print(f"  ✗ {e}")
        sys.exit(1)
    else:
        print("✓ Validation passed")
        sys.exit(0)
