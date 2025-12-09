// ==============================================================================
// WINDSURF AUTOPILOT - ADDITIONAL TOOLS v2.1
// ==============================================================================
// These tools extend the base autopilot with:
// - Project Intelligence (analyze, detect tech stack)
// - Smart Error Handling (analyze errors, smart retry)
// - HTTP Operations (requests, downloads)
// - Code Quality (lint, format, fix)
// - Testing Automation (run tests, analyze failures)
// - Process Management (start/stop servers)
// - Docker Support
// ==============================================================================

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const http = require('http');
const https = require('https');

// Helper: Safe command execution
function safeExec(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      timeout: options.timeout || 60000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true,
      ...options,
    })
      .toString()
      .trim();
    return { success: true, output, exitCode: 0 };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      output: e.stdout?.toString() || '',
      stderr: e.stderr?.toString() || '',
      exitCode: e.status || 1,
    };
  }
}

// Running processes tracker
const runningProcesses = new Map();

// ==============================================================================
// 1. PROJECT INTELLIGENCE
// ==============================================================================

/**
 * Analyze a project to understand its structure
 */
async function analyzeProject({ projectPath }) {
  const analysis = {
    path: projectPath,
    exists: false,
    type: 'unknown',
    techStack: [],
    entryPoints: [],
    scripts: {},
    dependencies: { production: [], development: [] },
    structure: { directories: [], files: [], totalFiles: 0 },
    issues: [],
    suggestions: [],
  };

  if (!fs.existsSync(projectPath)) {
    return { success: false, error: `Project not found: ${projectPath}` };
  }

  analysis.exists = true;

  // Detect files
  const files = [];
  const directories = [];

  function scanDir(dir, depth = 0) {
    if (depth > 3) {
      return;
    }
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === '__pycache__'
        ) {
          continue;
        }
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(projectPath, fullPath);

        if (entry.isDirectory()) {
          directories.push(relativePath);
          scanDir(fullPath, depth + 1);
        } else {
          files.push(relativePath);
        }
      }
    } catch {}
  }

  scanDir(projectPath);
  analysis.structure = { directories, files: files.slice(0, 100), totalFiles: files.length };

  // Detect tech stack
  const techStack = await detectTechStack({ projectPath });
  analysis.techStack = techStack.technologies || [];
  analysis.type = techStack.projectType || 'unknown';

  // Find entry points
  const entryPoints = [
    'src/index.js',
    'src/index.ts',
    'src/main.js',
    'src/main.ts',
    'index.js',
    'index.ts',
    'main.py',
    'app.py',
    'src/main.py',
    'src/App.jsx',
    'src/App.tsx',
    'pages/index.js',
    'pages/index.tsx',
    'app/page.tsx',
    'app/page.js',
  ];

  for (const entry of entryPoints) {
    if (fs.existsSync(path.join(projectPath, entry))) {
      analysis.entryPoints.push(entry);
    }
  }

  // Get scripts from package.json
  const pkgPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      analysis.scripts = pkg.scripts || {};

      // Parse dependencies
      if (pkg.dependencies) {
        analysis.dependencies.production = Object.keys(pkg.dependencies);
      }
      if (pkg.devDependencies) {
        analysis.dependencies.development = Object.keys(pkg.devDependencies);
      }
    } catch {}
  }

  // Python dependencies
  const reqPath = path.join(projectPath, 'requirements.txt');
  if (fs.existsSync(reqPath)) {
    try {
      const content = fs.readFileSync(reqPath, 'utf8');
      analysis.dependencies.production = content
        .split('\n')
        .map(l => l.trim().split(/[=<>]/)[0])
        .filter(l => l && !l.startsWith('#'));
    } catch {}
  }

  // Detect issues
  if (!analysis.entryPoints.length) {
    analysis.issues.push({ type: 'warning', message: 'No entry point found' });
    analysis.suggestions.push('Create a main entry file (src/index.js, main.py, etc.)');
  }

  const nodeModules = path.join(projectPath, 'node_modules');
  if (fs.existsSync(pkgPath) && !fs.existsSync(nodeModules)) {
    analysis.issues.push({ type: 'error', message: 'Dependencies not installed' });
    analysis.suggestions.push('Run: npm install');
  }

  const venvPath = path.join(projectPath, 'venv');
  const venvPath2 = path.join(projectPath, '.venv');
  if (fs.existsSync(reqPath) && !fs.existsSync(venvPath) && !fs.existsSync(venvPath2)) {
    analysis.issues.push({ type: 'warning', message: 'No Python virtual environment' });
    analysis.suggestions.push('Run: python -m venv venv');
  }

  // Git status
  const gitDir = path.join(projectPath, '.git');
  if (!fs.existsSync(gitDir)) {
    analysis.issues.push({ type: 'info', message: 'Not a Git repository' });
    analysis.suggestions.push('Run: git init');
  }

  return { success: true, analysis };
}

