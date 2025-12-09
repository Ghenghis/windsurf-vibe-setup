/**
 * Auto-Optimization Engine - v6.0
 * Automatically optimizes code, algorithms, and system performance
 * Implements continuous improvement through automated refactoring
 *
 * Part 1: Core initialization and optimization strategies
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class AutoOptimizationEngine extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      optimizationDir:
        options.optimizationDir || path.join(process.cwd(), 'vibe-data', 'optimization'),
      analysisInterval: options.analysisInterval || 300000, // 5 minutes
      optimizationThreshold: options.optimizationThreshold || 0.7,
      maxOptimizationsPerRun: options.maxOptimizationsPerRun || 10,
      safeMode: options.safeMode !== false,
      autoApply: options.autoApply || false,
      rollbackEnabled: options.rollbackEnabled !== false,
    };

    // Optimization patterns
    this.optimizationPatterns = {
      algorithmic: new Map(),
      structural: new Map(),
      performance: new Map(),
      memory: new Map(),
      readability: new Map(),
      security: new Map(),
    };

    // Active optimizations
    this.activeOptimizations = new Map();
    this.pendingOptimizations = [];
    this.appliedOptimizations = new Map();
    this.rollbackHistory = [];

    // Optimization strategies
    this.strategies = {
      caching: this.optimizeWithCaching.bind(this),
      memoization: this.optimizeWithMemoization.bind(this),
      lazyLoading: this.optimizeWithLazyLoading.bind(this),
      debouncing: this.optimizeWithDebouncing.bind(this),
      batching: this.optimizeWithBatching.bind(this),
      parallelization: this.optimizeWithParallelization.bind(this),
      indexing: this.optimizeWithIndexing.bind(this),
      compression: this.optimizeWithCompression.bind(this),
    };

    // Code patterns to optimize
    this.codePatterns = {
      loops: /for\s*\([^)]+\)|while\s*\([^)]+\)|\.forEach\s*\(/g,
      conditionals: /if\s*\([^)]+\)|switch\s*\([^)]+\)/g,
      functions: /function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
      queries: /\.find\(|\.filter\(|\.map\(|\.reduce\(/g,
      asyncPatterns: /async\s+|await\s+|Promise\.|\.then\(/g,
    };

    // Performance metrics
    this.metrics = {
      totalOptimizations: 0,
      successfulOptimizations: 0,
      failedOptimizations: 0,
      performanceGain: 0,
      memoryReduction: 0,
      codeReduction: 0,
      rollbacks: 0,
    };

    // Analysis results
    this.analysisResults = new Map();
    this.benchmarks = new Map();

    this.isInitialized = false;
    this.analysisTimer = null;
  }

  /**
   * Initialize optimization engine
   */
  async initialize() {
    try {
      console.log('⚡ Initializing Auto-Optimization Engine...');

      // Create directory structure
      await this.createDirectories();

      // Load optimization patterns
      await this.loadOptimizationPatterns();

      // Load previous optimizations
      await this.loadOptimizationHistory();

      // Start analysis
      this.startAnalysis();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Auto-Optimization Engine initialized');
      console.log(`   - Patterns loaded: ${this.getTotalPatterns()}`);
      console.log(`   - Previous optimizations: ${this.appliedOptimizations.size}`);
    } catch (error) {
      console.error('❌ Failed to initialize Auto-Optimization:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = [
      'analysis',
      'patterns',
      'patterns/algorithmic',
      'patterns/performance',
      'optimizations',
      'optimizations/pending',
      'optimizations/applied',
      'rollback',
      'benchmarks',
      'reports',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.optimizationDir, dir), { recursive: true });
    }
  }

  /**
   * Analyze code for optimization opportunities
   */
  async analyzeCode(code, metadata = {}) {
    const analysis = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      code,
      metadata,
      opportunities: [],
      score: 0,
    };

    // Check for optimization patterns
    for (const [category, patterns] of Object.entries(this.codePatterns)) {
      const matches = code.match(patterns);

      if (matches && matches.length > 0) {
        const opportunities = await this.identifyOpportunities(category, matches, code);

        analysis.opportunities.push(...opportunities);
      }
    }

    // Calculate optimization score
    analysis.score = this.calculateOptimizationScore(analysis.opportunities);

    // Store analysis
    this.analysisResults.set(analysis.id, analysis);

    // Check if optimization should be triggered
    if (analysis.score > this.config.optimizationThreshold) {
      await this.createOptimizationPlan(analysis);
    }

    return analysis;
  }

  /**
   * Identify specific optimization opportunities
   */
  async identifyOpportunities(category, matches, code) {
    const opportunities = [];

    switch (category) {
      case 'loops':
        opportunities.push(...(await this.analyzeLoops(matches, code)));
        break;

      case 'conditionals':
        opportunities.push(...(await this.analyzeConditionals(matches, code)));
        break;

      case 'functions':
        opportunities.push(...(await this.analyzeFunctions(matches, code)));
        break;

      case 'queries':
        opportunities.push(...(await this.analyzeQueries(matches, code)));
        break;

      case 'asyncPatterns':
        opportunities.push(...(await this.analyzeAsync(matches, code)));
        break;
    }

    return opportunities;
  }

  async analyzeLoops(matches, code) {
    const opportunities = [];

    for (const match of matches) {
      // Check for inefficient loops
      if (match.includes('forEach')) {
        opportunities.push({
          type: 'loop-optimization',
          pattern: match,
          issue: 'forEach can be slower than for loops',
          suggestion: 'Consider using for...of or traditional for loop',
          impact: 'medium',
          strategy: 'loop-refactor',
        });
      }

      // Check for nested loops
      const nestedPattern = /for.*for|while.*while/;
      if (nestedPattern.test(code)) {
        opportunities.push({
          type: 'nested-loops',
          pattern: 'nested loops detected',
          issue: 'Nested loops can cause O(n²) complexity',
          suggestion: 'Consider using Map/Set for lookups',
          impact: 'high',
          strategy: 'indexing',
        });
      }
    }

    return opportunities;
  }

  async analyzeConditionals(matches, code) {
    const opportunities = [];

    // Check for long if-else chains
    const ifElseCount = (code.match(/else\s+if/g) || []).length;

    if (ifElseCount > 3) {
      opportunities.push({
        type: 'conditional-complexity',
        pattern: 'long if-else chain',
        issue: 'Complex conditional logic',
        suggestion: 'Consider using switch or lookup table',
        impact: 'medium',
        strategy: 'conditional-refactor',
      });
    }

    return opportunities;
  }

  async analyzeFunctions(matches, code) {
    const opportunities = [];

    for (const match of matches) {
      // Check for functions that could benefit from memoization
      if (match.includes('function') || match.includes('=>')) {
        // Simple heuristic: recursive or complex calculations
        if (code.includes('return') && code.includes('*')) {
          opportunities.push({
            type: 'function-optimization',
            pattern: match,
            issue: 'Function might benefit from memoization',
            suggestion: 'Cache results for repeated calls',
            impact: 'medium',
            strategy: 'memoization',
          });
        }
      }
    }

    return opportunities;
  }

  async analyzeQueries(matches, code) {
    const opportunities = [];

    // Check for multiple filter/map operations
    if (matches.length > 2) {
      opportunities.push({
        type: 'query-optimization',
        pattern: 'multiple array operations',
        issue: 'Multiple iterations over same array',
        suggestion: 'Combine operations into single pass',
        impact: 'high',
        strategy: 'query-combination',
      });
    }

    // Check for find after filter
    if (code.includes('.filter(') && code.includes('.find(')) {
      opportunities.push({
        type: 'query-optimization',
        pattern: 'filter then find',
        issue: 'Unnecessary filtering before find',
        suggestion: 'Use find directly with combined condition',
        impact: 'medium',
        strategy: 'query-simplification',
      });
    }

    return opportunities;
  }

  async analyzeAsync(matches, code) {
    const opportunities = [];

    // Check for sequential awaits that could be parallel
    const awaitPattern = /await\s+\w+[^;]+;[\s\n]*await/;

    if (awaitPattern.test(code)) {
      opportunities.push({
        type: 'async-optimization',
        pattern: 'sequential awaits',
        issue: 'Sequential async operations',
        suggestion: 'Use Promise.all for parallel execution',
        impact: 'high',
        strategy: 'parallelization',
      });
    }

    return opportunities;
  }

  calculateOptimizationScore(opportunities) {
    let score = 0;
    const weights = {
      high: 0.3,
      medium: 0.2,
      low: 0.1,
    };

    for (const opportunity of opportunities) {
      score += weights[opportunity.impact] || 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * Optimization Planning and Execution (Part 2)
   */

  async createOptimizationPlan(analysis) {
    const plan = {
      id: crypto.randomBytes(16).toString('hex'),
      analysisId: analysis.id,
      timestamp: Date.now(),
      opportunities: analysis.opportunities,
      steps: [],
      estimatedImpact: 0,
      risk: 'low',
      status: 'pending',
    };

    // Create optimization steps
    for (const opportunity of analysis.opportunities) {
      const step = await this.createOptimizationStep(opportunity);
      plan.steps.push(step);
    }

    // Calculate impact and risk
    plan.estimatedImpact = this.calculateEstimatedImpact(plan.steps);
    plan.risk = this.assessRisk(plan.steps);

    // Add to pending queue
    this.pendingOptimizations.push(plan);

    // Auto-apply if enabled and safe
    if (this.config.autoApply && plan.risk === 'low') {
      await this.applyOptimization(plan);
    }

    return plan;
  }

  async createOptimizationStep(opportunity) {
    const step = {
      type: opportunity.type,
      strategy: opportunity.strategy,
      before: opportunity.pattern,
      after: null,
      transformation: null,
      validated: false,
    };

    // Generate transformation based on strategy
    step.transformation = await this.generateTransformation(opportunity.strategy, opportunity);

    return step;
  }

  async generateTransformation(strategy, opportunity) {
    const transformations = {
      'loop-refactor': this.generateLoopRefactor,
      indexing: this.generateIndexing,
      'conditional-refactor': this.generateConditionalRefactor,
      memoization: this.generateMemoization,
      'query-combination': this.generateQueryCombination,
      'query-simplification': this.generateQuerySimplification,
      parallelization: this.generateParallelization,
    };

    const generator = transformations[strategy];

    if (generator) {
      return await generator.call(this, opportunity);
    }

    return null;
  }

  generateLoopRefactor(opportunity) {
    return {
      type: 'replace',
      pattern: /\.forEach\(([^)]+)\)/g,
      replacement: 'for (const item of array)',
      description: 'Replace forEach with for...of loop',
    };
  }

  generateIndexing(opportunity) {
    return {
      type: 'restructure',
      pattern: 'nested-loops',
      replacement: 'const lookup = new Map(); // Pre-index data',
      description: 'Use Map for O(1) lookups instead of nested loops',
    };
  }

  generateConditionalRefactor(opportunity) {
    return {
      type: 'refactor',
      pattern: 'if-else-chain',
      replacement: 'const handlers = { case1: fn1, case2: fn2 }; handlers[condition]()',
      description: 'Replace if-else chain with lookup table',
    };
  }

  generateMemoization(opportunity) {
    return {
      type: 'wrap',
      pattern: 'function',
      replacement: `
const memoized = (function() {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = originalFunction.apply(this, args);
    cache.set(key, result);
    return result;
  };
})();`,
      description: 'Add memoization wrapper to cache results',
    };
  }

  generateQueryCombination(opportunity) {
    return {
      type: 'combine',
      pattern: 'multiple-operations',
      replacement: '.reduce((acc, item) => { /* combined logic */ }, [])',
      description: 'Combine multiple array operations into single pass',
    };
  }

  generateQuerySimplification(opportunity) {
    return {
      type: 'simplify',
      pattern: '.filter().find()',
      replacement: '.find(item => /* combined condition */)',
      description: 'Simplify filter+find to single find operation',
    };
  }

  generateParallelization(opportunity) {
    return {
      type: 'parallelize',
      pattern: 'sequential-awaits',
      replacement: 'const [result1, result2] = await Promise.all([op1(), op2()]);',
      description: 'Execute async operations in parallel',
    };
  }

  calculateEstimatedImpact(steps) {
    let impact = 0;
    const impactScores = {
      'loop-refactor': 0.2,
      indexing: 0.4,
      'conditional-refactor': 0.15,
      memoization: 0.3,
      'query-combination': 0.35,
      'query-simplification': 0.25,
      parallelization: 0.5,
    };

    for (const step of steps) {
      impact += impactScores[step.strategy] || 0.1;
    }

    return Math.min(impact, 1);
  }

  assessRisk(steps) {
    const riskyStrategies = ['indexing', 'parallelization', 'conditional-refactor'];

    for (const step of steps) {
      if (riskyStrategies.includes(step.strategy)) {
        return 'medium';
      }
    }

    return 'low';
  }

  /**
   * Apply optimizations
   */

  async applyOptimization(plan) {
    const application = {
      id: crypto.randomBytes(16).toString('hex'),
      planId: plan.id,
      timestamp: Date.now(),
      originalCode: null,
      optimizedCode: null,
      metrics: {
        before: {},
        after: {},
      },
      status: 'applying',
    };

    try {
      // Benchmark before
      application.metrics.before = await this.benchmarkCode(plan.originalCode);

      // Apply transformations
      application.optimizedCode = await this.applyTransformations(plan.originalCode, plan.steps);

      // Validate optimized code
      const isValid = await this.validateOptimization(application.optimizedCode);

      if (!isValid) {
        throw new Error('Optimization validation failed');
      }

      // Benchmark after
      application.metrics.after = await this.benchmarkCode(application.optimizedCode);

      // Calculate improvement
      const improvement = this.calculateImprovement(
        application.metrics.before,
        application.metrics.after
      );

      // Store if improvement
      if (improvement > 0) {
        application.status = 'success';
        this.appliedOptimizations.set(application.id, application);
        this.metrics.successfulOptimizations++;
        this.metrics.performanceGain += improvement;

        // Save rollback point
        if (this.config.rollbackEnabled) {
          await this.saveRollbackPoint(application);
        }

        this.emit('optimizationApplied', {
          id: application.id,
          improvement,
          type: plan.steps[0]?.strategy,
        });
      } else {
        application.status = 'no-improvement';
        this.metrics.failedOptimizations++;
      }
    } catch (error) {
      application.status = 'failed';
      application.error = error.message;
      this.metrics.failedOptimizations++;

      console.error('Optimization failed:', error);
    }

    return application;
  }

  async applyTransformations(code, steps) {
    let optimized = code;

    for (const step of steps) {
      if (step.transformation) {
        optimized = this.applyTransformation(optimized, step.transformation);
      }
    }

    return optimized;
  }

  applyTransformation(code, transformation) {
    switch (transformation.type) {
      case 'replace':
        return code.replace(transformation.pattern, transformation.replacement);

      case 'wrap':
        return transformation.replacement.replace('originalFunction', code);

      case 'restructure':
      case 'refactor':
      case 'combine':
      case 'simplify':
      case 'parallelize':
        // These require more complex AST manipulation
        // For now, return suggested replacement
        return `// OPTIMIZED: ${transformation.description}\n${transformation.replacement}`;

      default:
        return code;
    }
  }

  async validateOptimization(code) {
    try {
      // Basic syntax validation
      new Function(code);
      return true;
    } catch (error) {
      return false;
    }
  }

  async benchmarkCode(code) {
    // Simple performance measurement
    const iterations = 1000;
    const start = Date.now();
    const startMem = process.memoryUsage();

    for (let i = 0; i < iterations; i++) {
      // Execute code (simplified)
      try {
        eval(code);
      } catch (error) {
        // Ignore execution errors for benchmark
      }
    }

    const end = Date.now();
    const endMem = process.memoryUsage();

    return {
      duration: end - start,
      iterations,
      avgDuration: (end - start) / iterations,
      memoryUsed: endMem.heapUsed - startMem.heapUsed,
    };
  }

  calculateImprovement(before, after) {
    if (!before.avgDuration || !after.avgDuration) return 0;

    const speedImprovement = (before.avgDuration - after.avgDuration) / before.avgDuration;
    const memoryImprovement =
      before.memoryUsed > 0 ? (before.memoryUsed - after.memoryUsed) / before.memoryUsed : 0;

    return speedImprovement * 0.7 + memoryImprovement * 0.3;
  }

  /**
   * Optimization Strategy Methods (Part 3)
   */

  async optimizeWithCaching(code, context = {}) {
    const optimization = {
      type: 'caching',
      original: code,
      optimized: null,
    };

    // Add caching layer
    optimization.optimized = `
const cache = new Map();

${code.replace(/function\s+(\w+)\s*\([^)]*\)/g, (match, name) => {
  return `function ${name}Cached(...args) {
  const key = JSON.stringify(args);
  if (cache.has(key)) return cache.get(key);
  const result = ${name}.apply(this, args);
  cache.set(key, result);
  return result;
}`;
})}`;

    return optimization;
  }

  async optimizeWithMemoization(code, context = {}) {
    return {
      type: 'memoization',
      original: code,
      optimized: this.addMemoization(code),
    };
  }

  addMemoization(code) {
    return `
const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) {
      cache.set(key, fn(...args));
    }
    return cache.get(key);
  };
};

${code}`;
  }

  async optimizeWithLazyLoading(code, context = {}) {
    return {
      type: 'lazy-loading',
      original: code,
      optimized: this.addLazyLoading(code),
    };
  }

  addLazyLoading(code) {
    return code.replace(
      /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"];?/g,
      (match, imports, module) => {
        return `const ${imports.trim()} = () => import('${module}');`;
      }
    );
  }

  async optimizeWithDebouncing(code, context = {}) {
    return {
      type: 'debouncing',
      original: code,
      optimized: this.addDebouncing(code, context.delay || 300),
    };
  }

  addDebouncing(code, delay) {
    return `
const debounce = (fn, delay = ${delay}) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

${code}`;
  }

  async optimizeWithBatching(code, context = {}) {
    return {
      type: 'batching',
      original: code,
      optimized: this.addBatching(code, context.batchSize || 100),
    };
  }

  addBatching(code, batchSize) {
    return `
const batchProcessor = (items, processor, batchSize = ${batchSize}) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...processor(batch));
  }
  return results;
};

${code}`;
  }

  async optimizeWithParallelization(code, context = {}) {
    return {
      type: 'parallelization',
      original: code,
      optimized: this.addParallelization(code),
    };
  }

  addParallelization(code) {
    // Convert sequential awaits to parallel
    return code.replace(
      /await\s+(\w+)\([^)]*\);[\s\n]*await\s+(\w+)\([^)]*\);/g,
      'const [$1Result, $2Result] = await Promise.all([$1(), $2()]);'
    );
  }

  async optimizeWithIndexing(code, context = {}) {
    return {
      type: 'indexing',
      original: code,
      optimized: this.addIndexing(code),
    };
  }

  addIndexing(code) {
    // Add indexing for lookups
    return `
// Create index for O(1) lookups
const createIndex = (array, key) => {
  return array.reduce((index, item) => {
    index.set(item[key], item);
    return index;
  }, new Map());
};

${code}`;
  }

  async optimizeWithCompression(code, context = {}) {
    // Simple code minification
    return {
      type: 'compression',
      original: code,
      optimized: this.compressCode(code),
    };
  }

  compressCode(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*/g, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }

  /**
   * Rollback and Recovery
   */

  async saveRollbackPoint(application) {
    const rollback = {
      id: crypto.randomBytes(16).toString('hex'),
      applicationId: application.id,
      timestamp: Date.now(),
      originalCode: application.originalCode,
      optimizedCode: application.optimizedCode,
      metrics: application.metrics,
    };

    this.rollbackHistory.push(rollback);

    // Keep only last 50 rollback points
    if (this.rollbackHistory.length > 50) {
      this.rollbackHistory = this.rollbackHistory.slice(-50);
    }

    // Save to disk
    const filePath = path.join(this.config.optimizationDir, 'rollback', `${rollback.id}.json`);

    await fs.writeFile(filePath, JSON.stringify(rollback, null, 2));
  }

  async rollback(applicationId) {
    const rollback = this.rollbackHistory.find(r => r.applicationId === applicationId);

    if (!rollback) {
      throw new Error('Rollback point not found');
    }

    // Restore original code
    const restored = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      applicationId,
      restoredCode: rollback.originalCode,
      reason: 'manual-rollback',
    };

    this.metrics.rollbacks++;

    this.emit('rollbackCompleted', restored);

    return restored;
  }

  /**
   * Storage and Persistence
   */

  async loadOptimizationPatterns() {
    try {
      const patternsDir = path.join(this.config.optimizationDir, 'patterns');
      const categories = ['algorithmic', 'performance'];

      for (const category of categories) {
        const categoryDir = path.join(patternsDir, category);
        const files = await fs.readdir(categoryDir);

        for (const file of files) {
          if (file.endsWith('.json')) {
            const data = await fs.readFile(path.join(categoryDir, file), 'utf8');
            const pattern = JSON.parse(data);
            this.optimizationPatterns[category].set(pattern.id, pattern);
          }
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async loadOptimizationHistory() {
    try {
      const historyDir = path.join(this.config.optimizationDir, 'optimizations', 'applied');
      const files = await fs.readdir(historyDir);

      for (const file of files.slice(-20)) {
        // Last 20 optimizations
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(historyDir, file), 'utf8');
          const optimization = JSON.parse(data);
          this.appliedOptimizations.set(optimization.id, optimization);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async saveOptimization(optimization) {
    const filePath = path.join(
      this.config.optimizationDir,
      'optimizations',
      optimization.status === 'success' ? 'applied' : 'pending',
      `${optimization.id}.json`
    );

    await fs.writeFile(filePath, JSON.stringify(optimization, null, 2));
  }

  /**
   * Analysis and Monitoring
   */

  startAnalysis() {
    this.analysisTimer = setInterval(async () => {
      await this.performAnalysis();
    }, this.config.analysisInterval);
  }

  async performAnalysis() {
    // Analyze pending optimizations
    for (const plan of this.pendingOptimizations.slice(0, this.config.maxOptimizationsPerRun)) {
      if (this.config.safeMode) {
        // Validate before applying
        const isValid = await this.validateOptimizationPlan(plan);
        if (isValid) {
          await this.applyOptimization(plan);
        }
      } else {
        await this.applyOptimization(plan);
      }
    }

    // Clear processed optimizations
    this.pendingOptimizations = this.pendingOptimizations.slice(this.config.maxOptimizationsPerRun);

    // Update metrics
    this.metrics.totalOptimizations =
      this.metrics.successfulOptimizations + this.metrics.failedOptimizations;
  }

  async validateOptimizationPlan(plan) {
    // Check if optimization is safe
    if (plan.risk === 'high') return false;

    // Check if similar optimization was successful
    for (const [id, applied] of this.appliedOptimizations) {
      if (applied.status === 'failed' && applied.type === plan.steps[0]?.strategy) {
        return false;
      }
    }

    return true;
  }

  /**
   * Reporting and Metrics
   */

  async generateReport() {
    const report = {
      timestamp: Date.now(),
      period: {
        start: Date.now() - 24 * 60 * 60 * 1000,
        end: Date.now(),
      },
      metrics: this.metrics,
      topOptimizations: this.getTopOptimizations(),
      pendingCount: this.pendingOptimizations.length,
      successRate: this.calculateSuccessRate(),
      averageImprovement: this.calculateAverageImprovement(),
    };

    const reportFile = path.join(
      this.config.optimizationDir,
      'reports',
      `report-${Date.now()}.json`
    );

    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    return report;
  }

  getTopOptimizations() {
    const optimizations = Array.from(this.appliedOptimizations.values())
      .filter(o => o.status === 'success')
      .sort((a, b) => {
        const aImprovement = this.calculateImprovement(a.metrics.before, a.metrics.after);
        const bImprovement = this.calculateImprovement(b.metrics.before, b.metrics.after);
        return bImprovement - aImprovement;
      })
      .slice(0, 10);

    return optimizations;
  }

  calculateSuccessRate() {
    const total = this.metrics.totalOptimizations;
    if (total === 0) return 0;

    return this.metrics.successfulOptimizations / total;
  }

  calculateAverageImprovement() {
    const successful = this.metrics.successfulOptimizations;
    if (successful === 0) return 0;

    return this.metrics.performanceGain / successful;
  }

  /**
   * Helper Methods
   */

  getTotalPatterns() {
    let total = 0;
    for (const category of Object.values(this.optimizationPatterns)) {
      total += category.size;
    }
    return total;
  }

  /**
   * Get status and shutdown
   */

  getStatus() {
    return {
      initialized: this.isInitialized,
      patterns: this.getTotalPatterns(),
      pending: this.pendingOptimizations.length,
      applied: this.appliedOptimizations.size,
      metrics: this.metrics,
      successRate: this.calculateSuccessRate(),
      avgImprovement: this.calculateAverageImprovement(),
    };
  }

  async shutdown() {
    // Stop analysis timer
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }

    // Save pending optimizations
    for (const plan of this.pendingOptimizations) {
      await this.saveOptimization({
        ...plan,
        status: 'pending-shutdown',
      });
    }

    // Generate final report
    await this.generateReport();

    this.emit('shutdown');
    console.log('✅ Auto-Optimization Engine shutdown complete');
  }
}

module.exports = AutoOptimizationEngine;
