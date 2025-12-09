/**
 * Real-Time Synchronization System - v6.0
 * Provides real-time data synchronization across distributed components
 * Implements WebSocket-based communication and conflict resolution
 *
 * Part 1: Core initialization and sync management
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const WebSocket = require('ws');
const http = require('http');

class RealTimeSynchronization extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      syncDir: options.syncDir || path.join(process.cwd(), 'vibe-data', 'sync'),
      serverPort: options.serverPort || 8080,
      heartbeatInterval: options.heartbeatInterval || 30000,
      syncInterval: options.syncInterval || 1000,
      conflictResolution: options.conflictResolution || 'latest-write',
      enableCompression: options.enableCompression !== false,
      maxRetries: options.maxRetries || 3,
      reconnectDelay: options.reconnectDelay || 5000,
    };

    // Sync state management
    this.syncState = new Map();
    this.localChanges = new Map();
    this.remoteChanges = new Map();
    this.conflicts = new Map();

    // Connection management
    this.wsServer = null;
    this.clients = new Map();
    this.subscriptions = new Map();

    // Data versioning
    this.versions = new Map();
    this.vectorClocks = new Map();
    this.changeLog = [];

    // Sync channels
    this.channels = {
      data: new Map(),
      config: new Map(),
      state: new Map(),
      events: new Map(),
    };

    // Conflict resolution strategies
    this.conflictStrategies = {
      'latest-write': this.resolveLatestWrite.bind(this),
      merge: this.resolveMerge.bind(this),
      manual: this.resolveManual.bind(this),
      priority: this.resolvePriority.bind(this),
      custom: this.resolveCustom.bind(this),
    };

    // Sync protocols
    this.protocols = {
      full: this.fullSync.bind(this),
      incremental: this.incrementalSync.bind(this),
      differential: this.differentialSync.bind(this),
      streaming: this.streamingSync.bind(this),
    };

    // Statistics
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsResolved: 0,
      dataTransferred: 0,
      averageLatency: 0,
      connectedClients: 0,
    };

    this.isInitialized = false;
    this.isSyncing = false;
  }

  /**
   * Initialize synchronization system
   */
  async initialize() {
    try {
      console.log('🔄 Initializing Real-Time Synchronization...');

      // Create directory structure
      await this.createDirectories();

      // Load sync state
      await this.loadSyncState();

      // Initialize vector clocks
      this.initializeVectorClocks();

      // Start WebSocket server
      await this.startWebSocketServer();

      // Setup sync intervals
      this.setupSyncIntervals();

      // Load change log
      await this.loadChangeLog();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Real-Time Synchronization initialized');
      console.log(`   - WebSocket server on port: ${this.config.serverPort}`);
      console.log(`   - Sync channels: ${Object.keys(this.channels).length}`);
      console.log(`   - Conflict strategy: ${this.config.conflictResolution}`);
    } catch (error) {
      console.error('❌ Failed to initialize Real-Time Synchronization:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = ['state', 'changes', 'conflicts', 'versions', 'snapshots', 'logs', 'backups'];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.syncDir, dir), { recursive: true });
    }
  }

  /**
   * WebSocket server management
   */
  async startWebSocketServer() {
    const server = http.createServer();
    this.wsServer = new WebSocket.Server({ server });

    this.wsServer.on('connection', (ws, req) => {
      this.handleNewConnection(ws, req);
    });

    return new Promise((resolve, reject) => {
      server.listen(this.config.serverPort, err => {
        if (err) {
          reject(err);
        } else {
          console.log(`📡 WebSocket server listening on port ${this.config.serverPort}`);
          resolve();
        }
      });
    });
  }

  handleNewConnection(ws, req) {
    const clientId = crypto.randomBytes(8).toString('hex');
    const client = {
      id: clientId,
      ws,
      ip: req.socket.remoteAddress,
      connected: Date.now(),
      subscriptions: new Set(),
      vectorClock: {},
      lastSync: Date.now(),
    };

    this.clients.set(clientId, client);
    this.stats.connectedClients++;

    console.log(`✅ Client connected: ${clientId}`);

    // Send initial sync
    this.sendInitialSync(client);

    // Handle messages
    ws.on('message', data => {
      this.handleClientMessage(client, data);
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleClientDisconnect(client);
    });

    // Handle errors
    ws.on('error', error => {
      console.error(`Client ${clientId} error:`, error);
    });

    // Setup heartbeat
    this.setupClientHeartbeat(client);
  }

  async sendInitialSync(client) {
    const syncData = {
      type: 'initial-sync',
      clientId: client.id,
      timestamp: Date.now(),
      channels: {},
      vectorClock: this.getGlobalVectorClock(),
    };

    // Include all channel data
    for (const [channel, data] of Object.entries(this.channels)) {
      syncData.channels[channel] = Array.from(data.entries());
    }

    this.sendToClient(client, syncData);
  }

  sendToClient(client, data) {
    if (client.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(data);

      if (this.config.enableCompression) {
        // Would use compression library in production
        client.ws.send(message);
      } else {
        client.ws.send(message);
      }

      this.stats.dataTransferred += message.length;
    }
  }

  /**
   * Message handling
   */
  async handleClientMessage(client, data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'subscribe':
          await this.handleSubscribe(client, message);
          break;

        case 'unsubscribe':
          await this.handleUnsubscribe(client, message);
          break;

        case 'sync':
          await this.handleSyncRequest(client, message);
          break;

        case 'update':
          await this.handleUpdate(client, message);
          break;

        case 'conflict':
          await this.handleConflictReport(client, message);
          break;

        case 'heartbeat':
          await this.handleHeartbeat(client, message);
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Failed to handle client message:', error);
      this.sendError(client, error.message);
    }
  }

  async handleSubscribe(client, message) {
    const { channels } = message;

    for (const channel of channels) {
      client.subscriptions.add(channel);

      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());
      }
      this.subscriptions.get(channel).add(client.id);
    }

    // Send current state of subscribed channels
    const syncData = {
      type: 'subscription-sync',
      channels: {},
    };

    for (const channel of channels) {
      if (this.channels[channel]) {
        syncData.channels[channel] = Array.from(this.channels[channel].entries());
      }
    }

    this.sendToClient(client, syncData);
  }

  async handleUnsubscribe(client, message) {
    const { channels } = message;

    for (const channel of channels) {
      client.subscriptions.delete(channel);

      const subscribers = this.subscriptions.get(channel);
      if (subscribers) {
        subscribers.delete(client.id);

        if (subscribers.size === 0) {
          this.subscriptions.delete(channel);
        }
      }
    }
  }

  async handleSyncRequest(client, message) {
    const { protocol = 'incremental', since, channels } = message;

    const syncFn = this.protocols[protocol];
    if (!syncFn) {
      throw new Error(`Unknown sync protocol: ${protocol}`);
    }

    const syncData = await syncFn(client, { since, channels });

    this.sendToClient(client, {
      type: 'sync-response',
      protocol,
      data: syncData,
      timestamp: Date.now(),
    });

    client.lastSync = Date.now();
    this.stats.totalSyncs++;
  }

  /**
   * Data synchronization
   */
  async synchronize(channel, key, value, metadata = {}) {
    const change = {
      id: crypto.randomBytes(8).toString('hex'),
      channel,
      key,
      value,
      timestamp: Date.now(),
      vectorClock: this.incrementVectorClock(),
      metadata,
    };

    // Apply locally
    await this.applyChange(change);

    // Check for conflicts
    const conflict = await this.detectConflict(change);
    if (conflict) {
      await this.resolveConflict(conflict, change);
    }

    // Propagate to subscribers
    await this.propagateChange(change);

    // Log change
    this.changeLog.push(change);
    await this.saveChange(change);

    return change.id;
  }

  async applyChange(change) {
    const { channel, key, value } = change;

    if (!this.channels[channel]) {
      this.channels[channel] = new Map();
    }

    // Store with versioning
    const version = {
      value,
      timestamp: change.timestamp,
      vectorClock: change.vectorClock,
      changeId: change.id,
    };

    this.channels[channel].set(key, version);

    // Update local changes
    this.localChanges.set(change.id, change);

    this.emit('changeApplied', change);
  }

  async detectConflict(change) {
    const { channel, key } = change;

    // Check if there are pending remote changes for same key
    for (const [changeId, remoteChange] of this.remoteChanges) {
      if (
        remoteChange.channel === channel &&
        remoteChange.key === key &&
        !this.isVectorClockCausal(change.vectorClock, remoteChange.vectorClock)
      ) {
        return {
          local: change,
          remote: remoteChange,
          type: 'concurrent-update',
        };
      }
    }

    return null;
  }

  async resolveConflict(conflict, change) {
    const strategy = this.conflictStrategies[this.config.conflictResolution];
    if (!strategy) {
      throw new Error(`Unknown conflict resolution strategy: ${this.config.conflictResolution}`);
    }

    const resolution = await strategy(conflict);

    // Apply resolution
    await this.applyChange(resolution);

    // Store conflict for history
    this.conflicts.set(conflict.local.id, {
      conflict,
      resolution,
      timestamp: Date.now(),
    });

    this.stats.conflictsResolved++;

    this.emit('conflictResolved', { conflict, resolution });

    return resolution;
  }

  /**
   * Conflict resolution strategies (Part 2)
   */

  async resolveLatestWrite(conflict) {
    // Choose the change with latest timestamp
    const { local, remote } = conflict;

    if (local.timestamp > remote.timestamp) {
      return local;
    } else {
      return remote;
    }
  }

  async resolveMerge(conflict) {
    const { local, remote } = conflict;

    // Try to merge values if possible
    if (typeof local.value === 'object' && typeof remote.value === 'object') {
      // Deep merge objects
      const merged = this.deepMerge(local.value, remote.value);

      return {
        ...local,
        value: merged,
        metadata: {
          ...local.metadata,
          mergedFrom: [local.id, remote.id],
        },
      };
    }

    // Fall back to latest write for non-objects
    return this.resolveLatestWrite(conflict);
  }

  async resolveManual(conflict) {
    // Store conflict for manual resolution
    const conflictId = crypto.randomBytes(8).toString('hex');

    this.conflicts.set(conflictId, {
      ...conflict,
      status: 'pending-manual',
      timestamp: Date.now(),
    });

    // Emit event for manual resolution
    this.emit('manualConflictRequired', { conflictId, conflict });

    // Return local change temporarily
    return conflict.local;
  }

  async resolvePriority(conflict) {
    const { local, remote } = conflict;

    // Check priority metadata
    const localPriority = local.metadata?.priority || 0;
    const remotePriority = remote.metadata?.priority || 0;

    if (localPriority >= remotePriority) {
      return local;
    } else {
      return remote;
    }
  }

  async resolveCustom(conflict) {
    // Allow custom resolution function
    if (this.config.customResolver) {
      return this.config.customResolver(conflict);
    }

    // Fall back to latest write
    return this.resolveLatestWrite(conflict);
  }

  deepMerge(obj1, obj2) {
    const result = { ...obj1 };

    for (const [key, value] of Object.entries(obj2)) {
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        result[key] = this.deepMerge(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Synchronization protocols
   */

  async fullSync(client, options) {
    const syncData = {};

    // Send complete state of all channels
    for (const [channel, data] of Object.entries(this.channels)) {
      if (!options.channels || options.channels.includes(channel)) {
        syncData[channel] = Array.from(data.entries());
      }
    }

    this.stats.successfulSyncs++;

    return {
      type: 'full',
      data: syncData,
      vectorClock: this.getGlobalVectorClock(),
      timestamp: Date.now(),
    };
  }

  async incrementalSync(client, options) {
    const { since = 0, channels = [] } = options;
    const changes = [];

    // Get changes since timestamp
    for (const change of this.changeLog) {
      if (change.timestamp > since) {
        if (!channels.length || channels.includes(change.channel)) {
          changes.push(change);
        }
      }
    }

    this.stats.successfulSyncs++;

    return {
      type: 'incremental',
      changes,
      since,
      until: Date.now(),
      vectorClock: this.getGlobalVectorClock(),
    };
  }

  async differentialSync(client, options) {
    const { vectorClock = {}, channels = [] } = options;
    const changes = [];

    // Get changes not in client's vector clock
    for (const change of this.changeLog) {
      if (this.isChangeNew(change, vectorClock)) {
        if (!channels.length || channels.includes(change.channel)) {
          changes.push(change);
        }
      }
    }

    this.stats.successfulSyncs++;

    return {
      type: 'differential',
      changes,
      vectorClock: this.getGlobalVectorClock(),
      clientClock: vectorClock,
    };
  }

  async streamingSync(client, options) {
    // Setup streaming sync for real-time updates
    const streamId = crypto.randomBytes(8).toString('hex');
    const { channels = [] } = options;

    // Register stream
    client.streams = client.streams || new Map();
    client.streams.set(streamId, {
      channels,
      started: Date.now(),
      lastUpdate: Date.now(),
    });

    // Send initial state
    const initialData = {};
    for (const channel of channels) {
      if (this.channels[channel]) {
        initialData[channel] = Array.from(this.channels[channel].entries());
      }
    }

    this.stats.successfulSyncs++;

    return {
      type: 'streaming',
      streamId,
      initial: initialData,
      vectorClock: this.getGlobalVectorClock(),
    };
  }

  /**
   * Change propagation
   */

  async propagateChange(change) {
    const subscribers = this.subscriptions.get(change.channel);

    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const message = {
      type: 'update',
      change,
      timestamp: Date.now(),
    };

    // Send to all subscribed clients
    for (const clientId of subscribers) {
      const client = this.clients.get(clientId);

      if (client && client.ws.readyState === WebSocket.OPEN) {
        // Check if client has streaming sync
        const hasStream = Array.from(client.streams?.values() || []).some(stream =>
          stream.channels.includes(change.channel)
        );

        if (hasStream) {
          // Send as streaming update
          this.sendToClient(client, {
            type: 'stream-update',
            ...message,
          });
        } else {
          // Send as regular update
          this.sendToClient(client, message);
        }
      }
    }
  }

  async handleUpdate(client, message) {
    const { channel, key, value, vectorClock } = message;

    // Create change object
    const change = {
      id: crypto.randomBytes(8).toString('hex'),
      channel,
      key,
      value,
      timestamp: Date.now(),
      vectorClock: vectorClock || this.incrementVectorClock(),
      metadata: {
        source: client.id,
      },
    };

    // Store as remote change
    this.remoteChanges.set(change.id, change);

    // Apply synchronization
    await this.synchronize(channel, key, value, change.metadata);

    // Acknowledge update
    this.sendToClient(client, {
      type: 'update-ack',
      changeId: change.id,
      timestamp: Date.now(),
    });
  }

  /**
   * Vector clock operations
   */

  initializeVectorClocks() {
    this.nodeId = crypto.randomBytes(4).toString('hex');
    this.vectorClocks.set('global', { [this.nodeId]: 0 });
  }

  incrementVectorClock() {
    const globalClock = this.vectorClocks.get('global');
    globalClock[this.nodeId] = (globalClock[this.nodeId] || 0) + 1;
    return { ...globalClock };
  }

  getGlobalVectorClock() {
    return { ...this.vectorClocks.get('global') };
  }

  isVectorClockCausal(clock1, clock2) {
    // Check if clock1 happens-before clock2
    for (const [node, time] of Object.entries(clock1)) {
      if (time > (clock2[node] || 0)) {
        return false;
      }
    }
    return true;
  }

  isChangeNew(change, clientClock) {
    // Check if change is new relative to client's clock
    for (const [node, time] of Object.entries(change.vectorClock || {})) {
      if (time > (clientClock[node] || 0)) {
        return true;
      }
    }
    return false;
  }

  mergeVectorClocks(clock1, clock2) {
    const merged = { ...clock1 };

    for (const [node, time] of Object.entries(clock2)) {
      merged[node] = Math.max(merged[node] || 0, time);
    }

    return merged;
  }

  /**
   * Heartbeat and health monitoring
   */

  setupClientHeartbeat(client) {
    client.heartbeatTimer = setInterval(() => {
      if (client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(client, {
          type: 'ping',
          timestamp: Date.now(),
        });
      } else {
        clearInterval(client.heartbeatTimer);
      }
    }, this.config.heartbeatInterval);
  }

  async handleHeartbeat(client, message) {
    client.lastHeartbeat = Date.now();

    if (message.type === 'pong') {
      // Calculate latency
      const latency = Date.now() - message.timestamp;
      this.stats.averageLatency = this.stats.averageLatency * 0.9 + latency * 0.1;
    }
  }

  handleClientDisconnect(client) {
    // Clear heartbeat
    if (client.heartbeatTimer) {
      clearInterval(client.heartbeatTimer);
    }

    // Remove from subscriptions
    for (const channel of client.subscriptions) {
      const subscribers = this.subscriptions.get(channel);
      if (subscribers) {
        subscribers.delete(client.id);

        if (subscribers.size === 0) {
          this.subscriptions.delete(channel);
        }
      }
    }

    // Remove client
    this.clients.delete(client.id);
    this.stats.connectedClients--;

    console.log(`❌ Client disconnected: ${client.id}`);
    this.emit('clientDisconnected', client);
  }

  sendError(client, error) {
    this.sendToClient(client, {
      type: 'error',
      error,
      timestamp: Date.now(),
    });
  }

  /**
   * Sync intervals and automation
   */

  setupSyncIntervals() {
    // Periodic sync for all clients
    this.syncInterval = setInterval(() => {
      this.performPeriodicSync();
    }, this.config.syncInterval);

    // Periodic conflict check
    this.conflictCheckInterval = setInterval(() => {
      this.checkPendingConflicts();
    }, 5000);

    // Periodic snapshot
    this.snapshotInterval = setInterval(() => {
      this.createSnapshot();
    }, 60000);
  }

  async performPeriodicSync() {
    if (this.isSyncing) return;

    this.isSyncing = true;

    try {
      // Sync with all connected clients
      for (const [clientId, client] of this.clients) {
        if (client.ws.readyState === WebSocket.OPEN) {
          const timeSinceLastSync = Date.now() - client.lastSync;

          if (timeSinceLastSync > this.config.syncInterval * 2) {
            // Send incremental sync
            const syncData = await this.incrementalSync(client, {
              since: client.lastSync,
            });

            this.sendToClient(client, {
              type: 'periodic-sync',
              data: syncData,
              timestamp: Date.now(),
            });

            client.lastSync = Date.now();
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  async checkPendingConflicts() {
    // Check for unresolved conflicts
    for (const [conflictId, conflict] of this.conflicts) {
      if (conflict.status === 'pending-manual') {
        const age = Date.now() - conflict.timestamp;

        if (age > 300000) {
          // 5 minutes
          // Auto-resolve old conflicts
          console.warn(`Auto-resolving old conflict: ${conflictId}`);

          const resolution = await this.resolveLatestWrite(conflict);
          await this.applyChange(resolution);

          conflict.status = 'auto-resolved';
        }
      }
    }
  }

  /**
   * Snapshot and backup (Part 3)
   */

  async createSnapshot() {
    const snapshot = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      channels: {},
      vectorClock: this.getGlobalVectorClock(),
      stats: { ...this.stats },
    };

    // Capture current state of all channels
    for (const [channel, data] of Object.entries(this.channels)) {
      snapshot.channels[channel] = Array.from(data.entries());
    }

    // Save snapshot
    await this.saveSnapshot(snapshot);

    // Cleanup old snapshots
    await this.cleanupOldSnapshots();

    this.emit('snapshotCreated', snapshot);

    return snapshot.id;
  }

  async restoreFromSnapshot(snapshotId) {
    const snapshot = await this.loadSnapshot(snapshotId);

    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    // Restore channels
    for (const [channel, entries] of Object.entries(snapshot.channels)) {
      this.channels[channel] = new Map(entries);
    }

    // Restore vector clock
    this.vectorClocks.set('global', snapshot.vectorClock);

    // Clear change log after snapshot
    this.changeLog = [];

    console.log(`📦 Restored from snapshot: ${snapshotId}`);

    // Notify all clients
    for (const [clientId, client] of this.clients) {
      await this.sendInitialSync(client);
    }

    return snapshot;
  }

  async cleanupOldSnapshots() {
    const snapshotDir = path.join(this.config.syncDir, 'snapshots');
    const files = await fs.readdir(snapshotDir);
    const snapshots = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const stats = await fs.stat(path.join(snapshotDir, file));
        snapshots.push({
          file,
          mtime: stats.mtime.getTime(),
        });
      }
    }

    // Sort by modification time
    snapshots.sort((a, b) => b.mtime - a.mtime);

    // Keep only last 10 snapshots
    const toDelete = snapshots.slice(10);

    for (const { file } of toDelete) {
      await fs.unlink(path.join(snapshotDir, file));
    }
  }

  /**
   * Storage methods
   */

  async loadSyncState() {
    try {
      const statePath = path.join(this.config.syncDir, 'state', 'sync-state.json');
      const content = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(content);

      // Restore channels
      for (const [channel, entries] of Object.entries(state.channels || {})) {
        this.channels[channel] = new Map(entries);
      }

      // Restore vector clocks
      if (state.vectorClocks) {
        for (const [key, clock] of Object.entries(state.vectorClocks)) {
          this.vectorClocks.set(key, clock);
        }
      }

      console.log('📦 Loaded sync state');
    } catch (error) {
      // State file might not exist
      console.log('🆕 Creating new sync state');
    }
  }

  async saveSyncState() {
    const state = {
      channels: {},
      vectorClocks: {},
      timestamp: Date.now(),
    };

    // Save channels
    for (const [channel, data] of Object.entries(this.channels)) {
      state.channels[channel] = Array.from(data.entries());
    }

    // Save vector clocks
    for (const [key, clock] of this.vectorClocks) {
      state.vectorClocks[key] = clock;
    }

    const statePath = path.join(this.config.syncDir, 'state', 'sync-state.json');
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));
  }

  async loadChangeLog() {
    try {
      const logPath = path.join(this.config.syncDir, 'changes', 'change-log.json');
      const content = await fs.readFile(logPath, 'utf8');
      this.changeLog = JSON.parse(content);

      // Rebuild local and remote changes
      for (const change of this.changeLog) {
        if (change.metadata?.source) {
          this.remoteChanges.set(change.id, change);
        } else {
          this.localChanges.set(change.id, change);
        }
      }
    } catch (error) {
      // Log file might not exist
    }
  }

  async saveChange(change) {
    const changePath = path.join(this.config.syncDir, 'changes', `${change.id}.json`);

    await fs.writeFile(changePath, JSON.stringify(change, null, 2));
  }

  async saveChangeLog() {
    const logPath = path.join(this.config.syncDir, 'changes', 'change-log.json');

    // Limit change log size
    const recentChanges = this.changeLog.slice(-1000);

    await fs.writeFile(logPath, JSON.stringify(recentChanges, null, 2));
  }

  async saveSnapshot(snapshot) {
    const snapshotPath = path.join(this.config.syncDir, 'snapshots', `${snapshot.id}.json`);

    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
  }

  async loadSnapshot(snapshotId) {
    try {
      const snapshotPath = path.join(this.config.syncDir, 'snapshots', `${snapshotId}.json`);

      const content = await fs.readFile(snapshotPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async saveConflict(conflictId, conflict) {
    const conflictPath = path.join(this.config.syncDir, 'conflicts', `${conflictId}.json`);

    await fs.writeFile(conflictPath, JSON.stringify(conflict, null, 2));
  }

  /**
   * Client API
   */

  async subscribe(channels) {
    // API for local subscription
    for (const channel of channels) {
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());
      }
      this.subscriptions.get(channel).add('local');
    }
  }

  async unsubscribe(channels) {
    // API for local unsubscription
    for (const channel of channels) {
      const subscribers = this.subscriptions.get(channel);
      if (subscribers) {
        subscribers.delete('local');

        if (subscribers.size === 0) {
          this.subscriptions.delete(channel);
        }
      }
    }
  }

  async get(channel, key) {
    // Get current value
    if (this.channels[channel]) {
      const version = this.channels[channel].get(key);
      return version?.value;
    }
    return null;
  }

  async set(channel, key, value, metadata = {}) {
    // Set value and synchronize
    return this.synchronize(channel, key, value, metadata);
  }

  async delete(channel, key) {
    // Delete value
    return this.synchronize(channel, key, null, { deleted: true });
  }

  async getChannel(channel) {
    // Get all values in channel
    if (this.channels[channel]) {
      const result = {};
      for (const [key, version] of this.channels[channel]) {
        result[key] = version.value;
      }
      return result;
    }
    return {};
  }

  /**
   * Get status and shutdown
   */

  getStatus() {
    return {
      initialized: this.isInitialized,
      server: {
        port: this.config.serverPort,
        clients: this.clients.size,
        subscriptions: this.subscriptions.size,
      },
      channels: Object.keys(this.channels).map(channel => ({
        name: channel,
        keys: this.channels[channel].size,
      })),
      sync: {
        localChanges: this.localChanges.size,
        remoteChanges: this.remoteChanges.size,
        conflicts: this.conflicts.size,
        changeLog: this.changeLog.length,
      },
      statistics: {
        ...this.stats,
        successRate:
          this.stats.totalSyncs > 0
            ? ((this.stats.successfulSyncs / this.stats.totalSyncs) * 100).toFixed(1) + '%'
            : '0%',
      },
    };
  }

  async shutdown() {
    // Stop intervals
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (this.conflictCheckInterval) {
      clearInterval(this.conflictCheckInterval);
    }

    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }

    // Save final state
    await this.saveSyncState();
    await this.saveChangeLog();

    // Create final snapshot
    await this.createSnapshot();

    // Close all client connections
    for (const [clientId, client] of this.clients) {
      client.ws.close(1000, 'Server shutdown');
    }

    // Close WebSocket server
    if (this.wsServer) {
      await new Promise(resolve => {
        this.wsServer.close(resolve);
      });
    }

    // Save statistics
    const statsPath = path.join(this.config.syncDir, 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));

    this.emit('shutdown');
    console.log('✅ Real-Time Synchronization shutdown complete');
    console.log(`   Total syncs: ${this.stats.totalSyncs}`);
    console.log(`   Conflicts resolved: ${this.stats.conflictsResolved}`);
    console.log(`   Data transferred: ${(this.stats.dataTransferred / 1024 / 1024).toFixed(2)} MB`);
  }
}

module.exports = RealTimeSynchronization;