/**
 * Detect technology stack of a project
 */
async function detectTechStack({ projectPath }) {
  const technologies = [];
  let projectType = 'unknown';

  const checks = {
    // JavaScript/TypeScript
    'package.json': () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (allDeps.next) {
        technologies.push('Next.js');
        projectType = 'nextjs';
      }
      if (allDeps.react) {
        technologies.push('React');
        if (!projectType.includes('next')) {
          projectType = 'react';
        }
      }
      if (allDeps.vue) {
        technologies.push('Vue.js');
        projectType = 'vue';
      }
      if (allDeps.angular) {
        technologies.push('Angular');
        projectType = 'angular';
      }
      if (allDeps.express) {
        technologies.push('Express');
        projectType = 'node-backend';
      }
      if (allDeps.fastify) {
        technologies.push('Fastify');
        projectType = 'node-backend';
      }
      if (allDeps.nest) {
        technologies.push('NestJS');
        projectType = 'nestjs';
      }
      if (allDeps.typescript) {
        technologies.push('TypeScript');
      }
      if (allDeps.tailwindcss) {
        technologies.push('Tailwind CSS');
      }
      if (allDeps.prisma) {
        technologies.push('Prisma');
      }
      if (allDeps.mongoose) {
        technologies.push('MongoDB/Mongoose');
      }
      if (allDeps.jest || allDeps.vitest || allDeps.mocha) {
        technologies.push('Testing Framework');
      }
      if (allDeps.eslint) {
        technologies.push('ESLint');
      }
      if (allDeps.prettier) {
        technologies.push('Prettier');
      }

      return true;
    },

    // Python
    'requirements.txt': () => {
      const content = fs
        .readFileSync(path.join(projectPath, 'requirements.txt'), 'utf8')
        .toLowerCase();
      technologies.push('Python');
      projectType = 'python';

      if (content.includes('fastapi')) {
        technologies.push('FastAPI');
        projectType = 'python-api';
      }
      if (content.includes('django')) {
        technologies.push('Django');
        projectType = 'django';
      }
      if (content.includes('flask')) {
        technologies.push('Flask');
        projectType = 'flask';
      }
      if (content.includes('pytorch') || content.includes('torch')) {
        technologies.push('PyTorch');
      }
      if (content.includes('tensorflow')) {
        technologies.push('TensorFlow');
      }
      if (content.includes('pandas')) {
        technologies.push('Pandas');
      }
      if (content.includes('pytest')) {
        technologies.push('Pytest');
      }

      return true;
    },

    'pyproject.toml': () => {
      technologies.push('Python');
      projectType = 'python';
      return true;
    },

    // Docker
    Dockerfile: () => {
      technologies.push('Docker');
      return true;
    },
    'docker-compose.yml': () => {
      technologies.push('Docker Compose');
      return true;
    },
    'docker-compose.yaml': () => {
      technologies.push('Docker Compose');
      return true;
    },

    // Config files
    'tsconfig.json': () => {
      technologies.push('TypeScript');
      return true;
    },
    'tailwind.config.js': () => {
      technologies.push('Tailwind CSS');
      return true;
    },
    'tailwind.config.ts': () => {
      technologies.push('Tailwind CSS');
      return true;
    },
    '.eslintrc.json': () => {
      technologies.push('ESLint');
      return true;
    },
    '.prettierrc': () => {
      technologies.push('Prettier');
      return true;
    },
    'vite.config.js': () => {
      technologies.push('Vite');
      return true;
    },
    'vite.config.ts': () => {
      technologies.push('Vite');
      return true;
    },
    'webpack.config.js': () => {
      technologies.push('Webpack');
      return true;
    },

    // Other
    'Cargo.toml': () => {
      technologies.push('Rust');
      projectType = 'rust';
      return true;
    },
    'go.mod': () => {
      technologies.push('Go');
      projectType = 'go';
      return true;
    },
    'pom.xml': () => {
      technologies.push('Java/Maven');
      projectType = 'java';
      return true;
    },
    'build.gradle': () => {
      technologies.push('Java/Gradle');
      projectType = 'java';
      return true;
    },
  };

  for (const [file, check] of Object.entries(checks)) {
    try {
      if (fs.existsSync(path.join(projectPath, file))) {
        check();
      }
    } catch {}
  }

  // File extension analysis
  const extensions = {};
  function countExtensions(dir, depth = 0) {
    if (depth > 2) {
      return;
    }
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          countExtensions(fullPath, depth + 1);
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext) {
            extensions[ext] = (extensions[ext] || 0) + 1;
          }
        }
      }
    } catch {}
  }
  countExtensions(projectPath);

  if (extensions['.ts'] || extensions['.tsx']) {
    technologies.push('TypeScript');
  }
  if (extensions['.jsx']) {
    technologies.push('JSX');
  }
  if (extensions['.vue']) {
    technologies.push('Vue SFC');
  }
  if (extensions['.svelte']) {
    technologies.push('Svelte');
    projectType = 'svelte';
  }

  return {
    success: true,
    projectType,
    technologies: [...new Set(technologies)],
    fileTypes: extensions,
  };
}

