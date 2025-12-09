#!/usr/bin/env node
/**
 * Code Metrics Collection Script
 * Collects and reports code quality metrics across the project
 * Implements "Code quality metrics" from Global Rules
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  rootDir: path.join(__dirname, '..'),
  excludeDirs: [
    'node_modules',
    '.git',
    '.venv',
    'venv',
    '__pycache__',
    'dist',
    'build',
    'benchmark-results',
    'security-reports',
  ],
  outputDir: path.join(__dirname, '..', 'metrics-reports'),
  extensions: {
    js: 'JavaScript',
    ts: 'TypeScript',
    jsx: 'React JSX',
    tsx: 'React TSX',
    py: 'Python',
    ps1: 'PowerShell',
    json: 'JSON',
    md: 'Markdown',
    yml: 'YAML',
    yaml: 'YAML',
  },
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
  magenta: '\x1b[35m',
};

/**
 * Calculate metrics for a single file
 */
function analyzeFile(filePath, ext) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const metrics = {
    path: filePath,
    extension: ext,
    bytes: Buffer.byteLength(content, 'utf8'),
    totalLines: lines.length,
    codeLines: 0,
    blankLines: 0,
    commentLines: 0,
    complexity: 0,
    todos: 0,
    functions: 0,
    classes: 0,
    imports: 0,
    maxLineLength: 0,
  };

  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    metrics.maxLineLength = Math.max(metrics.maxLineLength, line.length);

    // Blank lines
    if (trimmed === '') {
      metrics.blankLines++;
      continue;
    }

    // Block comments
    if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') {
      if (trimmed.startsWith('/*')) {
        inBlockComment = true;
      }
      if (inBlockComment) {
        metrics.commentLines++;
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }
      if (trimmed.startsWith('//')) {
        metrics.commentLines++;
        continue;
      }
    } else if (ext === 'py') {
      if (trimmed.startsWith('#')) {
        metrics.commentLines++;
        continue;
      }
      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        inBlockComment = !inBlockComment;
        metrics.commentLines++;
        continue;
      }
      if (inBlockComment) {
        metrics.commentLines++;
        continue;
      }
    } else if (ext === 'ps1') {
      if (
        trimmed.startsWith('#') &&
        !trimmed.startsWith('#region') &&
        !trimmed.startsWith('#endregion')
      ) {
        metrics.commentLines++;
        continue;
      }
      if (trimmed.startsWith('<#')) {
        inBlockComment = true;
      }
      if (inBlockComment) {
        metrics.commentLines++;
        if (trimmed.includes('#>')) {
          inBlockComment = false;
        }
        continue;
      }
    }

    // Code lines
    metrics.codeLines++;

    // Count TODOs, FIXMEs
    if (/\b(TODO|FIXME|BUG|HACK|XXX)\b/i.test(line)) {
      metrics.todos++;
    }

    // Count complexity indicators (branches)
    if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') {
      if (/\b(if|else|for|while|switch|case|catch|\?|&&|\|\|)\b/.test(line)) {
        metrics.complexity++;
      }
      if (/\b(function|=>)\b/.test(line)) {
        metrics.functions++;
      }
      if (/\bclass\s+\w+/.test(line)) {
        metrics.classes++;
      }
      if (/\b(import|require)\b/.test(line)) {
        metrics.imports++;
      }
    } else if (ext === 'py') {
      if (/\b(if|elif|else|for|while|try|except|and|or)\b/.test(line)) {
        metrics.complexity++;
      }
      if (/^\s*def\s+\w+/.test(line)) {
        metrics.functions++;
      }
      if (/^\s*class\s+\w+/.test(line)) {
        metrics.classes++;
      }
      if (/^(import|from)\s+/.test(line)) {
        metrics.imports++;
      }
    } else if (ext === 'ps1') {
      if (/\b(if|elseif|else|foreach|for|while|switch|try|catch)\b/i.test(line)) {
        metrics.complexity++;
      }
      if (/^\s*function\s+\w+/i.test(line)) {
        metrics.functions++;
      }
    }
  }

  return metrics;
}

