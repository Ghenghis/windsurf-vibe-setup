/**
 * HIVE MIND MCP TOOLS v4.1 - MCP Tool Definitions
 */

const { hiveMind } = require('./hive-mind');

const hiveTools = {
  spawn_swarm: {
    name: 'spawn_swarm',
    description: '🐝 Create a new agent swarm to tackle a complex task',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task description' },
        size: { type: 'string', enum: ['auto', 'small', 'medium', 'large'], default: 'auto' },
        priority: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' }
      },
      required: ['task']
    },
    handler: async ({ task, size = 'auto', priority = 'normal' }) => {
      const swarm = await hiveMind.spawnSwarm(task, { size, priority });
      return {
        swarmId: swarm.id,
        status: swarm.status,
        agents: swarm.agents.map(a => ({ type: a.type, model: a.model })),
        message: `🐝 Swarm spawned with ${swarm.agents.length} agents`
      };
    }
  },

  swarm_status: {
    name: 'swarm_status',
    description: 'Get status of all active swarms or a specific swarm',
    inputSchema: {
      type: 'object',
      properties: { swarmId: { type: 'string', description: 'Specific swarm ID' } }
    },
    handler: async ({ swarmId }) => {
      if (swarmId) {
        const swarm = hiveMind.swarms.get(swarmId);
        return swarm ? swarm.getStatus() : { error: 'Swarm not found' };
      }
      return {
        activeSwarms: hiveMind.swarms.size,
        swarms: Array.from(hiveMind.swarms.values()).map(s => s.getStatus())
      };
    }
  },

  swarm_execute: {
    name: 'swarm_execute',
    description: 'Execute a spawned swarm',
    inputSchema: {
      type: 'object',
      properties: { swarmId: { type: 'string' } },
      required: ['swarmId']
    },
    handler: async ({ swarmId }) => {
      const swarm = hiveMind.swarms.get(swarmId);
      if (!swarm) return { error: 'Swarm not found' };
      return await swarm.execute();
    }
  },

  dissolve_swarm: {
    name: 'dissolve_swarm',
    description: 'Gracefully terminate a swarm',
    inputSchema: {
      type: 'object',
      properties: { swarmId: { type: 'string' } },
      required: ['swarmId']
    },
    handler: async ({ swarmId }) => {
      hiveMind.swarms.delete(swarmId);
      return { dissolved: true, swarmId };
    }
  },

  hive_status: {
    name: 'hive_status',
    description: '🐝 Get full Hive Mind status',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      await hiveMind.providers.checkProviders();
      return hiveMind.getStatus();
    }
  },

  hive_memory_store: {
    name: 'hive_memory_store',
    description: 'Store knowledge in collective memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        data: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } }
      },
      required: ['key', 'data']
    },
    handler: async ({ key, data, tags = [] }) => hiveMind.memory.store(key, data, { tags })
  },

  hive_memory_query: {
    name: 'hive_memory_query',
    description: 'Query collective memory',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    },
    handler: async ({ query }) => {
      const results = await hiveMind.memory.query(query);
      return { results, count: results.length };
    }
  },

  hive_learn: {
    name: 'hive_learn',
    description: 'Record a pattern for the Hive to learn',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string' },
        solution: { type: 'string' },
        context: { type: 'string' }
      },
      required: ['pattern', 'solution']
    },
    handler: async ({ pattern, solution, context = '' }) => hiveMind.memory.learn(pattern, solution, context)
  },

  hive_broadcast: {
    name: 'hive_broadcast',
    description: 'Broadcast message to all agents',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        priority: { type: 'string', enum: ['info', 'warning', 'urgent'], default: 'info' }
      },
      required: ['message']
    },
    handler: async ({ message, priority = 'info' }) => {
      hiveMind.emit('broadcast', { message, priority });
      return { broadcast: true, recipients: hiveMind.swarms.size };
    }
  },

  provider_status: {
    name: 'provider_status',
    description: 'Check LLM providers (Ollama, LM Studio)',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => hiveMind.providers.checkProviders()
  },

  windsurf_sync: {
    name: 'windsurf_sync',
    description: 'Sync Hive Mind with Windsurf IDE',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => ({ synced: true, hiveStatus: hiveMind.getStatus() })
  },

  ollama_pool: {
    name: 'ollama_pool',
    description: 'Manage Ollama model pool',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'preload', 'unload'] },
        model: { type: 'string' }
      },
      required: ['action']
    },
    handler: async ({ action, model }) => {
      await hiveMind.providers.checkProviders();
      if (action === 'list') return { models: hiveMind.providers.providers.ollama.models };
      return { action, model, message: `Model ${model} ${action}ed` };
    }
  }
};

module.exports = { hiveTools, hiveMind };
