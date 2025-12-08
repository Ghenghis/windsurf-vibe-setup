/**
 * ============================================================================
 * WINDSURF VIBE SETUP - MULTI-AGENT ORCHESTRATOR v4.0
 * ============================================================================
 * Intelligent orchestration of 100+ AI agents for autonomous development
 * ============================================================================
 */

const { AGENT_REGISTRY, getAgentsByCategory, getAgentById } = require('./agent-registry');

class MultiAgentOrchestrator {
  constructor(options = {}) {
    this.agents = AGENT_REGISTRY;
    this.activeAgents = new Map();
    this.taskQueue = [];
    this.completedTasks = [];
    this.modelProvider = options.modelProvider || 'ollama';
    this.defaultModel = options.defaultModel || 'qwen2.5-coder:32b';
    this.maxConcurrentAgents = options.maxConcurrentAgents || 5;
    this.eventHandlers = new Map();
  }

  /**
   * Initialize the orchestrator and verify agent availability
   */
  async initialize() {
    console.log(`🚀 Initializing Multi-Agent Orchestrator with ${Object.keys(this.agents).length} agents...`);
    
    // Verify model availability
    const availableModels = await this.checkAvailableModels();
    console.log(`📦 Available models: ${availableModels.join(', ')}`);
    
    this.emit('initialized', { agentCount: Object.keys(this.agents).length });
    return this;
  }

