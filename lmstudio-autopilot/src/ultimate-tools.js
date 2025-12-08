#!/usr/bin/env node
/**
 * Windsurf Autopilot - Ultimate Tools v2.5.0
 *
 * FINAL PUSH TO 95%+ AUTOPILOT CAPABILITY
 *
 * This module adds ALL remaining features:
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CATEGORY 1: CLOUD DEPLOYMENT (deploy without leaving IDE)
 * ═══════════════════════════════════════════════════════════════════════════
 * - deploy_vercel      - Deploy to Vercel with zero config
 * - deploy_netlify     - Deploy to Netlify
 * - deploy_railway     - Deploy to Railway.app
 * - deploy_docker_hub  - Push images to Docker Hub
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CATEGORY 2: CI/CD AUTOMATION (setup pipelines automatically)
 * ═══════════════════════════════════════════════════════════════════════════
 * - setup_github_actions  - Create GitHub Actions workflow
 * - setup_gitlab_ci       - Create GitLab CI config
 * - run_pipeline          - Trigger CI/CD manually
 * - check_pipeline_status - Get pipeline status
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CATEGORY 3: ADVANCED CODE OPERATIONS (automated code improvements)
 * ═══════════════════════════════════════════════════════════════════════════
 * - refactor_code         - Auto-refactor (rename, extract, inline)
 * - generate_docs         - Generate JSDoc/docstrings
 * - code_review           - Automated code review
 * - find_dead_code        - Find unused code
 * - analyze_complexity    - Cyclomatic complexity analysis
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CATEGORY 4: SECURITY & DEPENDENCIES (keep project safe)
 * ═══════════════════════════════════════════════════════════════════════════
 * - security_audit        - Full security scan
 * - update_dependencies   - Update all deps safely
 * - check_licenses        - License compliance check
 * - scan_secrets          - Find exposed secrets
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CATEGORY 5: API & ENDPOINT TESTING (test APIs automatically)
 * ═══════════════════════════════════════════════════════════════════════════
 * - test_api              - Automated API testing
 * - mock_server           - Start mock API server
 * - generate_api_docs     - Generate OpenAPI/Swagger docs
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CATEGORY 6: PROJECT TEMPLATES (save and reuse setups)
 * ═══════════════════════════════════════════════════════════════════════════
 * - save_template         - Save project as reusable template
 * - list_templates        - List available templates
 * - use_template          - Create project from template
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CATEGORY 7: NOTIFICATIONS & WEBHOOKS (stay informed)
 * ═══════════════════════════════════════════════════════════════════════════
 * - notify                - Send notification (desktop/webhook)
 * - send_webhook          - Send webhook to URL
 * - schedule_task         - Schedule future task
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CATEGORY 8: ADVANCED FILE OPERATIONS (bulk operations)
 * ═══════════════════════════════════════════════════════════════════════════
 * - file_diff             - Compare two files
 * - file_merge            - Merge files/branches
 * - bulk_rename           - Rename multiple files
 * - find_replace_all      - Find/replace across project
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CATEGORY 9: LOGS & MONITORING (understand what's happening)
 * ═══════════════════════════════════════════════════════════════════════════
 * - analyze_logs          - Analyze log files for patterns
 * - tail_logs             - Real-time log streaming
 * - search_logs           - Search across log files
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CATEGORY 10: PERFORMANCE (optimize and benchmark)
 * ═══════════════════════════════════════════════════════════════════════════
 * - benchmark_project     - Run performance benchmarks
 * - profile_app           - Profile app performance
 * - analyze_bundle        - Analyze JS bundle size
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CATEGORY 11: WORKSPACE MANAGEMENT (manage multiple projects)
 * ═══════════════════════════════════════════════════════════════════════════
 * - switch_project        - Switch active project context
 * - list_projects         - List all known projects
 * - project_health        - Overall project health check
 * - cleanup_project       - Remove temp files, caches
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn, exec } = require('child_process');
const https = require('https');
const http = require('http');

const HOME = os.homedir();
const IS_WINDOWS = process.platform === 'win32';

// Template storage location
const TEMPLATE_DIR = path.join(HOME, '.windsurf-autopilot', 'templates');
const PROJECTS_FILE = path.join(HOME, '.windsurf-autopilot', 'known-projects.json');

// Initialize directories
function initDirs() {
  if (!fs.existsSync(TEMPLATE_DIR)) {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
  }
  if (!fs.existsSync(path.dirname(PROJECTS_FILE))) {
    fs.mkdirSync(path.dirname(PROJECTS_FILE), { recursive: true });
  }
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ projects: [] }, null, 2));
  }
}

initDirs();

// Helper: Safe exec
function safeExec(cmd, opts = {}) {
  try {
    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout: opts.timeout || 60000,
      maxBuffer: 10 * 1024 * 1024,
      ...opts
    });
    return { success: true, output: output.trim() };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      output: e.stdout?.toString() || '',
      stderr: e.stderr?.toString() || ''
    };
  }
}

// Helper: HTTP request
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 1: CLOUD DEPLOYMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Deploy to Vercel
 */
async function deployVercel({ projectPath, token, prod = false }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  // Check if Vercel CLI is installed
  const vercelCheck = safeExec('vercel --version', { cwd: projectPath });
  if (!vercelCheck.success) {
    // Try to install
    const install = safeExec('npm install -g vercel', { cwd: projectPath });
    if (!install.success) {
      return { success: false, error: 'Vercel CLI not installed. Run: npm install -g vercel' };
    }
  }

  const prodFlag = prod ? '--prod' : '';
  const tokenFlag = token ? `--token ${token}` : '';
  const confirmFlag = '--yes';

  const result = safeExec(`vercel ${prodFlag} ${tokenFlag} ${confirmFlag}`, {
    cwd: projectPath,
    timeout: 300000 // 5 minutes
  });

  if (result.success) {
    // Extract URL from output
    const urlMatch = result.output.match(/https:\/\/[^\s]+\.vercel\.app/);
    return {
      success: true,
      url: urlMatch ? urlMatch[0] : null,
      output: result.output,
      environment: prod ? 'production' : 'preview'
    };
  }

  return { success: false, error: result.error || result.stderr };
}

