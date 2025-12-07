#!/usr/bin/env node
/**
 * Security Audit Logging System
 * Tracks and logs all security-related events and actions
 * Implements "Security audit logging" from SECURITY.md
 * 
 * FULLY AUTOMATED - No user prompts required
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Configuration
const CONFIG = {
  rootDir: path.join(__dirname, '..'),
  logDir: path.join(__dirname, '..', 'security-logs'),
  logFile: 'security-audit.log',
  maxLogSize: 10 * 1024 * 1024, // 10MB
  maxLogFiles: 5,
  jsonOutput: process.argv.includes('--json'),
  verbose: process.argv.includes('--verbose')
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
};

// Audit event types
const EVENT_TYPES = {
  FILE_ACCESS: 'FILE_ACCESS',
  CONFIG_CHANGE: 'CONFIG_CHANGE',
  SECRET_DETECTED: 'SECRET_DETECTED',
  VULNERABILITY_FOUND: 'VULNERABILITY_FOUND',
  PERMISSION_CHECK: 'PERMISSION_CHECK',
  SCRIPT_EXECUTION: 'SCRIPT_EXECUTION',
  DEPENDENCY_SCAN: 'DEPENDENCY_SCAN',
  GIT_OPERATION: 'GIT_OPERATION',
  SECURITY_SCAN: 'SECURITY_SCAN'
};

// Severity levels
const SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

/**
 * Ensure log directory exists
 */
function ensureLogDir() {
  if (!fs.existsSync(CONFIG.logDir)) {
    fs.mkdirSync(CONFIG.logDir, { recursive: true });
  }
}

/**
 * Rotate logs if necessary
 */
function rotateLogsIfNeeded() {
  const logPath = path.join(CONFIG.logDir, CONFIG.logFile);
  
  if (!fs.existsSync(logPath)) return;
  
  const stats = fs.statSync(logPath);
  if (stats.size < CONFIG.maxLogSize) return;
  
  // Rotate logs
  for (let i = CONFIG.maxLogFiles - 1; i >= 1; i--) {
    const oldPath = path.join(CONFIG.logDir, `${CONFIG.logFile}.${i}`);
    const newPath = path.join(CONFIG.logDir, `${CONFIG.logFile}.${i + 1}`);
    if (fs.existsSync(oldPath)) {
      if (i === CONFIG.maxLogFiles - 1) {
        fs.unlinkSync(oldPath);
      } else {
        fs.renameSync(oldPath, newPath);
      }
    }
  }
  
  fs.renameSync(logPath, path.join(CONFIG.logDir, `${CONFIG.logFile}.1`));
}

/**
 * Create audit log entry
 */
function createAuditEntry(eventType, severity, message, details = {}) {
  return {
    timestamp: new Date().toISOString(),
    eventId: crypto.randomUUID(),
    eventType,
    severity,
    message,
    details,
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      user: os.userInfo().username,
      cwd: process.cwd()
    }
  };
}

/**
 * Write audit entry to log file
 */
function writeAuditLog(entry) {
  ensureLogDir();
  rotateLogsIfNeeded();
  
  const logPath = path.join(CONFIG.logDir, CONFIG.logFile);
  const logLine = JSON.stringify(entry) + '\n';
  
  fs.appendFileSync(logPath, logLine);
}

/**
 * Check sensitive file permissions
 */
function auditFilePermissions() {
  const events = [];
  const sensitivePatterns = [
    { pattern: '.env', description: 'Environment configuration' },
    { pattern: '.env.*', description: 'Environment configuration' },
    { pattern: '*.pem', description: 'Certificate/Key file' },
    { pattern: '*.key', description: 'Private key file' },
    { pattern: 'secrets/*', description: 'Secrets directory' },
    { pattern: 'credentials*', description: 'Credentials file' }
  ];

  const files = findSensitiveFiles(CONFIG.rootDir, sensitivePatterns);
  
  for (const file of files) {
    try {
      const stats = fs.statSync(file.path);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);
      
      // Check if file is world-readable
      if (stats.mode & parseInt('004', 8)) {
        events.push(createAuditEntry(
          EVENT_TYPES.PERMISSION_CHECK,
          SEVERITY.WARNING,
          `Sensitive file is world-readable: ${file.relativePath}`,
          { file: file.relativePath, mode, description: file.description }
        ));
      } else {
        events.push(createAuditEntry(
          EVENT_TYPES.PERMISSION_CHECK,
          SEVERITY.INFO,
          `File permissions OK: ${file.relativePath}`,
          { file: file.relativePath, mode }
        ));
      }
    } catch (error) {
      // File might not exist, skip
    }
  }

  return events;
}

/**
 * Find sensitive files matching patterns
 */
