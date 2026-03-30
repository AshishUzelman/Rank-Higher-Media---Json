#!/usr/bin/env python3
"""Tests for validate.py — run before implementing validate.py to confirm RED state."""

import sys
import os
import tempfile
import subprocess

VALIDATE_SCRIPT = os.path.join(
    os.path.dirname(__file__),
    '../../skills/skill-builder/scripts/validate.py'
)


def run_validate(skill_dir):
    result = subprocess.run(
        ['python3', VALIDATE_SCRIPT, skill_dir],
        capture_output=True, text=True
    )
    return result.returncode, result.stdout + result.stderr


def make_skill(parent_dir, folder_name, frontmatter_body):
    """Create a minimal skill directory with SKILL.md."""
    skill_dir = os.path.join(parent_dir, folder_name)
    os.makedirs(skill_dir)
    content = f"---\n{frontmatter_body}\n---\n\n# Skill\n"
    with open(os.path.join(skill_dir, 'SKILL.md'), 'w') as f:
        f.write(content)
    return skill_dir


def test_valid_skill_passes():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'my-skill',
            'name: my-skill\ndescription: Does X. Use when user asks to do X.'
        )
        code, output = run_validate(skill_dir)
        assert code == 0, f"Expected pass, got returncode={code}: {output}"


def test_missing_skill_md_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = os.path.join(d, 'my-skill')
        os.makedirs(skill_dir)
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for missing SKILL.md"
        assert 'SKILL.md' in output


def test_name_with_uppercase_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'my-skill',
            'name: MySkill\ndescription: Does X. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for uppercase name"
        assert 'kebab-case' in output


def test_name_too_long_fails():
    with tempfile.TemporaryDirectory() as d:
        long_name = 'a' * 65
        skill_dir = make_skill(
            d, long_name,
            f'name: {long_name}\ndescription: Does X. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for name > 64 chars"
        assert '64' in output


def test_claude_prefix_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'claude-helper',
            'name: claude-helper\ndescription: Does X. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for reserved prefix"
        assert 'reserved' in output


def test_anthropic_prefix_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'anthropic-tool',
            'name: anthropic-tool\ndescription: Does X. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for reserved prefix"
        assert 'reserved' in output


def test_description_too_long_fails():
    with tempfile.TemporaryDirectory() as d:
        long_desc = 'X' * 1025
        skill_dir = make_skill(
            d, 'my-skill',
            f'name: my-skill\ndescription: {long_desc}'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for description > 1024 chars"
        assert '1024' in output


def test_description_with_xml_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'my-skill',
            'name: my-skill\ndescription: Does <thing>. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for XML angle brackets"
        assert 'angle bracket' in output


def test_name_mismatch_with_folder_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'my-skill',
            'name: other-skill\ndescription: Does X. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for name/folder mismatch"
        assert 'match folder' in output


def test_missing_description_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(d, 'my-skill', 'name: my-skill')
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for missing description"
        assert 'description' in output


if __name__ == '__main__':
    tests = [(name, obj) for name, obj in globals().items() if name.startswith('test_')]
    passed, failed = 0, 0
    for name, test in tests:
        try:
            test()
            print(f"  ✓ {name}")
            passed += 1
        except AssertionError as e:
            print(f"  ✗ {name}: {e}")
            failed += 1
    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)
