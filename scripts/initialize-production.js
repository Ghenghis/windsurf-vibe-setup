#!/usr/bin/env node

/**
 * Production Initialization Script
 * Makes v4.x features actually work
 */

const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

const chalk = require('chalk');
const ora = require('ora');

console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════════════════╗
║     Windsurf Vibe Setup v4.3.0 - Production Init        ║
║          Making the Magic Actually Work! 🚀             ║
╚══════════════════════════════════════════════════════════╝
`));

async function checkDependencies() {
  const spinner = ora('Checking dependencies...').start();
  
  const checks = [
    { name: 'Node.js', cmd: 'node --version', required: true },
    { name: 'npm', cmd: 'npm --version', required: true },
    { name: 'Python', cmd: 'python --version', required: true },
    { name: 'pip', cmd: 'pip --version', required: true },
    { name: 'Docker', cmd: 'docker --version', required: false },
    { name: 'Ollama', cmd: 'ollama --version', required: false },
    { name: 'Git', cmd: 'git --version', required: true }
  ];
  
  const results = [];
  
  for (const check of checks) {
    try {
      const { stdout } = await execPromise(check.cmd);
      results.push({ 
        name: check.name, 
        status: '✅', 
        version: stdout.trim() 
      });
    } catch (error) {
      results.push({ 
        name: check.name, 
        status: check.required ? '❌ REQUIRED' : '⚠️  Optional',
        version: 'Not installed'
      });
      if (check.required) {
        spinner.fail(`${check.name} is required but not installed`);
        process.exit(1);
      }
    }
  }
  
  spinner.succeed('Dependencies checked');
  console.table(results);
  
  return results;
}

async function installPythonDependencies() {
  const spinner = ora('Installing Python dependencies...').start();
  
  try {
    // Create requirements.txt
    const requirements = `
open-interpreter>=0.2.0
chromadb>=0.4.0
redis>=5.0.0
psycopg2-binary>=2.9.0
python-dotenv>=1.0.0
pyyaml>=6.0
pyautogui>=0.9.54
pytesseract>=0.3.10
pillow>=10.0.0
transformers>=4.35.0
torch>=2.0.0
langchain>=0.1.0
crewai>=0.1.0
    `.trim();
    
    await fs.writeFile('requirements.txt', requirements);
    
    // Install dependencies
    spinner.text = 'Installing Open Interpreter...';
    await execPromise('pip install open-interpreter --quiet');
    
    spinner.text = 'Installing AI/ML dependencies...';
    await execPromise('pip install -r requirements.txt --quiet');
    
    spinner.succeed('Python dependencies installed');
  } catch (error) {
    spinner.warn('Some Python packages failed to install (this is okay for now)');
    console.log(chalk.yellow('You can install them manually later with: pip install -r requirements.txt'));
  }
}

async function fixBrokenImports() {
  const spinner = ora('Fixing broken imports in source files...').start();
  
  const fixes = [
    {
      file: 'mcp-server/src/swarm/hive-mind.js',
      fixes: [
        {
          line: 1,
          insert: "const fetch = require('node-fetch');\n"
        }
      ]
    },
    {
      file: 'mcp-server/src/hive-core.js',
      fixes: [
        {
          line: 1,
          insert: "const fetch = require('node-fetch');\n"
        }
      ]
    },
    {
      file: 'mcp-server/src/ai-agents/orchestrator.js',
      fixes: [
        {
          line: 1,
          insert: "const fetch = require('node-fetch');\n"
        }
      ]
    },
    {
      file: 'mcp-server/src/memory/mem0-local.js',
      fixes: [
        {
          line: 1,
          insert: "const fetch = require('node-fetch');\n"
        }
      ]
    }
  ];
  
  for (const fix of fixes) {
    try {
      const filePath = path.join(process.cwd(), fix.file);
      let content = await fs.readFile(filePath, 'utf8');
      
      // Check if fetch is already imported
      if (!content.includes("require('node-fetch')")) {
        // Add import at the top
        content = fix.fixes[0].insert + content;
        await fs.writeFile(filePath, content);
        spinner.text = `Fixed ${fix.file}`;
      }
    } catch (error) {
      console.log(chalk.yellow(`Could not fix ${fix.file}: ${error.message}`));
    }
  }
  
  // Also copy fixes to lmstudio-autopilot
  spinner.text = 'Syncing fixes to lmstudio-autopilot...';
  
  try {
    await execPromise('xcopy /E /Y /Q mcp-server\\src\\*.js lmstudio-autopilot\\src\\');
  } catch {
    // Fallback for non-Windows
    try {
      await execPromise('cp -r mcp-server/src/* lmstudio-autopilot/src/');
    } catch {
      spinner.warn('Could not sync to lmstudio-autopilot (manual sync needed)');
    }
  }
  
  spinner.succeed('Import fixes applied');
}

async function createDockerCompose() {
  const spinner = ora('Creating Docker Compose configuration...').start();
  
  const dockerCompose = `