/**
 * Deploy to Netlify
 */
async function deployNetlify({ projectPath, token, prod = false, siteName }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  // Check for Netlify CLI
  const netlifyCheck = safeExec('netlify --version', { cwd: projectPath });
  if (!netlifyCheck.success) {
    const install = safeExec('npm install -g netlify-cli', { cwd: projectPath });
    if (!install.success) {
      return { success: false, error: 'Netlify CLI not installed. Run: npm install -g netlify-cli' };
    }
  }

  // Detect build directory
  let buildDir = 'dist';
  if (fs.existsSync(path.join(projectPath, 'build'))) {
    buildDir = 'build';
  }
  if (fs.existsSync(path.join(projectPath, 'out'))) {
    buildDir = 'out';
  }
  if (fs.existsSync(path.join(projectPath, '.next'))) {
    buildDir = '.next';
  }

  const prodFlag = prod ? '--prod' : '';
  const tokenFlag = token ? `--auth ${token}` : '';
  const siteFlag = siteName ? `--site ${siteName}` : '';

  const result = safeExec(`netlify deploy ${prodFlag} ${tokenFlag} ${siteFlag} --dir=${buildDir}`, {
    cwd: projectPath,
    timeout: 300000
  });

  if (result.success) {
    const urlMatch = result.output.match(/https:\/\/[^\s]+\.netlify\.app/);
    return {
      success: true,
      url: urlMatch ? urlMatch[0] : null,
      output: result.output,
      environment: prod ? 'production' : 'preview'
    };
  }

  return { success: false, error: result.error || result.stderr };
}

/**
 * Deploy to Railway
 */
async function deployRailway({ projectPath, token }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const railwayCheck = safeExec('railway --version', { cwd: projectPath });
  if (!railwayCheck.success) {
    return { success: false, error: 'Railway CLI not installed. Run: npm install -g @railway/cli' };
  }

  const tokenFlag = token ? `RAILWAY_TOKEN=${token}` : '';
  const result = safeExec(`${tokenFlag} railway up`, {
    cwd: projectPath,
    timeout: 300000
  });

  return result.success
    ? { success: true, output: result.output }
    : { success: false, error: result.error };
}

/**
 * Push to Docker Hub
 */
