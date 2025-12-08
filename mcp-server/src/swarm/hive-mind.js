/**
 * ============================================================================
 * WINDSURF VIBE SETUP - HIVE MIND SWARM ARCHITECTURE v4.1
 * ============================================================================
 * Swarm intelligence system enabling 100+ agents to work as a unified hive mind
 * Seamlessly integrates Windsurf, LM Studio, Ollama, and other LLM providers
 * ============================================================================
 */

const EventEmitter = require('events');

const SWARM_STATES = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  ACTIVE: 'active',
  PROCESSING: 'processing',
  SYNCING: 'syncing',
  RECOVERING: 'recovering',
  TERMINATED: 'terminated'
};

const SWARM_ROLES = {
  QUEEN: 'queen',           // Central coordinator
  WORKER: 'worker',         // Task executors
  SCOUT: 'scout',           // Information gatherers
  SOLDIER: 'soldier',       // Security/validation
  NURSE: 'nurse',           // Health monitoring
  DRONE: 'drone',           // Data transfer
  ARCHITECT: 'architect'    // System design
};

class HiveMind extends EventEmitter {
  constructor(options = {}) {
    super();
    this.id = `hive_${Date.now()}`;
    this.state = SWARM_STATES.IDLE;
    this.agents = new Map();
    this.activeSwarms = new Map();
    this.sharedMemory = new Map();
    this.taskQueue = [];
    this.completedTasks = [];
    
    // LLM Provider Configuration
    this.providers = {
      ollama: { url: options.ollamaUrl || 'http://localhost:11434', active: true },
      lmstudio: { url: options.lmstudioUrl || 'http://localhost:1234', active: true },
      openai: { url: 'https://api.openai.com/v1', active: false },
      anthropic: { url: 'https://api.anthropic.com', active: false }
    };
    
    // Swarm Configuration
    this.config = {
      maxSwarmSize: options.maxSwarmSize || 50,
      maxConcurrentTasks: options.maxConcurrentTasks || 10,
      syncInterval: options.syncInterval || 5000,
      healthCheckInterval: options.healthCheckInterval || 10000,
      memoryPersistPath: options.memoryPersistPath || null
    };
    
    this.stats = {
      totalTasksProcessed: 0,
      totalAgentsCreated: 0,
      totalSwarmsSpawned: 0,
      averageTaskDuration: 0,
      memoryUsage: 0
    };
  }

  /**
   * Initialize the Hive Mind system
   */
  async initialize() {
    this.state = SWARM_STATES.INITIALIZING;
    this.emit('initializing', { hiveId: this.id });
    
    console.log('🐝 Initializing Hive Mind Swarm System...');
    
    // Check available LLM providers
    await this.discoverProviders();
    
    // Start background processes
    this.startSyncDaemon();
    this.startHealthMonitor();
    
    this.state = SWARM_STATES.ACTIVE;
    this.emit('initialized', { 
      hiveId: this.id, 
      providers: Object.keys(this.providers).filter(p => this.providers[p].active) 
    });
    
    console.log(`✅ Hive Mind active with ${this.agents.size} agents ready`);
    return this;
  }

  /**
   * Discover and verify available LLM providers
   */
  async discoverProviders() {
    const checks = [];
    
    // Check Ollama
    checks.push(this.checkProvider('ollama', `${this.providers.ollama.url}/api/tags`));
    
    // Check LM Studio
    checks.push(this.checkProvider('lmstudio', `${this.providers.lmstudio.url}/v1/models`));
    
    const results = await Promise.allSettled(checks);
    
    results.forEach((result, idx) => {
      const provider = ['ollama', 'lmstudio'][idx];
      this.providers[provider].active = result.status === 'fulfilled' && result.value;
    });
    
    const activeProviders = Object.entries(this.providers)
      .filter(([_, v]) => v.active)
      .map(([k, _]) => k);
    
    console.log(`📡 Active LLM providers: ${activeProviders.join(', ') || 'none'}`);
    return activeProviders;
  }