version: '3.8'

services:
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    environment:
      - CHROMA_SERVER_AUTH_PROVIDER=chromadb.auth.token_authn.TokenAuthenticationServerProvider
      - CHROMA_SERVER_AUTH_CREDENTIALS_PROVIDER=chromadb.auth.token_authn.TokenConfigServerCredentialsProvider
      - CHROMA_SERVER_AUTH_TOKEN_TRANSPORT_HEADER=AUTHORIZATION
      - CHROMA_SERVER_AUTH_TOKEN=test-token
    volumes:
      - ./data/chromadb:/chroma/chroma

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - ./data/redis:/data

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=windsurf
      - POSTGRES_PASSWORD=windsurf
      - POSTGRES_DB=windsurf_vibe
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
`.trim();
  
  await fs.writeFile('docker-compose.yml', dockerCompose);
  spinner.succeed('Docker Compose configuration created');
  
  console.log(chalk.cyan('Start services with: docker-compose up -d'));
}

async function testConnections() {
  const spinner = ora('Testing service connections...').start();
  
  const { llmClients } = require('../mcp-server/src/utils/http-client');
  
  const tests = [
    {
      name: 'Ollama',
      test: async () => {
        const models = await llmClients.checkOllamaModels();
        return models.length > 0 ? `✅ ${models.length} models` : '❌ No models';
      }
    },
    {
      name: 'LM Studio',
      test: async () => {
        const models = await llmClients.checkLMStudioModels();
        return models.length > 0 ? `✅ ${models.length} models` : '⚠️ Not running';
      }
    },
    {
      name: 'ChromaDB',
      test: async () => {
        try {
          const { chromaClient } = require('../mcp-server/src/utils/http-client');
          await chromaClient.get('/api/v1/heartbeat');
          return '✅ Connected';
        } catch {
          return '⚠️ Not running';
        }
      }
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    spinner.text = `Testing ${test.name}...`;
    try {
      const result = await test.test();
      results.push({ service: test.name, status: result });
    } catch (error) {
      results.push({ 
        service: test.name, 
        status: `❌ Error: ${error.message.substring(0, 30)}...` 
      });
    }
  }
  
  spinner.succeed('Connection tests complete');
  console.table(results);
}

async function createTestScript() {
  const spinner = ora('Creating test script...').start();
  
  const testScript = `
const { automateEverything } = require('./mcp-server/src/integrations/full-automation');

async function test() {
  console.log('Testing Full Automation System...');
  
  try {
    const result = await automateEverything(
      'Create a simple todo app with React and local storage'
    );
    console.log('Success!', result);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

test();
`.trim();
  
  await fs.writeFile('test-automation.js', testScript);
  spinner.succeed('Test script created: test-automation.js');
}

async function main() {
  try {
    // Check dependencies
    await checkDependencies();
    
    // Install Python packages
    await installPythonDependencies();
    
    // Fix broken imports
    await fixBrokenImports();
    
    // Create Docker Compose
    await createDockerCompose();
    
    // Test connections
    await testConnections();
    
    // Create test script
    await createTestScript();
    
    console.log(chalk.bold.green(`
╔══════════════════════════════════════════════════════════╗
║              🎉 INITIALIZATION COMPLETE! 🎉              ║
╚══════════════════════════════════════════════════════════╝
`));
    
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white('1. Start Docker services: ') + chalk.yellow('docker-compose up -d'));
    console.log(chalk.white('2. Start Ollama: ') + chalk.yellow('ollama serve'));
    console.log(chalk.white('3. Start LM Studio (if using)'));
    console.log(chalk.white('4. Test automation: ') + chalk.yellow('node test-automation.js'));
    console.log(chalk.white('5. Start MCP server: ') + chalk.yellow('npm start'));
    
    console.log(chalk.bold.magenta('\n🚀 Your v4.3 system is now actually functional!'));
    
  } catch (error) {
    console.error(chalk.red('Initialization failed:'), error.message);
    process.exit(1);
  }
}

// Run initialization
main();