// ==============================================================================
// 2. ERROR ANALYSIS & SMART RETRY
// ==============================================================================

/**
 * Analyze an error and suggest fixes
 */
async function analyzeError({ error, context, projectPath }) {
  const analysis = {
    originalError: error,
    errorType: 'unknown',
    cause: null,
    fixes: [],
    canAutoFix: false,
    autoFixCommand: null,
  };

  const errorLower = error.toLowerCase();

  // Common error patterns
  const patterns = [
    {
      pattern: /module not found|cannot find module|no module named/i,
      type: 'missing_dependency',
      analyze: () => {
        const moduleMatch = error.match(/['"]([^'"]+)['"]/);
        const moduleName = moduleMatch ? moduleMatch[1] : null;
        return {
          cause: `Missing module: ${moduleName || 'unknown'}`,
          fixes: [
            moduleName ? `npm install ${moduleName}` : 'npm install',
            'Check import paths are correct',
            'Verify package.json has the dependency',
          ],
          canAutoFix: !!moduleName,
          autoFixCommand: moduleName ? `npm install ${moduleName}` : null,
        };
      },
    },
    {
      pattern: /enoent|no such file or directory/i,
      type: 'file_not_found',
      analyze: () => {
        const pathMatch = error.match(/['"]([^'"]+)['"]/);
        return {
          cause: `File or directory not found: ${pathMatch ? pathMatch[1] : 'unknown'}`,
          fixes: [
            'Create the missing file/directory',
            'Check the file path is correct',
            'Verify working directory',
          ],
          canAutoFix: false,
        };
      },
    },
    {
      pattern: /permission denied|eacces/i,
      type: 'permission_error',
      analyze: () => ({
        cause: 'Permission denied - insufficient access rights',
        fixes: [
          'Run with administrator/sudo privileges',
          'Check file/folder permissions',
          'Take ownership of the file/folder',
        ],
        canAutoFix: false,
      }),
    },
    {
      pattern: /syntax error|unexpected token/i,
      type: 'syntax_error',
      analyze: () => {
        const lineMatch = error.match(/line (\d+)/i);
        return {
          cause: `Syntax error${lineMatch ? ` at line ${lineMatch[1]}` : ''}`,
          fixes: [
            'Check for missing brackets, quotes, or semicolons',
            'Validate JSON/JavaScript syntax',
            'Use a linter to find the exact issue',
          ],
          canAutoFix: false,
        };
      },
    },
    {
      pattern: /eaddrinuse|port.*in use|address already in use/i,
      type: 'port_in_use',
      analyze: () => {
        const portMatch = error.match(/port[:\s]*(\d+)/i);
        const port = portMatch ? portMatch[1] : '3000';
        return {
          cause: `Port ${port} is already in use`,
          fixes: [
            `Kill process using port ${port}`,
            'Use a different port',
            'Check for other running servers',
          ],
          canAutoFix: true,
          autoFixCommand:
            process.platform === 'win32' ? `netstat -ano | findstr :${port}` : `lsof -i :${port}`,
        };
      },
    },
    {
      pattern: /npm err|npm error/i,
      type: 'npm_error',
      analyze: () => ({
        cause: 'npm package manager error',
        fixes: [
          'Clear npm cache: npm cache clean --force',
          'Delete node_modules and reinstall: rm -rf node_modules && npm install',
          'Check network connection',
          'Update npm: npm install -g npm@latest',
        ],
        canAutoFix: true,
        autoFixCommand: 'npm cache clean --force && npm install',
      }),
    },
    {
      pattern: /type error|typeerror/i,
      type: 'type_error',
      analyze: () => ({
        cause: 'Type error - wrong data type used',
        fixes: [
          'Check variable types match expected types',
          'Add null/undefined checks',
          'Use TypeScript for better type safety',
        ],
        canAutoFix: false,
      }),
    },
    {
      pattern: /reference error|is not defined/i,
      type: 'reference_error',
      analyze: () => {
        const varMatch = error.match(/(\w+) is not defined/i);
        return {
          cause: `Undefined variable: ${varMatch ? varMatch[1] : 'unknown'}`,
          fixes: [
            'Check variable is declared before use',
            'Verify import statements',
            'Check for typos in variable names',
          ],
          canAutoFix: false,
        };
      },
    },
    {
      pattern: /connection refused|econnrefused/i,
      type: 'connection_error',
      analyze: () => ({
        cause: 'Connection refused - service not running or unreachable',
        fixes: [
          'Verify the service is running',
          'Check the host and port are correct',
          'Check firewall settings',
        ],
        canAutoFix: false,
      }),
    },
    {
      pattern: /timeout|etimedout/i,
      type: 'timeout_error',
      analyze: () => ({
        cause: 'Operation timed out',
        fixes: ['Increase timeout value', 'Check network connectivity', 'Retry the operation'],
        canAutoFix: true,
        autoFixCommand: null, // Retry logic
      }),
    },
  ];

  for (const { pattern, type, analyze } of patterns) {
    if (pattern.test(error)) {
      analysis.errorType = type;
      const result = analyze();
      Object.assign(analysis, result);
      break;
    }
  }

  // If no pattern matched
  if (analysis.errorType === 'unknown') {
    analysis.cause = 'Unrecognized error';
    analysis.fixes = [
      'Check the full error message for details',
      'Search online for the error message',
      'Review recent code changes',
    ];
  }

  return { success: true, analysis };
}

