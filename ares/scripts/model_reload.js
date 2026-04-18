// scripts/model_reload.js
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const STATE_DIR = path.join(__dirname, '..', 'state');
const MODELS_DIR = path.join(__dirname, '..', 'models');

const OLLAMA_API = 'http://localhost:11434';
const ACTIVE_MODEL_FILE = path.join(STATE_DIR, 'active_model.txt');
const TEMP_MODEL_NAME = 'dreamlog_temp';
const TARGET_MODEL_NAME = 'dreamlog';

let logPath;

const log = async (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  if (logPath) await fs.appendFile(logPath, logEntry, 'utf8').catch(() => {});
  console.log(`[MODEL_RELOAD] ${message}`);
};

const findAdapterFile = async () => {
  const files = await fs.readdir(MODELS_DIR);
  const adapterFiles = files.filter(f => f.startsWith('adapter-') && f.endsWith('.safetensors'));
  if (adapterFiles.length === 0) throw new Error('No adapter file found in models/');
  return path.join(MODELS_DIR, adapterFiles[0]);
};

const generateModelfile = (adapterPath) =>
  `FROM qwen3:30b-a3b\nPARAMETER num_ctx 4096\nADAPTER ${adapterPath}`;

const createModel = async (modelName, modelfile) => {
  const response = await axios.post(`${OLLAMA_API}/api/create`, { name: modelName, modelfile });
  await log(`Created model ${modelName} (status: ${response.status})`);
};

const verifyModel = async (modelName) => {
  const response = await axios.post(`${OLLAMA_API}/api/generate`, {
    model: modelName,
    prompt: 'test',
    stream: false,
  });
  if (response.status !== 200 || !response.data.response) {
    throw new Error(`Verification failed: ${response.status}`);
  }
  await log(`Model verified: ${response.data.response.substring(0, 50)}...`);
};

const deleteModel = async (modelName) => {
  try {
    const response = await axios.delete(`${OLLAMA_API}/api/delete`, { data: { name: modelName } });
    await log(`Deleted model ${modelName} (status: ${response.status})`);
  } catch (error) {
    await log(`Error deleting model ${modelName}: ${error.response?.data?.error || error.message}`);
    throw error;
  }
};

const main = async () => {
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.mkdir(STATE_DIR, { recursive: true });
  logPath = path.join(LOG_DIR, `model_reload_${Date.now()}.log`);

  await log('Starting model reload process');

  try {
    const adapterPath = await findAdapterFile();
    await log(`Using adapter: ${adapterPath}`);

    const modelfile = generateModelfile(adapterPath);

    await createModel(TEMP_MODEL_NAME, modelfile);
    await verifyModel(TEMP_MODEL_NAME);

    await log('Verification successful — replacing active model');

    await deleteModel(TARGET_MODEL_NAME).catch(() => log('Old model not found — creating fresh'));
    await createModel(TARGET_MODEL_NAME, modelfile);
    await deleteModel(TEMP_MODEL_NAME);

    await fs.writeFile(ACTIVE_MODEL_FILE, TARGET_MODEL_NAME, 'utf8');
    await log(`Active model updated to: ${TARGET_MODEL_NAME}`);
    await log('=== Model reload completed successfully ===');
  } catch (error) {
    await log(`Fatal error: ${error.message}`);
    await log('Rolling back — cleaning up temp model');
    await deleteModel(TEMP_MODEL_NAME).catch(() => {});
    await log('Old model remains active');
    process.exit(1);
  }
};

main().catch(async (error) => {
  await log(`Critical error: ${error.message}`);
  process.exit(1);
});
