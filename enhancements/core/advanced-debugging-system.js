/**
 * Advanced Debugging System - v6.0
 * Provides comprehensive debugging capabilities with time-travel and state replay
 * Implements breakpoints, stack traces, and performance profiling
 *
 * Part 1: Core initialization and debugging infrastructure
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const util = require('util');
const vm = require('vm');
const { performance } = require('perf_hooks');

class AdvancedDebuggingSystem extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      debugDir: options.debugDir || path.join(process.cwd(), 'vibe-data', 'debug'),
      maxStackDepth: options.maxStackDepth || 50,
      maxHistorySize: options.maxHistorySize || 1000,
      captureAsync: options.captureAsync !== false,
      enableTimeTravel: options.enableTimeTravel !== false,
      profilePerformance: options.profilePerformance !== false,
      breakOnError: options.breakOnError !== false,
      verboseLogging: options.verboseLogging || false,
    };

    // Debugging state
    this.executionHistory = [];
    this.stateSnapshots = new Map();
    this.breakpoints = new Map();
    this.watches = new Map();

    // Call stack tracking
    this.callStack = [];
    this.asyncStack = [];
    this.stackFrames = new Map();

    // Performance profiling
    this.performanceMarks = new Map();
    this.performanceMeasures = [];
    this.memorySnapshots = [];

    // Error tracking
    this.errors = [];
    this.errorPatterns = new Map();
    this.errorHandlers = new Map();

    // Time-travel debugging
    this.timeline = [];
    this.currentTimeIndex = 0;
    this.recordingEnabled = false;

    // Variable inspection
    this.scopeChain = [];
    this.localVariables = new Map();
    this.globalVariables = new Map();

    // Debugging sessions
    this.sessions = new Map();
    this.activeSession = null;

    // Real-time monitoring
    this.monitors = new Map();
    this.triggers = new Map();

    // Statistics
    this.stats = {
      totalBreakpoints: 0,
      breakpointHits: 0,
      errorssCaught: 0,
      stateSnapshots: 0,
      performanceProfiles: 0,
      memoryLeaks: 0,
      timeTravelJumps: 0,
    };

    this.isInitialized = false;
    this.isPaused = false;
  }

  /**
   * Initialize debugging system
   */
  async initialize() {
    try {
      console.log('🐛 Initializing Advanced Debugging System...');

      // Create directory structure
      await this.createDirectories();

      // Load debugging configuration
      await this.loadConfiguration();

      // Setup error handlers
      this.setupErrorHandlers();

      // Initialize performance monitoring
      this.initializePerformanceMonitoring();

      // Load previous sessions
      await this.loadSessions();

      // Setup async hooks for async debugging
      if (this.config.captureAsync) {
        this.setupAsyncHooks();
      }

      // Start recording if enabled
      if (this.config.enableTimeTravel) {
        this.startRecording();
      }

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Advanced Debugging System initialized');
      console.log(`   - Time-travel: ${this.config.enableTimeTravel ? 'enabled' : 'disabled'}`);
      console.log(
        `   - Performance profiling: ${this.config.profilePerformance ? 'enabled' : 'disabled'}`
      );
      console.log(`   - Async capture: ${this.config.captureAsync ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Failed to initialize Advanced Debugging System:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = [
      'sessions',
      'snapshots',
      'profiles',
      'traces',
      'errors',
      'timeline',
      'breakpoints',
      'logs',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.debugDir, dir), { recursive: true });
    }
  }

  /**
   * Breakpoint management
   */
  async setBreakpoint(location, condition = null) {
    const breakpoint = {
      id: crypto.randomBytes(8).toString('hex'),
      location,
      condition,
      enabled: true,
      hitCount: 0,
      created: Date.now(),
    };

    // Parse location
    if (typeof location === 'string') {
      const [file, line] = location.split(':');
      breakpoint.file = file;
      breakpoint.line = parseInt(line);
    } else {
      breakpoint.file = location.file;
      breakpoint.line = location.line;
      breakpoint.column = location.column;
    }

    // Store breakpoint
    const key = `${breakpoint.file}:${breakpoint.line}`;
    if (!this.breakpoints.has(key)) {
      this.breakpoints.set(key, []);
    }
    this.breakpoints.get(key).push(breakpoint);

    this.stats.totalBreakpoints++;

    await this.saveBreakpoint(breakpoint);

    this.emit('breakpointSet', breakpoint);

    return breakpoint.id;
  }

  async removeBreakpoint(breakpointId) {
    for (const [key, breakpoints] of this.breakpoints) {
      const index = breakpoints.findIndex(bp => bp.id === breakpointId);
      if (index !== -1) {
        breakpoints.splice(index, 1);

        if (breakpoints.length === 0) {
          this.breakpoints.delete(key);
        }

        this.emit('breakpointRemoved', breakpointId);
        return true;
      }
    }

    return false;
  }

  async hitBreakpoint(file, line, context = {}) {
    const key = `${file}:${line}`;
    const breakpoints = this.breakpoints.get(key);

    if (!breakpoints || breakpoints.length === 0) {
      return false;
    }

    for (const breakpoint of breakpoints) {
      if (!breakpoint.enabled) continue;

      // Check condition
      if (breakpoint.condition) {
        const conditionMet = await this.evaluateCondition(breakpoint.condition, context);
        if (!conditionMet) continue;
      }

      // Hit breakpoint
      breakpoint.hitCount++;
      this.stats.breakpointHits++;

      // Pause execution
      await this.pauseExecution(breakpoint, context);

      return true;
    }

    return false;
  }

  async pauseExecution(breakpoint, context) {
    this.isPaused = true;

    // Capture current state
    const state = await this.captureState(context);

    // Store in history
    this.executionHistory.push({
      breakpoint,
      state,
      timestamp: Date.now(),
      callStack: [...this.callStack],
    });

    // Emit pause event
    this.emit('paused', {
      breakpoint,
      state,
      callStack: this.callStack,
    });

    // Wait for resume
    await this.waitForResume();
  }

  async waitForResume() {
    return new Promise(resolve => {
      const checkResume = setInterval(() => {
        if (!this.isPaused) {
          clearInterval(checkResume);
          resolve();
        }
      }, 100);
    });
  }

  resume() {
    this.isPaused = false;
    this.emit('resumed');
  }

  stepOver() {
    // Step to next line at same level
    this.isPaused = false;
    this.emit('stepOver');
  }

  stepInto() {
    // Step into function call
    this.isPaused = false;
    this.emit('stepInto');
  }

  stepOut() {
    // Step out of current function
    this.isPaused = false;
    this.emit('stepOut');
  }

  /**
   * State capture and inspection
   */
  async captureState(context = {}) {
    const state = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      variables: {},
      callStack: [...this.callStack],
      memory: process.memoryUsage(),
      context,
    };

    // Capture local variables
    for (const [name, value] of this.localVariables) {
      state.variables[name] = this.serializeValue(value);
    }

    // Capture watched variables
    for (const [name, getter] of this.watches) {
      try {
        state.variables[`watch:${name}`] = this.serializeValue(await getter());
      } catch (error) {
        state.variables[`watch:${name}`] = { error: error.message };
      }
    }

    // Store snapshot
    this.stateSnapshots.set(state.id, state);

    // Limit snapshot history
    if (this.stateSnapshots.size > this.config.maxHistorySize) {
      const oldestId = this.stateSnapshots.keys().next().value;
      this.stateSnapshots.delete(oldestId);
    }

    this.stats.stateSnapshots++;

    return state;
  }

  serializeValue(value, depth = 0, maxDepth = 5) {
    if (depth > maxDepth) {
      return '[Max Depth Reached]';
    }

    if (value === null || value === undefined) {
      return value;
    }

    const type = typeof value;

    if (type === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }

    if (type === 'symbol') {
      return value.toString();
    }

    if (type === 'object') {
      if (value instanceof Date) {
        return value.toISOString();
      }

      if (value instanceof Error) {
        return {
          type: 'Error',
          message: value.message,
          stack: value.stack,
        };
      }

      if (Array.isArray(value)) {
        return value.map(item => this.serializeValue(item, depth + 1, maxDepth));
      }

      if (value instanceof Map) {
        const obj = {};
        for (const [k, v] of value) {
          obj[k] = this.serializeValue(v, depth + 1, maxDepth);
        }
        return { type: 'Map', data: obj };
      }

      if (value instanceof Set) {
        return {
          type: 'Set',
          data: Array.from(value).map(item => this.serializeValue(item, depth + 1, maxDepth)),
        };
      }

      // Regular object
      const serialized = {};
      for (const [key, val] of Object.entries(value)) {
        serialized[key] = this.serializeValue(val, depth + 1, maxDepth);
      }
      return serialized;
    }

    return value;
  }

  async watchVariable(name, getter) {
    this.watches.set(name, getter);
    this.emit('watchAdded', name);
  }

  async unwatchVariable(name) {
    this.watches.delete(name);
    this.emit('watchRemoved', name);
  }

  /**
   * Stack trace and call tracking (Part 2)
   */

  enterFunction(name, args, file, line) {
    const frame = {
      id: crypto.randomBytes(8).toString('hex'),
      name,
      args: this.serializeValue(args),
      file,
      line,
      entryTime: performance.now(),
      locals: new Map(),
    };

    this.callStack.push(frame);
    this.stackFrames.set(frame.id, frame);

    // Record for time-travel
    if (this.recordingEnabled) {
      this.recordEvent('function-entry', frame);
    }

    return frame.id;
  }

  exitFunction(frameId, returnValue) {
    const frame = this.stackFrames.get(frameId);
    if (!frame) return;

    frame.exitTime = performance.now();
    frame.duration = frame.exitTime - frame.entryTime;
    frame.returnValue = this.serializeValue(returnValue);

    // Pop from call stack
    const index = this.callStack.findIndex(f => f.id === frameId);
    if (index !== -1) {
      this.callStack.splice(index, 1);
    }

    // Record for time-travel
    if (this.recordingEnabled) {
      this.recordEvent('function-exit', frame);
    }

    // Check for performance issues
    if (frame.duration > 100) {
      this.emit('slowFunction', frame);
    }
  }

  captureStackTrace(error = new Error()) {
    const stack = error.stack.split('\n').slice(1);
    const frames = [];

    for (const line of stack) {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        frames.push({
          function: match[1],
          file: match[2],
          line: parseInt(match[3]),
          column: parseInt(match[4]),
        });
      }
    }

    return frames;
  }

  async analyzeCallStack() {
    const analysis = {
      depth: this.callStack.length,
      functions: {},
      totalTime: 0,
      recursions: [],
    };

    // Count function occurrences
    for (const frame of this.callStack) {
      const key = `${frame.file}:${frame.name}`;
      analysis.functions[key] = (analysis.functions[key] || 0) + 1;

      // Detect recursion
      if (analysis.functions[key] > 1) {
        analysis.recursions.push(key);
      }
    }

    // Calculate total time
    for (const frame of this.callStack) {
      if (frame.entryTime) {
        const duration = performance.now() - frame.entryTime;
        analysis.totalTime += duration;
      }
    }

    return analysis;
  }

  /**
   * Performance profiling
   */

  startProfiling(name = 'default') {
    const profile = {
      id: crypto.randomBytes(8).toString('hex'),
      name,
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
      marks: [],
      measures: [],
    };

    this.performanceMarks.set(name, profile);

    // Start CPU profiling
    if (this.config.profilePerformance) {
      this.startCPUProfiling(profile);
    }

    return profile.id;
  }

  mark(profileName, markName) {
    const profile = this.performanceMarks.get(profileName);
    if (!profile) return;

    const mark = {
      name: markName,
      time: performance.now() - profile.startTime,
      memory: process.memoryUsage(),
      callStack: this.callStack.length,
    };

    profile.marks.push(mark);
    performance.mark(markName);
  }

  measure(profileName, startMark, endMark) {
    const profile = this.performanceMarks.get(profileName);
    if (!profile) return;

    try {
      performance.measure(`${profileName}-measure`, startMark, endMark);

      const measure = performance.getEntriesByName(`${profileName}-measure`)[0];
      if (measure) {
        profile.measures.push({
          name: `${startMark}-${endMark}`,
          duration: measure.duration,
          start: measure.startTime,
        });
      }
    } catch (error) {
      console.error('Measure failed:', error);
    }
  }

  async stopProfiling(profileName) {
    const profile = this.performanceMarks.get(profileName);
    if (!profile) return null;

    profile.endTime = performance.now();
    profile.duration = profile.endTime - profile.startTime;
    profile.endMemory = process.memoryUsage();

    // Calculate memory delta
    profile.memoryDelta = {
      rss: profile.endMemory.rss - profile.startMemory.rss,
      heapTotal: profile.endMemory.heapTotal - profile.startMemory.heapTotal,
      heapUsed: profile.endMemory.heapUsed - profile.startMemory.heapUsed,
      external: profile.endMemory.external - profile.startMemory.external,
    };

    // Stop CPU profiling
    if (this.config.profilePerformance) {
      profile.cpuProfile = await this.stopCPUProfiling(profile);
    }

    // Save profile
    await this.saveProfile(profile);

    this.stats.performanceProfiles++;

    return profile;
  }

  startCPUProfiling(profile) {
    // Track function call counts and times
    profile.functionCalls = new Map();
    profile.cpuStartTime = process.cpuUsage();
  }

  async stopCPUProfiling(profile) {
    const cpuEndTime = process.cpuUsage(profile.cpuStartTime);

    return {
      user: cpuEndTime.user / 1000, // Convert to ms
      system: cpuEndTime.system / 1000,
      total: (cpuEndTime.user + cpuEndTime.system) / 1000,
    };
  }

  /**
   * Memory leak detection
   */

  async detectMemoryLeaks() {
    const snapshots = [];
    const interval = 1000; // 1 second
    const duration = 10000; // 10 seconds

    // Take memory snapshots
    for (let i = 0; i < duration / interval; i++) {
      snapshots.push({
        timestamp: Date.now(),
        memory: process.memoryUsage(),
      });

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    // Analyze trend
    const analysis = this.analyzeMemoryTrend(snapshots);

    if (analysis.isLeaking) {
      this.stats.memoryLeaks++;
      this.emit('memoryLeak', analysis);
    }

    return analysis;
  }

  analyzeMemoryTrend(snapshots) {
    if (snapshots.length < 2) {
      return { isLeaking: false, trend: 'insufficient-data' };
    }

    // Calculate growth rate
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];

    const heapGrowth = last.memory.heapUsed - first.memory.heapUsed;
    const timeElapsed = last.timestamp - first.timestamp;
    const growthRate = heapGrowth / timeElapsed; // bytes per ms

    // Check if consistently growing
    let increasingCount = 0;
    for (let i = 1; i < snapshots.length; i++) {
      if (snapshots[i].memory.heapUsed > snapshots[i - 1].memory.heapUsed) {
        increasingCount++;
      }
    }

    const consistentGrowth = increasingCount / (snapshots.length - 1);

    return {
      isLeaking: consistentGrowth > 0.8 && growthRate > 1000, // > 1KB/ms
      growthRate,
      consistentGrowth,
      heapGrowth,
      snapshots,
    };
  }

  /**
   * Error tracking and handling
   */

  setupErrorHandlers() {
    // Catch unhandled errors
    process.on('uncaughtException', error => {
      this.handleError(error, 'uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.handleError(reason, 'unhandledRejection', { promise });
    });

    // Override console.error
    const originalError = console.error;
    console.error = (...args) => {
      this.handleError(new Error(args.join(' ')), 'console.error');
      originalError.apply(console, args);
    };
  }

  async handleError(error, type, context = {}) {
    const errorInfo = {
      id: crypto.randomBytes(8).toString('hex'),
      type,
      message: error.message || String(error),
      stack: error.stack || this.captureStackTrace(error),
      timestamp: Date.now(),
      context,
      state: await this.captureState(),
    };

    // Store error
    this.errors.push(errorInfo);

    // Limit error history
    if (this.errors.length > this.config.maxHistorySize) {
      this.errors.shift();
    }

    // Detect patterns
    this.detectErrorPattern(errorInfo);

    // Save error
    await this.saveError(errorInfo);

    this.stats.errorsCaught++;

    // Break if configured
    if (this.config.breakOnError) {
      await this.pauseExecution({ type: 'error', error: errorInfo }, context);
    }

    this.emit('errorCaught', errorInfo);

    // Check for error handler
    const handler = this.errorHandlers.get(type);
    if (handler) {
      await handler(errorInfo);
    }
  }

  detectErrorPattern(error) {
    const pattern = `${error.type}:${error.message.substring(0, 50)}`;

    if (!this.errorPatterns.has(pattern)) {
      this.errorPatterns.set(pattern, {
        count: 0,
        firstSeen: error.timestamp,
        lastSeen: error.timestamp,
        errors: [],
      });
    }

    const patternInfo = this.errorPatterns.get(pattern);
    patternInfo.count++;
    patternInfo.lastSeen = error.timestamp;
    patternInfo.errors.push(error.id);

    // Alert on repeated errors
    if (patternInfo.count > 5) {
      this.emit('repeatedError', { pattern, info: patternInfo });
    }
  }

  registerErrorHandler(type, handler) {
    this.errorHandlers.set(type, handler);
  }

  /**
   * Time-travel debugging
   */

  startRecording() {
    this.recordingEnabled = true;
    this.timeline = [];
    this.currentTimeIndex = 0;

    console.log('🎕 Time-travel recording started');
  }

  stopRecording() {
    this.recordingEnabled = false;
    console.log('🎬 Time-travel recording stopped');
    console.log(`   Recorded ${this.timeline.length} events`);
  }

  recordEvent(type, data) {
    if (!this.recordingEnabled) return;

    const event = {
      id: crypto.randomBytes(8).toString('hex'),
      type,
      data: this.serializeValue(data),
      timestamp: Date.now(),
      index: this.timeline.length,
      state: this.captureQuickState(),
    };

    this.timeline.push(event);
    this.currentTimeIndex = this.timeline.length - 1;

    // Limit timeline size
    if (this.timeline.length > this.config.maxHistorySize * 10) {
      this.timeline = this.timeline.slice(-this.config.maxHistorySize * 10);
    }
  }

  captureQuickState() {
    // Lightweight state capture for timeline
    return {
      callStackDepth: this.callStack.length,
      localVarsCount: this.localVariables.size,
      memory: process.memoryUsage().heapUsed,
    };
  }

  async jumpToTime(index) {
    if (index < 0 || index >= this.timeline.length) {
      throw new Error('Invalid timeline index');
    }

    const event = this.timeline[index];
    this.currentTimeIndex = index;

    // Restore state
    await this.restoreState(event.state);

    this.stats.timeTravelJumps++;

    this.emit('timeJump', { index, event });

    return event;
  }

  async stepBackward() {
    if (this.currentTimeIndex > 0) {
      return this.jumpToTime(this.currentTimeIndex - 1);
    }
    return null;
  }

  async stepForward() {
    if (this.currentTimeIndex < this.timeline.length - 1) {
      return this.jumpToTime(this.currentTimeIndex + 1);
    }
    return null;
  }

  async restoreState(state) {
    // This would restore the actual program state
    // For now, emit event for visualization
    this.emit('stateRestored', state);
  }

  /**
   * Async hooks for async debugging (Part 3)
   */

  setupAsyncHooks() {
    const async_hooks = require('async_hooks');

    // Track async operations
    const asyncHook = async_hooks.createHook({
      init: (asyncId, type, triggerAsyncId, resource) => {
        this.asyncStack.push({
          asyncId,
          type,
          triggerAsyncId,
          timestamp: Date.now(),
          callStack: [...this.callStack],
        });
      },

      before: asyncId => {
        // Mark async operation starting
        const op = this.asyncStack.find(a => a.asyncId === asyncId);
        if (op) {
          op.startTime = performance.now();
        }
      },

      after: asyncId => {
        // Mark async operation completed
        const op = this.asyncStack.find(a => a.asyncId === asyncId);
        if (op) {
          op.endTime = performance.now();
          op.duration = op.endTime - op.startTime;
        }
      },

      destroy: asyncId => {
        // Remove from stack
        const index = this.asyncStack.findIndex(a => a.asyncId === asyncId);
        if (index !== -1) {
          this.asyncStack.splice(index, 1);
        }
      },
    });

    asyncHook.enable();
  }

  /**
   * Code evaluation and sandbox
   */

  async evaluateExpression(expression, context = {}) {
    try {
      // Create sandbox context
      const sandbox = {
        ...context,
        console,
        process,
        require,
        __dirname,
        __filename,
      };

      // Add watched variables
      for (const [name, getter] of this.watches) {
        try {
          sandbox[name] = await getter();
        } catch (error) {
          sandbox[name] = undefined;
        }
      }

      // Create VM context
      const vmContext = vm.createContext(sandbox);

      // Evaluate expression
      const result = vm.runInContext(expression, vmContext, {
        timeout: 5000,
        breakOnSigint: true,
      });

      return {
        success: true,
        result: this.serializeValue(result),
        type: typeof result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
      };
    }
  }

  async evaluateCondition(condition, context) {
    const result = await this.evaluateExpression(condition, context);
    return result.success && result.result;
  }

  /**
   * Session management
   */

  async createSession(name) {
    const session = {
      id: crypto.randomBytes(8).toString('hex'),
      name,
      created: Date.now(),
      breakpoints: new Map(),
      watches: new Map(),
      history: [],
      timeline: [],
      profiles: [],
    };

    this.sessions.set(session.id, session);
    this.activeSession = session;

    await this.saveSession(session);

    return session.id;
  }

  async loadSession(sessionId) {
    const sessionPath = path.join(this.config.debugDir, 'sessions', `${sessionId}.json`);

    try {
      const content = await fs.readFile(sessionPath, 'utf8');
      const session = JSON.parse(content);

      // Restore session state
      this.sessions.set(session.id, session);
      this.activeSession = session;

      // Restore breakpoints
      for (const [key, breakpoints] of Object.entries(session.breakpoints)) {
        this.breakpoints.set(key, breakpoints);
      }

      // Restore watches
      for (const [name, watch] of Object.entries(session.watches)) {
        // Recreate watch functions would be needed
        this.watches.set(name, watch);
      }

      return session;
    } catch (error) {
      throw new Error(`Failed to load session: ${error.message}`);
    }
  }

  /**
   * Real-time monitoring
   */

  async addMonitor(name, getter, threshold = null) {
    const monitor = {
      id: crypto.randomBytes(8).toString('hex'),
      name,
      getter,
      threshold,
      value: null,
      lastUpdate: Date.now(),
    };

    this.monitors.set(monitor.id, monitor);

    // Start monitoring
    monitor.interval = setInterval(async () => {
      try {
        const value = await getter();
        monitor.value = value;
        monitor.lastUpdate = Date.now();

        // Check threshold
        if (threshold !== null && value > threshold) {
          this.emit('thresholdExceeded', {
            monitor: name,
            value,
            threshold,
          });
        }
      } catch (error) {
        monitor.error = error.message;
      }
    }, 1000);

    return monitor.id;
  }

  async removeMonitor(monitorId) {
    const monitor = this.monitors.get(monitorId);
    if (monitor) {
      if (monitor.interval) {
        clearInterval(monitor.interval);
      }
      this.monitors.delete(monitorId);
      return true;
    }
    return false;
  }

  /**
   * Trigger system
   */

  async setTrigger(name, condition, action) {
    const trigger = {
      id: crypto.randomBytes(8).toString('hex'),
      name,
      condition,
      action,
      enabled: true,
      fireCount: 0,
      created: Date.now(),
    };

    this.triggers.set(trigger.id, trigger);

    // Start checking trigger
    trigger.interval = setInterval(async () => {
      if (!trigger.enabled) return;

      try {
        const shouldFire = await this.evaluateCondition(condition, {});

        if (shouldFire) {
          trigger.fireCount++;
          await action();

          this.emit('triggerFired', {
            id: trigger.id,
            name: trigger.name,
            fireCount: trigger.fireCount,
          });
        }
      } catch (error) {
        trigger.error = error.message;
      }
    }, 1000);

    return trigger.id;
  }

  /**
   * Storage methods
   */

  async loadConfiguration() {
    try {
      const configPath = path.join(this.config.debugDir, 'config.json');
      const content = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(content);

      // Merge with existing config
      this.config = { ...this.config, ...config };
    } catch (error) {
      // Config file might not exist
      await this.saveConfiguration();
    }
  }

  async saveConfiguration() {
    const configPath = path.join(this.config.debugDir, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
  }

  async saveBreakpoint(breakpoint) {
    const bpPath = path.join(this.config.debugDir, 'breakpoints', `${breakpoint.id}.json`);

    await fs.writeFile(bpPath, JSON.stringify(breakpoint, null, 2));
  }

  async saveError(error) {
    const errorPath = path.join(this.config.debugDir, 'errors', `${error.id}.json`);

    // Ensure stack is serializable
    const toSave = {
      ...error,
      stack: Array.isArray(error.stack) ? error.stack : String(error.stack),
    };

    await fs.writeFile(errorPath, JSON.stringify(toSave, null, 2));
  }

  async saveProfile(profile) {
    const profilePath = path.join(this.config.debugDir, 'profiles', `${profile.id}.json`);

    await fs.writeFile(profilePath, JSON.stringify(profile, null, 2));
  }

  async saveSession(session) {
    const sessionPath = path.join(this.config.debugDir, 'sessions', `${session.id}.json`);

    // Convert Maps to objects for serialization
    const toSave = {
      ...session,
      breakpoints: Object.fromEntries(session.breakpoints || []),
      watches: Object.fromEntries(session.watches || []),
    };

    await fs.writeFile(sessionPath, JSON.stringify(toSave, null, 2));
  }

  async saveTimeline() {
    const timelinePath = path.join(this.config.debugDir, 'timeline', `timeline-${Date.now()}.json`);

    await fs.writeFile(timelinePath, JSON.stringify(this.timeline, null, 2));
  }

  async loadSessions() {
    try {
      const sessionsDir = path.join(this.config.debugDir, 'sessions');
      const files = await fs.readdir(sessionsDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(sessionsDir, file), 'utf8');
          const session = JSON.parse(content);
          this.sessions.set(session.id, session);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  /**
   * Get status and shutdown
   */

  getStatus() {
    return {
      initialized: this.isInitialized,
      paused: this.isPaused,
      debugging: {
        breakpoints: this.breakpoints.size,
        watches: this.watches.size,
        callStackDepth: this.callStack.length,
        asyncOperations: this.asyncStack.length,
      },
      recording: {
        enabled: this.recordingEnabled,
        timelineLength: this.timeline.length,
        currentIndex: this.currentTimeIndex,
      },
      monitoring: {
        monitors: this.monitors.size,
        triggers: this.triggers.size,
        errors: this.errors.length,
        errorPatterns: this.errorPatterns.size,
      },
      performance: {
        profiles: this.performanceMarks.size,
        snapshots: this.stateSnapshots.size,
      },
      sessions: {
        total: this.sessions.size,
        active: this.activeSession?.id,
      },
      statistics: this.stats,
    };
  }

  async shutdown() {
    // Stop recording
    if (this.recordingEnabled) {
      this.stopRecording();
      await this.saveTimeline();
    }

    // Save active session
    if (this.activeSession) {
      await this.saveSession(this.activeSession);
    }

    // Save configuration
    await this.saveConfiguration();

    // Clear monitors
    for (const [id, monitor] of this.monitors) {
      if (monitor.interval) {
        clearInterval(monitor.interval);
      }
    }

    // Clear triggers
    for (const [id, trigger] of this.triggers) {
      if (trigger.interval) {
        clearInterval(trigger.interval);
      }
    }

    // Save statistics
    const statsPath = path.join(this.config.debugDir, 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));

    this.emit('shutdown');
    console.log('✅ Advanced Debugging System shutdown complete');
    console.log(`   Breakpoints hit: ${this.stats.breakpointHits}`);
    console.log(`   Errors caught: ${this.stats.errorsCaught}`);
    console.log(`   Performance profiles: ${this.stats.performanceProfiles}`);
    console.log(`   Time-travel jumps: ${this.stats.timeTravelJumps}`);
  }
}

module.exports = AdvancedDebuggingSystem;
