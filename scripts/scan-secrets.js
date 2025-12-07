#!/usr/bin/env node
/**
 * Secret Scanning Script
 * Detects potential secrets, API keys, and sensitive data in the codebase
 * Implements the "Automated secret scanning" feature from SECURITY.md
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  rootDir: path.join(__dirname, '..'),
  excludeDirs: [
    'node_modules', '.git', '.venv', 'venv', '__pycache__',
    'benchmark-results', 'dist', 'build', 'obj', 'bin'
  ],
  excludeFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
  extensions: ['.js', '.ts', '.py', '.ps1', '.json', '.yml', '.yaml', '.env', '.md', '.sh', '.bat', '.cmd'],
  maxFileSize: 5 * 1024 * 1024 // 5MB
};

// Secret patterns to detect
const SECRET_PATTERNS = [
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical'
  },
  {
    name: 'AWS Secret Key',
    pattern: /[A-Za-z0-9/+=]{40}/g,
    context: /aws|secret|access/i,
    severity: 'high'
  },
  {
    name: 'GitHub Token',
    pattern: /ghp_[A-Za-z0-9]{36}/g,
    severity: 'critical'
  },
  {
    name: 'GitHub OAuth',
    pattern: /gho_[A-Za-z0-9]{36}/g,
    severity: 'critical'
  },
  {
    name: 'GitHub Personal Access Token (Classic)',
    pattern: /github_pat_[A-Za-z0-9_]{22,}/g,
    severity: 'critical'
  },
  {
    name: 'OpenAI API Key',
    pattern: /sk-[A-Za-z0-9]{48}/g,
    severity: 'critical'
  },
  {
    name: 'Anthropic API Key',
    pattern: /sk-ant-[A-Za-z0-9-_]{90,}/g,
    severity: 'critical'
  },
  {
    name: 'Slack Token',
    pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*/g,
    severity: 'critical'
  },
  {
    name: 'Stripe Secret Key',
    pattern: /sk_live_[A-Za-z0-9]{24,}/g,
    severity: 'critical'
  },
  {
    name: 'Stripe Publishable Key',
    pattern: /pk_live_[A-Za-z0-9]{24,}/g,
    severity: 'medium'
  },
  {
    name: 'Private Key Header',
    pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'critical'
  },
  {
    name: 'Generic API Key',
    pattern: /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]{20,}['"]/gi,
    severity: 'high'
  },
  {
    name: 'Generic Secret',
    pattern: /secret\s*[:=]\s*['"][A-Za-z0-9]{16,}['"]/gi,
    severity: 'high'
  },
  {
    name: 'Password in URL',
    pattern: /:\/\/[^:]+:[^@]+@/g,
    severity: 'high'
  },
  {
    name: 'Hardcoded Password',
    pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    severity: 'high'
  },
  {
    name: 'Bearer Token',
    pattern: /bearer\s+[A-Za-z0-9._-]{20,}/gi,
    severity: 'high'
  },
  {
    name: 'Base64 Encoded Credentials',
    pattern: /basic\s+[A-Za-z0-9+/=]{20,}/gi,
    severity: 'medium'
  },
  {
    name: 'Connection String',
    pattern: /(mongodb|postgresql|mysql|redis):\/\/[^'"\s]+/gi,
    severity: 'high'
  },
  {
    name: 'Discord Token',
    pattern: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/g,
    severity: 'critical'
  },
  {
    name: 'Telegram Bot Token',
    pattern: /\d{9,10}:[A-Za-z0-9_-]{35}/g,
    severity: 'critical'
  }
];

// False positive patterns to ignore
const FALSE_POSITIVES = [
  /\${[A-Z_]+}/,           // Environment variable placeholders
  /process\.env\./,         // Environment variable access
  /\$env:/i,               // PowerShell env vars
  /example|sample|test|placeholder|your[_-]?/i,
  /xxx+|yyy+|zzz+/i,       // Placeholder values
  /1234567890/,            // Example numbers
  /<[^>]+>/               // Placeholder tags
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Find all files to scan
 */
function findFiles(dir, files = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!CONFIG.excludeDirs.includes(entry.name)) {
          findFiles(fullPath, files);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();

        if (CONFIG.extensions.includes(ext) &&
            !CONFIG.excludeFiles.includes(entry.name)) {
          try {
            const stats = fs.statSync(fullPath);
            if (stats.size <= CONFIG.maxFileSize) {
              files.push(fullPath);
            }
          } catch (e) {
            // Skip files we can't stat
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
  }

  return files;
}

/**
 * Check if a match is a false positive
 */
function isFalsePositive(match, lineContent) {
  for (const fp of FALSE_POSITIVES) {
    if (fp.test(match) || fp.test(lineContent)) {
      return true;
    }
  }
  return false;
}

/**
 * Scan a file for secrets
 */
function scanFile(filePath) {
  const findings = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (const secretPattern of SECRET_PATTERNS) {
      let match;
      const regex = new RegExp(secretPattern.pattern.source, secretPattern.pattern.flags);

      while ((match = regex.exec(content)) !== null) {
        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const lineContent = lines[lineNumber - 1] || '';

        // Check for false positives
        if (isFalsePositive(match[0], lineContent)) {
          continue;
        }

        // Check context requirement
        if (secretPattern.context && !secretPattern.context.test(lineContent)) {
          continue;
        }

        findings.push({
          type: secretPattern.name,
          severity: secretPattern.severity,
          file: filePath,
          line: lineNumber,
          match: match[0].substring(0, 20) + '...',
          lineContent: lineContent.trim().substring(0, 80)
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning ${filePath}: ${error.message}`);
  }

  return findings;
}

/**
 * Format severity with color
 */
function formatSeverity(severity) {
  switch (severity) {
    case 'critical':
      return `${colors.red}${colors.bold}CRITICAL${colors.reset}`;
    case 'high':
      return `${colors.red}HIGH${colors.reset}`;
    case 'medium':
      return `${colors.yellow}MEDIUM${colors.reset}`;
    case 'low':
      return `${colors.cyan}LOW${colors.reset}`;
    default:
      return severity;
  }
}

/**
 * Generate report
 */
function generateReport(findings, outputPath) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length
    },
    findings: findings.map(f => ({
      ...f,
      file: path.relative(CONFIG.rootDir, f.file)
    }))
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  return report;
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.bold}Secret Scanning Tool${colors.reset}`);
  console.log('='.repeat(50));
  console.log(`Scanning: ${CONFIG.rootDir}`);
  console.log('');

  // Find all files
  const files = findFiles(CONFIG.rootDir);
  console.log(`Found ${files.length} files to scan`);
  console.log('');

  // Scan files
  const allFindings = [];
  let scannedCount = 0;

  for (const file of files) {
    const findings = scanFile(file);
    allFindings.push(...findings);
    scannedCount++;

    // Progress indicator
    if (scannedCount % 50 === 0) {
      process.stdout.write(`Scanned ${scannedCount}/${files.length} files\r`);
    }
  }

  console.log(`Scanned ${scannedCount} files                    `);
  console.log('');

  // Display findings
  if (allFindings.length > 0) {
    console.log(`${colors.red}${colors.bold}⚠ Found ${allFindings.length} potential secret(s)${colors.reset}`);
    console.log('');

    for (const finding of allFindings) {
      const relativePath = path.relative(CONFIG.rootDir, finding.file);
      console.log(`${formatSeverity(finding.severity)} ${finding.type}`);
      console.log(`  ${colors.gray}File: ${relativePath}:${finding.line}${colors.reset}`);
      console.log(`  ${colors.gray}Match: ${finding.match}${colors.reset}`);
      console.log('');
    }

    // Generate report
    const reportPath = path.join(CONFIG.rootDir, 'secret-scan-report.json');
    generateReport(allFindings, reportPath);
    console.log(`Report saved to: ${reportPath}`);
    console.log('');

    // Exit with error code
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}✓ No secrets detected${colors.reset}`);
    process.exit(0);
  }
}

main();
