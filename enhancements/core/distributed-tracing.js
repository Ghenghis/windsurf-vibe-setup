/**
 * Distributed Tracing System - v6.0
 * Tracks operations across distributed components with trace spans and correlation
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

class DistributedTracing extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      traceDir: options.traceDir || path.join(process.cwd(), 'vibe-data', 'traces'),
      maxTraceAge: options.maxTraceAge || 86400000, // 24 hours
      samplingRate: options.samplingRate || 1.0,
      maxSpansPerTrace: options.maxSpansPerTrace || 1000,
    };

    // Active traces and spans
    this.activeTraces = new Map();
    this.activeSpans = new Map();
    this.completedTraces = [];

    // Trace context propagation
    this.traceContext = new Map();
    this.correlationIds = new Map();

    // Performance metrics
    this.spanMetrics = new Map();
    this.traceMetrics = new Map();

    // Statistics
    this.stats = {
      totalTraces: 0,
      activeTraces: 0,
      completedTraces: 0,
      totalSpans: 0,
      droppedSpans: 0,
      averageDuration: 0,
    };

    this.isInitialized = false;
  }

  async initialize() {
    console.log('📊 Initializing Distributed Tracing...');

    await fs.mkdir(this.config.traceDir, { recursive: true });
    await fs.mkdir(path.join(this.config.traceDir, 'traces'), { recursive: true });
    await fs.mkdir(path.join(this.config.traceDir, 'spans'), { recursive: true });

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldTraces();
    }, 3600000); // Every hour

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ Distributed Tracing initialized');
  }

  /**
   * Start a new trace
   */
  startTrace(name, metadata = {}) {
    // Check sampling
    if (Math.random() > this.config.samplingRate) {
      return null;
    }

    const traceId = crypto.randomBytes(16).toString('hex');
    const trace = {
      traceId,
      name,
      metadata,
      startTime: performance.now(),
      timestamp: Date.now(),
      spans: [],
      status: 'active',
      correlationId: metadata.correlationId || traceId,
    };

    this.activeTraces.set(traceId, trace);
    this.correlationIds.set(trace.correlationId, traceId);

    this.stats.totalTraces++;
    this.stats.activeTraces++;

    this.emit('traceStarted', trace);

    return traceId;
  }

  /**
   * Start a span within a trace
   */
  startSpan(traceId, name, parentSpanId = null) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;

    const spanId = crypto.randomBytes(8).toString('hex');
    const span = {
      spanId,
      traceId,
      parentSpanId,
      name,
      startTime: performance.now(),
      timestamp: Date.now(),
      tags: {},
      logs: [],
      status: 'active',
    };

    trace.spans.push(span);
    this.activeSpans.set(spanId, span);

    // Check span limit
    if (trace.spans.length > this.config.maxSpansPerTrace) {
      this.stats.droppedSpans++;
      trace.spans.shift();
    }

    this.stats.totalSpans++;

    return spanId;
  }

  /**
   * End a span
   */
  endSpan(spanId, status = 'ok', error = null) {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    if (error) {
      span.error = {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
      };
    }

    this.activeSpans.delete(spanId);

    // Update metrics
    this.updateSpanMetrics(span);

    return span;
  }

  /**
   * End a trace
   */
  endTrace(traceId, status = 'ok') {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return;

    trace.endTime = performance.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = status;

    // End any remaining active spans
    trace.spans.forEach(span => {
      if (span.status === 'active') {
        this.endSpan(span.spanId, 'forced-close');
      }
    });

    this.activeTraces.delete(traceId);
    this.completedTraces.push(trace);

    // Limit completed traces
    if (this.completedTraces.length > 1000) {
      this.completedTraces.shift();
    }

    this.stats.activeTraces--;
    this.stats.completedTraces++;

    // Update metrics
    this.updateTraceMetrics(trace);

    // Save trace
    this.saveTrace(trace);

    this.emit('traceCompleted', trace);

    return trace;
  }

  /**
   * Add tags to a span
   */
  addSpanTags(spanId, tags) {
    const span = this.activeSpans.get(spanId);
    if (span) {
      Object.assign(span.tags, tags);
    }
  }

  /**
   * Add log to a span
   */
  addSpanLog(spanId, message, level = 'info') {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        level,
        message,
      });
    }
  }

  /**
   * Get trace context for propagation
   */
  getTraceContext(traceId) {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;

    return {
      traceId: trace.traceId,
      correlationId: trace.correlationId,
      baggage: trace.metadata,
    };
  }

  /**
   * Inject trace context into headers
   */
  injectContext(traceId, headers = {}) {
    const context = this.getTraceContext(traceId);
    if (!context) return headers;

    headers['X-Trace-Id'] = context.traceId;
    headers['X-Correlation-Id'] = context.correlationId;

    if (context.baggage) {
      headers['X-Trace-Baggage'] = JSON.stringify(context.baggage);
    }

    return headers;
  }

  /**
   * Extract trace context from headers
   */
  extractContext(headers) {
    const traceId = headers['X-Trace-Id'] || headers['x-trace-id'];
    const correlationId = headers['X-Correlation-Id'] || headers['x-correlation-id'];
    const baggage = headers['X-Trace-Baggage'] || headers['x-trace-baggage'];

    if (!traceId) return null;

    return {
      traceId,
      correlationId: correlationId || traceId,
      baggage: baggage ? JSON.parse(baggage) : {},
    };
  }

  /**
   * Continue trace from context
   */
  continueTrace(context, name) {
    if (!context || !context.traceId) {
      return this.startTrace(name);
    }

    // Check if trace exists
    if (!this.activeTraces.has(context.traceId)) {
      // Create continuation trace
      const trace = {
        traceId: context.traceId,
        name: `[Continued] ${name}`,
        metadata: context.baggage || {},
        startTime: performance.now(),
        timestamp: Date.now(),
        spans: [],
        status: 'active',
        correlationId: context.correlationId,
        continued: true,
      };

      this.activeTraces.set(context.traceId, trace);
      this.correlationIds.set(trace.correlationId, context.traceId);
    }

    return context.traceId;
  }

  /**
   * Find traces by correlation ID
   */
  findByCorrelationId(correlationId) {
    const traceId = this.correlationIds.get(correlationId);
    if (!traceId) return null;

    return this.activeTraces.get(traceId) || this.completedTraces.find(t => t.traceId === traceId);
  }

  /**
   * Get trace timeline
   */
  getTraceTimeline(traceId) {
    const trace =
      this.activeTraces.get(traceId) || this.completedTraces.find(t => t.traceId === traceId);

    if (!trace) return null;

    // Build timeline
    const events = [];

    // Add trace start
    events.push({
      time: 0,
      type: 'trace-start',
      name: trace.name,
    });

    // Add span events
    trace.spans.forEach(span => {
      events.push({
        time: span.startTime - trace.startTime,
        type: 'span-start',
        name: span.name,
        spanId: span.spanId,
      });

      if (span.endTime) {
        events.push({
          time: span.endTime - trace.startTime,
          type: 'span-end',
          name: span.name,
          spanId: span.spanId,
          duration: span.duration,
        });
      }
    });

    // Add trace end
    if (trace.endTime) {
      events.push({
        time: trace.endTime - trace.startTime,
        type: 'trace-end',
        name: trace.name,
        duration: trace.duration,
      });
    }

    // Sort by time
    events.sort((a, b) => a.time - b.time);

    return {
      traceId: trace.traceId,
      name: trace.name,
      duration: trace.duration,
      events,
    };
  }

  /**
   * Analyze trace for issues
   */
  analyzeTrace(traceId) {
    const trace =
      this.activeTraces.get(traceId) || this.completedTraces.find(t => t.traceId === traceId);

    if (!trace) return null;

    const analysis = {
      traceId: trace.traceId,
      issues: [],
      warnings: [],
      metrics: {},
    };

    // Check for errors
    const errorSpans = trace.spans.filter(s => s.error);
    if (errorSpans.length > 0) {
      analysis.issues.push({
        type: 'errors',
        count: errorSpans.length,
        spans: errorSpans.map(s => s.spanId),
      });
    }

    // Check for slow spans
    const slowSpans = trace.spans.filter(s => s.duration > 1000);
    if (slowSpans.length > 0) {
      analysis.warnings.push({
        type: 'slow-spans',
        count: slowSpans.length,
        spans: slowSpans.map(s => ({
          spanId: s.spanId,
          name: s.name,
          duration: s.duration,
        })),
      });
    }

    // Calculate metrics
    analysis.metrics = {
      totalSpans: trace.spans.length,
      completedSpans: trace.spans.filter(s => s.status !== 'active').length,
      averageSpanDuration:
        trace.spans.reduce((sum, s) => sum + (s.duration || 0), 0) / trace.spans.length,
      maxSpanDuration: Math.max(...trace.spans.map(s => s.duration || 0)),
    };

    return analysis;
  }

  /**
   * Update metrics
   */
  updateSpanMetrics(span) {
    const key = `${span.traceId}:${span.name}`;

    if (!this.spanMetrics.has(key)) {
      this.spanMetrics.set(key, {
        count: 0,
        totalDuration: 0,
        errors: 0,
      });
    }

    const metrics = this.spanMetrics.get(key);
    metrics.count++;
    metrics.totalDuration += span.duration;

    if (span.error) {
      metrics.errors++;
    }
  }

  updateTraceMetrics(trace) {
    const key = trace.name;

    if (!this.traceMetrics.has(key)) {
      this.traceMetrics.set(key, {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
      });
    }

    const metrics = this.traceMetrics.get(key);
    metrics.count++;
    metrics.totalDuration += trace.duration;
    metrics.averageDuration = metrics.totalDuration / metrics.count;

    // Update global average
    this.stats.averageDuration =
      (this.stats.averageDuration * (this.stats.completedTraces - 1) + trace.duration) /
      this.stats.completedTraces;
  }

  /**
   * Storage
   */
  async saveTrace(trace) {
    const filepath = path.join(this.config.traceDir, 'traces', `${trace.traceId}.json`);

    await fs.writeFile(filepath, JSON.stringify(trace, null, 2));
  }

  /**
   * Cleanup old traces
   */
  async cleanupOldTraces() {
    const now = Date.now();

    // Clean active traces
    for (const [traceId, trace] of this.activeTraces) {
      if (now - trace.timestamp > this.config.maxTraceAge) {
        this.endTrace(traceId, 'timeout');
      }
    }

    // Clean completed traces
    this.completedTraces = this.completedTraces.filter(
      trace => now - trace.timestamp < this.config.maxTraceAge
    );
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      traces: {
        active: this.activeTraces.size,
        completed: this.completedTraces.length,
      },
      spans: {
        active: this.activeSpans.size,
        total: this.stats.totalSpans,
        dropped: this.stats.droppedSpans,
      },
      metrics: {
        averageDuration: this.stats.averageDuration,
        traceTypes: this.traceMetrics.size,
        spanTypes: this.spanMetrics.size,
      },
      statistics: this.stats,
    };
  }

  async shutdown() {
    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // End all active traces
    for (const traceId of this.activeTraces.keys()) {
      this.endTrace(traceId, 'shutdown');
    }

    // Save statistics
    const statsPath = path.join(this.config.traceDir, 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));

    this.emit('shutdown');
    console.log('✅ Distributed Tracing shutdown complete');
    console.log(`   Total traces: ${this.stats.totalTraces}`);
    console.log(`   Completed traces: ${this.stats.completedTraces}`);
  }
}

module.exports = DistributedTracing;
