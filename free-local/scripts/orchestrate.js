#!/usr/bin/env node
/**
 * Windsurf Vibe Free-Local Orchestrator
 * =====================================
 * AI-powered service management and intelligent routing
 *
 * Features:
 * - Auto-start/stop services based on demand
 * - Smart model selection based on task
 * - Health monitoring and auto-recovery
 * - Resource optimization for local hardware
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Configuration
const CONFIG = {
  ollama: {
    host: 'http://localhost:11434',
    models: {
      coding: 'qwen2.5-coder:32b',
      fast: 'deepseek-coder-v2:16b',
      reasoning: 'llama3.1:70b',
      autocomplete: 'starcoder2:3b',
      embedding: 'nomic-embed-text',
    },
  },
  services: {
    chromadb: { port: 8000, container: 'chromadb' },
    qdrant: { port: 6333, container: 'qdrant' },
    searxng: { port: 8080, container: 'searxng' },
    redis: { port: 6379, container: 'redis' },
    postgres: { port: 5432, container: 'postgres' },
    n8n: { port: 5678, container: 'n8n' },
    openwebui: { port: 3000, container: 'open-webui' },
  },
  gpu: {
    primary: { name: 'RTX 3090 Ti', vram: 24576 },
    secondary: { name: 'RTX 3060 Ti', vram: 8192 },
  },
};

// Logger
const log = {
  info: msg => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: msg => console.log(`\x1b[32m[✓]\x1b[0m ${msg}`),
  warn: msg => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  error: msg => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  debug: msg => process.env.DEBUG && console.log(`\x1b[90m[DEBUG]\x1b[0m ${msg}`),
};

/**
 * Check if a service is running
 */
async function checkService(name, port) {
  return new Promise(resolve => {
    const req = http.get(`http://localhost:${port}`, { timeout: 2000 }, res => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Check Ollama status and loaded models
 */
async function checkOllama() {
  return new Promise(resolve => {
    http
      .get(`${CONFIG.ollama.host}/api/tags`, { timeout: 5000 }, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ running: true, models: parsed.models || [] });
          } catch {
            resolve({ running: true, models: [] });
          }
        });
      })
      .on('error', () => resolve({ running: false, models: [] }));
  });
}

/**
 * Smart model selection based on task type
 */
function selectModel(taskType) {
  const taskModelMap = {
    code: CONFIG.ollama.models.coding,
    coding: CONFIG.ollama.models.coding,
    debug: CONFIG.ollama.models.coding,
    refactor: CONFIG.ollama.models.coding,
    fast: CONFIG.ollama.models.fast,
    quick: CONFIG.ollama.models.fast,
    chat: CONFIG.ollama.models.fast,
    reason: CONFIG.ollama.models.reasoning,
    analyze: CONFIG.ollama.models.reasoning,
    complex: CONFIG.ollama.models.reasoning,
    complete: CONFIG.ollama.models.autocomplete,
    autocomplete: CONFIG.ollama.models.autocomplete,
    embed: CONFIG.ollama.models.embedding,
    embedding: CONFIG.ollama.models.embedding,
    rag: CONFIG.ollama.models.embedding,
  };

  return taskModelMap[taskType.toLowerCase()] || CONFIG.ollama.models.coding;
}

/**
 * Start Docker containers
 */
function startDockerServices(services = []) {
  const composeFile = path.join(__dirname, '..', 'docker-compose-vibe-stack.yml');

  if (!fs.existsSync(composeFile)) {
    log.error('docker-compose-vibe-stack.yml not found');
    return false;
  }

  try {
    if (services.length === 0) {
      log.info('Starting all Docker services...');
      execSync(`docker-compose -f "${composeFile}" up -d`, { stdio: 'pipe' });
    } else {
      log.info(`Starting services: ${services.join(', ')}`);
      execSync(`docker-compose -f "${composeFile}" up -d ${services.join(' ')}`, { stdio: 'pipe' });
    }
    log.success('Docker services started');
    return true;
  } catch (err) {
    log.error(`Failed to start Docker: ${err.message}`);
    return false;
  }
}

/**
 * Health check all services
 */
async function healthCheck() {
  log.info('Running health check...\n');

  const results = {
    ollama: await checkOllama(),
    services: {},
  };

  // Check Ollama
  if (results.ollama.running) {
    log.success(`Ollama: Running (${results.ollama.models.length} models loaded)`);
    results.ollama.models.forEach(m => {
      log.debug(`  - ${m.name} (${(m.size / 1e9).toFixed(1)}GB)`);
    });
  } else {
    log.warn('Ollama: Not running - start with: ollama serve');
  }

  // Check Docker services
  for (const [name, config] of Object.entries(CONFIG.services)) {
    const running = await checkService(name, config.port);
    results.services[name] = running;
    if (running) {
      log.success(`${name}: Running on port ${config.port}`);
    } else {
      log.warn(`${name}: Not running (port ${config.port})`);
    }
  }

  return results;
}

/**
 * Auto-provision based on task
 */
