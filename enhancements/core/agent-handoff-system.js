/**
 * Agent Handoff System - v5.0
 * Intelligent task routing between specialized agents
 * Enables seamless context transfer and expertise-based handoffs
 */

const { EventEmitter } = require('events');

class SpecialistAgent {
  constructor(id, config) {
    this.id = id;
    this.name = config.name;
    this.type = config.type;
    this.expertise = config.expertise || [];
    this.canHandoffTo = config.canHandoffTo || [];
    this.workload = 0;
    this.maxWorkload = config.maxWorkload || 5;
    this.performance = {
      tasksCompleted: 0,
      successRate: 1.0,
      averageTime: 0,
    };
  }

  canHandle(task) {
    // Check expertise match
    const taskKeywords = this.extractKeywords(task);
    const expertiseMatch = this.expertise.some(skill =>
      taskKeywords.some(
        keyword =>
          skill.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(skill.toLowerCase())
      )
    );

    // Check workload
    const hasCapacity = this.workload < this.maxWorkload;

    return expertiseMatch && hasCapacity;
  }

  extractKeywords(task) {
    const text =
      typeof task === 'string' ? task : task.description || task.type || JSON.stringify(task);

    // Extract meaningful keywords
    const keywords = text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3);

    return keywords;
  }

  getExpertiseScore(task) {
    const keywords = this.extractKeywords(task);
    let score = 0;

    for (const skill of this.expertise) {
      for (const keyword of keywords) {
        if (skill.toLowerCase().includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
    }

    // Factor in performance
    score *= this.performance.successRate;

    // Factor in workload
    score *= 1 - this.workload / this.maxWorkload;

    return score;
  }
}

class AgentHandoffSystem extends EventEmitter {
  constructor(options = {}) {
    super();

    this.agents = new Map();
    this.handoffHistory = [];
    this.maxHistorySize = options.maxHistorySize || 100;
    this.activeTasks = new Map();

    this.isInitialized = false;
  }

  /**
   * Initialize handoff system
   */
  async initialize() {
    try {
      // Register specialist agents
      this.registerSpecialistAgents();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Agent Handoff System initialized');
      console.log(`   - Specialist agents: ${this.agents.size}`);
    } catch (error) {
      console.error('❌ Failed to initialize Agent Handoff System:', error);
      throw error;
    }
  }

  /**
   * Register specialist agents
   */
  registerSpecialistAgents() {
    // Frontend specialists
    this.registerAgent('frontend-react', {
      name: 'React Specialist',
      type: 'frontend',
      expertise: [
        'React',
        'JSX',
        'Hooks',
        'Redux',
        'Next.js',
        'Component',
        'useState',
        'useEffect',
      ],
      canHandoffTo: ['frontend-vue', 'frontend-css', 'backend-node', 'tester-frontend'],
    });

    this.registerAgent('frontend-vue', {
      name: 'Vue Specialist',
      type: 'frontend',
      expertise: ['Vue', 'Vuex', 'Nuxt', 'Composition API', 'Template', 'v-model'],
      canHandoffTo: ['frontend-react', 'frontend-css', 'backend-node', 'tester-frontend'],
    });

    this.registerAgent('frontend-css', {
      name: 'CSS/UI Specialist',
      type: 'frontend',
      expertise: [
        'CSS',
        'SCSS',
        'Tailwind',
        'Bootstrap',
        'Animation',
        'Responsive',
        'Flexbox',
        'Grid',
      ],
      canHandoffTo: ['frontend-react', 'frontend-vue', 'designer-ui'],
    });

    // Backend specialists
    this.registerAgent('backend-node', {
      name: 'Node.js Specialist',
      type: 'backend',
      expertise: [
        'Node.js',
        'Express',
        'Fastify',
        'NestJS',
        'API',
        'REST',
        'GraphQL',
        'Middleware',
      ],
      canHandoffTo: ['backend-python', 'database-sql', 'devops-docker', 'tester-api'],
    });

    this.registerAgent('backend-python', {
      name: 'Python Specialist',
      type: 'backend',
      expertise: ['Python', 'Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy', 'AsyncIO'],
      canHandoffTo: ['backend-node', 'ai-ml', 'database-sql', 'tester-api'],
    });

    this.registerAgent('database-sql', {
      name: 'Database Specialist',
      type: 'backend',
      expertise: ['SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Query', 'Schema', 'Index'],
      canHandoffTo: ['backend-node', 'backend-python', 'devops-docker'],
    });

    // AI/ML specialists
    this.registerAgent('ai-ml', {
      name: 'AI/ML Specialist',
      type: 'ai',
      expertise: [
        'TensorFlow',
        'PyTorch',
        'Machine Learning',
        'Deep Learning',
        'NLP',
        'Computer Vision',
        'Model',
        'Training',
      ],
      canHandoffTo: ['backend-python', 'data-engineer', 'optimizer-performance'],
    });

    this.registerAgent('ai-llm', {
      name: 'LLM Specialist',
      type: 'ai',
      expertise: ['LLM', 'GPT', 'Claude', 'Llama', 'Prompt', 'Fine-tuning', 'Embeddings', 'RAG'],
      canHandoffTo: ['ai-ml', 'backend-python', 'backend-node'],
    });

    // DevOps specialists
    this.registerAgent('devops-docker', {
      name: 'Docker/K8s Specialist',
      type: 'devops',
      expertise: ['Docker', 'Kubernetes', 'Container', 'Deployment', 'Helm', 'CI/CD', 'Pipeline'],
      canHandoffTo: ['devops-cloud', 'backend-node', 'security-infra'],
    });

    this.registerAgent('devops-cloud', {
      name: 'Cloud Specialist',
      type: 'devops',
      expertise: [
        'AWS',
        'Azure',
        'GCP',
        'Serverless',
        'Lambda',
        'S3',
        'CloudFormation',
        'Terraform',
      ],
      canHandoffTo: ['devops-docker', 'security-cloud', 'optimizer-cost'],
    });

    // Testing specialists
    this.registerAgent('tester-frontend', {
      name: 'Frontend Test Specialist',
      type: 'testing',
      expertise: [
        'Jest',
        'React Testing Library',
        'Cypress',
        'Playwright',
        'E2E',
        'Component Testing',
      ],
      canHandoffTo: ['frontend-react', 'frontend-vue', 'tester-api'],
    });

    this.registerAgent('tester-api', {
      name: 'API Test Specialist',
      type: 'testing',
      expertise: [
        'Postman',
        'REST',
        'GraphQL',
        'Integration',
        'Contract',
        'Load Testing',
        'Performance',
      ],
      canHandoffTo: ['backend-node', 'backend-python', 'tester-frontend'],
    });

    // Debug specialists
    this.registerAgent('debugger-error', {
      name: 'Error Debug Specialist',
      type: 'debug',
      expertise: ['Error', 'Exception', 'Stack Trace', 'Debug', 'Breakpoint', 'Console', 'Logging'],
      canHandoffTo: ['debugger-performance', 'debugger-memory', 'fixer-bug'],
    });

    this.registerAgent('debugger-performance', {
      name: 'Performance Debug Specialist',
      type: 'debug',
      expertise: [
        'Performance',
        'Profiling',
        'Optimization',
        'Bottleneck',
        'Latency',
        'Throughput',
      ],
      canHandoffTo: ['debugger-memory', 'optimizer-performance', 'backend-node'],
    });

    this.registerAgent('debugger-memory', {
      name: 'Memory Debug Specialist',
      type: 'debug',
      expertise: ['Memory Leak', 'Heap', 'Garbage Collection', 'Memory Usage', 'Profiling'],
      canHandoffTo: ['debugger-performance', 'backend-node', 'backend-python'],
    });

    // Security specialists
    this.registerAgent('security-app', {
      name: 'Application Security Specialist',
      type: 'security',
      expertise: [
        'OWASP',
        'XSS',
        'CSRF',
        'SQL Injection',
        'Authentication',
        'Authorization',
        'JWT',
      ],
      canHandoffTo: ['security-infra', 'backend-node', 'backend-python'],
    });

    this.registerAgent('security-infra', {
      name: 'Infrastructure Security Specialist',
      type: 'security',
      expertise: ['Firewall', 'VPN', 'SSL', 'TLS', 'Encryption', 'Network Security', 'IAM'],
      canHandoffTo: ['security-cloud', 'devops-docker', 'devops-cloud'],
    });

    // Optimization specialists
    this.registerAgent('optimizer-performance', {
      name: 'Performance Optimizer',
      type: 'optimization',
      expertise: ['Performance', 'Speed', 'Caching', 'CDN', 'Lazy Loading', 'Code Splitting'],
      canHandoffTo: ['optimizer-cost', 'debugger-performance', 'backend-node'],
    });

    this.registerAgent('optimizer-cost', {
      name: 'Cost Optimizer',
      type: 'optimization',
      expertise: ['Cost', 'Budget', 'Resource Usage', 'Scaling', 'Efficiency', 'ROI'],
      canHandoffTo: ['optimizer-performance', 'devops-cloud', 'architect-solution'],
    });

    // Architecture specialists
    this.registerAgent('architect-solution', {
      name: 'Solution Architect',
      type: 'architecture',
      expertise: [
        'Architecture',
        'Design Pattern',
        'Microservices',
        'System Design',
        'Scalability',
      ],
      canHandoffTo: ['architect-data', 'backend-node', 'devops-cloud'],
    });

    this.registerAgent('architect-data', {
      name: 'Data Architect',
      type: 'architecture',
      expertise: ['Data Model', 'ETL', 'Data Lake', 'Data Warehouse', 'Analytics', 'Big Data'],
      canHandoffTo: ['architect-solution', 'database-sql', 'ai-ml'],
    });

    // Documentation specialist
    this.registerAgent('doc-technical', {
      name: 'Technical Documentation Specialist',
      type: 'documentation',
      expertise: [
        'Documentation',
        'README',
        'API Docs',
        'Markdown',
        'JSDoc',
        'Swagger',
        'Technical Writing',
      ],
      canHandoffTo: ['backend-node', 'frontend-react', 'architect-solution'],
    });
  }

  /**
   * Register an agent
   */
  registerAgent(id, config) {
    const agent = new SpecialistAgent(id, config);
    this.agents.set(id, agent);

    this.emit('agentRegistered', { id, name: config.name });

    return agent;
  }

  /**
   * Route task to best agent
   */
  async routeTask(task) {
    try {
      // Find best agent for task
      const agent = this.findBestAgent(task);

      if (!agent) {
        throw new Error('No suitable agent found for task');
      }

      // Create task context
      const taskContext = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        task,
        assignedAgent: agent.id,
        startTime: Date.now(),
        handoffs: [],
      };

      this.activeTasks.set(taskContext.id, taskContext);

      // Increase agent workload
      agent.workload++;

      this.emit('taskRouted', {
        taskId: taskContext.id,
        agentId: agent.id,
        agentName: agent.name,
      });

      // Execute task with handoff capability
      const result = await this.executeWithHandoff(agent, taskContext);

      // Update agent performance
      this.updateAgentPerformance(agent, taskContext);

      // Add to history
      this.addToHistory(taskContext);

      // Clean up
      this.activeTasks.delete(taskContext.id);

      return result;
    } catch (error) {
      console.error('❌ Task routing failed:', error);
      throw error;
    }
  }

  /**
   * Find best agent for task
   */
  findBestAgent(task) {
    let bestAgent = null;
    let bestScore = -1;

    for (const [id, agent] of this.agents) {
      if (agent.canHandle(task)) {
        const score = agent.getExpertiseScore(task);

        if (score > bestScore) {
          bestScore = score;
          bestAgent = agent;
        }
      }
    }

    return bestAgent;
  }

  /**
   * Find agent by expertise
   */
  findAgentByExpertise(expertiseRequired) {
    for (const [id, agent] of this.agents) {
      const hasExpertise = expertiseRequired.some(req =>
        agent.expertise.some(skill => skill.toLowerCase().includes(req.toLowerCase()))
      );

      if (hasExpertise && agent.workload < agent.maxWorkload) {
        return agent;
      }
    }

    return null;
  }

  /**
   * Execute task with handoff capability
   */
  async executeWithHandoff(agent, taskContext) {
    try {
      // Simulate task execution
      const result = await this.simulateExecution(agent, taskContext.task);

      // Check if handoff is needed
      if (result.needsHandoff) {
        return await this.performHandoff(
          agent,
          taskContext,
          result.handoffReason,
          result.targetExpertise
        );
      }

      // Decrease workload
      agent.workload--;

      return result;
    } catch (error) {
      // Decrease workload on error
      agent.workload--;
      throw error;
    }
  }

  /**
   * Perform handoff
   */
  async performHandoff(fromAgent, taskContext, reason, targetExpertise) {
    // Find next agent
    let nextAgent = null;

    if (targetExpertise) {
      nextAgent = this.findAgentByExpertise(targetExpertise);
    }

    if (!nextAgent) {
      // Try agents that current agent can handoff to
      for (const agentId of fromAgent.canHandoffTo) {
        const candidate = this.agents.get(agentId);
        if (candidate && candidate.workload < candidate.maxWorkload) {
          nextAgent = candidate;
          break;
        }
      }
    }

    if (!nextAgent) {
      throw new Error('No agent available for handoff');
    }

    // Log handoff
    const handoff = {
      from: fromAgent.id,
      to: nextAgent.id,
      reason,
      timestamp: Date.now(),
    };

    taskContext.handoffs.push(handoff);

    // Decrease current agent workload
    fromAgent.workload--;

    // Increase next agent workload
    nextAgent.workload++;

    this.emit('handoffPerformed', {
      taskId: taskContext.id,
      fromAgent: fromAgent.id,
      toAgent: nextAgent.id,
      reason,
    });

    // Execute with next agent
    return await this.executeWithHandoff(nextAgent, taskContext);
  }

  /**
   * Simulate task execution
   */
  async simulateExecution(agent, task) {
    // Simulate processing time
    await this.delay(100 + Math.random() * 400);

    // Simulate different outcomes
    const random = Math.random();

    if (random < 0.7) {
      // Success
      return {
        success: true,
        result: `Task completed by ${agent.name}`,
        agentId: agent.id,
      };
    } else if (random < 0.9) {
      // Needs handoff
      const needsExpertise = this.determineNeededExpertise(task, agent);

      return {
        needsHandoff: true,
        handoffReason: 'Requires additional expertise',
        targetExpertise: needsExpertise,
        partialResult: `Partial completion by ${agent.name}`,
      };
    } else {
      // Error (but recoverable with handoff)
      return {
        needsHandoff: true,
        handoffReason: 'Error occurred, needs specialist',
        targetExpertise: ['debug', 'error'],
        error: 'Simulated error',
      };
    }
  }

  /**
   * Determine needed expertise
   */
  determineNeededExpertise(task, currentAgent) {
    // Simple heuristic
    const taskText = JSON.stringify(task).toLowerCase();

    if (taskText.includes('performance')) {
      return ['performance', 'optimization'];
    } else if (taskText.includes('error') || taskText.includes('bug')) {
      return ['debug', 'error'];
    } else if (taskText.includes('security')) {
      return ['security'];
    } else if (taskText.includes('test')) {
      return ['testing'];
    } else if (taskText.includes('deploy')) {
      return ['devops', 'deployment'];
    } else {
      // Random expertise different from current
      const allTypes = ['frontend', 'backend', 'database', 'ai', 'devops'];
      return allTypes.filter(t => t !== currentAgent.type);
    }
  }

  /**
   * Update agent performance
   */
  updateAgentPerformance(agent, taskContext) {
    const duration = Date.now() - taskContext.startTime;

    agent.performance.tasksCompleted++;

    // Update average time
    agent.performance.averageTime =
      (agent.performance.averageTime * (agent.performance.tasksCompleted - 1) + duration) /
      agent.performance.tasksCompleted;

    // Update success rate (simplified)
    if (taskContext.handoffs.length === 0) {
      agent.performance.successRate =
        (agent.performance.successRate * (agent.performance.tasksCompleted - 1) + 1) /
        agent.performance.tasksCompleted;
    } else {
      agent.performance.successRate =
        (agent.performance.successRate * (agent.performance.tasksCompleted - 1) + 0.5) /
        agent.performance.tasksCompleted;
    }
  }

  /**
   * Add to handoff history
   */
  addToHistory(taskContext) {
    this.handoffHistory.unshift({
      taskId: taskContext.id,
      startTime: taskContext.startTime,
      endTime: Date.now(),
      duration: Date.now() - taskContext.startTime,
      assignedAgent: taskContext.assignedAgent,
      handoffs: taskContext.handoffs,
    });

    // Limit history size
    if (this.handoffHistory.length > this.maxHistorySize) {
      this.handoffHistory = this.handoffHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Create handoff capability for agent
   */
  createHandoffCapability(agent) {
    return {
      handoff: async (task, targetExpertise) => {
        const context = {
          id: `handoff-${Date.now()}`,
          task,
          assignedAgent: agent.id,
          startTime: Date.now(),
          handoffs: [],
        };

        return await this.performHandoff(agent, context, 'Manual handoff', targetExpertise);
      },
    };
  }

  /**
   * Get handoff statistics
   */
  getHandoffStats() {
    const stats = {
      totalHandoffs: 0,
      averageHandoffsPerTask: 0,
      mostActiveAgents: [],
      handoffReasons: {},
    };

    // Calculate stats from history
    for (const entry of this.handoffHistory) {
      stats.totalHandoffs += entry.handoffs.length;

      for (const handoff of entry.handoffs) {
        if (!stats.handoffReasons[handoff.reason]) {
          stats.handoffReasons[handoff.reason] = 0;
        }
        stats.handoffReasons[handoff.reason]++;
      }
    }

    if (this.handoffHistory.length > 0) {
      stats.averageHandoffsPerTask = stats.totalHandoffs / this.handoffHistory.length;
    }

    // Find most active agents
    const agentActivity = {};

    for (const [id, agent] of this.agents) {
      agentActivity[id] = agent.performance.tasksCompleted;
    }

    stats.mostActiveAgents = Object.entries(agentActivity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        id,
        name: this.agents.get(id).name,
        tasksCompleted: count,
      }));

    return stats;
  }

  /**
   * Helper: Delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      specialists: this.agents.size,
      activeTasks: this.activeTasks.size,
      historySize: this.handoffHistory.length,
      stats: this.getHandoffStats(),
    };
  }

  /**
   * Get handoff count
   */
  getHandoffCount() {
    return this.handoffHistory.reduce((total, entry) => total + entry.handoffs.length, 0);
  }

  /**
   * Shutdown
   */
  async shutdown() {
    // Clear active tasks
    this.activeTasks.clear();

    // Reset agent workloads
    for (const [id, agent] of this.agents) {
      agent.workload = 0;
    }

    this.emit('shutdown');
    console.log('✅ Agent Handoff System shutdown complete');
  }
}

module.exports = AgentHandoffSystem;
