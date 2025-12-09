/**
 * ============================================================================
 * WINDSURF VIBE SETUP - MULTI-AGENT MCP TOOLS v4.0
 * ============================================================================
 * MCP tool definitions for the 100+ agent orchestration system
 * ============================================================================
 */

const { orchestrator, createOrchestrator } = require('./ai-agents/orchestrator');
const {
  AGENT_REGISTRY,
  AGENT_COUNT,
  getAgentsByCategory,
  getAllAgents,
} = require('./ai-agents/agent-registry');

const multiAgentTools = {
  // =========================================================================
  // AGENT DISCOVERY & STATUS
  // =========================================================================

  list_all_agents: {
    name: 'list_all_agents',
    description: `List all ${AGENT_COUNT}+ AI agents available in the system, organized by category`,
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description:
            'Filter by category (architecture, coding, testing, security, devops, documentation, data, performance, quality, orchestration)',
          enum: [
            'all',
            'architecture',
            'coding',
            'testing',
            'security',
            'devops',
            'documentation',
            'data',
            'performance',
            'quality',
            'orchestration',
          ],
        },
        format: {
          type: 'string',
          description: 'Output format',
          enum: ['summary', 'detailed', 'table'],
          default: 'summary',
        },
      },
    },
    handler: async ({ category = 'all', format = 'summary' }) => {
      const agents = category === 'all' ? getAllAgents() : getAgentsByCategory(category);

      if (format === 'summary') {
        const byCategory = {};
        agents.forEach(a => {
          if (!byCategory[a.category]) byCategory[a.category] = [];
          byCategory[a.category].push(a.name);
        });
        return {
          totalAgents: agents.length,
          categories: byCategory,
        };
      }

      return {
        totalAgents: agents.length,
        agents: agents.map(a => ({
          id: a.id,
          name: a.name,
          category: a.category,
          capabilities: a.capabilities,
          model: a.model,
        })),
      };
    },
  },

  agent_status: {
    name: 'agent_status',
    description: 'Get the current status of the multi-agent orchestrator',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      return {
        ...orchestrator.getStatus(),
        agentStats: orchestrator.getAgentStats(),
        timestamp: new Date().toISOString(),
      };
    },
  },

  // =========================================================================
  // TASK EXECUTION
  // =========================================================================

  run_agent_task: {
    name: 'run_agent_task',
    description:
      'Execute a task using the multi-agent system. Automatically selects and coordinates appropriate agents.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Description of the task to execute',
        },
        type: {
          type: 'string',
          description: 'Type of task',
          enum: [
            'create-project',
            'code-generation',
            'testing',
            'deployment',
            'security-audit',
            'documentation',
            'performance',
            'code-review',
            'ml-pipeline',
            'full-stack',
          ],
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Keywords to help route to appropriate agents (e.g., ["react", "typescript", "api"])',
        },
      },
      required: ['description', 'type'],
    },
    handler: async ({ description, type, keywords = [] }) => {
      const task = { description, type, keywords };
      const result = await orchestrator.executeTask(task);
      return result;
    },
  },

  create_agent_crew: {
    name: 'create_agent_crew',
    description: 'Create a specialized team of agents for a project type',
    inputSchema: {
      type: 'object',
      properties: {
        projectType: {
          type: 'string',
          description: 'Type of project',
          enum: ['full-stack-web', 'ml-pipeline', 'api-service', 'mobile-app'],
        },
      },
      required: ['projectType'],
    },
    handler: async ({ projectType }) => {
      const crew = await orchestrator.createDevelopmentCrew(projectType);
      return {
        projectType,
        crewSize: crew.length,
        agents: crew.map(a => ({
          id: a.id,
          name: a.name,
          role: a.category,
          capabilities: a.capabilities,
        })),
      };
    },
  },

  // =========================================================================
  // SPECIALIZED AGENT CALLS
  // =========================================================================

  call_architect: {
    name: 'call_architect',
    description: 'Invoke the System Architect agent for design decisions',
    inputSchema: {
      type: 'object',
      properties: {
        request: { type: 'string', description: 'Architecture question or design request' },
        context: { type: 'string', description: 'Project context' },
      },
      required: ['request'],
    },
    handler: async ({ request, context = '' }) => {
      return await orchestrator.runAgent(
        { id: 'arch-system', name: 'System Architect', model: 'qwen2.5-coder:32b' },
        { task: { description: request }, previousResults: context ? [context] : [] }
      );
    },
  },

  call_code_reviewer: {
    name: 'call_code_reviewer',
    description: 'Invoke the Code Reviewer agent for code quality analysis',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Code to review' },
        language: { type: 'string', description: 'Programming language' },
      },
      required: ['code'],
    },
    handler: async ({ code, language = 'javascript' }) => {
      return await orchestrator.runAgent(
        { id: 'quality-code-review', name: 'Code Reviewer', model: 'qwen2.5-coder:32b' },
        { task: { description: `Review this ${language} code:\n\n${code}` }, previousResults: [] }
      );
    },
  },

  call_security_auditor: {
    name: 'call_security_auditor',
    description: 'Invoke the Security Auditor agent for vulnerability analysis',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Code, config, or path to audit' },
        auditType: { type: 'string', enum: ['code', 'dependencies', 'config', 'full'] },
      },
      required: ['target'],
    },
    handler: async ({ target, auditType = 'full' }) => {
      return await orchestrator.runAgent(
        { id: 'sec-audit', name: 'Security Auditor', model: 'qwen2.5-coder:32b' },
        {
          task: { description: `Perform ${auditType} security audit on:\n\n${target}` },
          previousResults: [],
        }
      );
    },
  },
};

module.exports = { multiAgentTools };