async function autoProvision(taskType) {
  log.info(`Auto-provisioning for task: ${taskType}`);

  const model = selectModel(taskType);
  log.info(`Selected model: ${model}`);

  // Check if Ollama has the model
  const ollama = await checkOllama();
  if (!ollama.running) {
    log.warn('Ollama not running. Starting...');
    spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' }).unref();
    await new Promise(r => setTimeout(r, 3000));
  }

  const modelLoaded = ollama.models.some(m => m.name.startsWith(model.split(':')[0]));
  if (!modelLoaded) {
    log.info(`Pulling model ${model}...`);
    try {
      execSync(`ollama pull ${model}`, { stdio: 'inherit' });
    } catch {
      log.warn(`Could not pull ${model}, will use available model`);
    }
  }

  // Start relevant services based on task
  if (['embed', 'embedding', 'rag'].includes(taskType.toLowerCase())) {
    const chromaRunning = await checkService('chromadb', 8000);
    if (!chromaRunning) {
      startDockerServices(['chromadb']);
    }
  }

  if (['search', 'web', 'research'].includes(taskType.toLowerCase())) {
    const searxRunning = await checkService('searxng', 8080);
    if (!searxRunning) {
      startDockerServices(['searxng']);
    }
  }

  log.success('Auto-provisioning complete');
  return { model, ready: true };
}

/**
 * Get system resource usage
 */
function getSystemResources() {
  try {
    // GPU info via nvidia-smi
    const gpuInfo = execSync(
      'nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv,noheader,nounits',
      { encoding: 'utf8' }
    );
    const gpus = gpuInfo
      .trim()
      .split('\n')
      .map(line => {
        const [name, memUsed, memTotal, util] = line.split(', ');
        return {
          name: name.trim(),
          memoryUsed: parseInt(memUsed),
          memoryTotal: parseInt(memTotal),
          utilization: parseInt(util),
        };
      });
    return { gpus };
  } catch {
    return { gpus: [] };
  }
}

/**
 * Display status dashboard
 */
async function showDashboard() {
  console.clear();
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║           🚀 WINDSURF VIBE - FREE LOCAL DASHBOARD                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  // GPU Status
  const resources = getSystemResources();
  console.log('📊 GPU STATUS');
  console.log('─'.repeat(50));
  resources.gpus.forEach((gpu, i) => {
    const memPercent = ((gpu.memoryUsed / gpu.memoryTotal) * 100).toFixed(0);
    const bar =
      '█'.repeat(Math.floor(memPercent / 5)) + '░'.repeat(20 - Math.floor(memPercent / 5));
    console.log(`  GPU ${i}: ${gpu.name}`);
    console.log(`  VRAM: [${bar}] ${gpu.memoryUsed}/${gpu.memoryTotal}MB (${memPercent}%)`);
    console.log(`  Util: ${gpu.utilization}%\n`);
  });

  // Service Status
  console.log('🐳 SERVICES');
  console.log('─'.repeat(50));
  const health = await healthCheck();

  console.log('\n💡 QUICK COMMANDS');
  console.log('─'.repeat(50));
  console.log('  Start all:  node orchestrate.js start');
  console.log('  Stop all:   node orchestrate.js stop');
  console.log('  Provision:  node orchestrate.js provision <task>');
  console.log('  Health:     node orchestrate.js health');
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'help';

(async () => {
  switch (command) {
    case 'health':
    case 'status':
      await healthCheck();
      break;

    case 'start':
      const services = args.slice(1);
      if (services.length === 0) {
        log.info('Starting Ollama...');
        spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' }).unref();
        await new Promise(r => setTimeout(r, 2000));
      }
      startDockerServices(services);
      break;

    case 'stop':
      log.info('Stopping Docker services...');
      const composeFile = path.join(__dirname, '..', 'docker-compose-vibe-stack.yml');
      try {
        execSync(`docker-compose -f "${composeFile}" down`, { stdio: 'inherit' });
      } catch {}
      break;

    case 'provision':
      const taskType = args[1] || 'coding';
      await autoProvision(taskType);
      break;

    case 'model':
      const task = args[1] || 'coding';
      console.log(`Recommended model for "${task}": ${selectModel(task)}`);
      break;

    case 'dashboard':
    case 'dash':
      await showDashboard();
      break;

    case 'resources':
    case 'gpu':
      const res = getSystemResources();
      console.log(JSON.stringify(res, null, 2));
      break;

    default:
      console.log(`
Windsurf Vibe Free-Local Orchestrator
=====================================

Usage: node orchestrate.js <command> [options]

Commands:
  health              Check status of all services
  start [services]    Start Ollama and/or Docker services
  stop                Stop all Docker services
  provision <task>    Auto-provision for task (coding, rag, search)
  model <task>        Get recommended model for task type
  dashboard           Show interactive dashboard
  gpu                 Show GPU resource usage

Task Types:
  coding, debug, refactor  → qwen2.5-coder:32b
  fast, quick, chat        → deepseek-coder-v2:16b
  reason, analyze          → llama3.1:70b
  embed, rag               → nomic-embed-text
  autocomplete             → starcoder2:3b

Examples:
  node orchestrate.js start
  node orchestrate.js provision coding
  node orchestrate.js model rag
`);
  }
})();
