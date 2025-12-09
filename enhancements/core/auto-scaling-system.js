/**
 * Auto-Scaling System - v6.0
 * Automatically scales resources based on demand and performance metrics
 * Implements predictive scaling and resource optimization
 *
 * Part 1: Core initialization and scaling strategies
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const os = require('os');

class AutoScalingSystem extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      scalingDir: options.scalingDir || path.join(process.cwd(), 'vibe-data', 'scaling'),
      monitoringInterval: options.monitoringInterval || 10000, // 10 seconds
      scalingCooldown: options.scalingCooldown || 60000, // 1 minute
      minInstances: options.minInstances || 1,
      maxInstances: options.maxInstances || 10,
      targetUtilization: {
        cpu: options.targetCpuUtilization || 70,
        memory: options.targetMemoryUtilization || 80,
      },
      scalingPolicies: {
        aggressive: options.aggressiveScaling || false,
        predictive: options.predictiveScaling !== false,
        costOptimized: options.costOptimized || false,
      },
    };

    // Scaling metrics
    this.metrics = {
      cpu: [],
      memory: [],
      requests: [],
      responseTime: [],
      errorRate: [],
      throughput: [],
    };

    // Instance management
    this.instances = new Map();
    this.activeInstances = 1;
    this.pendingScaling = null;
    this.lastScalingAction = null;

    // Scaling policies
    this.policies = {
      cpu: this.createCpuPolicy(),
      memory: this.createMemoryPolicy(),
      request: this.createRequestPolicy(),
      performance: this.createPerformancePolicy(),
      predictive: this.createPredictivePolicy(),
    };

    // Scaling history
    this.scalingHistory = [];
    this.scalingDecisions = new Map();

    // Predictive model
    this.predictions = {
      nextHourLoad: null,
      peakTime: null,
      trend: 'stable',
    };

    // Statistics
    this.stats = {
      totalScalingEvents: 0,
      scaleUpEvents: 0,
      scaleDownEvents: 0,
      avgResponseTime: 0,
      avgUtilization: {
        cpu: 0,
        memory: 0,
      },
      costSavings: 0,
    };

    this.isInitialized = false;
    this.monitoringTimer = null;
  }

  /**
   * Initialize auto-scaling system
   */
  async initialize() {
    try {
      console.log('⚖️ Initializing Auto-Scaling System...');

      // Create directory structure
      await this.createDirectories();

      // Load scaling history
      await this.loadScalingHistory();

      // Initialize instances
      await this.initializeInstances();

      // Start monitoring
      this.startMonitoring();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Auto-Scaling System initialized');
      console.log(`   - Active instances: ${this.activeInstances}`);
      console.log(`   - Scaling range: ${this.config.minInstances}-${this.config.maxInstances}`);
      console.log(
        `   - Predictive scaling: ${this.config.scalingPolicies.predictive ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      console.error('❌ Failed to initialize Auto-Scaling:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = [
      'metrics',
      'metrics/cpu',
      'metrics/memory',
      'metrics/requests',
      'history',
      'policies',
      'predictions',
      'instances',
      'reports',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.scalingDir, dir), { recursive: true });
    }
  }

  /**
   * Create scaling policies
   */
  createCpuPolicy() {
    return {
      type: 'cpu',
      scaleUpThreshold: this.config.targetUtilization.cpu + 10,
      scaleDownThreshold: this.config.targetUtilization.cpu - 20,
      scaleUpAmount: 1,
      scaleDownAmount: 1,
      evaluationPeriods: 3,
      breachDuration: 2,
    };
  }

  createMemoryPolicy() {
    return {
      type: 'memory',
      scaleUpThreshold: this.config.targetUtilization.memory + 5,
      scaleDownThreshold: this.config.targetUtilization.memory - 25,
      scaleUpAmount: 1,
      scaleDownAmount: 1,
      evaluationPeriods: 3,
      breachDuration: 2,
    };
  }

  createRequestPolicy() {
    return {
      type: 'request',
      scaleUpThreshold: 1000, // requests per minute
      scaleDownThreshold: 200,
      scaleUpAmount: 2,
      scaleDownAmount: 1,
      evaluationPeriods: 2,
      breachDuration: 1,
    };
  }

  createPerformancePolicy() {
    return {
      type: 'performance',
      scaleUpThreshold: 1000, // ms response time
      scaleDownThreshold: 200,
      scaleUpAmount: 1,
      scaleDownAmount: 1,
      evaluationPeriods: 5,
      breachDuration: 3,
    };
  }

  createPredictivePolicy() {
    return {
      type: 'predictive',
      lookAheadMinutes: 30,
      scaleUpBuffer: 0.2, // 20% buffer
      scaleDownBuffer: 0.3,
      confidenceThreshold: 0.7,
    };
  }

  /**
   * Initialize instances
   */
  async initializeInstances() {
    for (let i = 0; i < this.config.minInstances; i++) {
      const instance = await this.createInstance();
      this.instances.set(instance.id, instance);
    }

    this.activeInstances = this.config.minInstances;
  }

  async createInstance() {
    const instance = {
      id: crypto.randomBytes(8).toString('hex'),
      status: 'running',
      startTime: Date.now(),
      metrics: {
        cpu: 0,
        memory: 0,
        requests: 0,
        errors: 0,
      },
      health: 'healthy',
    };

    return instance;
  }

  /**
   * Monitoring and metrics collection
   */
  startMonitoring() {
    this.monitoringTimer = setInterval(async () => {
      await this.collectMetrics();
      await this.evaluateScaling();

      if (this.config.scalingPolicies.predictive) {
        await this.performPredictiveAnalysis();
      }
    }, this.config.monitoringInterval);
  }

  async collectMetrics() {
    const metrics = {
      timestamp: Date.now(),
      cpu: this.getCurrentCpuUsage(),
      memory: this.getCurrentMemoryUsage(),
      requests: this.getCurrentRequestRate(),
      responseTime: this.getCurrentResponseTime(),
      errorRate: this.getCurrentErrorRate(),
      throughput: this.getCurrentThroughput(),
    };

    // Store metrics
    this.metrics.cpu.push({ timestamp: metrics.timestamp, value: metrics.cpu });
    this.metrics.memory.push({ timestamp: metrics.timestamp, value: metrics.memory });
    this.metrics.requests.push({ timestamp: metrics.timestamp, value: metrics.requests });
    this.metrics.responseTime.push({ timestamp: metrics.timestamp, value: metrics.responseTime });
    this.metrics.errorRate.push({ timestamp: metrics.timestamp, value: metrics.errorRate });
    this.metrics.throughput.push({ timestamp: metrics.timestamp, value: metrics.throughput });

    // Prune old metrics
    this.pruneMetrics();

    // Update statistics
    this.updateStatistics(metrics);

    return metrics;
  }

  getCurrentCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~((100 * idle) / total);

    return usage;
  }

  getCurrentMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = (used / total) * 100;

    return usage;
  }

  getCurrentRequestRate() {
    // Simulate request rate (would be actual metrics in production)
    return Math.random() * 1500;
  }

  getCurrentResponseTime() {
    // Simulate response time
    return 200 + Math.random() * 300;
  }

  getCurrentErrorRate() {
    // Simulate error rate
    return Math.random() * 5;
  }

  getCurrentThroughput() {
    // Simulate throughput
    return Math.random() * 100;
  }

  pruneMetrics() {
    const cutoff = Date.now() - 60 * 60 * 1000; // Keep 1 hour

    for (const metricType in this.metrics) {
      this.metrics[metricType] = this.metrics[metricType].filter(m => m.timestamp > cutoff);
    }
  }

  updateStatistics(metrics) {
    // Update averages
    this.stats.avgUtilization.cpu = this.stats.avgUtilization.cpu * 0.9 + metrics.cpu * 0.1;

    this.stats.avgUtilization.memory =
      this.stats.avgUtilization.memory * 0.9 + metrics.memory * 0.1;

    this.stats.avgResponseTime = this.stats.avgResponseTime * 0.9 + metrics.responseTime * 0.1;
  }

  /**
   * Scaling Evaluation and Decision (Part 2)
   */

  async evaluateScaling() {
    // Check if in cooldown period
    if (this.isInCooldown()) {
      return;
    }

    const decision = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      action: 'none',
      reason: null,
      metrics: await this.getAverageMetrics(),
      confidence: 0,
    };

    // Evaluate each policy
    const cpuDecision = await this.evaluatePolicy(this.policies.cpu);
    const memoryDecision = await this.evaluatePolicy(this.policies.memory);
    const requestDecision = await this.evaluatePolicy(this.policies.request);
    const performanceDecision = await this.evaluatePolicy(this.policies.performance);

    // Combine decisions
    const decisions = [cpuDecision, memoryDecision, requestDecision, performanceDecision].filter(
      d => d && d.action !== 'none'
    );

    if (decisions.length > 0) {
      // Prioritize scale up over scale down
      const scaleUpDecisions = decisions.filter(d => d.action === 'scale-up');
      const scaleDownDecisions = decisions.filter(d => d.action === 'scale-down');

      if (scaleUpDecisions.length > 0) {
        decision.action = 'scale-up';
        decision.reason = scaleUpDecisions.map(d => d.reason).join(', ');
        decision.confidence = Math.max(...scaleUpDecisions.map(d => d.confidence));
      } else if (scaleDownDecisions.length > 0 && !this.config.scalingPolicies.aggressive) {
        decision.action = 'scale-down';
        decision.reason = scaleDownDecisions.map(d => d.reason).join(', ');
        decision.confidence = Math.min(...scaleDownDecisions.map(d => d.confidence));
      }
    }

    // Apply predictive scaling if enabled
    if (this.config.scalingPolicies.predictive) {
      const predictiveDecision = await this.evaluatePredictiveScaling();
      if (
        predictiveDecision.action !== 'none' &&
        predictiveDecision.confidence > decision.confidence
      ) {
        decision.action = predictiveDecision.action;
        decision.reason = `Predictive: ${predictiveDecision.reason}`;
        decision.confidence = predictiveDecision.confidence;
      }
    }

    // Execute scaling decision
    if (decision.action !== 'none') {
      await this.executeScaling(decision);
    }

    // Store decision
    this.scalingDecisions.set(decision.id, decision);
  }

  isInCooldown() {
    if (!this.lastScalingAction) return false;

    const timeSinceLastScaling = Date.now() - this.lastScalingAction.timestamp;
    return timeSinceLastScaling < this.config.scalingCooldown;
  }

  async getAverageMetrics() {
    const periods = 5; // Last 5 periods

    return {
      cpu: this.getRecentAverage(this.metrics.cpu, periods),
      memory: this.getRecentAverage(this.metrics.memory, periods),
      requests: this.getRecentAverage(this.metrics.requests, periods),
      responseTime: this.getRecentAverage(this.metrics.responseTime, periods),
      errorRate: this.getRecentAverage(this.metrics.errorRate, periods),
    };
  }

  getRecentAverage(metrics, periods) {
    const recent = metrics.slice(-periods);
    if (recent.length === 0) return 0;

    const sum = recent.reduce((acc, m) => acc + m.value, 0);
    return sum / recent.length;
  }

  async evaluatePolicy(policy) {
    const decision = {
      action: 'none',
      reason: null,
      confidence: 0,
    };

    const metrics = await this.getMetricsForPolicy(policy);
    const breaches = this.countBreaches(metrics, policy);

    if (breaches.scaleUp >= policy.breachDuration) {
      decision.action = 'scale-up';
      decision.reason = `${policy.type} threshold breached`;
      decision.confidence = breaches.scaleUp / policy.evaluationPeriods;
    } else if (breaches.scaleDown >= policy.breachDuration) {
      decision.action = 'scale-down';
      decision.reason = `${policy.type} below threshold`;
      decision.confidence = breaches.scaleDown / policy.evaluationPeriods;
    }

    return decision;
  }

  async getMetricsForPolicy(policy) {
    switch (policy.type) {
      case 'cpu':
        return this.metrics.cpu.slice(-policy.evaluationPeriods);
      case 'memory':
        return this.metrics.memory.slice(-policy.evaluationPeriods);
      case 'request':
        return this.metrics.requests.slice(-policy.evaluationPeriods);
      case 'performance':
        return this.metrics.responseTime.slice(-policy.evaluationPeriods);
      default:
        return [];
    }
  }

  countBreaches(metrics, policy) {
    let scaleUp = 0;
    let scaleDown = 0;

    for (const metric of metrics) {
      if (metric.value > policy.scaleUpThreshold) {
        scaleUp++;
      } else if (metric.value < policy.scaleDownThreshold) {
        scaleDown++;
      }
    }

    return { scaleUp, scaleDown };
  }

  /**
   * Predictive scaling
   */

  async performPredictiveAnalysis() {
    // Analyze historical patterns
    const patterns = await this.analyzePatterns();

    // Predict future load
    this.predictions.nextHourLoad = await this.predictLoad(60);

    // Identify peak times
    this.predictions.peakTime = await this.identifyPeakTime();

    // Determine trend
    this.predictions.trend = await this.determineTrend();
  }

  async analyzePatterns() {
    const patterns = {
      hourly: this.extractHourlyPattern(),
      daily: this.extractDailyPattern(),
      weekly: this.extractWeeklyPattern(),
    };

    return patterns;
  }

  extractHourlyPattern() {
    const hourlyData = {};

    for (const metric of this.metrics.cpu) {
      const hour = new Date(metric.timestamp).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(metric.value);
    }

    const pattern = {};
    for (const hour in hourlyData) {
      const values = hourlyData[hour];
      pattern[hour] = values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    return pattern;
  }

  extractDailyPattern() {
    // Similar to hourly but for days of week
    return {};
  }

  extractWeeklyPattern() {
    // Pattern over weeks
    return {};
  }

  async predictLoad(minutesAhead) {
    // Simple linear regression for prediction
    const recentMetrics = this.metrics.cpu.slice(-20);

    if (recentMetrics.length < 5) {
      return this.stats.avgUtilization.cpu;
    }

    // Calculate trend
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;
    const n = recentMetrics.length;

    recentMetrics.forEach((metric, i) => {
      sumX += i;
      sumY += metric.value;
      sumXY += i * metric.value;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict future value
    const futureIndex = n + minutesAhead / 10; // Assuming 10-second intervals
    const prediction = slope * futureIndex + intercept;

    return Math.max(0, Math.min(100, prediction));
  }

  async identifyPeakTime() {
    const hourlyPattern = this.extractHourlyPattern();
    let peakHour = 0;
    let peakValue = 0;

    for (const hour in hourlyPattern) {
      if (hourlyPattern[hour] > peakValue) {
        peakValue = hourlyPattern[hour];
        peakHour = parseInt(hour);
      }
    }

    return peakHour;
  }

  async determineTrend() {
    const recent = this.metrics.cpu.slice(-10);
    const older = this.metrics.cpu.slice(-20, -10);

    if (recent.length === 0 || older.length === 0) {
      return 'stable';
    }

    const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  async evaluatePredictiveScaling() {
    const decision = {
      action: 'none',
      reason: null,
      confidence: 0,
    };

    const policy = this.policies.predictive;
    const predictedLoad = this.predictions.nextHourLoad;

    if (!predictedLoad) return decision;

    // Check if predicted load exceeds thresholds
    if (predictedLoad > this.config.targetUtilization.cpu + policy.scaleUpBuffer * 100) {
      decision.action = 'scale-up';
      decision.reason = `Predicted high load: ${predictedLoad.toFixed(1)}%`;
      decision.confidence = Math.min(1, predictedLoad / 100);
    } else if (predictedLoad < this.config.targetUtilization.cpu - policy.scaleDownBuffer * 100) {
      decision.action = 'scale-down';
      decision.reason = `Predicted low load: ${predictedLoad.toFixed(1)}%`;
      decision.confidence = Math.min(1, (100 - predictedLoad) / 100);
    }

    // Check if approaching peak time
    const currentHour = new Date().getHours();
    const hoursUntilPeak = (this.predictions.peakTime - currentHour + 24) % 24;

    if (hoursUntilPeak <= 1 && hoursUntilPeak > 0) {
      decision.action = 'scale-up';
      decision.reason = 'Approaching peak time';
      decision.confidence = 0.8;
    }

    return decision;
  }

  /**
   * Execute scaling actions
   */

  async executeScaling(decision) {
    const scalingAction = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      decision: decision,
      previousInstances: this.activeInstances,
      newInstances: this.activeInstances,
      status: 'executing',
    };

    try {
      if (decision.action === 'scale-up') {
        scalingAction.newInstances = await this.scaleUp();
        this.stats.scaleUpEvents++;
      } else if (decision.action === 'scale-down') {
        scalingAction.newInstances = await this.scaleDown();
        this.stats.scaleDownEvents++;
      }

      scalingAction.status = 'completed';
      this.stats.totalScalingEvents++;

      // Calculate cost savings
      if (decision.action === 'scale-down') {
        this.stats.costSavings += this.calculateCostSavings(
          scalingAction.previousInstances,
          scalingAction.newInstances
        );
      }

      // Update last scaling action
      this.lastScalingAction = scalingAction;

      // Store in history
      this.scalingHistory.push(scalingAction);
      await this.saveScalingAction(scalingAction);

      // Emit event
      this.emit('scalingExecuted', scalingAction);

      console.log(
        `⚖️ Scaling ${decision.action}: ${scalingAction.previousInstances} -> ${scalingAction.newInstances} instances`
      );
      console.log(`   Reason: ${decision.reason}`);
    } catch (error) {
      scalingAction.status = 'failed';
      scalingAction.error = error.message;
      console.error('Scaling execution failed:', error);
    }

    return scalingAction;
  }

  async scaleUp() {
    const targetInstances = Math.min(this.activeInstances + 1, this.config.maxInstances);

    if (targetInstances > this.activeInstances) {
      // Create new instance
      const instance = await this.createInstance();
      this.instances.set(instance.id, instance);
      this.activeInstances = targetInstances;
    }

    return this.activeInstances;
  }

  async scaleDown() {
    const targetInstances = Math.max(this.activeInstances - 1, this.config.minInstances);

    if (targetInstances < this.activeInstances) {
      // Remove oldest instance
      const oldestInstance = this.findOldestInstance();
      if (oldestInstance) {
        await this.terminateInstance(oldestInstance.id);
        this.activeInstances = targetInstances;
      }
    }

    return this.activeInstances;
  }

  findOldestInstance() {
    let oldest = null;
    let oldestTime = Infinity;

    for (const [id, instance] of this.instances) {
      if (instance.startTime < oldestTime && instance.status === 'running') {
        oldest = instance;
        oldestTime = instance.startTime;
      }
    }

    return oldest;
  }

  async terminateInstance(instanceId) {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.status = 'terminated';
      instance.endTime = Date.now();

      // Remove from active instances after cleanup
      setTimeout(() => {
        this.instances.delete(instanceId);
      }, 60000); // Keep for 1 minute for logs
    }
  }

  calculateCostSavings(previousInstances, newInstances) {
    // Simple cost calculation (would be actual cloud costs in production)
    const instanceCostPerHour = 0.1; // $0.10 per instance per hour
    const savedInstances = previousInstances - newInstances;
    return savedInstances * instanceCostPerHour;
  }

  /**
   * Storage and Reporting (Part 3)
   */

  async loadScalingHistory() {
    try {
      const historyDir = path.join(this.config.scalingDir, 'history');
      const files = await fs.readdir(historyDir);

      for (const file of files.slice(-50)) {
        // Last 50 scaling events
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(historyDir, file), 'utf8');
          const action = JSON.parse(data);
          this.scalingHistory.push(action);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async saveScalingAction(action) {
    const filePath = path.join(
      this.config.scalingDir,
      'history',
      `${action.timestamp}-${action.id}.json`
    );

    await fs.writeFile(filePath, JSON.stringify(action, null, 2));
  }

  async saveMetrics() {
    const date = new Date().toISOString().split('T')[0];
    const metricsFile = path.join(this.config.scalingDir, 'metrics', `${date}.json`);

    const metricsData = {
      date,
      cpu: this.metrics.cpu.slice(-100),
      memory: this.metrics.memory.slice(-100),
      requests: this.metrics.requests.slice(-100),
      responseTime: this.metrics.responseTime.slice(-100),
    };

    await fs.writeFile(metricsFile, JSON.stringify(metricsData, null, 2));
  }

  async savePredictions() {
    const predictionsFile = path.join(this.config.scalingDir, 'predictions', `${Date.now()}.json`);

    await fs.writeFile(predictionsFile, JSON.stringify(this.predictions, null, 2));
  }

  /**
   * Health checks and monitoring
   */

  async performHealthCheck() {
    for (const [id, instance] of this.instances) {
      if (instance.status === 'running') {
        instance.health = await this.checkInstanceHealth(instance);

        if (instance.health === 'unhealthy') {
          console.warn(`Instance ${id} is unhealthy`);
          await this.handleUnhealthyInstance(instance);
        }
      }
    }
  }

  async checkInstanceHealth(instance) {
    // Simulate health check
    const healthScore = Math.random();

    if (healthScore > 0.95) return 'unhealthy';
    if (healthScore > 0.8) return 'degraded';
    return 'healthy';
  }

  async handleUnhealthyInstance(instance) {
    // Replace unhealthy instance
    console.log(`Replacing unhealthy instance: ${instance.id}`);

    // Create replacement
    const replacement = await this.createInstance();
    this.instances.set(replacement.id, replacement);

    // Terminate unhealthy instance
    await this.terminateInstance(instance.id);
  }

  /**
   * Generate reports
   */

  async generateReport() {
    const report = {
      timestamp: Date.now(),
      period: {
        start: Date.now() - 24 * 60 * 60 * 1000,
        end: Date.now(),
      },
      summary: {
        currentInstances: this.activeInstances,
        minInstances: this.config.minInstances,
        maxInstances: this.config.maxInstances,
        avgCpuUtilization: this.stats.avgUtilization.cpu,
        avgMemoryUtilization: this.stats.avgUtilization.memory,
        avgResponseTime: this.stats.avgResponseTime,
      },
      scalingEvents: {
        total: this.stats.totalScalingEvents,
        scaleUp: this.stats.scaleUpEvents,
        scaleDown: this.stats.scaleDownEvents,
      },
      costAnalysis: {
        totalSavings: this.stats.costSavings,
        instanceHours: this.calculateInstanceHours(),
        efficiency: this.calculateEfficiency(),
      },
      predictions: this.predictions,
      recommendations: await this.generateRecommendations(),
    };

    // Save report
    const reportFile = path.join(this.config.scalingDir, 'reports', `report-${Date.now()}.json`);

    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    return report;
  }

  calculateInstanceHours() {
    let totalHours = 0;

    for (const [id, instance] of this.instances) {
      const runtime = (Date.now() - instance.startTime) / (1000 * 60 * 60);
      totalHours += runtime;
    }

    return totalHours;
  }

  calculateEfficiency() {
    // Efficiency = optimal utilization vs actual utilization
    const optimalCpu = this.config.targetUtilization.cpu;
    const actualCpu = this.stats.avgUtilization.cpu;

    const efficiency = 1 - Math.abs(optimalCpu - actualCpu) / optimalCpu;
    return Math.max(0, efficiency);
  }

  async generateRecommendations() {
    const recommendations = [];

    // Check if over-provisioned
    if (this.stats.avgUtilization.cpu < 30 && this.activeInstances > this.config.minInstances) {
      recommendations.push({
        type: 'cost-optimization',
        message: 'Consider reducing minimum instances - low average utilization',
        impact: 'high',
      });
    }

    // Check if under-provisioned
    if (this.stats.avgUtilization.cpu > 80) {
      recommendations.push({
        type: 'performance',
        message: 'Consider increasing maximum instances - high average utilization',
        impact: 'medium',
      });
    }

    // Check scaling frequency
    if (this.stats.totalScalingEvents > 20) {
      recommendations.push({
        type: 'stability',
        message: 'High scaling frequency detected - consider adjusting thresholds',
        impact: 'medium',
      });
    }

    // Check predictive scaling effectiveness
    if (this.config.scalingPolicies.predictive && this.predictions.trend === 'stable') {
      recommendations.push({
        type: 'efficiency',
        message: 'Stable load pattern - predictive scaling is working well',
        impact: 'low',
      });
    }

    return recommendations;
  }

  /**
   * Manual scaling controls
   */

  async manualScale(targetInstances) {
    if (targetInstances < this.config.minInstances || targetInstances > this.config.maxInstances) {
      throw new Error(
        `Target instances must be between ${this.config.minInstances} and ${this.config.maxInstances}`
      );
    }

    const decision = {
      action: targetInstances > this.activeInstances ? 'scale-up' : 'scale-down',
      reason: 'Manual scaling',
      confidence: 1.0,
    };

    while (this.activeInstances !== targetInstances) {
      if (this.activeInstances < targetInstances) {
        await this.scaleUp();
      } else {
        await this.scaleDown();
      }
    }

    console.log(`🎯 Manual scaling completed: ${targetInstances} instances`);

    return this.activeInstances;
  }

  /**
   * Cost optimization
   */

  async optimizeCosts() {
    if (!this.config.scalingPolicies.costOptimized) {
      return;
    }

    // Analyze usage patterns
    const patterns = this.extractHourlyPattern();
    const currentHour = new Date().getHours();
    const expectedLoad = patterns[currentHour] || 50;

    // Calculate optimal instances for cost
    const optimalInstances = Math.ceil((expectedLoad / 100) * this.config.maxInstances);

    // Apply cost-optimized scaling
    if (Math.abs(optimalInstances - this.activeInstances) > 1) {
      await this.manualScale(optimalInstances);

      console.log(`💰 Cost optimization: Scaled to ${optimalInstances} instances`);
    }
  }

  /**
   * Get status and shutdown
   */

  getStatus() {
    return {
      initialized: this.isInitialized,
      instances: {
        active: this.activeInstances,
        min: this.config.minInstances,
        max: this.config.maxInstances,
        health: this.getHealthSummary(),
      },
      metrics: {
        cpu: this.stats.avgUtilization.cpu,
        memory: this.stats.avgUtilization.memory,
        responseTime: this.stats.avgResponseTime,
      },
      scaling: {
        totalEvents: this.stats.totalScalingEvents,
        lastAction: this.lastScalingAction,
        inCooldown: this.isInCooldown(),
      },
      predictions: this.predictions,
      costSavings: this.stats.costSavings,
    };
  }

  getHealthSummary() {
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;

    for (const [id, instance] of this.instances) {
      if (instance.status === 'running') {
        switch (instance.health) {
          case 'healthy':
            healthy++;
            break;
          case 'degraded':
            degraded++;
            break;
          case 'unhealthy':
            unhealthy++;
            break;
        }
      }
    }

    return { healthy, degraded, unhealthy };
  }

  async shutdown() {
    // Stop monitoring
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    // Save final metrics
    await this.saveMetrics();

    // Save predictions
    await this.savePredictions();

    // Generate final report
    const finalReport = await this.generateReport();

    // Scale down to minimum
    while (this.activeInstances > this.config.minInstances) {
      await this.scaleDown();
    }

    this.emit('shutdown', finalReport);
    console.log('✅ Auto-Scaling System shutdown complete');
    console.log(`   Final instances: ${this.activeInstances}`);
    console.log(`   Total cost savings: $${this.stats.costSavings.toFixed(2)}`);
  }
}

module.exports = AutoScalingSystem;
