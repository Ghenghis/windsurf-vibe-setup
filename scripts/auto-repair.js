#!/usr/bin/env node
/**
 * Auto-Repair Script for Common Coding Issues
 * Identifies and fixes common coding issues without disrupting functionality
 * Implements "Automated repair scripts" from Global Rules
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  rootDir: path.join(__dirname, '..'),
  excludeDirs: [
    'node_modules', '.git', '.venv', 'venv', '__pycache__',
    'dist', 'build', 'benchmark-results', 'security-reports'
  ],
  dryRun: process.argv.includes('--dry-run'),
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
  gray: '\x1b[90m'
};

// Statistics tracking
const stats = {
  filesScanned: 0,
  issuesFound: 0,
  issuesFixed: 0,
  errors: 0
};

/**
 * Repair rules for different file types
 */
const REPAIR_RULES = {
  // JavaScript/TypeScript repairs
  js: [
    {
      name: 'Remove console.log in production files',
      pattern: /^\s*console\.log\([^)]*\);?\s*$/gm,
      replacement: '',
      severity: 'low',
      skipIf: /test|spec|debug/i,
      autoFix: false // Requires confirmation
    },
    // Note: Semicolon insertion disabled - requires AST parsing for accuracy
    // Use ESLint with --fix for proper semicolon handling
    {
      name: 'Convert var to const/let',
      pattern: /\bvar\s+(\w+)\s*=/g,
      replacement: 'const $1 =',
      severity: 'medium',
      autoFix: true
    },
    {
      name: 'Fix trailing whitespace',
      pattern: /[ \t]+$/gm,
      replacement: '',
      severity: 'low',
      autoFix: true
    },
    {
      name: 'Fix multiple blank lines',
      pattern: /\n{3,}/g,
      replacement: '\n\n',
      severity: 'low',
      autoFix: true
    },
    {
      name: 'Add missing newline at end of file',
      pattern: /([^\n])$/,
      replacement: '$1\n',
      severity: 'low',
      autoFix: true
    }
  ],

  // Python repairs
  py: [
    {
      name: 'Fix trailing whitespace',
      pattern: /[ \t]+$/gm,
      replacement: '',
      severity: 'low',
      autoFix: true
    },
    {
      name: 'Fix multiple blank lines (max 2)',
      pattern: /\n{4,}/g,
      replacement: '\n\n\n',
      severity: 'low',
      autoFix: true
    },
    {
      name: 'Add missing newline at end of file',
      pattern: /([^\n])$/,
      replacement: '$1\n',
      severity: 'low',
      autoFix: true
    },
    {
      name: 'Fix tabs to spaces',
      pattern: /\t/g,
      replacement: '    ',
      severity: 'low',
      autoFix: true
    },
    {
      name: 'Remove print statements (debugging)',
      pattern: /^\s*print\s*\([^)]*\)\s*$/gm,
      replacement: '',
      severity: 'low',
      skipIf: /test|debug|example/i,
      autoFix: false // Requires confirmation
    }
  ],

  // PowerShell repairs
  ps1: [
    {
      name: 'Fix trailing whitespace',
      pattern: /[ \t]+$/gm,
      replacement: '',
      severity: 'low',
      autoFix: true
    },
    {
      name: 'Add missing newline at end of file',
      pattern: /([^\n])$/,
      replacement: '$1\n',
      severity: 'low',
      autoFix: true
    }
  ],

  // JSON repairs
  json: [
    {
      name: 'Fix trailing commas',
      pattern: /,(\s*[}\]])/g,
      replacement: '$1',
      severity: 'medium',
      autoFix: true
    }
  ],

  // Markdown repairs
  md: [
    {
      name: 'Fix trailing whitespace',
      pattern: /[ \t]+$/gm,
      replacement: '',
      severity: 'low',
      autoFix: true
    },
    {
      name: 'Fix multiple blank lines',
      pattern: /\n{3,}/g,
      replacement: '\n\n',
      severity: 'low',
      autoFix: true
    },
    {
      name: 'Add missing newline at end of file',
      pattern: /([^\n])$/,
      replacement: '$1\n',
      severity: 'low',
      autoFix: true
    }
  ]
};

