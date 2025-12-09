/**
 * Patch script to add new tools to windsurf-autopilot
 * Run this to update index.js with new v2.1 features
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.js');
const backupPath = path.join(__dirname, 'index.backup.js');

// Read current file
let content = fs.readFileSync(indexPath, 'utf8');

// Backup
fs.writeFileSync(backupPath, content);
console.log('✅ Backup created: index.backup.js');

// 1. Add import for additional tools after child_process import
const importPatch = `const { execSync, exec, spawn } = require('child_process');

// Import additional tools for v2.1 features
const additionalTools = require('./additional-tools.js');`;

content = content.replace(
  "const { execSync, exec, spawn } = require('child_process');",
  importPatch
);
console.log('✅ Added import for additional-tools.js');

// 2. Update version number
content = content.replace(
  /Windsurf Autopilot MCP Server v2\.0/g,
  'Windsurf Autopilot MCP Server v2.1'
);
content = content.replace(
  /{ name: 'windsurf-autopilot', version: '2\.0\.0' }/g,
  "{ name: 'windsurf-autopilot', version: '2.1.0' }"
);
console.log('✅ Updated version to 2.1.0');

// 3. Add new tools to the tools object (before the closing of tools object)
// Find the get_history tool and add after it
const newToolsCode = `

  // ===========================================================================
  // NEW v2.1 TOOLS - Project Intelligence, Error Analysis, HTTP, Quality, Testing
  // ===========================================================================
  
  analyze_project: async (args) => {
    logAction('analyze_project', args);
    return await additionalTools.analyzeProject(args);
  },
  
  detect_tech_stack: async (args) => {
    logAction('detect_tech_stack', args);
    return await additionalTools.detectTechStack(args);
  },
  
  analyze_error: async (args) => {
    logAction('analyze_error', args);
    return await additionalTools.analyzeError(args);
  },
  
  smart_retry: async (args) => {
    logAction('smart_retry', args);
    return await additionalTools.smartRetry(args);
  },
  
  http_request: async (args) => {
    logAction('http_request', args);
    return await additionalTools.httpRequest(args);
  },
  
  download_file: async (args) => {
    logAction('download_file', args);
    return await additionalTools.downloadFile(args);
  },
  
  lint_code: async (args) => {
    logAction('lint_code', args);
    return await additionalTools.lintCode(args);
  },
  
  format_code: async (args) => {
    logAction('format_code', args);
    return await additionalTools.formatCode(args);
  },
  
  run_tests: async (args) => {
    logAction('run_tests', args);
    return await additionalTools.runTests(args);
  },
  
  start_server: async (args) => {
    logAction('start_server', args);
    return await additionalTools.startServer(args);
  },
  
  stop_server: async (args) => {
    logAction('stop_server', args);
    return await additionalTools.stopServer(args);
  },
  
  list_running: async (args) => {
    logAction('list_running', args);
    return await additionalTools.listRunning(args);
  },
  
  docker_status: async (args) => {
    logAction('docker_status', args);
    return await additionalTools.dockerStatus(args);
  },
  
  docker_build: async (args) => {
    logAction('docker_build', args);
    return await additionalTools.dockerBuild(args);
  },
  
  docker_run: async (args) => {
    logAction('docker_run', args);
    return await additionalTools.dockerRun(args);
  },
  
  docker_compose_up: async (args) => {
    logAction('docker_compose_up', args);
    return await additionalTools.dockerComposeUp(args);
  }`;

// Insert before the closing of the tools object
const toolsEndMarker = `  get_history: async ({ limit }) => {
    return {
      success: true,
      count: taskState.history.length,
      actions: taskState.history.slice(-(limit || 20)),
      currentTask: taskState.currentTask,
      lastError: taskState.lastError
    };
  }
};`;

const newToolsEndMarker = `  get_history: async ({ limit }) => {
    return {
      success: true,
      count: taskState.history.length,
      actions: taskState.history.slice(-(limit || 20)),
      currentTask: taskState.currentTask,
      lastError: taskState.lastError
    };
  },${newToolsCode}
};`;

content = content.replace(toolsEndMarker, newToolsEndMarker);
console.log('✅ Added new tool implementations');

// 4. Add new tool definitions
const newToolDefinitions = `
  // v2.1 Tools - Project Intelligence
  {
    name: 'analyze_project',
    description: 'Analyze a project to understand its structure, tech stack, dependencies, and potential issues. Use this to understand any project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Path to the project directory' }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'detect_tech_stack',
    description: 'Detect the technology stack of a project (languages, frameworks, tools).',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Path to the project' }
      },
      required: ['projectPath']
    }
  },
  
  // v2.1 Tools - Error Analysis
  {
    name: 'analyze_error',
    description: 'Analyze an error message and suggest fixes. Understands common error patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        error: { type: 'string', description: 'Error message to analyze' },
        context: { type: 'string', description: 'Context about what was being done' },
        projectPath: { type: 'string', description: 'Project path for context' }
      },
      required: ['error']
    }
  },
  {
    name: 'smart_retry',
    description: 'Retry a command with intelligent strategies (retry, clear cache, reinstall, force).',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to retry' },
        cwd: { type: 'string', description: 'Working directory' },
        maxAttempts: { type: 'number', description: 'Max retry attempts (default: 3)' },
        strategies: { type: 'array', items: { type: 'string' }, description: 'Strategies to try' }
      },
      required: ['command']
    }
  },
  
  // v2.1 Tools - HTTP
  {
    name: 'http_request',
    description: 'Make HTTP requests (GET, POST, PUT, DELETE). Test APIs.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to request' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], description: 'HTTP method' },
        headers: { type: 'object', description: 'Request headers' },
        body: { type: 'object', description: 'Request body (for POST/PUT)' },
        timeout: { type: 'number', description: 'Timeout in ms' }
      },
      required: ['url']
    }
  },
  {
    name: 'download_file',
    description: 'Download a file from a URL.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to download from' },
        destPath: { type: 'string', description: 'Destination file path' },
        overwrite: { type: 'boolean', description: 'Overwrite if exists' }
      },
      required: ['url', 'destPath']
    }
  },
  
  // v2.1 Tools - Code Quality
  {
    name: 'lint_code',
    description: 'Run linters on a project (ESLint, Flake8, etc.). Optionally fix issues.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Project path' },
        fix: { type: 'boolean', description: 'Auto-fix issues' }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'format_code',
    description: 'Format code using Prettier, Black, or other formatters.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Project path' }
      },
      required: ['projectPath']
    }
  },
  
  // v2.1 Tools - Testing
  {
    name: 'run_tests',
    description: 'Run project tests (Jest, Vitest, Pytest, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Project path' },
        testFile: { type: 'string', description: 'Specific test file' },
        coverage: { type: 'boolean', description: 'Include coverage report' }
      },
      required: ['projectPath']
    }
  },
  
  // v2.1 Tools - Process Management
  {
    name: 'start_server',
    description: 'Start a development server (npm run dev, npm start, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Project path' },
        script: { type: 'string', description: 'Script to run (default: dev)' },
        port: { type: 'number', description: 'Port number' }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'stop_server',
    description: 'Stop a running server.',
    inputSchema: {
      type: 'object',
      properties: {
        serverId: { type: 'string', description: 'Server ID from start_server' },
        pid: { type: 'number', description: 'Process ID' }
      }
    }
  },
  {
    name: 'list_running',
    description: 'List all running servers started by autopilot.',
    inputSchema: { type: 'object', properties: {} }
  },
  
  // v2.1 Tools - Docker
  {
    name: 'docker_status',
    description: 'Check Docker installation, running containers, and images.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'docker_build',
    description: 'Build a Docker image from a Dockerfile.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Project path with Dockerfile' },
        tag: { type: 'string', description: 'Image tag' },
        dockerfile: { type: 'string', description: 'Dockerfile name (default: Dockerfile)' }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'docker_run',
    description: 'Run a Docker container.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Image name' },
        name: { type: 'string', description: 'Container name' },
        ports: { type: 'array', items: { type: 'string' }, description: 'Port mappings (e.g., "3000:3000")' },
        env: { type: 'object', description: 'Environment variables' },
        detach: { type: 'boolean', description: 'Run in background (default: true)' }
      },
      required: ['image']
    }
  },
  {
    name: 'docker_compose_up',
    description: 'Start services with docker-compose.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Project path with docker-compose.yml' },
        detach: { type: 'boolean', description: 'Run in background (default: true)' },
        build: { type: 'boolean', description: 'Rebuild images' }
      },
      required: ['projectPath']
    }
  }`;

// Find where tool definitions end and insert new ones
const toolDefsEndMarker = `{
    name: 'get_history',
    description: 'Get action history and current task state.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max actions to return (default: 20)' }
      }
    }
  }
];`;

const newToolDefsEndMarker = `{
    name: 'get_history',
    description: 'Get action history and current task state.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max actions to return (default: 20)' }
      }
    }
  },${newToolDefinitions}
];`;

content = content.replace(toolDefsEndMarker, newToolDefsEndMarker);
console.log('✅ Added new tool definitions');

// 5. Update startup message
content = content.replace(
  "console.error('🚀 Windsurf Autopilot MCP Server v2.0 running');",
  "console.error('🚀 Windsurf Autopilot MCP Server v2.1 running (with Project Intelligence, Testing, Docker)');"
);

// Write patched file
fs.writeFileSync(indexPath, content);
console.log('✅ Patched index.js successfully!');
console.log('');
console.log('New tools added:');
console.log('  📊 analyze_project - Understand any project');
console.log('  🔍 detect_tech_stack - Detect frameworks/languages');
console.log('  🔧 analyze_error - Understand & fix errors');
console.log('  🔄 smart_retry - Intelligent retry strategies');
console.log('  🌐 http_request - Make HTTP requests');
console.log('  📥 download_file - Download from URLs');
console.log('  📝 lint_code - Run linters');
console.log('  ✨ format_code - Auto-format code');
console.log('  🧪 run_tests - Execute tests');
console.log('  🚀 start_server - Start dev servers');
console.log('  🛑 stop_server - Stop servers');
console.log('  📋 list_running - List running processes');
console.log('  🐳 docker_status - Check Docker');
console.log('  🏗️ docker_build - Build images');
console.log('  ▶️ docker_run - Run containers');
console.log('  📦 docker_compose_up - Start compose services');
