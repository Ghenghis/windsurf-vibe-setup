#!/usr/bin/env node
/**
 * Windsurf Autopilot MCP Server v2.1
 * 
 * This is the enhanced version that includes:
 * - All original v2.0 tools
 * - Project Intelligence (analyze_project, detect_tech_stack)
 * - Smart Error Handling (analyze_error, smart_retry)
 * - HTTP Operations (http_request, download_file)
 * - Code Quality (lint_code, format_code)
 * - Testing (run_tests)
 * - Process Management (start_server, stop_server, list_running)
 * - Docker Support (docker_status, docker_build, docker_run, docker_compose_up)
 * 
 * ZERO-CODE AUTOPILOT - The user NEVER needs to touch a terminal.
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
const http = require('http');
const https = require('https');

// ==============================================================================
// Configuration
// ==============================================================================
const HOME = os.homedir();
const IS_WINDOWS = process.platform === 'win32';
const VERSION = '2.1.0';

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

// Running processes tracker
const runningProcesses = new Map();

// ==============================================================================
// Helper Functions
// ==============================================================================

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
  try { return fs.existsSync(filePath); } catch { return false; }
}

function isDirectory(filePath) {
  try { return fs.statSync(filePath).isDirectory(); } catch { return false; }
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
          if (content[i] === '\\' && i + 1 < content.length) result += content[i++];
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
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function copyFileSafe(src, dest) {
  try {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, dest);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function logAction(action, details) {
  const entry = { timestamp: new Date().toISOString(), action, ...details };
  taskState.history.push(entry);
  if (taskState.history.length > 100) taskState.history.shift();
}

// ==============================================================================
// Import additional tools module
// ==============================================================================
const additionalTools = require('./additional-tools.js');
