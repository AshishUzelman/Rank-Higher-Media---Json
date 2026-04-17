#!/usr/bin/env node
/**
 * ARES Daemon — run the connector in the background
 *
 * Commands:
 *   npm run ares-start   → start connector in background, log to logs/connector.log
 *   npm run ares-stop    → stop the background connector
 *   npm run ares-status  → show if running + last 10 log lines
 *   npm run ares-log     → tail -f the live log (Ctrl+C to stop watching)
 *
 * This means you never need a second terminal open just for the connector.
 */

const { spawn, execSync } = require('child_process')
const fs   = require('fs')
const path = require('path')

const ROOT    = path.join(__dirname, '..')
const PID_FILE = path.join(ROOT, '.ares.pid')
const LOG_DIR  = path.join(ROOT, 'logs')
const LOG_FILE = path.join(LOG_DIR, 'connector.log')

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })

const command = process.argv[2]

function isRunning(pid) {
  try { process.kill(pid, 0); return true } catch { return false }
}

function start() {
  if (fs.existsSync(PID_FILE)) {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'))
    if (isRunning(pid)) {
      console.log(`✅ ARES connector already running (PID ${pid})`)
      console.log(`   Watch logs: npm run ares-log`)
      return
    }
    fs.unlinkSync(PID_FILE)
  }

  const logStream = fs.openSync(LOG_FILE, 'a')
  const child = spawn('node', [path.join(__dirname, 'agent_connector.js')], {
    detached: true,
    stdio: ['ignore', logStream, logStream],
    cwd: ROOT,
  })

  child.unref()
  fs.writeFileSync(PID_FILE, String(child.pid))

  console.log(`🤖 ARES connector started (PID ${child.pid})`)
  console.log(`   Logs: logs/connector.log`)
  console.log(`   Watch: npm run ares-log`)
  console.log(`   Stop:  npm run ares-stop`)
}

function stop() {
  if (!fs.existsSync(PID_FILE)) {
    console.log('ℹ️  ARES connector is not running')
    return
  }
  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'))
  if (!isRunning(pid)) {
    console.log('ℹ️  ARES connector was not running (stale PID removed)')
    fs.unlinkSync(PID_FILE)
    return
  }
  process.kill(pid, 'SIGTERM')
  fs.unlinkSync(PID_FILE)
  console.log(`🛑 ARES connector stopped (PID ${pid})`)
}

function status() {
  if (!fs.existsSync(PID_FILE)) {
    console.log('⭕ ARES connector: not running')
  } else {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'))
    if (isRunning(pid)) {
      console.log(`✅ ARES connector: running (PID ${pid})`)
    } else {
      console.log('⭕ ARES connector: not running (stale PID)')
      fs.unlinkSync(PID_FILE)
    }
  }

  if (fs.existsSync(LOG_FILE)) {
    console.log('\n── Last 10 log lines ──')
    try {
      const output = execSync(`tail -10 "${LOG_FILE}"`).toString()
      console.log(output)
    } catch { /* ignore */ }
  }
}

switch (command) {
  case 'start':  start();  break
  case 'stop':   stop();   break
  case 'status': status(); break
  default:
    console.log('Usage: node scripts/ares_daemon.js [start|stop|status]')
    console.log('  npm run ares-start   → run connector in background')
    console.log('  npm run ares-stop    → stop it')
    console.log('  npm run ares-status  → check + see last 10 log lines')
    console.log('  npm run ares-log     → live tail the log')
}