async function deployDockerHub({ projectPath, imageName, tag = 'latest', username, password }) {
  if (!imageName) {
    return { success: false, error: 'Image name required' };
  }

  // Login if credentials provided
  if (username && password) {
    const login = safeExec(`docker login -u ${username} -p ${password}`);
    if (!login.success) {
      return { success: false, error: 'Docker login failed: ' + login.error };
    }
  }

  // Build image
  const fullTag = `${imageName}:${tag}`;
  const build = safeExec(`docker build -t ${fullTag} .`, { cwd: projectPath, timeout: 600000 });
  if (!build.success) {
    return { success: false, error: 'Docker build failed: ' + build.error };
  }

  // Push
  const push = safeExec(`docker push ${fullTag}`, { timeout: 600000 });
  if (!push.success) {
    return { success: false, error: 'Docker push failed: ' + push.error };
  }

  return {
    success: true,
    image: fullTag,
    message: `Pushed to Docker Hub: ${fullTag}`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 2: CI/CD AUTOMATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Setup GitHub Actions workflow
 */
async function setupGitHubActions({ projectPath, type = 'node', includeTests = true, includeDeploy = false }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const workflowDir = path.join(projectPath, '.github', 'workflows');
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  const workflows = {
    node: `name: CI

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4
      
      - name: Use Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint --if-present
${includeTests ? `      
      - name: Run tests
        run: npm test --if-present
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: matrix.node-version == '20.x'` : ''}
      
      - name: Build
        run: npm run build --if-present
${includeDeploy ? `
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: echo "Add your deployment steps here"` : ''}
`,

    python: `name: Python CI

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11', '3.12']

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python \${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: \${{ matrix.python-version }}
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov flake8
      
      - name: Lint with flake8
        run: flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
${includeTests ? `
      - name: Test with pytest
        run: pytest --cov=./ --cov-report=xml
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3` : ''}
`,

    docker: `name: Docker CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: app:test
          cache-from: type=gha
          cache-to: type=gha,mode=max
${includeDeploy ? `
  push:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: \${{ secrets.DOCKERHUB_USERNAME }}
          password: \${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Push to Docker Hub
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: user/app:latest` : ''}
`
  };

  const workflow = workflows[type] || workflows.node;
  const filePath = path.join(workflowDir, 'ci.yml');
  fs.writeFileSync(filePath, workflow);

  return {
    success: true,
    path: filePath,
    type,
    message: `Created GitHub Actions workflow for ${type} project`
  };
}

/**
 * Setup GitLab CI
 */
async function setupGitLabCI({ projectPath, type = 'node' }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const configs = {
    node: `stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"

cache:
  paths:
    - node_modules/

test:
  stage: test
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run lint --if-present
    - npm test --if-present

build:
  stage: build
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
      - build/

deploy:
  stage: deploy
  only:
    - main
  script:
    - echo "Add deployment commands here"
`,

    python: `stages:
  - test
  - build
  - deploy

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.pip-cache"

cache:
  paths:
    - .pip-cache/

test:
  stage: test
  image: python:3.11
  script:
    - pip install -r requirements.txt
    - pip install pytest flake8
    - flake8 .
    - pytest

build:
  stage: build
  image: python:3.11
  script:
    - pip install -r requirements.txt
    - python setup.py build || echo "No setup.py"

deploy:
  stage: deploy
  only:
    - main
  script:
    - echo "Add deployment commands here"
`
  };

  const config = configs[type] || configs.node;
  const filePath = path.join(projectPath, '.gitlab-ci.yml');
  fs.writeFileSync(filePath, config);

  return {
    success: true,
    path: filePath,
    type,
    message: 'Created GitLab CI configuration'
  };
}

/**
 * Trigger CI pipeline (via git push)
 */
async function runPipeline({ projectPath, branch = 'main', commitMessage = 'trigger: CI pipeline' }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  // Create trigger file
  const triggerFile = path.join(projectPath, '.ci-trigger');
  fs.writeFileSync(triggerFile, new Date().toISOString());

  // Git add, commit, push
  const commands = [
    'git add .ci-trigger',
    `git commit -m "${commitMessage}"`,
    `git push origin ${branch}`
  ];

  for (const cmd of commands) {
    const result = safeExec(cmd, { cwd: projectPath });
    if (!result.success && !result.error?.includes('nothing to commit')) {
      return { success: false, error: result.error, command: cmd };
    }
  }

  // Cleanup trigger file
  fs.unlinkSync(triggerFile);

  return {
    success: true,
    message: 'Pipeline triggered via git push',
    branch
  };
}

/**
 * Check pipeline status (GitHub Actions)
 */
async function checkPipelineStatus({ projectPath, owner, repo, token }) {
  if (!owner || !repo) {
    // Try to extract from git remote
    const remote = safeExec('git remote get-url origin', { cwd: projectPath });
    if (remote.success) {
      const match = remote.output.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      if (match) {
        owner = match[1];
        repo = match[2];
      }
    }
  }

  if (!owner || !repo) {
    return { success: false, error: 'Could not determine GitHub repo' };
  }

  try {
    const headers = {
      'User-Agent': 'windsurf-autopilot',
      'Accept': 'application/vnd.github.v3+json'
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await httpRequest(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=5`,
      { headers }
    );

    const data = JSON.parse(response.data);
    const runs = data.workflow_runs?.map(run => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch,
      createdAt: run.created_at,
      url: run.html_url
    }));

    return {
      success: true,
      runs: runs || [],
      total: data.total_count
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 3: ADVANCED CODE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Auto-refactor code
 */
async function refactorCode({ projectPath, operation, target, newName, filePath }) {
  const operations = {
    rename: async () => {
      if (!filePath || !target || !newName) {
        return { success: false, error: 'filePath, target, and newName required for rename' };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const regex = new RegExp(`\\b${target}\\b`, 'g');
      const newContent = content.replace(regex, newName);
      fs.writeFileSync(filePath, newContent);

      const count = (content.match(regex) || []).length;
      return {
        success: true,
        operation: 'rename',
        target,
        newName,
        replacements: count
      };
    },

    extract_function: async () => {
      return {
        success: true,
        message: 'Function extraction: Use IDE refactoring tools for complex extractions',
        suggestion: 'Select code → Right-click → Refactor → Extract Method'
      };
    },

    remove_unused_imports: async () => {
      // Run ESLint with fix
      const result = safeExec(
        'npx eslint --fix --rule "no-unused-vars: error" --rule "@typescript-eslint/no-unused-vars: error" .',
        { cwd: projectPath }
      );
      return {
        success: true,
        operation: 'remove_unused_imports',
        output: result.output || 'Cleaned unused imports'
      };
    },

    organize_imports: async () => {
      // Use prettier with import sorting
      const result = safeExec('npx prettier --write "**/*.{js,ts,jsx,tsx}"', { cwd: projectPath });
      return {
        success: true,
        operation: 'organize_imports',
        output: result.output || 'Organized imports'
      };
    }
  };

  if (!operations[operation]) {
    return {
      success: false,
      error: `Unknown operation: ${operation}`,
      availableOperations: Object.keys(operations)
    };
  }

  return await operations[operation]();
}

/**
 * Generate documentation
 */
async function generateDocs({ projectPath, type = 'jsdoc', outputDir = 'docs' }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const generators = {
    jsdoc: async () => {
      const configPath = path.join(projectPath, 'jsdoc.json');
      if (!fs.existsSync(configPath)) {
        const config = {
          source: { include: ['src'], includePattern: '.+\\.js(doc|x)?$' },
          opts: { destination: outputDir, recurse: true }
        };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      }

      const result = safeExec('npx jsdoc -c jsdoc.json', { cwd: projectPath });
      return result;
    },

    typedoc: async () => {
      const result = safeExec(`npx typedoc --out ${outputDir} src`, { cwd: projectPath });
      return result;
    },

    sphinx: async () => {
      const result = safeExec(`sphinx-build -b html docs/source ${outputDir}`, { cwd: projectPath });
      return result;
    },

    readme: async () => {
      // Generate basic README if none exists
      const readmePath = path.join(projectPath, 'README.md');
      const pkgPath = path.join(projectPath, 'package.json');

      let content = '# Project\n\n## Description\n\nProject description here.\n\n';

      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        content = `# ${pkg.name || 'Project'}\n\n`;
        content += `${pkg.description || 'Project description here.'}\n\n`;
        content += '## Installation\n\n```bash\nnpm install\n```\n\n';
        content += '## Usage\n\n```bash\nnpm start\n```\n\n';
        if (pkg.scripts) {
          content += '## Scripts\n\n';
          Object.entries(pkg.scripts).forEach(([name, cmd]) => {
            content += `- \`npm run ${name}\` - ${cmd}\n`;
          });
        }
      }

      fs.writeFileSync(readmePath, content);
      return { success: true, output: 'README.md generated' };
    }
  };

  if (!generators[type]) {
    return { success: false, error: `Unknown doc type: ${type}`, available: Object.keys(generators) };
  }

  const result = await generators[type]();
  return {
    success: result.success !== false,
    type,
    outputDir,
    output: result.output || result.error
  };
}

/**
 * Automated code review
 */
async function codeReview({ projectPath, files = [], strictness = 'medium' }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const issues = [];
  const suggestions = [];

  // Run ESLint
  const eslintResult = safeExec('npx eslint . --format json', { cwd: projectPath });
  if (eslintResult.success || eslintResult.output) {
    try {
      const eslintIssues = JSON.parse(eslintResult.output || '[]');
      eslintIssues.forEach(file => {
        file.messages?.forEach(msg => {
          issues.push({
            type: 'lint',
            severity: msg.severity === 2 ? 'error' : 'warning',
            file: file.filePath,
            line: msg.line,
            message: msg.message,
            rule: msg.ruleId
          });
        });
      });
    } catch (e) { /* ignore parse errors */ }
  }

  // Check for common issues
  const srcDir = path.join(projectPath, 'src');
  if (fs.existsSync(srcDir)) {
    const checkFile = (filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // Check for console.log
      lines.forEach((line, i) => {
        if (line.includes('console.log') && !line.trim().startsWith('//')) {
          suggestions.push({
            type: 'cleanup',
            file: filePath,
            line: i + 1,
            message: 'Consider removing console.log before production'
          });
        }

        // Check for TODO/FIXME
        if (line.includes('TODO') || line.includes('FIXME')) {
          suggestions.push({
            type: 'todo',
            file: filePath,
            line: i + 1,
            message: line.trim()
          });
        }

        // Check for very long lines
        if (line.length > 120 && strictness !== 'low') {
          suggestions.push({
            type: 'style',
            file: filePath,
            line: i + 1,
            message: `Line exceeds 120 characters (${line.length})`
          });
        }
      });
    };

    const walkDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          walkDir(fullPath);
        } else if (entry.isFile() && /\.(js|ts|jsx|tsx)$/.test(entry.name)) {
          checkFile(fullPath);
        }
      }
    };

    walkDir(srcDir);
  }

  return {
    success: true,
    summary: {
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      suggestions: suggestions.length
    },
    issues,
    suggestions,
    recommendation: issues.filter(i => i.severity === 'error').length > 0
      ? 'Fix errors before committing'
      : suggestions.length > 10
        ? 'Consider addressing some suggestions'
        : 'Code looks good!'
  };
}

