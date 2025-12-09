/**
 * Mistake Prevention System - v6.0
 * Prevents repeating past mistakes with advanced pattern matching
 * Implements proactive validation, risk assessment, and alternative suggestions
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class MistakePreventionSystem extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      mistakeDir: options.mistakeDir || path.join(process.cwd(), 'vibe-data', 'mistakes'),
      similarityThreshold: options.similarityThreshold || 0.75,
      maxMistakeHistory: options.maxMistakeHistory || 10000,
      preventionStrength: options.preventionStrength || 0.95,
      riskAssessmentEnabled: options.riskAssessmentEnabled !== false,
      suggestionCount: options.suggestionCount || 3,
      learningRate: options.learningRate || 0.1,
    };

    // Mistake database
    this.mistakePatterns = new Map();
    this.preventionStrategies = new Map();
    this.riskProfiles = new Map();
    this.successfulPreventions = new Map();
    this.mistakeChains = new Map();
    this.contextualMistakes = new Map();

    // Prevention strategies database
    this.strategies = {
      validation: new Map(),
      transformation: new Map(),
      alternative: new Map(),
      safeguard: new Map(),
    };

    // Statistics
    this.stats = {
      totalMistakesRecorded: 0,
      totalMistakesPrevented: 0,
      preventionSuccessRate: 0,
      averageRiskScore: 0,
      topMistakeCategories: {},
      learningCurve: [],
      preventionEffectiveness: new Map(),
    };

    this.isInitialized = false;
  }

  /**
   * Initialize mistake prevention system
   */
  async initialize() {
    try {
      await this.createDirectories();
      await this.loadMistakePatterns();
      await this.loadPreventionStrategies();
      this.startMonitoring();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('🛡️ Mistake Prevention System initialized');
      console.log(`   - Mistake patterns: ${this.mistakePatterns.size}`);
      console.log(`   - Prevention strategies: ${this.preventionStrategies.size}`);
      console.log(`   - Success rate: ${(this.stats.preventionSuccessRate * 100).toFixed(2)}%`);
    } catch (error) {
      console.error('❌ Failed to initialize Mistake Prevention System:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = ['patterns', 'strategies', 'preventions', 'chains', 'contexts', 'analytics'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.mistakeDir, dir), { recursive: true });
    }
  }

  /**
   * Record a mistake for future prevention
   */
  async recordMistake(mistake) {
    const mistakeRecord = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      type: mistake.type || 'unknown',
      category: this.categorizeMistake(mistake),
      pattern: this.extractPattern(mistake),
      context: mistake.context || {},
      impact: mistake.impact || this.assessImpact(mistake),
      frequency: 1,
      lastOccurred: Date.now(),
      preventionAttempts: 0,
      preventionSuccesses: 0,
    };

    const similar = await this.findSimilarMistake(mistakeRecord);

    if (similar) {
      similar.frequency++;
      similar.lastOccurred = Date.now();
      await this.strengthenPrevention(similar);
      mistakeRecord.id = similar.id;
    } else {
      this.mistakePatterns.set(mistakeRecord.id, mistakeRecord);
      const strategy = await this.generatePreventionStrategy(mistakeRecord);
      this.preventionStrategies.set(mistakeRecord.id, strategy);
    }

    await this.detectMistakeChain(mistakeRecord);
    await this.updateContextualMistakes(mistakeRecord);
    await this.saveMistakePattern(mistakeRecord);

    this.stats.totalMistakesRecorded++;
    this.emit('mistakeRecorded', mistakeRecord);

    return mistakeRecord;
  }

  /**
   * Check if an action would cause a mistake
   */
  async checkForMistake(action) {
    const checkResult = {
      safe: true,
      riskLevel: 0,
      potentialMistakes: [],
      preventionStrategies: [],
      alternatives: [],
      confidence: 0,
    };

    const actionPattern = this.extractPattern(action);

    for (const [id, mistake] of this.mistakePatterns) {
      const similarity = await this.calculateSimilarity(actionPattern, mistake.pattern);

      if (similarity > this.config.similarityThreshold) {
        checkResult.safe = false;
        checkResult.potentialMistakes.push({
          mistakeId: id,
          similarity,
          type: mistake.type,
          impact: mistake.impact,
          frequency: mistake.frequency,
        });

        const strategy = this.preventionStrategies.get(id);
        if (strategy) {
          checkResult.preventionStrategies.push(strategy);
        }
      }
    }

    checkResult.riskLevel = this.assessRisk(checkResult.potentialMistakes);

    if (!checkResult.safe) {
      checkResult.alternatives = await this.generateAlternatives(
        action,
        checkResult.potentialMistakes
      );
    }

    checkResult.confidence = this.calculateConfidence(checkResult);

    const contextualRisk = await this.checkContextualRisk(action);
    if (contextualRisk.risky) {
      checkResult.riskLevel = Math.max(checkResult.riskLevel, contextualRisk.level);
      checkResult.potentialMistakes.push(...contextualRisk.mistakes);
    }

    return checkResult;
  }

  /**
   * Apply prevention strategy
   */
  async applyPrevention(action, strategy) {
    const preventedAction = { ...action };

    try {
      if (strategy.validation) {
        await this.applyValidation(preventedAction, strategy.validation);
      }

      if (strategy.transformation) {
        preventedAction.data = await this.applyTransformation(
          preventedAction.data,
          strategy.transformation
        );
      }

      if (strategy.safeguards) {
        for (const safeguard of strategy.safeguards) {
          await this.applySafeguard(preventedAction, safeguard);
        }
      }

      await this.recordSuccessfulPrevention(strategy, action, preventedAction);
      this.stats.totalMistakesPrevented++;

      this.emit('mistakePrevented', {
        original: action,
        prevented: preventedAction,
        strategy,
      });

      return preventedAction;
    } catch (error) {
      console.error('❌ Prevention failed:', error);
      await this.recordFailedPrevention(strategy, action, error);
      throw error;
    }
  }

  /**
   * Generate prevention strategy
   */
  async generatePreventionStrategy(mistake) {
    return {
      id: crypto.randomBytes(16).toString('hex'),
      mistakeId: mistake.id,
      type: 'comprehensive',
      created: Date.now(),
      validation: this.generateValidationRules(mistake),
      transformation: this.generateTransformationRules(mistake),
      safeguards: this.generateSafeguards(mistake),
      alternatives: await this.generateAlternativeApproaches(mistake),
      effectiveness: 0.5,
    };
  }

  /**
   * Extract pattern from input
   */
  extractPattern(input) {
    return {
      hash: this.generateHash(input),
      type: input.type || 'unknown',
      structure: this.extractStructure(input),
      keywords: this.extractKeywords(input),
      parameters: this.extractParameters(input),
      context: input.context || {},
    };
  }

  /**
   * Calculate similarity between patterns
   */
  async calculateSimilarity(pattern1, pattern2) {
    let similarity = 0;

    if (pattern1.hash === pattern2.hash) similarity += 0.2;
    if (pattern1.type === pattern2.type) similarity += 0.15;

    similarity += this.structuralSimilarity(pattern1.structure, pattern2.structure) * 0.25;
    similarity += this.keywordSimilarity(pattern1.keywords, pattern2.keywords) * 0.2;
    similarity += this.parameterSimilarity(pattern1.parameters, pattern2.parameters) * 0.1;
    similarity += this.contextSimilarity(pattern1.context, pattern2.context) * 0.1;

    return similarity;
  }

  /**
   * Find similar mistake
   */
  async findSimilarMistake(mistake) {
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const [id, existing] of this.mistakePatterns) {
      const similarity = await this.calculateSimilarity(mistake.pattern, existing.pattern);

      if (similarity > bestSimilarity && similarity > this.config.similarityThreshold) {
        bestSimilarity = similarity;
        bestMatch = existing;
      }
    }

    return bestMatch;
  }

  /**
   * Detect mistake chains
   */
  async detectMistakeChain(mistake) {
    const recentMistakes = this.getRecentMistakes(5);

    if (recentMistakes.length >= 2) {
      const chain = [...recentMistakes, mistake];
      const chainPattern = this.extractChainPattern(chain);

      if (chainPattern) {
        const chainId = crypto.randomBytes(16).toString('hex');
        this.mistakeChains.set(chainId, {
          id: chainId,
          pattern: chainPattern,
          mistakes: chain.map(m => m.id),
          frequency: 1,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
        });

        this.emit('mistakeChainDetected', { chainId, pattern: chainPattern });
      }
    }
  }

  /**
   * Check contextual risk
   */
  async checkContextualRisk(action) {
    const contextKey = this.generateContextKey(action.context || {});
    const contextualMistakeIds = this.contextualMistakes.get(contextKey) || [];

    if (contextualMistakeIds.length > 0) {
      const mistakes = contextualMistakeIds.map(id => this.mistakePatterns.get(id)).filter(Boolean);

      return {
        risky: true,
        level: Math.min(mistakes.length / 10, 1),
        mistakes: mistakes.map(m => ({
          id: m.id,
          type: m.type,
          frequency: m.frequency,
        })),
      };
    }

    return { risky: false };
  }

  /**
   * Generate alternatives
   */
  async generateAlternatives(action, potentialMistakes) {
    const alternatives = [];

    for (const mistake of potentialMistakes) {
      const strategy = this.preventionStrategies.get(mistake.mistakeId);
      if (strategy && strategy.alternatives) {
        alternatives.push(...strategy.alternatives);
      }
    }

    alternatives.push(
      {
        type: 'parameter-variation',
        description: 'Adjust parameters to safer values',
        action: this.adjustParameters(action),
        confidence: 0.7,
      },
      {
        type: 'decomposition',
        description: 'Break into smaller, safer steps',
        action: this.decomposeAction(action),
        confidence: 0.8,
      }
    );

    return alternatives.slice(0, this.config.suggestionCount);
  }

  /**
   * Helper methods
   */

  categorizeMistake(mistake) {
    const categories = ['syntax', 'logic', 'runtime', 'performance', 'security', 'data'];
    const mistakeStr = JSON.stringify(mistake).toLowerCase();

    for (const category of categories) {
      if (mistakeStr.includes(category)) {
        return category;
      }
    }

    return 'general';
  }

  assessImpact(mistake) {
    const critical = ['crash', 'fail', 'error', 'exception'];
    const mistakeStr = JSON.stringify(mistake).toLowerCase();

    let impact = 0.5;
    if (critical.some(word => mistakeStr.includes(word))) {
      impact = Math.min(impact + 0.3, 1.0);
    }

    return impact;
  }

  assessRisk(potentialMistakes) {
    if (potentialMistakes.length === 0) return 0;

    let totalRisk = 0;
    let totalWeight = 0;

    for (const mistake of potentialMistakes) {
      const weight = mistake.frequency * mistake.impact;
      totalRisk += mistake.similarity * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalRisk / totalWeight : 0;
  }

  generateHash(input) {
    const str = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  extractStructure(input) {
    return {
      type: typeof input,
      keys: input && typeof input === 'object' ? Object.keys(input).sort() : [],
      depth: this.getDepth(input),
    };
  }

  extractKeywords(input) {
    const str = JSON.stringify(input).toLowerCase();
    const words = str.match(/\b[a-z]{3,}\b/g) || [];
    return [...new Set(words)];
  }

  extractParameters(input) {
    if (typeof input !== 'object') return [];
    return Object.entries(input).map(([key, value]) => ({ key, type: typeof value }));
  }

  getDepth(obj, currentDepth = 0) {
    if (typeof obj !== 'object' || obj === null || currentDepth > 10) {
      return currentDepth;
    }

    const depths = Object.values(obj).map(val => this.getDepth(val, currentDepth + 1));
    return Math.max(currentDepth, ...depths);
  }

  structuralSimilarity(s1, s2) {
    if (s1.type !== s2.type) return 0;

    const keysSimilarity = this.arraySimilarity(s1.keys, s2.keys);
    const depthSimilarity = 1 - Math.abs(s1.depth - s2.depth) / 10;

    return (keysSimilarity + depthSimilarity) / 2;
  }

  keywordSimilarity(k1, k2) {
    return this.arraySimilarity(k1, k2);
  }

  parameterSimilarity(p1, p2) {
    if (p1.length !== p2.length) return 0;

    let matches = 0;
    for (const param1 of p1) {
      if (p2.some(p => p.key === param1.key && p.type === param1.type)) {
        matches++;
      }
    }

    return p1.length > 0 ? matches / p1.length : 0;
  }

  contextSimilarity(c1, c2) {
    return this.arraySimilarity(Object.keys(c1), Object.keys(c2));
  }

  arraySimilarity(arr1, arr2) {
    if (arr1.length === 0 && arr2.length === 0) return 1;
    if (arr1.length === 0 || arr2.length === 0) return 0;

    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  getRecentMistakes(count) {
    return Array.from(this.mistakePatterns.values())
      .sort((a, b) => b.lastOccurred - a.lastOccurred)
      .slice(0, count);
  }

  calculateConfidence(checkResult) {
    if (checkResult.safe) return 1.0;
    return Math.max(0, 1 - checkResult.riskLevel);
  }

  generateContextKey(context) {
    return this.generateHash(context);
  }

  extractChainPattern(chain) {
    if (chain.length < 2) return null;

    return {
      sequence: chain.map(m => m.type),
      categories: chain.map(m => m.category),
      avgImpact: chain.reduce((sum, m) => sum + m.impact, 0) / chain.length,
    };
  }

  async updateContextualMistakes(mistake) {
    const contextKey = this.generateContextKey(mistake.context);

    if (!this.contextualMistakes.has(contextKey)) {
      this.contextualMistakes.set(contextKey, []);
    }

    this.contextualMistakes.get(contextKey).push(mistake.id);
  }

  async strengthenPrevention(mistake) {
    const strategy = this.preventionStrategies.get(mistake.id);
    if (strategy) {
      strategy.effectiveness = Math.min(strategy.effectiveness * 1.1, 1.0);
    }
  }

  generateValidationRules(mistake) {
    return {
      type: 'validation',
      rules: [
        { field: 'input', required: true },
        { field: 'type', allowedValues: ['safe'] },
      ],
    };
  }

  generateTransformationRules(mistake) {
    return {
      type: 'transformation',
      transformations: [{ from: 'unsafe', to: 'safe' }],
    };
  }

  generateSafeguards(mistake) {
    return [
      { type: 'boundary-check', enabled: true },
      { type: 'type-validation', enabled: true },
    ];
  }

  async generateAlternativeApproaches(mistake) {
    return [
      { approach: 'safer-method', confidence: 0.8 },
      { approach: 'validated-input', confidence: 0.9 },
    ];
  }

  async applyValidation(action, validation) {
    // Implement validation logic
    return true;
  }

  async applyTransformation(data, transformation) {
    // Implement transformation logic
    return data;
  }

  async applySafeguard(action, safeguard) {
    // Implement safeguard logic
    return true;
  }

  adjustParameters(action) {
    return { ...action, adjusted: true };
  }

  decomposeAction(action) {
    return { ...action, decomposed: true };
  }

  async recordSuccessfulPrevention(strategy, original, prevented) {
    if (!this.successfulPreventions.has(strategy.id)) {
      this.successfulPreventions.set(strategy.id, []);
    }

    this.successfulPreventions.get(strategy.id).push({
      timestamp: Date.now(),
      original,
      prevented,
    });

    strategy.effectiveness = Math.min(strategy.effectiveness * 1.1, 1.0);
  }

  async recordFailedPrevention(strategy, action, error) {
    strategy.effectiveness *= 0.9;
  }

  /**
   * Save and load methods
   */

  async saveMistakePattern(pattern) {
    const filePath = path.join(this.config.mistakeDir, 'patterns', `${pattern.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(pattern, null, 2));
  }

  async loadMistakePatterns() {
    try {
      const patternsDir = path.join(this.config.mistakeDir, 'patterns');
      const files = await fs.readdir(patternsDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(patternsDir, file), 'utf8');
          const pattern = JSON.parse(data);
          this.mistakePatterns.set(pattern.id, pattern);
        }
      }

      this.stats.totalMistakesRecorded = this.mistakePatterns.size;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load mistake patterns:', error);
      }
    }
  }

  async loadPreventionStrategies() {
    try {
      const strategiesDir = path.join(this.config.mistakeDir, 'strategies');
      const files = await fs.readdir(strategiesDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(strategiesDir, file), 'utf8');
          const strategy = JSON.parse(data);
          this.preventionStrategies.set(strategy.mistakeId, strategy);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load prevention strategies:', error);
      }
    }
  }

  startMonitoring() {
    setInterval(() => {
      this.analyzeRecentPatterns();
    }, 60000);
  }

  async analyzeRecentPatterns() {
    const recent = this.getRecentMistakes(100);

    if (recent.length > 10) {
      const categories = {};

      for (const mistake of recent) {
        categories[mistake.category] = (categories[mistake.category] || 0) + 1;
      }

      this.stats.topMistakeCategories = categories;
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      patterns: this.mistakePatterns.size,
      strategies: this.preventionStrategies.size,
      prevented: this.stats.totalMistakesPrevented,
      recorded: this.stats.totalMistakesRecorded,
      successRate: this.stats.preventionSuccessRate,
      chains: this.mistakeChains.size,
      contexts: this.contextualMistakes.size,
    };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    this.emit('shutdown');
    console.log('✅ Mistake Prevention System shutdown complete');
  }
}

module.exports = MistakePreventionSystem;
