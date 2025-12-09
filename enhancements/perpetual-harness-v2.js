/**
 * Perpetual Harness v2.0 - Enhanced Edition
 * Integrates all v5.0 enhancements while maintaining backward compatibility
 */

const fs = require('fs');
const path = require('path');

// Load original harness
let PerpetualHarnessOriginal;
try {
  PerpetualHarnessOriginal = require('../perpetual-harness');
} catch (error) {
  // If original doesn't exist, create basic class
  const { EventEmitter } = require('events');
  PerpetualHarnessOriginal = class extends EventEmitter {
    constructor() {
      super();
      this.config = {};
      this.agents = [];
    }
    async initialize() {}
    getStatus() {
      return { original: true };
    }
  };
}

// Load enhancement modules
const AgentStateManager = require('./core/agent-state-manager');
const EnhancedMemorySystem = require('./core/enhanced-memory-system');
const WorkflowGraphEngine = require('./core/workflow-graph-engine');
const AgentHandoffSystem = require('./core/agent-handoff-system');

class PerpetualHarnessEnhanced extends PerpetualHarnessOriginal {
  constructor(options = {}) {
    super(options);

    // Version info
    this.version = 'v2.0-enhanced';
    this.features = {
      stateful: true,
      memory: true,
      handoffs: true,
      workflow: true,
      observability: true,
    };

    // Configuration
    this.config = {
      ...this.config,
      ...options,
      enhancementsEnabled: options.enhancementsEnabled !== false,
    };

    // Enhancement modules
    this.stateManager = null;
    this.memory = null;
    this.workflow = null;
    this.handoffs = null;

    // Enhanced agents map
    this.enhancedAgents = new Map();

    // Statistics
    this.stats = {
      startTime: Date.now(),
      tasksProcessed: 0,
      handoffsPerformed: 0,
      checkpointsCreated: 0,
      memoriesStored: 0,
    };
  }