function findSensitiveFiles(dir, patterns, files = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(CONFIG.rootDir, fullPath);
      
      if (entry.isDirectory()) {
        findSensitiveFiles(fullPath, patterns, files);
      } else {
        for (const p of patterns) {
          if (matchPattern(entry.name, p.pattern) || matchPattern(relativePath, p.pattern)) {
            files.push({ path: fullPath, relativePath, description: p.description });
            break;
          }
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return files;
}

/**
 * Simple pattern matching
 */
function matchPattern(str, pattern) {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  return regex.test(str);
}

/**
 * Audit Git configuration
 */
function auditGitConfig() {
  const events = [];
  
  // Check .gitignore for sensitive patterns
  const gitignorePath = path.join(CONFIG.rootDir, '.gitignore');
  const requiredPatterns = ['.env', '*.pem', '*.key', 'secrets/', 'credentials'];
  
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const missingPatterns = [];
    
    for (const pattern of requiredPatterns) {
      if (!content.includes(pattern)) {
        missingPatterns.push(pattern);
      }
    }
    
    if (missingPatterns.length > 0) {
      events.push(createAuditEntry(
        EVENT_TYPES.GIT_OPERATION,
        SEVERITY.WARNING,
        'Missing sensitive patterns in .gitignore',
        { missingPatterns }
      ));
    } else {
      events.push(createAuditEntry(
        EVENT_TYPES.GIT_OPERATION,
        SEVERITY.INFO,
        '.gitignore contains all recommended sensitive patterns',
        { patterns: requiredPatterns }
      ));
    }
  } else {
    events.push(createAuditEntry(
      EVENT_TYPES.GIT_OPERATION,
      SEVERITY.ERROR,
      'No .gitignore file found',
      {}
    ));
  }

  return events;
}

/**
 * Audit package.json for security scripts
 */
function auditPackageJson() {
  const events = [];
  const packagePath = path.join(CONFIG.rootDir, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    events.push(createAuditEntry(
      EVENT_TYPES.CONFIG_CHANGE,
      SEVERITY.INFO,
      'No package.json found',
      {}
    ));
    return events;
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const scripts = pkg.scripts || {};
  
  const securityScripts = {
    'scan:secrets': 'Secret scanning',
    'scan:deps': 'Dependency vulnerability scanning',
    'security': 'Combined security scan'
  };

  for (const [script, description] of Object.entries(securityScripts)) {
    if (scripts[script]) {
      events.push(createAuditEntry(
        EVENT_TYPES.SECURITY_SCAN,
        SEVERITY.INFO,
        `Security script configured: ${script}`,
        { script, description, command: scripts[script] }
      ));
    } else {
      events.push(createAuditEntry(
        EVENT_TYPES.SECURITY_SCAN,
        SEVERITY.WARNING,
        `Missing security script: ${script}`,
        { script, description }
      ));
    }
  }

  return events;
}

/**
 * Audit for hardcoded secrets in common config files
 */
function auditConfigFiles() {
  const events = [];
  const configFiles = [
    'package.json',
    'docker-compose.yml',
    'docker-compose.yaml',
    '.github/workflows/*.yml'
  ];

  const secretPatterns = [
    { pattern: /password\s*[:=]\s*["'][^"'$]{8,}["']/gi, name: 'Hardcoded password' },
    { pattern: /api[_-]?key\s*[:=]\s*["'][^"'$]{16,}["']/gi, name: 'Hardcoded API key' },
    { pattern: /secret\s*[:=]\s*["'][^"'$]{16,}["']/gi, name: 'Hardcoded secret' }
  ];

  // Find and check config files
  for (const configPattern of configFiles) {
    const files = findConfigFiles(CONFIG.rootDir, configPattern);
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(CONFIG.rootDir, filePath);
        
        for (const sp of secretPatterns) {
          const matches = content.match(sp.pattern);
          if (matches) {
            // Check if it's a placeholder
            const isPlaceholder = matches.every(m => 
              /\${|\$\(|placeholder|example|your[_-]?|xxx/i.test(m)
            );
            
            if (!isPlaceholder) {
              events.push(createAuditEntry(
                EVENT_TYPES.SECRET_DETECTED,
                SEVERITY.CRITICAL,
                `${sp.name} detected in ${relativePath}`,
                { file: relativePath, matchCount: matches.length }
              ));
            }
          }
        }
      } catch (error) {
        // Skip files we can't read
      }
    }
  }

  if (events.length === 0) {
    events.push(createAuditEntry(
      EVENT_TYPES.CONFIG_CHANGE,
      SEVERITY.INFO,
      'No hardcoded secrets found in config files',
      {}
    ));
  }

  return events;
}

/**
 * Find config files matching pattern
 */
function findConfigFiles(dir, pattern, files = []) {
  const parts = pattern.split('/');
  const fileName = parts.pop();
  const subDir = parts.length > 0 ? path.join(dir, ...parts) : dir;

  if (!fs.existsSync(subDir)) return files;

  try {
    const entries = fs.readdirSync(subDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && matchPattern(entry.name, fileName)) {
        files.push(path.join(subDir, entry.name));
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return files;
}

/**
 * Generate audit summary
 */
function generateSummary(allEvents) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalEvents: allEvents.length,
    bySeverity: {
      [SEVERITY.CRITICAL]: 0,
      [SEVERITY.ERROR]: 0,
      [SEVERITY.WARNING]: 0,
      [SEVERITY.INFO]: 0
    },
    byType: {}
  };

  for (const event of allEvents) {
    summary.bySeverity[event.severity]++;
    summary.byType[event.eventType] = (summary.byType[event.eventType] || 0) + 1;
  }

  return summary;
}

/**
 * Format severity with color
 */
function formatSeverity(severity) {
  switch (severity) {
    case SEVERITY.CRITICAL:
      return `${colors.red}${colors.bold}CRITICAL${colors.reset}`;
    case SEVERITY.ERROR:
      return `${colors.red}ERROR${colors.reset}`;
    case SEVERITY.WARNING:
      return `${colors.yellow}WARNING${colors.reset}`;
    case SEVERITY.INFO:
      return `${colors.cyan}INFO${colors.reset}`;
    default:
      return severity;
  }
}

/**
 * Main execution - FULLY AUTOMATED
 */
function main() {
  console.log(`${colors.bold}Security Audit Logger${colors.reset}`);
  console.log('='.repeat(50));
  console.log(`Auditing: ${CONFIG.rootDir}`);
  console.log('');

  const allEvents = [];

  // Run all audits
  console.log(`${colors.cyan}[1/4]${colors.reset} Checking file permissions...`);
  allEvents.push(...auditFilePermissions());

  console.log(`${colors.cyan}[2/4]${colors.reset} Auditing Git configuration...`);
  allEvents.push(...auditGitConfig());

  console.log(`${colors.cyan}[3/4]${colors.reset} Checking security scripts...`);
  allEvents.push(...auditPackageJson());

  console.log(`${colors.cyan}[4/4]${colors.reset} Scanning config files...`);
  allEvents.push(...auditConfigFiles());

  console.log('');

  // Write all events to log
  for (const event of allEvents) {
    writeAuditLog(event);
  }

  // Generate and display summary
  const summary = generateSummary(allEvents);

  if (CONFIG.jsonOutput) {
    console.log(JSON.stringify({ summary, events: allEvents }, null, 2));
  } else {
    console.log(`${colors.bold}Audit Summary${colors.reset}`);
    console.log('-'.repeat(50));
    console.log(`Total Events: ${summary.totalEvents}`);
    console.log(`  ${formatSeverity(SEVERITY.CRITICAL)}: ${summary.bySeverity[SEVERITY.CRITICAL]}`);
    console.log(`  ${formatSeverity(SEVERITY.ERROR)}: ${summary.bySeverity[SEVERITY.ERROR]}`);
    console.log(`  ${formatSeverity(SEVERITY.WARNING)}: ${summary.bySeverity[SEVERITY.WARNING]}`);
    console.log(`  ${formatSeverity(SEVERITY.INFO)}: ${summary.bySeverity[SEVERITY.INFO]}`);
    console.log('');

    // Show warnings and above
    const important = allEvents.filter(e => 
      e.severity === SEVERITY.CRITICAL || 
      e.severity === SEVERITY.ERROR || 
      e.severity === SEVERITY.WARNING
    );

    if (important.length > 0) {
      console.log(`${colors.bold}Attention Required:${colors.reset}`);
      for (const event of important) {
        console.log(`  ${formatSeverity(event.severity)} ${event.message}`);
      }
      console.log('');
    }

    console.log(`${colors.gray}Log file: ${path.join(CONFIG.logDir, CONFIG.logFile)}${colors.reset}`);
    console.log('');

    if (summary.bySeverity[SEVERITY.CRITICAL] > 0) {
      console.log(`${colors.red}${colors.bold}⚠ Critical issues found - immediate action required${colors.reset}`);
      process.exit(1);
    } else if (summary.bySeverity[SEVERITY.ERROR] > 0) {
      console.log(`${colors.red}Errors found - review recommended${colors.reset}`);
      process.exit(1);
    } else if (summary.bySeverity[SEVERITY.WARNING] > 0) {
      console.log(`${colors.yellow}Warnings found - consider addressing${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.green}${colors.bold}✓ Security audit passed${colors.reset}`);
      process.exit(0);
    }
  }
}

main();