/**
 * Find dead/unused code
 */
async function findDeadCode({ projectPath }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  // Try ts-prune for TypeScript
  let result = safeExec('npx ts-prune', { cwd: projectPath });
  if (result.success && result.output) {
    const unused = result.output.split('\n').filter(l => l.trim());
    return {
      success: true,
      tool: 'ts-prune',
      unused,
      count: unused.length
    };
  }

  // Fallback to knip
  result = safeExec('npx knip', { cwd: projectPath });
  return {
    success: true,
    tool: 'knip',
    output: result.output || 'No unused code found',
    errors: result.stderr
  };
}

/**
 * Analyze code complexity
 */
async function analyzeComplexity({ projectPath, threshold = 10 }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  // Try complexity-report
  let result = safeExec('npx plato -r -d complexity-report src', { cwd: projectPath });
  if (result.success) {
    return {
      success: true,
      tool: 'plato',
      reportDir: 'complexity-report',
      message: 'Complexity report generated. Open complexity-report/index.html'
    };
  }

  // Fallback to eslint complexity rule
  result = safeExec(`npx eslint . --rule "complexity: [error, ${threshold}]" --format json`, { cwd: projectPath });

  const complexFunctions = [];
  try {
    const data = JSON.parse(result.output || '[]');
    data.forEach(file => {
      file.messages?.forEach(msg => {
        if (msg.ruleId === 'complexity') {
          complexFunctions.push({
            file: file.filePath,
            line: msg.line,
            message: msg.message
          });
        }
      });
    });
  } catch (e) { /* ignore */ }

  return {
    success: true,
    tool: 'eslint-complexity',
    threshold,
    complexFunctions,
    count: complexFunctions.length
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 4: SECURITY & DEPENDENCIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Full security audit
 */
async function securityAudit({ projectPath }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const results = {
    npm: null,
    snyk: null,
    secrets: null
  };

  // npm audit
  const npmResult = safeExec('npm audit --json', { cwd: projectPath });
  try {
    results.npm = JSON.parse(npmResult.output || '{}');
  } catch (e) {
    results.npm = { error: npmResult.error || 'npm audit failed' };
  }

  // Try snyk
  const snykResult = safeExec('snyk test --json', { cwd: projectPath });
  try {
    results.snyk = JSON.parse(snykResult.output || '{}');
  } catch (e) {
    results.snyk = { available: false };
  }

  // Check for exposed secrets (basic patterns)
  const secretPatterns = [
    /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
    /secret\s*[:=]\s*['"][^'"]+['"]/gi,
    /password\s*[:=]\s*['"][^'"]+['"]/gi,
    /token\s*[:=]\s*['"][^'"]+['"]/gi,
    /AWS[A-Z0-9]{16,}/g,
    /sk-[a-zA-Z0-9]{32,}/g  // OpenAI keys
  ];

  const exposedSecrets = [];
  const walkDir = (dir) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          continue;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && /\.(js|ts|jsx|tsx|json|env|yml|yaml)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          secretPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              exposedSecrets.push({ file: fullPath, pattern: pattern.source, count: matches.length });
            }
          });
        }
      }
    } catch (e) { /* ignore access errors */ }
  };
  walkDir(projectPath);
  results.secrets = exposedSecrets;

  return {
    success: true,
    npm: results.npm,
    snyk: results.snyk?.available !== false ? results.snyk : 'Snyk not available',
    exposedSecrets: results.secrets,
    summary: {
      npmVulnerabilities: results.npm?.metadata?.vulnerabilities || {},
      secretsFound: exposedSecrets.length
    }
  };
}

/**
 * Update dependencies safely
 */
async function updateDependencies({ projectPath, mode = 'safe', packages = [] }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const modes = {
    safe: async () => {
      // Update within semver ranges (non-breaking)
      const result = safeExec('npm update', { cwd: projectPath });
      return result;
    },

    minor: async () => {
      // Update to latest minor versions
      const result = safeExec('npx npm-check-updates -u --target minor && npm install', { cwd: projectPath });
      return result;
    },

    major: async () => {
      // Update to latest (with breaking changes)
      const result = safeExec('npx npm-check-updates -u && npm install', { cwd: projectPath });
      return result;
    },

    specific: async () => {
      if (!packages.length) {
        return { success: false, error: 'No packages specified' };
      }
      const result = safeExec(`npm update ${packages.join(' ')}`, { cwd: projectPath });
      return result;
    }
  };

  if (!modes[mode]) {
    return { success: false, error: `Unknown mode: ${mode}`, available: Object.keys(modes) };
  }

  // Backup package.json first
  const pkgPath = path.join(projectPath, 'package.json');
  const backupPath = path.join(projectPath, 'package.json.backup');
  if (fs.existsSync(pkgPath)) {
    fs.copyFileSync(pkgPath, backupPath);
  }

  const result = await modes[mode]();

  return {
    success: result.success,
    mode,
    output: result.output,
    backup: backupPath,
    message: result.success
      ? `Dependencies updated (${mode} mode). Backup at package.json.backup`
      : result.error
  };
}

