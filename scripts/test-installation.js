#!/usr/bin/env node
/**
 * Windsurf Vibe Setup - Installation Validator
 *
 * Tests that all configuration files are properly installed and valid.
 *
 * Usage:
 *   node scripts/test-installation.js
 *   npm run test:install
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ==============================================================================
// Configuration
// ==============================================================================
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Paths based on OS
function getPaths() {
  const home = os.homedir();
  let windsurfSettings;

  if (process.platform === 'win32') {
    windsurfSettings = path.join(process.env.APPDATA || '', 'Windsurf', 'User');
  } else if (process.platform === 'darwin') {
    windsurfSettings = path.join(home, 'Library', 'Application Support', 'Windsurf', 'User');
  } else {
    windsurfSettings = path.join(home, '.config', 'Windsurf', 'User');
  }

  return {
    windsurfSettings,
    codeiumPath: path.join(home, '.codeium', 'windsurf'),
    memoriesPath: path.join(home, '.codeium', 'windsurf', 'memories')
  };
}

const paths = getPaths();

// ==============================================================================
// Helper Functions
// ==============================================================================
const success = (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`);
const error = (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`);
const warning = (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
const info = (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`);
const header = (msg) => console.log(`\n${colors.magenta}▶ ${msg}${colors.reset}`);

// ==============================================================================
// Test Functions
// ==============================================================================
const tests = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function testFileExists(filePath, description, required = true) {
  if (fs.existsSync(filePath)) {
    success(`${description} exists`);
    tests.passed++;
    return true;
  } else {
    if (required) {
      error(`${description} NOT FOUND: ${filePath}`);
      tests.failed++;
    } else {
      warning(`${description} not found (optional): ${filePath}`);
      tests.warnings++;
    }
    return false;
  }
}

function testJsonValid(filePath, description) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Normalize line endings
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Handle JSONC (strip comments properly)
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
        if (i < content.length) {
          result += content[i++];
        }
      } else if (content[i] === '/' && content[i + 1] === '/') {
        while (i < content.length && content[i] !== '\n') {
          i++;
        }
      } else if (content[i] === '/' && content[i + 1] === '*') {
        i += 2;
        while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
          i++;
        }
        i += 2;
      } else {
        result += content[i++];
      }
    }

    // Remove trailing commas
    result = result.replace(/,(\s*[}\]])/g, '$1');

    JSON.parse(result);
    success(`${description} is valid JSON`);
    tests.passed++;
    return true;
  } catch (e) {
    error(`${description} has invalid JSON: ${e.message}`);
    tests.failed++;
    return false;
  }
}

function testSettingsContent(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stripped = content
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/,(\s*[}\]])/g, '$1');

    const settings = JSON.parse(stripped);

    // Check for key settings
    const checks = [
      { key: 'windsurf.cascadeCommandsDenyList', name: 'Security deny list' },
      { key: 'files.watcherExclude', name: 'File watcher exclusions' },
      { key: 'search.exclude', name: 'Search exclusions' }
    ];

    for (const check of checks) {
      if (settings[check.key]) {
        success(`${check.name} configured`);
        tests.passed++;
      } else {
        warning(`${check.name} not configured`);
        tests.warnings++;
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}

function testMcpConfig(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(content);

    if (config.mcpServers) {
      const serverCount = Object.keys(config.mcpServers).length;
      success(`MCP config has ${serverCount} server(s) defined`);
      tests.passed++;

      // Check for common servers
      const commonServers = ['filesystem', 'git', 'memory', 'fetch'];
      for (const server of commonServers) {
        if (config.mcpServers[server]) {
          info(`  - ${server} server configured`);
        }
      }

      return true;
    } else {
      warning('MCP config has no servers defined');
      tests.warnings++;
      return false;
    }
  } catch (e) {
    return false;
  }
}

function testNodeModules() {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');

  if (fs.existsSync(nodeModulesPath)) {
    const packages = fs.readdirSync(nodeModulesPath).filter(f => !f.startsWith('.'));
    success(`node_modules exists (${packages.length} packages)`);
    tests.passed++;
    return true;
  } else {
    warning('node_modules not found - run npm install');
    tests.warnings++;
    return false;
  }
}

// ==============================================================================
// Main
// ==============================================================================
console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════════════════════════╗
║              WINDSURF VIBE SETUP - INSTALLATION VALIDATOR                    ║
╚══════════════════════════════════════════════════════════════════════════════╝${colors.reset}
`);

info(`Platform: ${process.platform}`);
info(`Home: ${os.homedir()}`);

// Test 1: Core settings
header('Testing Windsurf Settings');
const settingsPath = path.join(paths.windsurfSettings, 'settings.json');
if (testFileExists(settingsPath, 'settings.json')) {
  testJsonValid(settingsPath, 'settings.json');
  testSettingsContent(settingsPath);
}

// Test 2: Global rules
header('Testing AI Global Rules');
const rulesPath = path.join(paths.memoriesPath, 'global_rules.md');
testFileExists(rulesPath, 'global_rules.md', false);

// Test 3: MCP Configuration
header('Testing MCP Configuration');
const mcpPath = path.join(paths.codeiumPath, 'mcp_config.json');
if (testFileExists(mcpPath, 'mcp_config.json', false)) {
  testJsonValid(mcpPath, 'mcp_config.json');
  testMcpConfig(mcpPath);
}

// Test 4: Project files
header('Testing Project Files');
testFileExists(path.join(process.cwd(), 'package.json'), 'package.json');
testFileExists(path.join(process.cwd(), 'settings.json'), 'settings.json (source)');
testFileExists(path.join(process.cwd(), 'examples', 'global_rules.md'), 'examples/global_rules.md');
testFileExists(path.join(process.cwd(), 'examples', 'mcp_config.json'), 'examples/mcp_config.json');

// Test 5: Dependencies
header('Testing Dependencies');
testNodeModules();

// Summary
console.log(`
${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}
`);

console.log(`${colors.green}Passed:${colors.reset}   ${tests.passed}`);
console.log(`${colors.red}Failed:${colors.reset}   ${tests.failed}`);
console.log(`${colors.yellow}Warnings:${colors.reset} ${tests.warnings}`);
console.log('');

if (tests.failed === 0) {
  console.log(`${colors.green}✅ Installation validated successfully!${colors.reset}`);
  console.log(`\n${colors.cyan}Next: Restart Windsurf IDE to apply changes.${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Installation has issues. See errors above.${colors.reset}`);
  console.log(`\n${colors.cyan}Run the setup script to fix: npm run setup${colors.reset}\n`);
  process.exit(1);
}
