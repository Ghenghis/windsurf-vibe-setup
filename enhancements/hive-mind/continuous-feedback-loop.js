/**
 * Continuous Feedback Loop - VIBE Hive Mind
 * Real-time learning from every interaction, constantly improving
 * Designed for Ghenghis's rapid iteration and continuous improvement style
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class ContinuousFeedbackLoop extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      feedbackDir: options.feedbackDir || path.join(process.cwd(), 'vibe-data', 'feedback'),
      learningRate: options.learningRate || 0.15,
      adaptationThreshold: options.adaptationThreshold || 0.7,
      feedbackWindow: options.feedbackWindow || 3600000, // 1 hour
      autoLearn: options.autoLearn !== false,
    };

    // Feedback categories
    this.feedback = {
      explicit: new Map(), // Direct user feedback
      implicit: new Map(), // Inferred from actions
      performance: new Map(), // System performance
      outcomes: new Map(), // Task outcomes
    };

    // Learning streams
    this.streams = {
      userPreferences: [],
      codeQuality: [],
      projectSuccess: [],
      interactionPatterns: [],
      errorPatterns: [],
    };

    // Adaptation engine
    this.adaptations = {
      pending: [],
      applied: [],
      rejected: [],
      effectiveness: new Map(),
    };

    // Real-time metrics
    this.metrics = {
      satisfaction: 0.8, // Start optimistic
      productivity: 0.7,
      accuracy: 0.75,
      speed: 0.8,
      innovation: 0.9, // Ghenghis loves innovation
    };

    // Learning cycles
    this.cycles = {
      current: 0,
      history: [],
      improvements: [],
    };

    // Ghenghis-specific learning
    this.userPatterns = {
      workStyle: 'rapid-iteration',
      feedbackStyle: 'action-based', // Learns from what user does, not says
      preferredOutcome: 'complete-solutions',
      tolerance: 'high', // Tolerates experiments
      excitement: ['mcp', 'ai', 'automation'], // What excites user
    };

    // Statistics
    this.stats = {
      totalFeedback: 0,
      learningCycles: 0,
      adaptations: 0,
      improvements: 0,
      regressions: 0,
    };

    this.isInitialized = false;
    this.isLearning = false;
  }

  async initialize() {
    console.log('🔄 Initializing Continuous Feedback Loop...');
    console.log('   Starting real-time learning system...');

    await fs.mkdir(this.config.feedbackDir, { recursive: true });
    await fs.mkdir(path.join(this.config.feedbackDir, 'cycles'), { recursive: true });
    await fs.mkdir(path.join(this.config.feedbackDir, 'adaptations'), { recursive: true });

    // Load existing feedback
    await this.loadFeedback();

    // Start learning loop
    if (this.config.autoLearn) {
      this.startLearning();
    }

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ Continuous Feedback Loop initialized');
    console.log(`   Current satisfaction: ${(this.metrics.satisfaction * 100).toFixed(1)}%`);
  }

  /**
   * Start continuous learning
   */
  startLearning() {
    this.isLearning = true;

    // Main learning cycle
    this.learningInterval = setInterval(() => {
      this.performLearningCycle();
    }, 5000); // Every 5 seconds

    // Adaptation check
    this.adaptationInterval = setInterval(() => {
      this.checkAdaptations();
    }, 30000); // Every 30 seconds

    console.log('🎓 Learning loop started');
  }

  /**
   * Process feedback
   */
  async processFeedback(feedback) {
    const processed = {
      id: crypto.randomBytes(8).toString('hex'),
      type: feedback.type || 'implicit',
      category: feedback.category || 'general',
      value: feedback.value,
      context: feedback.context || {},
      weight: this.calculateWeight(feedback),
      timestamp: Date.now(),
    };

    // Store feedback
    this.storeFeedback(processed);

    // Update metrics immediately
    await this.updateMetrics(processed);

    // Check for immediate adaptations
    if (processed.weight > 0.8) {
      await this.triggerImediateAdaptation(processed);
    }

    // Update learning streams
    this.updateStreams(processed);

    this.stats.totalFeedback++;

    this.emit('feedbackProcessed', processed);

    return processed;
  }

  /**
   * Calculate feedback weight
   */
  calculateWeight(feedback) {
    let weight = 0.5; // Base weight

    // Explicit feedback is more valuable
    if (feedback.type === 'explicit') weight += 0.3;

    // Recent feedback is more relevant
    const age = Date.now() - (feedback.timestamp || Date.now());
    if (age < 60000) weight += 0.2; // Last minute

    // Success/failure has high weight
    if (feedback.category === 'outcome') {
      weight += feedback.value === 'success' ? 0.2 : 0.3;
    }

    // MCP-related feedback (Ghenghis priority)
    if (feedback.context?.project?.includes('mcp')) weight += 0.1;

    return Math.min(weight, 1.0);
  }

  /**
   * Store feedback
   */
  storeFeedback(feedback) {
    const store = this.feedback[feedback.type] || this.feedback.implicit;

    if (!store.has(feedback.category)) {
      store.set(feedback.category, []);
    }

    const categoryFeedback = store.get(feedback.category);
    categoryFeedback.push(feedback);

    // Limit storage
    if (categoryFeedback.length > 100) {
      categoryFeedback.shift();
    }
  }

  /**
   * Update metrics based on feedback
   */
  async updateMetrics(feedback) {
    const alpha = this.config.learningRate;

    switch (feedback.category) {
      case 'satisfaction':
        this.metrics.satisfaction =
          this.metrics.satisfaction * (1 - alpha) + feedback.value * alpha;
        break;

      case 'speed':
        this.metrics.speed = this.metrics.speed * (1 - alpha) + feedback.value * alpha;
        break;

      case 'accuracy':
        this.metrics.accuracy = this.metrics.accuracy * (1 - alpha) + feedback.value * alpha;
        break;

      case 'outcome':
        if (feedback.value === 'success') {
          this.metrics.productivity = Math.min(1.0, this.metrics.productivity + 0.01);
        } else {
          this.metrics.productivity = Math.max(0.3, this.metrics.productivity - 0.02);
        }
        break;

      case 'innovation':
        if (feedback.context?.isNew) {
          this.metrics.innovation = Math.min(1.0, this.metrics.innovation + 0.02);
        }
        break;
    }

    // Emit metric update
    this.emit('metricsUpdated', this.metrics);
  }

  /**
   * Trigger immediate adaptation
   */
  async triggerImmediateAdaptation(feedback) {
    const adaptation = {
      id: crypto.randomBytes(8).toString('hex'),
      trigger: feedback.id,
      type: 'immediate',
      changes: [],
      status: 'pending',
      timestamp: Date.now(),
    };

    // Determine adaptation based on feedback
    if (feedback.category === 'error' && feedback.value === 'repeated') {
      adaptation.changes.push({
        target: 'error-handling',
        action: 'enhance',
        priority: 'high',
      });
    }

    if (feedback.category === 'speed' && feedback.value < 0.5) {
      adaptation.changes.push({
        target: 'performance',
        action: 'optimize',
        priority: 'high',
      });
    }

    if (feedback.category === 'satisfaction' && feedback.value < 0.5) {
      adaptation.changes.push({
        target: 'user-experience',
        action: 'improve',
        priority: 'critical',
      });
    }

    if (adaptation.changes.length > 0) {
      this.adaptations.pending.push(adaptation);
      this.emit('adaptationTriggered', adaptation);
    }
  }

  /**
   * Update learning streams
   */
  updateStreams(feedback) {
    // Route to appropriate stream
    if (feedback.context?.code) {
      this.streams.codeQuality.push(feedback);
    }

    if (feedback.context?.project) {
      this.streams.projectSuccess.push(feedback);
    }

    if (feedback.context?.interaction) {
      this.streams.interactionPatterns.push(feedback);
    }

    if (feedback.category === 'error') {
      this.streams.errorPatterns.push(feedback);
    }

    if (feedback.type === 'explicit' || feedback.category === 'preference') {
      this.streams.userPreferences.push(feedback);
    }

    // Limit stream sizes
    for (const stream of Object.values(this.streams)) {
      if (stream.length > 500) {
        stream.splice(0, stream.length - 500);
      }
    }
  }

  /**
   * Perform learning cycle
   */
  async performLearningCycle() {
    if (!this.isLearning) return;

    const cycle = {
      id: this.cycles.current++,
      startTime: Date.now(),
      insights: [],
      adaptations: [],
      improvements: [],
    };

    // Analyze recent feedback
    const recentFeedback = this.getRecentFeedback();

    // Extract insights
    const insights = await this.extractInsights(recentFeedback);
    cycle.insights = insights;

    // Generate adaptations
    const adaptations = await this.generateAdaptations(insights);
    cycle.adaptations = adaptations;

    // Identify improvements
    const improvements = this.identifyImprovements(insights);
    cycle.improvements = improvements;

    // Store cycle
    this.cycles.history.push(cycle);
    if (this.cycles.history.length > 100) {
      this.cycles.history.shift();
    }

    this.stats.learningCycles++;

    // Apply high-confidence adaptations
    for (const adaptation of adaptations) {
      if (adaptation.confidence > this.config.adaptationThreshold) {
        await this.applyAdaptation(adaptation);
      }
    }

    this.emit('learningCycleComplete', cycle);
  }

  /**
   * Get recent feedback
   */
  getRecentFeedback() {
    const recent = [];
    const cutoff = Date.now() - this.config.feedbackWindow;

    for (const store of Object.values(this.feedback)) {
      for (const feedbackList of store.values()) {
        recent.push(...feedbackList.filter(f => f.timestamp > cutoff));
      }
    }

    return recent;
  }

  /**
   * Extract insights from feedback
   */
  async extractInsights(feedback) {
    const insights = [];

    // Performance trend
    const performanceFeedback = feedback.filter(f => f.category === 'performance');
    if (performanceFeedback.length > 3) {
      const avgPerformance =
        performanceFeedback.reduce((sum, f) => sum + f.value, 0) / performanceFeedback.length;

      insights.push({
        type: 'performance-trend',
        value: avgPerformance,
        trend: avgPerformance > 0.7 ? 'positive' : 'needs-improvement',
        confidence: 0.8,
      });
    }

    // User satisfaction
    const satisfactionFeedback = feedback.filter(f => f.category === 'satisfaction');
    if (satisfactionFeedback.length > 0) {
      const recent = satisfactionFeedback[satisfactionFeedback.length - 1];

      insights.push({
        type: 'user-satisfaction',
        value: recent.value,
        trend: recent.value > this.metrics.satisfaction ? 'improving' : 'declining',
        confidence: 0.9,
      });
    }

    // Error patterns
    const errors = feedback.filter(f => f.category === 'error');
    if (errors.length > 2) {
      const errorTypes = new Map();
      errors.forEach(e => {
        const type = e.context?.errorType || 'unknown';
        errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
      });

      for (const [type, count] of errorTypes) {
        if (count > 1) {
          insights.push({
            type: 'recurring-error',
            errorType: type,
            occurrences: count,
            confidence: 0.85,
          });
        }
      }
    }

    // Success patterns (Ghenghis likes success)
    const successes = feedback.filter(f => f.value === 'success');
    if (successes.length > 0) {
      const patterns = this.analyzeSuccessPatterns(successes);
      insights.push(...patterns);
    }

    return insights;
  }

  analyzeSuccessPatterns(successes) {
    const patterns = [];

    // Group by project type
    const projectTypes = new Map();
    successes.forEach(s => {
      const type = s.context?.projectType || 'general';
      projectTypes.set(type, (projectTypes.get(type) || 0) + 1);
    });

    for (const [type, count] of projectTypes) {
      if (count > 2) {
        patterns.push({
          type: 'success-pattern',
          projectType: type,
          successRate: count / successes.length,
          confidence: 0.75,
        });
      }
    }

    return patterns;
  }

  /**
   * Generate adaptations
   */
  async generateAdaptations(insights) {
    const adaptations = [];

    for (const insight of insights) {
      if (insight.type === 'performance-trend' && insight.trend === 'needs-improvement') {
        adaptations.push({
          id: crypto.randomBytes(8).toString('hex'),
          target: 'performance',
          action: 'optimize-critical-paths',
          confidence: insight.confidence,
          priority: 'high',
        });
      }

      if (insight.type === 'recurring-error') {
        adaptations.push({
          id: crypto.randomBytes(8).toString('hex'),
          target: 'error-handling',
          action: `fix-${insight.errorType}`,
          confidence: insight.confidence,
          priority: 'critical',
        });
      }

      if (insight.type === 'user-satisfaction' && insight.trend === 'declining') {
        adaptations.push({
          id: crypto.randomBytes(8).toString('hex'),
          target: 'user-experience',
          action: 'enhance-interaction',
          confidence: insight.confidence,
          priority: 'high',
        });
      }

      if (insight.type === 'success-pattern') {
        adaptations.push({
          id: crypto.randomBytes(8).toString('hex'),
          target: 'optimization',
          action: `replicate-${insight.projectType}-success`,
          confidence: insight.confidence,
          priority: 'medium',
        });
      }
    }

    return adaptations;
  }

  /**
   * Identify improvements
   */
  identifyImprovements(insights) {
    const improvements = [];

    // Check for positive trends
    const positiveInsights = insights.filter(
      i => i.trend === 'positive' || i.trend === 'improving' || i.type === 'success-pattern'
    );

    for (const insight of positiveInsights) {
      improvements.push({
        area: insight.type,
        improvement: insight.value || insight.successRate,
        confidence: insight.confidence,
      });

      this.stats.improvements++;
    }

    // Check for regressions
    const negativeInsights = insights.filter(
      i => i.trend === 'declining' || i.trend === 'needs-improvement'
    );

    if (negativeInsights.length > 0) {
      this.stats.regressions += negativeInsights.length;
    }

    return improvements;
  }

  /**
   * Apply adaptation
   */
  async applyAdaptation(adaptation) {
    adaptation.status = 'applying';

    try {
      // Simulate applying adaptation
      // In real system, this would trigger actual changes

      await new Promise(resolve => setTimeout(resolve, 100));

      adaptation.status = 'applied';
      adaptation.appliedAt = Date.now();

      this.adaptations.applied.push(adaptation);
      this.stats.adaptations++;

      // Track effectiveness
      this.adaptations.effectiveness.set(adaptation.id, {
        before: { ...this.metrics },
        after: null,
        measureAt: Date.now() + 60000, // Measure after 1 minute
      });

      this.emit('adaptationApplied', adaptation);
    } catch (error) {
      adaptation.status = 'failed';
      adaptation.error = error.message;

      this.adaptations.rejected.push(adaptation);

      this.emit('adaptationFailed', adaptation);
    }
  }

  /**
   * Check adaptation effectiveness
   */
  async checkAdaptations() {
    const now = Date.now();

    for (const [id, measurement] of this.adaptations.effectiveness) {
      if (!measurement.after && now >= measurement.measureAt) {
        measurement.after = { ...this.metrics };

        // Calculate improvement
        const improvement = this.calculateImprovement(measurement.before, measurement.after);

        const adaptation = this.adaptations.applied.find(a => a.id === id);
        if (adaptation) {
          adaptation.effectiveness = improvement;
        }

        this.emit('adaptationMeasured', {
          id,
          improvement,
          effective: improvement > 0,
        });
      }
    }
  }

  calculateImprovement(before, after) {
    let totalImprovement = 0;
    let count = 0;

    for (const key of Object.keys(before)) {
      if (typeof before[key] === 'number' && typeof after[key] === 'number') {
        const improvement = (after[key] - before[key]) / before[key];
        totalImprovement += improvement;
        count++;
      }
    }

    return count > 0 ? totalImprovement / count : 0;
  }

  /**
   * Provide feedback
   */
  async provideFeedback(type, value, context = {}) {
    return this.processFeedback({
      type,
      category: this.categorizeType(type),
      value,
      context,
      timestamp: Date.now(),
    });
  }

  categorizeType(type) {
    const categories = {
      success: 'outcome',
      failure: 'outcome',
      error: 'error',
      slow: 'performance',
      fast: 'performance',
      like: 'satisfaction',
      dislike: 'satisfaction',
      confused: 'accuracy',
      clear: 'accuracy',
    };

    return categories[type] || 'general';
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    return {
      ...this.metrics,
      overall:
        this.metrics.satisfaction * 0.3 +
        this.metrics.productivity * 0.3 +
        this.metrics.accuracy * 0.2 +
        this.metrics.speed * 0.1 +
        this.metrics.innovation * 0.1,
      timestamp: Date.now(),
    };
  }

  /**
   * Get learning summary
   */
  getLearingSummary() {
    return {
      cycles: this.cycles.current,
      totalFeedback: this.stats.totalFeedback,
      adaptations: this.stats.adaptations,
      improvements: this.stats.improvements,
      regressions: this.stats.regressions,
      effectiveness: this.calculateOverallEffectiveness(),
      recentInsights: this.getRecentInsights(),
      metrics: this.getCurrentMetrics(),
    };
  }

  calculateOverallEffectiveness() {
    if (this.stats.adaptations === 0) return 0;

    const effective = this.adaptations.applied.filter(
      a => a.effectiveness && a.effectiveness > 0
    ).length;

    return effective / this.stats.adaptations;
  }

  getRecentInsights() {
    const recent = this.cycles.history.slice(-5);
    const insights = [];

    for (const cycle of recent) {
      insights.push(...cycle.insights);
    }

    return insights.slice(-10);
  }

  /**
   * Storage operations
   */
  async saveFeedback() {
    const data = {
      feedback: {
        explicit: Array.from(this.feedback.explicit.entries()),
        implicit: Array.from(this.feedback.implicit.entries()),
        performance: Array.from(this.feedback.performance.entries()),
        outcomes: Array.from(this.feedback.outcomes.entries()),
      },
      metrics: this.metrics,
      cycles: this.cycles,
      stats: this.stats,
      savedAt: Date.now(),
    };

    const filepath = path.join(this.config.feedbackDir, 'feedback-state.json');
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  async loadFeedback() {
    try {
      const filepath = path.join(this.config.feedbackDir, 'feedback-state.json');
      const content = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(content);

      // Restore feedback
      this.feedback.explicit = new Map(data.feedback.explicit);
      this.feedback.implicit = new Map(data.feedback.implicit);
      this.feedback.performance = new Map(data.feedback.performance);
      this.feedback.outcomes = new Map(data.feedback.outcomes);

      this.metrics = data.metrics;
      this.cycles = data.cycles;
      this.stats = data.stats;

      console.log('📂 Loaded existing feedback');
    } catch (error) {
      console.log('🆕 Starting fresh feedback loop');
    }
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      learning: this.isLearning,
      metrics: this.getCurrentMetrics(),
      cycles: this.cycles.current,
      adaptations: {
        pending: this.adaptations.pending.length,
        applied: this.adaptations.applied.length,
        rejected: this.adaptations.rejected.length,
      },
      statistics: this.stats,
    };
  }

  async shutdown() {
    // Stop learning loops
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
    }

    if (this.adaptationInterval) {
      clearInterval(this.adaptationInterval);
    }

    this.isLearning = false;

    // Save final state
    await this.saveFeedback();

    // Generate final report
    const summary = this.getLearingSummary();
    const reportPath = path.join(this.config.feedbackDir, `learning-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));

    this.emit('shutdown');
    console.log('✅ Continuous Feedback Loop shutdown complete');
    console.log(`   Total feedback: ${this.stats.totalFeedback}`);
    console.log(`   Learning cycles: ${this.stats.learningCycles}`);
    console.log(`   Improvements: ${this.stats.improvements}`);
  }
}

module.exports = ContinuousFeedbackLoop;
