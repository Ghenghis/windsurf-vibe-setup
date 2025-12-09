/**
 * Learning Metrics Tracker - v6.0
 * Tracks all learning metrics, improvements, and knowledge acquisition
 * Provides detailed analytics on system learning performance
 *
 * Part 1: Core initialization and tracking structures
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class LearningMetricsTracker extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      metricsDir: options.metricsDir || path.join(process.cwd(), 'vibe-data', 'metrics'),
      trackingInterval: options.trackingInterval || 60000, // 1 minute
      aggregationInterval: options.aggregationInterval || 3600000, // 1 hour
      retentionDays: options.retentionDays || 30,
      detailLevel: options.detailLevel || 'comprehensive',
      alertThresholds: {
        learningRate: options.minLearningRate || 0.1,
        errorRate: options.maxErrorRate || 0.3,
        improvementRate: options.minImprovementRate || 0.05,
        knowledgeGrowth: options.minKnowledgeGrowth || 0.01,
      },
    };

    // Core metrics
    this.metrics = {
      learning: {
        totalEvents: 0,
        successfulLearning: 0,
        failedLearning: 0,
        learningRate: 0,
        averageLearningTime: 0,
        learningVelocity: 0,
        retentionRate: 0,
      },
      mistakes: {
        totalMistakes: 0,
        preventedMistakes: 0,
        repeatedMistakes: 0,
        mistakeCategories: {},
        preventionRate: 0,
        mistakeReductionRate: 0,
      },
      knowledge: {
        totalConcepts: 0,
        newConceptsToday: 0,
        conceptsRetained: 0,
        conceptsLost: 0,
        knowledgeDepth: 0,
        knowledgeBreadth: 0,
        knowledgeConnectivity: 0,
      },
      performance: {
        taskSuccessRate: 0,
        averageTaskTime: 0,
        performanceImprovement: 0,
        efficiencyGain: 0,
        qualityScore: 0,
        speedImprovement: 0,
      },
      research: {
        totalResearches: 0,
        successfulResearches: 0,
        researchAccuracy: 0,
        averageResearchTime: 0,
        sourcesUtilized: {},
        knowledgeDiscovered: 0,
      },
      insights: {
        totalInsights: 0,
        actionableInsights: 0,
        implementedInsights: 0,
        insightQuality: 0,
        insightImpact: 0,
      },
    };

    // Time series data
    this.timeSeries = {
      learning: [],
      mistakes: [],
      performance: [],
      knowledge: [],
    };

    // Tracking buckets
    this.buckets = {
      hourly: new Map(),
      daily: new Map(),
      weekly: new Map(),
      monthly: new Map(),
    };

    // Trends and patterns
    this.trends = {
      learningTrend: 'stable',
      performanceTrend: 'stable',
      knowledgeTrend: 'stable',
      trendStrength: 0,
      predictions: [],
    };

    // Comparative baselines
    this.baselines = {
      initial: null,
      lastWeek: null,
      lastMonth: null,
      bestPerformance: null,
    };

    // Real-time tracking
    this.realTime = {
      currentLearningRate: 0,
      currentErrorRate: 0,
      currentSuccessRate: 0,
      activelearningProcesses: 0,
      lastUpdate: Date.now(),
    };

    // Alerts and notifications
    this.alerts = [];
    this.anomalies = [];

    this.isInitialized = false;
    this.trackingTimer = null;
    this.aggregationTimer = null;
  }

  /**
   * Initialize metrics tracker
   */
  async initialize() {
    try {
      console.log('📊 Initializing Learning Metrics Tracker...');

      // Create directory structure
      await this.createDirectoryStructure();

      // Load historical metrics
      await this.loadHistoricalMetrics();

      // Initialize baselines
      await this.initializeBaselines();

      // Start tracking
      this.startTracking();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Learning Metrics Tracker initialized');
      console.log(`   - Tracking interval: ${this.config.trackingInterval}ms`);
      console.log(`   - Aggregation interval: ${this.config.aggregationInterval}ms`);
      console.log(`   - Historical data points: ${this.getHistoricalDataCount()}`);
    } catch (error) {
      console.error('❌ Failed to initialize Learning Metrics Tracker:', error);
      throw error;
    }
  }

  /**
   * Create directory structure for metrics storage
   */
  async createDirectoryStructure() {
    const directories = [
      'raw',
      'raw/learning',
      'raw/mistakes',
      'raw/performance',
      'raw/knowledge',
      'aggregated',
      'aggregated/hourly',
      'aggregated/daily',
      'aggregated/weekly',
      'aggregated/monthly',
      'reports',
      'reports/daily',
      'reports/weekly',
      'reports/monthly',
      'trends',
      'trends/analysis',
      'trends/predictions',
      'baselines',
      'alerts',
      'exports',
    ];

    for (const dir of directories) {
      await fs.mkdir(path.join(this.config.metricsDir, dir), { recursive: true });
    }
  }

  /**
   * Track a learning event
   */
  async trackLearningEvent(event) {
    const metric = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      type: 'learning',
      subtype: event.type || 'general',
      success: event.success !== false,
      duration: event.duration || 0,
      confidence: event.confidence || 0,
      source: event.source || 'internal',
      details: event.details || {},
    };

    // Update real-time metrics
    this.updateRealTimeMetrics('learning', metric);

    // Update core metrics
    this.metrics.learning.totalEvents++;
    if (metric.success) {
      this.metrics.learning.successfulLearning++;
    } else {
      this.metrics.learning.failedLearning++;
    }

    // Update learning rate
    this.calculateLearningRate();

    // Add to time series
    this.addToTimeSeries('learning', metric);

    // Store raw metric
    await this.storeRawMetric('learning', metric);

    // Check for anomalies
    this.checkForAnomalies('learning', metric);

    // Emit event
    this.emit('learningTracked', metric);

    return metric;
  }

  /**
   * Track a mistake event
   */
  async trackMistakeEvent(event) {
    const metric = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      type: 'mistake',
      category: event.category || 'general',
      prevented: event.prevented || false,
      repeated: event.repeated || false,
      severity: event.severity || 'low',
      preventionStrategy: event.preventionStrategy || null,
      details: event.details || {},
    };

    // Update metrics
    this.metrics.mistakes.totalMistakes++;

    if (metric.prevented) {
      this.metrics.mistakes.preventedMistakes++;
    }

    if (metric.repeated) {
      this.metrics.mistakes.repeatedMistakes++;
    }

    // Track categories
    if (!this.metrics.mistakes.mistakeCategories[metric.category]) {
      this.metrics.mistakes.mistakeCategories[metric.category] = 0;
    }
    this.metrics.mistakes.mistakeCategories[metric.category]++;

    // Calculate prevention rate
    this.calculatePreventionRate();

    // Add to time series
    this.addToTimeSeries('mistakes', metric);

    // Store raw metric
    await this.storeRawMetric('mistakes', metric);

    // Check if we need to alert
    if (metric.repeated && !metric.prevented) {
      this.generateAlert('repeated-mistake', metric);
    }

    this.emit('mistakeTracked', metric);

    return metric;
  }

  /**
   * Track knowledge acquisition
   */
  async trackKnowledgeEvent(event) {
    const metric = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      type: 'knowledge',
      action: event.action || 'acquired', // acquired, retained, lost
      conceptCount: event.concepts?.length || 1,
      connectionCount: event.connections || 0,
      source: event.source || 'learning',
      confidence: event.confidence || 0.5,
      details: event.details || {},
    };

    // Update metrics based on action
    switch (metric.action) {
      case 'acquired':
        this.metrics.knowledge.totalConcepts += metric.conceptCount;
        this.metrics.knowledge.newConceptsToday += metric.conceptCount;
        break;
      case 'retained':
        this.metrics.knowledge.conceptsRetained += metric.conceptCount;
        break;
      case 'lost':
        this.metrics.knowledge.conceptsLost += metric.conceptCount;
        break;
    }

    // Update connectivity
    if (metric.connectionCount > 0) {
      this.updateKnowledgeConnectivity(metric.connectionCount);
    }

    // Add to time series
    this.addToTimeSeries('knowledge', metric);

    // Store raw metric
    await this.storeRawMetric('knowledge', metric);

    this.emit('knowledgeTracked', metric);

    return metric;
  }

  /**
   * Track performance metrics
   */
  async trackPerformanceEvent(event) {
    const metric = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      type: 'performance',
      task: event.task || 'unknown',
      success: event.success !== false,
      duration: event.duration || 0,
      quality: event.quality || 0.5,
      efficiency: event.efficiency || 0.5,
      improvement: event.improvement || 0,
      details: event.details || {},
    };

    // Update performance metrics
    const currentRate = this.metrics.performance.taskSuccessRate;
    const currentAvgTime = this.metrics.performance.averageTaskTime;

    // Update success rate (moving average)
    this.metrics.performance.taskSuccessRate = currentRate * 0.9 + (metric.success ? 1 : 0) * 0.1;

    // Update average time
    this.metrics.performance.averageTaskTime = currentAvgTime * 0.9 + metric.duration * 0.1;

    // Track improvement
    if (metric.improvement > 0) {
      this.metrics.performance.performanceImprovement += metric.improvement;
    }

    // Update quality score
    this.metrics.performance.qualityScore =
      this.metrics.performance.qualityScore * 0.9 + metric.quality * 0.1;

    // Add to time series
    this.addToTimeSeries('performance', metric);

    // Store raw metric
    await this.storeRawMetric('performance', metric);

    this.emit('performanceTracked', metric);

    return metric;
  }

  /**
   * Analysis and Calculation Methods (Part 2)
   */

  calculateLearningRate() {
    const total = this.metrics.learning.totalEvents;
    const successful = this.metrics.learning.successfulLearning;

    if (total > 0) {
      this.metrics.learning.learningRate = successful / total;
    }

    // Calculate velocity (learning events per hour)
    const hourlyEvents = this.getRecentEvents('learning', 3600000);
    this.metrics.learning.learningVelocity = hourlyEvents.length;

    // Calculate retention rate
    this.calculateRetentionRate();
  }

  calculateRetentionRate() {
    const retained = this.metrics.knowledge.conceptsRetained;
    const total = this.metrics.knowledge.totalConcepts;

    if (total > 0) {
      this.metrics.learning.retentionRate = retained / total;
    }
  }

  calculatePreventionRate() {
    const prevented = this.metrics.mistakes.preventedMistakes;
    const total = this.metrics.mistakes.totalMistakes;

    if (total > 0) {
      this.metrics.mistakes.preventionRate = prevented / total;
    }

    // Calculate mistake reduction rate
    this.calculateMistakeReduction();
  }

  calculateMistakeReduction() {
    const recent = this.getRecentEvents('mistakes', 3600000);
    const older = this.getRecentEvents('mistakes', 7200000, 3600000);

    if (older.length > 0) {
      const reduction = (older.length - recent.length) / older.length;
      this.metrics.mistakes.mistakeReductionRate = reduction;
    }
  }

  updateKnowledgeConnectivity(connections) {
    const current = this.metrics.knowledge.knowledgeConnectivity;
    const total = this.metrics.knowledge.totalConcepts;

    if (total > 0) {
      // Average connections per concept
      this.metrics.knowledge.knowledgeConnectivity = (current * (total - 1) + connections) / total;
    }
  }

  updateRealTimeMetrics(type, metric) {
    const now = Date.now();
    this.realTime.lastUpdate = now;

    switch (type) {
      case 'learning':
        if (metric.success) {
          this.realTime.currentLearningRate = this.realTime.currentLearningRate * 0.9 + 0.1;
        } else {
          this.realTime.currentLearningRate *= 0.9;
        }
        break;

      case 'mistakes':
        if (!metric.prevented) {
          this.realTime.currentErrorRate = this.realTime.currentErrorRate * 0.9 + 0.1;
        } else {
          this.realTime.currentErrorRate *= 0.9;
        }
        break;

      case 'performance':
        if (metric.success) {
          this.realTime.currentSuccessRate = this.realTime.currentSuccessRate * 0.9 + 0.1;
        } else {
          this.realTime.currentSuccessRate *= 0.9;
        }
        break;
    }
  }

  addToTimeSeries(type, metric) {
    if (!this.timeSeries[type]) {
      this.timeSeries[type] = [];
    }

    this.timeSeries[type].push({
      timestamp: metric.timestamp,
      value: this.extractTimeSeriesValue(type, metric),
    });

    // Keep only recent data (based on retention)
    const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    this.timeSeries[type] = this.timeSeries[type].filter(point => point.timestamp > cutoff);
  }

  extractTimeSeriesValue(type, metric) {
    switch (type) {
      case 'learning':
        return metric.success ? 1 : 0;
      case 'mistakes':
        return metric.prevented ? 0 : 1;
      case 'performance':
        return metric.quality || 0.5;
      case 'knowledge':
        return metric.conceptCount || 1;
      default:
        return 1;
    }
  }

  getRecentEvents(type, timeWindow, offset = 0) {
    if (!this.timeSeries[type]) return [];

    const now = Date.now();
    const start = now - timeWindow - offset;
    const end = now - offset;

    return this.timeSeries[type].filter(point => point.timestamp >= start && point.timestamp < end);
  }

  /**
   * Trend Analysis and Predictions (Part 3)
   */

  async analyzeTrends() {
    // Analyze learning trend
    this.trends.learningTrend = this.calculateTrend('learning');

    // Analyze performance trend
    this.trends.performanceTrend = this.calculateTrend('performance');

    // Analyze knowledge trend
    this.trends.knowledgeTrend = this.calculateTrend('knowledge');

    // Calculate overall trend strength
    this.trends.trendStrength = this.calculateTrendStrength();

    // Generate predictions
    this.trends.predictions = await this.generatePredictions();

    // Save trend analysis
    await this.saveTrendAnalysis();
  }

  calculateTrend(type) {
    const recent = this.getRecentEvents(type, 3600000);
    const previous = this.getRecentEvents(type, 3600000, 3600000);

    if (recent.length === 0 || previous.length === 0) {
      return 'stable';
    }

    const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
    const previousAvg = previous.reduce((sum, p) => sum + p.value, 0) / previous.length;

    const change = (recentAvg - previousAvg) / previousAvg;

    if (change > 0.1) return 'improving';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  calculateTrendStrength() {
    let strength = 0;
    let count = 0;

    if (this.trends.learningTrend === 'improving') strength += 1;
    else if (this.trends.learningTrend === 'declining') strength -= 1;
    count++;

    if (this.trends.performanceTrend === 'improving') strength += 1;
    else if (this.trends.performanceTrend === 'declining') strength -= 1;
    count++;

    if (this.trends.knowledgeTrend === 'improving') strength += 1;
    else if (this.trends.knowledgeTrend === 'declining') strength -= 1;
    count++;

    return strength / count;
  }

  async generatePredictions() {
    const predictions = [];

    // Predict next hour's learning rate
    predictions.push({
      metric: 'learning_rate',
      timeframe: 'next_hour',
      predicted: this.predictMetric('learning', 3600000),
      confidence: 0.7,
    });

    // Predict mistake rate
    predictions.push({
      metric: 'mistake_rate',
      timeframe: 'next_hour',
      predicted: this.predictMetric('mistakes', 3600000),
      confidence: 0.6,
    });

    return predictions;
  }

  predictMetric(type, timeframe) {
    const recent = this.getRecentEvents(type, timeframe);
    if (recent.length === 0) return 0.5;

    const avg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
    const trend = this.calculateTrend(type);

    let predicted = avg;
    if (trend === 'improving') predicted *= 1.1;
    if (trend === 'declining') predicted *= 0.9;

    return Math.max(0, Math.min(1, predicted));
  }

  /**
   * Alerting and Anomaly Detection
   */

  checkForAnomalies(type, metric) {
    // Check if metric deviates significantly from normal
    const threshold = this.getAnomalyThreshold(type);
    const isAnomaly = this.detectAnomaly(type, metric, threshold);

    if (isAnomaly) {
      this.anomalies.push({
        id: crypto.randomBytes(16).toString('hex'),
        timestamp: Date.now(),
        type,
        metric,
        severity: this.calculateAnomalySeverity(type, metric),
      });

      this.emit('anomalyDetected', {
        type,
        metric,
        timestamp: Date.now(),
      });
    }
  }

  getAnomalyThreshold(type) {
    switch (type) {
      case 'learning':
        return { min: 0.1, max: 0.9 };
      case 'mistakes':
        return { min: 0, max: 0.3 };
      case 'performance':
        return { min: 0.3, max: 1.0 };
      default:
        return { min: 0, max: 1 };
    }
  }

  detectAnomaly(type, metric, threshold) {
    const value = this.extractTimeSeriesValue(type, metric);
    return value < threshold.min || value > threshold.max;
  }

  calculateAnomalySeverity(type, metric) {
    const value = this.extractTimeSeriesValue(type, metric);
    const threshold = this.getAnomalyThreshold(type);

    if (value < threshold.min) {
      const deviation = (threshold.min - value) / threshold.min;
      if (deviation > 0.5) return 'high';
      if (deviation > 0.25) return 'medium';
      return 'low';
    }

    if (value > threshold.max) {
      const deviation = (value - threshold.max) / threshold.max;
      if (deviation > 0.5) return 'high';
      if (deviation > 0.25) return 'medium';
      return 'low';
    }

    return 'low';
  }

  generateAlert(type, data) {
    const alert = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      type,
      severity: this.calculateAlertSeverity(type, data),
      message: this.generateAlertMessage(type, data),
      data,
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);

    this.emit('alertGenerated', alert);

    return alert;
  }

  calculateAlertSeverity(type, data) {
    switch (type) {
      case 'repeated-mistake':
        return 'high';
      case 'low-learning-rate':
        return 'medium';
      case 'declining-performance':
        return 'medium';
      default:
        return 'low';
    }
  }

  generateAlertMessage(type, data) {
    switch (type) {
      case 'repeated-mistake':
        return `Repeated mistake detected: ${data.category || 'unknown'}`;
      case 'low-learning-rate':
        return `Learning rate below threshold: ${this.metrics.learning.learningRate.toFixed(2)}`;
      case 'declining-performance':
        return `Performance declining: ${this.trends.performanceTrend}`;
      default:
        return `Alert: ${type}`;
    }
  }

  /**
   * Storage and Persistence Methods
   */

  async storeRawMetric(type, metric) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.config.metricsDir, 'raw', type, `${date}.jsonl`);

    const line = JSON.stringify(metric) + '\n';
    await fs.appendFile(filePath, line);
  }

  async loadHistoricalMetrics() {
    try {
      const types = ['learning', 'mistakes', 'performance', 'knowledge'];

      for (const type of types) {
        const dir = path.join(this.config.metricsDir, 'raw', type);
        const files = await fs.readdir(dir);

        for (const file of files.slice(-7)) {
          // Last 7 days
          if (file.endsWith('.jsonl')) {
            await this.loadMetricsFile(type, path.join(dir, file));
          }
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async loadMetricsFile(type, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line);

      for (const line of lines) {
        const metric = JSON.parse(line);
        this.addToTimeSeries(type, metric);
      }
    } catch (error) {
      console.warn(`Failed to load metrics file ${filePath}:`, error.message);
    }
  }

  async initializeBaselines() {
    // Set initial baseline
    this.baselines.initial = {
      timestamp: Date.now(),
      metrics: JSON.parse(JSON.stringify(this.metrics)),
    };

    // Load saved baselines
    await this.loadBaselines();
  }

  async loadBaselines() {
    try {
      const baselineFile = path.join(this.config.metricsDir, 'baselines', 'current.json');
      const data = await fs.readFile(baselineFile, 'utf8');
      const baselines = JSON.parse(data);

      this.baselines = { ...this.baselines, ...baselines };
    } catch (error) {
      // File might not exist
    }
  }

  async saveBaselines() {
    const baselineFile = path.join(this.config.metricsDir, 'baselines', 'current.json');
    await fs.writeFile(baselineFile, JSON.stringify(this.baselines, null, 2));
  }

  async saveTrendAnalysis() {
    const date = new Date().toISOString();
    const trendFile = path.join(
      this.config.metricsDir,
      'trends',
      'analysis',
      `${date.split('T')[0]}.json`
    );

    await fs.writeFile(
      trendFile,
      JSON.stringify(
        {
          timestamp: Date.now(),
          trends: this.trends,
          metrics: this.metrics,
        },
        null,
        2
      )
    );
  }

  /**
   * Reporting and Export Methods
   */

  async generateReport(period = 'daily') {
    const report = {
      id: crypto.randomBytes(16).toString('hex'),
      period,
      timestamp: Date.now(),
      metrics: this.metrics,
      trends: this.trends,
      alerts: this.alerts,
      anomalies: this.anomalies,
      summary: await this.generateSummary(period),
      recommendations: await this.generateRecommendations(),
    };

    // Save report
    await this.saveReport(report);

    return report;
  }

  async generateSummary(period) {
    const summary = {
      learningProgress: `Learning rate: ${(this.metrics.learning.learningRate * 100).toFixed(1)}%`,
      mistakePrevention: `Prevention rate: ${(this.metrics.mistakes.preventionRate * 100).toFixed(1)}%`,
      performanceLevel: `Success rate: ${(this.metrics.performance.taskSuccessRate * 100).toFixed(1)}%`,
      knowledgeGrowth: `Total concepts: ${this.metrics.knowledge.totalConcepts}`,
      overallTrend:
        this.trends.trendStrength > 0
          ? 'improving'
          : this.trends.trendStrength < 0
            ? 'declining'
            : 'stable',
    };

    return summary;
  }

  async generateRecommendations() {
    const recommendations = [];

    // Check learning rate
    if (this.metrics.learning.learningRate < this.config.alertThresholds.learningRate) {
      recommendations.push({
        area: 'learning',
        issue: 'low_learning_rate',
        recommendation: 'Increase learning activities and feedback loops',
      });
    }

    // Check mistake rate
    if (this.metrics.mistakes.preventionRate < 0.5) {
      recommendations.push({
        area: 'mistakes',
        issue: 'low_prevention_rate',
        recommendation: 'Strengthen mistake prevention strategies',
      });
    }

    // Check performance
    if (this.trends.performanceTrend === 'declining') {
      recommendations.push({
        area: 'performance',
        issue: 'declining_trend',
        recommendation: 'Review recent changes and optimize algorithms',
      });
    }

    return recommendations;
  }

  async saveReport(report) {
    const date = new Date().toISOString().split('T')[0];
    const reportFile = path.join(this.config.metricsDir, 'reports', report.period, `${date}.json`);

    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
  }

  /**
   * Lifecycle Management
   */

  startTracking() {
    // Start tracking timer
    this.trackingTimer = setInterval(async () => {
      await this.aggregateMetrics();
      await this.analyzeTrends();
      await this.checkThresholds();
    }, this.config.trackingInterval);

    // Start aggregation timer
    this.aggregationTimer = setInterval(async () => {
      await this.performAggregation();
      await this.generateReport('hourly');
      await this.saveBaselines();
    }, this.config.aggregationInterval);
  }

  async aggregateMetrics() {
    // Aggregate metrics into buckets
    const now = Date.now();
    const hour = Math.floor(now / 3600000) * 3600000;
    const day = Math.floor(now / 86400000) * 86400000;

    // Update hourly bucket
    if (!this.buckets.hourly.has(hour)) {
      this.buckets.hourly.set(hour, {
        timestamp: hour,
        metrics: JSON.parse(JSON.stringify(this.metrics)),
      });
    }

    // Update daily bucket
    if (!this.buckets.daily.has(day)) {
      this.buckets.daily.set(day, {
        timestamp: day,
        metrics: JSON.parse(JSON.stringify(this.metrics)),
      });
    }
  }

  async performAggregation() {
    // Perform deeper aggregation
    const aggregated = {
      timestamp: Date.now(),
      hourly: this.aggregateHourlyMetrics(),
      daily: this.aggregateDailyMetrics(),
    };

    // Save aggregated metrics
    await this.saveAggregatedMetrics(aggregated);
  }

  aggregateHourlyMetrics() {
    const recent = Array.from(this.buckets.hourly.values()).filter(
      b => Date.now() - b.timestamp < 3600000
    );

    return this.calculateAggregates(recent);
  }

  aggregateDailyMetrics() {
    const recent = Array.from(this.buckets.daily.values()).filter(
      b => Date.now() - b.timestamp < 86400000
    );

    return this.calculateAggregates(recent);
  }

  calculateAggregates(buckets) {
    if (buckets.length === 0) return null;

    const aggregate = {
      count: buckets.length,
      learning: {
        avgRate: 0,
        totalEvents: 0,
      },
      mistakes: {
        totalCount: 0,
        preventionRate: 0,
      },
      performance: {
        avgSuccessRate: 0,
      },
    };

    for (const bucket of buckets) {
      aggregate.learning.avgRate += bucket.metrics.learning.learningRate;
      aggregate.learning.totalEvents += bucket.metrics.learning.totalEvents;
      aggregate.mistakes.totalCount += bucket.metrics.mistakes.totalMistakes;
      aggregate.performance.avgSuccessRate += bucket.metrics.performance.taskSuccessRate;
    }

    aggregate.learning.avgRate /= buckets.length;
    aggregate.performance.avgSuccessRate /= buckets.length;

    return aggregate;
  }

  async saveAggregatedMetrics(aggregated) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.config.metricsDir, 'aggregated', 'daily', `${date}.json`);

    await fs.writeFile(filePath, JSON.stringify(aggregated, null, 2));
  }

  async checkThresholds() {
    // Check learning rate threshold
    if (this.metrics.learning.learningRate < this.config.alertThresholds.learningRate) {
      this.generateAlert('low-learning-rate', {
        current: this.metrics.learning.learningRate,
        threshold: this.config.alertThresholds.learningRate,
      });
    }

    // Check error rate threshold
    if (this.realTime.currentErrorRate > this.config.alertThresholds.errorRate) {
      this.generateAlert('high-error-rate', {
        current: this.realTime.currentErrorRate,
        threshold: this.config.alertThresholds.errorRate,
      });
    }

    // Check performance decline
    if (this.trends.performanceTrend === 'declining' && this.trends.trendStrength < -0.5) {
      this.generateAlert('declining-performance', {
        trend: this.trends.performanceTrend,
        strength: this.trends.trendStrength,
      });
    }
  }

  getHistoricalDataCount() {
    let count = 0;
    for (const type in this.timeSeries) {
      count += this.timeSeries[type].length;
    }
    return count;
  }

  /**
   * Get status and shutdown
   */

  getStatus() {
    return {
      initialized: this.isInitialized,
      metrics: this.metrics,
      realTime: this.realTime,
      trends: this.trends,
      alerts: this.alerts.length,
      anomalies: this.anomalies.length,
      dataPoints: this.getHistoricalDataCount(),
    };
  }

  async exportMetrics(format = 'json', period = 'all') {
    const data = {
      exported: Date.now(),
      period,
      metrics: this.metrics,
      timeSeries: this.timeSeries,
      trends: this.trends,
      baselines: this.baselines,
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // Could add CSV export here
    return data;
  }

  async shutdown() {
    // Stop timers
    if (this.trackingTimer) {
      clearInterval(this.trackingTimer);
    }

    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
    }

    // Save final state
    await this.performAggregation();
    await this.generateReport('final');
    await this.saveBaselines();

    this.emit('shutdown');
    console.log('✅ Learning Metrics Tracker shutdown complete');
  }
}

module.exports = LearningMetricsTracker;