/**
 * Smart retry with different strategies
 */
async function smartRetry({
  command,
  cwd,
  maxAttempts = 3,
  strategies = ['retry', 'clear_cache', 'reinstall'],
}) {
  const results = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const strategy = strategies[Math.min(attempt - 1, strategies.length - 1)];

    let cmdToRun = command;
    let preCommand = null;

    switch (strategy) {
      case 'clear_cache':
        if (command.includes('npm')) {
          preCommand = 'npm cache clean --force';
        }
        break;
      case 'reinstall':
        if (fs.existsSync(path.join(cwd, 'package.json'))) {
          preCommand = 'rm -rf node_modules package-lock.json && npm install';
        }
        break;
      case 'with_force':
        if (command.includes('npm install')) {
          cmdToRun = command + ' --force';
        }
        break;
    }

    // Run pre-command if any
    if (preCommand) {
      safeExec(preCommand, { cwd, timeout: 120000 });
    }

    // Run the main command
    const result = safeExec(cmdToRun, { cwd, timeout: 120000 });

    results.push({
      attempt,
      strategy,
      success: result.success,
      output: result.output,
      error: result.error,
    });

    if (result.success) {
      return {
        success: true,
        attempts: attempt,
        strategy,
        results,
      };
    }
  }

  return {
    success: false,
    attempts: maxAttempts,
    message: 'All retry strategies failed',
    results,
  };
}

