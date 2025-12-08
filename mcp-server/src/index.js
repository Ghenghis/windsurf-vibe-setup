#!/usr/bin/env node
/**
 * Windsurf Autopilot MCP Server v2.4
 * 
 * COMPLETE ZERO-CODE AUTOPILOT for vibe coders.
 * This server gives Windsurf AI FULL capability to:
 * - Execute ANY command (npm, pip, git, etc.)
 * - Read, write, and edit ANY file
 * - Create complete projects from scratch
 * - Run multi-step tasks autonomously
 * - Auto-fix issues without user intervention
 * - Make intelligent decisions when stuck
 * 
 * The user NEVER needs to touch a terminal.
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
const { execSync, exec, spawn } = require('child_process');

// Import additional tools for v2.2 features
const additionalTools = require('./additional-tools.js');
const advancedTools = require('./advanced-tools.js');
const autopilotIntel = require('./autopilot-intelligence.js');
const realtimeAI = require('./realtime-ai-engine.js');
const ultimateTools = require('./ultimate-tools.js');

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
  projects: path.join(HOME, 'Projects'),
  projectRoot: path.resolve(__dirname, '..', '..')
};

// Task state for multi-step operations
const taskState = {
  currentTask: null,
  history: [],
  lastError: null,
  projectContext: {}
};

// ==============================================================================
// Helper Functions
// ==============================================================================

/**
 * Execute a command safely with timeout and output capture
 */
function safeExec(command, options = {}) {
  const defaults = { 
    encoding: 'utf8', 
    timeout: options.timeout || 60000,
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true
  };
  
  try {
    const output = execSync(command, { ...defaults, ...options }).toString().trim();
    return { success: true, output, exitCode: 0 };
  } catch (e) {
    return { 
      success: false, 
      error: e.message,
      output: e.stdout?.toString() || '',
      stderr: e.stderr?.toString() || '',
      exitCode: e.status || 1
    };
  }
}

/**
 * Execute command asynchronously with streaming
 */
function execAsync(command, options = {}) {
  return new Promise((resolve) => {
    const shell = IS_WINDOWS ? 'cmd.exe' : '/bin/bash';
    const shellArgs = IS_WINDOWS ? ['/c', command] : ['-c', command];
    
    const proc = spawn(shell, shellArgs, {
      cwd: options.cwd || HOME,
      env: { ...process.env, ...options.env },
      windowsHide: true
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    
    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code
      });
    });
    
    proc.on('error', (err) => {
      resolve({
        success: false,
        error: err.message,
        output: stdout,
        stderr: stderr,
        exitCode: 1
      });
    });
    
    // Timeout after specified duration
    setTimeout(() => {
      proc.kill();
      resolve({
        success: false,
        error: 'Command timed out',
        output: stdout,
        stderr: stderr,
        exitCode: 124
      });
    }, options.timeout || 120000);
  });
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function readJsonSafe(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Handle JSONC (strip comments)
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

function logAction(action, details) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    ...details
  };
  taskState.history.push(entry);
  // Keep last 100 actions
  if (taskState.history.length > 100) {
    taskState.history.shift();
  }
}

