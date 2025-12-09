/**
 * Cross-Agent Communication System - v6.0
 * Enables communication and collaboration between multiple AI agents
 * Implements message passing, task delegation, and consensus building
 *
 * Part 1: Core initialization and agent registry
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const net = require('net');

class CrossAgentCommunication extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      communicationDir:
        options.communicationDir || path.join(process.cwd(), 'vibe-data', 'communication'),
      agentPort: options.agentPort || 9500,
      broadcastPort: options.broadcastPort || 9501,
      heartbeatInterval: options.heartbeatInterval || 5000,
      messageTimeout: options.messageTimeout || 30000,
      maxRetries: options.maxRetries || 3,
      encryptMessages: options.encryptMessages !== false,
      consensusThreshold: options.consensusThreshold || 0.66,
    };

    // Agent registry
    this.agents = new Map();
    this.localAgent = null;
    this.remoteAgents = new Map();

    // Communication channels
    this.channels = new Map();
    this.subscriptions = new Map();
    this.messageQueue = new Map();

    // Protocol definitions
    this.protocols = {
      direct: this.sendDirect.bind(this),
      broadcast: this.sendBroadcast.bind(this),
      multicast: this.sendMulticast.bind(this),
      request: this.sendRequest.bind(this),
      response: this.sendResponse.bind(this),
      delegate: this.delegateTask.bind(this),
      consensus: this.seekConsensus.bind(this),
    };

    // Message handlers
    this.messageHandlers = new Map();
    this.pendingRequests = new Map();

    // Collaboration tracking
    this.collaborations = new Map();
    this.taskDelegations = new Map();

    // Network management
    this.server = null;
    this.connections = new Map();

    // Statistics
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      tasksDelgated: 0,
      tasksCompleted: 0,
      consensusReached: 0,
      consensusFailed: 0,
      averageResponseTime: 0,
    };

    this.isInitialized = false;
  }

  /**
   * Initialize communication system
   */
  async initialize() {
    try {
      console.log('🔗 Initializing Cross-Agent Communication...');

      // Create directory structure
      await this.createDirectories();

      // Register local agent
      await this.registerLocalAgent();

      // Load agent registry
      await this.loadAgentRegistry();

      // Start communication server
      await this.startServer();

      // Discover remote agents
      await this.discoverAgents();

      // Setup heartbeat
      this.startHeartbeat();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Cross-Agent Communication initialized');
      console.log(`   - Local agent: ${this.localAgent?.id}`);
      console.log(`   - Remote agents: ${this.remoteAgents.size}`);
      console.log(`   - Listening on port: ${this.config.agentPort}`);
    } catch (error) {
      console.error('❌ Failed to initialize Cross-Agent Communication:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = [
      'agents',
      'messages',
      'messages/sent',
      'messages/received',
      'messages/pending',
      'collaborations',
      'delegations',
      'consensus',
      'logs',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.communicationDir, dir), { recursive: true });
    }
  }

  /**
   * Agent registration and discovery
   */
  async registerLocalAgent(config = {}) {
    this.localAgent = {
      id: config.id || crypto.randomBytes(8).toString('hex'),
      name: config.name || 'vibe-agent',
      type: config.type || 'general',
      capabilities: config.capabilities || ['process', 'analyze', 'decide'],
      status: 'active',
      host: config.host || 'localhost',
      port: config.port || this.config.agentPort,
      publicKey: await this.generatePublicKey(),
      registeredAt: Date.now(),
    };

    // Register in local registry
    this.agents.set(this.localAgent.id, this.localAgent);

    // Save agent configuration
    await this.saveAgentConfig(this.localAgent);

    // Announce presence
    await this.announcePresence();

    return this.localAgent.id;
  }

  async generatePublicKey() {
    // Simple key generation (would use proper crypto in production)
    return crypto.randomBytes(32).toString('base64');
  }

  async discoverAgents() {
    console.log('🔍 Discovering remote agents...');

    // Try multicast discovery
    await this.multicastDiscovery();

    // Try known agent endpoints
    await this.checkKnownAgents();

    // Load saved remote agents
    await this.loadRemoteAgents();
  }

  async multicastDiscovery() {
    // Broadcast discovery message
    const discoveryMessage = {
      type: 'discovery',
      agent: this.localAgent,
      timestamp: Date.now(),
    };

    await this.sendBroadcast(discoveryMessage);
  }

  async checkKnownAgents() {
    const knownEndpoints = [
      { host: 'localhost', port: 9502 },
      { host: 'localhost', port: 9503 },
      { host: 'localhost', port: 9504 },
    ];

    for (const endpoint of knownEndpoints) {
      if (endpoint.port === this.config.agentPort) continue;

      try {
        const agent = await this.pingAgent(endpoint);
        if (agent) {
          this.registerRemoteAgent(agent);
        }
      } catch (error) {
        // Agent not available
      }
    }
  }

  async pingAgent(endpoint) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error('Ping timeout'));
      }, 2000);

      client.connect(endpoint.port, endpoint.host, () => {
        clearTimeout(timeout);

        const pingMessage = {
          type: 'ping',
          agent: this.localAgent,
        };

        client.write(JSON.stringify(pingMessage));
      });

      client.on('data', data => {
        try {
          const response = JSON.parse(data.toString());
          if (response.type === 'pong' && response.agent) {
            client.end();
            resolve(response.agent);
          }
        } catch (error) {
          reject(error);
        }
      });

      client.on('error', reject);
    });
  }

  registerRemoteAgent(agent) {
    if (agent.id !== this.localAgent.id) {
      this.remoteAgents.set(agent.id, {
        ...agent,
        lastSeen: Date.now(),
        status: 'active',
      });

      this.emit('agentDiscovered', agent);
      console.log(`✅ Discovered agent: ${agent.name} (${agent.id})`);
    }
  }

  /**
   * Communication server
   */
  async startServer() {
    this.server = net.createServer(socket => {
      this.handleConnection(socket);
    });

    return new Promise((resolve, reject) => {
      this.server.listen(this.config.agentPort, () => {
        console.log(`📡 Communication server listening on port ${this.config.agentPort}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  handleConnection(socket) {
    const connectionId = crypto.randomBytes(8).toString('hex');
    const connection = {
      id: connectionId,
      socket,
      agentId: null,
      established: Date.now(),
    };

    this.connections.set(connectionId, connection);

    socket.on('data', async data => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(message, connection);
      } catch (error) {
        console.error('Failed to handle message:', error);
      }
    });

    socket.on('error', error => {
      console.error('Connection error:', error);
    });

    socket.on('close', () => {
      this.connections.delete(connectionId);
    });
  }

  /**
   * Message handling
   */
  async handleMessage(message, connection) {
    // Validate message
    if (!this.validateMessage(message)) {
      return;
    }

    // Update statistics
    this.stats.messagesReceived++;

    // Store message
    await this.storeMessage(message, 'received');

    // Route message based on type
    switch (message.type) {
      case 'ping':
        await this.handlePing(message, connection);
        break;

      case 'discovery':
        await this.handleDiscovery(message, connection);
        break;

      case 'request':
        await this.handleRequest(message, connection);
        break;

      case 'response':
        await this.handleResponse(message, connection);
        break;

      case 'delegate':
        await this.handleDelegation(message, connection);
        break;

      case 'consensus':
        await this.handleConsensus(message, connection);
        break;

      case 'broadcast':
        await this.handleBroadcast(message, connection);
        break;

      default:
        // Custom message handler
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          await handler(message, connection);
        }
    }

    // Emit message event
    this.emit('messageReceived', message);
  }

  validateMessage(message) {
    // Basic validation
    if (!message.type || !message.id) {
      return false;
    }

    // Check signature if encryption is enabled
    if (this.config.encryptMessages && !this.verifySignature(message)) {
      return false;
    }

    return true;
  }

  verifySignature(message) {
    // Simple signature verification (would use proper crypto in production)
    return message.signature && message.signature.length > 0;
  }

  async handlePing(message, connection) {
    const pongMessage = {
      type: 'pong',
      agent: this.localAgent,
      timestamp: Date.now(),
    };

    connection.socket.write(JSON.stringify(pongMessage));
  }

  async handleDiscovery(message, connection) {
    if (message.agent) {
      this.registerRemoteAgent(message.agent);

      // Respond with own information
      const response = {
        type: 'discovery-response',
        agent: this.localAgent,
        timestamp: Date.now(),
      };

      connection.socket.write(JSON.stringify(response));
    }
  }

  /**
   * Message sending protocols (Part 2)
   */

  async send(agentId, message) {
    const messageId = crypto.randomBytes(8).toString('hex');
    const fullMessage = {
      id: messageId,
      from: this.localAgent.id,
      to: agentId,
      timestamp: Date.now(),
      ...message,
    };

    // Sign message if encryption is enabled
    if (this.config.encryptMessages) {
      fullMessage.signature = await this.signMessage(fullMessage);
    }

    // Get agent connection
    const agent = this.remoteAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Send message
    await this.sendToAgent(agent, fullMessage);

    // Store message
    await this.storeMessage(fullMessage, 'sent');

    // Update statistics
    this.stats.messagesSent++;

    return messageId;
  }

  async sendDirect(agentId, content) {
    return this.send(agentId, {
      type: 'direct',
      content,
    });
  }

  async sendBroadcast(content) {
    const messageId = crypto.randomBytes(8).toString('hex');
    const message = {
      id: messageId,
      type: 'broadcast',
      from: this.localAgent.id,
      content,
      timestamp: Date.now(),
    };

    // Send to all remote agents
    const promises = [];
    for (const [agentId, agent] of this.remoteAgents) {
      promises.push(
        this.sendToAgent(agent, message).catch(err => {
          console.warn(`Failed to broadcast to ${agentId}:`, err.message);
        })
      );
    }

    await Promise.all(promises);

    this.stats.messagesSent += this.remoteAgents.size;

    return messageId;
  }

  async sendMulticast(agentIds, content) {
    const messageId = crypto.randomBytes(8).toString('hex');
    const message = {
      id: messageId,
      type: 'multicast',
      from: this.localAgent.id,
      content,
      timestamp: Date.now(),
    };

    // Send to specified agents
    const promises = [];
    for (const agentId of agentIds) {
      const agent = this.remoteAgents.get(agentId);
      if (agent) {
        promises.push(this.sendToAgent(agent, message));
      }
    }

    await Promise.all(promises);

    this.stats.messagesSent += agentIds.length;

    return messageId;
  }

  async sendRequest(agentId, request) {
    const requestId = crypto.randomBytes(8).toString('hex');
    const message = {
      type: 'request',
      requestId,
      request,
      expectResponse: true,
    };

    // Create promise for response
    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, this.config.messageTimeout);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        startTime: Date.now(),
      });
    });

    // Send request
    await this.send(agentId, message);

    // Wait for response
    const response = await responsePromise;

    // Update average response time
    const responseTime = Date.now() - this.pendingRequests.get(requestId).startTime;
    this.stats.averageResponseTime = this.stats.averageResponseTime * 0.9 + responseTime * 0.1;

    return response;
  }

  async sendResponse(agentId, requestId, response) {
    const message = {
      type: 'response',
      requestId,
      response,
      success: true,
    };

    await this.send(agentId, message);
  }

  async sendToAgent(agent, message) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error('Send timeout'));
      }, 5000);

      client.connect(agent.port, agent.host, () => {
        clearTimeout(timeout);
        client.write(JSON.stringify(message));
        client.end();
        resolve();
      });

      client.on('error', reject);
    });
  }

  async signMessage(message) {
    // Simple signature (would use proper crypto in production)
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(message));
    return hash.digest('base64');
  }

  /**
   * Request/Response handling
   */

  async handleRequest(message, connection) {
    const { requestId, request, from } = message;

    try {
      // Process request
      const response = await this.processRequest(request, from);

      // Send response
      await this.sendResponse(from, requestId, response);
    } catch (error) {
      // Send error response
      await this.send(from, {
        type: 'response',
        requestId,
        error: error.message,
        success: false,
      });
    }
  }

  async processRequest(request, fromAgent) {
    // Handle different request types
    switch (request.action) {
      case 'process':
        return this.processTask(request.data);

      case 'analyze':
        return this.analyzeData(request.data);

      case 'decide':
        return this.makeDecision(request.data);

      case 'capabilities':
        return this.getCapabilities();

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }
  }

  async handleResponse(message, connection) {
    const { requestId, response, error, success } = message;

    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timeout);

      if (success) {
        pending.resolve(response);
      } else {
        pending.reject(new Error(error || 'Request failed'));
      }

      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Task delegation
   */

  async delegateTask(task, options = {}) {
    const delegation = {
      id: crypto.randomBytes(8).toString('hex'),
      task,
      delegatedTo: null,
      status: 'pending',
      result: null,
      startTime: Date.now(),
    };

    try {
      // Select best agent for task
      const agentId = await this.selectAgentForTask(task, options);

      if (!agentId) {
        throw new Error('No suitable agent found');
      }

      delegation.delegatedTo = agentId;

      // Store delegation
      this.taskDelegations.set(delegation.id, delegation);

      // Send delegation request
      const response = await this.sendRequest(agentId, {
        action: 'delegate',
        delegationId: delegation.id,
        task,
      });

      delegation.status = 'completed';
      delegation.result = response;

      // Update statistics
      this.stats.tasksDelgated++;
      this.stats.tasksCompleted++;

      // Save delegation result
      await this.saveDelegation(delegation);

      this.emit('taskCompleted', delegation);

      return response;
    } catch (error) {
      delegation.status = 'failed';
      delegation.error = error.message;

      console.error('Task delegation failed:', error);
      throw error;
    }
  }

  async selectAgentForTask(task, options) {
    const candidates = [];

    // Filter agents by capabilities
    for (const [agentId, agent] of this.remoteAgents) {
      if (agent.status !== 'active') continue;

      const score = this.scoreAgentForTask(agent, task);
      if (score > 0) {
        candidates.push({ agentId, score });
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    // Return best agent
    return candidates[0].agentId;
  }

  scoreAgentForTask(agent, task) {
    let score = 0;

    // Check capability match
    const requiredCapabilities = task.requirements || [];
    for (const capability of requiredCapabilities) {
      if (agent.capabilities.includes(capability)) {
        score += 10;
      } else {
        return 0; // Missing required capability
      }
    }

    // Prefer specialized agents
    if (agent.type === task.type) {
      score += 5;
    }

    // Consider agent availability (based on last seen)
    const timeSinceLastSeen = Date.now() - agent.lastSeen;
    if (timeSinceLastSeen < 10000) {
      score += 3;
    }

    return score;
  }

  async handleDelegation(message, connection) {
    const { delegationId, task, from } = message;

    try {
      // Process delegated task
      const result = await this.processDelegatedTask(task);

      // Send result back
      await this.sendResponse(from, message.requestId, result);
    } catch (error) {
      await this.sendResponse(from, message.requestId, {
        error: error.message,
        success: false,
      });
    }
  }

  async processDelegatedTask(task) {
    // Simulate task processing
    console.log(`Processing delegated task: ${task.type}`);

    return {
      result: 'Task completed',
      processedBy: this.localAgent.id,
      timestamp: Date.now(),
    };
  }

  /**
   * Consensus building
   */

  async seekConsensus(topic, proposal, options = {}) {
    const consensusId = crypto.randomBytes(8).toString('hex');
    const consensus = {
      id: consensusId,
      topic,
      proposal,
      votes: new Map(),
      status: 'seeking',
      result: null,
      startTime: Date.now(),
    };

    // Store consensus
    this.collaborations.set(consensusId, consensus);

    // Request votes from all agents
    const votePromises = [];

    for (const [agentId] of this.remoteAgents) {
      votePromises.push(
        this.requestVote(agentId, consensusId, topic, proposal).catch(err => ({
          agentId,
          vote: null,
          error: err.message,
        }))
      );
    }

    // Wait for votes with timeout
    const timeout = options.timeout || 10000;
    const votes = await Promise.race([
      Promise.all(votePromises),
      new Promise(resolve => setTimeout(() => resolve([]), timeout)),
    ]);

    // Count votes
    let approvals = 0;
    let rejections = 0;
    let abstentions = 0;

    for (const vote of votes) {
      if (vote.vote === 'approve') approvals++;
      else if (vote.vote === 'reject') rejections++;
      else abstentions++;

      consensus.votes.set(vote.agentId, vote.vote);
    }

    // Determine consensus
    const totalVotes = approvals + rejections;
    const approvalRate = totalVotes > 0 ? approvals / totalVotes : 0;

    if (approvalRate >= this.config.consensusThreshold) {
      consensus.status = 'approved';
      consensus.result = 'consensus-reached';
      this.stats.consensusReached++;
    } else {
      consensus.status = 'rejected';
      consensus.result = 'consensus-failed';
      this.stats.consensusFailed++;
    }

    // Save consensus result
    await this.saveConsensus(consensus);

    this.emit('consensusReached', consensus);

    return {
      consensusReached: consensus.status === 'approved',
      approvalRate,
      votes: {
        approve: approvals,
        reject: rejections,
        abstain: abstentions,
      },
    };
  }

  async requestVote(agentId, consensusId, topic, proposal) {
    const response = await this.sendRequest(agentId, {
      action: 'vote',
      consensusId,
      topic,
      proposal,
    });

    return {
      agentId,
      vote: response.vote || 'abstain',
    };
  }

  async handleConsensus(message, connection) {
    const { consensusId, topic, proposal, from } = message;

    // Evaluate proposal
    const vote = await this.evaluateProposal(topic, proposal);

    // Send vote
    await this.sendResponse(from, message.requestId, { vote });
  }

  async evaluateProposal(topic, proposal) {
    // Simple evaluation (would be more complex in production)
    const random = Math.random();

    if (random > 0.7) return 'approve';
    if (random > 0.3) return 'reject';
    return 'abstain';
  }

  /**
   * Channels and subscriptions (Part 3)
   */

  async createChannel(name, options = {}) {
    const channel = {
      id: crypto.randomBytes(8).toString('hex'),
      name,
      type: options.type || 'public',
      creator: this.localAgent.id,
      subscribers: new Set([this.localAgent.id]),
      created: Date.now(),
      metadata: options.metadata || {},
    };

    this.channels.set(channel.id, channel);

    // Announce channel creation
    await this.sendBroadcast({
      type: 'channel-created',
      channel,
    });

    return channel.id;
  }

  async subscribeToChannel(channelId) {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    channel.subscribers.add(this.localAgent.id);

    // Create subscription
    const subscription = {
      channelId,
      agentId: this.localAgent.id,
      subscribed: Date.now(),
    };

    this.subscriptions.set(channelId, subscription);

    this.emit('channelSubscribed', { channelId });
  }

  async publishToChannel(channelId, content) {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const message = {
      type: 'channel-message',
      channelId,
      content,
      from: this.localAgent.id,
      timestamp: Date.now(),
    };

    // Send to all subscribers
    const subscribers = Array.from(channel.subscribers);
    for (const subscriberId of subscribers) {
      if (subscriberId !== this.localAgent.id) {
        const agent = this.remoteAgents.get(subscriberId);
        if (agent) {
          await this.sendToAgent(agent, message).catch(err => {
            console.warn(`Failed to publish to ${subscriberId}:`, err.message);
          });
        }
      }
    }
  }

  /**
   * Helper methods
   */

  async processTask(data) {
    // Simulate task processing
    return {
      processed: true,
      data,
      timestamp: Date.now(),
    };
  }

  async analyzeData(data) {
    // Simulate data analysis
    return {
      analysis: 'completed',
      insights: [],
      timestamp: Date.now(),
    };
  }

  async makeDecision(data) {
    // Simulate decision making
    return {
      decision: 'approved',
      confidence: 0.85,
      timestamp: Date.now(),
    };
  }

  getCapabilities() {
    return {
      agent: this.localAgent.id,
      capabilities: this.localAgent.capabilities,
      status: this.localAgent.status,
    };
  }

  async handleBroadcast(message, connection) {
    // Process broadcast message
    this.emit('broadcastReceived', message);

    // Handle specific broadcast types
    if (message.content?.type === 'channel-created') {
      const channel = message.content.channel;
      if (!this.channels.has(channel.id)) {
        this.channels.set(channel.id, channel);
        this.emit('newChannelDiscovered', channel);
      }
    }
  }

  /**
   * Heartbeat and health monitoring
   */

  startHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      await this.sendHeartbeat();
      await this.checkAgentHealth();
    }, this.config.heartbeatInterval);
  }

  async sendHeartbeat() {
    const heartbeat = {
      type: 'heartbeat',
      agent: this.localAgent,
      timestamp: Date.now(),
      stats: this.stats,
    };

    // Send to all known agents
    for (const [agentId, agent] of this.remoteAgents) {
      await this.sendToAgent(agent, heartbeat).catch(() => {
        // Mark agent as potentially offline
        agent.status = 'unknown';
      });
    }
  }

  async checkAgentHealth() {
    const now = Date.now();
    const timeout = this.config.heartbeatInterval * 3;

    for (const [agentId, agent] of this.remoteAgents) {
      if (now - agent.lastSeen > timeout) {
        if (agent.status === 'active') {
          agent.status = 'inactive';
          this.emit('agentOffline', agent);
          console.warn(`Agent ${agent.name} appears offline`);
        }
      }
    }
  }

  async announcePresence() {
    const announcement = {
      type: 'announce',
      agent: this.localAgent,
      timestamp: Date.now(),
    };

    await this.sendBroadcast(announcement);
  }

  /**
   * Storage methods
   */

  async storeMessage(message, direction) {
    const filename = `${message.id}.json`;
    const filepath = path.join(this.config.communicationDir, 'messages', direction, filename);

    await fs.writeFile(filepath, JSON.stringify(message, null, 2));
  }

  async loadAgentRegistry() {
    try {
      const registryFile = path.join(this.config.communicationDir, 'agents', 'registry.json');

      const content = await fs.readFile(registryFile, 'utf8');
      const registry = JSON.parse(content);

      for (const agent of registry) {
        if (agent.id !== this.localAgent?.id) {
          this.agents.set(agent.id, agent);
        }
      }
    } catch (error) {
      // Registry might not exist
    }
  }

  async loadRemoteAgents() {
    try {
      const remoteFile = path.join(this.config.communicationDir, 'agents', 'remote.json');

      const content = await fs.readFile(remoteFile, 'utf8');
      const remoteAgents = JSON.parse(content);

      for (const agent of remoteAgents) {
        this.remoteAgents.set(agent.id, agent);
      }
    } catch (error) {
      // File might not exist
    }
  }

  async saveAgentConfig(agent) {
    const filepath = path.join(this.config.communicationDir, 'agents', `${agent.id}.json`);

    await fs.writeFile(filepath, JSON.stringify(agent, null, 2));
  }

  async saveRemoteAgents() {
    const remoteFile = path.join(this.config.communicationDir, 'agents', 'remote.json');

    const agents = Array.from(this.remoteAgents.values());
    await fs.writeFile(remoteFile, JSON.stringify(agents, null, 2));
  }

  async saveDelegation(delegation) {
    const filepath = path.join(
      this.config.communicationDir,
      'delegations',
      `${delegation.id}.json`
    );

    await fs.writeFile(filepath, JSON.stringify(delegation, null, 2));
  }

  async saveConsensus(consensus) {
    const filepath = path.join(this.config.communicationDir, 'consensus', `${consensus.id}.json`);

    // Convert Map to object for JSON serialization
    const toSave = {
      ...consensus,
      votes: Object.fromEntries(consensus.votes),
    };

    await fs.writeFile(filepath, JSON.stringify(toSave, null, 2));
  }

  /**
   * Custom message handlers
   */

  registerMessageHandler(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  unregisterMessageHandler(messageType) {
    this.messageHandlers.delete(messageType);
  }

  /**
   * Collaboration management
   */

  async startCollaboration(topic, participants, options = {}) {
    const collaboration = {
      id: crypto.randomBytes(8).toString('hex'),
      topic,
      participants: new Set(participants),
      initiator: this.localAgent.id,
      status: 'active',
      created: Date.now(),
      messages: [],
      results: null,
    };

    this.collaborations.set(collaboration.id, collaboration);

    // Invite participants
    for (const participantId of participants) {
      if (participantId !== this.localAgent.id) {
        await this.sendRequest(participantId, {
          action: 'join-collaboration',
          collaborationId: collaboration.id,
          topic,
        }).catch(err => {
          console.warn(`Failed to invite ${participantId}:`, err.message);
        });
      }
    }

    return collaboration.id;
  }

  async endCollaboration(collaborationId, results) {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) {
      throw new Error(`Collaboration ${collaborationId} not found`);
    }

    collaboration.status = 'completed';
    collaboration.results = results;
    collaboration.ended = Date.now();

    // Notify participants
    for (const participantId of collaboration.participants) {
      if (participantId !== this.localAgent.id) {
        await this.send(participantId, {
          type: 'collaboration-ended',
          collaborationId,
          results,
        }).catch(err => {
          console.warn(`Failed to notify ${participantId}:`, err.message);
        });
      }
    }

    return collaboration;
  }

  /**
   * Get status and shutdown
   */

  getStatus() {
    return {
      initialized: this.isInitialized,
      localAgent: this.localAgent,
      remoteAgents: {
        total: this.remoteAgents.size,
        active: Array.from(this.remoteAgents.values()).filter(a => a.status === 'active').length,
      },
      connections: this.connections.size,
      channels: this.channels.size,
      collaborations: {
        active: Array.from(this.collaborations.values()).filter(c => c.status === 'active').length,
        total: this.collaborations.size,
      },
      statistics: this.stats,
    };
  }

  async shutdown() {
    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Announce departure
    await this.sendBroadcast({
      type: 'departure',
      agent: this.localAgent,
      timestamp: Date.now(),
    });

    // Save remote agents
    await this.saveRemoteAgents();

    // Close all connections
    for (const [id, connection] of this.connections) {
      connection.socket.end();
    }

    // Stop server
    if (this.server) {
      await new Promise(resolve => {
        this.server.close(resolve);
      });
    }

    // Save statistics
    const statsFile = path.join(this.config.communicationDir, 'stats.json');
    await fs.writeFile(statsFile, JSON.stringify(this.stats, null, 2));

    this.emit('shutdown');
    console.log('✅ Cross-Agent Communication shutdown complete');
    console.log(`   Messages sent: ${this.stats.messagesSent}`);
    console.log(`   Messages received: ${this.stats.messagesReceived}`);
    console.log(`   Tasks delegated: ${this.stats.tasksDelgated}`);
  }
}

module.exports = CrossAgentCommunication;
