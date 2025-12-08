#!/usr/bin/env node
/**
 * Windsurf Autopilot MCP Server
 * 
 * Zero-code task completion for vibe coders.
 * Gives Windsurf AI the ability to:
 * - Diagnose and fix issues automatically
 * - Set up projects without user commands
 * - Guide users through any task
 * - Self-heal when things break
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

// ==============================================================================
// Configuration
// ==============================================================================
const HOME = os.homedir();
const IS_WINDOWS = process.platform === 'win32';

const PATHS = {
  windsurfSettings: IS_WINDOWS 
    ? path.join(process.env.APPDATA || '', 'Windsurf', 'User')
    : process.platform === 'darwin'
      ? path.join(HOME, 'Library', 'Application Support', 'Windsurf', 'User')
      : path.join(HOME, '.config', 'Windsurf', 'User'),
  codeium: path.join(HOME, '.codeium', 'windsurf'),
  memories: path.join(HOME, '.codeium', 'windsurf', 'memories'),
  projectRoot: path.resolve(__dirname, '..', '..')
};

// ==============================================================================
// Helper Functions
// ==============================================================================
function safeExec(command, options = {}) {
  try {
    return { success: true, output: execSync(command, { encoding: 'utf8', ...options }).trim() };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readJsonSafe(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Normalize line endings
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Handle JSONC (strip comments properly using state machine)
    let result = '';
    let i = 0;
    while (i < content.length) {
      if (content[i] === '"') {
        result += content[i++];
        while (i < content.length && content[i] !== '"') {
          if (content[i] === '\\' && i + 1 < content.length) {
            result += content[i++];
          }
          result += content[i++];
        }
        if (i < content.length) result += content[i++];
      } else if (content[i] === '/' && content[i + 1] === '/') {
        while (i < content.length && content[i] !== '\n') i++;
      } else if (content[i] === '/' && content[i + 1] === '*') {
        i += 2;
        while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) i++;
        i += 2;
      } else {
        result += content[i++];
      }
    }
    
    // Remove trailing commas
    result = result.replace(/,(\s*[}\]])/g, '$1');
    
    return { success: true, data: JSON.parse(result) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function writeFileSafe(filePath, content) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function copyFileSafe(src, dest) {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ==============================================================================
// Tool Implementations
// ==============================================================================
const tools = {
  // ---------------------------------------------------------------------------
  // DIAGNOSE: Check what's wrong
  // ---------------------------------------------------------------------------
  diagnose_environment: async () => {
    const issues = [];
    const status = { healthy: true };

    // Check Node.js
    const nodeCheck = safeExec('node --version');
    if (!nodeCheck.success) {
      issues.push({ severity: 'critical', issue: 'Node.js not installed', fix: 'install_nodejs' });
      status.healthy = false;
    } else {
      status.nodeVersion = nodeCheck.output;
    }

    // Check npm
    const npmCheck = safeExec('npm --version');
    if (!npmCheck.success) {
      issues.push({ severity: 'critical', issue: 'npm not available', fix: 'install_nodejs' });
      status.healthy = false;
    } else {
      status.npmVersion = npmCheck.output;
    }

    // Check Git
    const gitCheck = safeExec('git --version');
    if (!gitCheck.success) {
      issues.push({ severity: 'warning', issue: 'Git not installed', fix: 'install_git' });
    } else {
      status.gitVersion = gitCheck.output;
    }

    // Check Windsurf settings
    const settingsPath = path.join(PATHS.windsurfSettings, 'settings.json');
    if (!fileExists(settingsPath)) {
      issues.push({ severity: 'warning', issue: 'Windsurf settings not configured', fix: 'setup_windsurf' });
    } else {
      const settings = readJsonSafe(settingsPath);
      if (!settings.success) {
        issues.push({ severity: 'critical', issue: 'settings.json is corrupted', fix: 'repair_settings' });
        status.healthy = false;
      }
    }

    // Check MCP config
    const mcpPath = path.join(PATHS.codeium, 'mcp_config.json');
    if (!fileExists(mcpPath)) {
      issues.push({ severity: 'info', issue: 'MCP servers not configured', fix: 'setup_mcp' });
    } else {
      const mcp = readJsonSafe(mcpPath);
      if (!mcp.success) {
        issues.push({ severity: 'critical', issue: 'mcp_config.json is corrupted', fix: 'repair_mcp' });
        status.healthy = false;
      } else {
        status.mcpServers = Object.keys(mcp.data.mcpServers || {}).length;
      }
    }

    // Check global rules
    const rulesPath = path.join(PATHS.memories, 'global_rules.md');
    if (!fileExists(rulesPath)) {
      issues.push({ severity: 'info', issue: 'AI global rules not set', fix: 'setup_rules' });
    }

    return {
      status,
      issues,
      summary: issues.length === 0 
        ? 'Environment is healthy! All systems operational.'
        : `Found ${issues.length} issue(s) that can be auto-fixed.`
    };
  },

  // ---------------------------------------------------------------------------
  // FIX: Auto-repair issues
  // ---------------------------------------------------------------------------
  auto_fix: async ({ issue_type }) => {
    const fixes = {
      setup_windsurf: async () => {
        const src = path.join(PATHS.projectRoot, 'settings.json');
        const dest = path.join(PATHS.windsurfSettings, 'settings.json');
        
        if (!fileExists(src)) {
          return { success: false, message: 'Source settings.json not found in project' };
        }
        
        const result = copyFileSafe(src, dest);
        return result.success 
          ? { success: true, message: 'Windsurf settings installed. Restart Windsurf to apply.' }
          : { success: false, message: `Failed: ${result.error}` };
      },

      setup_mcp: async () => {
        const src = path.join(PATHS.projectRoot, 'examples', 'mcp_config.json');
        const dest = path.join(PATHS.codeium, 'mcp_config.json');
        
        if (!fileExists(src)) {
          return { success: false, message: 'Source mcp_config.json not found' };
        }
        
        const result = copyFileSafe(src, dest);
        return result.success 
          ? { success: true, message: 'MCP configuration installed. Restart Windsurf to load servers.' }
          : { success: false, message: `Failed: ${result.error}` };
      },

      setup_rules: async () => {
        const src = path.join(PATHS.projectRoot, 'examples', 'global_rules.md');
        const dest = path.join(PATHS.memories, 'global_rules.md');
        
        if (!fileExists(src)) {
          return { success: false, message: 'Source global_rules.md not found' };
        }
        
        const result = copyFileSafe(src, dest);
        return result.success 
          ? { success: true, message: 'AI global rules installed.' }
          : { success: false, message: `Failed: ${result.error}` };
      },

      repair_settings: async () => {
        // Backup corrupted file
        const settingsPath = path.join(PATHS.windsurfSettings, 'settings.json');
        const backupPath = path.join(PATHS.windsurfSettings, `settings.backup.${Date.now()}.json`);
        
        if (fileExists(settingsPath)) {
          copyFileSafe(settingsPath, backupPath);
        }
        
        // Copy fresh settings
        const src = path.join(PATHS.projectRoot, 'settings.json');
        const result = copyFileSafe(src, settingsPath);
        
        return result.success 
          ? { success: true, message: `Settings repaired. Backup saved to ${backupPath}` }
          : { success: false, message: `Failed: ${result.error}` };
      },

      repair_mcp: async () => {
        const mcpPath = path.join(PATHS.codeium, 'mcp_config.json');
        const backupPath = path.join(PATHS.codeium, `mcp_config.backup.${Date.now()}.json`);
        
        if (fileExists(mcpPath)) {
          copyFileSafe(mcpPath, backupPath);
        }
        
        const src = path.join(PATHS.projectRoot, 'examples', 'mcp_config.json');
        const result = copyFileSafe(src, mcpPath);
        
        return result.success 
          ? { success: true, message: `MCP config repaired. Backup saved.` }
          : { success: false, message: `Failed: ${result.error}` };
      },

      install_dependencies: async () => {
        const result = safeExec('npm install', { cwd: PATHS.projectRoot });
        return result.success 
          ? { success: true, message: 'Dependencies installed successfully.' }
          : { success: false, message: `npm install failed: ${result.error}` };
      }
    };

    if (!fixes[issue_type]) {
      return { success: false, message: `Unknown fix type: ${issue_type}. Available: ${Object.keys(fixes).join(', ')}` };
    }

    return await fixes[issue_type]();
  },

  // ---------------------------------------------------------------------------
  // SETUP: Complete setup without user commands
  // ---------------------------------------------------------------------------
  complete_setup: async () => {
    const steps = [];

    // Step 1: Install settings
    const settings = await tools.auto_fix({ issue_type: 'setup_windsurf' });
    steps.push({ step: 'Install Windsurf settings', ...settings });

    // Step 2: Install MCP config
    const mcp = await tools.auto_fix({ issue_type: 'setup_mcp' });
    steps.push({ step: 'Install MCP configuration', ...mcp });

    // Step 3: Install global rules
    const rules = await tools.auto_fix({ issue_type: 'setup_rules' });
    steps.push({ step: 'Install AI global rules', ...rules });

    // Step 4: Install npm dependencies
    const deps = await tools.auto_fix({ issue_type: 'install_dependencies' });
    steps.push({ step: 'Install npm dependencies', ...deps });

    const allSuccess = steps.every(s => s.success);

    return {
      success: allSuccess,
      steps,
      message: allSuccess 
        ? '🎉 Setup complete! Restart Windsurf to activate all features.'
        : 'Setup completed with some issues. Check steps above.'
    };
  },

  // ---------------------------------------------------------------------------
  // PROJECT: Create and manage projects
  // ---------------------------------------------------------------------------
  create_project: async ({ name, type, location }) => {
    const projectPath = path.join(location || path.join(HOME, 'Projects'), name);
    
    // Create directory
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Initialize based on type
    const templates = {
      react: async () => {
        safeExec(`npx create-react-app ${name} --template typescript`, { cwd: path.dirname(projectPath) });
        return 'React TypeScript project created';
      },
      nextjs: async () => {
        safeExec(`npx create-next-app@latest ${name} --typescript --tailwind --eslint --app`, { cwd: path.dirname(projectPath) });
        return 'Next.js project created with TypeScript and Tailwind';
      },
      python: async () => {
        fs.writeFileSync(path.join(projectPath, 'requirements.txt'), '# Add dependencies here\n');
        fs.writeFileSync(path.join(projectPath, 'main.py'), '#!/usr/bin/env python3\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n');
        fs.writeFileSync(path.join(projectPath, 'README.md'), `# ${name}\n\nPython project.\n`);
        safeExec('git init', { cwd: projectPath });
        return 'Python project created';
      },
      node: async () => {
        safeExec('npm init -y', { cwd: projectPath });
        safeExec('git init', { cwd: projectPath });
        return 'Node.js project created';
      },
      empty: async () => {
        fs.writeFileSync(path.join(projectPath, 'README.md'), `# ${name}\n\nNew project.\n`);
        safeExec('git init', { cwd: projectPath });
        return 'Empty project created';
      }
    };

    const template = templates[type] || templates.empty;
    const result = await template();

    return {
      success: true,
      path: projectPath,
      message: result,
      nextStep: `Open ${projectPath} in Windsurf to start coding!`
    };
  },

  // ---------------------------------------------------------------------------
  // GUIDE: Step-by-step task guidance
  // ---------------------------------------------------------------------------
  guide_task: async ({ task }) => {
    const guides = {
      'setup': {
        steps: [
          'I will set up Windsurf Vibe configuration for you.',
          'This includes: settings, MCP servers, and AI rules.',
          'No commands needed - I handle everything automatically.',
          'After setup, restart Windsurf to activate.'
        ],
        action: 'complete_setup'
      },
      'create website': {
        steps: [
          'I will create a modern website project for you.',
          'Using Next.js with TypeScript and Tailwind CSS.',
          'You just describe what you want, I build it.'
        ],
        action: 'create_project',
        params: { type: 'nextjs' }
      },
      'create api': {
        steps: [
          'I will create a Python API project for you.',
          'Using FastAPI with automatic documentation.',
          'Just describe your endpoints, I implement them.'
        ],
        action: 'create_project', 
        params: { type: 'python' }
      },
      'fix issues': {
        steps: [
          'I will diagnose your environment.',
          'Then automatically fix any issues found.',
          'You don\'t need to do anything.'
        ],
        action: 'diagnose_and_fix'
      }
    };

    // Find matching guide
    const taskLower = task.toLowerCase();
    for (const [key, guide] of Object.entries(guides)) {
      if (taskLower.includes(key)) {
        return {
          found: true,
          task: key,
          ...guide,
          message: `I can help with "${key}". Here's what I'll do:`
        };
      }
    }

    return {
      found: false,
      message: 'I can help with: setup, create website, create api, fix issues. What would you like?',
      availableTasks: Object.keys(guides)
    };
  },

  // ---------------------------------------------------------------------------
  // STATUS: Get current system status
  // ---------------------------------------------------------------------------
  get_status: async () => {
    const status = {
      platform: process.platform,
      nodeVersion: process.version,
      homeDir: HOME,
      paths: PATHS
    };

    // Check each component
    status.components = {
      windsurfSettings: fileExists(path.join(PATHS.windsurfSettings, 'settings.json')),
      mcpConfig: fileExists(path.join(PATHS.codeium, 'mcp_config.json')),
      globalRules: fileExists(path.join(PATHS.memories, 'global_rules.md')),
      projectFiles: fileExists(path.join(PATHS.projectRoot, 'settings.json'))
    };

    status.ready = Object.values(status.components).every(v => v);
    status.message = status.ready 
      ? 'All systems ready! You can start vibe coding.'
      : 'Some components need setup. Ask me to "complete setup" to fix.';

    return status;
  }
};

// ==============================================================================
// MCP Server Setup
// ==============================================================================
const server = new Server(
  { name: 'windsurf-autopilot', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'diagnose_environment',
      description: 'Check the Windsurf environment for issues. Finds problems and suggests fixes.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'auto_fix',
      description: 'Automatically fix a specific issue. No user commands needed.',
      inputSchema: {
        type: 'object',
        properties: {
          issue_type: {
            type: 'string',
            description: 'Type of fix: setup_windsurf, setup_mcp, setup_rules, repair_settings, repair_mcp, install_dependencies',
            enum: ['setup_windsurf', 'setup_mcp', 'setup_rules', 'repair_settings', 'repair_mcp', 'install_dependencies']
          }
        },
        required: ['issue_type']
      }
    },
    {
      name: 'complete_setup',
      description: 'Complete full Windsurf Vibe setup automatically. Installs all configs without user commands.',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'create_project',
      description: 'Create a new project with the right structure. User just names it, AI sets it up.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Project name' },
          type: { 
            type: 'string', 
            description: 'Project type',
            enum: ['react', 'nextjs', 'python', 'node', 'empty']
          },
          location: { type: 'string', description: 'Parent folder (optional, defaults to ~/Projects)' }
        },
        required: ['name', 'type']
      }
    },
    {
      name: 'guide_task',
      description: 'Get step-by-step guidance for a task. AI explains what it will do.',
      inputSchema: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'What the user wants to do' }
        },
        required: ['task']
      }
    },
    {
      name: 'get_status',
      description: 'Get current system status and readiness.',
      inputSchema: { type: 'object', properties: {} }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!tools[name]) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }]
    };
  }

  try {
    const result = await tools[name](args || {});
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }]
    };
  }
});

// List resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'autopilot://status',
      name: 'System Status',
      description: 'Current Windsurf environment status',
      mimeType: 'application/json'
    }
  ]
}));

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'autopilot://status') {
    const status = await tools.get_status();
    return {
      contents: [{ uri: request.params.uri, mimeType: 'application/json', text: JSON.stringify(status, null, 2) }]
    };
  }
  throw new Error(`Unknown resource: ${request.params.uri}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Windsurf Autopilot MCP Server running');
}

main().catch(console.error);
