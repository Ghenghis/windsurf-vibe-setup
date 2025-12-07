#!/usr/bin/env node
/**
 * JSON Validation Script
 * Validates all JSON and JSONC files in the repository
 * Supports JSON with comments (JSONC) used by VS Code/Windsurf
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  rootDir: path.join(__dirname, '..'),
  excludeDirs: ['node_modules', '.git', '.venv', 'venv', 'benchmark-results', 'obj', 'bin', '__pycache__', '.vs', 'dist', 'build'],
  extensions: ['.json', '.jsonc']
};

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Remove comments from JSONC content
 * @param {string} content - JSONC content
 * @returns {string} - JSON content without comments
 */
function stripJsonComments(content) {
  // Normalize line endings to LF
  const result = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove comments while respecting strings (state machine approach)
  let output = '';
  let i = 0;
  while (i < result.length) {
    // Handle strings - copy them verbatim
    if (result[i] === '"') {
      output += result[i++];
      while (i < result.length && result[i] !== '"') {
        if (result[i] === '\\' && i + 1 < result.length) {
          output += result[i++]; // escape char
        }
        output += result[i++];
      }
      if (i < result.length) {
        output += result[i++];
      } // closing quote
    } else if (result[i] === '/' && result[i + 1] === '/') {
      // Handle single-line comments
      while (i < result.length && result[i] !== '\n') {
        i++;
      }
    } else if (result[i] === '/' && result[i + 1] === '*') {
      // Handle multi-line comments
      i += 2;
      while (i < result.length && !(result[i] === '*' && result[i + 1] === '/')) {
        i++;
      }
      i += 2;
    } else {
      // Copy everything else
      output += result[i++];
    }
  }

  // Remove trailing commas before closing brackets
  output = output.replace(/,(\s*[}\]])/g, '$1');

  return output;
}

/**
 * Find all JSON files in directory recursively
 * @param {string} dir - Directory to search
 * @returns {string[]} - Array of file paths
 */
function findJsonFiles(dir) {
  const files = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!CONFIG.excludeDirs.includes(entry.name)) {
          files.push(...findJsonFiles(fullPath));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (CONFIG.extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}: ${error.message}`);
  }

  return files;
}

/**
 * Validate a single JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {object} - Validation result
 */
function validateJsonFile(filePath) {
  const result = {
    path: filePath,
    valid: false,
    error: null,
    lineCount: 0,
    size: 0
  };

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    result.size = content.length;
    result.lineCount = content.split('\n').length;

    // Strip comments for JSONC files
    const jsonContent = stripJsonComments(content);

    // Attempt to parse
    JSON.parse(jsonContent);
    result.valid = true;
  } catch (error) {
    result.error = error.message;

    // Try to extract line number from error
    const lineMatch = error.message.match(/position (\d+)/);
    if (lineMatch) {
      const content = fs.readFileSync(filePath, 'utf8');
      const position = parseInt(lineMatch[1]);
      const beforeError = content.substring(0, position);
      result.errorLine = beforeError.split('\n').length;
    }
  }

  return result;
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.bold}JSON/JSONC Validation${colors.reset}`);
  console.log('='.repeat(50));
  console.log(`Scanning: ${CONFIG.rootDir}`);
  console.log('');

  const files = findJsonFiles(CONFIG.rootDir);
  console.log(`Found ${files.length} JSON files to validate`);
  console.log('');

  const results = {
    valid: [],
    invalid: []
  };

  for (const file of files) {
    const result = validateJsonFile(file);
    const relativePath = path.relative(CONFIG.rootDir, file);

    if (result.valid) {
      results.valid.push(result);
      console.log(`${colors.green}[OK]${colors.reset} ${relativePath}`);
    } else {
      results.invalid.push(result);
      console.log(`${colors.red}[FAIL]${colors.reset} ${relativePath}`);
      console.log(`       ${colors.yellow}Error: ${result.error}${colors.reset}`);
      if (result.errorLine) {
        console.log(`       ${colors.yellow}Near line: ${result.errorLine}${colors.reset}`);
      }
    }
  }

  // Summary
  console.log('');
  console.log('='.repeat(50));
  console.log(`${colors.bold}Summary${colors.reset}`);
  console.log(`  ${colors.green}Valid: ${results.valid.length}${colors.reset}`);
  console.log(`  ${colors.red}Invalid: ${results.invalid.length}${colors.reset}`);
  console.log(`  Total: ${files.length}`);

  // Exit with error code if any files are invalid
  if (results.invalid.length > 0) {
    console.log('');
    console.log(`${colors.red}Validation failed!${colors.reset}`);
    process.exit(1);
  } else {
    console.log('');
    console.log(`${colors.green}All files valid!${colors.reset}`);
    process.exit(0);
  }
}

main();