// ==============================================================================
// TOOL IMPLEMENTATIONS - Complete Autopilot Capabilities
// ==============================================================================
const tools = {
  // ===========================================================================
  // 1. COMMAND EXECUTION - Run any terminal command
  // ===========================================================================
  execute_command: async ({ command, cwd, timeout, background }) => {
    logAction('execute_command', { command, cwd });
    
    const workingDir = cwd || HOME;
    
    // Validate working directory exists
    if (!fileExists(workingDir)) {
      return {
        success: false,
        error: `Directory does not exist: ${workingDir}`,
        suggestion: 'Create the directory first or use a valid path'
      };
    }
    
    if (background) {
      // Start process in background
      const shell = IS_WINDOWS ? 'cmd.exe' : '/bin/bash';
      const shellArgs = IS_WINDOWS ? ['/c', command] : ['-c', command];
      const proc = spawn(shell, shellArgs, {
        cwd: workingDir,
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      proc.unref();
      return {
        success: true,
        message: `Command started in background (PID: ${proc.pid})`,
        pid: proc.pid
      };
    }
    
    const result = await execAsync(command, { 
      cwd: workingDir, 
      timeout: timeout || 120000 
    });
    
    return {
      success: result.success,
      output: result.output,
      stderr: result.stderr,
      exitCode: result.exitCode,
      error: result.error,
      cwd: workingDir
    };
  },

  // ===========================================================================
  // 2. FILE OPERATIONS - Read, write, edit any file
  // ===========================================================================
  read_file: async ({ path: filePath, encoding }) => {
    logAction('read_file', { path: filePath });
    
    if (!fileExists(filePath)) {
      return { success: false, error: `File not found: ${filePath}` };
    }
    
    try {
      const content = fs.readFileSync(filePath, encoding || 'utf8');
      const stats = fs.statSync(filePath);
      return {
        success: true,
        content,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        lines: content.split('\n').length
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  write_file: async ({ path: filePath, content, append, createDirs }) => {
    logAction('write_file', { path: filePath, append, lines: content?.split('\n').length });
    
    try {
      const dir = path.dirname(filePath);
      if (createDirs !== false && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      if (append) {
        fs.appendFileSync(filePath, content, 'utf8');
      } else {
        fs.writeFileSync(filePath, content, 'utf8');
      }
      
      return {
        success: true,
        path: filePath,
        size: Buffer.byteLength(content, 'utf8'),
        message: append ? 'Content appended' : 'File written'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  edit_file: async ({ path: filePath, find, replace, replaceAll }) => {
    logAction('edit_file', { path: filePath, find: find?.substring(0, 50) });
    
    if (!fileExists(filePath)) {
      return { success: false, error: `File not found: ${filePath}` };
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      if (replaceAll) {
        content = content.split(find).join(replace);
      } else {
        content = content.replace(find, replace);
      }
      
      if (content === originalContent) {
        return {
          success: true,
          changed: false,
          message: 'No changes made - pattern not found'
        };
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      
      return {
        success: true,
        changed: true,
        path: filePath,
        message: 'File updated successfully'
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  delete_file: async ({ path: filePath, recursive }) => {
    logAction('delete_file', { path: filePath, recursive });
    
    if (!fileExists(filePath)) {
      return { success: true, message: 'File already does not exist' };
    }
    
    try {
      if (isDirectory(filePath)) {
        if (recursive) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.rmdirSync(filePath);
        }
      } else {
        fs.unlinkSync(filePath);
      }
      return { success: true, message: 'Deleted successfully' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  list_directory: async ({ path: dirPath, recursive, pattern }) => {
    logAction('list_directory', { path: dirPath, recursive, pattern });
    
    if (!fileExists(dirPath)) {
      return { success: false, error: `Directory not found: ${dirPath}` };
    }
    
    try {
      const items = [];
      
      function scanDir(currentPath, depth = 0) {
        if (!recursive && depth > 0) return;
        if (depth > 5) return; // Max depth to prevent infinite loops
        
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          // Skip node_modules and .git for cleaner output
          if (entry.name === 'node_modules' || entry.name === '.git') continue;
          
          const fullPath = path.join(currentPath, entry.name);
          const relativePath = path.relative(dirPath, fullPath);
          
          // Pattern matching
          if (pattern && !entry.name.includes(pattern) && !relativePath.includes(pattern)) {
            continue;
          }
          
          const item = {
            name: entry.name,
            path: relativePath,
            type: entry.isDirectory() ? 'directory' : 'file'
          };
          
          if (!entry.isDirectory()) {
            try {
              const stats = fs.statSync(fullPath);
              item.size = stats.size;
            } catch {}
          }
          
          items.push(item);
          
          if (entry.isDirectory() && recursive) {
            scanDir(fullPath, depth + 1);
          }
        }
      }
      
      scanDir(dirPath);
      
      return {
        success: true,
        path: dirPath,
        count: items.length,
        items: items.slice(0, 200) // Limit output
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  search_files: async ({ path: searchPath, pattern, contentPattern, fileExtensions }) => {
    logAction('search_files', { path: searchPath, pattern, contentPattern });
    
    if (!fileExists(searchPath)) {
      return { success: false, error: `Path not found: ${searchPath}` };
    }
    
    try {
      const results = [];
      const extensions = fileExtensions ? fileExtensions.split(',').map(e => e.trim()) : null;
      
      function searchDir(currentPath, depth = 0) {
        if (depth > 10) return;
        
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name === 'node_modules' || entry.name === '.git') continue;
          
          const fullPath = path.join(currentPath, entry.name);
          
          if (entry.isDirectory()) {
            searchDir(fullPath, depth + 1);
          } else {
            // Check extension filter
            if (extensions) {
              const ext = path.extname(entry.name).toLowerCase();
              if (!extensions.some(e => ext === e || ext === '.' + e)) continue;
            }
            
            // Check filename pattern
            const nameMatch = !pattern || entry.name.toLowerCase().includes(pattern.toLowerCase());
            
            // Check content pattern
            let contentMatch = true;
            let matchingLines = [];
            
            if (contentPattern) {
              try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const lines = content.split('\n');
                contentMatch = false;
                
                lines.forEach((line, idx) => {
                  if (line.toLowerCase().includes(contentPattern.toLowerCase())) {
                    contentMatch = true;
                    if (matchingLines.length < 5) {
                      matchingLines.push({ line: idx + 1, text: line.trim().substring(0, 100) });
                    }
                  }
                });
              } catch {
                contentMatch = false;
              }
            }
            
            if (nameMatch || contentMatch) {
              results.push({
                path: fullPath,
                name: entry.name,
                matches: matchingLines
              });
            }
            
            if (results.length >= 50) return;
          }
        }
      }
      
      searchDir(searchPath);
      
      return {
        success: true,
        searchPath,
        pattern,
        contentPattern,
        count: results.length,
        results
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },


  // ===========================================================================
  // 3. GIT OPERATIONS - Full version control
  // ===========================================================================
  git_status: async ({ path: repoPath }) => {
    logAction('git_status', { path: repoPath });
    const cwd = repoPath || process.cwd();
    
    const status = safeExec('git status --porcelain', { cwd });
    const branch = safeExec('git branch --show-current', { cwd });
    const remote = safeExec('git remote -v', { cwd });
    
    return {
      success: true,
      cwd,
      branch: branch.success ? branch.output : 'unknown',
      remotes: remote.success ? remote.output : '',
      changes: status.success ? status.output.split('\n').filter(l => l) : [],
      clean: status.success && !status.output.trim()
    };
  },

  git_commit: async ({ path: repoPath, message, addAll }) => {
    logAction('git_commit', { path: repoPath, message });
    const cwd = repoPath || process.cwd();
    
    if (addAll !== false) {
      const addResult = safeExec('git add -A', { cwd });
      if (!addResult.success) {
        return { success: false, error: `Failed to stage files: ${addResult.error}` };
      }
    }
    
    const commitResult = safeExec(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd });
    
    return {
      success: commitResult.success,
      output: commitResult.output,
      error: commitResult.error
    };
  },

  git_push: async ({ path: repoPath, remote, branch, force }) => {
    logAction('git_push', { path: repoPath, remote, branch, force });
    const cwd = repoPath || process.cwd();
    
    let cmd = 'git push';
    if (remote) cmd += ` ${remote}`;
    if (branch) cmd += ` ${branch}`;
    if (force) cmd += ' --force';
    
    const result = safeExec(cmd, { cwd, timeout: 60000 });
    
    return {
      success: result.success,
      output: result.output,
      stderr: result.stderr,
      error: result.error
    };
  },

  git_pull: async ({ path: repoPath, remote, branch }) => {
    logAction('git_pull', { path: repoPath, remote, branch });
    const cwd = repoPath || process.cwd();
    
    let cmd = 'git pull';
    if (remote) cmd += ` ${remote}`;
    if (branch) cmd += ` ${branch}`;
    
    const result = safeExec(cmd, { cwd, timeout: 60000 });
    
    return {
      success: result.success,
      output: result.output,
      error: result.error
    };
  },

  git_clone: async ({ url, path: destPath, branch }) => {
    logAction('git_clone', { url, path: destPath, branch });
    
    let cmd = `git clone "${url}"`;
    if (destPath) cmd += ` "${destPath}"`;
    if (branch) cmd += ` -b ${branch}`;
    
    const result = safeExec(cmd, { timeout: 120000 });
    
    return {
      success: result.success,
      output: result.output,
      error: result.error,
      path: destPath || path.basename(url, '.git')
    };
  },

  git_branch: async ({ path: repoPath, name, checkout, delete: deleteBranch }) => {
    logAction('git_branch', { path: repoPath, name, checkout, delete: deleteBranch });
    const cwd = repoPath || process.cwd();
    
    if (deleteBranch) {
      const result = safeExec(`git branch -d ${name}`, { cwd });
      return { success: result.success, output: result.output, error: result.error };
    }
    
    if (checkout) {
      const result = safeExec(`git checkout -b ${name}`, { cwd });
      return { success: result.success, output: result.output, error: result.error };
    }
    
    // List branches
    const result = safeExec('git branch -a', { cwd });
    return {
      success: result.success,
      branches: result.success ? result.output.split('\n').map(b => b.trim()).filter(b => b) : [],
      error: result.error
    };
  },

  // ===========================================================================
  // 4. PACKAGE MANAGEMENT - npm, pip, etc.
  // ===========================================================================
  install_packages: async ({ packages, path: projectPath, manager, dev }) => {
    logAction('install_packages', { packages, path: projectPath, manager });
    const cwd = projectPath || process.cwd();
    
    // Auto-detect package manager
    const hasPackageJson = fileExists(path.join(cwd, 'package.json'));
    const hasRequirements = fileExists(path.join(cwd, 'requirements.txt'));
    const hasPyproject = fileExists(path.join(cwd, 'pyproject.toml'));
    
    const detectedManager = manager || 
      (hasPackageJson ? 'npm' : 
       hasRequirements || hasPyproject ? 'pip' : 'npm');
    
    let cmd;
    const pkgList = Array.isArray(packages) ? packages.join(' ') : packages;
    
    switch (detectedManager) {
      case 'npm':
        cmd = `npm install ${pkgList}${dev ? ' --save-dev' : ''}`;
        break;
      case 'yarn':
        cmd = `yarn add ${pkgList}${dev ? ' --dev' : ''}`;
        break;
      case 'pnpm':
        cmd = `pnpm add ${pkgList}${dev ? ' --save-dev' : ''}`;
        break;
      case 'pip':
        cmd = `pip install ${pkgList}`;
        break;
      case 'pip3':
        cmd = `pip3 install ${pkgList}`;
        break;
      default:
        return { success: false, error: `Unknown package manager: ${detectedManager}` };
    }
    
    const result = safeExec(cmd, { cwd, timeout: 120000 });
    
    return {
      success: result.success,
      manager: detectedManager,
      packages: pkgList,
      output: result.output,
      error: result.error
    };
  },

  run_script: async ({ script, path: projectPath, args }) => {
    logAction('run_script', { script, path: projectPath, args });
    const cwd = projectPath || process.cwd();
    
    // Check if package.json exists with scripts
    const pkgPath = path.join(cwd, 'package.json');
    if (fileExists(pkgPath)) {
      const pkg = readJsonSafe(pkgPath);
      if (pkg.success && pkg.data.scripts?.[script]) {
        let cmd = `npm run ${script}`;
        if (args) cmd += ` -- ${args}`;
        const result = await execAsync(cmd, { cwd, timeout: 300000 });
        return {
          success: result.success,
          script,
          output: result.output,
          stderr: result.stderr,
          error: result.error
        };
      }
    }
    
    return { success: false, error: `Script "${script}" not found in package.json` };
  },


  // ===========================================================================
  // 5. PROJECT CREATION - Full project scaffolding
  // ===========================================================================
  create_project: async ({ name, type, path: location, template, features }) => {
    logAction('create_project', { name, type, location, template, features });
    
    const projectPath = path.join(location || PATHS.projects, name);
    
    // Create directory
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    
    const results = { steps: [], success: true };
    
    // Project templates
    const templates = {
      react: async () => {
        // Create React project using Vite (faster than CRA)
        const result = safeExec(`npm create vite@latest ${name} -- --template react-ts`, { 
          cwd: path.dirname(projectPath),
          timeout: 120000 
        });
        if (result.success) {
          results.steps.push({ step: 'Created Vite React TypeScript project', success: true });
          // Install dependencies
          const installResult = safeExec('npm install', { cwd: projectPath, timeout: 120000 });
          results.steps.push({ step: 'Installed dependencies', success: installResult.success });
        } else {
          results.steps.push({ step: 'Create React project', success: false, error: result.error });
          results.success = false;
        }
        return 'React TypeScript project with Vite';
      },
      
      nextjs: async () => {
        const result = safeExec(
          `npx create-next-app@latest ${name} --typescript --tailwind --eslint --app --src-dir --no-turbopack --use-npm`,
          { cwd: path.dirname(projectPath), timeout: 180000 }
        );
        results.steps.push({ 
          step: 'Created Next.js project', 
          success: result.success,
          error: result.error 
        });
        results.success = result.success;
        return 'Next.js project with TypeScript, Tailwind, App Router';
      },
      
      python: async () => {
        // Create Python project structure
        const dirs = ['src', 'tests', 'docs'];
        dirs.forEach(d => fs.mkdirSync(path.join(projectPath, d), { recursive: true }));
        
        // Create files
        const files = {
          'requirements.txt': '# Dependencies\nfastapi>=0.100.0\nuvicorn>=0.22.0\npython-dotenv>=1.0.0\n',
          'src/__init__.py': '',
          'src/main.py': `"""${name} - Main Application"""
from fastapi import FastAPI

app = FastAPI(title="${name}")

@app.get("/")
async def root():
    return {"message": "Hello from ${name}!"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`,
          'tests/__init__.py': '',
          'tests/test_main.py': `"""Tests for main application"""
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
`,
          'README.md': `# ${name}\n\n## Setup\n\`\`\`bash\npip install -r requirements.txt\n\`\`\`\n\n## Run\n\`\`\`bash\nuvicorn src.main:app --reload\n\`\`\`\n`,
          '.gitignore': '__pycache__/\n*.py[cod]\n*$py.class\n.env\nvenv/\n.venv/\n*.egg-info/\n',
          '.env.example': 'DEBUG=true\nAPI_KEY=your-key-here\n'
        };
        
        Object.entries(files).forEach(([filename, content]) => {
          fs.writeFileSync(path.join(projectPath, filename), content);
        });
        
        // Initialize git
        safeExec('git init', { cwd: projectPath });
        
        // Create virtual environment
        const venvResult = safeExec('python -m venv venv', { cwd: projectPath, timeout: 60000 });
        results.steps.push({ step: 'Created virtual environment', success: venvResult.success });
        
        results.steps.push({ step: 'Created Python FastAPI project', success: true });
        return 'Python FastAPI project with tests';
      },
      
      node: async () => {
        // Initialize npm
        safeExec('npm init -y', { cwd: projectPath });
        
        // Create structure
        fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });
        fs.mkdirSync(path.join(projectPath, 'tests'), { recursive: true });
        
        const files = {
          'src/index.js': `/**
 * ${name} - Main Entry Point
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from ${name}!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;
`,
          '.gitignore': 'node_modules/\n.env\n*.log\ndist/\n',
          '.env.example': 'PORT=3000\nNODE_ENV=development\n',
          'README.md': `# ${name}\n\n## Install\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Run\n\`\`\`bash\nnpm start\n\`\`\`\n`
        };
        
        Object.entries(files).forEach(([filename, content]) => {
          fs.writeFileSync(path.join(projectPath, filename), content);
        });
        
        // Update package.json
        const pkgPath = path.join(projectPath, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.main = 'src/index.js';
        pkg.scripts = {
          start: 'node src/index.js',
          dev: 'node --watch src/index.js',
          test: 'jest'
        };
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        
        // Install dependencies
        safeExec('npm install express', { cwd: projectPath, timeout: 60000 });
        
        // Initialize git
        safeExec('git init', { cwd: projectPath });
        
        results.steps.push({ step: 'Created Node.js Express project', success: true });
        return 'Node.js Express project';
      },
      
      mcp: async () => {
        // MCP Server template
        fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });
        
        // Copy from this project's template
        const templateSrc = path.join(PATHS.projectRoot, 'templates', 'workspace-rules', 'mcp-server.md');
        if (fileExists(templateSrc)) {
          fs.copyFileSync(templateSrc, path.join(projectPath, 'GUIDE.md'));
        }
        
        // Create package.json
        const pkg = {
          name,
          version: '1.0.0',
          type: 'module',
          main: 'src/index.js',
          scripts: { start: 'node src/index.js' },
          dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' }
        };
        fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify(pkg, null, 2));
        
        // Create MCP server template
        const mcpTemplate = `#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: '${name}', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// List your tools here
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'hello',
      description: 'Say hello',
      inputSchema: { type: 'object', properties: { name: { type: 'string' } } }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'hello') {
    return { content: [{ type: 'text', text: \`Hello, \${args.name || 'World'}!\` }] };
  }
  
  return { content: [{ type: 'text', text: 'Unknown tool' }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
`;
        fs.writeFileSync(path.join(projectPath, 'src', 'index.js'), mcpTemplate);
        
        // Install deps
        safeExec('npm install', { cwd: projectPath, timeout: 60000 });
        safeExec('git init', { cwd: projectPath });
        
        results.steps.push({ step: 'Created MCP Server project', success: true });
        return 'MCP Server project';
      },
      
      empty: async () => {
        fs.writeFileSync(path.join(projectPath, 'README.md'), `# ${name}\n\nNew project.\n`);
        fs.writeFileSync(path.join(projectPath, '.gitignore'), 'node_modules/\n.env\n');
        safeExec('git init', { cwd: projectPath });
        results.steps.push({ step: 'Created empty project', success: true });
        return 'Empty project with git';
      }
    };
    
    const templateFn = templates[type] || templates.empty;
    const description = await templateFn();
    
    return {
      success: results.success,
      path: projectPath,
      type,
      description,
      steps: results.steps,
      nextSteps: [
        `Open ${projectPath} in your editor`,
        'Start building your project!'
      ]
    };
  },


  // ===========================================================================
  // 6. TASK ORCHESTRATION - Multi-step autonomous tasks
  // ===========================================================================
  run_task: async ({ task, steps, context }) => {
    logAction('run_task', { task, stepCount: steps?.length });
    
    taskState.currentTask = { task, startedAt: new Date().toISOString(), steps: [], context };
    const results = [];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      taskState.currentTask.currentStep = i;
      
      try {
        let result;
        
        // Execute step based on type
        if (step.command) {
          result = await tools.execute_command({ command: step.command, cwd: step.cwd });
        } else if (step.tool && tools[step.tool]) {
          result = await tools[step.tool](step.args || {});
        } else if (step.file) {
          result = await tools.write_file({ path: step.file, content: step.content });
        } else {
          result = { success: false, error: 'Unknown step type' };
        }
        
        results.push({
          step: i + 1,
          description: step.description || step.command || step.tool,
          ...result
        });
        
        taskState.currentTask.steps.push({ ...step, result, completedAt: new Date().toISOString() });
        
        // Stop on failure unless step is marked as optional
        if (!result.success && !step.optional) {
          taskState.lastError = result.error;
          return {
            success: false,
            completedSteps: i,
            totalSteps: steps.length,
            results,
            error: result.error,
            message: `Task failed at step ${i + 1}: ${step.description || ''}`,
            canContinue: true,
            suggestion: 'Use continue_task to retry or skip this step'
          };
        }
      } catch (e) {
        results.push({ step: i + 1, success: false, error: e.message });
        taskState.lastError = e.message;
        return {
          success: false,
          completedSteps: i,
          totalSteps: steps.length,
          results,
          error: e.message
        };
      }
    }
    
    taskState.currentTask = null;
    
    return {
      success: true,
      completedSteps: steps.length,
      totalSteps: steps.length,
      results,
      message: `Task "${task}" completed successfully!`
    };
  },

  continue_task: async ({ action, newStep }) => {
    logAction('continue_task', { action });
    
    if (!taskState.currentTask) {
      return { 
        success: false, 
        error: 'No active task to continue',
        lastError: taskState.lastError,
        history: taskState.history.slice(-5)
      };
    }
    
    const task = taskState.currentTask;
    
    if (action === 'retry') {
      // Retry the current step
      const stepIndex = task.currentStep;
      return { 
        success: true, 
        action: 'retry',
        message: `Will retry step ${stepIndex + 1}`,
        step: task.steps[stepIndex]
      };
    }
    
    if (action === 'skip') {
      // Skip current step and continue
      task.currentStep++;
      return { 
        success: true, 
        action: 'skip',
        message: `Skipped step ${task.currentStep}, continuing...`,
        nextStep: task.currentStep
      };
    }
    
    if (action === 'abort') {
      taskState.currentTask = null;
      return { success: true, action: 'abort', message: 'Task aborted' };
    }
    
    return { success: false, error: `Unknown action: ${action}. Use: retry, skip, abort` };
  },

  // ===========================================================================
  // 7. ENVIRONMENT MANAGEMENT - Diagnosis and repair
  // ===========================================================================
  diagnose_environment: async () => {
    logAction('diagnose_environment', {});
    
    const issues = [];
    const status = { healthy: true };

    // Check Node.js
    const nodeCheck = safeExec('node --version');
    if (!nodeCheck.success) {
      issues.push({ severity: 'critical', issue: 'Node.js not installed', fix: 'install_nodejs', autoFix: false });
      status.healthy = false;
    } else {
      status.nodeVersion = nodeCheck.output;
    }

    // Check npm
    const npmCheck = safeExec('npm --version');
    if (!npmCheck.success) {
      issues.push({ severity: 'critical', issue: 'npm not available', fix: 'reinstall_node', autoFix: false });
      status.healthy = false;
    } else {
      status.npmVersion = npmCheck.output;
    }

    // Check Git
    const gitCheck = safeExec('git --version');
    if (!gitCheck.success) {
      issues.push({ severity: 'warning', issue: 'Git not installed', fix: 'install_git', autoFix: false });
    } else {
      status.gitVersion = gitCheck.output;
    }

    // Check Python
    let pythonCmd = 'python';
    let pythonCheck = safeExec('python --version');
    if (!pythonCheck.success) {
      pythonCheck = safeExec('python3 --version');
      pythonCmd = 'python3';
    }
    if (pythonCheck.success) {
      status.pythonVersion = pythonCheck.output;
      status.pythonCmd = pythonCmd;
    }

    // Check Windsurf settings
    const settingsPath = path.join(PATHS.windsurfSettings, 'settings.json');
    if (!fileExists(settingsPath)) {
      issues.push({ severity: 'warning', issue: 'Windsurf settings not configured', fix: 'setup_windsurf', autoFix: true });
    } else {
      const settings = readJsonSafe(settingsPath);
      if (!settings.success) {
        issues.push({ severity: 'critical', issue: 'settings.json is corrupted', fix: 'repair_settings', autoFix: true });
        status.healthy = false;
      } else {
        status.windsurfSettingsValid = true;
      }
    }

    // Check MCP config
    const mcpPath = path.join(PATHS.codeium, 'mcp_config.json');
    if (!fileExists(mcpPath)) {
      issues.push({ severity: 'info', issue: 'MCP servers not configured', fix: 'setup_mcp', autoFix: true });
    } else {
      const mcp = readJsonSafe(mcpPath);
      if (!mcp.success) {
        issues.push({ severity: 'critical', issue: 'mcp_config.json is corrupted', fix: 'repair_mcp', autoFix: true });
        status.healthy = false;
      } else {
        status.mcpServers = Object.keys(mcp.data.mcpServers || {}).length;
      }
    }

    // Check global rules
    const rulesPath = path.join(PATHS.memories, 'global_rules.md');
    if (!fileExists(rulesPath)) {
      issues.push({ severity: 'info', issue: 'AI global rules not set', fix: 'setup_rules', autoFix: true });
    }

    // Check Projects directory
    if (!fileExists(PATHS.projects)) {
      issues.push({ severity: 'info', issue: 'Projects directory not found', fix: 'create_projects_dir', autoFix: true });
    }

    return {
      status,
      issues,
      autoFixable: issues.filter(i => i.autoFix).length,
      summary: issues.length === 0 
        ? '✅ Environment is healthy! All systems operational.'
        : `Found ${issues.length} issue(s). ${issues.filter(i => i.autoFix).length} can be auto-fixed.`
    };
  },

  auto_fix: async ({ issue_type, all }) => {
    logAction('auto_fix', { issue_type, all });
    
    const fixes = {
      setup_windsurf: async () => {
        const src = path.join(PATHS.projectRoot, 'settings.json');
        const dest = path.join(PATHS.windsurfSettings, 'settings.json');
        if (!fileExists(src)) return { success: false, message: 'Source settings.json not found' };
        const result = copyFileSafe(src, dest);
        return result.success ? { success: true, message: 'Windsurf settings installed' } : { success: false, message: result.error };
      },

      setup_mcp: async () => {
        const src = path.join(PATHS.projectRoot, 'examples', 'mcp_config.json');
        const dest = path.join(PATHS.codeium, 'mcp_config.json');
        if (!fileExists(src)) return { success: false, message: 'Source mcp_config.json not found' };
        const result = copyFileSafe(src, dest);
        return result.success ? { success: true, message: 'MCP configuration installed' } : { success: false, message: result.error };
      },

      setup_rules: async () => {
        const src = path.join(PATHS.projectRoot, 'examples', 'global_rules.md');
        const dest = path.join(PATHS.memories, 'global_rules.md');
        if (!fileExists(src)) return { success: false, message: 'Source global_rules.md not found' };
        const result = copyFileSafe(src, dest);
        return result.success ? { success: true, message: 'AI global rules installed' } : { success: false, message: result.error };
      },

      repair_settings: async () => {
        const settingsPath = path.join(PATHS.windsurfSettings, 'settings.json');
        const backupPath = path.join(PATHS.windsurfSettings, `settings.backup.${Date.now()}.json`);
        if (fileExists(settingsPath)) copyFileSafe(settingsPath, backupPath);
        return await fixes.setup_windsurf();
      },

      repair_mcp: async () => {
        const mcpPath = path.join(PATHS.codeium, 'mcp_config.json');
        const backupPath = path.join(PATHS.codeium, `mcp_config.backup.${Date.now()}.json`);
        if (fileExists(mcpPath)) copyFileSafe(mcpPath, backupPath);
        return await fixes.setup_mcp();
      },

      create_projects_dir: async () => {
        const result = writeFileSafe(path.join(PATHS.projects, '.keep'), '');
        return result.success ? { success: true, message: 'Projects directory created' } : { success: false, message: result.error };
      },

      install_dependencies: async () => {
        const result = safeExec('npm install', { cwd: PATHS.projectRoot, timeout: 120000 });
        return result.success ? { success: true, message: 'Dependencies installed' } : { success: false, message: result.error };
      }
    };

    if (all) {
      const diagnosis = await tools.diagnose_environment();
      const results = [];
      for (const issue of diagnosis.issues) {
        if (issue.autoFix && fixes[issue.fix]) {
          const result = await fixes[issue.fix]();
          results.push({ issue: issue.issue, fix: issue.fix, ...result });
        }
      }
      return { success: true, fixed: results };
    }

    if (!fixes[issue_type]) {
      return { success: false, message: `Unknown fix type: ${issue_type}`, available: Object.keys(fixes) };
    }

    return await fixes[issue_type]();
  },


  // ===========================================================================
  // 8. COMPLETE SETUP - Full automated setup
  // ===========================================================================
  complete_setup: async () => {
    logAction('complete_setup', {});
    
    const results = { steps: [], success: true };
    
    // Fix all auto-fixable issues
    const fixResult = await tools.auto_fix({ all: true });
    results.steps.push({ step: 'Auto-fix issues', ...fixResult });
    
    // Install project dependencies
    const depsResult = await tools.auto_fix({ issue_type: 'install_dependencies' });
    results.steps.push({ step: 'Install dependencies', ...depsResult });
    
    return {
      success: results.steps.every(s => s.success !== false),
      steps: results.steps,
      message: '🎉 Setup complete! Restart Windsurf to activate all features.',
      nextSteps: [
        'Restart Windsurf IDE',
        'Test by saying: "Check my status"',
        'Create a project: "Make me a website called my-site"'
      ]
    };
  },

  // ===========================================================================
  // 9. GUIDED TASKS - Help users understand what will happen
  // ===========================================================================
  guide_task: async ({ task }) => {
    logAction('guide_task', { task });
    
    const taskLower = task.toLowerCase();
    
    // Intelligent task matching
    const guides = {
      'setup|configure|install': {
        name: 'Complete Setup',
        description: 'Set up your entire Windsurf environment automatically',
        steps: [
          'Check your system (Node.js, Git, Python)',
          'Install Windsurf settings',
          'Configure MCP servers',
          'Set up AI rules',
          'Install dependencies'
        ],
        tool: 'complete_setup',
        willDo: 'I will configure everything. You just need to restart Windsurf after.'
      },
      
      'website|web|react|nextjs|frontend': {
        name: 'Create Website',
        description: 'Create a modern website with React or Next.js',
        steps: [
          'Create project directory',
          'Set up Next.js with TypeScript & Tailwind',
          'Initialize Git repository',
          'Install all dependencies'
        ],
        tool: 'create_project',
        args: { type: 'nextjs' },
        willDo: 'I will create a complete Next.js website. Just give me a name for it.'
      },
      
      'api|backend|server|python|fastapi': {
        name: 'Create API',
        description: 'Create a Python FastAPI backend',
        steps: [
          'Create project structure',
          'Set up FastAPI with uvicorn',
          'Create example endpoints',
          'Set up tests',
          'Initialize Git'
        ],
        tool: 'create_project',
        args: { type: 'python' },
        willDo: 'I will create a Python API project. Just give me a name.'
      },
      
      'mcp|plugin|extension|tool': {
        name: 'Create MCP Server',
        description: 'Create a custom MCP server/plugin',
        steps: [
          'Create MCP server structure',
          'Set up SDK dependencies',
          'Create example tool',
          'Configure for Windsurf'
        ],
        tool: 'create_project',
        args: { type: 'mcp' },
        willDo: 'I will create an MCP server template you can customize.'
      },
      
      'fix|repair|diagnose|problem|error|issue': {
        name: 'Fix Issues',
        description: 'Diagnose and fix environment problems',
        steps: [
          'Scan for issues',
          'Identify fixable problems',
          'Auto-repair what I can',
          'Report what needs manual attention'
        ],
        tool: 'diagnose_environment',
        willDo: 'I will find and fix issues automatically. Just say "fix it" after diagnosis.'
      },
      
      'status|check|health|ready': {
        name: 'Check Status',
        description: 'Check if everything is working',
        steps: [
          'Check installed tools',
          'Verify configurations',
          'Test connectivity',
          'Report status'
        ],
        tool: 'get_status',
        willDo: 'I will check your entire environment and tell you what\'s working.'
      },
      
      'git|commit|push|version': {
        name: 'Git Operations',
        description: 'Manage version control',
        steps: [
          'Check current status',
          'Stage changes',
          'Create commit',
          'Push to remote'
        ],
        tool: 'git_status',
        willDo: 'I can help with Git. Tell me: commit, push, pull, or status.'
      },

      'run|start|dev|serve': {
        name: 'Run Project',
        description: 'Start development server or run scripts',
        steps: [
          'Detect project type',
          'Find available scripts',
          'Start appropriate command'
        ],
        tool: 'run_script',
        willDo: 'I will start your project. What script should I run? (e.g., dev, start, build)'
      }
    };
    
    // Find matching guide
    for (const [pattern, guide] of Object.entries(guides)) {
      const keywords = pattern.split('|');
      if (keywords.some(k => taskLower.includes(k))) {
        return {
          found: true,
          ...guide,
          message: `I can help with "${guide.name}". Here's what I'll do:`,
          prompt: guide.willDo
        };
      }
    }
    
    return {
      found: false,
      message: "I'm not sure what you want to do. I can help with:",
      suggestions: Object.values(guides).map(g => ({ name: g.name, description: g.description })),
      hint: 'Try saying something like: "set up my environment", "create a website", or "fix my issues"'
    };
  },

  // ===========================================================================
  // 10. STATUS & CONTEXT - Know what's going on
  // ===========================================================================
  get_status: async () => {
    logAction('get_status', {});
    
    const status = {
      server: 'windsurf-autopilot',
      version: '2.0.0',
      platform: process.platform,
      nodeVersion: process.version,
      homeDir: HOME,
      paths: PATHS,
      currentTask: taskState.currentTask,
      lastActions: taskState.history.slice(-5)
    };

    // Check each component
    const components = {};
    
    // Node & npm
    const nodeCheck = safeExec('node --version');
    components.node = { installed: nodeCheck.success, version: nodeCheck.output };
    
    const npmCheck = safeExec('npm --version');
    components.npm = { installed: npmCheck.success, version: npmCheck.output };
    
    // Git
    const gitCheck = safeExec('git --version');
    components.git = { installed: gitCheck.success, version: gitCheck.output };
    
    // Python
    let pythonCheck = safeExec('python --version');
    if (!pythonCheck.success) pythonCheck = safeExec('python3 --version');
    components.python = { installed: pythonCheck.success, version: pythonCheck.output };
    
    // Windsurf settings
    components.windsurfSettings = { 
      exists: fileExists(path.join(PATHS.windsurfSettings, 'settings.json')) 
    };
    
    // MCP config
    const mcpPath = path.join(PATHS.codeium, 'mcp_config.json');
    if (fileExists(mcpPath)) {
      const mcp = readJsonSafe(mcpPath);
      components.mcpConfig = {
        exists: true,
        valid: mcp.success,
        serverCount: mcp.success ? Object.keys(mcp.data.mcpServers || {}).length : 0
      };
    } else {
      components.mcpConfig = { exists: false };
    }
    
    // Global rules
    components.globalRules = { 
      exists: fileExists(path.join(PATHS.memories, 'global_rules.md')) 
    };
    
    // Projects directory
    components.projectsDir = { exists: fileExists(PATHS.projects) };
    
    status.components = components;
    
    // Overall readiness
    const critical = components.node.installed && components.npm.installed;
    const recommended = components.git.installed && components.windsurfSettings.exists && components.mcpConfig.exists;
    
    status.ready = critical;
    status.fullyConfigured = critical && recommended;
    
    if (!critical) {
      status.message = '❌ Node.js required. Install from nodejs.org';
      status.action = 'Install Node.js first';
    } else if (!recommended) {
      status.message = '⚠️ Partially ready. Some features need setup.';
      status.action = 'Run complete_setup to finish configuration';
    } else {
      status.message = '✅ Fully operational! Ready for vibe coding.';
      status.action = 'You\'re all set! Start creating!';
    }

    return status;
  },

  // ===========================================================================
  // 11. HISTORY & CONTEXT
  // ===========================================================================
  get_history: async ({ limit }) => {
    return {
      success: true,
      count: taskState.history.length,
      actions: taskState.history.slice(-(limit || 20)),
      currentTask: taskState.currentTask,
      lastError: taskState.lastError
    };
  },

  // ===========================================================================
  // NEW v2.2 TOOLS - Project Intelligence, Error Analysis, HTTP, Quality, Testing
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
  },

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
  },

  // ===========================================================================
  // NEW v2.3 TOOLS - Autopilot Intelligence & Learning
  // ===========================================================================
  
  // Autopilot Status Indicator
  autopilot_status: async () => {
    return autopilotIntel.getAutopilotStatus();
  },
  
  // Learning & Memory
  get_insights: async () => {
    return autopilotIntel.getInsights();
  },
  
  remember_preference: async ({ key, value }) => {
    autopilotIntel.rememberPreference(key, value);
    return { success: true, message: `Preference "${key}" saved.` };
  },
  
  get_preference: async ({ key, defaultValue }) => {
    const value = autopilotIntel.getPreference(key, defaultValue);
    return { key, value, found: value !== defaultValue };
  },
  
  save_project_context: async ({ projectPath, context }) => {
    autopilotIntel.saveProjectContext(projectPath, context);
    return { success: true, message: 'Project context saved.' };
  },
  
  get_project_context: async ({ projectPath }) => {
    const context = autopilotIntel.getProjectContext(projectPath);
    return context || { found: false, message: 'No saved context for this project.' };
  },
  
  get_suggestions: async ({ currentAction, projectPath }) => {
    return autopilotIntel.getSuggestions(currentAction, projectPath);
  },
  
  clear_learning_data: async () => {
    return autopilotIntel.clearAllData();
  },

  // ===========================================================================
  // NEW v2.4 TOOLS - Real-Time AI/ML Engine
  // ===========================================================================
  
  // Real-Time Learning
  ai_learn: async (args) => {
    return await realtimeAI.learnFromInteraction(args);
  },
  
  ai_status: async () => {
    return realtimeAI.getAIEngineStatus();
  },
  
  // Web Integration
  search_stackoverflow: async ({ query, tags }) => {
    return await realtimeAI.searchStackOverflow(query, tags || []);
  },
  
  search_github: async ({ query, language }) => {
    return await realtimeAI.searchGitHub(query, language || '');
  },
  
  search_npm: async ({ query }) => {
    return await realtimeAI.searchNPM(query);
  },
  
  find_solution: async ({ error }) => {
    return await realtimeAI.findSolutionForError(error);
  },
  
  // Knowledge Graph
  query_knowledge: async ({ query }) => {
    return realtimeAI.queryKnowledgeGraph(query);
  },
  
  // Similarity Search
  find_similar: async ({ query, topK }) => {
    return realtimeAI.findSimilar(query, topK || 5);
  },
  
  // User Feedback
  record_feedback: async ({ actionId, rating, comment }) => {
    return realtimeAI.recordFeedback(actionId, rating, comment || '');
  },
  
  // Proactive Suggestions
  get_ai_suggestions: async (args) => {
    return await realtimeAI.getProactiveSuggestions(args);
  },
  
  // Auto Learning
  auto_learn_web: async ({ topics }) => {
    return await realtimeAI.autoLearnFromWeb(topics);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // v2.5 ULTIMATE TOOLS - 40 NEW TOOLS FOR 95%+ AUTOPILOT
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Cloud Deployment
  deploy_vercel: async (args) => ultimateTools.deployVercel(args),
  deploy_netlify: async (args) => ultimateTools.deployNetlify(args),
  deploy_railway: async (args) => ultimateTools.deployRailway(args),
  deploy_docker_hub: async (args) => ultimateTools.deployDockerHub(args),
  
  // CI/CD
  setup_github_actions: async (args) => ultimateTools.setupGitHubActions(args),
  setup_gitlab_ci: async (args) => ultimateTools.setupGitLabCI(args),
  run_pipeline: async (args) => ultimateTools.runPipeline(args),
  check_pipeline_status: async (args) => ultimateTools.checkPipelineStatus(args),
  
  // Code Operations
  refactor_code: async (args) => ultimateTools.refactorCode(args),
  generate_docs: async (args) => ultimateTools.generateDocs(args),
  code_review: async (args) => ultimateTools.codeReview(args),
  find_dead_code: async (args) => ultimateTools.findDeadCode(args),
  analyze_complexity: async (args) => ultimateTools.analyzeComplexity(args),
  
  // Security
  security_audit: async (args) => ultimateTools.securityAudit(args),
  update_dependencies: async (args) => ultimateTools.updateDependencies(args),
  check_licenses: async (args) => ultimateTools.checkLicenses(args),
  scan_secrets: async (args) => ultimateTools.scanSecrets(args),
  
  // API Testing
  test_api: async (args) => ultimateTools.testApi(args),
  mock_server: async (args) => ultimateTools.mockServer(args),
  generate_api_docs: async (args) => ultimateTools.generateApiDocs(args),
  
  // Templates
  save_template: async (args) => ultimateTools.saveTemplate(args),
  list_templates: async () => ultimateTools.listTemplates(),
  use_template: async (args) => ultimateTools.useTemplate(args),
  
  // Notifications
  notify: async (args) => ultimateTools.notify(args),
  send_webhook: async (args) => ultimateTools.sendWebhook(args),
  schedule_task: async (args) => ultimateTools.scheduleTask(args),
  
  // File Operations
  file_diff: async (args) => ultimateTools.fileDiff(args),
  file_merge: async (args) => ultimateTools.fileMerge(args),
  bulk_rename: async (args) => ultimateTools.bulkRename(args),
  find_replace_all: async (args) => ultimateTools.findReplaceAll(args),
  
  // Logs
  analyze_logs: async (args) => ultimateTools.analyzeLogs(args),
  tail_logs: async (args) => ultimateTools.tailLogs(args),
  search_logs: async (args) => ultimateTools.searchLogs(args),
  
  // Performance
  benchmark_project: async (args) => ultimateTools.benchmarkProject(args),
  profile_app: async (args) => ultimateTools.profileApp(args),
  analyze_bundle: async (args) => ultimateTools.analyzeBundle(args),
  
  // Workspace
  switch_project: async (args) => ultimateTools.switchProject(args),
  list_projects: async () => ultimateTools.listProjects(),
  project_health: async (args) => ultimateTools.projectHealth(args),
  cleanup_project: async (args) => ultimateTools.cleanupProject(args)
};


// ==============================================================================
// MCP SERVER SETUP
// ==============================================================================
const server = new Server(
  { name: 'windsurf-autopilot', version: '2.5.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// Complete tool definitions for MCP
const toolDefinitions = [
  // Command Execution
  {
    name: 'execute_command',
    description: 'Execute ANY terminal command. Use this to run npm, pip, git, or any shell command for the user.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        cwd: { type: 'string', description: 'Working directory (optional)' },
        timeout: { type: 'number', description: 'Timeout in ms (default: 120000)' },
        background: { type: 'boolean', description: 'Run in background' }
      },
      required: ['command']
    }
  },
  
  // File Operations
  {
    name: 'read_file',
    description: 'Read contents of any file.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to read' },
        encoding: { type: 'string', description: 'Encoding (default: utf8)' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file. Creates directories if needed.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' },
        append: { type: 'boolean', description: 'Append instead of overwrite' },
        createDirs: { type: 'boolean', description: 'Create parent directories (default: true)' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'edit_file',
    description: 'Find and replace text in a file.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to edit' },
        find: { type: 'string', description: 'Text to find' },
        replace: { type: 'string', description: 'Replacement text' },
        replaceAll: { type: 'boolean', description: 'Replace all occurrences' }
      },
      required: ['path', 'find', 'replace']
    }
  },
  {
    name: 'delete_file',
    description: 'Delete a file or directory.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to delete' },
        recursive: { type: 'boolean', description: 'Delete directories recursively' }
      },
      required: ['path']
    }
  },
  {
    name: 'list_directory',
    description: 'List files and folders in a directory.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path' },
        recursive: { type: 'boolean', description: 'Include subdirectories' },
        pattern: { type: 'string', description: 'Filter by name pattern' }
      },
      required: ['path']
    }
  },
  {
    name: 'search_files',
    description: 'Search for files by name or content.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory to search' },
        pattern: { type: 'string', description: 'Filename pattern' },
        contentPattern: { type: 'string', description: 'Search file contents' },
        fileExtensions: { type: 'string', description: 'File extensions (e.g., ".js,.ts")' }
      },
      required: ['path']
    }
  },

  // Git Operations
  {
    name: 'git_status',
    description: 'Get Git repository status.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path' }
      }
    }
  },
  {
    name: 'git_commit',
    description: 'Stage and commit changes.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path' },
        message: { type: 'string', description: 'Commit message' },
        addAll: { type: 'boolean', description: 'Stage all changes (default: true)' }
      },
      required: ['message']
    }
  },
  {
    name: 'git_push',
    description: 'Push commits to remote.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path' },
        remote: { type: 'string', description: 'Remote name (default: origin)' },
        branch: { type: 'string', description: 'Branch name' },
        force: { type: 'boolean', description: 'Force push' }
      }
    }
  },
  {
    name: 'git_pull',
    description: 'Pull changes from remote.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path' },
        remote: { type: 'string', description: 'Remote name' },
        branch: { type: 'string', description: 'Branch name' }
      }
    }
  },
  {
    name: 'git_clone',
    description: 'Clone a Git repository.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Repository URL' },
        path: { type: 'string', description: 'Destination path' },
        branch: { type: 'string', description: 'Branch to clone' }
      },
      required: ['url']
    }
  },
  {
    name: 'git_branch',
    description: 'List, create, or delete branches.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Repository path' },
        name: { type: 'string', description: 'Branch name' },
        checkout: { type: 'boolean', description: 'Create and checkout branch' },
        delete: { type: 'boolean', description: 'Delete branch' }
      }
    }
  },

  // Package Management
  {
    name: 'install_packages',
    description: 'Install npm, pip, or other packages.',
    inputSchema: {
      type: 'object',
      properties: {
        packages: { 
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } }
          ],
          description: 'Package(s) to install' 
        },
        path: { type: 'string', description: 'Project path' },
        manager: { type: 'string', enum: ['npm', 'yarn', 'pnpm', 'pip', 'pip3'], description: 'Package manager' },
        dev: { type: 'boolean', description: 'Install as dev dependency' }
      },
      required: ['packages']
    }
  },
  {
    name: 'run_script',
    description: 'Run an npm script from package.json.',
    inputSchema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'Script name (e.g., dev, build, test)' },
        path: { type: 'string', description: 'Project path' },
        args: { type: 'string', description: 'Additional arguments' }
      },
      required: ['script']
    }
  },

  // Project Creation
  {
    name: 'create_project',
    description: 'Create a new project with full structure. User just provides a name.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        type: { 
          type: 'string', 
          enum: ['react', 'nextjs', 'python', 'node', 'mcp', 'empty'],
          description: 'Project type'
        },
        path: { type: 'string', description: 'Parent directory (default: ~/Projects)' },
        template: { type: 'string', description: 'Template name' },
        features: { type: 'array', items: { type: 'string' }, description: 'Additional features' }
      },
      required: ['name', 'type']
    }
  },

  // Task Orchestration
  {
    name: 'run_task',
    description: 'Run a multi-step task automatically.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task name/description' },
        steps: { 
          type: 'array', 
          items: { type: 'object' },
          description: 'Array of steps to execute'
        },
        context: { type: 'object', description: 'Context data' }
      },
      required: ['task', 'steps']
    }
  },
  {
    name: 'continue_task',
    description: 'Continue, retry, or abort a failed task.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { 
          type: 'string', 
          enum: ['retry', 'skip', 'abort'],
          description: 'Action to take'
        },
        newStep: { type: 'object', description: 'Replacement step' }
      },
      required: ['action']
    }
  },

  // Environment
  {
    name: 'diagnose_environment',
    description: 'Check the environment for issues. Finds problems and suggests fixes.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'auto_fix',
    description: 'Automatically fix issues. Can fix specific issue or all auto-fixable issues.',
    inputSchema: {
      type: 'object',
      properties: {
        issue_type: {
          type: 'string',
          enum: ['setup_windsurf', 'setup_mcp', 'setup_rules', 'repair_settings', 'repair_mcp', 'create_projects_dir', 'install_dependencies'],
          description: 'Specific issue to fix'
        },
        all: { type: 'boolean', description: 'Fix all auto-fixable issues' }
      }
    }
  },
  {
    name: 'complete_setup',
    description: 'Complete full Windsurf setup automatically. One command to configure everything.',
    inputSchema: { type: 'object', properties: {} }
  },

  // Guidance
  {
    name: 'guide_task',
    description: 'Get guidance on how to accomplish a task. AI explains what it will do.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'What the user wants to do' }
      },
      required: ['task']
    }
  },

  // Status
  {
    name: 'get_status',
    description: 'Get current system status, installed tools, and configuration state.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_history',
    description: 'Get action history and current task state.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max actions to return (default: 20)' }
      }
    }
  },
  // v2.2 Tools - Project Intelligence
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
  
  // v2.2 Tools - Error Analysis
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
  
  // v2.2 Tools - HTTP
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
  
  // v2.2 Tools - Code Quality
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
  
  // v2.2 Tools - Testing
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
  
  // v2.2 Tools - Process Management
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
  
  // v2.2 Tools - Docker
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
  },
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
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // v2.3 Tools - Autopilot Intelligence & Learning
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'autopilot_status',
    description: 'Get autopilot status with visual indicator (🤖 AUTO-PILOT ACTIVE). Shows if autopilot is working, session stats, and learning progress.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'get_insights',
    description: 'Get AI learning insights - what the autopilot has learned from your interactions, common patterns, and suggestions.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'remember_preference',
    description: 'Remember a user preference for future sessions. The autopilot learns and adapts to your workflow.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Preference name (e.g., "preferred_framework", "auto_commit")' },
        value: { type: 'string', description: 'Preference value' }
      },
      required: ['key', 'value']
    }
  },
  {
    name: 'get_preference',
    description: 'Get a remembered user preference.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Preference name' },
        defaultValue: { type: 'string', description: 'Default if not found' }
      },
      required: ['key']
    }
  },
  {
    name: 'save_project_context',
    description: 'Save project context to remember across sessions. AI will remember project state, tech stack, and your work.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Path to the project' },
        context: { type: 'object', description: 'Project context data to save' }
      },
      required: ['projectPath', 'context']
    }
  },
  {
    name: 'get_project_context',
    description: 'Get saved project context from previous sessions.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Path to the project' }
      },
      required: ['projectPath']
    }
  },
  {
    name: 'get_suggestions',
    description: 'Get AI-powered suggestions based on learned patterns and current context.',
    inputSchema: {
      type: 'object',
      properties: {
        currentAction: { type: 'string', description: 'Current action being performed' },
        projectPath: { type: 'string', description: 'Current project path' }
      }
    }
  },
  {
    name: 'clear_learning_data',
    description: 'Clear all learned data and reset autopilot memory. Use with caution.',
    inputSchema: { type: 'object', properties: {} }
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // v2.4 Tools - Real-Time AI/ML Engine
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'ai_learn',
    description: 'Process an interaction in real-time and learn immediately. The AI extracts patterns, entities, and updates its knowledge graph.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'The action that was performed' },
        params: { type: 'object', description: 'Parameters used' },
        success: { type: 'boolean', description: 'Whether it succeeded' },
        error: { type: 'string', description: 'Error message if failed' },
        context: { type: 'object', description: 'Additional context' }
      },
      required: ['action']
    }
  },
  {
    name: 'ai_status',
    description: 'Get comprehensive AI engine status - total interactions, concepts learned, knowledge graph size, and capabilities.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'search_stackoverflow',
    description: 'Search Stack Overflow for solutions to coding problems. Results are cached and learned from.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags (e.g., ["javascript", "react"])' }
      },
      required: ['query']
    }
  },
  {
    name: 'search_github',
    description: 'Search GitHub for code examples and repositories.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        language: { type: 'string', description: 'Filter by programming language' }
      },
      required: ['query']
    }
  },
  {
    name: 'search_npm',
    description: 'Search NPM registry for packages.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Package name or keyword' }
      },
      required: ['query']
    }
  },
  {
    name: 'find_solution',
    description: 'Find solution for an error by searching local knowledge base and web. Uses AI to rank solutions by success rate.',
    inputSchema: {
      type: 'object',
      properties: {
        error: { type: 'string', description: 'Error message to find solution for' }
      },
      required: ['error']
    }
  },
  {
    name: 'query_knowledge',
    description: 'Query the AI knowledge graph for concepts, relationships, and facts learned from interactions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query for knowledge base' }
      },
      required: ['query']
    }
  },
  {
    name: 'find_similar',
    description: 'Find similar past interactions using vector similarity search. Useful for finding relevant past solutions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Query to find similar items for' },
        topK: { type: 'number', description: 'Number of results (default: 5)' }
      },
      required: ['query']
    }
  },
  {
    name: 'record_feedback',
    description: 'Record user feedback on an action. The AI uses this to improve future suggestions (reinforcement learning).',
    inputSchema: {
      type: 'object',
      properties: {
        actionId: { type: 'string', description: 'ID of the action to rate' },
        rating: { type: 'number', description: 'Rating 1-5 (1=bad, 5=excellent)' },
        comment: { type: 'string', description: 'Optional feedback comment' }
      },
      required: ['actionId', 'rating']
    }
  },
  {
    name: 'get_ai_suggestions',
    description: 'Get proactive AI suggestions based on current context, learned patterns, and web knowledge.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: { type: 'string', description: 'Current project path' },
        currentAction: { type: 'string', description: 'Action being performed' },
        error: { type: 'string', description: 'Current error if any' }
      }
    }
  },
  {
    name: 'auto_learn_web',
    description: 'Automatically fetch and learn from web resources (Stack Overflow, GitHub) for specified topics.',
    inputSchema: {
      type: 'object',
      properties: {
        topics: { type: 'array', items: { type: 'string' }, description: 'Topics to learn about (e.g., ["react", "typescript"])' }
      }
    }
  },
  // v2.5 ULTIMATE TOOLS
  { name: 'deploy_vercel', description: 'Deploy to Vercel', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' }, token: { type: 'string' }, prod: { type: 'boolean' } }, required: ['projectPath'] } },
  { name: 'deploy_netlify', description: 'Deploy to Netlify', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' }, token: { type: 'string' }, prod: { type: 'boolean' } }, required: ['projectPath'] } },
  { name: 'deploy_railway', description: 'Deploy to Railway', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' }, token: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'deploy_docker_hub', description: 'Push to Docker Hub', inputSchema: { type: 'object', properties: { imageName: { type: 'string' }, tag: { type: 'string' } }, required: ['imageName'] } },
  { name: 'setup_github_actions', description: 'Create GitHub Actions CI', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' }, type: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'setup_gitlab_ci', description: 'Create GitLab CI', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'run_pipeline', description: 'Trigger CI/CD pipeline', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'check_pipeline_status', description: 'Check pipeline status', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } } } },
  { name: 'refactor_code', description: 'Auto-refactor code', inputSchema: { type: 'object', properties: { operation: { type: 'string' } }, required: ['operation'] } },
  { name: 'generate_docs', description: 'Generate documentation', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'code_review', description: 'Automated code review', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'find_dead_code', description: 'Find unused code', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'analyze_complexity', description: 'Code complexity analysis', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'security_audit', description: 'Full security audit', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'update_dependencies', description: 'Update deps safely', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' }, mode: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'check_licenses', description: 'License compliance', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'scan_secrets', description: 'Scan for secrets', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'test_api', description: 'API endpoint testing', inputSchema: { type: 'object', properties: { baseUrl: { type: 'string' } }, required: ['baseUrl'] } },
  { name: 'mock_server', description: 'Start mock server', inputSchema: { type: 'object', properties: { port: { type: 'number' } } } },
  { name: 'generate_api_docs', description: 'Generate OpenAPI docs', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'save_template', description: 'Save as template', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' }, templateName: { type: 'string' } }, required: ['projectPath', 'templateName'] } },
  { name: 'list_templates', description: 'List templates', inputSchema: { type: 'object', properties: {} } },
  { name: 'use_template', description: 'Use template', inputSchema: { type: 'object', properties: { templateName: { type: 'string' } }, required: ['templateName'] } },
  { name: 'notify', description: 'Desktop notification', inputSchema: { type: 'object', properties: { title: { type: 'string' }, message: { type: 'string' } }, required: ['title', 'message'] } },
  { name: 'send_webhook', description: 'Send webhook', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
  { name: 'schedule_task', description: 'Schedule task', inputSchema: { type: 'object', properties: { taskName: { type: 'string' }, command: { type: 'string' } }, required: ['taskName', 'command'] } },
  { name: 'file_diff', description: 'Compare files', inputSchema: { type: 'object', properties: { file1: { type: 'string' }, file2: { type: 'string' } }, required: ['file1', 'file2'] } },
  { name: 'file_merge', description: 'Git merge', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' }, source: { type: 'string' } }, required: ['projectPath', 'source'] } },
  { name: 'bulk_rename', description: 'Bulk rename', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' }, pattern: { type: 'string' }, replacement: { type: 'string' } }, required: ['projectPath', 'pattern', 'replacement'] } },
  { name: 'find_replace_all', description: 'Find/replace all', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' }, find: { type: 'string' }, replace: { type: 'string' } }, required: ['projectPath', 'find', 'replace'] } },
  { name: 'analyze_logs', description: 'Analyze logs', inputSchema: { type: 'object', properties: { logPath: { type: 'string' } }, required: ['logPath'] } },
  { name: 'tail_logs', description: 'Tail logs', inputSchema: { type: 'object', properties: { logPath: { type: 'string' } }, required: ['logPath'] } },
  { name: 'search_logs', description: 'Search logs', inputSchema: { type: 'object', properties: { logDir: { type: 'string' }, pattern: { type: 'string' } }, required: ['logDir', 'pattern'] } },
  { name: 'benchmark_project', description: 'Run benchmarks', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'profile_app', description: 'Profile app', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'analyze_bundle', description: 'Analyze bundle', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'switch_project', description: 'Switch project', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'list_projects', description: 'List projects', inputSchema: { type: 'object', properties: {} } },
  { name: 'project_health', description: 'Project health', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } },
  { name: 'cleanup_project', description: 'Cleanup project', inputSchema: { type: 'object', properties: { projectPath: { type: 'string' } }, required: ['projectPath'] } }
];

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!tools[name]) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}`, available: Object.keys(tools) }) }]
    };
  }

  try {
    const result = await tools[name](args || {});
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: error.message, stack: error.stack }) }]
    };
  }
});

// Resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'autopilot://status',
      name: 'System Status',
      description: 'Current environment status',
      mimeType: 'application/json'
    },
    {
      uri: 'autopilot://history',
      name: 'Action History',
      description: 'Recent actions and task state',
      mimeType: 'application/json'
    }
  ]
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  if (uri === 'autopilot://status') {
    const status = await tools.get_status();
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(status, null, 2) }]
    };
  }
  
  if (uri === 'autopilot://history') {
    const history = await tools.get_history({ limit: 50 });
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(history, null, 2) }]
    };
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Windsurf Autopilot v2.5.0 ULTIMATE - 80+ Tools, 95% Autopilot');
  console.error(`📂 Home: ${HOME}`);
  console.error(`💻 Platform: ${process.platform}`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