/**
 * Find all files to analyze
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
        if (CONFIG.extensions[ext]) {
          files.push({ path: fullPath, ext });
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return files;
}

/**
 * Aggregate metrics by extension
 */
function aggregateMetrics(fileMetrics) {
  const byExt = {};
  const totals = {
    files: 0,
    bytes: 0,
    totalLines: 0,
    codeLines: 0,
    blankLines: 0,
    commentLines: 0,
    complexity: 0,
    todos: 0,
    functions: 0,
    classes: 0,
    imports: 0,
  };

  for (const metrics of fileMetrics) {
    const ext = metrics.extension;
    if (!byExt[ext]) {
      byExt[ext] = {
        language: CONFIG.extensions[ext],
        files: 0,
        bytes: 0,
        totalLines: 0,
        codeLines: 0,
        blankLines: 0,
        commentLines: 0,
        complexity: 0,
        todos: 0,
        functions: 0,
        classes: 0,
        imports: 0,
        avgLineLength: 0,
        maxLineLength: 0,
      };
    }

    byExt[ext].files++;
    byExt[ext].bytes += metrics.bytes;
    byExt[ext].totalLines += metrics.totalLines;
    byExt[ext].codeLines += metrics.codeLines;
    byExt[ext].blankLines += metrics.blankLines;
    byExt[ext].commentLines += metrics.commentLines;
    byExt[ext].complexity += metrics.complexity;
    byExt[ext].todos += metrics.todos;
    byExt[ext].functions += metrics.functions;
    byExt[ext].classes += metrics.classes;
    byExt[ext].imports += metrics.imports;
    byExt[ext].maxLineLength = Math.max(byExt[ext].maxLineLength, metrics.maxLineLength);

    totals.files++;
    totals.bytes += metrics.bytes;
    totals.totalLines += metrics.totalLines;
    totals.codeLines += metrics.codeLines;
    totals.blankLines += metrics.blankLines;
    totals.commentLines += metrics.commentLines;
    totals.complexity += metrics.complexity;
    totals.todos += metrics.todos;
    totals.functions += metrics.functions;
    totals.classes += metrics.classes;
    totals.imports += metrics.imports;
  }

  return { byExtension: byExt, totals };
}

/**
 * Generate report
 */
