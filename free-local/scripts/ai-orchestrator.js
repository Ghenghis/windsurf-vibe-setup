#!/usr/bin/env node
/**
 * ============================================================================
 * AI Orchestrator - Windsurf Vibe Free-Local
 * ============================================================================
 * The central brain for AI/ML automation. This orchestrator:
 * - Auto-selects optimal models based on task analysis
 * - Provisions services on-demand
 * - Coordinates multi-agent workflows
 * - Monitors resources and auto-scales
 * - Integrates with MCP server (250+ tools)
 * ============================================================================
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { selectModel, detectTaskType, MODELS } = require('./model-router');

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  ollama: {
    host: 'http://localhost:11434',
    defaultModel: 'qwen2.5-coder:32b',
    embeddingModel: 'nomic-embed-text'
  },
  services: {
    chromadb: { host: 'http://localhost:8000', docker: 'chromadb' },
    qdrant: { host: 'http://localhost:6333', docker: 'qdrant' },
    searxng: { host: 'http://localhost:8080', docker: 'searxng' },
    redis: { host: 'redis://localhost:6379', docker: 'redis' },
    postgres: { host: 'postgresql://localhost:5432', docker: 'postgres' },
    n8n: { host: 'http://localhost:5678', docker: 'n8n' },
    openwebui: { host: 'http://localhost:3000', docker: 'open-webui' }
  },
  hardware: {
    primaryGpu: { name: 'RTX 3090 Ti', vram: 24576, index: 0 },
    secondaryGpu: { name: 'RTX 3060 Ti', vram: 8192, index: 1 },
    totalRam: 131072 // 128GB
  },
  paths: {
    composeFile: path.join(__dirname, '..', 'docker-compose-vibe-stack.yml'),
    logsDir: path.join(__dirname, '..', '..', 'logs', 'orchestrator'),
    agentScript: path.join(__dirname, 'agent-crew.py')
  }
};

// Ensure logs directory exists
if (!fs.existsSync(CONFIG.paths.logsDir)) {
  fs.mkdirSync(CONFIG.paths.logsDir, { recursive: true });
}

// ============================================================================
// LOGGING
// ============================================================================
const LOG_FILE = path.join(CONFIG.paths.logsDir, `orchestrator-${new Date().toISOString().split('T')[0]}.log`);

const log = {
  _write: (level, msg) => {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] ${msg}`;
    fs.appendFileSync(LOG_FILE, line + '\n');
    const colors = { INFO: '\x1b[36m', SUCCESS: '\x1b[32m', WARN: '\x1b[33m', ERROR: '\x1b[31m', DEBUG: '\x1b[90m' };
    console.log(`${colors[level] || ''}[${level}]\x1b[0m ${msg}`);
  },
  info: (msg) => log._write('INFO', msg),
  success: (msg) => log._write('SUCCESS', msg),
  warn: (msg) => log._write('WARN', msg),
  error: (msg) => log._write('ERROR', msg),
  debug: (msg) => process.env.DEBUG && log._write('DEBUG', msg)
};

// ============================================================================
// SERVICE MANAGEMENT
// ============================================================================

async function httpGet(url, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function httpPost(url, body, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      timeout,
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function checkOllamaStatus() {
  try {
    const res = await httpGet(`${CONFIG.ollama.host}/api/tags`);
    const data = JSON.parse(res.data);
    return { running: true, models: data.models || [] };
  } catch {
    return { running: false, models: [] };
  }
}

async function checkServiceStatus(name) {
  const service = CONFIG.services[name];
  if (!service) return { name, running: false };
  try {
    await httpGet(service.host);
    return { name, running: true };
  } catch {
    return { name, running: false };
  }
}

function startDockerService(serviceName) {
  try {
    execSync(`docker-compose -f "${CONFIG.paths.composeFile}" up -d ${serviceName}`, { stdio: 'pipe' });
    return true;
  } catch (err) {
    log.error(`Failed to start ${serviceName}: ${err.message}`);
    return false;
  }
}

function stopDockerService(serviceName) {
  try {
    execSync(`docker-compose -f "${CONFIG.paths.composeFile}" stop ${serviceName}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// AI TASK ANALYSIS
// ============================================================================

const TASK_PATTERNS = {
  coding: {
    keywords: ['code', 'function', 'class', 'implement', 'write', 'create', 'build', 'component', 'module'],
    services: ['ollama'],
    model: 'qwen2.5-coder:32b',
    agents: ['coder']
  },
  debugging: {
    keywords: ['debug', 'fix', 'error', 'bug', 'issue', 'broken', 'wrong', 'crash', 'fail'],
    services: ['ollama'],
    model: 'qwen2.5-coder:32b',
    agents: ['coder', 'reviewer']
  },
  refactoring: {
    keywords: ['refactor', 'optimize', 'clean', 'improve', 'restructure', 'simplify'],
    services: ['ollama'],
    model: 'qwen2.5-coder:32b',
    agents: ['coder', 'reviewer']
  },
  architecture: {
    keywords: ['architect', 'design', 'structure', 'pattern', 'system', 'scale', 'microservice'],
    services: ['ollama'],
    model: 'llama3.1:70b',
    agents: ['architect']
  },
  testing: {
    keywords: ['test', 'spec', 'coverage', 'unit', 'integration', 'e2e', 'jest', 'pytest'],
    services: ['ollama'],
    model: 'deepseek-coder-v2:16b',
    agents: ['tester']
  },
  research: {
    keywords: ['search', 'find', 'research', 'look up', 'documentation', 'example', 'how to'],
    services: ['ollama', 'searxng'],
    model: 'deepseek-coder-v2:16b',
    agents: ['researcher']
  },
  rag: {
    keywords: ['context', 'embed', 'vector', 'retrieve', 'similar', 'knowledge', 'document'],
    services: ['ollama', 'chromadb'],
    model: 'nomic-embed-text',
    agents: ['researcher']
  },
  documentation: {
    keywords: ['document', 'readme', 'comment', 'explain', 'describe', 'api', 'spec'],
    services: ['ollama'],
    model: 'deepseek-coder-v2:16b',
    agents: ['docwriter']
  },
  review: {
    keywords: ['review', 'audit', 'check', 'security', 'best practice', 'lint', 'quality'],
    services: ['ollama'],
    model: 'qwen2.5-coder:32b',
    agents: ['reviewer']
  }
};

function analyzeTask(prompt) {
  const lower = prompt.toLowerCase();
  const scores = {};
  
  for (const [taskType, config] of Object.entries(TASK_PATTERNS)) {
    scores[taskType] = config.keywords.filter(kw => lower.includes(kw)).length;
  }
  
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const bestMatch = sorted[0][1] > 0 ? sorted[0][0] : 'coding';
  const pattern = TASK_PATTERNS[bestMatch];
  
  return {
    taskType: bestMatch,
    confidence: sorted[0][1] > 0 ? Math.min(sorted[0][1] / 3, 1) : 0.5,
    requiredServices: pattern.services,
    recommendedModel: pattern.model,
    suggestedAgents: pattern.agents,
    allScores: scores
  };
}

// ============================================================================
// AUTO-PROVISIONING
// ============================================================================

async function ensureServiceRunning(serviceName) {
  const status = await checkServiceStatus(serviceName);
  if (status.running) {
    log.debug(`${serviceName} already running`);
    return true;
  }
  
  log.info(`Starting ${serviceName}...`);
  if (startDockerService(serviceName)) {
    // Wait for service to be ready
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const check = await checkServiceStatus(serviceName);
      if (check.running) {
        log.success(`${serviceName} started successfully`);
        return true;
      }
    }
  }
  
  log.error(`Failed to start ${serviceName}`);
  return false;
}

async function ensureOllamaRunning() {
  const status = await checkOllamaStatus();
  if (status.running) {
    log.debug('Ollama already running');
    return status;
  }
  
  log.info('Starting Ollama...');
  spawn('ollama', ['serve'], { detached: true, stdio: 'ignore' }).unref();
  
  // Wait for Ollama to start
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const check = await checkOllamaStatus();
    if (check.running) {
      log.success('Ollama started successfully');
      return check;
    }
  }
  
  throw new Error('Failed to start Ollama');
}

async function ensureModelLoaded(modelName) {
  const status = await checkOllamaStatus();
  if (!status.running) {
    await ensureOllamaRunning();
  }
  
  // Check if model is available
  const hasModel = status.models?.some(m => m.name.includes(modelName.split(':')[0]));
  if (!hasModel) {
    log.info(`Pulling model ${modelName}...`);
    try {
      execSync(`ollama pull ${modelName}`, { stdio: 'inherit' });
      log.success(`Model ${modelName} ready`);
    } catch (err) {
      log.warn(`Could not pull ${modelName}: ${err.message}`);
    }
  }
  
  return true;
}

// ============================================================================
// MAIN ORCHESTRATION
// ============================================================================

async function orchestrate(prompt, options = {}) {
  log.info('═'.repeat(60));
  log.info('AI ORCHESTRATOR - Processing Request');
  log.info('═'.repeat(60));
  
  // Step 1: Analyze the task
  const analysis = analyzeTask(prompt);
  log.info(`Task Type: ${analysis.taskType} (confidence: ${(analysis.confidence * 100).toFixed(0)}%)`);
  log.info(`Model: ${analysis.recommendedModel}`);
  log.info(`Services: ${analysis.requiredServices.join(', ')}`);
  log.info(`Agents: ${analysis.suggestedAgents.join(', ')}`);
  
  // Step 2: Provision required services
  log.info('');
  log.info('Provisioning services...');
  
  for (const service of analysis.requiredServices) {
    if (service === 'ollama') {
      await ensureOllamaRunning();
      await ensureModelLoaded(analysis.recommendedModel);
    } else {
      await ensureServiceRunning(service);
    }
  }
  
  // Step 3: Execute the request
  log.info('');
  log.info('Executing request...');
  
  if (options.useAgents && analysis.suggestedAgents.length > 0) {
    // Use CrewAI agents
    return await executeWithAgents(prompt, analysis);
  } else {
    // Direct LLM query
    return await executeLlmQuery(prompt, analysis.recommendedModel);
  }
}

async function executeLlmQuery(prompt, model) {
  try {
    const response = await httpPost(`${CONFIG.ollama.host}/api/generate`, {
      model,
      prompt,
      stream: false
    }, 120000); // 2 minute timeout
    
    const result = JSON.parse(response.data);
    log.success('LLM query completed');
    return {
      success: true,
      model,
      response: result.response,
      tokens: result.eval_count,
      duration: result.total_duration
    };
  } catch (err) {
    log.error(`LLM query failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function executeWithAgents(prompt, analysis) {
  // Check if Python agent script exists
  if (!fs.existsSync(CONFIG.paths.agentScript)) {
    log.warn('Agent script not found, falling back to direct LLM');
    return await executeLlmQuery(prompt, analysis.recommendedModel);
  }
  
  try {
    const result = execSync(
      `python "${CONFIG.paths.agentScript}" --task "${prompt}" --agents ${analysis.suggestedAgents.join(',')}`,
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
    log.success('Agent crew completed');
    return { success: true, agents: analysis.suggestedAgents, response: result };
  } catch (err) {
    log.warn(`Agent execution failed, falling back to LLM: ${err.message}`);
    return await executeLlmQuery(prompt, analysis.recommendedModel);
  }
}

// ============================================================================
// HEALTH CHECK & MONITORING
// ============================================================================

async function fullHealthCheck() {
  console.log('\n' + '═'.repeat(60));
  console.log('  WINDSURF VIBE FREE-LOCAL HEALTH CHECK');
  console.log('═'.repeat(60) + '\n');
  
  const results = { ollama: null, services: {}, gpu: null };
  
  // Check Ollama
  const ollama = await checkOllamaStatus();
  results.ollama = ollama;
  if (ollama.running) {
    console.log(`✅ Ollama: Running (${ollama.models.length} models)`);
    ollama.models.forEach(m => console.log(`   └─ ${m.name}`));
  } else {
    console.log('❌ Ollama: Not running');
  }
  
  // Check services
  console.log('\n📦 Docker Services:');
  for (const [name, config] of Object.entries(CONFIG.services)) {
    const status = await checkServiceStatus(name);
    results.services[name] = status.running;
    const icon = status.running ? '✅' : '⬚';
    console.log(`   ${icon} ${name}: ${status.running ? 'Running' : 'Stopped'}`);
  }
  
  // Check GPU
  console.log('\n🎮 GPU Status:');
  try {
    const gpuInfo = execSync('nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader,nounits', { encoding: 'utf8' });
    const gpus = gpuInfo.trim().split('\n').map(line => {
      const [name, used, total] = line.split(', ');
      const percent = ((parseInt(used) / parseInt(total)) * 100).toFixed(0);
      console.log(`   🖥️  ${name.trim()}: ${used}/${total} MB (${percent}%)`);
      return { name: name.trim(), used: parseInt(used), total: parseInt(total) };
    });
    results.gpu = gpus;
  } catch {
    console.log('   ⚠️  Unable to query GPU');
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
  return results;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

const args = process.argv.slice(2);
const command = args[0] || 'help';

(async () => {
  try {
    switch (command) {
      case 'run':
      case 'execute':
        const prompt = args.slice(1).join(' ');
        if (!prompt) {
          console.log('Usage: node ai-orchestrator.js run "<prompt>"');
          process.exit(1);
        }
        const result = await orchestrate(prompt, { useAgents: args.includes('--agents') });
        console.log('\n' + '─'.repeat(60));
        console.log('RESULT:');
        console.log('─'.repeat(60));
        console.log(result.response || JSON.stringify(result, null, 2));
        break;
        
      case 'analyze':
        const taskPrompt = args.slice(1).join(' ') || 'Write a function';
        const analysis = analyzeTask(taskPrompt);
        console.log(JSON.stringify(analysis, null, 2));
        break;
        
      case 'health':
      case 'status':
        await fullHealthCheck();
        break;
        
      case 'provision':
        const taskType = args[1] || 'coding';
        const taskAnalysis = analyzeTask(taskType);
        for (const service of taskAnalysis.requiredServices) {
          if (service === 'ollama') {
            await ensureOllamaRunning();
            await ensureModelLoaded(taskAnalysis.recommendedModel);
          } else {
            await ensureServiceRunning(service);
          }
        }
        log.success(`Provisioned for ${taskType}`);
        break;
        
      case 'start':
        log.info('Starting all services...');
        await ensureOllamaRunning();
        execSync(`docker-compose -f "${CONFIG.paths.composeFile}" up -d`, { stdio: 'inherit' });
        log.success('All services started');
        break;
        
      case 'stop':
        log.info('Stopping Docker services...');
        execSync(`docker-compose -f "${CONFIG.paths.composeFile}" down`, { stdio: 'inherit' });
        log.success('Services stopped');
        break;
        
      default:
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║           AI ORCHESTRATOR - Windsurf Vibe Free-Local                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

Usage: node ai-orchestrator.js <command> [options]

Commands:
  run "<prompt>"      Execute AI task with auto-provisioning
  run "<prompt>" --agents    Use CrewAI agents for complex tasks
  analyze "<prompt>"  Analyze task and show recommendations
  health              Full health check of all services
  provision <task>    Auto-provision for task type
  start               Start all services
  stop                Stop all Docker services

Task Types:
  coding, debugging, refactoring, architecture, testing,
  research, rag, documentation, review

Examples:
  node ai-orchestrator.js run "Write a React hook for auth"
  node ai-orchestrator.js run "Design a microservices architecture" --agents
  node ai-orchestrator.js analyze "Debug the login function"
  node ai-orchestrator.js provision rag
  node ai-orchestrator.js health
`);
    }
  } catch (err) {
    log.error(`Fatal error: ${err.message}`);
    process.exit(1);
  }
})();

module.exports = { orchestrate, analyzeTask, fullHealthCheck };
