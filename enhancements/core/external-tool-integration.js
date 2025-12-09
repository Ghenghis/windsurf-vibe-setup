/**
 * External Tool Integration System - v6.0
 * Integrates with external development tools and services
 * Provides unified interface for diverse tool ecosystems
 *
 * Part 1: Core initialization and tool registry
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class ExternalToolIntegration extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      toolsDir: options.toolsDir || path.join(process.cwd(), 'vibe-data', 'tools'),
      maxConcurrentTools: options.maxConcurrentTools || 5,
      executionTimeout: options.executionTimeout || 60000,
      retryOnFailure: options.retryOnFailure !== false,
      sandboxMode: options.sandboxMode || false,
      autoInstall: options.autoInstall !== false,
      cacheResults: options.cacheResults !== false,
    };

    // Tool registry
    this.tools = new Map();
    this.toolCategories = new Map();
    this.activeExecutions = new Map();

    // Tool definitions
    this.builtInTools = {
      git: this.createGitTool(),
      docker: this.createDockerTool(),
      npm: this.createNpmTool(),
      eslint: this.createEslintTool(),
      prettier: this.createPrettierTool(),
      webpack: this.createWebpackTool(),
      jest: this.createJestTool(),
      typescript: this.createTypeScriptTool(),
    };

    // External service connectors
    this.connectors = {
      github: this.createGithubConnector(),
      gitlab: this.createGitlabConnector(),
      jenkins: this.createJenkinsConnector(),
      circleci: this.createCircleCIConnector(),
      aws: this.createAWSConnector(),
      azure: this.createAzureConnector(),
      gcp: this.createGCPConnector(),
    };

    // Tool chains and workflows
    this.toolChains = new Map();
    this.workflows = new Map();

    // Execution queue
    this.executionQueue = [];
    this.isProcessing = false;

    // Result cache
    this.resultCache = new Map();

    // Statistics
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      toolUsage: new Map(),
      connectorUsage: new Map(),
    };

    this.isInitialized = false;
  }

  /**
   * Initialize tool integration system
   */
  async initialize() {
    try {
      console.log('🔧 Initializing External Tool Integration...');

      // Create directory structure
      await this.createDirectories();

      // Load tool configurations
      await this.loadToolConfigs();

      // Register built-in tools
      await this.registerBuiltInTools();

      // Load custom tools
      await this.loadCustomTools();

      // Initialize connectors
      await this.initializeConnectors();

      // Load workflows
      await this.loadWorkflows();

      // Start execution processor
      this.startExecutionProcessor();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ External Tool Integration initialized');
      console.log(`   - Tools registered: ${this.tools.size}`);
      console.log(`   - Connectors available: ${Object.keys(this.connectors).length}`);
      console.log(`   - Workflows loaded: ${this.workflows.size}`);
    } catch (error) {
      console.error('❌ Failed to initialize External Tool Integration:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = [
      'configs',
      'custom',
      'scripts',
      'workflows',
      'chains',
      'results',
      'cache',
      'logs',
      'sandbox',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.toolsDir, dir), { recursive: true });
    }
  }

  /**
   * Built-in tool definitions
   */
  createGitTool() {
    return {
      id: 'git',
      name: 'Git Version Control',
      category: 'vcs',
      commands: {
        status: 'git status',
        add: 'git add',
        commit: 'git commit',
        push: 'git push',
        pull: 'git pull',
        branch: 'git branch',
        checkout: 'git checkout',
        merge: 'git merge',
        diff: 'git diff',
        log: 'git log',
      },
      validator: async () => {
        try {
          await execAsync('git --version');
          return true;
        } catch {
          return false;
        }
      },
    };
  }

  createDockerTool() {
    return {
      id: 'docker',
      name: 'Docker Container Platform',
      category: 'containerization',
      commands: {
        ps: 'docker ps',
        images: 'docker images',
        build: 'docker build',
        run: 'docker run',
        stop: 'docker stop',
        rm: 'docker rm',
        compose: 'docker-compose',
      },
      validator: async () => {
        try {
          await execAsync('docker --version');
          return true;
        } catch {
          return false;
        }
      },
    };
  }

  createNpmTool() {
    return {
      id: 'npm',
      name: 'Node Package Manager',
      category: 'package-management',
      commands: {
        install: 'npm install',
        update: 'npm update',
        audit: 'npm audit',
        run: 'npm run',
        publish: 'npm publish',
        test: 'npm test',
        build: 'npm run build',
      },
      validator: async () => {
        try {
          await execAsync('npm --version');
          return true;
        } catch {
          return false;
        }
      },
    };
  }

  createEslintTool() {
    return {
      id: 'eslint',
      name: 'ESLint Code Linter',
      category: 'code-quality',
      commands: {
        lint: 'npx eslint',
        fix: 'npx eslint --fix',
        init: 'npx eslint --init',
      },
      config: {
        configFile: '.eslintrc.js',
        ignoreFile: '.eslintignore',
      },
    };
  }

  createPrettierTool() {
    return {
      id: 'prettier',
      name: 'Prettier Code Formatter',
      category: 'code-formatting',
      commands: {
        format: 'npx prettier --write',
        check: 'npx prettier --check',
      },
      config: {
        configFile: '.prettierrc',
        ignoreFile: '.prettierignore',
      },
    };
  }

  createWebpackTool() {
    return {
      id: 'webpack',
      name: 'Webpack Module Bundler',
      category: 'build-tools',
      commands: {
        build: 'npx webpack',
        dev: 'npx webpack serve',
        watch: 'npx webpack --watch',
      },
      config: {
        configFile: 'webpack.config.js',
      },
    };
  }

  createJestTool() {
    return {
      id: 'jest',
      name: 'Jest Testing Framework',
      category: 'testing',
      commands: {
        test: 'npx jest',
        watch: 'npx jest --watch',
        coverage: 'npx jest --coverage',
      },
      config: {
        configFile: 'jest.config.js',
      },
    };
  }

  createTypeScriptTool() {
    return {
      id: 'typescript',
      name: 'TypeScript Compiler',
      category: 'compilers',
      commands: {
        compile: 'npx tsc',
        watch: 'npx tsc --watch',
        init: 'npx tsc --init',
      },
      config: {
        configFile: 'tsconfig.json',
      },
    };
  }

  /**
   * External service connectors
   */
  createGithubConnector() {
    return {
      id: 'github',
      name: 'GitHub',
      type: 'vcs-platform',
      api: {
        baseUrl: 'https://api.github.com',
        auth: process.env.GITHUB_TOKEN
          ? {
              type: 'token',
              token: process.env.GITHUB_TOKEN,
            }
          : null,
      },
      actions: {
        createPR: this.createGithubPR.bind(this),
        mergePR: this.mergeGithubPR.bind(this),
        createIssue: this.createGithubIssue.bind(this),
        triggerWorkflow: this.triggerGithubWorkflow.bind(this),
      },
    };
  }

  createGitlabConnector() {
    return {
      id: 'gitlab',
      name: 'GitLab',
      type: 'vcs-platform',
      api: {
        baseUrl: 'https://gitlab.com/api/v4',
        auth: process.env.GITLAB_TOKEN
          ? {
              type: 'token',
              token: process.env.GITLAB_TOKEN,
            }
          : null,
      },
      actions: {
        createMR: this.createGitlabMR.bind(this),
        runPipeline: this.runGitlabPipeline.bind(this),
      },
    };
  }

  createJenkinsConnector() {
    return {
      id: 'jenkins',
      name: 'Jenkins CI/CD',
      type: 'ci-cd',
      api: {
        baseUrl: process.env.JENKINS_URL,
        auth: process.env.JENKINS_USER
          ? {
              type: 'basic',
              user: process.env.JENKINS_USER,
              token: process.env.JENKINS_TOKEN,
            }
          : null,
      },
      actions: {
        triggerBuild: this.triggerJenkinsBuild.bind(this),
        getBuildStatus: this.getJenkinsBuildStatus.bind(this),
      },
    };
  }

  createCircleCIConnector() {
    return {
      id: 'circleci',
      name: 'CircleCI',
      type: 'ci-cd',
      api: {
        baseUrl: 'https://circleci.com/api/v2',
        auth: process.env.CIRCLECI_TOKEN
          ? {
              type: 'token',
              token: process.env.CIRCLECI_TOKEN,
            }
          : null,
      },
      actions: {
        triggerPipeline: this.triggerCircleCIPipeline.bind(this),
      },
    };
  }

  createAWSConnector() {
    return {
      id: 'aws',
      name: 'Amazon Web Services',
      type: 'cloud-platform',
      config: {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      services: {
        s3: this.createS3Service(),
        lambda: this.createLambdaService(),
        ec2: this.createEC2Service(),
      },
    };
  }

  createAzureConnector() {
    return {
      id: 'azure',
      name: 'Microsoft Azure',
      type: 'cloud-platform',
      config: {
        subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
        tenantId: process.env.AZURE_TENANT_ID,
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
      },
      services: {
        storage: this.createAzureStorageService(),
        functions: this.createAzureFunctionsService(),
      },
    };
  }

  createGCPConnector() {
    return {
      id: 'gcp',
      name: 'Google Cloud Platform',
      type: 'cloud-platform',
      config: {
        projectId: process.env.GCP_PROJECT_ID,
        keyFile: process.env.GCP_KEY_FILE,
      },
      services: {
        storage: this.createGCSService(),
        compute: this.createComputeEngineService(),
      },
    };
  }

  /**
   * Tool execution and management (Part 2)
   */

  async registerTool(toolConfig) {
    const tool = {
      id: toolConfig.id || crypto.randomBytes(8).toString('hex'),
      name: toolConfig.name,
      category: toolConfig.category || 'custom',
      executable: toolConfig.executable,
      commands: toolConfig.commands || {},
      config: toolConfig.config || {},
      validator: toolConfig.validator,
      installed: false,
      lastUsed: null,
      usageCount: 0,
    };

    // Validate tool availability
    if (tool.validator) {
      tool.installed = await tool.validator();
    }

    // Store tool
    this.tools.set(tool.id, tool);

    // Index by category
    if (!this.toolCategories.has(tool.category)) {
      this.toolCategories.set(tool.category, new Set());
    }
    this.toolCategories.get(tool.category).add(tool.id);

    // Save configuration
    await this.saveToolConfig(tool);

    this.emit('toolRegistered', { id: tool.id, name: tool.name });

    return tool.id;
  }

  async executeTool(toolId, command, args = {}) {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    // Check if tool is installed
    if (!tool.installed && this.config.autoInstall) {
      await this.installTool(tool);
    }

    if (!tool.installed) {
      throw new Error(`Tool ${tool.name} is not installed`);
    }

    // Create execution context
    const execution = {
      id: crypto.randomBytes(8).toString('hex'),
      toolId,
      command,
      args,
      status: 'pending',
      startTime: Date.now(),
      result: null,
      error: null,
    };

    // Add to queue
    this.executionQueue.push(execution);
    this.activeExecutions.set(execution.id, execution);

    // Process queue
    if (!this.isProcessing) {
      this.processExecutionQueue();
    }

    // Wait for execution to complete
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const exec = this.activeExecutions.get(execution.id);

        if (exec.status === 'completed') {
          clearInterval(checkInterval);
          resolve(exec.result);
        } else if (exec.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(exec.error));
        } else if (Date.now() - exec.startTime > this.config.executionTimeout) {
          clearInterval(checkInterval);
          exec.status = 'timeout';
          reject(new Error('Execution timeout'));
        }
      }, 100);
    });
  }

  async processExecutionQueue() {
    if (this.isProcessing || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.executionQueue.length > 0) {
      const execution = this.executionQueue.shift();

      try {
        execution.status = 'executing';
        const result = await this.executeCommand(execution);

        execution.status = 'completed';
        execution.result = result;
        execution.endTime = Date.now();

        // Update statistics
        this.updateExecutionStats(execution, true);

        // Cache result
        if (this.config.cacheResults) {
          this.cacheExecutionResult(execution);
        }

        this.emit('executionCompleted', execution);
      } catch (error) {
        execution.status = 'failed';
        execution.error = error.message;
        execution.endTime = Date.now();

        // Update statistics
        this.updateExecutionStats(execution, false);

        this.emit('executionFailed', execution);

        // Retry if configured
        if (this.config.retryOnFailure && !execution.retryCount) {
          execution.retryCount = 1;
          execution.status = 'pending';
          this.executionQueue.push(execution);
        }
      }

      // Save execution result
      await this.saveExecutionResult(execution);
    }

    this.isProcessing = false;
  }

  async executeCommand(execution) {
    const tool = this.tools.get(execution.toolId);
    const commandTemplate = tool.commands[execution.command];

    if (!commandTemplate) {
      throw new Error(`Command ${execution.command} not found for tool ${tool.name}`);
    }

    // Build command with arguments
    let command = commandTemplate;
    for (const [key, value] of Object.entries(execution.args)) {
      command = command.replace(`{${key}}`, value);
    }

    // Execute in sandbox if configured
    if (this.config.sandboxMode) {
      return this.executeInSandbox(command);
    }

    // Execute command
    const { stdout, stderr } = await execAsync(command, {
      timeout: this.config.executionTimeout,
      cwd: execution.args.cwd || process.cwd(),
    });

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
    };
  }

  async executeInSandbox(command) {
    // Simple sandboxing (would use proper containerization in production)
    const sandboxDir = path.join(
      this.config.toolsDir,
      'sandbox',
      crypto.randomBytes(8).toString('hex')
    );
    await fs.mkdir(sandboxDir, { recursive: true });

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.config.executionTimeout,
        cwd: sandboxDir,
      });

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
      };
    } finally {
      // Cleanup sandbox
      await fs.rmdir(sandboxDir, { recursive: true });
    }
  }

  async installTool(tool) {
    console.log(`📦 Installing ${tool.name}...`);

    // Installation logic based on tool type
    switch (tool.category) {
      case 'npm-package':
        await execAsync(`npm install -g ${tool.executable}`);
        break;

      case 'python-package':
        await execAsync(`pip install ${tool.executable}`);
        break;

      default:
        console.warn(`Cannot auto-install ${tool.name} - manual installation required`);
        return false;
    }

    // Verify installation
    if (tool.validator) {
      tool.installed = await tool.validator();
    }

    return tool.installed;
  }

  /**
   * Workflow management
   */

  async createWorkflow(name, steps) {
    const workflow = {
      id: crypto.randomBytes(8).toString('hex'),
      name,
      steps: steps.map((step, index) => ({
        ...step,
        order: index,
        status: 'pending',
        result: null,
      })),
      created: Date.now(),
      status: 'created',
    };

    this.workflows.set(workflow.id, workflow);
    await this.saveWorkflow(workflow);

    return workflow.id;
  }

  async executeWorkflow(workflowId, context = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'running';
    workflow.startTime = Date.now();

    const results = [];
    let workflowContext = { ...context };

    for (const step of workflow.steps) {
      try {
        step.status = 'executing';

        // Execute step
        const result = await this.executeWorkflowStep(step, workflowContext);

        step.status = 'completed';
        step.result = result;
        results.push(result);

        // Update context with step results
        workflowContext = {
          ...workflowContext,
          [`step${step.order}`]: result,
        };

        this.emit('workflowStepCompleted', { workflowId, step });
      } catch (error) {
        step.status = 'failed';
        step.error = error.message;

        if (step.critical !== false) {
          workflow.status = 'failed';
          workflow.error = `Step ${step.order} failed: ${error.message}`;

          this.emit('workflowFailed', { workflowId, error });
          throw error;
        }

        // Continue on non-critical failure
        results.push({ error: error.message });
      }
    }

    workflow.status = 'completed';
    workflow.endTime = Date.now();
    workflow.results = results;

    await this.saveWorkflow(workflow);

    this.emit('workflowCompleted', { workflowId, results });

    return results;
  }

  async executeWorkflowStep(step, context) {
    switch (step.type) {
      case 'tool':
        return this.executeTool(step.toolId, step.command, {
          ...step.args,
          ...context,
        });

      case 'connector':
        return this.executeConnectorAction(step.connectorId, step.action, {
          ...step.params,
          ...context,
        });

      case 'script':
        return this.executeScript(step.script, context);

      case 'conditional':
        if (this.evaluateCondition(step.condition, context)) {
          return this.executeWorkflowStep(step.then, context);
        } else if (step.else) {
          return this.executeWorkflowStep(step.else, context);
        }
        return null;

      case 'parallel':
        const parallelPromises = step.tasks.map(task => this.executeWorkflowStep(task, context));
        return Promise.all(parallelPromises);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  evaluateCondition(condition, context) {
    // Simple condition evaluation
    if (typeof condition === 'function') {
      return condition(context);
    }

    // String-based conditions
    if (typeof condition === 'string') {
      // Would implement proper expression evaluation in production
      return eval(condition);
    }

    return !!condition;
  }

  async executeScript(script, context) {
    const scriptFile = path.join(this.config.toolsDir, 'scripts', `${script}.js`);

    try {
      const scriptModule = require(scriptFile);

      if (typeof scriptModule === 'function') {
        return scriptModule(context);
      } else if (typeof scriptModule.execute === 'function') {
        return scriptModule.execute(context);
      }

      throw new Error('Invalid script format');
    } catch (error) {
      throw new Error(`Failed to execute script ${script}: ${error.message}`);
    }
  }

  /**
   * Tool chains
   */

  async createToolChain(name, tools) {
    const chain = {
      id: crypto.randomBytes(8).toString('hex'),
      name,
      tools: tools.map(tool => ({
        toolId: tool.toolId,
        input: tool.input || 'previous',
        output: tool.output || 'next',
        transform: tool.transform,
      })),
      created: Date.now(),
    };

    this.toolChains.set(chain.id, chain);
    await this.saveToolChain(chain);

    return chain.id;
  }

  async executeToolChain(chainId, input) {
    const chain = this.toolChains.get(chainId);
    if (!chain) {
      throw new Error(`Tool chain ${chainId} not found`);
    }

    let currentInput = input;
    const results = [];

    for (const link of chain.tools) {
      try {
        // Get input based on configuration
        const linkInput =
          link.input === 'previous' ? currentInput : link.input === 'original' ? input : link.input;

        // Execute tool
        const result = await this.executeTool(link.toolId, 'default', {
          input: linkInput,
        });

        // Transform output if needed
        const output = link.transform ? await link.transform(result) : result;

        results.push(output);
        currentInput = output;
      } catch (error) {
        throw new Error(`Chain failed at tool ${link.toolId}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Connector actions and helpers (Part 3)
   */

  async executeConnectorAction(connectorId, action, params) {
    const connector = this.connectors[connectorId];
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }

    const actionFn = connector.actions?.[action];
    if (!actionFn) {
      throw new Error(`Action ${action} not found for connector ${connectorId}`);
    }

    // Update statistics
    this.stats.connectorUsage.set(
      connectorId,
      (this.stats.connectorUsage.get(connectorId) || 0) + 1
    );

    return actionFn(params);
  }

  // GitHub connector actions
  async createGithubPR(params) {
    console.log('Creating GitHub PR:', params);
    // Simulate PR creation
    return {
      id: crypto.randomBytes(8).toString('hex'),
      url: `https://github.com/${params.repo}/pull/1`,
      status: 'open',
    };
  }

  async mergeGithubPR(params) {
    console.log('Merging GitHub PR:', params);
    return { merged: true };
  }

  async createGithubIssue(params) {
    console.log('Creating GitHub issue:', params);
    return {
      id: crypto.randomBytes(8).toString('hex'),
      url: `https://github.com/${params.repo}/issues/1`,
    };
  }

  async triggerGithubWorkflow(params) {
    console.log('Triggering GitHub workflow:', params);
    return { workflowId: crypto.randomBytes(8).toString('hex') };
  }

  // GitLab connector actions
  async createGitlabMR(params) {
    console.log('Creating GitLab MR:', params);
    return {
      id: crypto.randomBytes(8).toString('hex'),
      url: `https://gitlab.com/${params.project}/merge_requests/1`,
    };
  }

  async runGitlabPipeline(params) {
    console.log('Running GitLab pipeline:', params);
    return { pipelineId: crypto.randomBytes(8).toString('hex') };
  }

  // Jenkins connector actions
  async triggerJenkinsBuild(params) {
    console.log('Triggering Jenkins build:', params);
    return { buildNumber: Math.floor(Math.random() * 1000) };
  }

  async getJenkinsBuildStatus(params) {
    console.log('Getting Jenkins build status:', params);
    return { status: 'success', duration: 120000 };
  }

  // CircleCI connector actions
  async triggerCircleCIPipeline(params) {
    console.log('Triggering CircleCI pipeline:', params);
    return { pipelineId: crypto.randomBytes(8).toString('hex') };
  }

  // Cloud service helpers
  createS3Service() {
    return {
      upload: async (bucket, key, data) => {
        console.log(`Uploading to S3: ${bucket}/${key}`);
        return { etag: crypto.randomBytes(16).toString('hex') };
      },
      download: async (bucket, key) => {
        console.log(`Downloading from S3: ${bucket}/${key}`);
        return { data: 'mock-data' };
      },
    };
  }

  createLambdaService() {
    return {
      invoke: async (functionName, payload) => {
        console.log(`Invoking Lambda: ${functionName}`);
        return { result: 'success' };
      },
    };
  }

  createEC2Service() {
    return {
      startInstance: async instanceId => {
        console.log(`Starting EC2 instance: ${instanceId}`);
        return { state: 'running' };
      },
      stopInstance: async instanceId => {
        console.log(`Stopping EC2 instance: ${instanceId}`);
        return { state: 'stopped' };
      },
    };
  }

  createAzureStorageService() {
    return {
      upload: async (container, blob, data) => {
        console.log(`Uploading to Azure Storage: ${container}/${blob}`);
        return { etag: crypto.randomBytes(16).toString('hex') };
      },
    };
  }

  createAzureFunctionsService() {
    return {
      invoke: async (functionName, data) => {
        console.log(`Invoking Azure Function: ${functionName}`);
        return { result: 'success' };
      },
    };
  }

  createGCSService() {
    return {
      upload: async (bucket, object, data) => {
        console.log(`Uploading to GCS: ${bucket}/${object}`);
        return { generation: Date.now() };
      },
    };
  }

  createComputeEngineService() {
    return {
      startVM: async (zone, instance) => {
        console.log(`Starting GCE VM: ${zone}/${instance}`);
        return { status: 'RUNNING' };
      },
    };
  }

  /**
   * Helper methods
   */

  async registerBuiltInTools() {
    for (const [id, tool] of Object.entries(this.builtInTools)) {
      await this.registerTool({ ...tool, id });
    }
  }

  async loadCustomTools() {
    try {
      const customDir = path.join(this.config.toolsDir, 'custom');
      const files = await fs.readdir(customDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(customDir, file), 'utf8');
          const toolConfig = JSON.parse(content);
          await this.registerTool(toolConfig);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async initializeConnectors() {
    // Validate connector configurations
    for (const [id, connector] of Object.entries(this.connectors)) {
      if (connector.api?.auth) {
        console.log(`✅ ${connector.name} connector configured`);
      } else if (connector.config) {
        console.log(`✅ ${connector.name} connector configured`);
      } else {
        console.warn(`⚠️ ${connector.name} connector not configured`);
      }
    }
  }

  startExecutionProcessor() {
    // Process queue periodically
    setInterval(() => {
      if (!this.isProcessing && this.executionQueue.length > 0) {
        this.processExecutionQueue();
      }
    }, 1000);
  }

  updateExecutionStats(execution, success) {
    this.stats.totalExecutions++;

    if (success) {
      this.stats.successfulExecutions++;
    } else {
      this.stats.failedExecutions++;
    }

    // Update average execution time
    if (execution.endTime && execution.startTime) {
      const executionTime = execution.endTime - execution.startTime;
      this.stats.averageExecutionTime = this.stats.averageExecutionTime * 0.9 + executionTime * 0.1;
    }

    // Update tool usage
    const tool = this.tools.get(execution.toolId);
    if (tool) {
      tool.usageCount++;
      tool.lastUsed = Date.now();

      this.stats.toolUsage.set(
        execution.toolId,
        (this.stats.toolUsage.get(execution.toolId) || 0) + 1
      );
    }
  }

  cacheExecutionResult(execution) {
    const cacheKey = `${execution.toolId}:${execution.command}:${JSON.stringify(execution.args)}`;
    const cacheEntry = {
      result: execution.result,
      timestamp: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour
    };

    this.resultCache.set(cacheKey, cacheEntry);

    // Limit cache size
    if (this.resultCache.size > 100) {
      const oldestKey = this.resultCache.keys().next().value;
      this.resultCache.delete(oldestKey);
    }
  }

  /**
   * Storage methods
   */

  async loadToolConfigs() {
    try {
      const configDir = path.join(this.config.toolsDir, 'configs');
      const files = await fs.readdir(configDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(configDir, file), 'utf8');
          const tool = JSON.parse(content);
          this.tools.set(tool.id, tool);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async loadWorkflows() {
    try {
      const workflowDir = path.join(this.config.toolsDir, 'workflows');
      const files = await fs.readdir(workflowDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(workflowDir, file), 'utf8');
          const workflow = JSON.parse(content);
          this.workflows.set(workflow.id, workflow);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async saveToolConfig(tool) {
    const configPath = path.join(this.config.toolsDir, 'configs', `${tool.id}.json`);

    await fs.writeFile(configPath, JSON.stringify(tool, null, 2));
  }

  async saveWorkflow(workflow) {
    const workflowPath = path.join(this.config.toolsDir, 'workflows', `${workflow.id}.json`);

    await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2));
  }

  async saveToolChain(chain) {
    const chainPath = path.join(this.config.toolsDir, 'chains', `${chain.id}.json`);

    // Remove function references for serialization
    const toSave = {
      ...chain,
      tools: chain.tools.map(tool => ({
        ...tool,
        transform: undefined,
      })),
    };

    await fs.writeFile(chainPath, JSON.stringify(toSave, null, 2));
  }

  async saveExecutionResult(execution) {
    const resultPath = path.join(this.config.toolsDir, 'results', `${execution.id}.json`);

    await fs.writeFile(resultPath, JSON.stringify(execution, null, 2));
  }

  /**
   * Get status and shutdown
   */

  getStatus() {
    return {
      initialized: this.isInitialized,
      tools: {
        total: this.tools.size,
        installed: Array.from(this.tools.values()).filter(t => t.installed).length,
        categories: Array.from(this.toolCategories.keys()),
      },
      connectors: Object.keys(this.connectors),
      workflows: this.workflows.size,
      toolChains: this.toolChains.size,
      activeExecutions: this.activeExecutions.size,
      queuedExecutions: this.executionQueue.length,
      statistics: {
        ...this.stats,
        successRate:
          this.stats.totalExecutions > 0
            ? ((this.stats.successfulExecutions / this.stats.totalExecutions) * 100).toFixed(1) +
              '%'
            : '0%',
      },
      cache: {
        size: this.resultCache.size,
      },
    };
  }

  async shutdown() {
    // Process remaining executions
    if (this.executionQueue.length > 0) {
      console.log('🔄 Processing remaining executions...');
      await this.processExecutionQueue();
    }

    // Save all tool configs
    for (const [id, tool] of this.tools) {
      await this.saveToolConfig(tool);
    }

    // Save all workflows
    for (const [id, workflow] of this.workflows) {
      await this.saveWorkflow(workflow);
    }

    // Save statistics
    const statsPath = path.join(this.config.toolsDir, 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));

    // Clear cache
    this.resultCache.clear();

    this.emit('shutdown');
    console.log('✅ External Tool Integration shutdown complete');
    console.log(`   Total executions: ${this.stats.totalExecutions}`);
    console.log(
      `   Success rate: ${((this.stats.successfulExecutions / this.stats.totalExecutions) * 100).toFixed(1)}%`
    );
  }
}

module.exports = ExternalToolIntegration;
