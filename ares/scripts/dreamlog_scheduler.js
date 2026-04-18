// scripts/dreamlog_scheduler.js
const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const { spawn } = require('child_process');

const CORRECTIONS_DIR = path.join(__dirname, '..', 'corrections');
const PROCESSED_DIR = path.join(__dirname, '..', 'processed');
const STATE_FILE = path.join(__dirname, '..', 'state', 'dreamlog_scheduler.state.json');
const THRESHOLD = parseInt(process.env.DREAMLOG_THRESHOLD, 10) || 20;

async function ensureDirExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      console.error(`Failed to create directory ${dir}: ${err.message}`);
    }
  }
}

async function readState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { lastTriggered: null, currentCount: 0 };
    }
    console.error(`Error reading state file: ${err.message}`);
    throw err;
  }
}

async function writeState(state) {
  try {
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing state file: ${err.message}`);
  }
}

async function countCorrections() {
  try {
    const files = await fs.readdir(CORRECTIONS_DIR);
    return files.filter(file => !file.startsWith('.')).length;
  } catch (err) {
    console.error(`Error reading corrections directory: ${err.message}`);
    return 0;
  }
}

async function main() {
  await ensureDirExists(CORRECTIONS_DIR);
  await ensureDirExists(PROCESSED_DIR);
  await ensureDirExists(path.dirname(STATE_FILE));

  let state = await readState();
  const currentCount = await countCorrections();
  state.currentCount = currentCount;
  await writeState(state);

  const watcher = chokidar.watch(CORRECTIONS_DIR, {
    ignored: /(^|\/)\./,
    ignoreInitial: true,
    persistent: true,
  });

  let count = currentCount;

  watcher.on('add', async (filePath) => {
    if (path.dirname(filePath) !== CORRECTIONS_DIR) return;

    count++;
    console.log(`New correction detected. Current count: ${count} (threshold: ${THRESHOLD})`);

    if (count >= THRESHOLD) {
      try {
        const files = await fs.readdir(CORRECTIONS_DIR);
        const correctionFiles = files
          .filter(file => !file.startsWith('.') && path.extname(file) === '.json')
          .sort();

        console.log(`Triggering fine-tune for batch of ${correctionFiles.length} corrections`);

        for (const file of correctionFiles) {
          const source = path.join(CORRECTIONS_DIR, file);
          const dest = path.join(PROCESSED_DIR, file);
          try {
            await fs.rename(source, dest);
          } catch (err) {
            console.error(`Failed to move ${file} to processed: ${err.message}`);
          }
        }

        state.lastTriggered = new Date().toISOString();
        state.currentCount = 0;
        await writeState(state);

        console.log('Starting LoRA fine-tune...');
        const child = spawn('sh', [path.join(__dirname, 'run_lora_finetune.sh')], { stdio: 'inherit' });
        child.on('close', (code) => {
          if (code !== 0) {
            console.error(`run_lora_finetune.sh exited with code ${code}`);
            process.exit(1);
          }
        });
      } catch (err) {
        console.error(`Error during trigger: ${err.message}`);
      }
    }
  });

  watcher.on('error', (error) => {
    console.error(`Watcher error: ${error.message}`);
  });

  console.log(`Dreamlog scheduler started. Watching ${CORRECTIONS_DIR} (threshold: ${THRESHOLD})`);
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
