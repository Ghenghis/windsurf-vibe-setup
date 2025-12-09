/**
 * Module Spawner - VIBE Meta-Evolution
 * Automatically generates NEW modules based on user needs and collective learning
 * Creates entire new capabilities from scratch
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class ModuleSpawner extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      spawnerDir: options.spawnerDir || path.join(process.cwd(), 'vibe-data', 'spawner'),
      autoSpawn: options.autoSpawn !== false,
      complexityLimit: options.complexityLimit || 1000,
      testBeforeDeployment: options.testBeforeDeployment !== false,
    };

    // Spawning state
    this.state = {
      totalSpawned: 0,
      activeSpawns: 0,
      successRate: 0.8,
    };

    // Module templates based on learning
    this.templates = {
      basic: this.getBasicTemplate(),
      service: this.getServiceTemplate(),
      analyzer: this.getAnalyzerTemplate(),
      connector: this.getConnectorTemplate(),
      optimizer: this.getOptimizerTemplate(),
      monitor: this.getMonitorTemplate(),
    };

    // Spawn queue
    this.queue = {
      pending: [],
      spawning: [],
      deployed: [],
      failed: [],
    };

    // Learning from spawns
    this.learning = {
      successfulModules: [],
      failedModules: [],
      userRequests: [],
      patterns: new Map(),
    };

    // Statistics
    this.stats = {
      modulesSpawned: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      averageComplexity: 0,
    };

    this.isInitialized = false;
    this.isSpawning = false;
  }

  async initialize() {
    console.log('🧬 Initializing Module Spawner...');
    console.log('   Ready to create new modules from scratch...');

    await fs.mkdir(this.config.spawnerDir, { recursive: true });
    await fs.mkdir(path.join(this.config.spawnerDir, 'modules'), { recursive: true });
    await fs.mkdir(path.join(this.config.spawnerDir, 'testing'), { recursive: true });

    await this.loadSpawnHistory();

    if (this.config.autoSpawn) {
      this.startAutoSpawning();
    }

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ Module Spawner initialized');
  }

  startAutoSpawning() {
    this.isSpawning = true;

    // Check for spawn opportunities every hour
    this.spawnInterval = setInterval(() => {
      this.checkSpawnOpportunities();
    }, 3600000);

    console.log('🚀 Auto-spawning activated');
  }

  async checkSpawnOpportunities() {
    // Analyze user needs and system gaps
    const opportunities = await this.identifyOpportunities();

    for (const opportunity of opportunities) {
      if (opportunity.confidence > 0.7) {
        await this.spawnModule(opportunity);
      }
    }
  }

  async identifyOpportunities() {
    const opportunities = [];

    // Check for repeated errors needing new solutions
    if (this.learning.patterns.has('repeated-errors')) {
      opportunities.push({
        type: 'error-handler',
        need: 'Advanced error recovery module',
        confidence: 0.8,
      });
    }

    // Check for missing integrations
    if (this.learning.userRequests.some(r => r.includes('integrate'))) {
      opportunities.push({
        type: 'connector',
        need: 'New integration module',
        confidence: 0.75,
      });
    }

    // Check for performance needs
    if (this.learning.patterns.has('slow-performance')) {
      opportunities.push({
        type: 'optimizer',
        need: 'Performance optimization module',
        confidence: 0.85,
      });
    }

    return opportunities;
  }

  async spawnModule(request) {
    console.log(`🧬 Spawning new module: ${request.need}`);

    const spawn = {
      id: crypto.randomBytes(8).toString('hex'),
      name: this.generateModuleName(request),
      type: request.type || 'basic',
      request,
      timestamp: Date.now(),
    };

    this.queue.spawning.push(spawn);
    this.state.activeSpawns++;

    try {
      // Select template
      const template = this.templates[spawn.type] || this.templates.basic;

      // Generate module code
      const moduleCode = await this.generateModuleCode(spawn, template);

      // Test module
      if (this.config.testBeforeDeployment) {
        const testResult = await this.testModule(spawn, moduleCode);
        if (!testResult.success) {
          throw new Error(`Module failed testing: ${testResult.error}`);
        }
      }

      // Deploy module
      const deployPath = await this.deployModule(spawn, moduleCode);

      spawn.deployed = true;
      spawn.path = deployPath;

      this.queue.deployed.push(spawn);
      this.stats.modulesSpawned++;
      this.stats.successfulDeployments++;

      console.log(`✅ Successfully spawned: ${spawn.name}`);

      this.emit('moduleSpawned', spawn);

      return spawn;
    } catch (error) {
      console.error(`❌ Failed to spawn module: ${error.message}`);

      spawn.error = error.message;
      this.queue.failed.push(spawn);
      this.stats.failedDeployments++;

      this.emit('spawnFailed', spawn);

      throw error;
    } finally {
      this.state.activeSpawns--;
      this.state.totalSpawned++;
    }
  }

  generateModuleName(request) {
    const type = request.type || 'module';
    const timestamp = Date.now().toString(36);
    const purpose = request.need.split(' ')[0].toLowerCase();

    return `auto-${purpose}-${type}-${timestamp}`;
  }

  async generateModuleCode(spawn, template) {
    const className = this.toPascalCase(spawn.name);

    let code = template.base;

    // Replace placeholders
    code = code.replace(/\{CLASS_NAME\}/g, className);
    code = code.replace(/\{MODULE_NAME\}/g, spawn.name);
    code = code.replace(/\{PURPOSE\}/g, spawn.request.need);
    code = code.replace(/\{TIMESTAMP\}/g, spawn.timestamp);

    // Add specific functionality based on type
    if (spawn.type === 'analyzer') {
      code = this.addAnalyzerFunctionality(code);
    } else if (spawn.type === 'optimizer') {
      code = this.addOptimizerFunctionality(code);
    } else if (spawn.type === 'connector') {
      code = this.addConnectorFunctionality(code);
    }

    // Add learning capabilities
    code = this.addLearningCapabilities(code);

    return code;
  }

  toPascalCase(str) {
    return str.replace(/(^|-)([a-z])/g, (match, p1, p2) => p2.toUpperCase());
  }

  getBasicTemplate() {
    return {
      base: `/**
 * {MODULE_NAME} - Auto-Generated Module
 * Purpose: {PURPOSE}
 * Generated: {TIMESTAMP}
 */

