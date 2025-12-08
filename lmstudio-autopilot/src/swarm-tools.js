/**
 * ============================================================================
 * WINDSURF VIBE SETUP - SWARM MCP TOOLS v4.1
 * ============================================================================
 * MCP tools for Hive Mind Swarm operations
 * ============================================================================
 */

const { hiveMind, SWARM_ROLES, SWARM_STATES } = require('./swarm/hive-mind');
const { mem0, MEMORY_TYPES } = require('./memory/mem0-local');

const swarmTools = {
  // =========================================================================
  // HIVE MIND CONTROL
  // =========================================================================
  
  hive_initialize: {
    name: 'hive_initialize',
    description: 'Initialize the Hive Mind swarm system for multi-agent collaboration',
    inputSchema: {
      type: 'object',
      properties: {
        ollamaUrl: { type: 'string', description: 'Ollama API URL', default: 'http://localhost:11434' },
        lmstudioUrl: { type: 'string', description: 'LM Studio API URL', default: 'http://localhost:1234' }
      }
    },
    handler: async (args) => {
      hiveMind.providers.ollama.url = args.ollamaUrl || hiveMind.providers.ollama.url;
      hiveMind.providers.lmstudio.url = args.lmstudioUrl || hiveMind.providers.lmstudio.url;
      await hiveMind.initialize();
      return hiveMind.getStatus();
    }
  },

  hive_status: {
    name: 'hive_status',
    description: 'Get the current status of the Hive Mind swarm system',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => hiveMind.getStatus()
  },

  hive_spawn_swarm: {
    name: 'hive_spawn_swarm',
    description: 'Spawn a new swarm of agents for a complex task. Agents collaborate like a hive mind.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Description of the task for the swarm to complete' },
        maxAgents: { type: 'number', description: 'Maximum number of agents to recruit', default: 10 }
      },
      required: ['task']
    },
    handler: async ({ task, maxAgents = 10 }) => {
      const swarm = await hiveMind.spawnSwarm(task, { maxAgents });
      return {
        swarmId: swarm.id,
        agentCount: swarm.agents.length,
        roles: swarm.agents.map(a => a.role),
        state: swarm.state
      };
    }
  },

  hive_execute_swarm: {
    name: 'hive_execute_swarm',
    description: 'Execute a spawned swarm task with all agents working together',
    inputSchema: {
      type: 'object',
      properties: {
        swarmId: { type: 'string', description: 'ID of the swarm to execute' }
      },
      required: ['swarmId']
    },
    handler: async ({ swarmId }) => {
      return await hiveMind.executeSwarmTask(swarmId);
    }
  },

  hive_run_task: {
    name: 'hive_run_task',
    description: 'Spawn and immediately execute a swarm task in one command',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task for the swarm to complete' }
      },
      required: ['task']
    },
    handler: async ({ task }) => {
      const swarm = await hiveMind.spawnSwarm(task);
      return await hiveMind.executeSwarmTask(swarm.id);
    }
  },

  // =========================================================================
  // MEMORY OPERATIONS (Mem0 Integration)
  // =========================================================================

  memory_initialize: {
    name: 'memory_initialize',
    description: 'Initialize the Mem0 persistent memory system',
    inputSchema: {
      type: 'object',
      properties: {
        storagePath: { type: 'string', description: 'Path to store memories' }
      }
    },
    handler: async ({ storagePath }) => {
      if (storagePath) mem0.storagePath = storagePath;
      await mem0.initialize();
      return mem0.getStats();
    }
  },

  memory_add: {
    name: 'memory_add',
    description: 'Add a new memory to the persistent store',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Content to remember' },
        type: { 
          type: 'string', 
          enum: ['conversation', 'preference', 'knowledge', 'task', 'code', 'relationship'],
          default: 'knowledge'
        },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['content']
    },
    handler: async ({ content, type, tags, metadata }) => {
      return await mem0.add(content, { type, tags: tags || [], metadata: metadata || {} });
    }
  },

  memory_search: {
    name: 'memory_search',
    description: 'Search memories using semantic similarity',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results', default: 10 },
        type: { type: 'string', description: 'Filter by memory type' }
      },
      required: ['query']
    },
    handler: async ({ query, limit = 10, type }) => {
      return await mem0.search(query, { limit, type });
    }
  },

  memory_get: {
    name: 'memory_get',
    description: 'Get a specific memory by ID',
    inputSchema: {
      type: 'object',
      properties: {
        memoryId: { type: 'string', description: 'Memory ID' }
      },
      required: ['memoryId']
    },
    handler: async ({ memoryId }) => await mem0.get(memoryId)
  },

  memory_update: {
    name: 'memory_update',
    description: 'Update an existing memory',
    inputSchema: {
      type: 'object',
      properties: {
        memoryId: { type: 'string', description: 'Memory ID' },
        content: { type: 'string', description: 'New content' },
        tags: { type: 'array', items: { type: 'string' } },
        metadata: { type: 'object' }
      },
      required: ['memoryId']
    },
    handler: async ({ memoryId, ...updates }) => await mem0.update(memoryId, updates)
  },

  memory_delete: {
    name: 'memory_delete',
    description: 'Delete a memory',
    inputSchema: {
      type: 'object',
      properties: {
        memoryId: { type: 'string', description: 'Memory ID' }
      },
      required: ['memoryId']
    },
    handler: async ({ memoryId }) => await mem0.delete(memoryId)
  },

  memory_relate: {
    name: 'memory_relate',
    description: 'Create a relationship between two memories',
    inputSchema: {
      type: 'object',
      properties: {
        fromId: { type: 'string', description: 'Source memory ID' },
        toId: { type: 'string', description: 'Target memory ID' },
        type: { type: 'string', description: 'Relationship type' }
      },
      required: ['fromId', 'toId', 'type']
    },
    handler: async ({ fromId, toId, type }) => await mem0.addRelationship(fromId, toId, type)
  },

  memory_stats: {
    name: 'memory_stats',
    description: 'Get memory system statistics',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => mem0.getStats()
  },

  // =========================================================================
  // COMBINED SWARM + MEMORY OPERATIONS
  // =========================================================================

  swarm_with_memory: {
    name: 'swarm_with_memory',
    description: 'Run a swarm task with context from memory',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task description' },
        contextQuery: { type: 'string', description: 'Query to retrieve relevant memories' },
        saveResult: { type: 'boolean', description: 'Save result to memory', default: true }
      },
      required: ['task']
    },
    handler: async ({ task, contextQuery, saveResult = true }) => {
      // Get relevant memories
      let context = [];
      if (contextQuery) {
        context = await mem0.search(contextQuery, { limit: 5 });
      }
      
      // Spawn and execute swarm with context
      const swarm = await hiveMind.spawnSwarm(task);
      swarm.sharedContext.memories = context;
      
      const result = await hiveMind.executeSwarmTask(swarm.id);
      
      // Save result to memory
      if (saveResult && result.result) {
        await mem0.add(JSON.stringify(result.result), {
          type: MEMORY_TYPES.TASK,
          tags: ['swarm-result', swarm.id],
          metadata: { swarmId: swarm.id, task }
        });
      }
      
      return result;
    }
  }
};

module.exports = { swarmTools };
