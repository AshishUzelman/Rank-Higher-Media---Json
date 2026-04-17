#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INBOX = path.join(__dirname, '../agent_inbox');
const CHECK_INTERVAL = 30000; // 30 seconds

console.log('🤖 Auto Task Pickup started');
console.log(`📁 Watching: ${INBOX}`);
console.log(`⏱️  Check interval: ${CHECK_INTERVAL}ms\n`);

let isRunning = false;

async function checkAndRunConnector() {
  if (isRunning) return;

  try {
    const files = fs.readdirSync(INBOX).filter(f => f.endsWith('.json'));

    if (files.length > 0) {
      console.log(`[${new Date().toISOString()}] Found ${files.length} task(s):`);
      files.forEach(f => console.log(`  - ${f}`));

      isRunning = true;
      console.log('🚀 Running connector...\n');

      try {
        execSync('npm run connector', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit'
        });
      } catch (error) {
        console.error('❌ Connector error:', error.message);
      } finally {
        isRunning = false;
      }
    }
  } catch (error) {
    console.error('Error checking inbox:', error.message);
  }
}

// Check immediately
checkAndRunConnector();

// Then check every interval
setInterval(checkAndRunConnector, CHECK_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Auto Task Pickup stopped');
  process.exit(0);
});