  /**
   * Initialize enhanced harness
   */
  async initialize() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🚀 PERPETUAL HARNESS v2.0 - ENHANCED              ║
║                                                              ║
║  Features:                                                   ║
║  ✅ Stateful Agent Persistence                             ║
║  ✅ Enhanced Memory System (5 levels)                      ║
║  ✅ Workflow Graph Engine                                  ║
║  ✅ Agent Handoff System                                   ║
║  ✅ 100% Backward Compatible                               ║
╚══════════════════════════════════════════════════════════════╝
    `);

    try {
      // Initialize original functionality
      if (super.initialize) {
        await super.initialize();
      }

      // Initialize enhancements
      if (this.config.enhancementsEnabled) {
        await this.initializeEnhancements();
      }

      console.log('✅ Enhanced Perpetual Harness initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Harness:', error);
      throw error;
    }
  }

  /**
   * Initialize enhancement modules
   */
  async initializeEnhancements() {
    console.log('🚀 Initializing Enhanced Features...');

    // 1. State Management
    this.stateManager = new AgentStateManager({
      stateDir: path.join(process.cwd(), 'state'),
      checkpointInterval: this.config.checkpointInterval || 300000,
      autoRecover: true,
    });
    await this.stateManager.initialize();

    // Try auto-recovery
    if (this.stateManager.autoRecover) {
      try {
        const recovered = await this.stateManager.autoRecover();
        if (recovered) {
          console.log('✅ Recovered from last checkpoint');
        }
      } catch (error) {
        console.log('ℹ️ No checkpoint to recover from');
      }
    }

    // 2. Memory System
    this.memory = new EnhancedMemorySystem({
      memoryDir: path.join(process.cwd(), 'memory'),
      consolidationInterval: this.config.consolidationInterval || 3600000,
    });
    await this.memory.initialize();

    // 3. Workflow Engine
    this.workflow = new WorkflowGraphEngine({
      maxHistorySize: 100,
    });
    await this.workflow.initialize();

    // 4. Agent Handoffs
    this.handoffs = new AgentHandoffSystem({
      maxHistorySize: 100,
    });
    await this.handoffs.initialize();

    // Hook into agent spawning
    await this.enhanceAgentSpawning();

    // Enable checkpointing
    this.enableCheckpointing();

    // Setup event listeners
    this.setupEventListeners();

    console.log('✅ Enhanced Features Ready');
  }

  /**
   * Enhance agent spawning
   */
  async enhanceAgentSpawning() {
    // Override original agent creation if it exists
    const originalSpawnAgent = this.spawnAgent?.bind(this);

    this.spawnAgent = async (id, type = 'general') => {
      let agent;

      // Call original if exists
      if (originalSpawnAgent) {
        agent = await originalSpawnAgent(id, type);
      } else {
        // Create basic agent
        agent = {
          id: `agent-${id}`,
          type,
          status: 'ready',
        };
      }

      // Enhance with new capabilities
      if (this.config.enhancementsEnabled) {
        agent = await this.enhanceAgent(agent);
      }

      // Store enhanced agent
      this.enhancedAgents.set(agent.id, agent);

      // Add to agents array if it exists
      if (!this.agents) {
        this.agents = [];
      }
      this.agents.push(agent);

      return agent;
    };
  }

  /**
   * Enhance an agent with v5.0 capabilities
   */
  async enhanceAgent(agent) {
    // Add memory capability
    if (this.memory) {
      agent.memory = this.memory.createAgentMemory(agent.id);
    }

    // Load or create state
    if (this.stateManager) {
      const stateData = await this.stateManager.loadAgentState(agent.id);
      agent.state = stateData.state;
      agent.metadata = stateData.metadata;
    }

    // Add handoff capability
    if (this.handoffs) {
      agent.handoff = this.handoffs.createHandoffCapability(agent);
    }

    // Add workflow execution
    agent.executeWorkflow = async (workflowName, initialState) => {
      if (!this.workflow) {
        throw new Error('Workflow engine not initialized');
      }

      return await this.workflow.execute(workflowName, {
        ...initialState,
        agentId: agent.id,
      });
    };

    // Add task processing with memory
    agent.processTask = async task => {
      const startTime = Date.now();

      try {
        // Check memory for similar tasks
        if (agent.memory) {
          const similar = await agent.memory.recall(task.description || task);
          if (similar.length > 0) {
            console.log(`Agent ${agent.id}: Found ${similar.length} similar tasks in memory`);
          }
        }

        // Process task (simplified)
        const result = {
          success: true,
          agentId: agent.id,
          task,
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        };

        // Store in memory
        if (agent.memory) {
          await agent.memory.remember(`task-${Date.now()}`, { task, result }, { importance: 0.7 });
        }

        // Update state
        if (agent.state) {
          agent.state.lastTask = task;
          agent.state.lastResult = result;
          agent.metadata.tasksCompleted = (agent.metadata.tasksCompleted || 0) + 1;

          // Save state
          if (this.stateManager) {
            await this.stateManager.saveAgentState(agent.id, agent.state);
          }
        }

        // Update stats
        this.stats.tasksProcessed++;

        return result;
      } catch (error) {
        console.error(`Agent ${agent.id} error:`, error);

        // Store error in memory
        if (agent.memory) {
          await agent.memory.remember(
            `error-${Date.now()}`,
            { task, error: error.message },
            { importance: 0.9 }
          );
        }

        throw error;
      }
    };

    return agent;
  }

  /**
   * Enable automatic checkpointing
   */
  enableCheckpointing() {
    if (!this.stateManager) return;

    // Listen for checkpoint events
    this.stateManager.on('checkpointCreated', ({ id, timestamp }) => {
      this.stats.checkpointsCreated++;
      console.log(`💾 Checkpoint created: ${id}`);
    });

    // Manual checkpoint method
    this.createCheckpoint = async (metadata = {}) => {
      return await this.stateManager.createCheckpoint({
        ...metadata,
        stats: this.stats,
        agentCount: this.enhancedAgents.size,
      });
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Memory events
    if (this.memory) {
      this.memory.on('remembered', ({ key, type }) => {
        this.stats.memoriesStored++;
      });

      this.memory.on('consolidated', stats => {
        console.log('🧠 Memory consolidated:', stats);
      });
    }

    // Workflow events
    if (this.workflow) {
      this.workflow.on('executionStarted', ({ id, workflow }) => {
        console.log(`⚙️ Workflow started: ${workflow} (${id})`);
      });

      this.workflow.on('executionCompleted', ({ id, duration }) => {
        console.log(`✅ Workflow completed in ${duration}ms`);
      });
    }

    // Handoff events
    if (this.handoffs) {
      this.handoffs.on('handoffPerformed', ({ fromAgent, toAgent, reason }) => {
        this.stats.handoffsPerformed++;
        console.log(`🔄 Handoff: ${fromAgent} → ${toAgent} (${reason})`);
      });
    }
  }

  /**
   * Execute task with smart routing
   */
  async executeTask(task) {
    // Use handoff system if available
    if (this.handoffs) {
      try {
        return await this.handoffs.routeTask(task);
      } catch (error) {
        console.warn('⚠️ Handoff routing failed, using fallback');
      }
    }

    // Fallback to simple execution
    if (this.enhancedAgents.size > 0) {
      const agent = this.enhancedAgents.values().next().value;
      return await agent.processTask(task);
    }

    throw new Error('No agents available');
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowName, initialState = {}) {
    if (!this.workflow) {
      throw new Error('Workflow engine not initialized');
    }

    const result = await this.workflow.execute(workflowName, initialState);

    // Store workflow result in memory
    if (this.memory) {
      await this.memory.remember(`workflow-${workflowName}-${Date.now()}`, result, 'episodic', {
        importance: 0.8,
      });
    }

    return result;
  }

  /**
   * Query memory
   */
  async queryMemory(query, options = {}) {
    if (!this.memory) {
      throw new Error('Memory system not initialized');
    }

    return await this.memory.recall(query, options.type || 'all', options);
  }

  /**
   * Get enhanced status
   */
  getEnhancedStatus() {
    const originalStatus = super.getStatus ? super.getStatus() : {};

    return {
      ...originalStatus,
      version: this.version,
      features: this.features,
      enhanced: {
        stateManager: this.stateManager?.getStatus() || null,
        memory: this.memory?.getStatus() || null,
        workflow: this.workflow?.getStatus() || null,
        handoffs: this.handoffs?.getStatus() || null,
      },
      stats: {
        ...this.stats,
        uptime: Date.now() - this.stats.startTime,
        agentsEnhanced: this.enhancedAgents.size,
      },
    };
  }

  /**
   * Backward compatible getStatus
   */
  getStatus() {
    return this.getEnhancedStatus();
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down Enhanced Perpetual Harness...');

    try {
      // Create final checkpoint
      if (this.stateManager) {
        await this.createCheckpoint({ reason: 'shutdown' });
        await this.stateManager.shutdown();
      }

      // Shutdown enhancement modules
      if (this.memory) {
        await this.memory.shutdown();
      }

      if (this.workflow) {
        await this.workflow.shutdown();
      }

      if (this.handoffs) {
        await this.handoffs.shutdown();
      }

      // Call original shutdown if exists
      if (super.shutdown) {
        await super.shutdown();
      }

      console.log('✅ Enhanced Perpetual Harness shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  /**
   * Spawn multiple enhanced agents
   */
  async spawnAgents(count = 120) {
    console.log(`🤖 Spawning ${count} enhanced agents...`);

    const agents = [];
    const types = [
      'frontend',
      'backend',
      'database',
      'ai',
      'devops',
      'testing',
      'debug',
      'security',
      'optimization',
      'architecture',
    ];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const agent = await this.spawnAgent(i, type);
      agents.push(agent);
    }

    console.log(`✅ ${count} enhanced agents spawned`);
    return agents;
  }
}

// Export both versions for compatibility
module.exports = PerpetualHarnessEnhanced;
module.exports.PerpetualHarnessOriginal = PerpetualHarnessOriginal;
module.exports.PerpetualHarnessEnhanced = PerpetualHarnessEnhanced;
