/**
 * Performance Analytics Engine - v6.0
 * Deep performance analysis, optimization recommendations, and bottleneck detection
 * Provides comprehensive system performance insights
 *
 * Part 1: Core initialization and monitoring setup
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class PerformanceAnalyticsEngine extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      analyticsDir: options.analyticsDir || path.join(process.cwd(), 'vibe-data', 'analytics'),
      samplingInterval: options.samplingInterval || 1000, // 1 second
      analysisInterval: options.analysisInterval || 60000, // 1 minute
      metricsRetention: options.metricsRetention || 7 * 24 * 60 * 60 * 1000, // 7 days
      performanceThresholds: {
        responseTime: options.maxResponseTime || 1000, // ms
        memoryUsage: options.maxMemoryUsage || 500 * 1024 * 1024, // 500MB
        cpuUsage: options.maxCpuUsage || 80, // percentage
        errorRate: options.maxErrorRate || 0.05, // 5%
      },
    };

    // Performance metrics
    this.metrics = {
      system: {
        cpuUsage: [],
        memoryUsage: [],
        diskIO: [],
        networkIO: [],
      },
      application: {
        responseTime: [],
        throughput: [],
        errorRate: [],
        successRate: [],
      },
      operations: {
        taskDuration: new Map(),
        functionCalls: new Map(),
        apiCalls: new Map(),
        databaseQueries: new Map(),
      },
      resources: {
        activeConnections: 0,
        threadPoolSize: 0,
        cacheHitRate: 0,
        queueDepth: 0,
      },
    };

    // Analysis results
    this.analysis = {
      bottlenecks: [],
      recommendations: [],
      trends: {},
      anomalies: [],
      optimizations: [],
    };

    // Performance profiles
    this.profiles = new Map();
    this.benchmarks = new Map();
    this.baselines = new Map();

    // Real-time monitoring
    this.monitors = {
      cpu: null,
      memory: null,
      io: null,
      network: null,
    };

    // Statistics
    this.stats = {
      totalAnalyses: 0,
      bottlenecksDetected: 0,
      optimizationsApplied: 0,
      performanceGain: 0,
      avgResponseTime: 0,
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
    };

    this.isInitialized = false;
    this.samplingTimer = null;
    this.analysisTimer = null;
  }

  /**
   * Initialize performance analytics
   */
  async initialize() {
    try {
      console.log('📈 Initializing Performance Analytics Engine...');

      // Create directory structure
      await this.createDirectories();

      // Load historical data
      await this.loadHistoricalData();

      // Initialize monitors
      await this.initializeMonitors();

      // Establish baselines
      await this.establishBaselines();

      // Start monitoring
      this.startMonitoring();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Performance Analytics Engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Performance Analytics:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = [
      'metrics',
      'metrics/system',
      'metrics/application',
      'analysis',
      'analysis/bottlenecks',
      'analysis/recommendations',
      'profiles',
      'benchmarks',
      'reports',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.analyticsDir, dir), { recursive: true });
    }
  }

  /**
   * Start a performance measurement
   */
  startMeasurement(name, metadata = {}) {
    const measurement = {
      id: crypto.randomBytes(16).toString('hex'),
      name,
      startTime: Date.now(),
      startMemory: process.memoryUsage(),
      startCpu: process.cpuUsage(),
      metadata,
    };

    return measurement;
  }

  /**
   * End a performance measurement
   */
  endMeasurement(measurement) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage();

    const result = {
      ...measurement,
      endTime,
      duration: endTime - measurement.startTime,
      memoryDelta: {
        rss: endMemory.rss - measurement.startMemory.rss,
        heapTotal: endMemory.heapTotal - measurement.startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - measurement.startMemory.heapUsed,
      },
      cpuDelta: {
        user: endCpu.user - measurement.startCpu.user,
        system: endCpu.system - measurement.startCpu.system,
      },
    };

    // Store in operations metrics
    if (!this.metrics.operations.taskDuration.has(measurement.name)) {
      this.metrics.operations.taskDuration.set(measurement.name, []);
    }
    this.metrics.operations.taskDuration.get(measurement.name).push(result);

    // Check for performance issues
    this.checkPerformance(result);

    return result;
  }

  /**
   * Record a function call
   */
  recordFunctionCall(name, duration, success = true) {
    if (!this.metrics.operations.functionCalls.has(name)) {
      this.metrics.operations.functionCalls.set(name, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errors: 0,
      });
    }

    const stats = this.metrics.operations.functionCalls.get(name);
    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.count;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);

    if (!success) {
      stats.errors++;
    }

    // Update application metrics
    this.updateApplicationMetrics('functionCall', { name, duration, success });
  }

  /**
   * Record API call performance
   */
  recordApiCall(endpoint, method, duration, statusCode) {
    const key = `${method} ${endpoint}`;

    if (!this.metrics.operations.apiCalls.has(key)) {
      this.metrics.operations.apiCalls.set(key, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        statusCodes: {},
      });
    }

    const stats = this.metrics.operations.apiCalls.get(key);
    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.count;

    if (!stats.statusCodes[statusCode]) {
      stats.statusCodes[statusCode] = 0;
    }
    stats.statusCodes[statusCode]++;

    // Update metrics
    this.updateApplicationMetrics('apiCall', {
      endpoint,
      method,
      duration,
      statusCode,
    });
  }

  /**
   * Monitoring and Analysis Methods (Part 2)
   */

  async initializeMonitors() {
    // CPU monitoring
    this.monitors.cpu = setInterval(() => {
      const usage = process.cpuUsage();
      const percent = this.calculateCpuPercent(usage);

      this.metrics.system.cpuUsage.push({
        timestamp: Date.now(),
        value: percent,
      });

      this.pruneOldMetrics('cpuUsage');
    }, this.config.samplingInterval);

    // Memory monitoring
    this.monitors.memory = setInterval(() => {
      const usage = process.memoryUsage();

      this.metrics.system.memoryUsage.push({
        timestamp: Date.now(),
        value: usage,
      });

      this.pruneOldMetrics('memoryUsage');
    }, this.config.samplingInterval);
  }

  calculateCpuPercent(usage) {
    // Simplified CPU percentage calculation
    const total = usage.user + usage.system;
    const elapsed = Date.now() - (this.lastCpuCheck || Date.now());
    this.lastCpuCheck = Date.now();

    return Math.min(100, (total / 1000 / elapsed) * 100);
  }

  pruneOldMetrics(type) {
    const cutoff = Date.now() - this.config.metricsRetention;

    if (this.metrics.system[type]) {
      this.metrics.system[type] = this.metrics.system[type].filter(m => m.timestamp > cutoff);
    }

    if (this.metrics.application[type]) {
      this.metrics.application[type] = this.metrics.application[type].filter(
        m => m.timestamp > cutoff
      );
    }
  }

  updateApplicationMetrics(type, data) {
    const timestamp = Date.now();

    switch (type) {
      case 'functionCall':
        this.metrics.application.responseTime.push({
          timestamp,
          value: data.duration,
        });

        if (!data.success) {
          const errorRate = this.calculateErrorRate();
          this.metrics.application.errorRate.push({
            timestamp,
            value: errorRate,
          });
        }
        break;

      case 'apiCall':
        this.metrics.application.throughput.push({
          timestamp,
          value: 1, // One request
        });

        if (data.statusCode >= 400) {
          const errorRate = this.calculateErrorRate();
          this.metrics.application.errorRate.push({
            timestamp,
            value: errorRate,
          });
        }
        break;
    }

    // Prune old metrics
    this.pruneOldMetrics('responseTime');
    this.pruneOldMetrics('throughput');
    this.pruneOldMetrics('errorRate');
  }

  calculateErrorRate() {
    const recentCalls = Array.from(this.metrics.operations.functionCalls.values());
    const totalCalls = recentCalls.reduce((sum, s) => sum + s.count, 0);
    const totalErrors = recentCalls.reduce((sum, s) => sum + s.errors, 0);

    return totalCalls > 0 ? totalErrors / totalCalls : 0;
  }

  checkPerformance(measurement) {
    // Check response time
    if (measurement.duration > this.config.performanceThresholds.responseTime) {
      this.detectBottleneck('slow-response', measurement);
    }

    // Check memory usage
    if (measurement.memoryDelta.heapUsed > 50 * 1024 * 1024) {
      // 50MB
      this.detectBottleneck('memory-leak', measurement);
    }
  }

  detectBottleneck(type, data) {
    const bottleneck = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
      type,
      severity: this.calculateSeverity(type, data),
      data,
      recommendation: this.generateRecommendation(type, data),
    };

    this.analysis.bottlenecks.push(bottleneck);
    this.stats.bottlenecksDetected++;

    this.emit('bottleneckDetected', bottleneck);
  }

  calculateSeverity(type, data) {
    switch (type) {
      case 'slow-response':
        if (data.duration > 5000) return 'critical';
        if (data.duration > 2000) return 'high';
        return 'medium';

      case 'memory-leak':
        if (data.memoryDelta.heapUsed > 100 * 1024 * 1024) return 'critical';
        return 'high';

      default:
        return 'medium';
    }
  }

  generateRecommendation(type, data) {
    switch (type) {
      case 'slow-response':
        return {
          type: 'optimization',
          action: 'optimize-algorithm',
          description: `Function ${data.name} is slow (${data.duration}ms)`,
          suggestions: [
            'Add caching',
            'Optimize algorithm',
            'Use async operations',
            'Batch processing',
          ],
        };

      case 'memory-leak':
        return {
          type: 'memory',
          action: 'fix-memory-leak',
          description: `Potential memory leak in ${data.name}`,
          suggestions: [
            'Check for circular references',
            'Clear unused variables',
            'Implement proper cleanup',
            'Use weak references',
          ],
        };

      default:
        return null;
    }
  }

  /**
   * Deep Analysis Methods (Part 3)
   */

  async performAnalysis() {
    const analysis = {
      timestamp: Date.now(),
      bottlenecks: await this.analyzeBottlenecks(),
      trends: await this.analyzeTrends(),
      anomalies: await this.detectAnomalies(),
      optimizations: await this.identifyOptimizations(),
    };

    this.analysis = analysis;
    this.stats.totalAnalyses++;

    // Generate recommendations
    analysis.recommendations = await this.generateRecommendations(analysis);

    // Save analysis
    await this.saveAnalysis(analysis);

    this.emit('analysisComplete', analysis);

    return analysis;
  }

  async analyzeBottlenecks() {
    const bottlenecks = [];

    // Analyze function performance
    for (const [name, stats] of this.metrics.operations.functionCalls) {
      if (stats.avgDuration > this.config.performanceThresholds.responseTime) {
        bottlenecks.push({
          type: 'function',
          name,
          avgDuration: stats.avgDuration,
          impact: 'high',
        });
      }
    }

    // Analyze API performance
    for (const [endpoint, stats] of this.metrics.operations.apiCalls) {
      if (stats.avgDuration > this.config.performanceThresholds.responseTime * 2) {
        bottlenecks.push({
          type: 'api',
          endpoint,
          avgDuration: stats.avgDuration,
          impact: 'critical',
        });
      }
    }

    return bottlenecks;
  }

  async analyzeTrends() {
    const trends = {};

    // CPU trend
    trends.cpu = this.calculateTrend(this.metrics.system.cpuUsage);

    // Memory trend
    trends.memory = this.calculateTrend(
      this.metrics.system.memoryUsage.map(m => ({
        timestamp: m.timestamp,
        value: m.value.heapUsed,
      }))
    );

    // Response time trend
    trends.responseTime = this.calculateTrend(this.metrics.application.responseTime);

    // Error rate trend
    trends.errorRate = this.calculateTrend(this.metrics.application.errorRate);

    return trends;
  }

  calculateTrend(data) {
    if (data.length < 2) return 'stable';

    const recent = data.slice(-10);
    const older = data.slice(-20, -10);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.value, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.2) return 'increasing';
    if (change < -0.2) return 'decreasing';
    return 'stable';
  }

  async detectAnomalies() {
    const anomalies = [];

    // Check for CPU spikes
    const cpuData = this.metrics.system.cpuUsage.slice(-100);
    const cpuMean = cpuData.reduce((sum, d) => sum + d.value, 0) / cpuData.length;
    const cpuStdDev = Math.sqrt(
      cpuData.reduce((sum, d) => sum + Math.pow(d.value - cpuMean, 2), 0) / cpuData.length
    );

    for (const point of cpuData) {
      if (Math.abs(point.value - cpuMean) > 3 * cpuStdDev) {
        anomalies.push({
          type: 'cpu-spike',
          timestamp: point.timestamp,
          value: point.value,
          deviation: (point.value - cpuMean) / cpuStdDev,
        });
      }
    }

    return anomalies;
  }

  async identifyOptimizations() {
    const optimizations = [];

    // Check for caching opportunities
    for (const [name, stats] of this.metrics.operations.functionCalls) {
      if (stats.count > 100 && stats.avgDuration > 100) {
        optimizations.push({
          type: 'caching',
          target: name,
          reason: 'frequent-slow-calls',
          potentialGain: stats.avgDuration * 0.8, // 80% improvement with cache
        });
      }
    }

    // Check for batching opportunities
    for (const [endpoint, stats] of this.metrics.operations.apiCalls) {
      if (stats.count > 50) {
        optimizations.push({
          type: 'batching',
          target: endpoint,
          reason: 'frequent-api-calls',
          potentialGain: stats.count * 10, // ms saved by batching
        });
      }
    }

    return optimizations;
  }

  async generateRecommendations(analysis) {
    const recommendations = [];

    // Bottleneck recommendations
    for (const bottleneck of analysis.bottlenecks) {
      recommendations.push({
        priority: 'high',
        area: 'performance',
        issue: `${bottleneck.type} bottleneck: ${bottleneck.name}`,
        action: 'optimize',
        expectedImprovement: '30-50%',
      });
    }

    // Trend recommendations
    if (analysis.trends.memory === 'increasing') {
      recommendations.push({
        priority: 'critical',
        area: 'memory',
        issue: 'Memory usage increasing',
        action: 'investigate-memory-leak',
        expectedImprovement: 'prevent-crash',
      });
    }

    // Optimization recommendations
    for (const opt of analysis.optimizations) {
      recommendations.push({
        priority: 'medium',
        area: 'optimization',
        issue: `${opt.type} opportunity for ${opt.target}`,
        action: opt.type,
        expectedImprovement: `${opt.potentialGain}ms`,
      });
    }

    return recommendations;
  }

  /**
   * Storage and Reporting Methods (Part 4)
   */

  async loadHistoricalData() {
    try {
      // Load recent metrics
      const metricsDir = path.join(this.config.analyticsDir, 'metrics');
      const files = await fs.readdir(path.join(metricsDir, 'system'));

      for (const file of files.slice(-7)) {
        // Last 7 days
        if (file.endsWith('.json')) {
          await this.loadMetricsFile(path.join(metricsDir, 'system', file));
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async loadMetricsFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      const metrics = JSON.parse(data);

      // Merge with current metrics
      if (metrics.system) {
        Object.assign(this.metrics.system, metrics.system);
      }
    } catch (error) {
      console.warn(`Failed to load metrics: ${error.message}`);
    }
  }

  async establishBaselines() {
    // Calculate baseline performance
    const baseline = {
      avgCpuUsage: this.calculateAverage(this.metrics.system.cpuUsage),
      avgMemoryUsage: this.calculateAverage(
        this.metrics.system.memoryUsage.map(m => m.value?.heapUsed || 0)
      ),
      avgResponseTime: this.calculateAverage(this.metrics.application.responseTime),
      normalErrorRate: this.calculateAverage(this.metrics.application.errorRate),
    };

    this.baselines.set('system', baseline);
  }

  calculateAverage(data) {
    if (!Array.isArray(data) || data.length === 0) return 0;

    const values = data.map(d => (typeof d === 'object' ? d.value : d)).filter(v => v != null);
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  startMonitoring() {
    // Start sampling timer
    this.samplingTimer = setInterval(() => {
      this.sampleMetrics();
    }, this.config.samplingInterval);

    // Start analysis timer
    this.analysisTimer = setInterval(async () => {
      await this.performAnalysis();
    }, this.config.analysisInterval);
  }

  sampleMetrics() {
    // Sample current metrics
    const sample = {
      timestamp: Date.now(),
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      activeRequests: this.metrics.resources.activeConnections,
    };

    // Update stats
    this.updateStatistics(sample);
  }

  updateStatistics(sample) {
    // Update average CPU usage
    const cpuPercent = this.calculateCpuPercent(sample.cpu);
    this.stats.avgCpuUsage = this.stats.avgCpuUsage * 0.9 + cpuPercent * 0.1;

    // Update average memory usage
    this.stats.avgMemoryUsage = this.stats.avgMemoryUsage * 0.9 + sample.memory.heapUsed * 0.1;

    // Update average response time
    if (this.metrics.application.responseTime.length > 0) {
      const recent = this.metrics.application.responseTime.slice(-10);
      const avgRecent = recent.reduce((sum, r) => sum + r.value, 0) / recent.length;
      this.stats.avgResponseTime = this.stats.avgResponseTime * 0.9 + avgRecent * 0.1;
    }
  }

  async saveAnalysis(analysis) {
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(
      this.config.analyticsDir,
      'analysis',
      `${date}-${analysis.timestamp}.json`
    );

    await fs.writeFile(filePath, JSON.stringify(analysis, null, 2));
  }

  async saveMetrics() {
    const date = new Date().toISOString().split('T')[0];
    const systemFile = path.join(this.config.analyticsDir, 'metrics', 'system', `${date}.json`);

    await fs.writeFile(
      systemFile,
      JSON.stringify(
        {
          date,
          system: {
            cpuUsage: this.metrics.system.cpuUsage.slice(-1000),
            memoryUsage: this.metrics.system.memoryUsage.slice(-1000),
          },
          application: {
            responseTime: this.metrics.application.responseTime.slice(-1000),
            errorRate: this.metrics.application.errorRate.slice(-100),
          },
        },
        null,
        2
      )
    );
  }

  /**
   * Performance Profiling Methods
   */

  async createProfile(name) {
    const profile = {
      id: crypto.randomBytes(16).toString('hex'),
      name,
      timestamp: Date.now(),
      baseline: {
        cpu: process.cpuUsage(),
        memory: process.memoryUsage(),
      },
      snapshots: [],
    };

    this.profiles.set(profile.id, profile);
    return profile.id;
  }

  async takeSnapshot(profileId) {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    const snapshot = {
      timestamp: Date.now(),
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      metrics: {
        functionCalls: new Map(this.metrics.operations.functionCalls),
        apiCalls: new Map(this.metrics.operations.apiCalls),
      },
    };

    profile.snapshots.push(snapshot);
    return snapshot;
  }

  async compareProfiles(profileId1, profileId2) {
    const profile1 = this.profiles.get(profileId1);
    const profile2 = this.profiles.get(profileId2);

    if (!profile1 || !profile2) return null;

    const comparison = {
      cpuDiff: this.compareMetric(profile1, profile2, 'cpu'),
      memoryDiff: this.compareMetric(profile1, profile2, 'memory'),
      performanceDiff: this.comparePerformance(profile1, profile2),
    };

    return comparison;
  }

  compareMetric(profile1, profile2, metric) {
    const latest1 = profile1.snapshots[profile1.snapshots.length - 1];
    const latest2 = profile2.snapshots[profile2.snapshots.length - 1];

    if (!latest1 || !latest2) return 0;

    if (metric === 'cpu') {
      return latest2.cpu.user + latest2.cpu.system - (latest1.cpu.user + latest1.cpu.system);
    }

    if (metric === 'memory') {
      return latest2.memory.heapUsed - latest1.memory.heapUsed;
    }

    return 0;
  }

  comparePerformance(profile1, profile2) {
    // Compare function call performance
    const perf1 = this.calculateProfilePerformance(profile1);
    const perf2 = this.calculateProfilePerformance(profile2);

    return {
      improvement: ((perf1 - perf2) / perf1) * 100,
      profile1: perf1,
      profile2: perf2,
    };
  }

  calculateProfilePerformance(profile) {
    if (profile.snapshots.length === 0) return 0;

    const latest = profile.snapshots[profile.snapshots.length - 1];
    let totalTime = 0;
    let totalCalls = 0;

    for (const [name, stats] of latest.metrics.functionCalls) {
      totalTime += stats.totalDuration;
      totalCalls += stats.count;
    }

    return totalCalls > 0 ? totalTime / totalCalls : 0;
  }

  /**
   * Benchmark Methods
   */

  async runBenchmark(name, fn, iterations = 100) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      const startMem = process.memoryUsage();

      await fn();

      const end = Date.now();
      const endMem = process.memoryUsage();

      results.push({
        duration: end - start,
        memoryDelta: endMem.heapUsed - startMem.heapUsed,
      });
    }

    const benchmark = {
      name,
      iterations,
      results,
      stats: this.calculateBenchmarkStats(results),
      timestamp: Date.now(),
    };

    this.benchmarks.set(name, benchmark);

    return benchmark.stats;
  }

  calculateBenchmarkStats(results) {
    const durations = results.map(r => r.duration);
    const memories = results.map(r => r.memoryDelta);

    return {
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      medianDuration: this.calculateMedian(durations),
      avgMemory: memories.reduce((sum, m) => sum + m, 0) / memories.length,
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
    };
  }

  calculateMedian(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    return sorted[mid];
  }

  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * Report Generation
   */

  async generateReport() {
    const report = {
      timestamp: Date.now(),
      period: {
        start: Date.now() - this.config.analysisInterval,
        end: Date.now(),
      },
      summary: {
        avgCpuUsage: this.stats.avgCpuUsage,
        avgMemoryUsage: this.stats.avgMemoryUsage,
        avgResponseTime: this.stats.avgResponseTime,
        totalBottlenecks: this.stats.bottlenecksDetected,
        optimizationsIdentified: this.analysis.optimizations?.length || 0,
      },
      analysis: this.analysis,
      recommendations: this.analysis.recommendations || [],
      trends: this.analysis.trends || {},
      anomalies: this.analysis.anomalies || [],
    };

    // Save report
    const reportFile = path.join(this.config.analyticsDir, 'reports', `report-${Date.now()}.json`);

    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));

    return report;
  }

  /**
   * Get status and shutdown
   */

  getStatus() {
    return {
      initialized: this.isInitialized,
      monitoring: {
        cpu: !!this.monitors.cpu,
        memory: !!this.monitors.memory,
      },
      metrics: {
        systemMetrics: this.metrics.system.cpuUsage.length,
        applicationMetrics: this.metrics.application.responseTime.length,
        functionCalls: this.metrics.operations.functionCalls.size,
        apiCalls: this.metrics.operations.apiCalls.size,
      },
      analysis: {
        bottlenecks: this.analysis.bottlenecks?.length || 0,
        recommendations: this.analysis.recommendations?.length || 0,
      },
      stats: this.stats,
    };
  }

  async shutdown() {
    // Stop monitors
    if (this.monitors.cpu) clearInterval(this.monitors.cpu);
    if (this.monitors.memory) clearInterval(this.monitors.memory);
    if (this.samplingTimer) clearInterval(this.samplingTimer);
    if (this.analysisTimer) clearInterval(this.analysisTimer);

    // Save final metrics
    await this.saveMetrics();

    // Generate final report
    await this.generateReport();

    this.emit('shutdown');
    console.log('✅ Performance Analytics Engine shutdown complete');
  }
}

module.exports = PerformanceAnalyticsEngine;
