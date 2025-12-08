/**
 * Anthropic Harness Controller
 * Core orchestration for long-running agent sessions
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { HttpClient } = require('../utils/http-client');

class AnthropicHarness extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: process.env.HARNESS_ENABLED === 'true' || config.enabled || false,
      maxSessions: parseInt(process.env.HARNESS_MAX_SESSIONS) || config.maxSessions || 100,
      maxHoursRuntime: parseInt(process.env.HARNESS_MAX_HOURS) || config.maxHoursRuntime || 24,
      targetTestPassRate: parseFloat(process.env.HARNESS_TARGET_PASS_RATE) || config.targetTestPassRate || 0.95,
      regressTestCount: parseInt(process.env.HARNESS_REGRESSION_TEST_COUNT) || config.regressTestCount || 5,
      contextWindowLimit: config.contextWindowLimit || 100000,
      checkpointInterval: parseInt(process.env.HARNESS_CHECKPOINT_INTERVAL) || config.checkpointInterval || 10,
      ...config
    };
    
    // Core state
    this.currentSession = 0;
    this.isRunning = false;
    this.startTime = null;
    this.projectDir = null;
    
    // Artifacts
    this.artifacts = {
      appSpec: null,
      featureList: null,
      initScript: null,
      progressFile: null,
      gitRepo: null
    };
    
    // Metrics
    this.metrics = {
      totalSessions: 0,
      featuresImplemented: 0,
      testsPassingRate: 0,
      tokensUsed: 0,
      errorsEncountered: 0,
      startTime: null,
      endTime: null
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION ENFORCEMENT (NO API KEYS ALLOWED!)
  // ═══════════════════════════════════════════════════════════════════════
  
  async enforceSubscriptionOnly() {
    // Block ALL API key usage - only allow Claude subscription
    const blockedVars = [
      'ANTHROPIC_API_KEY',
      'OPENAI_API_KEY', 
      'CLAUDE_API_KEY',
      'API_KEY'
    ];
    
    for (const varName of blockedVars) {
      if (process.env[varName]) {
        console.error(`❌ ERROR: API keys are NOT allowed!`);
        console.error(`Found ${varName} in environment.`);
        console.error(`This system ONLY uses Claude subscription ($20/month).`);
        console.error(`Remove all API keys and use: claude setup-token`);
        throw new Error('API keys blocked. Use Claude subscription only!');
      }
    }
    
    // Ensure Claude subscription token exists
    if (!process.env.CLAUDE_TOKEN) {
      console.log('\n⚠️ Claude subscription token not found!');
      console.log('Setting up Claude subscription (Cole Medin method)...\n');
      
      const { setupClaudeSubscription } = require('./claude-subscription');
      const token = await setupClaudeSubscription();
      
      if (!token && !process.env.CLAUDE_TOKEN) {
        throw new Error('Claude subscription setup required. No API keys allowed!');
      }
    }
    
    console.log('✅ Using Claude subscription - NO API CHARGES!');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════
  
  async initialize(projectSpec) {
    if (!this.config.enabled) {
      throw new Error('Harness is disabled. Enable in config or set HARNESS_ENABLED=true');
    }
    
    // ENFORCE: Only Claude subscription, NEVER API keys
    await this.enforceSubscriptionOnly();
    
    console.log('🎯 Initializing Anthropic Harness...');
    console.log('💰 Using Claude SUBSCRIPTION ($20/month) - NO API CHARGES!');
    console.log(`   Max Sessions: ${this.config.maxSessions}`);
    console.log(`   Max Runtime: ${this.config.maxHoursRuntime} hours`);
    console.log(`   Target Pass Rate: ${this.config.targetTestPassRate * 100}%`);
    
    // Create project directory
    const timestamp = Date.now();
    this.projectDir = path.join(process.cwd(), 'harness-projects', `project-${timestamp}`);
    await fs.mkdir(this.projectDir, { recursive: true });
    
    // Load or create app spec
    this.artifacts.appSpec = await this.loadAppSpec(projectSpec);
    
    // Save app spec to project
    await fs.writeFile(
      path.join(this.projectDir, 'app-spec.md'),
      this.artifacts.appSpec
    );
    
    // Initialize git repository
    await this.initGitRepo();
    
    // Set up monitoring
    this.startMonitoring();
    
    this.isRunning = true;
    this.startTime = Date.now();
    this.metrics.startTime = new Date().toISOString();
    
    this.emit('initialized', {
      projectDir: this.projectDir,
      config: this.config,
      timestamp: this.metrics.startTime
    });
    
    console.log(`✅ Harness initialized in: ${this.projectDir}`);
    
    return this.projectDir;
  }
  
  async loadAppSpec(spec) {
    if (typeof spec === 'string') {
      // Check if it's a file path
      if (spec.endsWith('.md') || spec.endsWith('.txt')) {
        try {
          return await fs.readFile(spec, 'utf8');
        } catch {
          // Not a file, treat as spec content
        }
      }
      return spec;
    }
    
    // Generate spec from object
    return this.generateAppSpec(spec);
  }
  
  generateAppSpec(config) {
    return `# Application Specification

## Project: ${config.name || 'Unnamed Project'}

### Overview
${config.description || 'No description provided'}

### Core Features
${config.features?.map(f => `- ${f}`).join('\n') || '- Basic functionality'}

### Technical Requirements
- Framework: ${config.framework || 'React + Node.js'}
- Database: ${config.database || 'PostgreSQL'}
- Authentication: ${config.auth || 'JWT'}
- Styling: ${config.styling || 'TailwindCSS'}
- Testing: ${config.testing || 'Jest + Playwright'}

### Success Criteria
${config.criteria?.map(c => `- ${c}`).join('\n') || '- All features implemented\n- All tests passing\n- No console errors'}

### Target Metrics
- Test Coverage: ${config.testCoverage || 80}%
- Pass Rate: ${(this.config.targetTestPassRate * 100)}%
- Performance: Core Web Vitals passing

### Additional Requirements
${config.additionalRequirements || 'None specified'}
`;
  }
  
  async initGitRepo() {
    // Create .gitignore
    const gitignore = `
node_modules/
.env
.env.local
dist/
build/
*.log
.DS_Store
coverage/
.nyc_output/
harness-artifacts/
*.tmp
    `.trim();
    
    await fs.writeFile(path.join(this.projectDir, '.gitignore'), gitignore);
    
    // Initialize git
    await this.execCommand('git init');
    await this.execCommand('git config user.name "Harness Agent"');
    await this.execCommand('git config user.email "harness@windsurf.local"');
    await this.execCommand('git add .');
    await this.execCommand('git commit -m "Initial harness setup"');
    
    this.artifacts.gitRepo = this.projectDir;
    
    console.log('📦 Git repository initialized');
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  async runInitializerSession() {
    console.log('\n🚀 Running Initializer Agent (Session 1)...');
    
    const agent = await this.createAgent('initializer');
    
    // Generate comprehensive feature list
    const features = await agent.generateFeatureList(this.artifacts.appSpec);
    await this.saveFeatureList(features);
    
    console.log(`📝 Generated ${features.length} test cases`);
    
    // Create initialization script
    const initScript = await agent.createInitScript(features);
    await this.saveInitScript(initScript);
    
    // Create project structure
    await agent.createProjectStructure(this.projectDir);
    
    // Update progress
    await this.updateProgress({
      session: 1,
      type: 'initializer',
      completed: true,
      features: features.length,
      timestamp: new Date().toISOString(),
      summary: 'Project initialized with feature list and scaffolding'
    });
    
    // Commit changes
    await this.commitProgress('Initial project setup complete');
    
    this.currentSession = 1;
    this.emit('initializerComplete', { 
      features: features.length,
      projectDir: this.projectDir 
    });
    
    return features;
  }
  
  async runCodingSession() {
    this.currentSession++;
    console.log(`\n🤖 Running Coding Session #${this.currentSession}...`);
    
    const agent = await this.createAgent('coding');
    
    // Load current state
    const features = await this.loadFeatureList();
    const progress = await this.loadProgress();
    
    // Prime agent with context
    await agent.prime(progress, features);
    
    // Run regression tests on recent features
    console.log('🔍 Running regression tests...');
    const recentFeatures = features
      .filter(f => f.passes)
      .slice(-this.config.regressTestCount);
    
    if (recentFeatures.length > 0) {
      const regressionResults = await agent.runRegressionTests(recentFeatures);
      
      // Fix any broken features
      if (regressionResults.failures.length > 0) {
        console.log(`⚠️ Found ${regressionResults.failures.length} regression failures`);
        for (const failure of regressionResults.failures) {
          await agent.fixRegression(failure);
        }
      }
    }
    
    // Select next feature to implement
    const nextFeature = features.find(f => !f.passes);
    
    if (!nextFeature) {
      console.log('✅ All features implemented!');
      this.isRunning = false;
      return;
    }
    
    console.log(`🔨 Implementing: ${nextFeature.name}`);
    
    // Implement feature
    const implementationResult = await agent.implementFeature(nextFeature);
    
    // Test feature
    const testResult = await agent.testFeature(nextFeature);
    
    // Update feature list
    if (testResult.passes) {
      nextFeature.passes = true;
      nextFeature.implementedAt = new Date().toISOString();
      nextFeature.session = this.currentSession;
      
      await this.saveFeatureList(features);
      this.metrics.featuresImplemented++;
      
      console.log(`✅ Feature passed all tests`);
    } else {
      console.log(`❌ Feature failed tests: ${testResult.error}`);
    }
    
    // Update progress
    await this.updateProgress({
      session: this.currentSession,
      type: 'coding',
      feature: nextFeature.name,
      result: testResult.passes ? 'success' : 'failed',
      timestamp: new Date().toISOString(),
      summary: `${testResult.passes ? 'Implemented' : 'Attempted'}: ${nextFeature.name}`
    });
    
    // Commit changes
    await this.commitProgress(
      `Session ${this.currentSession}: ${nextFeature.name}`
    );
    
    // Update metrics
    this.updateMetrics(features);
    
    this.emit('codingSessionComplete', {
      session: this.currentSession,
      feature: nextFeature.name,
      success: testResult.passes,
      metrics: this.metrics
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // AGENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  async createAgent(type) {
    const AgentManager = require('./agent-manager');
    return new AgentManager(this, type);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ARTIFACT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  
  async saveFeatureList(features) {
    const filePath = path.join(this.projectDir, 'feature-list.json');
    await fs.writeFile(filePath, JSON.stringify(features, null, 2));
    this.artifacts.featureList = filePath;
  }
  
  async loadFeatureList() {
    if (!this.artifacts.featureList) {
      throw new Error('Feature list not initialized');
    }
    const content = await fs.readFile(this.artifacts.featureList, 'utf8');
    return JSON.parse(content);
  }
  
  async saveInitScript(script) {
    const filePath = path.join(this.projectDir, 'init.sh');
    await fs.writeFile(filePath, script);
    await fs.chmod(filePath, '755');
    this.artifacts.initScript = filePath;
  }
  
  async updateProgress(data) {
    const filePath = path.join(this.projectDir, 'harness-progress.json');
    
    let progress = {};
    try {
      const existing = await fs.readFile(filePath, 'utf8');
      progress = JSON.parse(existing);
    } catch {
      progress = { sessions: [] };
    }
    
    progress.lastUpdate = data;
    progress.sessions.push(data);
    progress.currentSession = this.currentSession;
    progress.metrics = this.metrics;
    
    await fs.writeFile(filePath, JSON.stringify(progress, null, 2));
    this.artifacts.progressFile = filePath;
  }
  
  async loadProgress() {
    if (!this.artifacts.progressFile) {
      return { currentSession: 0, sessions: [] };
    }
    const content = await fs.readFile(this.artifacts.progressFile, 'utf8');
    return JSON.parse(content);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // GIT OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════
  
  async commitProgress(message) {
    try {
      await this.execCommand('git add -A');
      await this.execCommand(`git commit -m "${message}"`);
    } catch (error) {
      console.error('Git commit error:', error.message);
    }
  }
  
  async execCommand(cmd) {
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);
    return await exec(cmd, { cwd: this.projectDir });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // MONITORING & METRICS
  // ═══════════════════════════════════════════════════════════════════════
  
  startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.checkHealth();
    }, 60000); // Every minute
  }
  
  async checkHealth() {
    const hoursRunning = (Date.now() - this.startTime) / 3600000;
    
    // Check time limit
    if (hoursRunning >= this.config.maxHoursRuntime) {
      console.log(`⏰ Time limit reached (${this.config.maxHoursRuntime} hours)`);
      await this.stop();
      return;
    }
    
    // Check session limit
    if (this.currentSession >= this.config.maxSessions) {
      console.log(`📊 Session limit reached (${this.config.maxSessions} sessions)`);
      await this.stop();
      return;
    }
    
    // Check target pass rate
    if (this.metrics.testsPassingRate >= this.config.targetTestPassRate) {
      console.log(`✅ Target pass rate achieved (${(this.config.targetTestPassRate * 100).toFixed(1)}%)`);
      await this.stop();
      return;
    }
    
    this.emit('healthCheck', {
      hoursRunning: hoursRunning.toFixed(1),
      session: this.currentSession,
      metrics: this.metrics
    });
  }
  
  updateMetrics(features) {
    const total = features.length;
    const passing = features.filter(f => f.passes).length;
    
    this.metrics.testsPassingRate = total > 0 ? passing / total : 0;
    this.metrics.totalSessions = this.currentSession;
    
    const percentage = (this.metrics.testsPassingRate * 100).toFixed(1);
    console.log(`📊 Progress: ${passing}/${total} features (${percentage}%)`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // MAIN EXECUTION LOOP
  // ═══════════════════════════════════════════════════════════════════════
  
  async start(projectSpec) {
    try {
      // Initialize harness
      await this.initialize(projectSpec);
      
      // Run initializer session
      await this.runInitializerSession();
      
      // Main coding loop
      while (this.isRunning && this.currentSession < this.config.maxSessions) {
        await this.runCodingSession();
        
        // Checkpoint at intervals
        if (this.currentSession % this.config.checkpointInterval === 0) {
          await this.checkpoint();
        }
        
        // Small delay between sessions
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Generate final report
      await this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Harness error:', error);
      this.emit('error', error);
      this.metrics.errorsEncountered++;
      await this.stop();
    }
  }
  
  async checkpoint() {
    console.log(`💾 Creating checkpoint at session ${this.currentSession}...`);
    
    const checkpoint = {
      session: this.currentSession,
      metrics: this.metrics,
      timestamp: new Date().toISOString(),
      artifacts: this.artifacts,
      projectDir: this.projectDir
    };
    
    const checkpointPath = path.join(
      this.projectDir, 
      `checkpoint-${this.currentSession}.json`
    );
    
    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
    
    this.emit('checkpoint', checkpoint);
  }
  
  async stop() {
    console.log('🛑 Stopping harness...');
    
    this.isRunning = false;
    this.metrics.endTime = new Date().toISOString();
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    await this.generateFinalReport();
    
    this.emit('stopped', {
      session: this.currentSession,
      metrics: this.metrics,
      projectDir: this.projectDir
    });
  }
  
  async generateFinalReport() {
    const features = await this.loadFeatureList();
    const progress = await this.loadProgress();
    
    const runtime = this.startTime ? 
      ((Date.now() - this.startTime) / 3600000).toFixed(1) : 0;
    
    const report = `# Harness Execution Report

## Summary
- Total Sessions: ${this.currentSession}
- Features Implemented: ${features.filter(f => f.passes).length}/${features.length}
- Pass Rate: ${(this.metrics.testsPassingRate * 100).toFixed(1)}%
- Total Runtime: ${runtime} hours
- Errors Encountered: ${this.metrics.errorsEncountered}

## Features Completed
${features.filter(f => f.passes).map(f => `✅ ${f.name} (Session ${f.session})`).join('\n')}

## Features Remaining
${features.filter(f => !f.passes).map(f => `❌ ${f.name}`).join('\n')}

## Session Timeline
${progress.sessions?.map(s => 
  `- Session ${s.session} (${s.type}): ${s.summary}`
).join('\n')}

## Project Location
${this.projectDir}

## Metrics
- Start Time: ${this.metrics.startTime}
- End Time: ${this.metrics.endTime || 'Still running'}
- Sessions: ${this.metrics.totalSessions}
- Features: ${this.metrics.featuresImplemented}
- Pass Rate: ${(this.metrics.testsPassingRate * 100).toFixed(1)}%

Generated: ${new Date().toISOString()}
`;
    
    await fs.writeFile(
      path.join(this.projectDir, 'HARNESS_REPORT.md'),
      report
    );
    
    console.log('\n' + report);
    
    return report;
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════
  
  getStatus() {
    return {
      running: this.isRunning,
      session: this.currentSession,
      projectDir: this.projectDir,
      metrics: this.metrics,
      config: this.config,
      artifacts: this.artifacts
    };
  }
  
  toggle(enabled) {
    this.config.enabled = enabled;
    return this.config.enabled;
  }
}

// Export singleton instance
const harness = new AnthropicHarness();

module.exports = {
  AnthropicHarness,
  harness,
  
  // Convenience functions
  async startHarness(spec, config = {}) {
    harness.config = { ...harness.config, ...config, enabled: true };
    return harness.start(spec);
  },
  
  async stopHarness() {
    return harness.stop();
  },
  
  getHarnessStatus() {
    return harness.getStatus();
  },
  
  toggleHarness(enabled) {
    return harness.toggle(enabled);
  }
};
