// scripts/approve_memory.js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createInterface } from 'readline';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { PATHS } from './memory_config.js';

// --- Pure helpers (exported for testing) ---

export function parseDraft(content) {
  if (!content.trim()) return [];

  // Use \n---\n\n as separator to avoid splitting on --- inside content bodies
  const sections = content.split(/\n---\n\n/).map(s => s.trim()).filter(Boolean);
  return sections.map(section => {
    const headerMatch = section.match(/^## \[(.+?)\]\n([\s\S]*)$/);
    if (!headerMatch) return null;

    const [, key, body] = headerMatch;
    if (key.startsWith('auto-memory: ')) {
      return { key: 'auto-memory', filename: key.replace('auto-memory: ', ''), content: body.trim() };
    }
    return { key, content: body.trim() };
  }).filter(Boolean);
}

export function computeDiff(current, proposed) {
  if (!current) return `(new file)\n${proposed}`;

  const currentLines = current.split('\n');
  const proposedLines = proposed.split('\n');
  const result = [];

  // Simple line-by-line diff (sufficient for review purposes)
  const maxLen = Math.max(currentLines.length, proposedLines.length);
  for (let i = 0; i < maxLen; i++) {
    const cur = currentLines[i];
    const prop = proposedLines[i];
    if (cur === prop) {
      result.push(`  ${cur ?? ''}`);
    } else {
      if (cur !== undefined) result.push(`-${cur}`);
      if (prop !== undefined) result.push(`+${prop}`);
    }
  }
  return result.join('\n');
}

// --- File resolvers ---

function resolveTargetPath(section) {
  switch (section.key) {
    case 'rolling_summary': return PATHS.rollingSummary;
    case 'CONTEXT':         return PATHS.context;
    case 'PROJECT_STATUS':  return PATHS.projectStatus;
    case 'auto-memory':     return join(PATHS.autoMemoryRoot, section.filename);
    default:                return null;
  }
}

function readCurrent(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

// --- Write strategies ---

function applySection(section, targetPath) {
  const current = readCurrent(targetPath);
  const dir = targetPath.substring(0, targetPath.lastIndexOf('/'));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  switch (section.key) {
    case 'rolling_summary': {
      // Prepend new entry; keep only 3 sessions total
      const header = current.match(/^(#[^\n]+\n>[^\n]+\n>[^\n]+\n>[^\n]+\n\n---\n\n)/s)?.[1] || '';
      const sessions = current.replace(header, '').split(/\n(?=## Session)/);
      const kept = sessions.slice(0, 2); // keep 2 existing + 1 new = 3 total
      writeFileSync(targetPath, `${header}${section.content}\n\n---\n\n${kept.join('\n\n---\n\n')}`);
      break;
    }
    case 'PROJECT_STATUS': {
      // Prepend daily entry after the file header
      const header = current.match(/^(#[^\n]+\n>[^\n]+\n>[^\n]+\n>[^\n]+\n>[^\n]+\n\n---\n\n)/s)?.[1] || '';
      const rest = current.replace(header, '');
      writeFileSync(targetPath, `${header}${section.content}\n\n---\n\n${rest}`);
      break;
    }
    default:
      // CONTEXT + auto-memory: full file replace
      writeFileSync(targetPath, section.content + '\n');
  }
}

// --- Interactive prompt ---

function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function openEditor(content) {
  const tmpFile = '/tmp/memory_review_edit.md';
  writeFileSync(tmpFile, content);
  const editor = process.env.EDITOR || 'nano';
  spawnSync(editor, [tmpFile], { stdio: 'inherit' });
  return readFileSync(tmpFile, 'utf8');
}

// --- Main ---

async function main() {
  if (!existsSync(PATHS.draft)) {
    console.log('No memory_draft.md found. Run `npm run compile` first.');
    process.exit(0);
  }

  const draftContent = readFileSync(PATHS.draft, 'utf8');
  const sections = parseDraft(draftContent);

  if (sections.length === 0) {
    console.log('Draft is empty or unparseable.');
    process.exit(0);
  }

  // Check for ERROR section
  const errorSection = sections.find(s => s.key === 'ERROR');
  if (errorSection) {
    console.error(`\nCompilation error:\n${errorSection.content}\n`);
    process.exit(1);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log(`\nReviewing ${sections.length} memory update(s)...\n`);

  for (const section of sections) {
    const targetPath = resolveTargetPath(section);
    if (!targetPath) {
      console.log(`[skip] Unknown section key: ${section.key}`);
      continue;
    }

    const label = section.key === 'auto-memory' ? section.filename : `${section.key}`;
    const current = readCurrent(targetPath);
    const diff = computeDiff(current, section.content);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`TARGET: ${label}`);
    console.log(`PATH:   ${targetPath}`);
    console.log(`${'='.repeat(60)}`);
    console.log(diff);
    console.log(`${'='.repeat(60)}\n`);

    let answer = '';
    while (!['y', 'n', 'edit'].includes(answer.toLowerCase().trim())) {
      answer = await prompt(rl, `Apply to ${label}? (y/n/edit): `);
    }

    answer = answer.toLowerCase().trim();
    if (answer === 'edit') {
      section.content = openEditor(section.content);
      answer = await prompt(rl, `Apply edited version to ${label}? (y/n): `);
    }

    if (answer === 'y') {
      applySection(section, targetPath);
      console.log(`✓ Applied to ${label}`);
    } else {
      console.log(`— Skipped ${label}`);
    }
  }

  rl.close();
  console.log('\nMemory update complete.');
}

// Only run main when executed directly (not when imported by tests)
if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  main();
}
