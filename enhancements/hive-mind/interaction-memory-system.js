/**
 * Interaction Memory System - VIBE Hive Mind
 * Remembers EVERY interaction Ghenghis has with the system
 * Perfect recall for a 100% VIBE Coder with 430+ repos
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class InteractionMemorySystem extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      memoryDir: options.memoryDir || path.join(process.cwd(), 'vibe-data', 'interaction-memory'),
      maxMemories: options.maxMemories || 100000, // Remember a LOT
      compressionThreshold: options.compressionThreshold || 10000,
      indexingEnabled: options.indexingEnabled !== false,
    };

    // User profile - Ghenghis specific
    this.userProfile = {
      username: 'Ghenghis',
      totalRepos: 430,
      vibeCodingYears: 8, // Since 2016
      neverWrittenCode: true,
      primaryInterests: ['MCP', 'AI', 'Game Automation', 'Tools'],
    };

    // Memory storage structures
    this.memories = {
      interactions: [], // All interactions
      commands: new Map(), // Commands used
      projects: new Map(), // Projects created/modified
      preferences: new Map(), // Expressed preferences
      feedback: new Map(), // User feedback
      errors: new Map(), // Errors and solutions
      successes: new Map(), // Successful operations
      learnings: new Map(), // Things learned
    };

    // Contextual memory
    this.context = {
      current: {
        project: null,
        task: null,
        mood: 'productive',
        focus: 'MCP',
      },
      recent: [], // Last 100 interactions
      sessions: [], // Work sessions
      patterns: new Map(), // Behavioral patterns
    };

    // Temporal memory (time-based)
    this.temporal = {
      hourly: new Map(), // What happens each hour
      daily: new Map(), // Daily patterns
      weekly: new Map(), // Weekly patterns
      projectTimelines: new Map(), // Project evolution
    };

    // Emotional memory (user reactions)
    this.emotional = {
      positive: [], // Things that made user happy
      negative: [], // Things that frustrated user
      neutral: [], // Neutral interactions
      excitement: new Map(), // What excites Ghenghis
      frustration: new Map(), // What frustrates Ghenghis
    };

    // Knowledge graph
    this.knowledgeGraph = {
      nodes: new Map(), // Concepts, tools, projects
      edges: new Map(), // Relationships
      clusters: new Map(), // Related groups
    };

    // Search indices
    this.indices = {
      byDate: new Map(),
      byProject: new Map(),
      byType: new Map(),
      byKeyword: new Map(),
      byEmotion: new Map(),
      byOutcome: new Map(),
    };

    // Statistics
    this.stats = {
      totalInteractions: 0,
      uniqueCommands: 0,
      projectsCreated: 0,
      errorsResolved: 0,
      successRate: 0,
      averageSessionLength: 0,
      mostActiveHour: null,
      favoriteProject: null,
    };

    this.isInitialized = false;
  }

  async initialize() {
    console.log('🧠 Initializing Interaction Memory System...');
    console.log('   User: Ghenghis (430+ repos, 100% VIBE Coder)');

    await fs.mkdir(this.config.memoryDir, { recursive: true });
    await fs.mkdir(path.join(this.config.memoryDir, 'interactions'), { recursive: true });
    await fs.mkdir(path.join(this.config.memoryDir, 'contexts'), { recursive: true });
    await fs.mkdir(path.join(this.config.memoryDir, 'knowledge'), { recursive: true });
    await fs.mkdir(path.join(this.config.memoryDir, 'indices'), { recursive: true });

    // Load existing memories
    await this.loadMemories();

    // Initialize with Ghenghis-specific patterns
    await this.initializeGhenghisPatterns();

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ Interaction Memory System initialized');
    console.log(`   Total memories: ${this.memories.interactions.length}`);
    console.log(`   Knowledge nodes: ${this.knowledgeGraph.nodes.size}`);
  }

  /**
   * Initialize Ghenghis-specific patterns
   */
  async initializeGhenghisPatterns() {
    // Known patterns from 430+ repos
    this.context.patterns.set('project-creation', {
      frequency: 'daily',
      types: ['MCP servers', 'AI tools', 'Game bots', 'Automation'],
      approach: 'complete-solution',
      testing: 'minimal', // Trusts AI-generated code
      documentation: 'README-focused',
    });

    this.context.patterns.set('technology-adoption', {
      speed: 'early-adopter',
      interests: ['Latest AI', 'MCP', 'Automation', 'Game AI'],
      learning: 'project-based',
      sharing: 'open-source-everything',
    });

    this.context.patterns.set('work-style', {
      sessions: 'long-focused',
      multitasking: 'multiple-projects',
      tools: 'AI-first',
      debugging: 'regenerate-dont-fix',
    });

    // Initialize knowledge nodes for key interests
    this.knowledgeGraph.nodes.set('MCP', {
      type: 'technology',
      importance: 'primary',
      projects: 30,
      expertise: 'expert',
    });

    this.knowledgeGraph.nodes.set('AI-Agents', {
      type: 'technology',
      importance: 'primary',
      projects: 100,
      expertise: 'advanced',
    });

    this.knowledgeGraph.nodes.set('Game-Automation', {
      type: 'domain',
      importance: 'high',
      projects: 50,
      expertise: 'expert',
    });
  }

  /**
   * Remember an interaction
   */
  async remember(interaction) {
    const memory = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      type: interaction.type,
      content: interaction.content,
      context: { ...this.context.current },
      metadata: interaction.metadata || {},
      outcome: interaction.outcome || 'pending',
      emotion: this.detectEmotion(interaction),
      importance: this.calculateImportance(interaction),
    };

    // Store in primary memory
    this.memories.interactions.push(memory);

    // Update recent context
    this.context.recent.push(memory);
    if (this.context.recent.length > 100) {
      this.context.recent.shift();
    }

    // Categorize and index
    await this.categorizeMemory(memory);
    await this.indexMemory(memory);

    // Update knowledge graph
    await this.updateKnowledgeGraph(memory);

    // Detect patterns
    await this.detectPatterns(memory);

    // Update statistics
    this.updateStatistics(memory);

    // Limit total memories
    if (this.memories.interactions.length > this.config.maxMemories) {
      await this.compressOldMemories();
    }

    // Save important memories immediately
    if (memory.importance > 0.8) {
      await this.saveMemory(memory);
    }

    this.stats.totalInteractions++;

    this.emit('remembered', memory);

    return memory;
  }

  /**
   * Detect emotion from interaction
   */
  detectEmotion(interaction) {
    const content = interaction.content?.toLowerCase() || '';
    const feedback = interaction.feedback?.toLowerCase() || '';

    // Positive indicators
    const positiveWords = [
      'great',
      'awesome',
      'perfect',
      'excellent',
      'good',
      'thanks',
      'nice',
      'cool',
      'love',
    ];
    const positiveEmojis = ['😊', '👍', '🎉', '✅', '🚀', '💪', '🔥'];

    // Negative indicators
    const negativeWords = [
      'error',
      'fail',
      'wrong',
      'bad',
      'issue',
      'problem',
      'broken',
      'fix',
      'bug',
    ];
    const negativeEmojis = ['😞', '👎', '❌', '🐛', '💔', '😤'];

    // Excitement indicators (Ghenghis loves new tech)
    const excitementWords = ['mcp', 'ai', 'agent', 'new', 'latest', 'automation', 'bot'];

    let emotion = 'neutral';
    let confidence = 0.5;

    // Check for positive
    const hasPositive =
      positiveWords.some(word => content.includes(word) || feedback.includes(word)) ||
      positiveEmojis.some(emoji => content.includes(emoji));

    // Check for negative
    const hasNegative =
      negativeWords.some(word => content.includes(word) || feedback.includes(word)) ||
      negativeEmojis.some(emoji => content.includes(emoji));

    // Check for excitement
    const hasExcitement = excitementWords.some(word => content.includes(word));

    if (hasPositive && !hasNegative) {
      emotion = hasExcitement ? 'excited' : 'positive';
      confidence = 0.8;
    } else if (hasNegative && !hasPositive) {
      emotion = 'frustrated';
      confidence = 0.7;
    } else if (hasExcitement) {
      emotion = 'interested';
      confidence = 0.75;
    }

    return { emotion, confidence };
  }

  /**
   * Calculate importance of interaction
   */
  calculateImportance(interaction) {
    let importance = 0.5; // Base importance

    // Project creation is important
    if (interaction.type === 'project-create') importance += 0.3;

    // MCP-related is important to Ghenghis
    if (interaction.content?.toLowerCase().includes('mcp')) importance += 0.2;

    // AI/Agent related
    if (
      interaction.content?.toLowerCase().includes('ai') ||
      interaction.content?.toLowerCase().includes('agent')
    )
      importance += 0.15;

    // Error resolution is important
    if (interaction.type === 'error' && interaction.outcome === 'resolved') importance += 0.25;

    // Success is important
    if (interaction.outcome === 'success') importance += 0.1;

    // Learning something new
    if (interaction.type === 'learning') importance += 0.2;

    // Cap at 1.0
    return Math.min(importance, 1.0);
  }

  /**
   * Categorize memory
   */
  async categorizeMemory(memory) {
    // By type
    if (memory.type === 'command') {
      const count = this.memories.commands.get(memory.content) || 0;
      this.memories.commands.set(memory.content, count + 1);
    }

    // By project
    if (memory.context.project) {
      const projectMemories = this.memories.projects.get(memory.context.project) || [];
      projectMemories.push(memory.id);
      this.memories.projects.set(memory.context.project, projectMemories);
    }

    // By emotion
    if (memory.emotion.emotion === 'positive' || memory.emotion.emotion === 'excited') {
      this.emotional.positive.push(memory);
    } else if (memory.emotion.emotion === 'frustrated') {
      this.emotional.negative.push(memory);
    } else {
      this.emotional.neutral.push(memory);
    }

    // By outcome
    if (memory.outcome === 'success') {
      const successes = this.memories.successes.get(memory.type) || [];
      successes.push(memory);
      this.memories.successes.set(memory.type, successes);
    } else if (memory.outcome === 'error') {
      const errors = this.memories.errors.get(memory.type) || [];
      errors.push(memory);
      this.memories.errors.set(memory.type, errors);
    }
  }

  /**
   * Index memory for fast retrieval
   */
  async indexMemory(memory) {
    if (!this.config.indexingEnabled) return;

    // By date
    const date = new Date(memory.timestamp).toDateString();
    const dateMemories = this.indices.byDate.get(date) || [];
    dateMemories.push(memory.id);
    this.indices.byDate.set(date, dateMemories);

    // By type
    const typeMemories = this.indices.byType.get(memory.type) || [];
    typeMemories.push(memory.id);
    this.indices.byType.set(memory.type, typeMemories);

    // By keywords
    const keywords = this.extractKeywords(memory.content);
    for (const keyword of keywords) {
      const keywordMemories = this.indices.byKeyword.get(keyword) || [];
      keywordMemories.push(memory.id);
      this.indices.byKeyword.set(keyword, keywordMemories);
    }

    // By emotion
    const emotionMemories = this.indices.byEmotion.get(memory.emotion.emotion) || [];
    emotionMemories.push(memory.id);
    this.indices.byEmotion.set(memory.emotion.emotion, emotionMemories);
  }

  /**
   * Extract keywords from content
   */
  extractKeywords(content) {
    if (!content) return [];

    const keywords = new Set();
    const important = [
      'mcp',
      'ai',
      'agent',
      'bot',
      'automation',
      'game',
      'tool',
      'api',
      'react',
      'python',
    ];

    const words = content.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (important.includes(word) || word.length > 5) {
        keywords.add(word);
      }
    }

    return Array.from(keywords);
  }

  /**
   * Update knowledge graph
   */
  async updateKnowledgeGraph(memory) {
    const keywords = this.extractKeywords(memory.content);

    // Add nodes for new concepts
    for (const keyword of keywords) {
      if (!this.knowledgeGraph.nodes.has(keyword)) {
        this.knowledgeGraph.nodes.set(keyword, {
          type: 'concept',
          firstSeen: memory.timestamp,
          occurrences: 1,
        });
      } else {
        const node = this.knowledgeGraph.nodes.get(keyword);
        node.occurrences++;
      }
    }

    // Create edges between concepts in same memory
    for (let i = 0; i < keywords.length - 1; i++) {
      for (let j = i + 1; j < keywords.length; j++) {
        const edgeKey = `${keywords[i]}-${keywords[j]}`;
        const edge = this.knowledgeGraph.edges.get(edgeKey) || { strength: 0 };
        edge.strength++;
        this.knowledgeGraph.edges.set(edgeKey, edge);
      }
    }
  }

  /**
   * Detect patterns
   */
  async detectPatterns(memory) {
    // Time-based patterns
    const hour = new Date(memory.timestamp).getHours();
    const hourActivity = this.temporal.hourly.get(hour) || 0;
    this.temporal.hourly.set(hour, hourActivity + 1);

    // Command patterns
    if (memory.type === 'command') {
      const recentCommands = this.context.recent
        .filter(m => m.type === 'command')
        .map(m => m.content);

      // Detect command sequences
      if (recentCommands.length > 2) {
        const sequence = recentCommands.slice(-3).join(' -> ');
        const seqCount = this.context.patterns.get(`seq:${sequence}`) || 0;
        this.context.patterns.set(`seq:${sequence}`, seqCount + 1);
      }
    }

    // Project patterns
    if (memory.context.project) {
      const projectType = this.detectProjectType(memory.context.project);
      const typeCount = this.context.patterns.get(`project:${projectType}`) || 0;
      this.context.patterns.set(`project:${projectType}`, typeCount + 1);
    }
  }

  detectProjectType(projectName) {
    if (projectName.toLowerCase().includes('mcp')) return 'mcp';
    if (projectName.toLowerCase().includes('ai') || projectName.toLowerCase().includes('agent'))
      return 'ai';
    if (projectName.toLowerCase().includes('game') || projectName.toLowerCase().includes('bot'))
      return 'game';
    if (projectName.toLowerCase().includes('tool')) return 'tool';
    return 'general';
  }

  /**
   * Recall memories
   */
  async recall(query) {
    const results = {
      exact: [],
      related: [],
      context: [],
      suggestions: [],
    };

    // Search by keywords
    const keywords = this.extractKeywords(query);
    for (const keyword of keywords) {
      const memoryIds = this.indices.byKeyword.get(keyword) || [];
      for (const id of memoryIds) {
        const memory = this.memories.interactions.find(m => m.id === id);
        if (memory) {
          results.related.push(memory);
        }
      }
    }

    // Add context-based memories
    if (this.context.current.project) {
      const projectMemoryIds = this.memories.projects.get(this.context.current.project) || [];
      for (const id of projectMemoryIds.slice(-10)) {
        // Last 10 from current project
        const memory = this.memories.interactions.find(m => m.id === id);
        if (memory) {
          results.context.push(memory);
        }
      }
    }

    // Add suggestions based on patterns
    results.suggestions = await this.generateSuggestions(query);

    // Sort by relevance and recency
    results.related.sort((a, b) => {
      const scoreA = a.importance + (Date.now() - a.timestamp) / 1000000000;
      const scoreB = b.importance + (Date.now() - b.timestamp) / 1000000000;
      return scoreB - scoreA;
    });

    return results;
  }

  /**
   * Generate suggestions based on patterns
   */
  async generateSuggestions(query) {
    const suggestions = [];

    // Based on time patterns
    const currentHour = new Date().getHours();
    const hourlyActivity = this.temporal.hourly.get(currentHour) || 0;
    if (hourlyActivity > 5) {
      suggestions.push({
        type: 'time-based',
        message: `You're usually active at this time (${hourlyActivity} interactions typically)`,
        confidence: 0.8,
      });
    }

    // Based on project patterns
    if (query.toLowerCase().includes('create') || query.toLowerCase().includes('new')) {
      const topProjectTypes = Array.from(this.context.patterns.entries())
        .filter(([key]) => key.startsWith('project:'))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      for (const [key, count] of topProjectTypes) {
        const type = key.replace('project:', '');
        suggestions.push({
          type: 'project-suggestion',
          message: `Consider creating a ${type} project (you've made ${count} before)`,
          confidence: 0.7,
        });
      }
    }

    // Based on recent errors
    const recentErrors = Array.from(this.memories.errors.values()).flat().slice(-5);
    for (const error of recentErrors) {
      if (error.outcome === 'resolved') {
        suggestions.push({
          type: 'error-prevention',
          message: `Remember: ${error.content} was resolved by ${error.metadata.solution}`,
          confidence: 0.6,
        });
      }
    }

    return suggestions;
  }

  /**
   * Update statistics
   */
  updateStatistics(memory) {
    // Update success rate
    const successes = this.memories.successes.size;
    const errors = this.memories.errors.size;
    const total = successes + errors;
    this.stats.successRate = total > 0 ? successes / total : 0;

    // Update most active hour
    let maxActivity = 0;
    let mostActiveHour = 0;
    for (const [hour, count] of this.temporal.hourly) {
      if (count > maxActivity) {
        maxActivity = count;
        mostActiveHour = hour;
      }
    }
    this.stats.mostActiveHour = mostActiveHour;

    // Update favorite project
    let maxProjectMemories = 0;
    let favoriteProject = null;
    for (const [project, memories] of this.memories.projects) {
      if (memories.length > maxProjectMemories) {
        maxProjectMemories = memories.length;
        favoriteProject = project;
      }
    }
    this.stats.favoriteProject = favoriteProject;
  }

  /**
   * Compress old memories
   */
  async compressOldMemories() {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
    const toCompress = this.memories.interactions.filter(m => m.timestamp < cutoff);

    if (toCompress.length > 0) {
      // Save to archive
      const archivePath = path.join(
        this.config.memoryDir,
        'archives',
        `archive-${Date.now()}.json`
      );

      await fs.mkdir(path.join(this.config.memoryDir, 'archives'), { recursive: true });
      await fs.writeFile(archivePath, JSON.stringify(toCompress, null, 2));

      // Remove from active memory
      this.memories.interactions = this.memories.interactions.filter(m => m.timestamp >= cutoff);

      console.log(`📦 Archived ${toCompress.length} old memories`);
    }
  }

  /**
   * Get memory summary
   */
  async getMemorySummary() {
    return {
      user: this.userProfile,
      totals: {
        interactions: this.memories.interactions.length,
        commands: this.memories.commands.size,
        projects: this.memories.projects.size,
        successes: this.memories.successes.size,
        errors: this.memories.errors.size,
      },
      emotional: {
        positive: this.emotional.positive.length,
        negative: this.emotional.negative.length,
        neutral: this.emotional.neutral.length,
      },
      patterns: {
        mostUsedCommand: this.getMostUsedCommand(),
        favoriteProjectType: this.getFavoriteProjectType(),
        peakHour: this.stats.mostActiveHour,
        currentFocus: this.context.current.focus,
      },
      knowledge: {
        concepts: this.knowledgeGraph.nodes.size,
        relationships: this.knowledgeGraph.edges.size,
      },
      statistics: this.stats,
    };
  }

  getMostUsedCommand() {
    let maxCount = 0;
    let mostUsed = null;

    for (const [command, count] of this.memories.commands) {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = command;
      }
    }

    return { command: mostUsed, count: maxCount };
  }

  getFavoriteProjectType() {
    const types = new Map();

    for (const [pattern, count] of this.context.patterns) {
      if (pattern.startsWith('project:')) {
        const type = pattern.replace('project:', '');
        types.set(type, count);
      }
    }

    let maxCount = 0;
    let favorite = null;

    for (const [type, count] of types) {
      if (count > maxCount) {
        maxCount = count;
        favorite = type;
      }
    }

    return { type: favorite, count: maxCount };
  }

  /**
   * Storage operations
   */
  async saveMemory(memory) {
    const filepath = path.join(this.config.memoryDir, 'interactions', `${memory.id}.json`);

    await fs.writeFile(filepath, JSON.stringify(memory, null, 2));
  }

  async saveMemories() {
    // Save current state
    const state = {
      memories: {
        interactions: this.memories.interactions.slice(-1000), // Last 1000
        commands: Array.from(this.memories.commands.entries()),
        projects: Array.from(this.memories.projects.entries()),
      },
      context: this.context,
      knowledge: {
        nodes: Array.from(this.knowledgeGraph.nodes.entries()),
        edges: Array.from(this.knowledgeGraph.edges.entries()),
      },
      stats: this.stats,
      savedAt: Date.now(),
    };

    const filepath = path.join(this.config.memoryDir, 'memory-state.json');
    await fs.writeFile(filepath, JSON.stringify(state, null, 2));
  }

  async loadMemories() {
    try {
      const filepath = path.join(this.config.memoryDir, 'memory-state.json');
      const content = await fs.readFile(filepath, 'utf8');
      const state = JSON.parse(content);

      // Restore memories
      this.memories.interactions = state.memories.interactions;
      this.memories.commands = new Map(state.memories.commands);
      this.memories.projects = new Map(state.memories.projects);

      // Restore context
      this.context = state.context;

      // Restore knowledge graph
      this.knowledgeGraph.nodes = new Map(state.knowledge.nodes);
      this.knowledgeGraph.edges = new Map(state.knowledge.edges);

      // Restore stats
      this.stats = state.stats;

      console.log(`📂 Loaded ${this.memories.interactions.length} memories`);
    } catch (error) {
      console.log('🆕 Starting fresh memory system');
    }
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      user: this.userProfile,
      memories: {
        total: this.memories.interactions.length,
        recent: this.context.recent.length,
        indexed: this.indices.byKeyword.size,
      },
      knowledge: {
        concepts: this.knowledgeGraph.nodes.size,
        relationships: this.knowledgeGraph.edges.size,
      },
      patterns: this.context.patterns.size,
      statistics: this.stats,
    };
  }

  async shutdown() {
    // Save all memories
    await this.saveMemories();

    // Generate summary report
    const summary = await this.getMemorySummary();
    const reportPath = path.join(this.config.memoryDir, `memory-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));

    this.emit('shutdown');
    console.log('✅ Interaction Memory System shutdown complete');
    console.log(`   Total interactions: ${this.stats.totalInteractions}`);
    console.log(`   Knowledge nodes: ${this.knowledgeGraph.nodes.size}`);
  }
}

module.exports = InteractionMemorySystem;