  async checkProvider(name, url) {
    try {
      const response = await fetch(url, { method: 'GET', timeout: 5000 });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Spawn a new swarm for a complex task
   */
  async spawnSwarm(taskDescription, options = {}) {
    const swarmId = `swarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const swarm = {
      id: swarmId,
      task: taskDescription,
      agents: [],
      state: 'spawning',
      createdAt: new Date().toISOString(),
      sharedContext: {},
      results: []
    };
    
    // Determine required agents based on task analysis
    const requiredRoles = this.analyzeTaskRequirements(taskDescription);
    
    // Recruit agents for the swarm
    for (const role of requiredRoles) {
      const agent = await this.recruitAgent(role, swarmId);
      swarm.agents.push(agent);
    }
    
    this.activeSwarms.set(swarmId, swarm);
    this.stats.totalSwarmsSpawned++;
    
    this.emit('swarmSpawned', { swarmId, agentCount: swarm.agents.length, task: taskDescription });
    console.log(`🐝 Swarm ${swarmId} spawned with ${swarm.agents.length} agents`);
    
    return swarm;
  }

  /**
   * Analyze task to determine required agent roles
   */
  analyzeTaskRequirements(taskDescription) {
    const task = taskDescription.toLowerCase();
    const roles = new Set();
    
    // Always need a coordinator
    roles.add(SWARM_ROLES.QUEEN);
    
    // Pattern matching for task requirements
    const patterns = {
      [SWARM_ROLES.ARCHITECT]: ['design', 'architect', 'plan', 'structure', 'database', 'api'],
      [SWARM_ROLES.WORKER]: ['code', 'implement', 'build', 'create', 'write', 'develop'],
      [SWARM_ROLES.SCOUT]: ['research', 'find', 'search', 'discover', 'analyze'],
      [SWARM_ROLES.SOLDIER]: ['security', 'audit', 'test', 'validate', 'review'],
      [SWARM_ROLES.NURSE]: ['fix', 'debug', 'repair', 'heal', 'recover'],
      [SWARM_ROLES.DRONE]: ['deploy', 'transfer', 'sync', 'migrate', 'publish']
    };
    
    for (const [role, keywords] of Object.entries(patterns)) {
      if (keywords.some(kw => task.includes(kw))) {
        roles.add(role);
      }
    }
    
    // Default: add workers for general tasks
    if (roles.size === 1) {
      roles.add(SWARM_ROLES.WORKER);
    }
    
    return Array.from(roles);
  }

  /**
   * Recruit an agent for a specific role
   */
  async recruitAgent(role, swarmId) {
    const agentId = `agent_${role}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const agent = {
      id: agentId,
      role,
      swarmId,
      state: 'ready',
      provider: this.selectBestProvider(),
      model: this.selectModelForRole(role),
      tasksCompleted: 0,
      createdAt: new Date().toISOString()
    };
    
    this.agents.set(agentId, agent);
    this.stats.totalAgentsCreated++;
    
    return agent;
  }

  /**
   * Select the best available LLM provider
   */
  selectBestProvider() {
    // Prefer Ollama for local, then LM Studio
    if (this.providers.ollama.active) return 'ollama';
    if (this.providers.lmstudio.active) return 'lmstudio';
    return 'ollama'; // Default fallback
  }

  /**
   * Select appropriate model for agent role
   */
  selectModelForRole(role) {
    const roleModels = {
      [SWARM_ROLES.QUEEN]: 'qwen2.5-coder:32b',
      [SWARM_ROLES.ARCHITECT]: 'qwen2.5-coder:32b',
      [SWARM_ROLES.WORKER]: 'deepseek-coder-v2:16b',
      [SWARM_ROLES.SCOUT]: 'llama3.1:8b',
      [SWARM_ROLES.SOLDIER]: 'qwen2.5-coder:14b',
      [SWARM_ROLES.NURSE]: 'codellama:13b',
      [SWARM_ROLES.DRONE]: 'phi3:14b'
    };
    return roleModels[role] || 'qwen2.5-coder:14b';
  }

  /**
   * Execute a swarm task with collaborative processing
   */
  async executeSwarmTask(swarmId) {
    const swarm = this.activeSwarms.get(swarmId);
    if (!swarm) throw new Error(`Swarm ${swarmId} not found`);
    
    swarm.state = 'executing';
    this.emit('swarmExecuting', { swarmId });
    
    const startTime = Date.now();
    
    try {
      // Phase 1: Queen coordinates and plans
      const queen = swarm.agents.find(a => a.role === SWARM_ROLES.QUEEN);
      const plan = await this.runAgent(queen, {
        task: `Plan execution for: ${swarm.task}`,
        context: swarm.sharedContext
      });
      
      swarm.sharedContext.plan = plan;
      
      // Phase 2: Distribute work to workers
      const workers = swarm.agents.filter(a => 
        [SWARM_ROLES.WORKER, SWARM_ROLES.ARCHITECT, SWARM_ROLES.SCOUT].includes(a.role)
      );
      
      const workerResults = await Promise.all(
        workers.map(worker => this.runAgent(worker, {
          task: swarm.task,
          context: swarm.sharedContext,
          plan: plan
        }))
      );
      
      swarm.sharedContext.workerResults = workerResults;
      
      // Phase 3: Soldiers validate
      const soldiers = swarm.agents.filter(a => a.role === SWARM_ROLES.SOLDIER);
      if (soldiers.length > 0) {
        const validationResults = await Promise.all(
          soldiers.map(soldier => this.runAgent(soldier, {
            task: 'Validate and review results',
            context: swarm.sharedContext
          }))
        );
        swarm.sharedContext.validation = validationResults;
      }
      
      // Phase 4: Queen synthesizes final result
      const finalResult = await this.runAgent(queen, {
        task: 'Synthesize final result from all agent outputs',
        context: swarm.sharedContext
      });
      
      swarm.results.push(finalResult);
      swarm.state = 'completed';
      
      const duration = Date.now() - startTime;
      this.stats.totalTasksProcessed++;
      this.stats.averageTaskDuration = 
        (this.stats.averageTaskDuration * (this.stats.totalTasksProcessed - 1) + duration) 
        / this.stats.totalTasksProcessed;
      
      this.emit('swarmCompleted', { swarmId, duration, result: finalResult });
      
      return {
        swarmId,
        result: finalResult,
        duration,
        agentsUsed: swarm.agents.length
      };
      
    } catch (error) {
      swarm.state = 'failed';
      this.emit('swarmFailed', { swarmId, error: error.message });
      throw error;
    }
  }

  /**
   * Run a single agent with given context
   */
  async runAgent(agent, context) {
    agent.state = 'working';
    
    const prompt = this.buildAgentPrompt(agent, context);
    const response = await this.callLLM(agent.provider, agent.model, prompt);
    
    agent.tasksCompleted++;
    agent.state = 'ready';
    
    // Share result with hive memory
    this.shareToHiveMemory(agent.id, response);
    
    return response;
  }

  /**
   * Build specialized prompt for agent role
   */
  buildAgentPrompt(agent, context) {
    const roleInstructions = {
      [SWARM_ROLES.QUEEN]: 'You are the QUEEN - the central coordinator. Plan, delegate, and synthesize.',
      [SWARM_ROLES.WORKER]: 'You are a WORKER - execute tasks efficiently and thoroughly.',
      [SWARM_ROLES.SCOUT]: 'You are a SCOUT - gather information and explore possibilities.',
      [SWARM_ROLES.SOLDIER]: 'You are a SOLDIER - validate, test, and secure the outputs.',
      [SWARM_ROLES.NURSE]: 'You are a NURSE - fix issues and maintain system health.',
      [SWARM_ROLES.DRONE]: 'You are a DRONE - handle data transfer and deployment.',
      [SWARM_ROLES.ARCHITECT]: 'You are an ARCHITECT - design systems and structures.'
    };
    
    return `${roleInstructions[agent.role]}

TASK: ${context.task}

${context.plan ? `PLAN:\n${JSON.stringify(context.plan, null, 2)}` : ''}
${context.workerResults ? `PREVIOUS RESULTS:\n${JSON.stringify(context.workerResults, null, 2)}` : ''}

Provide your expert contribution:`;
  }

  /**
   * Call LLM via appropriate provider
   */
  async callLLM(provider, model, prompt) {
    const config = this.providers[provider];
    if (!config.active) {
      throw new Error(`Provider ${provider} is not active`);
    }
    
    try {
      if (provider === 'ollama') {
        const response = await fetch(`${config.url}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: { temperature: 0.7 }
          })
        });
        const data = await response.json();
        return data.response;
      }
      
      if (provider === 'lmstudio') {
        const response = await fetch(`${config.url}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
          })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
      
    } catch (error) {
      console.error(`LLM call failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Share data to hive shared memory
   */
  shareToHiveMemory(agentId, data) {
    const key = `${agentId}_${Date.now()}`;
    this.sharedMemory.set(key, {
      agentId,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Prune old memories (keep last 1000)
    if (this.sharedMemory.size > 1000) {
      const oldest = Array.from(this.sharedMemory.keys()).slice(0, 100);
      oldest.forEach(k => this.sharedMemory.delete(k));
    }
    
    this.stats.memoryUsage = this.sharedMemory.size;
  }

  /**
   * Start background sync daemon
   */
  startSyncDaemon() {
    this.syncInterval = setInterval(() => {
      this.syncSwarms();
    }, this.config.syncInterval);
  }

  /**
   * Sync all active swarms
   */
  syncSwarms() {
    for (const [swarmId, swarm] of this.activeSwarms) {
      if (swarm.state === 'completed' || swarm.state === 'failed') {
        // Archive completed swarms
        this.completedTasks.push(swarm);
        this.activeSwarms.delete(swarmId);
      }
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitor() {
    this.healthInterval = setInterval(() => {
      this.checkHealth();
    }, this.config.healthCheckInterval);
  }

  /**
   * Check system health
   */
  async checkHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      state: this.state,
      activeSwarms: this.activeSwarms.size,
      totalAgents: this.agents.size,
      memoryUsage: this.sharedMemory.size,
      providers: {}
    };
    
    // Check provider health
    for (const [name, config] of Object.entries(this.providers)) {
      if (config.active) {
        health.providers[name] = await this.checkProvider(name, 
          name === 'ollama' ? `${config.url}/api/tags` : `${config.url}/v1/models`
        );
      }
    }
    
    this.emit('healthCheck', health);
    return health;
  }

  /**
   * Get hive status
   */
  getStatus() {
    return {
      hiveId: this.id,
      state: this.state,
      activeSwarms: this.activeSwarms.size,
      totalAgents: this.agents.size,
      stats: this.stats,
      providers: Object.fromEntries(
        Object.entries(this.providers).map(([k, v]) => [k, v.active])
      )
    };
  }

  /**
   * Shutdown the hive mind
   */
  async shutdown() {
    this.state = SWARM_STATES.TERMINATED;
    clearInterval(this.syncInterval);
    clearInterval(this.healthInterval);
    
    // Terminate all active swarms
    for (const swarmId of this.activeSwarms.keys()) {
      this.activeSwarms.get(swarmId).state = 'terminated';
    }
    
    this.emit('shutdown', { hiveId: this.id });
    console.log('🐝 Hive Mind shutdown complete');
  }
}

// Export
const hiveMind = new HiveMind();
module.exports = { HiveMind, hiveMind, SWARM_STATES, SWARM_ROLES };
