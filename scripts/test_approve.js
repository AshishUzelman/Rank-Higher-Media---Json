import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDraft, computeDiff } from './approve_memory.js';

describe('parseDraft', () => {
  it('parses a single section', () => {
    const draft = '## [rolling_summary]\nsome summary content\n';
    const result = parseDraft(draft);
    assert.equal(result.length, 1);
    assert.equal(result[0].key, 'rolling_summary');
    assert.ok(result[0].content.includes('some summary content'));
  });

  it('parses multiple sections separated by ---', () => {
    const draft = '## [rolling_summary]\nfoo\n\n---\n\n## [CONTEXT]\nbar\n';
    const result = parseDraft(draft);
    assert.equal(result.length, 2);
    assert.equal(result[0].key, 'rolling_summary');
    assert.equal(result[1].key, 'CONTEXT');
  });

  it('parses auto-memory section with filename', () => {
    const draft = '## [auto-memory: feedback_test.md]\n---\nname: test\n---\nbody\n';
    const result = parseDraft(draft);
    assert.equal(result[0].key, 'auto-memory');
    assert.equal(result[0].filename, 'feedback_test.md');
  });

  it('returns empty array for empty draft', () => {
    assert.deepEqual(parseDraft(''), []);
  });
});

describe('computeDiff', () => {
  it('shows added lines with + prefix', () => {
    const diff = computeDiff('old line\n', 'old line\nnew line\n');
    assert.ok(diff.includes('+new line'));
  });

  it('shows removed lines with - prefix', () => {
    const diff = computeDiff('removed line\nkept line\n', 'kept line\n');
    assert.ok(diff.includes('-removed line'));
  });

  it('returns "(new file)" when current is empty', () => {
    const diff = computeDiff('', 'new content\n');
    assert.ok(diff.includes('(new file)'));
  });
});