// ==============================================================================
// 3. HTTP OPERATIONS
// ==============================================================================

/**
 * Make HTTP requests
 */
async function httpRequest({ url, method = 'GET', headers = {}, body = null, timeout = 30000 }) {
  return new Promise(resolve => {
    try {
      const urlObj = new URL(url);
      const lib = urlObj.protocol === 'https:' ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'User-Agent': 'Windsurf-Autopilot/2.0',
          ...headers,
        },
        timeout,
      };

      if (body && method !== 'GET') {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
        if (!options.headers['Content-Type']) {
          options.headers['Content-Type'] = 'application/json';
        }
      }

      const req = lib.request(options, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          let parsedBody = data;
          try {
            if (res.headers['content-type']?.includes('application/json')) {
              parsedBody = JSON.parse(data);
            }
          } catch {}

          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody,
          });
        });
      });

      req.on('error', e => {
        resolve({ success: false, error: e.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Request timed out' });
      });

      if (body && method !== 'GET') {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }

      req.end();
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
}

/**
 * Download file from URL
 */
async function downloadFile({ url, destPath, overwrite = false }) {
  return new Promise(resolve => {
    try {
      if (fs.existsSync(destPath) && !overwrite) {
        return resolve({ success: false, error: 'File already exists' });
      }

      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const urlObj = new URL(url);
      const lib = urlObj.protocol === 'https:' ? https : http;

      const file = fs.createWriteStream(destPath);

      lib
        .get(url, res => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            // Follow redirect
            downloadFile({ url: res.headers.location, destPath, overwrite }).then(resolve);
            return;
          }

          res.pipe(file);
          file.on('finish', () => {
            file.close();
            const stats = fs.statSync(destPath);
            resolve({
              success: true,
              path: destPath,
              size: stats.size,
            });
          });
        })
        .on('error', e => {
          fs.unlink(destPath, () => {});
          resolve({ success: false, error: e.message });
        });
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
}

// ==============================================================================
// 4. CODE QUALITY
// ==============================================================================

/**
 * Run linter on project
 */
async function lintCode({ projectPath, fix = false }) {
  const results = { linters: [], issues: [], fixed: 0 };

  // Check for ESLint
  const eslintConfig = ['.eslintrc.json', '.eslintrc.js', '.eslintrc', 'eslint.config.js'].some(f =>
    fs.existsSync(path.join(projectPath, f))
  );

  const hasEslint =
    eslintConfig ||
    (fs.existsSync(path.join(projectPath, 'package.json')) &&
      JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8')).devDependencies
        ?.eslint);

  if (hasEslint) {
    const cmd = fix ? 'npx eslint . --fix' : 'npx eslint .';
    const result = safeExec(cmd, { cwd: projectPath, timeout: 60000 });
    results.linters.push({
      name: 'ESLint',
      success: result.success,
      output: result.output || result.stderr,
    });
  }

  // Check for Python linters
  if (
    fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
    fs.existsSync(path.join(projectPath, 'pyproject.toml'))
  ) {
    // Try flake8
    const flake8 = safeExec('python -m flake8 .', { cwd: projectPath, timeout: 60000 });
    if (flake8.success || flake8.output) {
      results.linters.push({
        name: 'Flake8',
        success: flake8.exitCode === 0,
        output: flake8.output || flake8.stderr,
      });
    }

    // Try black for formatting
    if (fix) {
      const black = safeExec('python -m black .', { cwd: projectPath, timeout: 60000 });
      results.linters.push({
        name: 'Black',
        success: black.success,
        output: black.output || black.stderr,
      });
    }
  }

  return { success: true, ...results };
}

/**
 * Format code
 */
async function formatCode({ projectPath }) {
  const results = [];

  // Prettier
  const hasPrettier =
    fs.existsSync(path.join(projectPath, 'node_modules', '.bin', 'prettier')) ||
    ['.prettierrc', '.prettierrc.json', 'prettier.config.js'].some(f =>
      fs.existsSync(path.join(projectPath, f))
    );

  if (hasPrettier) {
    const result = safeExec('npx prettier --write .', { cwd: projectPath, timeout: 60000 });
    results.push({ formatter: 'Prettier', success: result.success, output: result.output });
  }

  // Black for Python
  if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) {
    const result = safeExec('python -m black .', { cwd: projectPath, timeout: 60000 });
    results.push({ formatter: 'Black', success: result.success, output: result.output });
  }

  return { success: true, results };
}

// ==============================================================================
// 5. TESTING
// ==============================================================================

/**
 * Run tests
 */
async function runTests({ projectPath, testFile = null, coverage = false }) {
  const results = { framework: null, success: false, output: '', stats: {} };

  // Detect test framework
  const pkgPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    let cmd;
    if (deps.vitest) {
      results.framework = 'Vitest';
      cmd = coverage ? 'npx vitest run --coverage' : 'npx vitest run';
    } else if (deps.jest) {
      results.framework = 'Jest';
      cmd = coverage ? 'npx jest --coverage' : 'npx jest';
    } else if (
      pkg.scripts?.test &&
      pkg.scripts.test !== 'echo "Error: no test specified" && exit 1'
    ) {
      results.framework = 'npm test';
      cmd = 'npm test';
    }

    if (cmd) {
      if (testFile) {
        cmd += ` ${testFile}`;
      }
      const result = safeExec(cmd, { cwd: projectPath, timeout: 300000 });
      results.success = result.success;
      results.output = result.output + '\n' + result.stderr;

      // Parse test stats from output
      const passMatch = results.output.match(/(\d+)\s*pass/i);
      const failMatch = results.output.match(/(\d+)\s*fail/i);
      if (passMatch) {
        results.stats.passed = parseInt(passMatch[1]);
      }
      if (failMatch) {
        results.stats.failed = parseInt(failMatch[1]);
      }
    }
  }

  // Python pytest
  if (
    fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
    fs.existsSync(path.join(projectPath, 'pytest.ini')) ||
    fs.existsSync(path.join(projectPath, 'tests'))
  ) {
    results.framework = 'Pytest';
    let cmd = coverage ? 'python -m pytest --cov' : 'python -m pytest';
    if (testFile) {
      cmd += ` ${testFile}`;
    }

    const result = safeExec(cmd, { cwd: projectPath, timeout: 300000 });
    results.success = result.success;
    results.output = result.output + '\n' + result.stderr;
  }

  if (!results.framework) {
    return { success: false, error: 'No test framework detected' };
  }

  return { success: true, ...results };
}

