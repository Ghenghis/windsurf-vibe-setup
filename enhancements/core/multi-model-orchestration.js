/**
 * Multi-Model Orchestration System - v6.0
 * Orchestrates multiple AI models for optimal results
 * Implements model selection, ensemble methods, and result synthesis
 *
 * Part 1: Core initialization and model management
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class MultiModelOrchestration extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      orchestrationDir:
        options.orchestrationDir || path.join(process.cwd(), 'vibe-data', 'orchestration'),
      maxConcurrentModels: options.maxConcurrentModels || 5,
      defaultTimeout: options.defaultTimeout || 30000,
      retryOnFailure: options.retryOnFailure !== false,
      consensusThreshold: options.consensusThreshold || 0.7,
      modelSelectionStrategy: options.modelSelectionStrategy || 'adaptive',
      cacheResults: options.cacheResults !== false,
    };

    // Model registry
    this.models = new Map();
    this.modelCapabilities = new Map();
    this.activeModels = new Set();

    // Orchestration strategies
    this.strategies = {
      sequential: this.orchestrateSequential.bind(this),
      parallel: this.orchestrateParallel.bind(this),
      ensemble: this.orchestrateEnsemble.bind(this),
      cascade: this.orchestrateCascade.bind(this),
      voting: this.orchestrateVoting.bind(this),
      weighted: this.orchestrateWeighted.bind(this),
      adaptive: this.orchestrateAdaptive.bind(this),
    };

    // Task routing
    this.taskRoutes = new Map();
    this.taskHistory = new Map();

    // Model performance tracking
    this.performance = {
      modelMetrics: new Map(),
      taskMetrics: new Map(),
      ensembleMetrics: new Map(),
    };

    // Result cache
    this.resultCache = new Map();

    // Statistics
    this.stats = {
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      modelsUsed: new Map(),
      averageLatency: 0,
      cacheHits: 0,
    };

    this.isInitialized = false;
  }

  /**
   * Initialize orchestration system
   */
  async initialize() {
    try {
      console.log('🎭 Initializing Multi-Model Orchestration...');

      // Create directory structure
      await this.createDirectories();

      // Load model configurations
      await this.loadModelConfigs();

      // Load task routes
      await this.loadTaskRoutes();

      // Initialize model connections
      await this.initializeModels();

      // Load performance history
      await this.loadPerformanceHistory();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Multi-Model Orchestration initialized');
      console.log(`   - Models registered: ${this.models.size}`);
      console.log(`   - Task routes: ${this.taskRoutes.size}`);
      console.log(`   - Active models: ${this.activeModels.size}`);
    } catch (error) {
      console.error('❌ Failed to initialize Multi-Model Orchestration:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = [
      'models',
      'models/configs',
      'models/capabilities',
      'routes',
      'performance',
      'performance/models',
      'performance/tasks',
      'results',
      'cache',
      'logs',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.orchestrationDir, dir), { recursive: true });
    }
  }

  /**
   * Register and manage models
   */
  async registerModel(config) {
    const model = {
      id: config.id || crypto.randomBytes(8).toString('hex'),
      name: config.name,
      type: config.type, // 'language', 'vision', 'audio', 'multimodal'
      provider: config.provider,
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      capabilities: config.capabilities || [],
      constraints: config.constraints || {},
      priority: config.priority || 1,
      status: 'inactive',
      metrics: {
        calls: 0,
        successes: 0,
        failures: 0,
        totalLatency: 0,
        averageLatency: 0,
      },
    };

    // Store model
    this.models.set(model.id, model);

    // Index capabilities
    for (const capability of model.capabilities) {
      if (!this.modelCapabilities.has(capability)) {
        this.modelCapabilities.set(capability, new Set());
      }
      this.modelCapabilities.get(capability).add(model.id);
    }

    // Save configuration
    await this.saveModelConfig(model);

    this.emit('modelRegistered', { id: model.id, name: model.name });

    return model.id;
  }

  async initializeModels() {
    for (const [id, model] of this.models) {
      try {
        await this.testModel(model);
        model.status = 'active';
        this.activeModels.add(id);
      } catch (error) {
        console.warn(`Failed to initialize model ${model.name}:`, error.message);
        model.status = 'error';
      }
    }
  }

  async testModel(model) {
    // Simple connectivity test
    const testPrompt = 'Test connection';
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    try {
      await Promise.race([this.callModel(model, { prompt: testPrompt }), timeout]);
      return true;
    } catch (error) {
      throw new Error(`Model test failed: ${error.message}`);
    }
  }

  /**
   * Task orchestration
   */
  async orchestrate(task, options = {}) {
    const orchestration = {
      id: crypto.randomBytes(8).toString('hex'),
      taskType: task.type,
      timestamp: Date.now(),
      strategy: options.strategy || this.config.modelSelectionStrategy,
      models: [],
      results: [],
      status: 'processing',
    };

    try {
      // Check cache
      const cacheKey = this.getCacheKey(task);
      if (this.config.cacheResults) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          this.stats.cacheHits++;
          return cached;
        }
      }

      // Select models
      orchestration.models = await this.selectModels(task, options);

      // Execute orchestration strategy
      const strategy = this.strategies[orchestration.strategy];
      if (!strategy) {
        throw new Error(`Unknown strategy: ${orchestration.strategy}`);
      }

      const result = await strategy(task, orchestration.models, options);

      // Process and synthesize results
      const synthesized = await this.synthesizeResults(result, task);

      orchestration.results = synthesized;
      orchestration.status = 'completed';

      // Cache result
      if (this.config.cacheResults) {
        this.cacheResult(cacheKey, synthesized);
      }

      // Update statistics
      this.updateStatistics(orchestration);

      // Store orchestration history
      await this.saveOrchestration(orchestration);

      this.emit('orchestrationCompleted', orchestration);

      return synthesized;
    } catch (error) {
      orchestration.status = 'failed';
      orchestration.error = error.message;
      this.stats.failedTasks++;

      console.error('Orchestration failed:', error);
      throw error;
    }
  }

  async selectModels(task, options) {
    const selected = [];

    // Get capable models
    const capable = await this.getCapableModels(task);

    if (capable.length === 0) {
      throw new Error(`No models capable of handling task type: ${task.type}`);
    }

    // Apply selection strategy
    if (options.preferredModels) {
      // Use specified models
      for (const modelId of options.preferredModels) {
        if (capable.includes(modelId)) {
          selected.push(modelId);
        }
      }
    } else {
      // Automatic selection based on performance
      const ranked = await this.rankModels(capable, task);

      // Select top performers
      const count = options.modelCount || (options.strategy === 'ensemble' ? 3 : 1);

      selected.push(...ranked.slice(0, count));
    }

    return selected;
  }

  async getCapableModels(task) {
    const capable = [];

    // Check task requirements
    const requirements = this.getTaskRequirements(task);

    for (const [id, model] of this.models) {
      if (model.status !== 'active') continue;

      // Check if model has required capabilities
      const hasCapabilities = requirements.every(req => model.capabilities.includes(req));

      if (hasCapabilities) {
        capable.push(id);
      }
    }

    return capable;
  }

  getTaskRequirements(task) {
    const requirements = [];

    switch (task.type) {
      case 'text-generation':
        requirements.push('language', 'generation');
        break;
      case 'code-generation':
        requirements.push('language', 'code');
        break;
      case 'image-analysis':
        requirements.push('vision', 'analysis');
        break;
      case 'translation':
        requirements.push('language', 'translation');
        break;
      case 'summarization':
        requirements.push('language', 'summarization');
        break;
      default:
        requirements.push('language'); // Default requirement
    }

    return requirements;
  }

  async rankModels(models, task) {
    const scores = [];

    for (const modelId of models) {
      const model = this.models.get(modelId);
      const performance = await this.getModelPerformance(modelId, task.type);

      const score = {
        id: modelId,
        score: this.calculateModelScore(model, performance, task),
      };

      scores.push(score);
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    return scores.map(s => s.id);
  }

  calculateModelScore(model, performance, task) {
    let score = 0;

    // Base priority
    score += model.priority * 10;

    // Success rate
    if (performance.calls > 0) {
      score += (performance.successes / performance.calls) * 50;
    }

    // Latency penalty
    if (performance.averageLatency > 0) {
      score -= Math.min(performance.averageLatency / 1000, 20);
    }

    // Capability match bonus
    const taskReqs = this.getTaskRequirements(task);
    const matchCount = taskReqs.filter(req => model.capabilities.includes(req)).length;

    score += matchCount * 5;

    return Math.max(0, score);
  }

  /**
   * Orchestration Strategies (Part 2)
   */

  async orchestrateSequential(task, models, options) {
    const results = [];

    for (const modelId of models) {
      const model = this.models.get(modelId);

      try {
        const result = await this.callModel(model, task);
        results.push({
          modelId,
          result,
          timestamp: Date.now(),
        });

        // If satisfactory result, can stop early
        if (options.stopOnSuccess && this.isResultSatisfactory(result)) {
          break;
        }
      } catch (error) {
        console.error(`Model ${modelId} failed:`, error);

        if (!options.continueOnError) {
          throw error;
        }
      }
    }

    return results;
  }

  async orchestrateParallel(task, models, options) {
    const promises = models.map(async modelId => {
      const model = this.models.get(modelId);

      try {
        const result = await this.callModel(model, task);
        return {
          modelId,
          result,
          timestamp: Date.now(),
          success: true,
        };
      } catch (error) {
        return {
          modelId,
          error: error.message,
          timestamp: Date.now(),
          success: false,
        };
      }
    });

    const results = await Promise.all(promises);

    // Filter successful results
    return options.includeFailures ? results : results.filter(r => r.success);
  }

  async orchestrateEnsemble(task, models, options) {
    // Run all models in parallel
    const results = await this.orchestrateParallel(task, models, {
      ...options,
      includeFailures: false,
    });

    if (results.length === 0) {
      throw new Error('All models failed');
    }

    // Combine results using ensemble method
    const ensembleMethod = options.ensembleMethod || 'average';

    switch (ensembleMethod) {
      case 'average':
        return this.ensembleAverage(results);
      case 'weighted':
        return this.ensembleWeighted(results, models);
      case 'voting':
        return this.ensembleVoting(results);
      case 'stacking':
        return this.ensembleStacking(results, task);
      default:
        return this.ensembleAverage(results);
    }
  }

  async orchestrateCascade(task, models, options) {
    const results = [];
    let currentInput = task;

    for (const modelId of models) {
      const model = this.models.get(modelId);

      try {
        const result = await this.callModel(model, currentInput);

        results.push({
          modelId,
          result,
          stage: results.length + 1,
        });

        // Use output as input for next model
        currentInput = {
          ...task,
          prompt: result.output || result.text || result,
        };
      } catch (error) {
        console.error(`Cascade failed at model ${modelId}:`, error);
        throw error;
      }
    }

    return results;
  }

  async orchestrateVoting(task, models, options) {
    const results = await this.orchestrateParallel(task, models, options);

    // Count votes for each unique result
    const votes = new Map();

    for (const result of results) {
      if (result.success) {
        const key = this.normalizeResult(result.result);
        votes.set(key, (votes.get(key) || 0) + 1);
      }
    }

    // Find majority vote
    let maxVotes = 0;
    let winner = null;

    for (const [result, voteCount] of votes) {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        winner = result;
      }
    }

    const consensus = maxVotes / results.length;

    return {
      result: winner,
      consensus,
      votes: Object.fromEntries(votes),
      totalVoters: results.length,
    };
  }

  async orchestrateWeighted(task, models, options) {
    const results = await this.orchestrateParallel(task, models, options);

    // Calculate weights based on model performance
    const weights = await this.calculateModelWeights(models, task.type);

    // Apply weighted combination
    let weightedResult = null;
    let totalWeight = 0;

    for (const result of results) {
      if (result.success) {
        const weight = weights.get(result.modelId) || 1;

        if (weightedResult === null) {
          weightedResult = this.initializeWeightedResult(result.result);
        }

        this.addWeightedResult(weightedResult, result.result, weight);
        totalWeight += weight;
      }
    }

    // Normalize by total weight
    if (totalWeight > 0) {
      this.normalizeWeightedResult(weightedResult, totalWeight);
    }

    return weightedResult;
  }

  async orchestrateAdaptive(task, models, options) {
    // Adaptive strategy based on task characteristics
    const taskProfile = this.analyzeTask(task);

    // Choose strategy based on task profile
    let strategy = 'parallel';

    if (taskProfile.requiresConsensus) {
      strategy = 'voting';
    } else if (taskProfile.requiresPipeline) {
      strategy = 'cascade';
    } else if (taskProfile.requiresEnsemble) {
      strategy = 'ensemble';
    } else if (taskProfile.isSimple) {
      strategy = 'sequential';
    }

    console.log(`Adaptive strategy selected: ${strategy}`);

    // Execute selected strategy
    return this.strategies[strategy](task, models, options);
  }

  analyzeTask(task) {
    const profile = {
      requiresConsensus: false,
      requiresPipeline: false,
      requiresEnsemble: false,
      isSimple: false,
    };

    // Analyze task characteristics
    if (task.type === 'classification' || task.type === 'decision') {
      profile.requiresConsensus = true;
    } else if (task.type === 'multi-step' || task.type === 'chain') {
      profile.requiresPipeline = true;
    } else if (task.type === 'complex' || task.confidence === 'high') {
      profile.requiresEnsemble = true;
    } else if (task.type === 'simple' || task.priority === 'low') {
      profile.isSimple = true;
    }

    return profile;
  }

  /**
   * Ensemble methods
   */

  ensembleAverage(results) {
    // Simple averaging for numerical results
    if (results.length === 0) return null;

    const averaged = {};
    const counts = {};

    for (const { result } of results) {
      for (const [key, value] of Object.entries(result)) {
        if (typeof value === 'number') {
          averaged[key] = (averaged[key] || 0) + value;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    }

    // Calculate averages
    for (const key of Object.keys(averaged)) {
      averaged[key] /= counts[key];
    }

    // Include most common non-numeric values
    for (const { result } of results) {
      for (const [key, value] of Object.entries(result)) {
        if (typeof value !== 'number' && !averaged[key]) {
          averaged[key] = value;
        }
      }
    }

    return averaged;
  }

  ensembleWeighted(results, models) {
    // Weighted combination based on model performance
    const weighted = {};
    let totalWeight = 0;

    for (const { modelId, result } of results) {
      const model = this.models.get(modelId);
      const weight = model.metrics.successes / (model.metrics.calls || 1);

      for (const [key, value] of Object.entries(result)) {
        if (typeof value === 'number') {
          weighted[key] = (weighted[key] || 0) + value * weight;
        }
      }

      totalWeight += weight;
    }

    // Normalize
    if (totalWeight > 0) {
      for (const key of Object.keys(weighted)) {
        weighted[key] /= totalWeight;
      }
    }

    return weighted;
  }

  ensembleVoting(results) {
    // Majority voting for categorical results
    const votes = {};

    for (const { result } of results) {
      const key = JSON.stringify(result);
      votes[key] = (votes[key] || 0) + 1;
    }

    // Find winner
    let maxVotes = 0;
    let winner = null;

    for (const [key, count] of Object.entries(votes)) {
      if (count > maxVotes) {
        maxVotes = count;
        winner = JSON.parse(key);
      }
    }

    return winner;
  }

  async ensembleStacking(results, task) {
    // Use a meta-model to combine results
    const metaInput = {
      ...task,
      modelResults: results.map(r => r.result),
    };

    // Find meta-model
    const metaModelId = await this.selectMetaModel();
    if (!metaModelId) {
      // Fallback to averaging
      return this.ensembleAverage(results);
    }

    const metaModel = this.models.get(metaModelId);
    const metaResult = await this.callModel(metaModel, metaInput);

    return metaResult;
  }

  async selectMetaModel() {
    // Select a model designated as meta-learner
    for (const [id, model] of this.models) {
      if (model.capabilities.includes('meta-learning')) {
        return id;
      }
    }

    return null;
  }

  /**
   * Model communication
   */

  async callModel(model, task) {
    const startTime = Date.now();

    try {
      // Prepare request based on model type
      const request = this.prepareModelRequest(model, task);

      // Add timeout
      const timeout = task.timeout || this.config.defaultTimeout;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Model timeout')), timeout)
      );

      // Call model
      const result = await Promise.race([this.executeModelCall(model, request), timeoutPromise]);

      // Update metrics
      const latency = Date.now() - startTime;
      model.metrics.calls++;
      model.metrics.successes++;
      model.metrics.totalLatency += latency;
      model.metrics.averageLatency = model.metrics.totalLatency / model.metrics.calls;

      return result;
    } catch (error) {
      model.metrics.calls++;
      model.metrics.failures++;
      throw error;
    }
  }

  prepareModelRequest(model, task) {
    // Format request based on model provider
    const request = {
      model: model.name,
      ...task,
    };

    // Provider-specific formatting
    switch (model.provider) {
      case 'openai':
        return {
          model: model.name,
          messages: [{ role: 'user', content: task.prompt || task.text }],
          temperature: task.temperature || 0.7,
        };

      case 'anthropic':
        return {
          model: model.name,
          prompt: task.prompt || task.text,
          max_tokens: task.maxTokens || 1000,
        };

      case 'custom':
      default:
        return request;
    }
  }

  async executeModelCall(model, request) {
    // Simulate model call (would use actual API in production)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          output: `Response from ${model.name}`,
          model: model.id,
          timestamp: Date.now(),
        });
      }, Math.random() * 1000);
    });
  }

  /**
   * Result synthesis and helpers (Part 3)
   */

  async synthesizeResults(results, task) {
    if (!results || results.length === 0) {
      return null;
    }

    // Single result - return as is
    if (results.length === 1) {
      return results[0].result || results[0];
    }

    // Multiple results - synthesize based on type
    const synthesisMethod = task.synthesis || 'best';

    switch (synthesisMethod) {
      case 'best':
        return this.selectBestResult(results);
      case 'merge':
        return this.mergeResults(results);
      case 'consensus':
        return this.findConsensus(results);
      case 'aggregate':
        return this.aggregateResults(results);
      default:
        return results;
    }
  }

  selectBestResult(results) {
    // Select result with highest confidence or quality score
    let best = null;
    let bestScore = -Infinity;

    for (const result of results) {
      const score = this.scoreResult(result);
      if (score > bestScore) {
        bestScore = score;
        best = result;
      }
    }

    return best?.result || best;
  }

  scoreResult(result) {
    let score = 0;

    // Check various quality indicators
    if (result.confidence) score += result.confidence * 100;
    if (result.consensus) score += result.consensus * 50;
    if (result.success) score += 20;
    if (result.model) {
      const model = this.models.get(result.model);
      if (model) {
        score += (model.metrics.successes / (model.metrics.calls || 1)) * 30;
      }
    }

    return score;
  }

  mergeResults(results) {
    const merged = {};

    for (const result of results) {
      const data = result.result || result;

      for (const [key, value] of Object.entries(data)) {
        if (!merged[key]) {
          merged[key] = value;
        } else if (Array.isArray(merged[key]) && Array.isArray(value)) {
          merged[key] = [...merged[key], ...value];
        } else if (typeof merged[key] === 'object' && typeof value === 'object') {
          merged[key] = { ...merged[key], ...value };
        }
      }
    }

    return merged;
  }

  findConsensus(results) {
    // Find the most common result
    const counts = new Map();

    for (const result of results) {
      const key = JSON.stringify(result.result || result);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    let maxCount = 0;
    let consensus = null;

    for (const [key, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        consensus = JSON.parse(key);
      }
    }

    return consensus;
  }

  aggregateResults(results) {
    return {
      all: results.map(r => r.result || r),
      best: this.selectBestResult(results),
      consensus: this.findConsensus(results),
      merged: this.mergeResults(results),
      count: results.length,
    };
  }

  isResultSatisfactory(result) {
    // Check if result meets quality criteria
    if (!result) return false;

    if (result.confidence && result.confidence >= this.config.consensusThreshold) {
      return true;
    }

    if (result.success === true) {
      return true;
    }

    return false;
  }

  normalizeResult(result) {
    // Normalize result for comparison
    if (typeof result === 'string') {
      return result.toLowerCase().trim();
    }

    if (typeof result === 'object') {
      return JSON.stringify(result);
    }

    return String(result);
  }

  async calculateModelWeights(models, taskType) {
    const weights = new Map();

    for (const modelId of models) {
      const model = this.models.get(modelId);
      const performance = await this.getModelPerformance(modelId, taskType);

      // Calculate weight based on performance
      let weight = 1.0;

      if (performance.calls > 0) {
        weight = performance.successes / performance.calls;
        weight *= 1 - performance.averageLatency / 10000; // Penalize slow models
      }

      weights.set(modelId, Math.max(0.1, weight));
    }

    return weights;
  }

  initializeWeightedResult(result) {
    const weighted = {};

    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'number') {
        weighted[key] = 0;
      } else {
        weighted[key] = value;
      }
    }

    return weighted;
  }

  addWeightedResult(weighted, result, weight) {
    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'number' && key in weighted) {
        weighted[key] += value * weight;
      }
    }
  }

  normalizeWeightedResult(weighted, totalWeight) {
    for (const key of Object.keys(weighted)) {
      if (typeof weighted[key] === 'number') {
        weighted[key] /= totalWeight;
      }
    }
  }

  /**
   * Performance tracking
   */

  async getModelPerformance(modelId, taskType) {
    const key = `${modelId}:${taskType}`;
    let performance = this.performance.taskMetrics.get(key);

    if (!performance) {
      performance = {
        calls: 0,
        successes: 0,
        failures: 0,
        totalLatency: 0,
        averageLatency: 0,
      };
      this.performance.taskMetrics.set(key, performance);
    }

    return performance;
  }

  updateStatistics(orchestration) {
    this.stats.totalTasks++;

    if (orchestration.status === 'completed') {
      this.stats.successfulTasks++;
    } else {
      this.stats.failedTasks++;
    }

    // Track model usage
    for (const modelId of orchestration.models) {
      this.stats.modelsUsed.set(modelId, (this.stats.modelsUsed.get(modelId) || 0) + 1);
    }

    // Update task-specific metrics
    if (orchestration.results) {
      for (const result of orchestration.results) {
        if (result.modelId && result.success) {
          const performance = this.performance.taskMetrics.get(
            `${result.modelId}:${orchestration.taskType}`
          ) || { calls: 0, successes: 0, failures: 0 };

          performance.calls++;
          performance.successes++;

          this.performance.taskMetrics.set(
            `${result.modelId}:${orchestration.taskType}`,
            performance
          );
        }
      }
    }
  }

  /**
   * Caching
   */

  getCacheKey(task) {
    const key = {
      type: task.type,
      prompt: task.prompt || task.text,
      params: task.params || {},
    };

    return crypto.createHash('sha256').update(JSON.stringify(key)).digest('hex');
  }

  getFromCache(key) {
    const cached = this.resultCache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      console.log('📦 Returning cached orchestration result');
      return cached.data;
    }

    if (cached) {
      this.resultCache.delete(key);
    }

    return null;
  }

  cacheResult(key, result) {
    this.resultCache.set(key, {
      data: result,
      timestamp: Date.now(),
      expiresAt: Date.now() + 300000, // 5 minutes
    });

    // Limit cache size
    if (this.resultCache.size > 100) {
      const oldest = Array.from(this.resultCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 10);

      for (const [oldKey] of oldest) {
        this.resultCache.delete(oldKey);
      }
    }
  }

  /**
   * Storage methods
   */

  async loadModelConfigs() {
    try {
      const configDir = path.join(this.config.orchestrationDir, 'models', 'configs');
      const files = await fs.readdir(configDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(configDir, file), 'utf8');
          const model = JSON.parse(content);

          this.models.set(model.id, model);

          // Index capabilities
          for (const capability of model.capabilities) {
            if (!this.modelCapabilities.has(capability)) {
              this.modelCapabilities.set(capability, new Set());
            }
            this.modelCapabilities.get(capability).add(model.id);
          }
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async loadTaskRoutes() {
    try {
      const routesFile = path.join(this.config.orchestrationDir, 'routes', 'routes.json');
      const content = await fs.readFile(routesFile, 'utf8');
      const routes = JSON.parse(content);

      for (const [taskType, route] of Object.entries(routes)) {
        this.taskRoutes.set(taskType, route);
      }
    } catch (error) {
      // File might not exist
    }
  }

  async loadPerformanceHistory() {
    try {
      const perfFile = path.join(this.config.orchestrationDir, 'performance', 'history.json');
      const content = await fs.readFile(perfFile, 'utf8');
      const history = JSON.parse(content);

      if (history.taskMetrics) {
        for (const [key, metrics] of Object.entries(history.taskMetrics)) {
          this.performance.taskMetrics.set(key, metrics);
        }
      }

      if (history.modelMetrics) {
        for (const [key, metrics] of Object.entries(history.modelMetrics)) {
          this.performance.modelMetrics.set(key, metrics);
        }
      }
    } catch (error) {
      // File might not exist
    }
  }

  async saveModelConfig(model) {
    const configPath = path.join(
      this.config.orchestrationDir,
      'models',
      'configs',
      `${model.id}.json`
    );

    // Don't save sensitive data
    const toSave = { ...model };
    delete toSave.apiKey;

    await fs.writeFile(configPath, JSON.stringify(toSave, null, 2));
  }

  async saveOrchestration(orchestration) {
    const filePath = path.join(this.config.orchestrationDir, 'results', `${orchestration.id}.json`);

    await fs.writeFile(filePath, JSON.stringify(orchestration, null, 2));
  }

  async savePerformanceHistory() {
    const history = {
      taskMetrics: Object.fromEntries(this.performance.taskMetrics),
      modelMetrics: Object.fromEntries(this.performance.modelMetrics),
      ensembleMetrics: Object.fromEntries(this.performance.ensembleMetrics),
    };

    const perfFile = path.join(this.config.orchestrationDir, 'performance', 'history.json');
    await fs.writeFile(perfFile, JSON.stringify(history, null, 2));
  }

  /**
   * Get status and shutdown
   */

  getStatus() {
    return {
      initialized: this.isInitialized,
      models: {
        total: this.models.size,
        active: this.activeModels.size,
        capabilities: Array.from(this.modelCapabilities.keys()),
      },
      statistics: {
        ...this.stats,
        successRate:
          this.stats.totalTasks > 0
            ? ((this.stats.successfulTasks / this.stats.totalTasks) * 100).toFixed(1) + '%'
            : '0%',
      },
      cache: {
        size: this.resultCache.size,
        hits: this.stats.cacheHits,
      },
      performance: {
        taskMetrics: this.performance.taskMetrics.size,
        modelMetrics: this.performance.modelMetrics.size,
      },
    };
  }

  async shutdown() {
    // Save all configurations
    for (const [id, model] of this.models) {
      await this.saveModelConfig(model);
    }

    // Save performance history
    await this.savePerformanceHistory();

    // Save statistics
    const statsPath = path.join(this.config.orchestrationDir, 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));

    // Clear cache
    this.resultCache.clear();

    this.emit('shutdown');
    console.log('✅ Multi-Model Orchestration shutdown complete');
    console.log(`   Total tasks: ${this.stats.totalTasks}`);
    console.log(
      `   Success rate: ${((this.stats.successfulTasks / this.stats.totalTasks) * 100).toFixed(1)}%`
    );
  }
}

module.exports = MultiModelOrchestration;