function generateReport(aggregated, fileMetrics) {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: aggregated.totals,
    byLanguage: aggregated.byExtension,
    largestFiles: fileMetrics
      .sort((a, b) => b.codeLines - a.codeLines)
      .slice(0, 10)
      .map(f => ({
        path: path.relative(CONFIG.rootDir, f.path),
        codeLines: f.codeLines,
        complexity: f.complexity,
      })),
    mostComplex: fileMetrics
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10)
      .map(f => ({
        path: path.relative(CONFIG.rootDir, f.path),
        complexity: f.complexity,
        codeLines: f.codeLines,
      })),
    todoHotspots: fileMetrics
      .filter(f => f.todos > 0)
      .sort((a, b) => b.todos - a.todos)
      .slice(0, 10)
      .map(f => ({
        path: path.relative(CONFIG.rootDir, f.path),
        todos: f.todos,
      })),
  };

  const reportPath = path.join(CONFIG.outputDir, `metrics-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return reportPath;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes < 1024) {
    return bytes + ' B';
  }
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.bold}Code Metrics Collection${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Scanning: ${CONFIG.rootDir}`);
  console.log('');

  // Find and analyze files
  const files = findFiles(CONFIG.rootDir);
  console.log(`Analyzing ${files.length} files...`);
  console.log('');

  const fileMetrics = [];
  for (const file of files) {
    try {
      const metrics = analyzeFile(file.path, file.ext);
      fileMetrics.push(metrics);
    } catch (error) {
      // Skip files we can't read
    }
  }

  // Aggregate results
  const aggregated = aggregateMetrics(fileMetrics);

  // Display by language
  console.log(`${colors.bold}Metrics by Language:${colors.reset}`);
  console.log('-'.repeat(60));
  console.log(
    `${'Language'.padEnd(15)} ${'Files'.padStart(6)} ${'Code'.padStart(8)} ${'Comments'.padStart(8)} ${'Complexity'.padStart(10)}`
  );
  console.log('-'.repeat(60));

  for (const [, data] of Object.entries(aggregated.byExtension).sort(
    (a, b) => b[1].codeLines - a[1].codeLines
  )) {
    console.log(
      `${colors.cyan}${data.language.padEnd(15)}${colors.reset}` +
        `${data.files.toString().padStart(6)} ` +
        `${data.codeLines.toString().padStart(8)} ` +
        `${data.commentLines.toString().padStart(8)} ` +
        `${data.complexity.toString().padStart(10)}`
    );
  }
  console.log('-'.repeat(60));

  // Display totals
  console.log('');
  console.log(`${colors.bold}Project Totals:${colors.reset}`);
  console.log(`  ${colors.cyan}Files:${colors.reset} ${aggregated.totals.files}`);
  console.log(`  ${colors.cyan}Size:${colors.reset} ${formatBytes(aggregated.totals.bytes)}`);
  console.log(
    `  ${colors.cyan}Total Lines:${colors.reset} ${aggregated.totals.totalLines.toLocaleString()}`
  );
  console.log(
    `  ${colors.cyan}Code Lines:${colors.reset} ${aggregated.totals.codeLines.toLocaleString()}`
  );
  console.log(
    `  ${colors.cyan}Comment Lines:${colors.reset} ${aggregated.totals.commentLines.toLocaleString()}`
  );
  console.log(
    `  ${colors.cyan}Blank Lines:${colors.reset} ${aggregated.totals.blankLines.toLocaleString()}`
  );
  console.log('');
  console.log(`  ${colors.cyan}Functions:${colors.reset} ${aggregated.totals.functions}`);
  console.log(`  ${colors.cyan}Classes:${colors.reset} ${aggregated.totals.classes}`);
  console.log(`  ${colors.cyan}Imports:${colors.reset} ${aggregated.totals.imports}`);
  console.log(`  ${colors.cyan}Complexity Score:${colors.reset} ${aggregated.totals.complexity}`);
  console.log(`  ${colors.cyan}TODOs/FIXMEs:${colors.reset} ${aggregated.totals.todos}`);
  console.log('');

  // Code quality indicators
  const commentRatio = (
    (aggregated.totals.commentLines / Math.max(aggregated.totals.codeLines, 1)) *
    100
  ).toFixed(1);
  const avgComplexity = (
    aggregated.totals.complexity / Math.max(aggregated.totals.files, 1)
  ).toFixed(1);

  console.log(`${colors.bold}Quality Indicators:${colors.reset}`);
  console.log(
    `  ${colors.cyan}Comment Ratio:${colors.reset} ${commentRatio}%` +
      (parseFloat(commentRatio) < 10
        ? ` ${colors.yellow}(consider adding more comments)${colors.reset}`
        : '')
  );
  console.log(
    `  ${colors.cyan}Avg Complexity/File:${colors.reset} ${avgComplexity}` +
      (parseFloat(avgComplexity) > 20
        ? ` ${colors.yellow}(consider refactoring)${colors.reset}`
        : '')
  );
  console.log('');

  // Generate report
  const reportPath = generateReport(aggregated, fileMetrics);
  console.log(`${colors.gray}Detailed report: ${reportPath}${colors.reset}`);
  console.log('');
  console.log(`${colors.green}${colors.bold}✓ Metrics collection complete${colors.reset}`);
}

main();