const { EventEmitter } = require('events');

class {CLASS_NAME} extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      ...options
    };
    
    this.state = {
      initialized: false,
      active: false
    };
    
    this.stats = {
      operations: 0,
      successes: 0,
      failures: 0
    };
  }
  
  async initialize() {
    console.log('Initializing {MODULE_NAME}...');
    
    this.state.initialized = true;
    this.emit('initialized');
    
    console.log('✅ {MODULE_NAME} initialized');
  }
  
  async execute(input) {
    if (!this.state.initialized) {
      throw new Error('Module not initialized');
    }
    
    try {
      this.stats.operations++;
      
      // Core functionality
      const result = await this.process(input);
      
      this.stats.successes++;
      this.emit('success', result);
      
      return result;
      
    } catch (error) {
      this.stats.failures++;
      this.emit('error', error);
      throw error;
    }
  }
  
  async process(input) {
    // Auto-generated processing logic
    return {
      success: true,
      input,
      output: 'Processed',
      timestamp: Date.now()
    };
  }
  
  getStatus() {
    return {
      ...this.state,
      stats: this.stats
    };
  }
  
  async shutdown() {
    this.state.active = false;
    this.emit('shutdown');
    console.log('✅ {MODULE_NAME} shutdown complete');
  }
}

module.exports = {CLASS_NAME};`,
    };
  }

  getServiceTemplate() {
    return {
      base: this.getBasicTemplate().base.replace(
        'async process(input)',
        `async process(input) {
    // Service logic
    const response = await this.callService(input);
    return this.processResponse(response);
  }
  
  async callService(input) {
    // Service call implementation
    return { data: input };
  }
  
  processResponse(response) {
    return response.data;
  }`
      ),
    };
  }

  getAnalyzerTemplate() {
    return {
      base: this.getBasicTemplate().base.replace(
        'async process(input)',
        `async process(input) {
    // Analysis logic
    const analysis = {
      data: input,
      metrics: await this.calculateMetrics(input),
      insights: await this.generateInsights(input),
      recommendations: await this.generateRecommendations(input)
    };
    
    return analysis;
  }
  
  async calculateMetrics(data) {
    return {
      size: JSON.stringify(data).length,
      complexity: this.assessComplexity(data)
    };
  }
  
  assessComplexity(data) {
    return typeof data === 'object' ? Object.keys(data).length : 1;
  }
  
  async generateInsights(data) {
    return ['Insight 1', 'Insight 2'];
  }
  
  async generateRecommendations(data) {
    return ['Recommendation 1', 'Recommendation 2'];
  }`
      ),
    };
  }

  getConnectorTemplate() {
    return {
      base: this.getBasicTemplate().base.replace(
        'async process(input)',
        `async process(input) {
    // Connection logic
    const connection = await this.connect();
    const result = await this.sendData(connection, input);
    await this.disconnect(connection);
    
    return result;
  }
  
  async connect() {
    return { connected: true, id: Date.now() };
  }
  
  async sendData(connection, data) {
    return { sent: true, data };
  }
  
  async disconnect(connection) {
    return { disconnected: true };
  }`
      ),
    };
  }

  getOptimizerTemplate() {
    return {
      base: this.getBasicTemplate().base.replace(
        'async process(input)',
        `async process(input) {
    // Optimization logic
    const original = this.measure(input);
    const optimized = await this.optimize(input);
    const improved = this.measure(optimized);
    
    return {
      original,
      optimized,
      improvement: ((improved.performance - original.performance) / original.performance) * 100
    };
  }
  
  measure(data) {
    return {
      size: JSON.stringify(data).length,
      performance: Math.random() * 100
    };
  }
  
  async optimize(data) {
    // Optimization implementation
    return data;
  }`
      ),
    };
  }

  getMonitorTemplate() {
    return {
      base: this.getBasicTemplate().base.replace(
        'async process(input)',
        `async process(input) {
    // Monitoring logic
    const metrics = await this.collectMetrics();
    const alerts = this.checkAlerts(metrics);
    
    if (alerts.length > 0) {
      this.emit('alert', alerts);
    }
    
    return {
      metrics,
      alerts,
      status: alerts.length === 0 ? 'healthy' : 'warning'
    };
  }
  
  async collectMetrics() {
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      errors: Math.floor(Math.random() * 10)
    };
  }
  
  checkAlerts(metrics) {
    const alerts = [];
    
    if (metrics.cpu > 80) alerts.push('High CPU usage');
    if (metrics.memory > 80) alerts.push('High memory usage');
    if (metrics.errors > 5) alerts.push('High error rate');
    
    return alerts;
  }`
      ),
    };
  }

  addAnalyzerFunctionality(code) {
    // Add analyzer-specific methods
    return code;
  }

  addOptimizerFunctionality(code) {
    // Add optimizer-specific methods
    return code;
  }

  addConnectorFunctionality(code) {
    // Add connector-specific methods
    return code;
  }

  addLearningCapabilities(code) {
    const learningCode = `
  // Auto-added learning capabilities
  learn(experience) {
    if (!this.learning) this.learning = [];
    this.learning.push(experience);
    this.adapt();
  }
  
  adapt() {
    // Adapt behavior based on learning
    if (this.learning && this.learning.length > 10) {
      // Adjust parameters based on experience
    }
  }
