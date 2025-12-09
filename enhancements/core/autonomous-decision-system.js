/**
 * Autonomous Decision System - v6.0
 * Makes intelligent decisions without human intervention
 * Uses multi-criteria analysis, risk assessment, and confidence scoring
 *
 * Part 1: Core initialization and decision framework
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class AutonomousDecisionSystem extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      decisionDir: options.decisionDir || path.join(process.cwd(), 'vibe-data', 'decisions'),
      confidenceThreshold: options.confidenceThreshold || 0.7,
      riskTolerance: options.riskTolerance || 'medium',
      decisionTimeout: options.decisionTimeout || 5000,
      maxAlternatives: options.maxAlternatives || 5,
      learningEnabled: options.learningEnabled !== false,
      consensusRequired: options.consensusRequired || false,
    };

    // Decision types and strategies
    this.decisionTypes = {
      technical: ['algorithm-selection', 'architecture-choice', 'tool-selection'],
      operational: ['resource-allocation', 'priority-setting', 'scheduling'],
      strategic: ['feature-planning', 'technology-adoption', 'optimization-strategy'],
      corrective: ['error-handling', 'recovery-action', 'rollback-decision'],
    };

    // Decision models
    this.models = {
      multiCriteria: this.multiCriteriaAnalysis.bind(this),
      costBenefit: this.costBenefitAnalysis.bind(this),
      riskAssessment: this.riskBasedDecision.bind(this),
      consensus: this.consensusDecision.bind(this),
      probabilistic: this.probabilisticDecision.bind(this),
      rulebased: this.ruleBasedDecision.bind(this),
    };

    // Decision history
    this.decisions = new Map();
    this.pendingDecisions = [];
    this.decisionOutcomes = new Map();

    // Criteria weights
    this.criteriaWeights = {
      performance: 0.25,
      reliability: 0.2,
      maintainability: 0.15,
      cost: 0.15,
      complexity: 0.1,
      risk: 0.15,
    };

    // Rules engine
    this.rules = new Map();
    this.constraints = new Map();

    // Learning data
    this.learningData = {
      successfulPatterns: new Map(),
      failurePatterns: new Map(),
      adjustedWeights: new Map(),
    };

    // Statistics
    this.stats = {
      totalDecisions: 0,
      autonomousDecisions: 0,
      overriddenDecisions: 0,
      successRate: 0,
      averageConfidence: 0,
      decisionTime: {
        min: Infinity,
        max: 0,
        avg: 0,
      },
    };

    this.isInitialized = false;
  }

  /**
   * Initialize decision system
   */
  async initialize() {
    try {
      console.log('🤖 Initializing Autonomous Decision System...');

      // Create directory structure
      await this.createDirectories();

      // Load decision rules
      await this.loadDecisionRules();

      // Load historical decisions
      await this.loadDecisionHistory();

      // Load learning data
      await this.loadLearningData();

      // Initialize decision models
      this.initializeModels();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Autonomous Decision System initialized');
      console.log(`   - Rules loaded: ${this.rules.size}`);
      console.log(`   - Historical decisions: ${this.decisions.size}`);
      console.log(`   - Learning patterns: ${this.learningData.successfulPatterns.size}`);
    } catch (error) {
      console.error('❌ Failed to initialize Autonomous Decision System:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = [
      'decisions',
      'decisions/pending',
      'decisions/completed',
      'rules',
      'rules/technical',
      'rules/operational',
      'learning',
      'learning/patterns',
      'learning/weights',
      'reports',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.decisionDir, dir), { recursive: true });
    }
  }

  /**
   * Make an autonomous decision
   */
  async makeDecision(context) {
    const decision = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      type: this.classifyDecision(context),
      context,
      alternatives: [],
      criteria: {},
      scores: {},
      recommendation: null,
      confidence: 0,
      risk: 'low',
      reasoning: [],
    };

    const startTime = Date.now();

    try {
      // Generate alternatives
      decision.alternatives = await this.generateAlternatives(context);

      // Evaluate criteria
      decision.criteria = await this.evaluateCriteria(decision.alternatives, context);

      // Score alternatives
      decision.scores = await this.scoreAlternatives(decision.alternatives, decision.criteria);

      // Select best alternative
      const selected = await this.selectBestAlternative(decision.scores);

      // Assess risk
      decision.risk = await this.assessRisk(selected, context);

      // Calculate confidence
      decision.confidence = await this.calculateConfidence(decision);

      // Generate reasoning
      decision.reasoning = await this.generateReasoning(decision);

      // Make final recommendation
      decision.recommendation = selected;

      // Record decision time
      const decisionTime = Date.now() - startTime;
      this.updateDecisionTimeStats(decisionTime);

      // Store decision
      this.decisions.set(decision.id, decision);
      this.stats.totalDecisions++;

      // Check if decision meets confidence threshold
      if (decision.confidence >= this.config.confidenceThreshold) {
        this.stats.autonomousDecisions++;
        await this.executeDecision(decision);
      } else {
        decision.status = 'low-confidence';
        this.pendingDecisions.push(decision);
      }

      this.emit('decisionMade', decision);
    } catch (error) {
      decision.error = error.message;
      decision.status = 'failed';
      console.error('Decision making failed:', error);
    }

    return decision;
  }

  /**
   * Classify decision type
   */
  classifyDecision(context) {
    if (context.error || context.failure) {
      return 'corrective';
    }

    if (context.technical || context.algorithm) {
      return 'technical';
    }

    if (context.resource || context.priority) {
      return 'operational';
    }

    if (context.planning || context.strategy) {
      return 'strategic';
    }

    return 'general';
  }

  /**
   * Generate decision alternatives
   */
  async generateAlternatives(context) {
    const alternatives = [];

    // Rule-based alternatives
    const ruleAlternatives = await this.generateRuleBasedAlternatives(context);
    alternatives.push(...ruleAlternatives);

    // Historical alternatives
    const historicalAlternatives = await this.generateHistoricalAlternatives(context);
    alternatives.push(...historicalAlternatives);

    // Creative alternatives
    const creativeAlternatives = await this.generateCreativeAlternatives(context);
    alternatives.push(...creativeAlternatives);

    // Limit alternatives
    return alternatives.slice(0, this.config.maxAlternatives);
  }

  async generateRuleBasedAlternatives(context) {
    const alternatives = [];

    for (const [ruleId, rule] of this.rules) {
      if (this.matchesRule(context, rule)) {
        alternatives.push({
          id: crypto.randomBytes(8).toString('hex'),
          source: 'rule-based',
          ruleId,
          action: rule.action,
          description: rule.description,
          confidence: rule.confidence || 0.8,
        });
      }
    }

    return alternatives;
  }

  matchesRule(context, rule) {
    if (!rule.conditions) return false;

    for (const condition of rule.conditions) {
      const contextValue = context[condition.field];

      switch (condition.operator) {
        case 'equals':
          if (contextValue !== condition.value) return false;
          break;
        case 'contains':
          if (!contextValue?.includes(condition.value)) return false;
          break;
        case 'greater':
          if (contextValue <= condition.value) return false;
          break;
        case 'less':
          if (contextValue >= condition.value) return false;
          break;
        default:
          return false;
      }
    }

    return true;
  }

  async generateHistoricalAlternatives(context) {
    const alternatives = [];
    const similarDecisions = this.findSimilarDecisions(context);

    for (const decision of similarDecisions) {
      if (decision.recommendation && decision.outcome === 'success') {
        alternatives.push({
          id: crypto.randomBytes(8).toString('hex'),
          source: 'historical',
          basedOn: decision.id,
          action: decision.recommendation.action,
          description: `Based on similar successful decision: ${decision.id}`,
          confidence: decision.confidence * 0.9, // Slightly lower confidence for historical
        });
      }
    }

    return alternatives;
  }

  findSimilarDecisions(context) {
    const similar = [];
    const threshold = 0.6;

    for (const [id, decision] of this.decisions) {
      const similarity = this.calculateSimilarity(context, decision.context);

      if (similarity > threshold) {
        similar.push(decision);
      }
    }

    return similar
      .sort((a, b) => {
        const simA = this.calculateSimilarity(context, a.context);
        const simB = this.calculateSimilarity(context, b.context);
        return simB - simA;
      })
      .slice(0, 3);
  }

  calculateSimilarity(context1, context2) {
    if (!context2) return 0;

    const keys1 = Object.keys(context1);
    const keys2 = Object.keys(context2);
    const allKeys = new Set([...keys1, ...keys2]);

    let matches = 0;

    for (const key of allKeys) {
      if (context1[key] === context2[key]) {
        matches++;
      }
    }

    return matches / allKeys.size;
  }

  async generateCreativeAlternatives(context) {
    const alternatives = [];

    // Generate novel alternatives based on patterns
    if (context.problem) {
      alternatives.push({
        id: crypto.randomBytes(8).toString('hex'),
        source: 'creative',
        action: 'innovative-solution',
        description: 'Try a novel approach not previously attempted',
        confidence: 0.6,
      });
    }

    return alternatives;
  }

  /**
   * Evaluation and Scoring Methods (Part 2)
   */

  async evaluateCriteria(alternatives, context) {
    const criteria = {};

    // Performance criteria
    criteria.performance = await this.evaluatePerformance(alternatives, context);

    // Reliability criteria
    criteria.reliability = await this.evaluateReliability(alternatives, context);

    // Cost criteria
    criteria.cost = await this.evaluateCost(alternatives, context);

    // Complexity criteria
    criteria.complexity = await this.evaluateComplexity(alternatives, context);

    // Risk criteria
    criteria.risk = await this.evaluateRisk(alternatives, context);

    return criteria;
  }

  async evaluatePerformance(alternatives, context) {
    const scores = {};

    for (const alt of alternatives) {
      let score = 0.5; // Base score

      // Historical performance
      if (alt.source === 'historical') {
        const historical = this.decisions.get(alt.basedOn);
        if (historical?.metrics?.performance) {
          score = historical.metrics.performance;
        }
      }

      // Rule-based performance
      if (alt.source === 'rule-based') {
        const rule = this.rules.get(alt.ruleId);
        if (rule?.performance) {
          score = rule.performance;
        }
      }

      // Adjust based on context
      if (context.performanceCritical) {
        score *= 1.2;
      }

      scores[alt.id] = Math.min(score, 1);
    }

    return scores;
  }

  async evaluateReliability(alternatives, context) {
    const scores = {};

    for (const alt of alternatives) {
      let score = 0.7; // Base reliability

      // Track record
      if (alt.source === 'historical') {
        const outcomes = this.getAlternativeOutcomes(alt.action);
        const successRate = outcomes.success / (outcomes.total || 1);
        score = successRate;
      }

      // Rule reliability
      if (alt.source === 'rule-based') {
        score = 0.85; // Rules are generally reliable
      }

      // Creative alternatives are less reliable
      if (alt.source === 'creative') {
        score = 0.5;
      }

      scores[alt.id] = score;
    }

    return scores;
  }

  async evaluateCost(alternatives, context) {
    const scores = {};

    for (const alt of alternatives) {
      let cost = 0.5; // Medium cost default

      // Estimate computational cost
      if (alt.action === 'innovative-solution') {
        cost = 0.8; // Higher cost for novel approaches
      }

      if (alt.action === 'simple-solution') {
        cost = 0.2; // Lower cost for simple approaches
      }

      // Invert for scoring (lower cost = higher score)
      scores[alt.id] = 1 - cost;
    }

    return scores;
  }

  async evaluateComplexity(alternatives, context) {
    const scores = {};

    for (const alt of alternatives) {
      let complexity = 0.5; // Medium complexity default

      // Assess based on action type
      if (alt.action?.includes('simple') || alt.action?.includes('basic')) {
        complexity = 0.3;
      }

      if (alt.action?.includes('complex') || alt.action?.includes('advanced')) {
        complexity = 0.8;
      }

      // Invert for scoring (lower complexity = higher score)
      scores[alt.id] = 1 - complexity;
    }

    return scores;
  }

  async evaluateRisk(alternatives, context) {
    const scores = {};

    for (const alt of alternatives) {
      let risk = 0.3; // Low risk default

      // Creative solutions are riskier
      if (alt.source === 'creative') {
        risk = 0.7;
      }

      // Historical solutions are less risky
      if (alt.source === 'historical') {
        risk = 0.2;
      }

      // Rule-based are safest
      if (alt.source === 'rule-based') {
        risk = 0.1;
      }

      // Invert for scoring (lower risk = higher score)
      scores[alt.id] = 1 - risk;
    }

    return scores;
  }

  getAlternativeOutcomes(action) {
    let success = 0;
    let total = 0;

    for (const [id, outcome] of this.decisionOutcomes) {
      const decision = this.decisions.get(id);
      if (decision?.recommendation?.action === action) {
        total++;
        if (outcome.result === 'success') {
          success++;
        }
      }
    }

    return { success, total };
  }

  /**
   * Score alternatives using weighted criteria
   */
  async scoreAlternatives(alternatives, criteria) {
    const scores = {};

    for (const alt of alternatives) {
      let totalScore = 0;

      // Apply weighted scoring
      for (const [criterionName, weight] of Object.entries(this.criteriaWeights)) {
        const criterionScores = criteria[criterionName];
        if (criterionScores && criterionScores[alt.id] !== undefined) {
          totalScore += criterionScores[alt.id] * weight;
        }
      }

      // Apply learning adjustments
      if (this.config.learningEnabled) {
        totalScore = this.applyLearningAdjustments(alt, totalScore);
      }

      scores[alt.id] = {
        alternative: alt,
        score: totalScore,
        breakdown: this.getScoreBreakdown(alt.id, criteria),
      };
    }

    return scores;
  }

  applyLearningAdjustments(alternative, score) {
    // Check for successful patterns
    for (const [pattern, adjustment] of this.learningData.successfulPatterns) {
      if (this.matchesPattern(alternative, pattern)) {
        score *= 1 + adjustment;
      }
    }

    // Check for failure patterns
    for (const [pattern, adjustment] of this.learningData.failurePatterns) {
      if (this.matchesPattern(alternative, pattern)) {
        score *= 1 - adjustment;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  matchesPattern(alternative, pattern) {
    if (pattern.source && pattern.source !== alternative.source) {
      return false;
    }

    if (pattern.action && !alternative.action?.includes(pattern.action)) {
      return false;
    }

    return true;
  }

  getScoreBreakdown(altId, criteria) {
    const breakdown = {};

    for (const [criterionName, criterionScores] of Object.entries(criteria)) {
      if (criterionScores[altId] !== undefined) {
        breakdown[criterionName] = {
          score: criterionScores[altId],
          weight: this.criteriaWeights[criterionName] || 0,
          weighted: criterionScores[altId] * (this.criteriaWeights[criterionName] || 0),
        };
      }
    }

    return breakdown;
  }

  /**
   * Select best alternative
   */
  async selectBestAlternative(scores) {
    let bestScore = -1;
    let bestAlternative = null;

    for (const [id, scoreData] of Object.entries(scores)) {
      if (scoreData.score > bestScore) {
        bestScore = scoreData.score;
        bestAlternative = scoreData.alternative;
      }
    }

    return bestAlternative;
  }

  /**
   * Risk assessment
   */
  async assessRisk(alternative, context) {
    if (!alternative) return 'unknown';

    let riskScore = 0;

    // Source-based risk
    if (alternative.source === 'creative') {
      riskScore += 0.3;
    } else if (alternative.source === 'historical') {
      riskScore += 0.1;
    } else if (alternative.source === 'rule-based') {
      riskScore += 0.05;
    }

    // Context-based risk
    if (context.production) {
      riskScore += 0.2;
    }

    if (context.critical) {
      riskScore += 0.3;
    }

    // Confidence-based risk
    if (alternative.confidence < 0.5) {
      riskScore += 0.2;
    }

    // Categorize risk
    if (riskScore < 0.3) return 'low';
    if (riskScore < 0.6) return 'medium';
    return 'high';
  }

  /**
   * Calculate decision confidence
   */
  async calculateConfidence(decision) {
    let confidence = 0;
    let factors = 0;

    // Alternative source confidence
    if (decision.recommendation) {
      confidence += decision.recommendation.confidence || 0.5;
      factors++;
    }

    // Score spread (higher spread = higher confidence)
    const scoreValues = Object.values(decision.scores).map(s => s.score);
    if (scoreValues.length > 1) {
      const maxScore = Math.max(...scoreValues);
      const secondScore = scoreValues.sort((a, b) => b - a)[1] || 0;
      const spread = maxScore - secondScore;
      confidence += spread;
      factors++;
    }

    // Historical success rate
    const successRate = this.calculateSuccessRate();
    confidence += successRate;
    factors++;

    // Risk factor (lower risk = higher confidence)
    const riskMultiplier = {
      low: 1.0,
      medium: 0.8,
      high: 0.6,
      unknown: 0.5,
    };

    confidence = (confidence / factors) * (riskMultiplier[decision.risk] || 0.5);

    return Math.max(0, Math.min(1, confidence));
  }

  calculateSuccessRate() {
    if (this.decisionOutcomes.size === 0) return 0.5;

    let successes = 0;
    for (const [id, outcome] of this.decisionOutcomes) {
      if (outcome.result === 'success') {
        successes++;
      }
    }

    return successes / this.decisionOutcomes.size;
  }

  /**
   * Generate reasoning explanation
   */
  async generateReasoning(decision) {
    const reasoning = [];

    // Explain why this type of decision
    reasoning.push(`Decision type: ${decision.type}`);

    // Explain alternative selection
    if (decision.recommendation) {
      reasoning.push(
        `Selected ${decision.recommendation.source} alternative: ${decision.recommendation.description}`
      );
    }

    // Explain scoring
    if (decision.scores[decision.recommendation?.id]) {
      const scoreData = decision.scores[decision.recommendation.id];
      reasoning.push(`Overall score: ${(scoreData.score * 100).toFixed(1)}%`);

      // Top contributing factors
      const breakdown = scoreData.breakdown;
      const topFactors = Object.entries(breakdown)
        .sort((a, b) => b[1].weighted - a[1].weighted)
        .slice(0, 3);

      for (const [factor, data] of topFactors) {
        reasoning.push(
          `${factor}: ${(data.score * 100).toFixed(1)}% (weight: ${(data.weight * 100).toFixed(0)}%)`
        );
      }
    }

    // Explain confidence
    reasoning.push(`Confidence level: ${(decision.confidence * 100).toFixed(1)}%`);

    // Explain risk
    reasoning.push(`Risk assessment: ${decision.risk}`);

    return reasoning;
  }

  /**
   * Decision Execution and Learning (Part 3)
   */

  async executeDecision(decision) {
    const execution = {
      id: crypto.randomBytes(16).toString('hex'),
      decisionId: decision.id,
      timestamp: Date.now(),
      status: 'executing',
      result: null,
    };

    try {
      // Log execution
      console.log(`🤖 Executing decision: ${decision.recommendation?.action}`);

      // Execute based on decision type
      switch (decision.type) {
        case 'technical':
          execution.result = await this.executeTechnicalDecision(decision);
          break;
        case 'operational':
          execution.result = await this.executeOperationalDecision(decision);
          break;
        case 'strategic':
          execution.result = await this.executeStrategicDecision(decision);
          break;
        case 'corrective':
          execution.result = await this.executeCorrectiveDecision(decision);
          break;
        default:
          execution.result = { success: true, action: 'executed' };
      }

      execution.status = 'completed';

      // Record outcome
      await this.recordOutcome(decision.id, execution);

      // Learn from execution
      if (this.config.learningEnabled) {
        await this.learnFromDecision(decision, execution);
      }

      this.emit('decisionExecuted', { decision, execution });
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;

      // Learn from failure
      if (this.config.learningEnabled) {
        await this.learnFromFailure(decision, error);
      }

      console.error('Decision execution failed:', error);
    }

    return execution;
  }

  async executeTechnicalDecision(decision) {
    // Simulate technical execution
    return {
      success: true,
      action: decision.recommendation?.action || 'technical-action',
      details: 'Technical decision executed successfully',
    };
  }

  async executeOperationalDecision(decision) {
    return {
      success: true,
      action: decision.recommendation?.action || 'operational-action',
      details: 'Operational decision executed successfully',
    };
  }

  async executeStrategicDecision(decision) {
    return {
      success: true,
      action: decision.recommendation?.action || 'strategic-action',
      details: 'Strategic decision executed successfully',
    };
  }

  async executeCorrectiveDecision(decision) {
    return {
      success: true,
      action: decision.recommendation?.action || 'corrective-action',
      details: 'Corrective action taken successfully',
    };
  }

  /**
   * Learning methods
   */

  async recordOutcome(decisionId, execution) {
    const outcome = {
      decisionId,
      executionId: execution.id,
      timestamp: Date.now(),
      result: execution.status === 'completed' ? 'success' : 'failure',
      details: execution.result || execution.error,
    };

    this.decisionOutcomes.set(decisionId, outcome);

    // Save to disk
    await this.saveOutcome(outcome);
  }

  async learnFromDecision(decision, execution) {
    if (execution.status === 'completed') {
      // Record successful pattern
      const pattern = {
        source: decision.recommendation?.source,
        action: decision.recommendation?.action,
        context: this.extractContextFeatures(decision.context),
      };

      const adjustment = 0.1; // 10% boost for successful patterns
      this.learningData.successfulPatterns.set(JSON.stringify(pattern), adjustment);

      // Adjust weights based on success
      await this.adjustWeights(decision, 'success');
    }
  }

  async learnFromFailure(decision, error) {
    // Record failure pattern
    const pattern = {
      source: decision.recommendation?.source,
      action: decision.recommendation?.action,
      context: this.extractContextFeatures(decision.context),
      error: error.message,
    };

    const adjustment = 0.2; // 20% penalty for failure patterns
    this.learningData.failurePatterns.set(JSON.stringify(pattern), adjustment);

    // Adjust weights based on failure
    await this.adjustWeights(decision, 'failure');
  }

  extractContextFeatures(context) {
    // Extract key features from context
    return {
      type: context.type,
      critical: context.critical || false,
      production: context.production || false,
      hasError: !!context.error,
    };
  }

  async adjustWeights(decision, outcome) {
    const adjustment = outcome === 'success' ? 0.02 : -0.02;

    // Adjust criteria weights based on what contributed to outcome
    if (decision.scores && decision.recommendation) {
      const scoreData = decision.scores[decision.recommendation.id];
      if (scoreData?.breakdown) {
        for (const [criterion, data] of Object.entries(scoreData.breakdown)) {
          const currentWeight = this.criteriaWeights[criterion];

          // Increase weight of high-scoring criteria for success
          // Decrease for failure
          if (data.score > 0.7) {
            this.criteriaWeights[criterion] = Math.max(0, Math.min(1, currentWeight + adjustment));
          }
        }
      }
    }

    // Normalize weights
    this.normalizeWeights();
  }

  normalizeWeights() {
    const total = Object.values(this.criteriaWeights).reduce((sum, w) => sum + w, 0);

    if (total > 0) {
      for (const criterion in this.criteriaWeights) {
        this.criteriaWeights[criterion] /= total;
      }
    }
  }

  /**
   * Decision models
   */

  initializeModels() {
    // Models are already bound in constructor
    // Additional initialization if needed
  }

  async multiCriteriaAnalysis(alternatives, criteria, weights) {
    // Already implemented in scoreAlternatives
    return this.scoreAlternatives(alternatives, criteria);
  }

  async costBenefitAnalysis(alternatives, context) {
    const analysis = {};

    for (const alt of alternatives) {
      const cost = await this.estimateCost(alt, context);
      const benefit = await this.estimateBenefit(alt, context);

      analysis[alt.id] = {
        cost,
        benefit,
        ratio: benefit / (cost || 1),
        netBenefit: benefit - cost,
      };
    }

    return analysis;
  }

  async estimateCost(alternative, context) {
    let cost = 0.5; // Default medium cost

    if (alternative.source === 'creative') cost = 0.8;
    if (alternative.source === 'historical') cost = 0.3;
    if (alternative.source === 'rule-based') cost = 0.2;

    return cost;
  }

  async estimateBenefit(alternative, context) {
    let benefit = 0.5; // Default medium benefit

    if (alternative.confidence > 0.8) benefit = 0.9;
    if (alternative.confidence > 0.6) benefit = 0.7;
    if (alternative.confidence < 0.4) benefit = 0.3;

    return benefit;
  }

  async riskBasedDecision(alternatives, context) {
    const riskScores = {};

    for (const alt of alternatives) {
      const risk = await this.assessRisk(alt, context);
      const riskValue = { low: 0.9, medium: 0.5, high: 0.1 }[risk] || 0.5;
      riskScores[alt.id] = riskValue;
    }

    return riskScores;
  }

  async consensusDecision(alternatives, voters = []) {
    if (voters.length === 0) {
      // Use internal models as voters
      voters = ['multiCriteria', 'costBenefit', 'riskBased'];
    }

    const votes = {};
    for (const alt of alternatives) {
      votes[alt.id] = 0;
    }

    // Collect votes
    for (const voter of voters) {
      const scores = await this.models[voter]?.(alternatives, {});
      if (scores) {
        const best = this.findBestScore(scores);
        if (best) {
          votes[best] = (votes[best] || 0) + 1;
        }
      }
    }

    return votes;
  }

  findBestScore(scores) {
    let bestId = null;
    let bestScore = -1;

    for (const [id, score] of Object.entries(scores)) {
      const value = typeof score === 'object' ? score.score : score;
      if (value > bestScore) {
        bestScore = value;
        bestId = id;
      }
    }

    return bestId;
  }

  async probabilisticDecision(alternatives, context) {
    const probabilities = {};

    for (const alt of alternatives) {
      // Calculate probability of success
      let probability = alt.confidence || 0.5;

      // Adjust based on historical data
      const outcomes = this.getAlternativeOutcomes(alt.action);
      if (outcomes.total > 0) {
        probability = outcomes.success / outcomes.total;
      }

      probabilities[alt.id] = probability;
    }

    return probabilities;
  }

  async ruleBasedDecision(alternatives, context) {
    const ruleScores = {};

    for (const alt of alternatives) {
      if (alt.source === 'rule-based') {
        ruleScores[alt.id] = 1.0; // Full score for rule-based
      } else {
        ruleScores[alt.id] = 0.5; // Partial score for others
      }
    }

    return ruleScores;
  }

  /**
   * Storage and persistence
   */

  async loadDecisionRules() {
    try {
      const rulesDir = path.join(this.config.decisionDir, 'rules');
      const categories = ['technical', 'operational'];

      for (const category of categories) {
        const categoryDir = path.join(rulesDir, category);
        const files = await fs.readdir(categoryDir);

        for (const file of files) {
          if (file.endsWith('.json')) {
            const data = await fs.readFile(path.join(categoryDir, file), 'utf8');
            const rule = JSON.parse(data);
            this.rules.set(rule.id || file, rule);
          }
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async loadDecisionHistory() {
    try {
      const historyDir = path.join(this.config.decisionDir, 'decisions', 'completed');
      const files = await fs.readdir(historyDir);

      for (const file of files.slice(-100)) {
        // Last 100 decisions
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(historyDir, file), 'utf8');
          const decision = JSON.parse(data);
          this.decisions.set(decision.id, decision);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async loadLearningData() {
    try {
      const learningFile = path.join(this.config.decisionDir, 'learning', 'patterns.json');
      const data = await fs.readFile(learningFile, 'utf8');
      const learning = JSON.parse(data);

      // Convert arrays to Maps
      if (learning.successfulPatterns) {
        this.learningData.successfulPatterns = new Map(learning.successfulPatterns);
      }

      if (learning.failurePatterns) {
        this.learningData.failurePatterns = new Map(learning.failurePatterns);
      }
    } catch (error) {
      // File might not exist
    }
  }

  async saveDecision(decision) {
    const filePath = path.join(
      this.config.decisionDir,
      'decisions',
      decision.status === 'completed' ? 'completed' : 'pending',
      `${decision.id}.json`
    );

    await fs.writeFile(filePath, JSON.stringify(decision, null, 2));
  }

  async saveOutcome(outcome) {
    const filePath = path.join(
      this.config.decisionDir,
      'decisions',
      'outcomes',
      `${outcome.decisionId}.json`
    );

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(outcome, null, 2));
  }

  async saveLearningData() {
    const learningFile = path.join(this.config.decisionDir, 'learning', 'patterns.json');

    const data = {
      successfulPatterns: Array.from(this.learningData.successfulPatterns),
      failurePatterns: Array.from(this.learningData.failurePatterns),
      adjustedWeights: this.criteriaWeights,
    };

    await fs.writeFile(learningFile, JSON.stringify(data, null, 2));
  }

  /**
   * Statistics and monitoring
   */

  updateDecisionTimeStats(duration) {
    this.stats.decisionTime.min = Math.min(this.stats.decisionTime.min, duration);
    this.stats.decisionTime.max = Math.max(this.stats.decisionTime.max, duration);

    const count = this.stats.totalDecisions || 1;
    this.stats.decisionTime.avg = (this.stats.decisionTime.avg * (count - 1) + duration) / count;
  }

  calculateAverageConfidence() {
    if (this.decisions.size === 0) return 0;

    let totalConfidence = 0;
    for (const [id, decision] of this.decisions) {
      totalConfidence += decision.confidence || 0;
    }

    return totalConfidence / this.decisions.size;
  }

  /**
   * Status and shutdown
   */

  getStatus() {
    return {
      initialized: this.isInitialized,
      rules: this.rules.size,
      decisions: this.decisions.size,
      pending: this.pendingDecisions.length,
      stats: {
        ...this.stats,
        successRate: this.calculateSuccessRate(),
        averageConfidence: this.calculateAverageConfidence(),
      },
      weights: this.criteriaWeights,
      learning: {
        successPatterns: this.learningData.successfulPatterns.size,
        failurePatterns: this.learningData.failurePatterns.size,
      },
    };
  }

  async shutdown() {
    // Save pending decisions
    for (const decision of this.pendingDecisions) {
      await this.saveDecision(decision);
    }

    // Save learning data
    await this.saveLearningData();

    // Calculate final stats
    this.stats.successRate = this.calculateSuccessRate();
    this.stats.averageConfidence = this.calculateAverageConfidence();

    // Generate report
    const report = {
      timestamp: Date.now(),
      stats: this.stats,
      topDecisions: this.getTopDecisions(),
      learningInsights: this.getLearningInsights(),
    };

    const reportFile = path.join(this.config.decisionDir, 'reports', `shutdown-${Date.now()}.json`);

    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    this.emit('shutdown');
    console.log('✅ Autonomous Decision System shutdown complete');
  }

  getTopDecisions() {
    return Array.from(this.decisions.values())
      .filter(d => d.confidence > 0.8)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  getLearningInsights() {
    return {
      totalLearningEvents:
        this.learningData.successfulPatterns.size + this.learningData.failurePatterns.size,
      mostSuccessfulSource: this.findMostSuccessfulSource(),
      currentWeights: this.criteriaWeights,
    };
  }

  findMostSuccessfulSource() {
    const sourceCounts = { 'rule-based': 0, historical: 0, creative: 0 };

    for (const [pattern] of this.learningData.successfulPatterns) {
      const parsed = JSON.parse(pattern);
      if (parsed.source) {
        sourceCounts[parsed.source] = (sourceCounts[parsed.source] || 0) + 1;
      }
    }

    return Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  }
}

module.exports = AutonomousDecisionSystem;
