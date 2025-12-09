/**
 * Patch script to add v2.2 advanced tools to windsurf-autopilot
 * Run this to upgrade from v2.1 to v2.2
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.js');
const backupPath = path.join(__dirname, 'index.v2.1.backup.js');

// Read current file
let content = fs.readFileSync(indexPath, 'utf8');

// Backup
fs.writeFileSync(backupPath, content);
console.log('✅ Backup created: index.v2.1.backup.js');

// 1. Add import for advanced tools
if (!content.includes('advanced-tools.js')) {
  content = content.replace(
    "const additionalTools = require('./additional-tools.js');",
    `const additionalTools = require('./additional-tools.js');
const advancedTools = require('./advanced-tools.js');`
  );
  console.log('✅ Added import for advanced-tools.js');
}

// 2. Update version number
content = content.replace(/version: '2\.1\.0'/g, "version: '2.2.0'");
content = content.replace(/v2\.1/g, 'v2.2');
console.log('✅ Updated version to 2.2.0');

// 3. Add new tool implementations
const newToolImplementations = `

  // ===========================================================================
  // NEW v2.2 TOOLS - AI Decision Engine, Code Gen, Testing, DB, Env, Backup
  // ===========================================================================
  
  // AI Decision Engine
  decide_next_step: async (args) => {
    logAction('decide_next_step', args);
    return await advancedTools.decideNextStep(args);
  },
  
  find_solution: async (args) => {
    logAction('find_solution', args);
    return await advancedTools.findSolution(args);
  },
  
  // Code Generation
  generate_code: async (args) => {
    logAction('generate_code', args);
    return await advancedTools.generateCode(args);
  },
  
  // Test Generation
  generate_tests: async (args) => {
    logAction('generate_tests', args);
    return await advancedTools.generateTests(args);
  },
  
  // Database Operations
  db_query: async (args) => {
    logAction('db_query', args);
    return await advancedTools.dbQuery(args);
  },
  
  db_migrate: async (args) => {
    logAction('db_migrate', args);
    return await advancedTools.dbMigrate(args);
  },
  
  db_seed: async (args) => {
    logAction('db_seed', args);
    return await advancedTools.dbSeed(args);
  },
  
  // Environment Variables
  manage_env: async (args) => {
    logAction('manage_env', args);
    return await advancedTools.manageEnv(args);
  },
  
  // Backup & Recovery
  backup_project: async (args) => {
    logAction('backup_project', args);
    return await advancedTools.backupProject(args);
  },
  
  restore_backup: async (args) => {
    logAction('restore_backup', args);
    return await advancedTools.restoreBackup(args);
  },
  
  list_backups: async (args) => {
    logAction('list_backups', args);
    return await advancedTools.listBackups(args);
  },
  
  // Progress Tracking
  start_progress: async (args) => {
    logAction('start_progress', args);
    return await advancedTools.startProgress(args);
  },
  
  update_progress: async (args) => {
    logAction('update_progress', args);
    return await advancedTools.updateProgress(args);
  },
  
  get_progress: async (args) => {
    logAction('get_progress', args);
    return await advancedTools.getProgress(args);
  },
  
  complete_progress: async (args) => {
    logAction('complete_progress', args);
    return await advancedTools.completeProgress(args);
  }`;

// Find where docker_compose_up ends and add new tools
const dockerComposeMarker = `docker_compose_up: async (args) => {
    logAction('docker_compose_up', args);
    return await additionalTools.dockerComposeUp(args);
  }
};`;

const newDockerComposeMarker = `docker_compose_up: async (args) => {
    logAction('docker_compose_up', args);
    return await additionalTools.dockerComposeUp(args);
  },${newToolImplementations}
};`;

content = content.replace(dockerComposeMarker, newDockerComposeMarker);
console.log('✅ Added new tool implementations');

// 4. Add new tool definitions
const newToolDefinitions = `
  // ═══════════════════════════════════════════════════════════════════════════
  // v2.2 Tools - AI Decision Engine
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'decide_next_step',
    description: 'AI autonomously decides what to do next based on project state, errors, and goals. Returns recommended actions that can be auto-executed.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Project directory path' },
        currentError: { type: 'string', description: 'Current error message if any' },
        goal: { type: 'string', description: 'What the user wants to achieve' },
        context: { type: 'object', description: 'Additional context' }
      }
    }
  },
  {
    name: 'find_solution',
    description: 'Find solutions for problems. Searches solution database and returns step-by-step fixes.',
    inputSchema: {
      type: 'object',
      properties: {
        problem: { type: 'string', description: 'Description of the problem' },
        projectPath: { type: 'string', description: 'Project path for context' },
        errorMessage: { type: 'string', description: 'Error message if available' }
      },
      required: ['problem']
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // v2.2 Tools - Code Generation
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'generate_code',
    description: 'Generate code from natural language description. Creates React components, Express routes, FastAPI endpoints, TypeScript interfaces, hooks, tests, Dockerfiles, and more.',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Natural language description of what to generate (e.g., "React component called UserProfile")' },
        language: { type: 'string', description: 'Programming language (auto-detected if not specified)' },
        type: { type: 'string', enum: ['react-component', 'express-route', 'fastapi-route', 'typescript-interface', 'react-hook', 'utility', 'test', 'dockerfile', 'docker-compose', 'github-actions'], description: 'Type of code to generate' },
        outputPath: { type: 'string', description: 'File path to write the generated code' }
      },
      required: ['description']
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // v2.2 Tools - Test Generation
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'generate_tests',
    description: 'Automatically generate test files for existing code. Analyzes exports and creates test scaffolding.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Path to the file to generate tests for' },
        projectPath: { type: 'string', description: 'Project root for test output' },
        testFramework: { type: 'string', enum: ['jest', 'vitest'], description: 'Test framework (default: jest)' }
      },
      required: ['filePath']
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // v2.2 Tools - Database Operations
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'db_query',
    description: 'Run database queries. Supports Prisma, SQLite, and raw SQL.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'SQL query to execute' },
        database: { type: 'string', enum: ['sqlite', 'postgresql', 'mysql'], description: 'Database type' },
        connectionString: { type: 'string', description: 'Database connection string' },
        projectPath: { type: 'string', description: 'Project path (for Prisma projects)' }
      },
      required: ['query']
    }
  },
  {
    name: 'db_migrate',
    description: 'Run database migrations. Auto-detects Prisma, Knex, or Django.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Project path' },
        name: { type: 'string', description: 'Migration name (default: migration)' }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'db_seed',
    description: 'Seed database with initial data. Auto-detects Prisma or Knex seed files.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Project path' }
      },
      required: ['projectPath']
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // v2.2 Tools - Environment Variables
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'manage_env',
    description: 'Manage .env files. List, get, set, delete variables. Validate against .env.example.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Project path' },
        action: { type: 'string', enum: ['list', 'get', 'set', 'delete', 'copy_example', 'validate'], description: 'Action to perform' },
        key: { type: 'string', description: 'Variable name (for get/set/delete)' },
        value: { type: 'string', description: 'Variable value (for set)' }
      },
      required: ['projectPath', 'action']
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // v2.2 Tools - Backup & Recovery
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'backup_project',
    description: 'Create a backup of a project. Excludes node_modules, .git, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Project to backup' },
        backupDir: { type: 'string', description: 'Backup destination directory (default: ~/Backups)' }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'restore_backup',
    description: 'Restore a project from backup.',
    inputSchema: {
      type: 'object',
      properties: {
        backupPath: { type: 'string', description: 'Path to the backup' },
        targetPath: { type: 'string', description: 'Where to restore' },
        overwrite: { type: 'boolean', description: 'Overwrite if target exists' }
      },
      required: ['backupPath', 'targetPath']
    }
  },
  {
    name: 'list_backups',
    description: 'List available backups for a project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Filter by project name' },
        backupDir: { type: 'string', description: 'Backup directory to search' }
      }
    }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // v2.2 Tools - Progress Tracking
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'start_progress',
    description: 'Start tracking progress for a multi-step task.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Unique task ID (auto-generated if not provided)' },
        taskName: { type: 'string', description: 'Name of the task' },
        totalSteps: { type: 'number', description: 'Total number of steps' },
        description: { type: 'string', description: 'Task description' }
      },
      required: ['taskName']
    }
  },
  {
    name: 'update_progress',
    description: 'Update progress for a tracked task.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
        stepName: { type: 'string', description: 'Name of completed step' },
        stepNumber: { type: 'number', description: 'Current step number' },
        status: { type: 'string', description: 'Status update' },
        log: { type: 'string', description: 'Log message' }
      },
      required: ['taskId']
    }
  },
  {
    name: 'get_progress',
    description: 'Get progress status for tasks.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID (omit to get all tasks)' }
      }
    }
  },
  {
    name: 'complete_progress',
    description: 'Mark a task as complete.',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Task ID' },
        status: { type: 'string', description: 'Final status (default: completed)' },
        summary: { type: 'string', description: 'Task summary' }
      },
      required: ['taskId']
    }
  }`;

// Find where docker_compose_up definition ends and add new definitions
const dockerComposeDefMarker = `{
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
  }
];`;

const newDockerComposeDefMarker = `{
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
  },${newToolDefinitions}
];`;

content = content.replace(dockerComposeDefMarker, newDockerComposeDefMarker);
console.log('✅ Added new tool definitions');

// 5. Update startup message
content = content.replace(
  /console\.error\('🚀 Windsurf Autopilot MCP Server v2\.1[^']*'\);/,
  "console.error('🚀 Windsurf Autopilot MCP Server v2.2 running (AI Decision Engine, Code Gen, DB, Backup)');"
);

// Write patched file
fs.writeFileSync(indexPath, content);
console.log('✅ Patched index.js to v2.2 successfully!');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('                    NEW v2.2 TOOLS ADDED                       ');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('🧠 AI DECISION ENGINE:');
console.log('   • decide_next_step - AI decides what to do autonomously');
console.log('   • find_solution - Find solutions for any problem');
console.log('');
console.log('💻 CODE GENERATION:');
console.log('   • generate_code - Generate code from natural language');
console.log('');
console.log('🧪 TEST GENERATION:');
console.log('   • generate_tests - Auto-create tests for existing code');
console.log('');
console.log('🗄️ DATABASE:');
console.log('   • db_query - Run SQL queries');
console.log('   • db_migrate - Run migrations');
console.log('   • db_seed - Seed database');
console.log('');
console.log('🔐 ENVIRONMENT:');
console.log('   • manage_env - Manage .env files');
console.log('');
console.log('💾 BACKUP:');
console.log('   • backup_project - Create project backups');
console.log('   • restore_backup - Restore from backup');
console.log('   • list_backups - List available backups');
console.log('');
console.log('📊 PROGRESS:');
console.log('   • start_progress - Start tracking task');
console.log('   • update_progress - Update progress');
console.log('   • get_progress - Get current progress');
console.log('   • complete_progress - Mark task complete');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('           TOTAL TOOLS: 46+ (from 30+ in v2.1)                 ');
console.log('═══════════════════════════════════════════════════════════════');