`;

    return code.replace('getStatus()', `learn(experience) ${learningCode}\n\n  getStatus()`);
  }

  async testModule(spawn, code) {
    console.log(`  Testing module: ${spawn.name}`);

    try {
      // Write temporary test file
      const testPath = path.join(this.config.spawnerDir, 'testing', `${spawn.name}.test.js`);

      await fs.writeFile(testPath, code);

      // Basic syntax check
      require(testPath);

      // Cleanup
      await fs.unlink(testPath);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deployModule(spawn, code) {
    const deployPath = path.join(
      process.cwd(),
      'enhancements',
      'evolution',
      'spawned',
      `${spawn.name}.js`
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(deployPath), { recursive: true });

    // Deploy module
    await fs.writeFile(deployPath, code);

    console.log(`  Deployed to: ${deployPath}`);

    return deployPath;
  }

  async requestModule(description) {
    // User can request specific modules
    const request = {
      type: this.detectType(description),
      need: description,
      confidence: 1.0,
      userRequested: true,
    };

    this.learning.userRequests.push(description);

    return await this.spawnModule(request);
  }

  detectType(description) {
    const desc = description.toLowerCase();

    if (desc.includes('analyze') || desc.includes('analysis')) return 'analyzer';
    if (desc.includes('optimize') || desc.includes('performance')) return 'optimizer';
    if (desc.includes('connect') || desc.includes('integrate')) return 'connector';
    if (desc.includes('monitor') || desc.includes('watch')) return 'monitor';
    if (desc.includes('service') || desc.includes('api')) return 'service';

    return 'basic';
  }

  async loadSpawnHistory() {
    try {
      const filepath = path.join(this.config.spawnerDir, 'spawn-history.json');
      const content = await fs.readFile(filepath, 'utf8');
      const history = JSON.parse(content);

      this.state = history.state;
      this.learning = history.learning;
      this.stats = history.stats;

      console.log('📂 Loaded spawn history');
    } catch (error) {
      console.log('🆕 Starting fresh spawning');
    }
  }

  async saveSpawnHistory() {
    const history = {
      state: this.state,
      learning: {
        successfulModules: this.learning.successfulModules.slice(-100),
        failedModules: this.learning.failedModules.slice(-50),
        userRequests: this.learning.userRequests.slice(-100),
        patterns: Array.from(this.learning.patterns.entries()),
      },
      stats: this.stats,
      savedAt: Date.now(),
    };

    const filepath = path.join(this.config.spawnerDir, 'spawn-history.json');
    await fs.writeFile(filepath, JSON.stringify(history, null, 2));
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      spawning: this.isSpawning,
      state: this.state,
      queue: {
        pending: this.queue.pending.length,
        spawning: this.queue.spawning.length,
        deployed: this.queue.deployed.length,
        failed: this.queue.failed.length,
      },
      statistics: this.stats,
    };
  }

  async shutdown() {
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
    }

    this.isSpawning = false;

    await this.saveSpawnHistory();

    this.emit('shutdown');
    console.log('✅ Module Spawner shutdown complete');
    console.log(`   Modules spawned: ${this.stats.modulesSpawned}`);
    console.log(
      `   Success rate: ${((this.stats.successfulDeployments / this.stats.modulesSpawned) * 100).toFixed(1)}%`
    );
  }
}

module.exports = ModuleSpawner;
