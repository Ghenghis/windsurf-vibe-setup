/**
 * Hive Mind Agent Swarm System
 * Windsurf Vibe Setup v4.1.0
 *
 * Enables hundreds of AI agents to work together as a collective intelligence,
 * sharing knowledge and coordinating tasks in real-time.
 */

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════
// HIVE MIND CORE
// ═══════════════════════════════════════════════════════════════════════════

class HiveMind extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxAgents: config.maxAgents || 100,
      defaultModel: config.defaultModel || 'qwen2.5-coder:32b',
      knowledgeBase: config.knowledgeBase || './data/hive-knowledge.db',
      communicationProtocol: config.communicationProtocol || 'internal',
      ...config,
    };

    this.swarms = new Map();
    this.agents = new Map();
    this.knowledgeGraph = new Map();
    this.taskQueue = [];
    this.backends = [];
    this.isRunning = false;
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      activeAgents: 0,
      consensusDecisions: 0,
    };
  }

  async start() {
    this.isRunning = true;
    this.emit('started', { timestamp: new Date() });
    console.log('🧠 Hive Mind started');
    return { success: true, status: 'running' };
  }

  async stop() {
    this.isRunning = false;
    // Stop all swarms
    for (const [name, swarm] of this.swarms) {
      await swarm.stop();
    }
    this.emit('stopped', { timestamp: new Date() });
    console.log('🧠 Hive Mind stopped');
    return { success: true, status: 'stopped' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SWARM MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  async createSwarm(options) {
    const swarm = new AgentSwarm({
      ...options,
      hiveMind: this,
    });

    this.swarms.set(options.name, swarm);
    await swarm.initialize();

    this.emit('swarmCreated', { name: options.name, agents: swarm.agents.length });
    return swarm;
  }

  getSwarm(name) {
    return this.swarms.get(name);
  }

  async destroySwarm(name) {
    const swarm = this.swarms.get(name);
    if (swarm) {
      await swarm.stop();
      this.swarms.delete(name);
      this.emit('swarmDestroyed', { name });
      return { success: true };
    }
    return { success: false, error: 'Swarm not found' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // KNOWLEDGE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  async syncKnowledge(scope, data) {
    this.knowledgeGraph.set(scope, {
      data,
      timestamp: new Date(),
      version: (this.knowledgeGraph.get(scope)?.version || 0) + 1,
    });

    // Broadcast to all swarms
    for (const swarm of this.swarms.values()) {
      await swarm.receiveKnowledge(scope, data);
    }

    return { success: true, scope, version: this.knowledgeGraph.get(scope).version };
  }

  async queryKnowledge(question, options = {}) {
    const responses = [];
    const consultAgents = options.consultAgents || ['default'];

    // Query relevant swarms
    for (const swarm of this.swarms.values()) {
      if (swarm.hasCapability(consultAgents)) {
        const response = await swarm.queryAgents(question, consultAgents);
        responses.push(response);
      }
    }

    // Synthesize responses if requested
    if (options.synthesize && responses.length > 1) {
      return this.synthesizeResponses(responses, question);
    }

    return responses;
  }

  synthesizeResponses(responses, question) {
    // Combine multiple agent perspectives
    const synthesis = {
      question,
      perspectives: responses,
      consensus: this.findConsensus(responses),
      timestamp: new Date(),
    };
    return synthesis;
  }

  findConsensus(responses) {
    // Simple majority voting
    const votes = new Map();
    for (const r of responses) {
      const key = JSON.stringify(r.recommendation || r.answer);
      votes.set(key, (votes.get(key) || 0) + 1);
    }

    let maxVotes = 0;
    let consensus = null;
    for (const [key, count] of votes) {
      if (count > maxVotes) {
        maxVotes = count;
        consensus = JSON.parse(key);
      }
    }

    return { value: consensus, confidence: maxVotes / responses.length };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BACKEND MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  addBackend(backend) {
    this.backends.push(backend);
    this.emit('backendAdded', backend);
    return { success: true, backends: this.backends.length };
  }

  getAvailableBackend(requirements = {}) {
    // Find best backend for requirements
    return (
      this.backends.find(b => {
        if (requirements.model && !b.models.includes(requirements.model)) return false;
        if (requirements.gpu && b.gpu !== requirements.gpu) return false;
        return true;
      }) || this.backends[0]
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATS & MONITORING
  // ─────────────────────────────────────────────────────────────────────────

  getStatus() {
    return {
      running: this.isRunning,
      swarms: this.swarms.size,
      totalAgents: Array.from(this.swarms.values()).reduce((sum, s) => sum + s.agents.length, 0),
      stats: this.stats,
      backends: this.backends.length,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT SWARM
// ═══════════════════════════════════════════════════════════════════════════

class AgentSwarm extends EventEmitter {
  constructor(options) {
    super();
    this.name = options.name;
    this.type = options.type || 'general';
    this.hiveMind = options.hiveMind;
    this.agents = [];
    this.capabilities = options.capabilities || [];
    this.model = options.model || 'qwen2.5-coder:32b';
    this.agentCount = options.agentCount || 10;
    this.autoScale = options.autoScale || false;
    this.minAgents = options.minAgents || 5;
    this.maxAgents = options.maxAgents || 50;
    this.isActive = false;
    this.taskResults = new Map();
    this.sharedMemory = new Map();
  }

  async initialize() {
    // Create agents
    for (let i = 0; i < this.agentCount; i++) {
      const agent = new SwarmAgent({
        id: `${this.name}-agent-${i}`,
        swarm: this,
        model: this.model,
        capabilities: this.capabilities,
      });
      this.agents.push(agent);
    }

    this.isActive = true;
    this.emit('initialized', { agents: this.agents.length });
    return { success: true, agents: this.agents.length };
  }

  async stop() {
    this.isActive = false;
    for (const agent of this.agents) {
      await agent.stop();
    }
    this.emit('stopped');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TASK MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  async broadcast(taskConfig) {
    const taskId = `task-${Date.now()}`;
    const results = [];

    this.emit('taskStarted', { taskId, task: taskConfig.task });

    // Send to all agents
    const promises = this.agents.map(agent =>
      agent
        .execute(taskConfig.task, taskConfig)
        .catch(err => ({ error: err.message, agent: agent.id }))
    );

    const agentResults = await Promise.all(promises);

    // Collect results
    for (const result of agentResults) {
      results.push(result);
    }

    this.taskResults.set(taskId, results);

    // Apply consensus if requested
    if (taskConfig.consensus) {
      const consensus = this.applyConsensus(results, taskConfig.consensus);
      return { taskId, results, consensus };
    }

    return { taskId, results };
  }

  async distribute(taskConfig) {
    const { files, operation, strategy } = taskConfig;
    const taskId = `dist-${Date.now()}`;
    const results = new Map();

    // Distribute files across agents
    const chunksPerAgent = Math.ceil(files.length / this.agents.length);

    for (let i = 0; i < this.agents.length; i++) {
      const startIdx = i * chunksPerAgent;
      const agentFiles = files.slice(startIdx, startIdx + chunksPerAgent);

      if (agentFiles.length > 0) {
        const result = await this.agents[i].execute(operation, { files: agentFiles });
        results.set(this.agents[i].id, result);
      }
    }

    return { taskId, results: Object.fromEntries(results) };
  }

  async collect(taskId) {
    return this.taskResults.get(taskId) || [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONSENSUS
  // ─────────────────────────────────────────────────────────────────────────

  async consensus(config) {
    const { question, options, votingMethod, quorum } = config;
    const votes = new Map();
    const reasonings = [];

    // Get votes from all agents
    for (const agent of this.agents) {
      const vote = await agent.vote(question, options);
      votes.set(agent.id, vote.choice);
      reasonings.push({ agent: agent.id, reasoning: vote.reasoning });
    }

    // Count votes
    const voteCounts = {};
    for (const option of options) {
      voteCounts[option] = 0;
    }
    for (const choice of votes.values()) {
      voteCounts[choice] = (voteCounts[choice] || 0) + 1;
    }

    // Determine winner
    let winner = null;
    let maxVotes = 0;
    for (const [option, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        winner = option;
      }
    }

    const participation = votes.size / this.agents.length;
    const meetsQuorum = participation >= (quorum || 0.5);

    return {
      winner: meetsQuorum ? winner : null,
      votes: voteCounts,
      participation,
      meetsQuorum,
      confidence: maxVotes / votes.size,
      reasonings,
    };
  }

  applyConsensus(results, method) {
    switch (method) {
      case 'majority':
        return this.majorityVote(results);
      case 'weighted':
        return this.weightedVote(results);
      case 'unanimous':
        return this.unanimousVote(results);
      default:
        return this.majorityVote(results);
    }
  }

  majorityVote(results) {
    const votes = new Map();
    for (const r of results) {
      if (r.recommendation) {
        const key = JSON.stringify(r.recommendation);
        votes.set(key, (votes.get(key) || 0) + 1);
      }
    }

    let best = null;
    let maxVotes = 0;
    for (const [key, count] of votes) {
      if (count > maxVotes) {
        maxVotes = count;
        best = JSON.parse(key);
      }
    }

    return { decision: best, votes: maxVotes, total: results.length };
  }

  weightedVote(results) {
    // Weight by agent confidence scores
    const weighted = new Map();
    for (const r of results) {
      if (r.recommendation && r.confidence) {
        const key = JSON.stringify(r.recommendation);
        weighted.set(key, (weighted.get(key) || 0) + r.confidence);
      }
    }

    let best = null;
    let maxWeight = 0;
    for (const [key, weight] of weighted) {
      if (weight > maxWeight) {
        maxWeight = weight;
        best = JSON.parse(key);
      }
    }

    return { decision: best, weight: maxWeight };
  }

  unanimousVote(results) {
    const first = results[0]?.recommendation;
    if (!first) return { decision: null, unanimous: false };

    const allSame = results.every(r => JSON.stringify(r.recommendation) === JSON.stringify(first));

    return { decision: allSame ? first : null, unanimous: allSame };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // KNOWLEDGE & MEMORY
  // ─────────────────────────────────────────────────────────────────────────

  async receiveKnowledge(scope, data) {
    this.sharedMemory.set(scope, data);

    // Update all agents
    for (const agent of this.agents) {
      agent.updateContext(scope, data);
    }
  }

  async queryAgents(question, roles) {
    const relevantAgents = this.agents.filter(
      a => roles.includes('default') || roles.some(r => a.capabilities.includes(r))
    );

    const responses = await Promise.all(relevantAgents.map(a => a.query(question)));

    return responses;
  }

  hasCapability(caps) {
    return caps.some(c => this.capabilities.includes(c) || c === 'default');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCALING
  // ─────────────────────────────────────────────────────────────────────────

  async addAgents(agentConfigs) {
    const added = [];
    for (const config of agentConfigs) {
      if (this.agents.length < this.maxAgents) {
        const agent = new SwarmAgent({
          id: `${this.name}-agent-${this.agents.length}`,
          swarm: this,
          ...config,
        });
        this.agents.push(agent);
        added.push(agent.id);
      }
    }
    return { added, total: this.agents.length };
  }

  async removeAgents(agentIds, graceful = true) {
    const removed = [];
    for (const id of agentIds) {
      const idx = this.agents.findIndex(a => a.id === id);
      if (idx !== -1) {
        if (graceful) {
          await this.agents[idx].waitForCompletion();
        }
        await this.agents[idx].stop();
        this.agents.splice(idx, 1);
        removed.push(id);
      }
    }
    return { removed, total: this.agents.length };
  }

  getStatus() {
    return {
      name: this.name,
      type: this.type,
      active: this.isActive,
      agents: this.agents.length,
      capabilities: this.capabilities,
      completedTasks: this.taskResults.size,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SWARM AGENT
// ═══════════════════════════════════════════════════════════════════════════

class SwarmAgent {
  constructor(options) {
    this.id = options.id;
    this.swarm = options.swarm;
    this.model = options.model;
    this.capabilities = options.capabilities || [];
    this.context = new Map();
    this.isActive = true;
    this.currentTask = null;
    this.stats = {
      tasksCompleted: 0,
      avgResponseTime: 0,
    };
  }

  async execute(task, options = {}) {
    this.currentTask = task;
    const startTime = Date.now();

    try {
      // Simulate LLM execution (in real implementation, call Ollama/LM Studio)
      const result = await this.callLLM(task, options);

      this.stats.tasksCompleted++;
      this.stats.avgResponseTime =
        (this.stats.avgResponseTime * (this.stats.tasksCompleted - 1) + (Date.now() - startTime)) /
        this.stats.tasksCompleted;

      return {
        agent: this.id,
        result,
        duration: Date.now() - startTime,
      };
    } finally {
      this.currentTask = null;
    }
  }

  async callLLM(task, options) {
    // This would integrate with Ollama/LM Studio/other backends
    // For now, return structured placeholder
    return {
      task,
      processed: true,
      recommendation: null, // Would contain actual LLM output
      confidence: 0.85,
    };
  }

  async vote(question, options) {
    // Agent votes on a question
    const result = await this.callLLM(`Vote on: ${question}\nOptions: ${options.join(', ')}`, {
      type: 'vote',
    });

    return {
      choice: options[0], // Would be actual LLM choice
      reasoning: 'Based on analysis...',
    };
  }

  async query(question) {
    return this.execute(question, { type: 'query' });
  }

  updateContext(scope, data) {
    this.context.set(scope, data);
  }

  async waitForCompletion() {
    while (this.currentTask) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  async stop() {
    this.isActive = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MCP TOOLS
// ═══════════════════════════════════════════════════════════════════════════

const hiveMindInstance = new HiveMind();

const hiveMindTools = [
  {
    name: 'swarm_create',
    description: 'Create a new agent swarm with specified capabilities.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Swarm name' },
        type: { type: 'string', description: 'Swarm type (coding, testing, security, etc.)' },
        agentCount: { type: 'number', description: 'Number of agents', default: 10 },
        capabilities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Agent capabilities',
        },
        model: { type: 'string', description: 'LLM model to use' },
        autoScale: { type: 'boolean', description: 'Enable auto-scaling' },
      },
      required: ['name'],
    },
  },
  {
    name: 'swarm_add_agents',
    description: 'Add agents to an existing swarm.',
    inputSchema: {
      type: 'object',
      properties: {
        swarm: { type: 'string', description: 'Swarm name' },
        agents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              model: { type: 'string' },
            },
          },
        },
      },
      required: ['swarm', 'agents'],
    },
  },
  {
    name: 'swarm_broadcast',
    description: 'Send a task to all agents in a swarm.',
    inputSchema: {
      type: 'object',
      properties: {
        swarm: { type: 'string', description: 'Swarm name' },
        task: { type: 'string', description: 'Task description' },
        priority: { type: 'string', enum: ['low', 'normal', 'high'] },
        timeout: { type: 'number', description: 'Timeout in ms' },
        consensus: { type: 'string', enum: ['majority', 'weighted', 'unanimous'] },
      },
      required: ['swarm', 'task'],
    },
  },
  {
    name: 'swarm_distribute',
    description: 'Distribute work across swarm agents.',
    inputSchema: {
      type: 'object',
      properties: {
        swarm: { type: 'string' },
        files: { type: 'array', items: { type: 'string' } },
        operation: { type: 'string' },
        strategy: { type: 'string', enum: ['round-robin', 'load-balanced', 'capability-match'] },
      },
      required: ['swarm', 'files', 'operation'],
    },
  },
  {
    name: 'swarm_collect',
    description: 'Collect results from a swarm task.',
    inputSchema: {
      type: 'object',
      properties: {
        swarm: { type: 'string' },
        taskId: { type: 'string' },
        format: { type: 'string', enum: ['merged', 'individual', 'diff'] },
      },
      required: ['swarm', 'taskId'],
    },
  },
  {
    name: 'swarm_consensus',
    description: 'Get swarm consensus on a decision.',
    inputSchema: {
      type: 'object',
      properties: {
        swarm: { type: 'string' },
        question: { type: 'string' },
        options: { type: 'array', items: { type: 'string' } },
        votingMethod: { type: 'string', enum: ['majority', 'weighted', 'ranked'] },
        quorum: { type: 'number', description: '0-1 participation threshold' },
      },
      required: ['swarm', 'question', 'options'],
    },
  },
  {
    name: 'swarm_status',
    description: 'Get real-time swarm status and metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        swarm: { type: 'string' },
        detailed: { type: 'boolean' },
      },
      required: ['swarm'],
    },
  },
  {
    name: 'hive_mind_sync',
    description: 'Synchronize knowledge across all agents.',
    inputSchema: {
      type: 'object',
      properties: {
        scope: { type: 'string', description: 'Knowledge scope (project, global, etc.)' },
        data: { type: 'object', description: 'Knowledge data to sync' },
        broadcast: { type: 'boolean', description: 'Broadcast to all swarms' },
      },
      required: ['scope', 'data'],
    },
  },
  {
    name: 'hive_mind_query',
    description: 'Query the collective intelligence.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        context: { type: 'string' },
        consultAgents: { type: 'array', items: { type: 'string' } },
        synthesize: { type: 'boolean' },
      },
      required: ['question'],
    },
  },
  {
    name: 'hive_mind_start',
    description: 'Start the Hive Mind system.',
    inputSchema: {
      type: 'object',
      properties: {
        maxAgents: { type: 'number' },
        defaultModel: { type: 'string' },
      },
    },
  },
  {
    name: 'hive_mind_stop',
    description: 'Stop the Hive Mind system.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'hive_mind_status',
    description: 'Get overall Hive Mind status.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Tool handlers
const hiveMindHandlers = {
  async swarm_create(params) {
    return hiveMindInstance.createSwarm(params).then(s => s.getStatus());
  },

  async swarm_add_agents({ swarm, agents }) {
    const s = hiveMindInstance.getSwarm(swarm);
    if (!s) return { error: 'Swarm not found' };
    return s.addAgents(agents);
  },

  async swarm_broadcast({ swarm, task, priority, timeout, consensus }) {
    const s = hiveMindInstance.getSwarm(swarm);
    if (!s) return { error: 'Swarm not found' };
    return s.broadcast({ task, priority, timeout, consensus });
  },

  async swarm_distribute({ swarm, files, operation, strategy }) {
    const s = hiveMindInstance.getSwarm(swarm);
    if (!s) return { error: 'Swarm not found' };
    return s.distribute({ files, operation, strategy });
  },

  async swarm_collect({ swarm, taskId, format }) {
    const s = hiveMindInstance.getSwarm(swarm);
    if (!s) return { error: 'Swarm not found' };
    return s.collect(taskId);
  },

  async swarm_consensus({ swarm, question, options, votingMethod, quorum }) {
    const s = hiveMindInstance.getSwarm(swarm);
    if (!s) return { error: 'Swarm not found' };
    return s.consensus({ question, options, votingMethod, quorum });
  },

  async swarm_status({ swarm, detailed }) {
    const s = hiveMindInstance.getSwarm(swarm);
    if (!s) return { error: 'Swarm not found' };
    return s.getStatus();
  },

  async hive_mind_sync({ scope, data, broadcast }) {
    return hiveMindInstance.syncKnowledge(scope, data);
  },

  async hive_mind_query({ question, context, consultAgents, synthesize }) {
    return hiveMindInstance.queryKnowledge(question, { context, consultAgents, synthesize });
  },

  async hive_mind_start({ maxAgents, defaultModel }) {
    hiveMindInstance.config.maxAgents = maxAgents || 100;
    hiveMindInstance.config.defaultModel = defaultModel || 'qwen2.5-coder:32b';
    return hiveMindInstance.start();
  },

  async hive_mind_stop() {
    return hiveMindInstance.stop();
  },

  async hive_mind_status() {
    return hiveMindInstance.getStatus();
  },
};

module.exports = {
  HiveMind,
  AgentSwarm,
  SwarmAgent,
  hiveMindTools,
  hiveMindHandlers,
  hiveMindInstance,
  registerTools: server => {
    hiveMindTools.forEach(tool => {
      server.tool(tool.name, tool.description, tool.inputSchema, async params =>
        hiveMindHandlers[tool.name](params)
      );
    });
  },
};