  /**
   * Check available Ollama models
   */
  async checkAvailableModels() {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        return data.models?.map(m => m.name) || [];
      }
    } catch (error) {
      console.warn('⚠️ Could not connect to Ollama. Ensure ollama serve is running.');
    }
    return [];
  }

  /**
   * Route a task to the most appropriate agent(s)
   */
  async routeTask(task) {
    const { type, description, requirements } = task;
    
    // Analyze task and determine required agents
    const selectedAgents = this.selectAgentsForTask(task);
    
    console.log(`📋 Task "${description}" routed to ${selectedAgents.length} agent(s):`);
    selectedAgents.forEach(a => console.log(`   → ${a.name} (${a.id})`));
    
    return selectedAgents;
  }

  /**
   * Intelligent agent selection based on task analysis
   */
  selectAgentsForTask(task) {
    const { type, keywords = [], complexity = 'medium' } = task;
    const selected = [];
    
    // Map task types to agent categories
    const categoryMapping = {
      'create-project': ['architecture', 'coding', 'devops'],
      'code-generation': ['coding'],
      'testing': ['testing'],
      'deployment': ['devops'],
      'security-audit': ['security'],
      'documentation': ['documentation'],
      'performance': ['performance'],
      'code-review': ['quality', 'security'],
      'ml-pipeline': ['data'],
      'full-stack': ['architecture', 'coding', 'testing', 'devops', 'documentation']
    };

    const categories = categoryMapping[type] || ['coding'];
    
    categories.forEach(category => {
      const categoryAgents = getAgentsByCategory(category);
      // Select top agents from each category based on task keywords
      const matched = this.matchAgentsToKeywords(categoryAgents, keywords);
      selected.push(...matched.slice(0, 2));
    });

    return selected;
  }

  /**
   * Match agents to task keywords for optimal selection
   */
  matchAgentsToKeywords(agents, keywords) {
    return agents.map(agent => {
      const score = keywords.reduce((acc, keyword) => {
        const capMatch = agent.capabilities?.some(c => 
          c.toLowerCase().includes(keyword.toLowerCase())
        );
        return acc + (capMatch ? 1 : 0);
      }, 0);
      return { ...agent, matchScore: score };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Execute a task with selected agents
   */
  async executeTask(task) {
    const taskId = `task_${Date.now()}`;
    const agents = await this.routeTask(task);
    
    this.emit('taskStarted', { taskId, task, agents: agents.map(a => a.id) });
    
    try {
      // Execute in parallel or sequence based on dependencies
      const results = await this.executeAgentPipeline(agents, task);
      
      const completedTask = {
        taskId,
        task,
        results,
        completedAt: new Date().toISOString(),
        status: 'completed'
      };
      
      this.completedTasks.push(completedTask);
      this.emit('taskCompleted', completedTask);
      
      return completedTask;
    } catch (error) {
      this.emit('taskFailed', { taskId, error: error.message });
      throw error;
    }
  }

  /**
   * Execute agents in a coordinated pipeline
   */
  async executeAgentPipeline(agents, task) {
    const results = [];
    let context = { task, previousResults: [] };
    
    for (const agent of agents) {
      console.log(`🤖 Agent ${agent.name} starting...`);
      this.activeAgents.set(agent.id, { agent, startTime: Date.now() });
      
      try {
        const result = await this.runAgent(agent, context);
        results.push({ agentId: agent.id, result, status: 'success' });
        context.previousResults.push(result);
        console.log(`✅ Agent ${agent.name} completed`);
      } catch (error) {
        results.push({ agentId: agent.id, error: error.message, status: 'failed' });
        console.error(`❌ Agent ${agent.name} failed: ${error.message}`);
      } finally {
        this.activeAgents.delete(agent.id);
      }
    }
    
    return results;
  }

  /**
   * Run a single agent with the given context
   */
  async runAgent(agent, context) {
    const prompt = this.buildAgentPrompt(agent, context);
    
    // Call the local LLM
    const response = await this.callModel(agent.model || this.defaultModel, prompt);
    
    return {
      agentId: agent.id,
      agentName: agent.name,
      response,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Build a specialized prompt for an agent
   */
  buildAgentPrompt(agent, context) {
    return `You are ${agent.name}, a specialized AI agent.
Role: ${agent.category}
Capabilities: ${agent.capabilities?.join(', ')}

Task: ${context.task.description}

${context.previousResults.length > 0 ? 
  `Previous agent outputs:\n${JSON.stringify(context.previousResults, null, 2)}` : 
  ''}

Provide your expert response:`;
  }

  /**
   * Call the LLM model (Ollama)
   */
  async callModel(model, prompt) {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: { temperature: 0.7, top_p: 0.9 }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
      throw new Error(`Model call failed: ${response.statusText}`);
    } catch (error) {
      console.error(`Failed to call model ${model}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a development crew for complex tasks
   */
  async createDevelopmentCrew(projectType) {
    const crews = {
      'full-stack-web': [
        'arch-system', 'arch-api', 'arch-database',
        'code-react', 'code-node', 'code-typescript',
        'test-unit', 'test-e2e', 'test-api',
        'sec-audit', 'sec-sast',
        'devops-docker', 'devops-ci',
        'doc-readme', 'doc-api',
        'quality-code-review', 'quality-linting'
      ],
      'ml-pipeline': [
        'arch-ml', 'arch-data',
        'ml-data-engineer', 'ml-data-scientist', 'ml-mlops',
        'ml-vector-db', 'ml-llm-ops',
        'devops-docker', 'devops-k8s',
        'doc-architecture'
      ],
      'api-service': [
        'arch-api', 'arch-database',
        'code-node', 'code-typescript',
        'test-unit', 'test-api', 'test-performance',
        'sec-audit', 'sec-auth',
        'devops-docker', 'devops-ci',
        'doc-api', 'doc-readme'
      ],
      'mobile-app': [
        'arch-mobile',
        'code-mobile-rn', 'code-typescript',
        'test-unit', 'test-e2e',
        'sec-audit',
        'devops-ci',
        'doc-readme'
      ]
    };

    const agentIds = crews[projectType] || crews['full-stack-web'];
    return agentIds.map(id => getAgentById(id)).filter(Boolean);
  }

  /**
   * Event handling
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      totalAgents: Object.keys(this.agents).length,
      activeAgents: Array.from(this.activeAgents.keys()),
      queuedTasks: this.taskQueue.length,
      completedTasks: this.completedTasks.length,
      modelProvider: this.modelProvider,
      defaultModel: this.defaultModel
    };
  }

  /**
   * Get agent statistics by category
   */
  getAgentStats() {
    const stats = {};
    Object.values(this.agents).forEach(agent => {
      stats[agent.category] = (stats[agent.category] || 0) + 1;
    });
    return stats;
  }
}

// Create singleton instance
const orchestrator = new MultiAgentOrchestrator();

module.exports = {
  MultiAgentOrchestrator,
  orchestrator,
  createOrchestrator: (options) => new MultiAgentOrchestrator(options)
};
