#!/usr/bin/env node
/**
 * Windsurf Autopilot - Agent Tools v3.0
 * Multi-agent orchestration for complex tasks.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AGENT_DIR = process.platform === 'win32'
  ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot', 'agents')
  : path.join(process.env.HOME || '', '.windsurf-autopilot', 'agents');

if (!fs.existsSync(AGENT_DIR)) fs.mkdirSync(AGENT_DIR, { recursive: true });

// Agent registry
const agents = new Map();
const taskQueue = [];
const taskResults = new Map();

// Pre-defined agent specializations
const agentSpecializations = {
  code: {
    name: 'Code Agent',
    description: 'Specializes in code generation and refactoring',
    tools: ['generate_code', 'refactor_code', 'code_review', 'analyze_complexity'],
    systemPrompt: 'You are a code generation specialist. Write clean, efficient, well-documented code.'
  },
  test: {
    name: 'Test Agent',
    description: 'Specializes in test creation and execution',
    tools: ['generate_tests', 'run_tests', 'test_api'],
    systemPrompt: 'You are a testing specialist. Create comprehensive tests with good coverage.'
  },
  docs: {
    name: 'Documentation Agent',
    description: 'Specializes in documentation generation',
    tools: ['generate_docs', 'generate_api_docs'],
    systemPrompt: 'You are a documentation specialist. Write clear, comprehensive documentation.'
  },
  review: {
    name: 'Review Agent',
    description: 'Specializes in code review and security',
    tools: ['code_review', 'security_audit', 'find_dead_code', 'scan_secrets'],
    systemPrompt: 'You are a code review specialist. Find issues and suggest improvements.'
  },
  deploy: {
    name: 'Deploy Agent',
    description: 'Specializes in deployment and CI/CD',
    tools: ['deploy_vercel', 'deploy_netlify', 'setup_github_actions', 'run_pipeline'],
    systemPrompt: 'You are a deployment specialist. Handle deployments safely and efficiently.'
  }
};

const agentTools = {
  create_agent: {
    name: 'create_agent',
    description: 'Create a specialized agent for specific tasks',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Agent name' },
        specialization: { 
          type: 'string', 
          enum: ['code', 'test', 'docs', 'review', 'deploy', 'custom'],
          description: 'Agent specialization'
        },
        tools: { type: 'array', items: { type: 'string' }, description: 'Tools this agent can use' },
        systemPrompt: { type: 'string', description: 'Custom system prompt' },
        model: { type: 'string', description: 'AI model to use' }
      },
      required: ['name', 'specialization']
    },
    handler: async (args) => {
      try {
        const spec = agentSpecializations[args.specialization] || {};
        
        const agent = {
          id: crypto.randomUUID().substring(0, 8),
          name: args.name,
          specialization: args.specialization,
          description: spec.description || 'Custom agent',
          tools: args.tools || spec.tools || [],
          systemPrompt: args.systemPrompt || spec.systemPrompt || '',
          model: args.model || 'default',
          createdAt: new Date().toISOString(),
          status: 'idle',
          taskCount: 0,
          successRate: 100
        };

        agents.set(agent.id, agent);
        
        // Save to disk
        fs.writeFileSync(
          path.join(AGENT_DIR, `${agent.id}.json`),
          JSON.stringify(agent, null, 2)
        );

        return {
          success: true,
          agentId: agent.id,
          name: agent.name,
          specialization: agent.specialization,
          tools: agent.tools,
          message: `Agent "${agent.name}" created`
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  assign_task: {
    name: 'assign_task',
    description: 'Assign a task to a specific agent',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: { type: 'string', description: 'Agent ID to assign to' },
        task: { type: 'string', description: 'Task description' },
        priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
        context: { type: 'object', description: 'Additional context for the task' },
        timeout: { type: 'number', description: 'Task timeout in seconds', default: 300 }
      },
      required: ['agentId', 'task']
    },
    handler: async (args) => {
      const agent = agents.get(args.agentId) || loadAgent(args.agentId);
      
      if (!agent) {
        return {
          success: false,
          error: `Agent not found: ${args.agentId}`,
          availableAgents: Array.from(agents.values()).map(a => ({ id: a.id, name: a.name }))
        };
      }

      const task = {
        id: crypto.randomUUID().substring(0, 8),
        agentId: args.agentId,
        agentName: agent.name,
        description: args.task,
        priority: args.priority || 'normal',
        context: args.context || {},
        status: 'queued',
        createdAt: new Date().toISOString(),
        timeout: args.timeout || 300
      };

      taskQueue.push(task);
      agent.status = 'busy';
      agent.taskCount++;

      // Simulate task execution (in production, would actually execute)
      setTimeout(() => {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.result = {
          success: true,
          output: `Task "${args.task}" completed by ${agent.name}`,
          duration: Math.random() * 5000 + 1000
        };
        taskResults.set(task.id, task);
        agent.status = 'idle';
      }, 1000);

      return {
        success: true,
        taskId: task.id,
        agentId: agent.id,
        agentName: agent.name,
        status: 'queued',
        message: `Task assigned to ${agent.name}`
      };
    }
  },

  agent_status: {
    name: 'agent_status',
    description: 'Check status of all agents or a specific agent',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: { type: 'string', description: 'Specific agent ID (optional)' }
      }
    },
    handler: async (args) => {
      // Load agents from disk
      loadAllAgents();

      if (args.agentId) {
        const agent = agents.get(args.agentId);
        if (!agent) {
          return { success: false, error: `Agent not found: ${args.agentId}` };
        }

        const agentTasks = taskQueue.filter(t => t.agentId === args.agentId);
        const completedTasks = Array.from(taskResults.values()).filter(t => t.agentId === args.agentId);

        return {
          success: true,
          agent: {
            ...agent,
            pendingTasks: agentTasks.length,
            completedTasks: completedTasks.length
          }
        };
      }

      const allAgents = Array.from(agents.values()).map(agent => ({
        id: agent.id,
        name: agent.name,
        specialization: agent.specialization,
        status: agent.status,
        taskCount: agent.taskCount,
        successRate: agent.successRate
      }));

      return {
        success: true,
        agentCount: allAgents.length,
        agents: allAgents,
        queuedTasks: taskQueue.length,
        completedTasks: taskResults.size
      };
    }
  },

  agent_collaborate: {
    name: 'agent_collaborate',
    description: 'Enable multiple agents to collaborate on a complex task',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Complex task requiring collaboration' },
        agents: { type: 'array', items: { type: 'string' }, description: 'Agent IDs to involve' },
        strategy: { 
          type: 'string', 
          enum: ['sequential', 'parallel', 'pipeline'],
          default: 'pipeline',
          description: 'Collaboration strategy'
        },
        projectPath: { type: 'string', description: 'Project context' }
      },
      required: ['task']
    },
    handler: async (args) => {
      loadAllAgents();
      
      // If no agents specified, auto-select based on task
      let selectedAgents = [];
      if (args.agents && args.agents.length > 0) {
        selectedAgents = args.agents.map(id => agents.get(id)).filter(Boolean);
      } else {
        // Auto-select agents based on task keywords
        const taskLower = args.task.toLowerCase();
        if (taskLower.includes('code') || taskLower.includes('implement')) {
          const codeAgent = Array.from(agents.values()).find(a => a.specialization === 'code');
          if (codeAgent) selectedAgents.push(codeAgent);
        }
        if (taskLower.includes('test')) {
          const testAgent = Array.from(agents.values()).find(a => a.specialization === 'test');
          if (testAgent) selectedAgents.push(testAgent);
        }
        if (taskLower.includes('review') || taskLower.includes('security')) {
          const reviewAgent = Array.from(agents.values()).find(a => a.specialization === 'review');
          if (reviewAgent) selectedAgents.push(reviewAgent);
        }
        if (taskLower.includes('doc')) {
          const docsAgent = Array.from(agents.values()).find(a => a.specialization === 'docs');
          if (docsAgent) selectedAgents.push(docsAgent);
        }
      }

      if (selectedAgents.length === 0) {
        return {
          success: false,
          error: 'No suitable agents found for this task',
          suggestion: 'Create agents first using create_agent',
          availableSpecializations: Object.keys(agentSpecializations)
        };
      }

      const collaborationId = crypto.randomUUID().substring(0, 8);
      const strategy = args.strategy || 'pipeline';

      // Create collaboration plan
      const plan = {
        id: collaborationId,
        task: args.task,
        strategy,
        agents: selectedAgents.map(a => ({
          id: a.id,
          name: a.name,
          specialization: a.specialization,
          role: getRoleInPipeline(a.specialization)
        })),
        status: 'planning',
        createdAt: new Date().toISOString(),
        steps: []
      };

      // Generate steps based on strategy
      if (strategy === 'pipeline') {
        selectedAgents.forEach((agent, index) => {
          plan.steps.push({
            order: index + 1,
            agentId: agent.id,
            agentName: agent.name,
            action: `Execute ${agent.specialization} tasks`,
            dependsOn: index > 0 ? plan.steps[index - 1].order : null
          });
        });
      } else if (strategy === 'parallel') {
        selectedAgents.forEach((agent, index) => {
          plan.steps.push({
            order: index + 1,
            agentId: agent.id,
            agentName: agent.name,
            action: `Execute ${agent.specialization} tasks`,
            dependsOn: null
          });
        });
      }

      return {
        success: true,
        collaborationId,
        task: args.task,
        strategy,
        agentsInvolved: selectedAgents.length,
        plan,
        message: `Collaboration started with ${selectedAgents.length} agents using ${strategy} strategy`
      };
    }
  },

  list_agents: {
    name: 'list_agents',
    description: 'List all available agents and their specializations',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      loadAllAgents();
      
      return {
        success: true,
        count: agents.size,
        agents: Array.from(agents.values()).map(a => ({
          id: a.id,
          name: a.name,
          specialization: a.specialization,
          description: a.description,
          tools: a.tools,
          status: a.status,
          taskCount: a.taskCount
        })),
        availableSpecializations: Object.entries(agentSpecializations).map(([key, value]) => ({
          type: key,
          name: value.name,
          description: value.description
        }))
      };
    }
  },

  getToolDefinitions: function() {
    return [
      { name: this.create_agent.name, description: this.create_agent.description, inputSchema: this.create_agent.inputSchema },
      { name: this.assign_task.name, description: this.assign_task.description, inputSchema: this.assign_task.inputSchema },
      { name: this.agent_status.name, description: this.agent_status.description, inputSchema: this.agent_status.inputSchema },
      { name: this.agent_collaborate.name, description: this.agent_collaborate.description, inputSchema: this.agent_collaborate.inputSchema },
      { name: this.list_agents.name, description: this.list_agents.description, inputSchema: this.list_agents.inputSchema }
    ];
  },

  getHandler: function(toolName) {
    return this[toolName]?.handler;
  }
};

// Helper functions
function loadAgent(agentId) {
  const agentFile = path.join(AGENT_DIR, `${agentId}.json`);
  if (fs.existsSync(agentFile)) {
    const agent = JSON.parse(fs.readFileSync(agentFile, 'utf8'));
    agents.set(agent.id, agent);
    return agent;
  }
  return null;
}

function loadAllAgents() {
  if (!fs.existsSync(AGENT_DIR)) return;
  
  const files = fs.readdirSync(AGENT_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const agent = JSON.parse(fs.readFileSync(path.join(AGENT_DIR, file), 'utf8'));
      if (agent.id && !agents.has(agent.id)) {
        agents.set(agent.id, agent);
      }
    } catch (e) {}
  }
}

function getRoleInPipeline(specialization) {
  const roles = {
    code: 'Implementation',
    test: 'Testing',
    docs: 'Documentation',
    review: 'Quality Assurance',
    deploy: 'Deployment'
  };
  return roles[specialization] || 'General';
}

module.exports = agentTools;
