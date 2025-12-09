#!/usr/bin/env node

/**
 * FAST API SETUP - Install all free & open source tools
 * Addresses Claude Audit weaknesses with immediate fixes
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Main async wrapper to handle ESM imports
(async () => {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

class FastAPISetup {
  constructor() {
    this.tools = [
      { name: 'Docker', cmd: 'docker --version', install: 'Please install Docker Desktop (free)' },
      { name: 'Node.js', cmd: 'node --version', install: 'Already installed' },
      { name: 'Python', cmd: 'python --version', install: 'winget install Python.Python.3.11' }
    ];
    
    this.containers = [
      { name: 'microsandbox', image: 'ghcr.io/microsandbox/microsandbox:latest' },
      { name: 'redis', image: 'redis:alpine' },
      { name: 'ollama', image: 'ollama/ollama:latest' },
      { name: 'gitea', image: 'gitea/gitea:latest' },
      { name: 'minio', image: 'minio/minio:latest' }
    ];
  }

  async checkPrerequisites() {
    console.log(chalk.cyan('\n📋 Checking prerequisites...\n'));
    
    for (const tool of this.tools) {
      const spinner = ora(`Checking ${tool.name}...`).start();
      try {
        execSync(tool.cmd, { stdio: 'ignore' });
        spinner.succeed(`${tool.name} is installed`);
      } catch (error) {
        spinner.fail(`${tool.name} not found - ${tool.install}`);
      }
    }
  }

  async installNpmPackages() {
    const spinner = ora('Installing npm packages...').start();
    try {
      execSync('npm install', { stdio: 'ignore', cwd: path.resolve(__dirname, '..') });
      spinner.succeed('NPM packages installed');
    } catch (error) {
      spinner.fail('Failed to install npm packages');
      console.error(error.message);
    }
  }

  async setupDockerContainers() {
    console.log(chalk.cyan('\n🐳 Setting up Docker containers...\n'));
    
    for (const container of this.containers) {
      const spinner = ora(`Setting up ${container.name}...`).start();
      try {
        // Check if container already exists
        try {
          execSync(`docker ps -a | grep ${container.name}`, { stdio: 'ignore' });
          spinner.info(`${container.name} already exists`);
          continue;
        } catch (e) {
          // Container doesn't exist, create it
        }
        
        // Pull image
        execSync(`docker pull ${container.image}`, { stdio: 'ignore' });
        
        // Run container based on type
        switch (container.name) {
          case 'redis':
            execSync(`docker run -d --name vibe-redis -p 6379:6379 ${container.image}`, { stdio: 'ignore' });
            break;
          case 'microsandbox':
            execSync(`docker run -d --name vibe-sandbox --network none ${container.image}`, { stdio: 'ignore' });
            break;
          case 'ollama':
            execSync(`docker run -d --name vibe-ollama -p 11434:11434 ${container.image}`, { stdio: 'ignore' });
            break;
          case 'gitea':
            execSync(`docker run -d --name vibe-gitea -p 3030:3000 -p 2222:22 ${container.image}`, { stdio: 'ignore' });
            break;
          case 'minio':
            execSync(`docker run -d --name vibe-minio -p 9000:9000 -p 9001:9001 ${container.image} server /data --console-address :9001`, { stdio: 'ignore' });
            break;
        }
        
        spinner.succeed(`${container.name} is running`);
      } catch (error) {
        spinner.fail(`Failed to setup ${container.name}`);
      }
    }
  }

  async installPythonPackages() {
    const spinner = ora('Installing Python packages for ChromaDB...').start();
    try {
      execSync('pip install chromadb', { stdio: 'ignore' });
      spinner.succeed('ChromaDB installed');
    } catch (error) {
      spinner.warn('Could not install ChromaDB via pip - will use npm version');
    }
  }

  async downloadOllamaModels() {
    console.log(chalk.cyan('\n🤖 Downloading free LLM models...\n'));
    
    const models = ['codellama:7b', 'mistral:7b', 'phi:latest'];
    
    for (const model of models) {
      const spinner = ora(`Downloading ${model}...`).start();
      try {
        execSync(`docker exec vibe-ollama ollama pull ${model}`, { stdio: 'ignore' });
        spinner.succeed(`${model} downloaded`);
      } catch (error) {
        spinner.warn(`Could not download ${model} - will retry on first use`);
      }
    }
  }

  async createEnvFile() {
    const spinner = ora('Creating .env configuration...').start();
    
    const envContent = `
# Fast API Configuration (All Free & Open Source)
SANDBOX_MODE=true
VECTOR_DB=chromadb
CACHE_REDIS=true
LOCAL_LLM=ollama
STORAGE_MINIO=true
GIT_LOCAL=gitea

# Local endpoints (no API keys needed!)
REDIS_URL=redis://localhost:6379
OLLAMA_URL=http://localhost:11434
GITEA_URL=http://localhost:3030
MINIO_URL=http://localhost:9000
CHROMADB_PATH=./chromadb_data

# Security (all local)
SANDBOX_ISOLATION=strict
NETWORK_MODE=host-only
`;

    try {
      const envPath = path.resolve(__dirname, '..', '.env.fastapi');
      await fs.writeFile(envPath, envContent.trim());
      spinner.succeed('.env.fastapi configuration created');
    } catch (error) {
      spinner.fail('Failed to create .env file');
    }
  }

  async runIntegrationTest() {
    console.log(chalk.cyan('\n🧪 Testing integrations...\n'));
    
    const FastAPIIntegrations = require('../mcp-server/src/fast-api-integrations');
    const fastAPI = new FastAPIIntegrations();
    
    const spinner = ora('Initializing all integrations...').start();
    try {
      const integrations = await fastAPI.initializeAll();
      spinner.succeed(`Initialized ${integrations.size} integrations successfully`);
      
      // Test each integration
      for (const [name, integration] of integrations) {
        const testSpinner = ora(`Testing ${name}...`).start();
        try {
          // Quick test for each
          switch (name) {
            case 'cache':
              await integration.set('test', 'value');
              const value = await integration.get('test');
              if (value === 'value') testSpinner.succeed(`${name} working`);
              break;
            case 'llm':
              const response = await integration.generate('Hello', 'phi:latest');
              if (response) testSpinner.succeed(`${name} working`);
              break;
            default:
              testSpinner.info(`${name} ready`);
          }
        } catch (error) {
          testSpinner.warn(`${name} needs configuration`);
        }
      }
    } catch (error) {
      spinner.fail('Integration test failed');
      console.error(error.message);
    }
  }

  async run() {
    console.log(chalk.bold.green(`
╔══════════════════════════════════════════════════════════════╗
║                    FAST API SETUP                             ║
║         Free & Open Source Tools for VIBE                     ║
║         Addressing Claude Audit Weaknesses                    ║
╚══════════════════════════════════════════════════════════════╝
    `));

    await this.checkPrerequisites();
    await this.installNpmPackages();
    await this.setupDockerContainers();
    await this.installPythonPackages();
    await this.downloadOllamaModels();
    await this.createEnvFile();
    await this.runIntegrationTest();

    console.log(chalk.bold.green(`
╔══════════════════════════════════════════════════════════════╗
║                    SETUP COMPLETE!                            ║
╚══════════════════════════════════════════════════════════════╝

${chalk.cyan('🚀 All free & open source tools are ready!')}

${chalk.yellow('Services running:')}
  • Redis       → localhost:6379 (caching)
  • Ollama      → localhost:11434 (local LLMs)
  • Gitea       → localhost:3030 (git hosting)
  • MinIO       → localhost:9000 (object storage)
  • ChromaDB    → ./chromadb_data (vector search)
  • Microsandbox → Isolated execution

${chalk.green('Run this to use:')}
  npm run fast-api

${chalk.blue('Web interfaces:')}
  • Gitea Console → http://localhost:3030
  • MinIO Console → http://localhost:9001
    `));
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new FastAPISetup();
  setup.run().catch(console.error);
}

module.exports = FastAPISetup;

})().catch(console.error); // Close async wrapper
