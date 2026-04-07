import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isTranscriptValid, formatTranscript, buildDraftSection } from './compile_memory.js';

describe('isTranscriptValid', () => {
  it('returns false for empty string', () => {
    assert.equal(isTranscriptValid(''), false);
  });

  it('returns false for transcript under 500 chars', () => {
    assert.equal(isTranscriptValid('short'), false);
  });

  it('returns true for transcript over 500 chars', () => {
    assert.equal(isTranscriptValid('x'.repeat(501)), true);
  });
});

describe('formatTranscript', () => {
  it('converts message array to readable string', () => {
    const messages = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there' },
    ];
    const result = formatTranscript(messages);
    assert.ok(result.includes('user: hello'));
    assert.ok(result.includes('assistant: hi there'));
  });

  it('handles empty messages array', () => {
    assert.equal(formatTranscript([]), '');
  });
});

describe('buildDraftSection', () => {
  it('wraps content in correct fenced section header', () => {
    const result = buildDraftSection('rolling_summary', 'some content');
    assert.ok(result.startsWith('## [rolling_summary]'));
    assert.ok(result.includes('some content'));
  });

  it('wraps auto-memory file with filename in header', () => {
    const result = buildDraftSection('auto-memory: feedback_test.md', 'file body');
    assert.ok(result.startsWith('## [auto-memory: feedback_test.md]'));
    assert.ok(result.includes('file body'));
  });
});