// ==============================================================================
// 6. PROCESS MANAGEMENT
// ==============================================================================

/**
 * Start a development server
 */
async function startServer({ projectPath, script = 'dev', port = null }) {
  const pkgPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return { success: false, error: 'No package.json found' };
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  // Find appropriate script
  const scriptToRun = pkg.scripts?.[script] || pkg.scripts?.start || pkg.scripts?.dev;
  if (!scriptToRun) {
    return { success: false, error: `No "${script}" script found in package.json` };
  }

  // Start the process
  const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
  const shellArgs =
    process.platform === 'win32' ? ['/c', `npm run ${script}`] : ['-c', `npm run ${script}`];

  const proc = spawn(shell, shellArgs, {
    cwd: projectPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    windowsHide: true,
  });

  const serverId = `server_${Date.now()}`;
  runningProcesses.set(serverId, {
    process: proc,
    pid: proc.pid,
    projectPath,
    script,
    startedAt: new Date().toISOString(),
  });

  // Give it a moment to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    success: true,
    serverId,
    pid: proc.pid,
    script,
    message: `Server started (PID: ${proc.pid})`,
    hint: `Use stopServer with serverId "${serverId}" to stop`,
  };
}

/**
 * Stop a server
 */
async function stopServer({ serverId, pid }) {
  if (serverId && runningProcesses.has(serverId)) {
    const info = runningProcesses.get(serverId);
    try {
      process.kill(info.pid, 'SIGTERM');
      runningProcesses.delete(serverId);
      return { success: true, message: `Stopped server ${serverId} (PID: ${info.pid})` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  if (pid) {
    try {
      process.kill(pid, 'SIGTERM');
      return { success: true, message: `Stopped process ${pid}` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  return { success: false, error: 'No serverId or pid provided' };
}

/**
 * List running servers
 */
async function listRunning() {
  const servers = [];
  for (const [id, info] of runningProcesses) {
    servers.push({
      serverId: id,
      pid: info.pid,
      projectPath: info.projectPath,
      script: info.script,
      startedAt: info.startedAt,
    });
  }
  return { success: true, servers };
}

// ==============================================================================
// 7. DOCKER OPERATIONS
// ==============================================================================

/**
 * Check Docker status
 */
async function dockerStatus() {
  const docker = safeExec('docker --version');
  const compose = safeExec('docker compose version') || safeExec('docker-compose --version');

  if (!docker.success) {
    return { success: false, installed: false, error: 'Docker not installed' };
  }

  const running = safeExec('docker ps --format "{{.Names}}"');
  const images = safeExec('docker images --format "{{.Repository}}:{{.Tag}}"');

  return {
    success: true,
    installed: true,
    version: docker.output,
    composeVersion: compose.output,
    runningContainers: running.success ? running.output.split('\n').filter(l => l) : [],
    images: images.success
      ? images.output
          .split('\n')
          .filter(l => l)
          .slice(0, 20)
      : [],
  };
}

/**
 * Build Docker image
 */
async function dockerBuild({ projectPath, tag = null, dockerfile = 'Dockerfile' }) {
  const dockerfilePath = path.join(projectPath, dockerfile);
  if (!fs.existsSync(dockerfilePath)) {
    return { success: false, error: `Dockerfile not found: ${dockerfilePath}` };
  }

  const imageName = tag || path.basename(projectPath).toLowerCase();
  const cmd = `docker build -t ${imageName} -f ${dockerfile} .`;

  const result = safeExec(cmd, { cwd: projectPath, timeout: 600000 });

  return {
    success: result.success,
    image: imageName,
    output: result.output,
    error: result.error,
  };
}

/**
 * Run Docker container
 */
async function dockerRun({ image, name = null, ports = [], env = {}, detach = true }) {
  let cmd = 'docker run';
  if (detach) {
    cmd += ' -d';
  }
  if (name) {
    cmd += ` --name ${name}`;
  }
  for (const port of ports) {
    cmd += ` -p ${port}`;
  }
  for (const [key, val] of Object.entries(env)) {
    cmd += ` -e ${key}=${val}`;
  }
  cmd += ` ${image}`;

  const result = safeExec(cmd, { timeout: 60000 });

  return {
    success: result.success,
    containerId: result.output?.trim(),
    error: result.error,
  };
}

/**
 * Docker Compose up
 */
async function dockerComposeUp({ projectPath, detach = true, build = false }) {
  const composeFiles = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];
  const hasCompose = composeFiles.some(f => fs.existsSync(path.join(projectPath, f)));

  if (!hasCompose) {
    return { success: false, error: 'No docker-compose file found' };
  }

  let cmd = 'docker compose up';
  if (detach) {
    cmd += ' -d';
  }
  if (build) {
    cmd += ' --build';
  }

  const result = safeExec(cmd, { cwd: projectPath, timeout: 300000 });

  return {
    success: result.success,
    output: result.output,
    error: result.error,
  };
}

// ==============================================================================
// EXPORTS
// ==============================================================================
module.exports = {
  // Project Intelligence
  analyzeProject,
  detectTechStack,

  // Error Handling
  analyzeError,
  smartRetry,

  // HTTP
  httpRequest,
  downloadFile,

  // Code Quality
  lintCode,
  formatCode,

  // Testing
  runTests,

  // Process Management
  startServer,
  stopServer,
  listRunning,

  // Docker
  dockerStatus,
  dockerBuild,
  dockerRun,
  dockerComposeUp,
};
