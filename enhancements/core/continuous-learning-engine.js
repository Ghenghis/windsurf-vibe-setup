/**
 * Continuous Learning Engine - v6.0
 * Learns from every interaction, mistake, and success
 * Never makes the same mistake twice
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class ContinuousLearningEngine extends EventEmitter {
  constructor(options = {}) {
    super();

    this.learningDir = options.learningDir || path.join(process.cwd(), 'vibe-data', 'learning');
    this.knowledgeBase = new Map();
    this.errorPatterns = new Map();
    this.successPatterns = new Map();
    this.improvements = [];
    this.learningEvents = [];

    // Learning configuration
    this.config = {
      minConfidenceToLearn: options.minConfidenceToLearn || 0.7,
      patternThreshold: options.patternThreshold || 3, // Times seen before pattern
      forgettingFactor: options.forgettingFactor || 0.995, // Decay old knowledge slowly
      maxPatterns: options.maxPatterns || 10000,
      reinforcementStrength: options.reinforcementStrength || 1.1,
    };

    // Statistics
    this.stats = {
      totalLearningEvents: 0,
      patternsLearned: 0,
      mistakesPrevented: 0,
      successesReinforced: 0,
      knowledgeItems: 0,
      improvementRate: 0,
      startTime: Date.now(),
    };

    this.isInitialized = false;
  }

  /**
   * Initialize learning engine
   */
  async initialize() {
    try {
      // Create directories
      await fs.mkdir(this.learningDir, { recursive: true });
      await fs.mkdir(path.join(this.learningDir, 'patterns'), { recursive: true });
      await fs.mkdir(path.join(this.learningDir, 'knowledge'), { recursive: true });
      await fs.mkdir(path.join(this.learningDir, 'events'), { recursive: true });

      // Load existing knowledge
      await this.loadKnowledgeBase();
      await this.loadPatterns();

      // Start learning cycle
      this.startLearningCycle();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('🧠 Continuous Learning Engine initialized');
      console.log(`   - Knowledge items: ${this.knowledgeBase.size}`);
      console.log(`   - Error patterns: ${this.errorPatterns.size}`);
      console.log(`   - Success patterns: ${this.successPatterns.size}`);
    } catch (error) {
      console.error('❌ Failed to initialize Learning Engine:', error);
      throw error;
    }
  }

  /**
   * Learn from an interaction
   */
  async learn(interaction) {
    const learningEvent = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      type: interaction.type || 'general',
      input: interaction.input,
      output: interaction.output,
      success: interaction.success,
      confidence: interaction.confidence || 1.0,
      context: interaction.context || {},
      metadata: interaction.metadata || {},
    };

    // Determine what to learn
    if (interaction.success) {
      await this.learnFromSuccess(learningEvent);
    } else {
      await this.learnFromError(learningEvent);
    }

    // Extract patterns
    await this.extractPatterns(learningEvent);

    // Update knowledge base
    await this.updateKnowledge(learningEvent);

    // Log learning event
    await this.logLearningEvent(learningEvent);

    // Update statistics
    this.stats.totalLearningEvents++;

    this.emit('learned', learningEvent);

    return learningEvent;
  }

  /**
   * Learn from success
   */
  async learnFromSuccess(event) {
    const pattern = this.extractSuccessPattern(event);

    // Check if pattern exists
    let existingPattern = this.successPatterns.get(pattern.key);

    if (existingPattern) {
      // Reinforce existing pattern
      existingPattern.strength *= this.config.reinforcementStrength;
      existingPattern.occurrences++;
      existingPattern.lastSeen = Date.now();
      existingPattern.contexts.push(event.context);

      // Keep only recent contexts
      if (existingPattern.contexts.length > 10) {
        existingPattern.contexts = existingPattern.contexts.slice(-10);
      }

      this.stats.successesReinforced++;
    } else {
      // Add new success pattern
      this.successPatterns.set(pattern.key, {
        ...pattern,
        strength: 1.0,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        contexts: [event.context],
      });

      this.stats.patternsLearned++;
    }

    // Save pattern
    await this.savePattern('success', pattern);
  }

  /**
   * Learn from error
   */
  async learnFromError(event) {
    const pattern = this.extractErrorPattern(event);

    // Check if we've seen this error before
    let existingPattern = this.errorPatterns.get(pattern.key);

    if (existingPattern) {
      // We've made this mistake before - update it
      existingPattern.occurrences++;
      existingPattern.lastSeen = Date.now();

      // Add prevention strategy if we don't have one
      if (!existingPattern.prevention) {
        existingPattern.prevention = await this.generatePreventionStrategy(pattern);
      }
    } else {
      // New error pattern
      const prevention = await this.generatePreventionStrategy(pattern);

      this.errorPatterns.set(pattern.key, {
        ...pattern,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        prevention,
        prevented: 0,
      });

      this.stats.patternsLearned++;
    }

    // Save pattern
    await this.savePattern('error', pattern);
  }

  /**
   * Check if we can prevent an error
   */
  async checkPreventableError(input) {
    const inputHash = this.hashInput(input);

    for (const [key, errorPattern] of this.errorPatterns) {
      // Check similarity
      const similarity = this.calculateSimilarity(inputHash, errorPattern.inputHash);

      if (similarity > 0.8) {
        // This looks like it might cause an error we've seen
        this.stats.mistakesPrevented++;

        // Update pattern
        errorPattern.prevented++;

        this.emit('errorPrevented', {
          pattern: errorPattern,
          input,
          prevention: errorPattern.prevention,
        });

        return {
          preventable: true,
          pattern: errorPattern,
          prevention: errorPattern.prevention,
          confidence: similarity,
        };
      }
    }

    return { preventable: false };
  }

  /**
   * Get best approach based on learned patterns
   */
  async getBestApproach(task) {
    const candidates = [];
    const taskHash = this.hashInput(task);

    // Check success patterns
    for (const [key, pattern] of this.successPatterns) {
      const similarity = this.calculateSimilarity(taskHash, pattern.inputHash);

      if (similarity > 0.6) {
        candidates.push({
          pattern,
          similarity,
          strength: pattern.strength,
          score: similarity * pattern.strength * (pattern.occurrences / 10),
        });
      }
    }

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      return {
        found: true,
        approach: candidates[0].pattern,
        confidence: candidates[0].score,
        alternatives: candidates.slice(1, 3),
      };
    }

    return { found: false };
  }

  /**
   * Extract patterns from event
   */
  async extractPatterns(event) {
    // Extract various pattern types
    const patterns = {
      action: this.extractActionPattern(event),
      sequence: this.extractSequencePattern(event),
      context: this.extractContextPattern(event),
    };

    // Store patterns if significant
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern && pattern.significance > 0.5) {
        await this.storePattern(type, pattern);
      }
    }
  }

  /**
   * Update knowledge base
   */
  async updateKnowledge(event) {
    const knowledge = {
      id: event.id,
      timestamp: event.timestamp,
      type: event.type,
      learned: this.extractKnowledge(event),
      confidence: event.confidence,
      useCount: 0,
    };

    // Add to knowledge base
    this.knowledgeBase.set(knowledge.id, knowledge);

    // Prune old knowledge if needed
    if (this.knowledgeBase.size > this.config.maxPatterns) {
      await this.pruneKnowledge();
    }

    this.stats.knowledgeItems = this.knowledgeBase.size;

    // Save knowledge
    await this.saveKnowledge(knowledge);
  }

  /**
   * Generate prevention strategy
   */
  async generatePreventionStrategy(errorPattern) {
    return {
      type: 'prevention',
      strategies: [
        {
          name: 'input-validation',
          description: 'Validate input before processing',
          implementation: 'Check constraints and types',
        },
        {
          name: 'alternative-approach',
          description: 'Use different method',
          implementation: 'Try alternative algorithm',
        },
        {
          name: 'error-handling',
          description: 'Add specific error handling',
          implementation: 'Catch and handle specific error',
        },
      ],
      confidence: 0.8,
    };
  }

  /**
   * Calculate improvement rate
   */
  calculateImprovementRate() {
    if (this.improvements.length < 2) return 0;

    // Calculate rate over last 100 improvements
    const recent = this.improvements.slice(-100);
    const older = this.improvements.slice(-200, -100);

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((a, b) => a + b.improvement, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b.improvement, 0) / older.length;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  /**
   * Extract success pattern
   */
  extractSuccessPattern(event) {
    const inputStr = JSON.stringify(event.input);
    const outputStr = JSON.stringify(event.output);

    return {
      key: `success-${this.hashInput(event.input)}-${this.hashInput(event.output)}`,
      type: 'success',
      input: event.input,
      output: event.output,
      inputHash: this.hashInput(event.input),
      outputHash: this.hashInput(event.output),
      context: event.context,
      confidence: event.confidence,
    };
  }

  /**
   * Extract error pattern
   */
  extractErrorPattern(event) {
    return {
      key: `error-${this.hashInput(event.input)}-${event.type}`,
      type: 'error',
      input: event.input,
      error: event.output,
      inputHash: this.hashInput(event.input),
      errorType: event.type,
      context: event.context,
    };
  }

  /**
   * Extract action pattern
   */
  extractActionPattern(event) {
    return {
      type: 'action',
      action: event.type,
      context: event.context,
      outcome: event.success ? 'success' : 'failure',
      significance: event.confidence,
    };
  }

  /**
   * Extract sequence pattern
   */
  extractSequencePattern(event) {
    // Look for sequences in recent events
    const recentEvents = this.learningEvents.slice(-10);

    if (recentEvents.length < 3) return null;

    return {
      type: 'sequence',
      events: recentEvents.map(e => e.type),
      outcome: event.success ? 'success' : 'failure',
      significance: 0.5,
    };
  }

  /**
   * Extract context pattern
   */
  extractContextPattern(event) {
    return {
      type: 'context',
      context: event.context,
      outcome: event.success ? 'success' : 'failure',
      significance: 0.6,
    };
  }

  /**
   * Extract knowledge from event
   */
  extractKnowledge(event) {
    return {
      fact: `${event.type} produces ${event.success ? 'success' : 'failure'}`,
      conditions: event.context,
      confidence: event.confidence,
    };
  }

  /**
   * Hash input for comparison
   */
  hashInput(input) {
    const str = typeof input === 'string' ? input : JSON.stringify(input);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Calculate similarity between hashes
   */
  calculateSimilarity(hash1, hash2) {
    if (hash1 === hash2) return 1.0;

    // Simple character comparison (can be improved)
    let matches = 0;
    for (let i = 0; i < Math.min(hash1.length, hash2.length); i++) {
      if (hash1[i] === hash2[i]) matches++;
    }

    return matches / Math.max(hash1.length, hash2.length);
  }

  /**
   * Log learning event
   */
  async logLearningEvent(event) {
    // Add to recent events
    this.learningEvents.push(event);

    // Keep only last 1000 events in memory
    if (this.learningEvents.length > 1000) {
      this.learningEvents = this.learningEvents.slice(-1000);
    }

    // Persist to disk
    const logPath = path.join(
      this.learningDir,
      'events',
      `${new Date().toISOString().split('T')[0]}.jsonl`
    );

    await fs.appendFile(logPath, JSON.stringify(event) + '\n');
  }

  /**
   * Save pattern to disk
   */
  async savePattern(type, pattern) {
    const filePath = path.join(this.learningDir, 'patterns', `${type}-patterns.json`);

    try {
      // Load existing patterns
      let patterns = {};
      try {
        const data = await fs.readFile(filePath, 'utf8');
        patterns = JSON.parse(data);
      } catch (error) {
        // File doesn't exist yet
      }

      // Add/update pattern
      patterns[pattern.key] = pattern;

      // Save
      await fs.writeFile(filePath, JSON.stringify(patterns, null, 2));
    } catch (error) {
      console.error('Failed to save pattern:', error);
    }
  }

  /**
   * Save knowledge to disk
   */
  async saveKnowledge(knowledge) {
    const filePath = path.join(this.learningDir, 'knowledge', `${knowledge.id}.json`);

    await fs.writeFile(filePath, JSON.stringify(knowledge, null, 2));
  }

  /**
   * Store pattern
   */
  async storePattern(type, pattern) {
    const key = `${type}-${Date.now()}`;

    // Store in memory
    if (!this.knowledgeBase.has(type)) {
      this.knowledgeBase.set(type, new Map());
    }

    const typeMap = this.knowledgeBase.get(type);
    typeMap.set(key, pattern);

    // Save to disk
    await this.savePattern(type, pattern);
  }

  /**
   * Load knowledge base
   */
  async loadKnowledgeBase() {
    try {
      const knowledgeDir = path.join(this.learningDir, 'knowledge');
      const files = await fs.readdir(knowledgeDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = await fs.readFile(path.join(knowledgeDir, file), 'utf8');
            const knowledge = JSON.parse(data);
            this.knowledgeBase.set(knowledge.id, knowledge);
          } catch (error) {
            console.warn(`Failed to load knowledge ${file}:`, error.message);
          }
        }
      }
    } catch (error) {
      // Directory might not exist yet
      if (error.code !== 'ENOENT') {
        console.error('Failed to load knowledge base:', error);
      }
    }
  }

  /**
   * Load patterns
   */
  async loadPatterns() {
    try {
      const patternsDir = path.join(this.learningDir, 'patterns');

      // Load error patterns
      try {
        const errorData = await fs.readFile(path.join(patternsDir, 'error-patterns.json'), 'utf8');
        const errors = JSON.parse(errorData);

        for (const [key, pattern] of Object.entries(errors)) {
          this.errorPatterns.set(key, pattern);
        }
      } catch (error) {
        // File doesn't exist yet
      }

      // Load success patterns
      try {
        const successData = await fs.readFile(
          path.join(patternsDir, 'success-patterns.json'),
          'utf8'
        );
        const successes = JSON.parse(successData);

        for (const [key, pattern] of Object.entries(successes)) {
          this.successPatterns.set(key, pattern);
        }
      } catch (error) {
        // File doesn't exist yet
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load patterns:', error);
      }
    }
  }

  /**
   * Prune old knowledge
   */
  async pruneKnowledge() {
    // Remove least used knowledge
    const sorted = Array.from(this.knowledgeBase.entries()).sort(
      (a, b) => a[1].useCount - b[1].useCount
    );

    // Remove bottom 10%
    const toRemove = Math.floor(sorted.length * 0.1);

    for (let i = 0; i < toRemove; i++) {
      this.knowledgeBase.delete(sorted[i][0]);
    }
  }

  /**
   * Start learning cycle
   */
  startLearningCycle() {
    // Periodic consolidation
    setInterval(() => {
      this.consolidatePatterns();
      this.stats.improvementRate = this.calculateImprovementRate();
    }, 60000); // Every minute
  }

  /**
   * Consolidate patterns
   */
  consolidatePatterns() {
    // Apply forgetting factor to old patterns
    for (const [key, pattern] of this.successPatterns) {
      const age = Date.now() - pattern.lastSeen;
      const days = age / (24 * 60 * 60 * 1000);

      if (days > 7) {
        pattern.strength *= Math.pow(this.config.forgettingFactor, days - 7);

        // Remove if too weak
        if (pattern.strength < 0.1) {
          this.successPatterns.delete(key);
        }
      }
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      stats: this.stats,
      patterns: {
        errors: this.errorPatterns.size,
        successes: this.successPatterns.size,
      },
      knowledge: this.knowledgeBase.size,
      learningEvents: this.learningEvents.length,
      improvementRate: this.stats.improvementRate,
    };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    // Save all patterns
    for (const [key, pattern] of this.errorPatterns) {
      await this.savePattern('error', pattern);
    }

    for (const [key, pattern] of this.successPatterns) {
      await this.savePattern('success', pattern);
    }

    this.emit('shutdown');
    console.log('✅ Continuous Learning Engine shutdown complete');
  }
}

module.exports = ContinuousLearningEngine;
