/**
 * Anomaly Detection System - v6.0
 * Identifies unusual patterns, behaviors, and outliers in system operations
 * Implements statistical analysis, pattern recognition, and ML-based detection
 *
 * Part 1: Core initialization and detection infrastructure
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

class AnomalyDetectionSystem extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      detectionDir: options.detectionDir || path.join(process.cwd(), 'vibe-data', 'anomalies'),
      sensitivity: options.sensitivity || 0.95, // 95% confidence threshold
      windowSize: options.windowSize || 100, // Data points for analysis
      checkInterval: options.checkInterval || 5000, // 5 seconds
      maxAnomalies: options.maxAnomalies || 1000,
      enableMachineLearning: options.enableMachineLearning !== false,
      autoQuarantine: options.autoQuarantine || false,
      alertThreshold: options.alertThreshold || 3,
    };

    // Detection models
    this.models = {
      statistical: this.createStatisticalModel(),
      pattern: this.createPatternModel(),
      behavioral: this.createBehavioralModel(),
      timeSeries: this.createTimeSeriesModel(),
      clustering: this.createClusteringModel(),
    };

    // Data tracking
    this.dataStreams = new Map();
    this.baselines = new Map();
    this.anomalies = [];
    this.patterns = new Map();

    // Statistical tracking
    this.statistics = {
      mean: new Map(),
      stdDev: new Map(),
      median: new Map(),
      quartiles: new Map(),
      outliers: new Map(),
    };

    // Machine learning features
    this.features = new Map();
    this.clusters = new Map();
    this.predictions = new Map();

    // Alert management
    this.alerts = new Map();
    this.quarantine = new Set();

    // Real-time monitoring
    this.monitors = new Map();
    this.thresholds = new Map();

    // Statistics
    this.stats = {
      totalDetections: 0,
      falsePositives: 0,
      truePositives: 0,
      dataPointsAnalyzed: 0,
      modelsUsed: new Map(),
      averageDetectionTime: 0,
      quarantinedItems: 0,
    };

    this.isInitialized = false;
    this.isMonitoring = false;
  }

  /**
   * Initialize anomaly detection system
   */
  async initialize() {
    try {
      console.log('🔍 Initializing Anomaly Detection System...');

      // Create directory structure
      await this.createDirectories();

      // Load baselines and patterns
      await this.loadBaselines();
      await this.loadPatterns();

      // Initialize models
      await this.initializeModels();

      // Load historical anomalies
      await this.loadAnomalies();

      // Start monitoring
      this.startMonitoring();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Anomaly Detection System initialized');
      console.log(`   - Detection models: ${Object.keys(this.models).length}`);
      console.log(`   - Sensitivity: ${this.config.sensitivity * 100}%`);
      console.log(`   - Window size: ${this.config.windowSize} data points`);
    } catch (error) {
      console.error('❌ Failed to initialize Anomaly Detection:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = [
      'detections',
      'baselines',
      'patterns',
      'models',
      'alerts',
      'quarantine',
      'reports',
      'features',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.detectionDir, dir), { recursive: true });
    }
  }

  /**
   * Detection models
   */
  createStatisticalModel() {
    return {
      name: 'statistical',
      type: 'z-score',
      detect: this.detectStatistical.bind(this),
      train: this.trainStatistical.bind(this),
      sensitivity: 3, // Standard deviations
    };
  }

  createPatternModel() {
    return {
      name: 'pattern',
      type: 'sequence-matching',
      detect: this.detectPattern.bind(this),
      train: this.trainPattern.bind(this),
      minSupport: 0.1,
    };
  }

  createBehavioralModel() {
    return {
      name: 'behavioral',
      type: 'deviation-detection',
      detect: this.detectBehavioral.bind(this),
      train: this.trainBehavioral.bind(this),
      threshold: 0.2,
    };
  }

  createTimeSeriesModel() {
    return {
      name: 'timeSeries',
      type: 'arima',
      detect: this.detectTimeSeries.bind(this),
      train: this.trainTimeSeries.bind(this),
      seasonality: 24, // hours
    };
  }

  createClusteringModel() {
    return {
      name: 'clustering',
      type: 'dbscan',
      detect: this.detectClustering.bind(this),
      train: this.trainClustering.bind(this),
      eps: 0.5,
      minPoints: 5,
    };
  }

  /**
   * Core detection methods
   */
  async detect(streamId, data, metadata = {}) {
    const detectionStart = performance.now();

    // Store data point
    if (!this.dataStreams.has(streamId)) {
      this.dataStreams.set(streamId, []);
    }
    const stream = this.dataStreams.get(streamId);
    stream.push({ data, timestamp: Date.now(), metadata });

    // Maintain window size
    if (stream.length > this.config.windowSize) {
      stream.shift();
    }

    // Run detection models
    const results = [];
    for (const [modelName, model] of Object.entries(this.models)) {
      try {
        const anomaly = await model.detect(streamId, data, stream);
        if (anomaly) {
          results.push({
            model: modelName,
            ...anomaly,
          });
        }
      } catch (error) {
        console.error(`Model ${modelName} failed:`, error);
      }
    }

    // Combine results
    const isAnomaly = results.length > 0;
    const confidence = this.calculateConfidence(results);

    if (isAnomaly && confidence >= this.config.sensitivity) {
      const anomaly = {
        id: crypto.randomBytes(8).toString('hex'),
        streamId,
        data,
        metadata,
        detections: results,
        confidence,
        timestamp: Date.now(),
        severity: this.calculateSeverity(results, confidence),
      };

      await this.handleAnomaly(anomaly);

      // Update stats
      this.stats.totalDetections++;
      const detectionTime = performance.now() - detectionStart;
      this.stats.averageDetectionTime = this.stats.averageDetectionTime * 0.9 + detectionTime * 0.1;
    }

    this.stats.dataPointsAnalyzed++;

    return { isAnomaly, confidence, results };
  }

  /**
   * Statistical anomaly detection
   */
  async detectStatistical(streamId, data, stream) {
    if (stream.length < 10) return null; // Need minimum data

    // Calculate statistics
    const values = stream.map(point => this.extractValue(point.data));
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values, mean);

    // Store statistics
    this.statistics.mean.set(streamId, mean);
    this.statistics.stdDev.set(streamId, stdDev);

    // Z-score test
    const value = this.extractValue(data);
    const zScore = Math.abs((value - mean) / stdDev);

    if (zScore > this.models.statistical.sensitivity) {
      return {
        type: 'statistical',
        metric: 'z-score',
        value: zScore,
        threshold: this.models.statistical.sensitivity,
        deviation: value - mean,
        confidence: Math.min(zScore / 5, 1), // Normalize to 0-1
      };
    }

    return null;
  }

  /**
   * Pattern-based anomaly detection
   */
  async detectPattern(streamId, data, stream) {
    if (stream.length < 5) return null;

    // Extract patterns
    const currentPattern = this.extractPattern(stream.slice(-5));
    const knownPatterns = this.patterns.get(streamId) || [];

    // Check if pattern is known
    const isKnown = knownPatterns.some(known => this.patternsMatch(known, currentPattern));

    if (!isKnown && knownPatterns.length > 10) {
      // Calculate pattern similarity
      const maxSimilarity = Math.max(
        ...knownPatterns.map(known => this.calculatePatternSimilarity(known, currentPattern))
      );

      if (maxSimilarity < 0.7) {
        // Less than 70% similar
        return {
          type: 'pattern',
          metric: 'sequence-deviation',
          pattern: currentPattern,
          similarity: maxSimilarity,
          confidence: 1 - maxSimilarity,
        };
      }
    }

    // Learn new pattern
    if (!isKnown) {
      knownPatterns.push(currentPattern);
      this.patterns.set(streamId, knownPatterns);
    }

    return null;
  }

  /**
   * Behavioral anomaly detection
   */
  async detectBehavioral(streamId, data, stream) {
    const baseline = this.baselines.get(streamId);
    if (!baseline) return null;

    // Extract behavioral features
    const features = this.extractFeatures(data);
    const baselineFeatures = baseline.features;

    // Calculate deviation
    const deviation = this.calculateFeatureDeviation(features, baselineFeatures);

    if (deviation > this.models.behavioral.threshold) {
      return {
        type: 'behavioral',
        metric: 'feature-deviation',
        deviation,
        threshold: this.models.behavioral.threshold,
        features: Object.keys(features).filter(
          key => Math.abs(features[key] - baselineFeatures[key]) > 0.1
        ),
        confidence: Math.min(deviation / 0.5, 1),
      };
    }

    // Update baseline gradually
    this.updateBaseline(streamId, features);

    return null;
  }

  /**
   * Time series anomaly detection
   */
  async detectTimeSeries(streamId, data, stream) {
    if (stream.length < 24) return null; // Need at least one day of hourly data

    // Extract time series
    const timeSeries = stream.map(point => ({
      time: point.timestamp,
      value: this.extractValue(point.data),
    }));

    // Simple moving average prediction
    const windowSize = 12;
    const recentValues = timeSeries.slice(-windowSize).map(p => p.value);
    const predicted = this.calculateMean(recentValues);
    const actual = this.extractValue(data);

    // Calculate prediction error
    const error = Math.abs(actual - predicted);
    const avgValue = Math.abs(predicted);
    const relativeError = avgValue > 0 ? error / avgValue : error;

    if (relativeError > 0.5) {
      // 50% deviation
      return {
        type: 'timeSeries',
        metric: 'prediction-error',
        predicted,
        actual,
        error,
        relativeError,
        confidence: Math.min(relativeError, 1),
      };
    }

    return null;
  }

  /**
   * Clustering-based anomaly detection
   */
  async detectClustering(streamId, data, stream) {
    if (stream.length < 20) return null;

    // Extract feature vectors
    const vectors = stream.map(point => this.extractFeatureVector(point.data));
    const currentVector = this.extractFeatureVector(data);

    // Find nearest cluster
    const clusters = this.clusters.get(streamId) || [];
    if (clusters.length === 0) {
      // Initialize clusters
      const newClusters = this.performClustering(vectors);
      this.clusters.set(streamId, newClusters);
      return null;
    }

    // Calculate distance to nearest cluster
    const minDistance = Math.min(
      ...clusters.map(cluster => this.calculateVectorDistance(currentVector, cluster.centroid))
    );

    if (minDistance > this.models.clustering.eps) {
      return {
        type: 'clustering',
        metric: 'outlier',
        distance: minDistance,
        threshold: this.models.clustering.eps,
        confidence: Math.min(minDistance / (this.models.clustering.eps * 2), 1),
      };
    }

    return null;
  }

  /**
   * Helper methods
   */

  extractValue(data) {
    if (typeof data === 'number') return data;
    if (typeof data === 'object' && data.value !== undefined) return data.value;
    if (typeof data === 'string') return data.length;
    return 0;
  }

  extractPattern(dataPoints) {
    return dataPoints
      .map(point => {
        const value = this.extractValue(point.data);
        return value > 0 ? '+' : value < 0 ? '-' : '0';
      })
      .join('');
  }

  extractFeatures(data) {
    const features = {};

    if (typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'number') {
          features[key] = value;
        }
      }
    }

    features.size = JSON.stringify(data).length;
    features.complexity = Object.keys(data).length;
    features.timestamp = Date.now();

    return features;
  }

  extractFeatureVector(data) {
    const features = this.extractFeatures(data);
    return Object.values(features);
  }

  calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateStdDev(values, mean) {
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = this.calculateMean(squaredDiffs);
    return Math.sqrt(avgSquaredDiff);
  }

  calculateConfidence(results) {
    if (results.length === 0) return 0;

    const weights = {
      statistical: 0.3,
      pattern: 0.2,
      behavioral: 0.2,
      timeSeries: 0.15,
      clustering: 0.15,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    for (const result of results) {
      const weight = weights[result.model] || 0.1;
      weightedSum += result.confidence * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  calculateSeverity(results, confidence) {
    const score = confidence * results.length;

    if (score > 3) return 'critical';
    if (score > 2) return 'high';
    if (score > 1) return 'medium';
    return 'low';
  }

  patternsMatch(pattern1, pattern2) {
    return pattern1 === pattern2;
  }

  calculatePatternSimilarity(pattern1, pattern2) {
    if (pattern1.length !== pattern2.length) return 0;

    let matches = 0;
    for (let i = 0; i < pattern1.length; i++) {
      if (pattern1[i] === pattern2[i]) matches++;
    }

    return matches / pattern1.length;
  }

  calculateFeatureDeviation(features1, features2) {
    const keys = new Set([...Object.keys(features1), ...Object.keys(features2)]);
    let totalDeviation = 0;

    for (const key of keys) {
      const val1 = features1[key] || 0;
      const val2 = features2[key] || 0;
      totalDeviation += Math.abs(val1 - val2) / Math.max(Math.abs(val2), 1);
    }

    return totalDeviation / keys.size;
  }

  calculateVectorDistance(vector1, vector2) {
    let sum = 0;
    for (let i = 0; i < vector1.length; i++) {
      sum += Math.pow((vector1[i] || 0) - (vector2[i] || 0), 2);
    }
    return Math.sqrt(sum);
  }

  performClustering(vectors) {
    const k = Math.min(3, Math.floor(vectors.length / 5));
    const clusters = [];

    for (let i = 0; i < k; i++) {
      clusters.push({
        id: i,
        centroid: vectors[Math.floor(Math.random() * vectors.length)],
        points: [],
      });
    }

    for (const vector of vectors) {
      let minDist = Infinity;
      let bestCluster = null;

      for (const cluster of clusters) {
        const dist = this.calculateVectorDistance(vector, cluster.centroid);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = cluster;
        }
      }

      if (bestCluster) {
        bestCluster.points.push(vector);
      }
    }

    for (const cluster of clusters) {
      if (cluster.points.length > 0) {
        const newCentroid = [];
        for (let i = 0; i < cluster.points[0].length; i++) {
          const values = cluster.points.map(p => p[i]);
          newCentroid.push(this.calculateMean(values));
        }
        cluster.centroid = newCentroid;
      }
    }

    return clusters;
  }

  updateBaseline(streamId, newFeatures) {
    const baseline = this.baselines.get(streamId);
    if (!baseline) return;

    const alpha = 0.01;

    for (const [key, value] of Object.entries(newFeatures)) {
      if (baseline.features[key] !== undefined) {
        baseline.features[key] = baseline.features[key] * (1 - alpha) + value * alpha;
      }
    }
  }

  async handleAnomaly(anomaly) {
    this.anomalies.push(anomaly);

    if (this.anomalies.length > this.config.maxAnomalies) {
      this.anomalies.shift();
    }

    await this.saveAnomaly(anomaly);

    if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
      await this.createAlert(anomaly);
    }

    if (this.config.autoQuarantine && anomaly.severity === 'critical') {
      await this.quarantineItem(anomaly);
    }

    this.emit('anomalyDetected', anomaly);
  }

  async createAlert(anomaly) {
    const alert = {
      id: crypto.randomBytes(8).toString('hex'),
      anomalyId: anomaly.id,
      severity: anomaly.severity,
      message: `Anomaly detected in ${anomaly.streamId}`,
      timestamp: Date.now(),
      acknowledged: false,
    };

    this.alerts.set(alert.id, alert);
    this.emit('alertCreated', alert);
  }

  async quarantineItem(anomaly) {
    const quarantineEntry = {
      id: crypto.randomBytes(8).toString('hex'),
      anomalyId: anomaly.id,
      streamId: anomaly.streamId,
      data: anomaly.data,
      reason: `Severity: ${anomaly.severity}`,
      timestamp: Date.now(),
    };

    this.quarantine.add(quarantineEntry);
    this.stats.quarantinedItems++;

    await this.saveQuarantine(quarantineEntry);
    this.emit('itemQuarantined', quarantineEntry);
  }

  async saveAnomaly(anomaly) {
    const filepath = path.join(this.config.detectionDir, 'detections', `${anomaly.id}.json`);

    await fs.writeFile(filepath, JSON.stringify(anomaly, null, 2));
  }

  async saveQuarantine(entry) {
    const filepath = path.join(this.config.detectionDir, 'quarantine', `${entry.id}.json`);

    await fs.writeFile(filepath, JSON.stringify(entry, null, 2));
  }

  async loadBaselines() {
    try {
      const baselinesPath = path.join(this.config.detectionDir, 'baselines');
      const files = await fs.readdir(baselinesPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(baselinesPath, file), 'utf8');
          const baseline = JSON.parse(content);
          this.baselines.set(baseline.streamId, baseline);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async loadPatterns() {
    try {
      const patternsPath = path.join(this.config.detectionDir, 'patterns');
      const files = await fs.readdir(patternsPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(patternsPath, file), 'utf8');
          const { streamId, patterns } = JSON.parse(content);
          this.patterns.set(streamId, patterns);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async loadAnomalies() {
    try {
      const detectionsPath = path.join(this.config.detectionDir, 'detections');
      const files = await fs.readdir(detectionsPath);

      const anomalies = [];
      for (const file of files.slice(-100)) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(detectionsPath, file), 'utf8');
          anomalies.push(JSON.parse(content));
        }
      }

      this.anomalies = anomalies;
    } catch (error) {
      // Directory might not exist
    }
  }

  async initializeModels() {
    if (this.config.enableMachineLearning) {
      console.log('🤖 Initializing ML models...');
    }
  }

  startMonitoring() {
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCheck();
    }, this.config.checkInterval);
  }

  async performMonitoringCheck() {
    for (const [streamId, monitor] of this.monitors) {
      if (monitor.active) {
        const data = await monitor.getData();
        await this.detect(streamId, data, monitor.metadata);
      }
    }
  }

  async addMonitor(streamId, getData, metadata = {}) {
    const monitor = {
      id: streamId,
      getData,
      metadata,
      active: true,
      created: Date.now(),
    };

    this.monitors.set(streamId, monitor);
    return streamId;
  }

  removeMonitor(streamId) {
    return this.monitors.delete(streamId);
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      monitoring: this.isMonitoring,
      models: Object.keys(this.models),
      streams: {
        active: this.dataStreams.size,
        monitored: this.monitors.size,
      },
      detection: {
        totalAnomalies: this.anomalies.length,
        recentAlerts: this.alerts.size,
        quarantined: this.quarantine.size,
      },
      baselines: this.baselines.size,
      patterns: this.patterns.size,
      statistics: this.stats,
    };
  }

  async shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    for (const [streamId, baseline] of this.baselines) {
      const filepath = path.join(this.config.detectionDir, 'baselines', `${streamId}.json`);
      await fs.writeFile(
        filepath,
        JSON.stringify(
          {
            streamId,
            ...baseline,
          },
          null,
          2
        )
      );
    }

    for (const [streamId, patterns] of this.patterns) {
      const filepath = path.join(this.config.detectionDir, 'patterns', `${streamId}.json`);
      await fs.writeFile(
        filepath,
        JSON.stringify(
          {
            streamId,
            patterns,
          },
          null,
          2
        )
      );
    }

    const statsPath = path.join(this.config.detectionDir, 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));

    this.emit('shutdown');
    console.log('✅ Anomaly Detection System shutdown complete');
    console.log(`   Total detections: ${this.stats.totalDetections}`);
    console.log(`   Data points analyzed: ${this.stats.dataPointsAnalyzed}`);
  }
}

module.exports = AnomalyDetectionSystem;