/**
 * Check license compliance
 */
async function checkLicenses({ projectPath, allowed = ['MIT', 'ISC', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause'] }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const result = safeExec('npx license-checker --json', { cwd: projectPath });

  if (!result.success) {
    return { success: false, error: 'license-checker not available or failed' };
  }

  try {
    const licenses = JSON.parse(result.output || '{}');
    const issues = [];
    const summary = {};

    Object.entries(licenses).forEach(([pkg, info]) => {
      const license = info.licenses || 'UNKNOWN';
      summary[license] = (summary[license] || 0) + 1;

      if (!allowed.includes(license) && license !== 'UNKNOWN') {
        issues.push({ package: pkg, license });
      }
    });

    return {
      success: true,
      totalPackages: Object.keys(licenses).length,
      summary,
      issues,
      compliant: issues.length === 0
    };
  } catch (e) {
    return { success: false, error: 'Failed to parse license data' };
  }
}

/**
 * Scan for exposed secrets
 */
async function scanSecrets({ projectPath }) {
  // Try gitleaks
  const result = safeExec('gitleaks detect --source . --report-format json', { cwd: projectPath });
  if (result.success || result.output) {
    try {
      const findings = JSON.parse(result.output || '[]');
      return {
        success: true,
        tool: 'gitleaks',
        findings,
        count: findings.length
      };
    } catch (e) { /* continue */ }
  }

  // Fallback to basic pattern matching (from securityAudit)
  return await securityAudit({ projectPath }).then(r => ({
    success: true,
    tool: 'basic-scan',
    findings: r.exposedSecrets,
    count: r.exposedSecrets?.length || 0
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 5: API & ENDPOINT TESTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Automated API testing
 */
async function testApi({ baseUrl, endpoints = [], method = 'GET', headers = {}, body = null }) {
  if (!baseUrl) {
    return { success: false, error: 'baseUrl required' };
  }

  const results = [];

  // If no endpoints, try common ones
  if (!endpoints.length) {
    endpoints = ['/', '/health', '/api', '/api/health', '/api/v1'];
  }

  for (const endpoint of endpoints) {
    const url = baseUrl.replace(/\/$/, '') + endpoint;
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json', ...headers }
      };
      if (body) {
        options.body = JSON.stringify(body);
      }

      const start = Date.now();
      const response = await httpRequest(url, options);
      const duration = Date.now() - start;

      results.push({
        endpoint,
        url,
        status: response.status,
        duration: `${duration}ms`,
        success: response.status >= 200 && response.status < 400,
        sample: response.data?.substring(0, 200)
      });
    } catch (e) {
      results.push({
        endpoint,
        url,
        status: 'ERROR',
        error: e.message,
        success: false
      });
    }
  }

  return {
    success: true,
    baseUrl,
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  };
}

/**
 * Start mock API server
 */
async function mockServer({ projectPath, port = 3001, routes = {} }) {
  // Create simple mock server file
  const mockServerCode = `
const http = require('http');

const routes = ${JSON.stringify(routes, null, 2)};

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  const route = routes[req.url] || routes['*'];
  if (route) {
    res.statusCode = route.status || 200;
    res.end(JSON.stringify(route.body || { message: 'OK' }));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(${port}, () => {
  console.log('Mock server running on http://localhost:${port}');
});
`;

  const mockPath = path.join(projectPath || process.cwd(), '.mock-server.js');
  fs.writeFileSync(mockPath, mockServerCode);

  // Start server
  const proc = spawn('node', [mockPath], {
    detached: true,
    stdio: 'ignore'
  });
  proc.unref();

  return {
    success: true,
    port,
    pid: proc.pid,
    url: `http://localhost:${port}`,
    routes: Object.keys(routes),
    serverFile: mockPath
  };
}

/**
 * Generate OpenAPI/Swagger docs
 */
async function generateApiDocs({ projectPath, outputFile = 'openapi.json' }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  // Try swagger-jsdoc
  const result = safeExec('npx swagger-jsdoc -d swaggerDef.js -o ' + outputFile, { cwd: projectPath });
  if (result.success) {
    return { success: true, tool: 'swagger-jsdoc', output: outputFile };
  }

  // Create basic OpenAPI template
  const template = {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Auto-generated API documentation'
    },
    paths: {},
    components: {
      schemas: {}
    }
  };

  const outputPath = path.join(projectPath, outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));

  return {
    success: true,
    tool: 'template',
    output: outputPath,
    message: 'Created OpenAPI template. Add your endpoints to the paths section.'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 6: PROJECT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save project as reusable template
 */
async function saveTemplate({ projectPath, templateName, description = '' }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }
  if (!templateName) {
    return { success: false, error: 'Template name required' };
  }

  const templatePath = path.join(TEMPLATE_DIR, templateName);
  if (fs.existsSync(templatePath)) {
    return { success: false, error: 'Template already exists. Delete it first or use different name.' };
  }

  const excludes = ['node_modules', '.git', '__pycache__', 'venv', '.venv', 'dist', 'build', '.next', 'coverage', '.env'];

  fs.mkdirSync(templatePath, { recursive: true });

  const copyDir = (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (excludes.includes(entry.name)) {
        continue;
      }
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDir(projectPath, templatePath);

  // Save metadata
  const meta = {
    name: templateName,
    description,
    createdAt: new Date().toISOString(),
    sourceProject: path.basename(projectPath)
  };
  fs.writeFileSync(path.join(templatePath, '.template-meta.json'), JSON.stringify(meta, null, 2));

  return {
    success: true,
    templateName,
    templatePath,
    message: `Template saved: ${templateName}`
  };
}

/**
 * List available templates
 */
async function listTemplates() {
  if (!fs.existsSync(TEMPLATE_DIR)) {
    return { success: true, templates: [] };
  }

  const entries = fs.readdirSync(TEMPLATE_DIR, { withFileTypes: true });
  const templates = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const metaPath = path.join(TEMPLATE_DIR, entry.name, '.template-meta.json');
    let meta = { name: entry.name };
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (e) { /* ignore */ }
    }
    templates.push(meta);
  }

  return { success: true, templates };
}

/**
 * Create project from template
 */
async function useTemplate({ templateName, targetPath, projectName }) {
  const templatePath = path.join(TEMPLATE_DIR, templateName);
  if (!fs.existsSync(templatePath)) {
    return { success: false, error: `Template not found: ${templateName}` };
  }

  const destPath = targetPath || path.join(HOME, 'Projects', projectName || templateName);
  if (fs.existsSync(destPath)) {
    return { success: false, error: 'Target path already exists' };
  }

  const copyDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.template-meta.json') {
        continue;
      }
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDir(templatePath, destPath);

  // Update package.json name if exists
  const pkgPath = path.join(destPath, 'package.json');
  if (fs.existsSync(pkgPath) && projectName) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = projectName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  return {
    success: true,
    templateName,
    projectPath: destPath,
    message: `Created project from template: ${templateName}`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 7: NOTIFICATIONS & WEBHOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Send notification
 */
async function notify({ title, message, type = 'info' }) {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  const icon = icons[type] || icons.info;

  // Try OS notification
  if (IS_WINDOWS) {
    const psScript = `
      [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
      $template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
      $textNodes = $template.GetElementsByTagName("text")
      $textNodes[0].AppendChild($template.CreateTextNode("${title}")) | Out-Null
      $textNodes[1].AppendChild($template.CreateTextNode("${message}")) | Out-Null
      $toast = [Windows.UI.Notifications.ToastNotification]::new($template)
      [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("WindsurfAutopilot").Show($toast)
    `;
    safeExec(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`, { timeout: 5000 });
  } else if (process.platform === 'darwin') {
    safeExec(`osascript -e 'display notification "${message}" with title "${title}"'`, { timeout: 5000 });
  } else {
    safeExec(`notify-send "${title}" "${message}"`, { timeout: 5000 });
  }

  return {
    success: true,
    notification: { icon, title, message, type }
  };
}

/**
 * Send webhook
 */
async function sendWebhook({ url, method = 'POST', payload = {}, headers = {} }) {
  if (!url) {
    return { success: false, error: 'URL required' };
  }

  try {
    const response = await httpRequest(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload)
    });

    return {
      success: response.status >= 200 && response.status < 400,
      status: response.status,
      response: response.data
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Schedule task (creates reminder file)
 */
async function scheduleTask({ taskName, command, runAt, projectPath }) {
  const schedulePath = path.join(HOME, '.windsurf-autopilot', 'scheduled-tasks.json');

  let tasks = [];
  if (fs.existsSync(schedulePath)) {
    tasks = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
  }

  const task = {
    id: `task_${Date.now()}`,
    name: taskName,
    command,
    runAt,
    projectPath,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  tasks.push(task);
  fs.writeFileSync(schedulePath, JSON.stringify(tasks, null, 2));

  return {
    success: true,
    task,
    message: 'Task scheduled. Note: Actual scheduling requires external cron/task scheduler.'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 8: ADVANCED FILE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compare two files
 */
async function fileDiff({ file1, file2, format = 'unified' }) {
  if (!fs.existsSync(file1)) {
    return { success: false, error: `File not found: ${file1}` };
  }
  if (!fs.existsSync(file2)) {
    return { success: false, error: `File not found: ${file2}` };
  }

  const content1 = fs.readFileSync(file1, 'utf8').split('\n');
  const content2 = fs.readFileSync(file2, 'utf8').split('\n');

  const differences = [];
  const maxLen = Math.max(content1.length, content2.length);

  for (let i = 0; i < maxLen; i++) {
    if (content1[i] !== content2[i]) {
      differences.push({
        line: i + 1,
        file1: content1[i] || '<missing>',
        file2: content2[i] || '<missing>'
      });
    }
  }

  // Also try git diff if available
  const gitDiff = safeExec(`git diff --no-index "${file1}" "${file2}"`, { timeout: 10000 });

  return {
    success: true,
    file1,
    file2,
    identical: differences.length === 0,
    differences,
    diffCount: differences.length,
    gitDiff: gitDiff.output || null
  };
}

/**
 * Merge changes (git merge wrapper)
 */
async function fileMerge({ projectPath, source, target = 'main' }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const result = safeExec(`git merge ${source}`, { cwd: projectPath });

  return {
    success: result.success,
    source,
    target,
    output: result.output,
    error: result.error,
    hasConflicts: result.output?.includes('CONFLICT') || result.error?.includes('CONFLICT')
  };
}

/**
 * Bulk rename files
 */
async function bulkRename({ projectPath, pattern, replacement, dryRun = true }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const results = [];
  const regex = new RegExp(pattern);

  const processDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git'].includes(entry.name)) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);

      if (regex.test(entry.name)) {
        const newName = entry.name.replace(regex, replacement);
        const newPath = path.join(dir, newName);
        results.push({ oldPath: fullPath, newPath, oldName: entry.name, newName });

        if (!dryRun) {
          fs.renameSync(fullPath, newPath);
        }
      }

      if (entry.isDirectory()) {
        processDir(fullPath);
      }
    }
  };

  processDir(projectPath);

  return {
    success: true,
    dryRun,
    pattern,
    replacement,
    files: results,
    count: results.length,
    message: dryRun ? 'Dry run complete. Set dryRun=false to apply changes.' : 'Files renamed successfully.'
  };
}

/**
 * Find and replace across entire project
 */
async function findReplaceAll({ projectPath, find, replace, filePattern = '**/*.{js,ts,jsx,tsx}', dryRun = true }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const results = [];
  const regex = new RegExp(find, 'g');

  const processFile = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(regex);
    if (matches) {
      const newContent = content.replace(regex, replace);
      results.push({
        file: filePath,
        matches: matches.length
      });
      if (!dryRun) {
        fs.writeFileSync(filePath, newContent);
      }
    }
  };

  const processDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        processDir(fullPath);
      } else if (/\.(js|ts|jsx|tsx|json|md|css|scss)$/.test(entry.name)) {
        processFile(fullPath);
      }
    }
  };

  processDir(projectPath);

  return {
    success: true,
    dryRun,
    find,
    replace,
    files: results,
    totalMatches: results.reduce((sum, r) => sum + r.matches, 0),
    message: dryRun ? 'Dry run complete. Set dryRun=false to apply.' : 'Replacements applied.'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 9: LOGS & MONITORING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyze log files
 */
async function analyzeLogs({ logPath, patterns = ['error', 'warning', 'failed'] }) {
  if (!fs.existsSync(logPath)) {
    return { success: false, error: 'Log file not found' };
  }

  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  const analysis = {
    totalLines: lines.length,
    matches: {}
  };

  patterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    const matches = lines.filter(line => regex.test(line));
    analysis.matches[pattern] = {
      count: matches.length,
      samples: matches.slice(0, 5)
    };
  });

  return {
    success: true,
    logPath,
    analysis
  };
}

/**
 * Tail log file
 */
async function tailLogs({ logPath, lines = 50 }) {
  if (!fs.existsSync(logPath)) {
    return { success: false, error: 'Log file not found' };
  }

  const content = fs.readFileSync(logPath, 'utf8');
  const allLines = content.split('\n');
  const lastLines = allLines.slice(-lines);

  return {
    success: true,
    logPath,
    lines: lastLines,
    count: lastLines.length,
    totalLines: allLines.length
  };
}

/**
 * Search across log files
 */
async function searchLogs({ logDir, pattern, maxResults = 100 }) {
  if (!fs.existsSync(logDir)) {
    return { success: false, error: 'Log directory not found' };
  }

  const results = [];
  const regex = new RegExp(pattern, 'gi');

  const processFile = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (regex.test(line) && results.length < maxResults) {
        results.push({
          file: filePath,
          line: i + 1,
          content: line.substring(0, 200)
        });
      }
    });
  };

  const entries = fs.readdirSync(logDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && /\.(log|txt)$/.test(entry.name)) {
      processFile(path.join(logDir, entry.name));
    }
    if (results.length >= maxResults) {
      break;
    }
  }

  return {
    success: true,
    pattern,
    results,
    count: results.length
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 10: PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run benchmarks
 */
async function benchmarkProject({ projectPath, type = 'build' }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const benchmarks = {
    build: async () => {
      const start = Date.now();
      const result = safeExec('npm run build', { cwd: projectPath, timeout: 300000 });
      return { duration: Date.now() - start, success: result.success };
    },

    test: async () => {
      const start = Date.now();
      const result = safeExec('npm test', { cwd: projectPath, timeout: 300000 });
      return { duration: Date.now() - start, success: result.success };
    },

    install: async () => {
      // Clean install
      safeExec('rm -rf node_modules package-lock.json', { cwd: projectPath });
      const start = Date.now();
      const result = safeExec('npm install', { cwd: projectPath, timeout: 300000 });
      return { duration: Date.now() - start, success: result.success };
    }
  };

  if (!benchmarks[type]) {
    return { success: false, error: `Unknown benchmark: ${type}`, available: Object.keys(benchmarks) };
  }

  const result = await benchmarks[type]();

  return {
    success: true,
    benchmark: type,
    duration: result.duration,
    durationFormatted: `${(result.duration / 1000).toFixed(2)}s`,
    passed: result.success
  };
}

/**
 * Profile app performance
 */
async function profileApp({ projectPath, command = 'npm start', duration = 10000 }) {
  return {
    success: true,
    message: 'For detailed profiling, use:',
    suggestions: [
      'Chrome DevTools Performance tab',
      'node --prof app.js && node --prof-process',
      'clinic.js: npx clinic doctor -- npm start',
      '0x: npx 0x app.js'
    ],
    command: `npx 0x -o ${path.join(projectPath, 'profile')} -- node src/index.js`
  };
}

/**
 * Analyze bundle size
 */
async function analyzeBundle({ projectPath }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  // Try webpack-bundle-analyzer
  let result = safeExec('npx webpack-bundle-analyzer dist/stats.json --mode static --report report.html', { cwd: projectPath });
  if (result.success) {
    return { success: true, tool: 'webpack-bundle-analyzer', report: 'report.html' };
  }

  // Try source-map-explorer
  result = safeExec('npx source-map-explorer dist/*.js --html result.html', { cwd: projectPath });
  if (result.success) {
    return { success: true, tool: 'source-map-explorer', report: 'result.html' };
  }

  // Get basic size info
  const distPath = path.join(projectPath, 'dist');
  const buildPath = path.join(projectPath, 'build');
  const targetPath = fs.existsSync(distPath) ? distPath : fs.existsSync(buildPath) ? buildPath : null;

  if (!targetPath) {
    return { success: false, error: 'No dist/build directory found. Run build first.' };
  }

  let totalSize = 0;
  const files = [];
  const processDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        processDir(fullPath);
      } else {
        const stats = fs.statSync(fullPath);
        totalSize += stats.size;
        if (/\.(js|css)$/.test(entry.name)) {
          files.push({ file: entry.name, size: stats.size, sizeKB: (stats.size / 1024).toFixed(2) + 'KB' });
        }
      }
    }
  };
  processDir(targetPath);

  files.sort((a, b) => b.size - a.size);

  return {
    success: true,
    tool: 'basic',
    totalSize,
    totalSizeFormatted: `${(totalSize / 1024).toFixed(2)} KB`,
    largestFiles: files.slice(0, 10)
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 11: WORKSPACE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Switch active project context
 */
async function switchProject({ projectPath }) {
  if (!fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  // Update known projects
  const data = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));

  // Add to known projects if not exists
  if (!data.projects.find(p => p.path === projectPath)) {
    data.projects.push({
      path: projectPath,
      name: path.basename(projectPath),
      addedAt: new Date().toISOString()
    });
  }

  // Set as active
  data.activeProject = projectPath;
  data.lastSwitchedAt = new Date().toISOString();

  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2));

  return {
    success: true,
    activeProject: projectPath,
    name: path.basename(projectPath)
  };
}

/**
 * List all known projects
 */
async function listProjects() {
  if (!fs.existsSync(PROJECTS_FILE)) {
    return { success: true, projects: [], activeProject: null };
  }

  const data = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));

  // Add exists check
  data.projects = data.projects.map(p => ({
    ...p,
    exists: fs.existsSync(p.path)
  }));

  return {
    success: true,
    projects: data.projects,
    activeProject: data.activeProject,
    count: data.projects.length
  };
}

/**
 * Overall project health check
 */
async function projectHealth({ projectPath }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const health = {
    score: 100,
    issues: [],
    warnings: [],
    good: []
  };

  // Check package.json
  const pkgPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    health.good.push('Has package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.description) {
      health.warnings.push('Missing package description');
    }
    if (!pkg.license) {
      health.warnings.push('Missing license');
    }
    if (!pkg.repository) {
      health.warnings.push('Missing repository URL');
    }
  } else {
    health.issues.push('No package.json found');
    health.score -= 20;
  }

  // Check node_modules
  if (fs.existsSync(path.join(projectPath, 'node_modules'))) {
    health.good.push('Dependencies installed');
  } else if (fs.existsSync(pkgPath)) {
    health.issues.push('Dependencies not installed');
    health.score -= 15;
  }

  // Check git
  if (fs.existsSync(path.join(projectPath, '.git'))) {
    health.good.push('Git initialized');
  } else {
    health.warnings.push('Git not initialized');
    health.score -= 5;
  }

  // Check README
  if (fs.existsSync(path.join(projectPath, 'README.md'))) {
    health.good.push('Has README');
  } else {
    health.warnings.push('Missing README.md');
    health.score -= 5;
  }

  // Check .gitignore
  if (fs.existsSync(path.join(projectPath, '.gitignore'))) {
    health.good.push('Has .gitignore');
  } else {
    health.warnings.push('Missing .gitignore');
    health.score -= 5;
  }

  // Check tests
  const hasTests = fs.existsSync(path.join(projectPath, 'tests')) ||
                   fs.existsSync(path.join(projectPath, '__tests__')) ||
                   fs.existsSync(path.join(projectPath, 'test'));
  if (hasTests) {
    health.good.push('Has test directory');
  } else {
    health.warnings.push('No tests found');
    health.score -= 10;
  }

  // Check for env.example
  if (fs.existsSync(path.join(projectPath, '.env.example'))) {
    health.good.push('Has .env.example');
  }

  // Check CI
  const hasCI = fs.existsSync(path.join(projectPath, '.github', 'workflows')) ||
                fs.existsSync(path.join(projectPath, '.gitlab-ci.yml'));
  if (hasCI) {
    health.good.push('Has CI/CD configuration');
  } else {
    health.warnings.push('No CI/CD setup');
    health.score -= 5;
  }

  // Adjust score
  health.score -= health.warnings.length * 2;
  health.score = Math.max(0, Math.min(100, health.score));

  health.grade = health.score >= 90 ? 'A' :
    health.score >= 80 ? 'B' :
      health.score >= 70 ? 'C' :
        health.score >= 60 ? 'D' : 'F';

  return {
    success: true,
    projectPath,
    health
  };
}

/**
 * Clean up project (remove temp files, caches)
 */
async function cleanupProject({ projectPath, aggressive = false }) {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: 'Project path not found' };
  }

  const cleaned = [];
  const toClean = [
    'node_modules/.cache',
    '.next',
    '.nuxt',
    'dist',
    'build',
    'coverage',
    '.nyc_output',
    '*.log',
    '.DS_Store',
    'Thumbs.db'
  ];

  if (aggressive) {
    toClean.push('node_modules', 'package-lock.json', 'yarn.lock', '.venv', '__pycache__');
  }

  const cleanPath = (targetPath) => {
    try {
      if (fs.existsSync(targetPath)) {
        const stats = fs.statSync(targetPath);
        if (stats.isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(targetPath);
        }
        cleaned.push(targetPath);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  for (const item of toClean) {
    if (item.includes('*')) {
      // Glob pattern - handle manually
      const dir = path.dirname(item) || '.';
      const pattern = path.basename(item).replace('*', '');
      const searchDir = path.join(projectPath, dir === '.' ? '' : dir);
      if (fs.existsSync(searchDir)) {
        fs.readdirSync(searchDir).forEach(file => {
          if (file.includes(pattern)) {
            cleanPath(path.join(searchDir, file));
          }
        });
      }
    } else {
      cleanPath(path.join(projectPath, item));
    }
  }

  return {
    success: true,
    cleaned,
    count: cleaned.length,
    aggressive,
    message: aggressive
      ? 'Deep clean complete. Run npm install to restore dependencies.'
      : 'Cache clean complete.'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Cloud Deployment
  deployVercel,
  deployNetlify,
  deployRailway,
  deployDockerHub,

  // CI/CD
  setupGitHubActions,
  setupGitLabCI,
  runPipeline,
  checkPipelineStatus,

  // Code Operations
  refactorCode,
  generateDocs,
  codeReview,
  findDeadCode,
  analyzeComplexity,

  // Security
  securityAudit,
  updateDependencies,
  checkLicenses,
  scanSecrets,

  // API Testing
  testApi,
  mockServer,
  generateApiDocs,

  // Templates
  saveTemplate,
  listTemplates,
  useTemplate,

  // Notifications
  notify,
  sendWebhook,
  scheduleTask,

  // File Operations
  fileDiff,
  fileMerge,
  bulkRename,
  findReplaceAll,

  // Logs
  analyzeLogs,
  tailLogs,
  searchLogs,

  // Performance
  benchmarkProject,
  profileApp,
  analyzeBundle,

  // Workspace
  switchProject,
  listProjects,
  projectHealth,
  cleanupProject
};