/**
 * Find all files to process
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
        const ext = path.extname(entry.name).toLowerCase().slice(1);
        if (REPAIR_RULES[ext]) {
          files.push({ path: fullPath, ext });
        }
      }
    }
  } catch (error) {
    if (CONFIG.verbose) {
      console.error(`Error reading directory ${dir}: ${error.message}`);
    }
  }

  return files;
}

/**
 * Repair a single file
 */
function repairFile(file) {
  const { path: filePath, ext } = file;
  const rules = REPAIR_RULES[ext] || [];
  const relativePath = path.relative(CONFIG.rootDir, filePath);

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    stats.errors++;
    return [];
  }

  stats.filesScanned++;

  const issues = [];
  let modifiedContent = content;
  let hasChanges = false;

  for (const rule of rules) {
    // Check skip condition
    if (rule.skipIf && rule.skipIf.test(filePath)) {
      continue;
    }

    // Find matches
    const matches = content.match(rule.pattern);
    if (matches && matches.length > 0) {
      const issueCount = matches.length;
      stats.issuesFound += issueCount;

      issues.push({
        file: relativePath,
        rule: rule.name,
        severity: rule.severity,
        count: issueCount,
        autoFix: rule.autoFix
      });

      // Apply fix if autoFix is enabled
      if (rule.autoFix && !CONFIG.dryRun) {
        modifiedContent = modifiedContent.replace(rule.pattern, rule.replacement);
        hasChanges = true;
        stats.issuesFixed += issueCount;
      }
    }
  }

  // Write changes back
  if (hasChanges && modifiedContent !== content) {
    try {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
    } catch (error) {
      stats.errors++;
      console.error(`${colors.red}Error writing ${relativePath}: ${error.message}${colors.reset}`);
    }
  }

  return issues;
}

/**
 * Format severity with color
 */
function formatSeverity(severity) {
  switch (severity) {
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
 * Main execution
 */
function main() {
  console.log(`${colors.bold}Auto-Repair Script${colors.reset}`);
  console.log('='.repeat(50));
  console.log(`Scanning: ${CONFIG.rootDir}`);
  if (CONFIG.dryRun) {
    console.log(`${colors.yellow}DRY RUN MODE - No changes will be made${colors.reset}`);
  }
  console.log('');

  // Find all files
  const files = findFiles(CONFIG.rootDir);
  console.log(`Found ${files.length} files to analyze`);
  console.log('');

  // Process files
  const allIssues = [];
  for (const file of files) {
    const issues = repairFile(file);
    allIssues.push(...issues);
  }

  // Display results grouped by file
  if (allIssues.length > 0) {
    console.log(`${colors.bold}Issues Found:${colors.reset}`);
    console.log('');

    // Group by file
    const byFile = {};
    for (const issue of allIssues) {
      if (!byFile[issue.file]) {
        byFile[issue.file] = [];
      }
      byFile[issue.file].push(issue);
    }

    for (const [file, issues] of Object.entries(byFile)) {
      console.log(`${colors.cyan}${file}${colors.reset}`);
      for (const issue of issues) {
        const fixStatus = issue.autoFix
          ? (CONFIG.dryRun ? `${colors.yellow}[would fix]${colors.reset}` : `${colors.green}[fixed]${colors.reset}`)
          : `${colors.gray}[manual]${colors.reset}`;
        console.log(`  ${formatSeverity(issue.severity)} ${issue.rule} (${issue.count}x) ${fixStatus}`);
      }
      console.log('');
    }
  }

  // Summary
  console.log('='.repeat(50));
  console.log(`${colors.bold}Summary${colors.reset}`);
  console.log(`  Files scanned: ${stats.filesScanned}`);
  console.log(`  Issues found: ${stats.issuesFound}`);
  console.log(`  Issues fixed: ${CONFIG.dryRun ? 0 : stats.issuesFixed}`);
  console.log(`  Errors: ${stats.errors}`);
  console.log('');

  if (stats.issuesFound === 0) {
    console.log(`${colors.green}${colors.bold}✓ No issues found${colors.reset}`);
  } else if (stats.issuesFixed > 0) {
    console.log(`${colors.green}${colors.bold}✓ Fixed ${stats.issuesFixed} issues${colors.reset}`);
  } else if (CONFIG.dryRun) {
    console.log(`${colors.yellow}Run without --dry-run to apply fixes${colors.reset}`);
  }

  // Suggest running linters
  console.log('');
  console.log(`${colors.gray}Tip: Run 'npm run lint:fix' for additional formatting${colors.reset}`);
}

main();
