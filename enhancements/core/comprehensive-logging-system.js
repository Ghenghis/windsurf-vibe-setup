/**
 * Comprehensive Logging System - v6.0
 * Logs everything with microsecond precision
 * Tracks every learning event, decision, and improvement
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

class ComprehensiveLoggingSystem extends EventEmitter {
  constructor(options = {}) {
    super();

    this.logsDir = options.logsDir || path.join(process.cwd(), 'vibe-data', 'logs');
    this.projectStartTime = Date.now();
    this.sessionId = crypto.randomBytes(16).toString('hex');
    this.currentProject = options.projectId || 'default';

    // Log buffers for batching
    this.logBuffers = {
      detailed: [],
      learning: [],
      errors: [],
      success: [],
      research: [],
      decisions: [],
      improvements: [],
      performance: [],
    };

    // Configuration
    this.config = {
      flushInterval: options.flushInterval || 5000, // 5 seconds
      maxBufferSize: options.maxBufferSize || 1000,
      logRotationSize: options.logRotationSize || 100 * 1024 * 1024, // 100MB
      compressionEnabled: options.compressionEnabled !== false,
      detailLevel: options.detailLevel || 'extreme', // minimal, normal, detailed, extreme
    };

    // Statistics tracking
    this.stats = {
      totalLogs: 0,
      logsByType: {},
      errorsLogged: 0,
      successesLogged: 0,
      learningEventsLogged: 0,
      decisionsLogged: 0,
      improvementsLogged: 0,
      researchEventsLogged: 0,
      startTime: Date.now(),
      sessionStart: Date.now(),
    };

    // Performance tracking
    this.performanceMetrics = new Map();

    this.isInitialized = false;
    this.flushTimer = null;
  }

  /**
   * Initialize logging system
   */
  async initialize() {
    try {
      // Create directory structure
      await this.createDirectoryStructure();

      // Log session start
      await this.logSessionStart();

      // Start flush timer
      this.startFlushTimer();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('📊 Comprehensive Logging System initialized');
      console.log(`   - Session ID: ${this.sessionId}`);
      console.log(`   - Project: ${this.currentProject}`);
      console.log(`   - Detail level: ${this.config.detailLevel}`);
    } catch (error) {
      console.error('❌ Failed to initialize Logging System:', error);
      throw error;
    }
  }

  /**
   * Create directory structure
   */
  async createDirectoryStructure() {
    const dirs = [
      this.logsDir,
      path.join(this.logsDir, 'detailed'),
      path.join(this.logsDir, 'learning'),
      path.join(this.logsDir, 'errors'),
      path.join(this.logsDir, 'success'),
      path.join(this.logsDir, 'research'),
      path.join(this.logsDir, 'decisions'),
      path.join(this.logsDir, 'improvements'),
      path.join(this.logsDir, 'performance'),
      path.join(this.logsDir, 'sessions'),
      path.join(this.logsDir, 'analytics'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Log with microsecond precision
   */
  async log(type, data) {
    const logEntry = this.createLogEntry(type, data);

    // Add to appropriate buffer
    if (this.logBuffers[type]) {
      this.logBuffers[type].push(logEntry);
    } else {
      this.logBuffers.detailed.push(logEntry);
    }

    // Always add to detailed log
    if (type !== 'detailed') {
      this.logBuffers.detailed.push(logEntry);
    }

    // Update statistics
    this.updateStats(type);

    // Check if we need to flush
    if (this.shouldFlush(type)) {
      await this.flush(type);
    }

    // Emit for real-time monitoring
    this.emit('logged', logEntry);

    return logEntry;
  }

  /**
   * Create log entry with extreme detail
   */
  createLogEntry(type, data) {
    const now = Date.now();
    const hrtime = process.hrtime.bigint();
    const microseconds = Number(hrtime / 1000n);

    const entry = {
      // Timing
      timestamp: new Date().toISOString(),
      milliseconds: now,
      microseconds: microseconds,
      nanoseconds: Number(hrtime),

      // Session info
      sessionId: this.sessionId,
      projectId: this.currentProject,
      projectRuntime: now - this.projectStartTime,
      sessionRuntime: now - this.stats.sessionStart,

      // Log info
      id: crypto.randomBytes(16).toString('hex'),
      type: type,
      level: data.level || 'info',

      // Core data
      action: data.action || {},
      context: data.context || {},
      performance: data.performance || {},
      learning: data.learning || {},
      research: data.research || {},
      outcome: data.outcome || {},

      // System state
      systemState: this.captureSystemState(),

      // Stack trace for errors
      stack: data.error ? this.captureStackTrace(data.error) : null,
    };

    // Add detail based on level
    if (this.config.detailLevel === 'extreme') {
      entry.memory = this.captureMemoryUsage();
      entry.cpu = this.captureCPUUsage();
      entry.activeAgents = this.getActiveAgents();
    }

    return entry;
  }

  /**
   * Log learning event with full context
   */
  async logLearning(event) {
    const learningLog = {
      action: {
        type: 'learning',
        name: event.type,
        category: 'knowledge-acquisition',
      },
      learning: {
        learned: true,
        pattern: event.pattern,
        improvement: event.improvement,
        preventedErrors: event.preventedErrors || [],
        knowledgeAdded: event.knowledge,
        confidence: event.confidence,
        source: event.source,
      },
      context: event.context,
      outcome: {
        success: true,
        result: event.result,
        impact: event.impact,
      },
    };

    this.stats.learningEventsLogged++;

    return await this.log('learning', learningLog);
  }

  /**
   * Log error with full detail
   */
  async logError(error, context) {
    const errorLog = {
      level: 'error',
      action: {
        type: 'error',
        name: error.name || 'UnknownError',
        category: 'error-occurrence',
      },
      error: {
        message: error.message,
        code: error.code,
        type: error.constructor.name,
      },
      context: context,
      learning: {
        learned: false,
        willPrevent: true,
        pattern: this.extractErrorPattern(error),
      },
      performance: {
        timestamp: Date.now(),
        impactLevel: this.assessErrorImpact(error),
      },
    };

    this.stats.errorsLogged++;

    return await this.log('errors', errorLog);
  }

  /**
   * Log success with metrics
   */
  async logSuccess(task, result) {
    const successLog = {
      action: {
        type: 'success',
        name: task.name || 'task-completion',
        category: task.category || 'execution',
      },
      context: {
        task: task,
        startTime: task.startTime,
        endTime: Date.now(),
      },
      performance: {
        duration: Date.now() - (task.startTime || Date.now()),
        efficiency: this.calculateEfficiency(task, result),
      },
      outcome: {
        success: true,
        result: result,
        quality: this.assessQuality(result),
      },
    };

    this.stats.successesLogged++;

    return await this.log('success', successLog);
  }

  /**
   * Log research event
   */
  async logResearch(query, findings) {
    const researchLog = {
      action: {
        type: 'research',
        name: 'auto-research',
        category: 'knowledge-gathering',
      },
      research: {
        performed: true,
        query: query,
        sources: findings.sources,
        findingsCount: findings.findings?.length || 0,
        confidence: findings.confidence,
        duration: findings.duration,
        fromCache: findings.fromCache || false,
      },
      learning: {
        learned: true,
        knowledgeAdded: findings.synthesis,
      },
      outcome: {
        success: findings.confidence > 0.5,
        prevented: 'guessing',
        confidence: findings.confidence,
      },
    };

    this.stats.researchEventsLogged++;

    return await this.log('research', researchLog);
  }

  /**
   * Log decision with reasoning
   */
  async logDecision(decision) {
    const decisionLog = {
      action: {
        type: 'decision',
        name: decision.type,
        category: 'decision-making',
      },
      context: {
        beforeState: decision.beforeState,
        afterState: decision.afterState,
        changes: decision.changes,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
        alternatives: decision.alternatives,
      },
      performance: {
        decisionTime: decision.duration,
        complexity: decision.complexity,
      },
      outcome: {
        chosen: decision.chosen,
        impact: decision.impact,
      },
    };

    this.stats.decisionsLogged++;

    return await this.log('decisions', decisionLog);
  }

  /**
   * Log improvement
   */
  async logImprovement(improvement) {
    const improvementLog = {
      action: {
        type: 'improvement',
        name: improvement.type,
        category: 'optimization',
      },
      context: {
        before: improvement.before,
        after: improvement.after,
        metric: improvement.metric,
      },
      performance: {
        improvement: improvement.percentage,
        absolute: improvement.absolute,
      },
      learning: {
        learned: true,
        pattern: improvement.pattern,
        reusable: true,
      },
    };

    this.stats.improvementsLogged++;

    return await this.log('improvements', improvementLog);
  }

  /**
   * Log performance metrics
   */
  async logPerformance(operation, metrics) {
    const perfLog = {
      action: {
        type: 'performance',
        name: operation,
        category: 'metrics',
      },
      performance: {
        startTime: metrics.startTime,
        endTime: metrics.endTime,
        duration: metrics.duration,
        cpuUsage: metrics.cpu,
        memoryUsage: metrics.memory,
        throughput: metrics.throughput,
        latency: metrics.latency,
      },
      context: metrics.context,
    };

    // Track in performance metrics
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }

    this.performanceMetrics.get(operation).push(metrics);

    return await this.log('performance', perfLog);
  }

  /**
   * Log session start
   */
  async logSessionStart() {
    const sessionLog = {
      action: {
        type: 'session',
        name: 'session-start',
        category: 'lifecycle',
      },
      context: {
        sessionId: this.sessionId,
        projectId: this.currentProject,
        startTime: this.stats.sessionStart,
        environment: process.env.NODE_ENV || 'development',
        platform: process.platform,
        nodeVersion: process.version,
      },
    };

    const filePath = path.join(this.logsDir, 'sessions', `${this.sessionId}.json`);

    await fs.writeFile(filePath, JSON.stringify(sessionLog, null, 2));
  }

  /**
   * Capture system state
   */
  captureSystemState() {
    return {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      activeRequests: process._getActiveRequests?.()?.length || 0,
      activeHandles: process._getActiveHandles?.()?.length || 0,
    };
  }

  /**
   * Capture memory usage
   */
  captureMemoryUsage() {
    const mem = process.memoryUsage();

    return {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
    };
  }

  /**
   * Capture CPU usage
   */
  captureCPUUsage() {
    const usage = process.cpuUsage();

    return {
      user: usage.user,
      system: usage.system,
      percent: (usage.user + usage.system) / 1000000, // Convert to seconds
    };
  }

  /**
   * Get active agents (mock)
   */
  getActiveAgents() {
    // This would connect to actual agent system
    return {
      total: 120,
      active: Math.floor(Math.random() * 120),
      idle: Math.floor(Math.random() * 20),
    };
  }

  /**
   * Capture stack trace
   */
  captureStackTrace(error) {
    return {
      stack: error.stack,
      frames: error.stack
        ?.split('\n')
        .slice(1)
        .map(line => {
          const match = line.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/);
          if (match) {
            return {
              function: match[1],
              file: match[2],
              line: parseInt(match[3]),
              column: parseInt(match[4]),
            };
          }
          return { raw: line.trim() };
        }),
    };
  }

  /**
   * Extract error pattern
   */
  extractErrorPattern(error) {
    return {
      type: error.constructor.name,
      message: error.message,
      code: error.code,
      hash: crypto
        .createHash('sha256')
        .update(`${error.constructor.name}-${error.message}`)
        .digest('hex')
        .substring(0, 16),
    };
  }

  /**
   * Assess error impact
   */
  assessErrorImpact(error) {
    if (error.fatal) return 'critical';
    if (error.code === 'ECONNREFUSED') return 'high';
    if (error.code === 'ENOENT') return 'medium';
    return 'low';
  }

  /**
   * Calculate efficiency
   */
  calculateEfficiency(task, result) {
    const expectedDuration = task.expectedDuration || 1000;
    const actualDuration = Date.now() - (task.startTime || Date.now());

    return Math.min(expectedDuration / actualDuration, 2.0);
  }

  /**
   * Assess quality
   */
  assessQuality(result) {
    // Simple quality assessment
    if (result.errors && result.errors.length > 0) return 'poor';
    if (result.warnings && result.warnings.length > 0) return 'fair';
    if (result.optimized) return 'excellent';
    return 'good';
  }

  /**
   * Should flush buffer
   */
  shouldFlush(type) {
    const buffer = this.logBuffers[type] || this.logBuffers.detailed;
    return buffer.length >= this.config.maxBufferSize;
  }

  /**
   * Flush logs to disk
   */
  async flush(type) {
    const types = type ? [type] : Object.keys(this.logBuffers);

    for (const logType of types) {
      const buffer = this.logBuffers[logType];

      if (buffer.length === 0) continue;

      // Get file path
      const date = new Date().toISOString().split('T')[0];
      const filePath = path.join(this.logsDir, logType, `${date}.jsonl`);

      // Prepare data
      const data = buffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';

      // Write to file
      await fs.appendFile(filePath, data);

      // Clear buffer
      this.logBuffers[logType] = [];
    }
  }

  /**
   * Flush all buffers
   */
  async flushAll() {
    await this.flush();
  }

  /**
   * Start flush timer
   */
  startFlushTimer() {
    this.flushTimer = setInterval(async () => {
      await this.flushAll();
    }, this.config.flushInterval);
  }

  /**
   * Update statistics
   */
  updateStats(type) {
    this.stats.totalLogs++;

    if (!this.stats.logsByType[type]) {
      this.stats.logsByType[type] = 0;
    }

    this.stats.logsByType[type]++;
  }

  /**
   * Generate analytics report
   */
  async generateAnalytics() {
    const report = {
      sessionId: this.sessionId,
      projectId: this.currentProject,
      duration: Date.now() - this.stats.startTime,
      stats: this.stats,
      performance: {},
      learning: {
        eventsLogged: this.stats.learningEventsLogged,
        improvementsLogged: this.stats.improvementsLogged,
        errorsLogged: this.stats.errorsLogged,
        errorsPrevented: 0, // Would calculate from logs
      },
      research: {
        eventsLogged: this.stats.researchEventsLogged,
        queriesAnswered: 0, // Would calculate
      },
    };

    // Calculate performance metrics
    for (const [op, metrics] of this.performanceMetrics) {
      const durations = metrics.map(m => m.duration);
      report.performance[op] = {
        count: metrics.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
      };
    }

    // Save report
    const reportPath = path.join(this.logsDir, 'analytics', `report-${Date.now()}.json`);

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  /**
   * Query logs
   */
  async queryLogs(criteria) {
    const results = [];

    // This would implement sophisticated log querying
    // For now, return recent logs

    for (const buffer of Object.values(this.logBuffers)) {
      results.push(
        ...buffer.filter(log => {
          if (criteria.type && log.type !== criteria.type) return false;
          if (criteria.level && log.level !== criteria.level) return false;
          if (criteria.after && log.milliseconds < criteria.after) return false;
          if (criteria.before && log.milliseconds > criteria.before) return false;
          return true;
        })
      );
    }

    return results;
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      sessionId: this.sessionId,
      projectId: this.currentProject,
      stats: this.stats,
      bufferSizes: Object.fromEntries(
        Object.entries(this.logBuffers).map(([k, v]) => [k, v.length])
      ),
      performanceMetrics: this.performanceMetrics.size,
      uptime: Date.now() - this.stats.startTime,
    };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    // Stop flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Flush all remaining logs
    await this.flushAll();

    // Generate final analytics
    await this.generateAnalytics();

    // Log session end
    await this.log('detailed', {
      action: {
        type: 'session',
        name: 'session-end',
        category: 'lifecycle',
      },
      context: {
        duration: Date.now() - this.stats.sessionStart,
        totalLogs: this.stats.totalLogs,
      },
    });

    await this.flushAll();

    this.emit('shutdown');
    console.log('✅ Comprehensive Logging System shutdown complete');
  }
}

module.exports = ComprehensiveLoggingSystem;
