#!/usr/bin/env node
/**
 * ============================================================================
 * Health Daemon - Windsurf Vibe Free-Local
 * ============================================================================
 * Continuous service monitoring and auto-recovery daemon.
 *
 * Features:
 * - Monitors all free-local services
 * - Auto-restarts failed services
 * - GPU memory monitoring
 * - Alert logging
 * - Resource optimization
 * ============================================================================
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  checkInterval: 30000, // 30 seconds
  maxRestartAttempts: 3,
  restartCooldown: 60000, // 1 minute between restart attempts

  services: {
    ollama: {
      url: 'http://localhost:11434/api/tags',
      critical: true,
      restartCmd: 'ollama serve',
    },
    chromadb: {
      url: 'http://localhost:8000/api/v1/heartbeat',
      critical: false,
      container: 'chromadb',
    },
    qdrant: {
      url: 'http://localhost:6333/collections',
      critical: false,
      container: 'qdrant',
    },
    searxng: {
      url: 'http://localhost:8080',
      critical: false,
      container: 'searxng',
    },
    redis: {
      url: 'http://localhost:6379',
      tcpCheck: true,
      critical: false,
      container: 'redis',
    },
    openwebui: {
      url: 'http://localhost:3000',
      critical: false,
      container: 'open-webui',
    },
    n8n: {
      url: 'http://localhost:5678',
      critical: false,
      container: 'n8n',
    },
  },

  thresholds: {
    gpuMemoryWarning: 90, // percent
    gpuMemoryCritical: 95,
    cpuWarning: 80,
    ramWarning: 85,
  },

  paths: {
    composeFile: path.join(__dirname, '..', 'docker-compose-vibe-stack.yml'),
    logFile: path.join(__dirname, '..', '..', 'logs', 'health-daemon.log'),
    stateFile: path.join(__dirname, '..', '.daemon-state.json'),
  },
};

// Ensure log directory exists
const logDir = path.dirname(CONFIG.paths.logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let state = {
  restartAttempts: {},
  lastRestartTime: {},
  alerts: [],
  startTime: Date.now(),
};

function saveState() {
  fs.writeFileSync(CONFIG.paths.stateFile, JSON.stringify(state, null, 2));
}

function loadState() {
  if (fs.existsSync(CONFIG.paths.stateFile)) {
    try {
      state = { ...state, ...JSON.parse(fs.readFileSync(CONFIG.paths.stateFile, 'utf8')) };
    } catch {}
  }
}

// ============================================================================
// LOGGING
// ============================================================================

function log(level, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}`;

  fs.appendFileSync(CONFIG.paths.logFile, line + '\n');

  const colors = {
    INFO: '\x1b[36m',
    OK: '\x1b[32m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
    ALERT: '\x1b[35m',
  };

  console.log(`${colors[level] || ''}[${level}]\x1b[0m ${message}`);
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

async function checkHttp(url, timeout = 5000) {
  return new Promise(resolve => {
    const req = http.get(url, { timeout }, res => {
      resolve({ ok: res.statusCode < 400, status: res.statusCode });
    });
    req.on('error', () => resolve({ ok: false, error: 'connection failed' }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'timeout' });
    });
  });
}

async function checkService(name, config) {
  if (config.tcpCheck) {
    // TCP check for Redis
    return new Promise(resolve => {
      const net = require('net');
      const socket = new net.Socket();
      socket.setTimeout(3000);
      socket.connect(6379, 'localhost', () => {
        socket.destroy();
        resolve({ ok: true });
      });
      socket.on('error', () => resolve({ ok: false }));
      socket.on('timeout', () => {
        socket.destroy();
        resolve({ ok: false });
      });
    });
  }

  return checkHttp(config.url);
}

async function checkGpuResources() {
  try {
    const output = execSync(
      'nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits',
      { encoding: 'utf8' }
    );

    return output
      .trim()
      .split('\n')
      .map((line, index) => {
        const [name, memUsed, memTotal, util, temp] = line.split(', ');
        const memPercent = (parseInt(memUsed) / parseInt(memTotal)) * 100;

        return {
          index,
          name: name.trim(),
          memUsed: parseInt(memUsed),
          memTotal: parseInt(memTotal),
          memPercent: memPercent.toFixed(1),
          utilization: parseInt(util),
          temperature: parseInt(temp),
        };
      });
  } catch {
    return [];
  }
}

// ============================================================================
// AUTO-RECOVERY
// ============================================================================

function canRestart(serviceName) {
  const attempts = state.restartAttempts[serviceName] || 0;
  const lastRestart = state.lastRestartTime[serviceName] || 0;
  const timeSinceRestart = Date.now() - lastRestart;

  return attempts < CONFIG.maxRestartAttempts && timeSinceRestart > CONFIG.restartCooldown;
}

async function restartService(name, config) {
  if (!canRestart(name)) {
    log('WARN', `${name}: Max restart attempts reached or cooldown active`);
    return false;
  }

  log(
    'ALERT',
    `${name}: Attempting restart (attempt ${(state.restartAttempts[name] || 0) + 1}/${CONFIG.maxRestartAttempts})`
  );

  state.restartAttempts[name] = (state.restartAttempts[name] || 0) + 1;
  state.lastRestartTime[name] = Date.now();
  saveState();

  try {
    if (config.container) {
      // Docker container
      execSync(`docker-compose -f "${CONFIG.paths.composeFile}" restart ${config.container}`, {
        stdio: 'pipe',
      });
    } else if (config.restartCmd) {
      // System process (like Ollama)
      spawn('cmd', ['/c', config.restartCmd], { detached: true, stdio: 'ignore' }).unref();
    }

    // Wait and verify
    await new Promise(r => setTimeout(r, 5000));
    const status = await checkService(name, config);

    if (status.ok) {
      log('OK', `${name}: Restart successful`);
      state.restartAttempts[name] = 0;
      saveState();
      return true;
    }
  } catch (err) {
    log('ERROR', `${name}: Restart failed - ${err.message}`);
  }

  return false;
}

// ============================================================================
// MAIN MONITORING LOOP
// ============================================================================

async function runHealthCheck() {
  const results = { timestamp: new Date().toISOString(), services: {}, gpu: [], alerts: [] };

  // Check services
  for (const [name, config] of Object.entries(CONFIG.services)) {
    const status = await checkService(name, config);
    results.services[name] = status.ok;

    if (status.ok) {
      // Reset restart counter on successful check
      if (state.restartAttempts[name] > 0) {
        state.restartAttempts[name] = 0;
        saveState();
      }
    } else {
      log('WARN', `${name}: Service unhealthy`);

      // Auto-restart if enabled
      if (config.critical || process.env.AUTO_RESTART === 'true') {
        await restartService(name, config);
      }

      results.alerts.push({ service: name, message: 'Service unhealthy' });
    }
  }

  // Check GPU resources
  const gpus = await checkGpuResources();
  results.gpu = gpus;

  for (const gpu of gpus) {
    if (parseFloat(gpu.memPercent) > CONFIG.thresholds.gpuMemoryCritical) {
      log('ALERT', `GPU ${gpu.index} memory critical: ${gpu.memPercent}%`);
      results.alerts.push({ gpu: gpu.index, message: `Memory critical: ${gpu.memPercent}%` });
    } else if (parseFloat(gpu.memPercent) > CONFIG.thresholds.gpuMemoryWarning) {
      log('WARN', `GPU ${gpu.index} memory high: ${gpu.memPercent}%`);
    }

    if (gpu.temperature > 85) {
      log('WARN', `GPU ${gpu.index} temperature high: ${gpu.temperature}°C`);
    }
  }

  return results;
}

async function startDaemon() {
  log('INFO', '═'.repeat(50));
  log('INFO', 'HEALTH DAEMON STARTING');
  log('INFO', `Check interval: ${CONFIG.checkInterval / 1000}s`);
  log('INFO', `Auto-restart: ${process.env.AUTO_RESTART === 'true' ? 'enabled' : 'disabled'}`);
  log('INFO', '═'.repeat(50));

  loadState();

  // Initial check
  await runHealthCheck();

  // Continuous monitoring
  setInterval(async () => {
    try {
      await runHealthCheck();
    } catch (err) {
      log('ERROR', `Health check failed: ${err.message}`);
    }
  }, CONFIG.checkInterval);
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);

if (args[0] === 'start' || args[0] === 'daemon') {
  startDaemon();
} else if (args[0] === 'check') {
  runHealthCheck().then(results => {
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  });
} else {
  console.log(`
Health Daemon - Windsurf Vibe Free-Local
========================================

Usage:
  node health-daemon.js start       Start continuous monitoring
  node health-daemon.js check       Run single health check

Environment:
  AUTO_RESTART=true                 Enable auto-restart of failed services

Example:
  AUTO_RESTART=true node health-daemon.js start
`);
}
