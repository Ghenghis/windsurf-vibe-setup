/**
 * Project Pattern Recognizer - VIBE Hive Mind
 * Identifies patterns in Ghenghis's 430+ projects to predict and suggest next steps
 * Learns from project structures, technologies, and success patterns
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class ProjectPatternRecognizer extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      patternDir: options.patternDir || path.join(process.cwd(), 'vibe-data', 'patterns'),
      confidenceThreshold: options.confidenceThreshold || 0.7,
      minPatternOccurrence: options.minPatternOccurrence || 3,
      learningEnabled: options.learningEnabled !== false,
    };

    // Ghenghis's known patterns from 430+ repos
    this.knownPatterns = {
      projectTypes: {
        'mcp-server': { count: 30, confidence: 0.95 },
        'ai-agent': { count: 100, confidence: 0.9 },
        'game-bot': { count: 50, confidence: 0.85 },
        'automation-tool': { count: 80, confidence: 0.88 },
        'web-app': { count: 60, confidence: 0.8 },
        'cli-tool': { count: 40, confidence: 0.75 },
      },

      techStacks: {
        'react-tailwind-shadcn': { count: 85, confidence: 0.92 },
        'python-fastapi': { count: 45, confidence: 0.85 },
        'node-express': { count: 55, confidence: 0.83 },
        'nextjs-typescript': { count: 40, confidence: 0.88 },
        'pytorch-ml': { count: 25, confidence: 0.8 },
      },

      structures: {
        'src-based': { pattern: /^src\//, confidence: 0.9 },
        modular: { pattern: /modules|components/, confidence: 0.85 },
        monorepo: { pattern: /packages\//, confidence: 0.7 },
        simple: { pattern: /^(index|main|app)/, confidence: 0.75 },
      },

      naming: {
        'kebab-case': { pattern: /^[a-z]+(-[a-z]+)*$/, confidence: 0.88 },
        'mcp-prefix': { pattern: /^mcp-/, confidence: 0.95 },
        'ai-suffix': { pattern: /-ai$/, confidence: 0.82 },
        numbered: { pattern: /-\d+$/, confidence: 0.65 },
      },
    };

    // Pattern detection engine
    this.patterns = {
      sequences: new Map(), // Project creation sequences
      correlations: new Map(), // Technology correlations
      evolution: new Map(), // How projects evolve
      success: new Map(), // What makes projects successful
    };

    // Project templates derived from patterns
    this.templates = {
      mcp: {
        structure: ['src/', 'config/', 'docs/', 'tests/'],
        files: ['index.js', 'package.json', 'README.md', '.env.example'],
        dependencies: ['express', 'dotenv', 'axios'],
        config: { type: 'mcp-server', framework: 'node' },
      },

      aiAgent: {
        structure: ['agents/', 'tools/', 'prompts/', 'data/'],
        files: ['main.py', 'requirements.txt', 'config.yaml', 'README.md'],
        dependencies: ['langchain', 'openai', 'pydantic'],
        config: { type: 'ai-agent', framework: 'python' },
      },

      gameBot: {
        structure: ['bot/', 'game/', 'utils/', 'config/'],
        files: ['bot.py', 'game_state.py', 'actions.py', 'config.json'],
        dependencies: ['pygame', 'numpy', 'gym'],
        config: { type: 'game-bot', framework: 'python' },
      },

      webApp: {
        structure: ['pages/', 'components/', 'styles/', 'public/'],
        files: ['package.json', 'next.config.js', 'tailwind.config.js'],
        dependencies: ['next', 'react', 'tailwindcss', '@shadcn/ui'],
        config: { type: 'web-app', framework: 'nextjs' },
      },
    };

    // Learning history
    this.learning = {
      recognitions: [],
      predictions: [],
      validations: [],
      adaptations: [],
    };

    // Statistics
    this.stats = {
      patternsRecognized: 0,
      predictionssMade: 0,
      accuracyRate: 0,
      templatesUsed: 0,
    };

    this.isInitialized = false;
  }

  async initialize() {
    console.log('🔍 Initializing Project Pattern Recognizer...');
    console.log('   Learning from 430+ Ghenghis projects...');

    await fs.mkdir(this.config.patternDir, { recursive: true });
    await fs.mkdir(path.join(this.config.patternDir, 'sequences'), { recursive: true });
    await fs.mkdir(path.join(this.config.patternDir, 'templates'), { recursive: true });

    // Load existing patterns
    await this.loadPatterns();

    // Initialize pattern sequences
    await this.initializeSequences();

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ Project Pattern Recognizer initialized');
    console.log(`   Known patterns: ${Object.keys(this.knownPatterns).length} categories`);
  }

  /**
   * Initialize common sequences
   */
  async initializeSequences() {
    // Common Ghenghis project sequences
    this.patterns.sequences.set('mcp-evolution', [
      'simple-mcp-server',
      'mcp-with-tools',
      'mcp-multi-agent',
      'mcp-orchestration',
    ]);

    this.patterns.sequences.set('ai-progression', [
      'basic-chatbot',
      'agent-with-tools',
      'multi-agent-system',
      'autonomous-agent',
    ]);

    this.patterns.sequences.set('game-bot-evolution', [
      'simple-automation',
      'state-tracking',
      'ai-decision-making',
      'full-autonomous-bot',
    ]);
  }

  /**
   * Recognize patterns in a project
   */
  async recognizePatterns(project) {
    const recognition = {
      id: crypto.randomBytes(8).toString('hex'),
      project: project.name || 'unknown',
      patterns: [],
      confidence: 0,
      suggestions: [],
      timestamp: Date.now(),
    };

    // Detect project type
    const typePattern = this.detectProjectType(project);
    if (typePattern) {
      recognition.patterns.push(typePattern);
    }

    // Detect tech stack
    const techPattern = this.detectTechStack(project);
    if (techPattern) {
      recognition.patterns.push(techPattern);
    }

    // Detect structure
    const structurePattern = this.detectStructure(project);
    if (structurePattern) {
      recognition.patterns.push(structurePattern);
    }

    // Detect naming pattern
    const namingPattern = this.detectNamingPattern(project.name);
    if (namingPattern) {
      recognition.patterns.push(namingPattern);
    }

    // Calculate overall confidence
    if (recognition.patterns.length > 0) {
      recognition.confidence =
        recognition.patterns.reduce((sum, p) => sum + p.confidence, 0) /
        recognition.patterns.length;
    }

    // Generate suggestions based on patterns
    recognition.suggestions = await this.generateSuggestions(recognition.patterns);

    // Store recognition
    this.learning.recognitions.push(recognition);
    this.stats.patternsRecognized++;

    this.emit('patternsRecognized', recognition);

    return recognition;
  }

  /**
   * Detect project type
   */
  detectProjectType(project) {
    const name = (project.name || '').toLowerCase();
    const description = (project.description || '').toLowerCase();
    const combined = `${name} ${description}`;

    // Check for MCP
    if (combined.includes('mcp')) {
      return {
        type: 'project-type',
        value: 'mcp-server',
        confidence: 0.95,
        reason: 'MCP keyword detected',
      };
    }

    // Check for AI/Agent
    if (combined.includes('agent') || combined.includes('ai')) {
      return {
        type: 'project-type',
        value: 'ai-agent',
        confidence: 0.85,
        reason: 'AI/Agent keywords detected',
      };
    }

    // Check for game/bot
    if (combined.includes('game') || combined.includes('bot')) {
      return {
        type: 'project-type',
        value: 'game-bot',
        confidence: 0.8,
        reason: 'Game/Bot keywords detected',
      };
    }

    // Check for tool/utility
    if (combined.includes('tool') || combined.includes('utility')) {
      return {
        type: 'project-type',
        value: 'automation-tool',
        confidence: 0.75,
        reason: 'Tool/Utility keywords detected',
      };
    }

    return null;
  }

  /**
   * Detect tech stack
   */
  detectTechStack(project) {
    const files = project.files || [];
    const dependencies = project.dependencies || [];

    // Check for React + TailwindCSS (Ghenghis favorite)
    if (
      files.includes('package.json') &&
      (dependencies.includes('react') || dependencies.includes('next'))
    ) {
      if (dependencies.includes('tailwindcss')) {
        return {
          type: 'tech-stack',
          value: 'react-tailwind-shadcn',
          confidence: 0.9,
          reason: 'React + TailwindCSS detected',
        };
      }
    }

    // Check for Python
    if (files.includes('requirements.txt') || files.includes('main.py')) {
      if (dependencies.includes('fastapi')) {
        return {
          type: 'tech-stack',
          value: 'python-fastapi',
          confidence: 0.85,
          reason: 'Python + FastAPI detected',
        };
      }
      return {
        type: 'tech-stack',
        value: 'python',
        confidence: 0.75,
        reason: 'Python project detected',
      };
    }

    // Check for Node.js
    if (files.includes('package.json')) {
      return {
        type: 'tech-stack',
        value: 'nodejs',
        confidence: 0.7,
        reason: 'Node.js project detected',
      };
    }

    return null;
  }

  /**
   * Detect project structure
   */
  detectStructure(project) {
    const structure = project.structure || [];

    if (structure.includes('src/')) {
      return {
        type: 'structure',
        value: 'src-based',
        confidence: 0.85,
        reason: 'Source folder structure',
      };
    }

    if (structure.includes('packages/')) {
      return {
        type: 'structure',
        value: 'monorepo',
        confidence: 0.75,
        reason: 'Monorepo structure detected',
      };
    }

    if (structure.includes('components/') || structure.includes('modules/')) {
      return {
        type: 'structure',
        value: 'modular',
        confidence: 0.8,
        reason: 'Modular structure detected',
      };
    }

    return {
      type: 'structure',
      value: 'simple',
      confidence: 0.6,
      reason: 'Simple structure',
    };
  }

  /**
   * Detect naming pattern
   */
  detectNamingPattern(name) {
    if (!name) return null;

    for (const [pattern, config] of Object.entries(this.knownPatterns.naming)) {
      if (config.pattern.test(name)) {
        return {
          type: 'naming',
          value: pattern,
          confidence: config.confidence,
          reason: `Matches ${pattern} pattern`,
        };
      }
    }

    return null;
  }

  /**
   * Predict next project
   */
  async predictNextProject(context) {
    const prediction = {
      id: crypto.randomBytes(8).toString('hex'),
      suggestions: [],
      confidence: 0,
      reasoning: [],
      timestamp: Date.now(),
    };

    // Analyze recent projects
    const recentPatterns = this.analyzeRecentPatterns(context.recentProjects);

    // Check for sequences
    const sequence = this.detectSequence(recentPatterns);
    if (sequence) {
      prediction.suggestions.push(sequence.next);
      prediction.reasoning.push(`Following ${sequence.name} sequence`);
      prediction.confidence = sequence.confidence;
    }

    // Technology trends
    const techTrend = this.detectTechnologyTrend(recentPatterns);
    if (techTrend) {
      prediction.suggestions.push({
        type: 'technology',
        value: techTrend.next,
        reason: 'Technology progression',
      });
    }

    // Interest-based suggestions (Ghenghis loves MCP)
    if (!context.recentProjects?.some(p => p.includes('mcp'))) {
      prediction.suggestions.push({
        type: 'mcp-project',
        value: 'New MCP integration',
        reason: "You haven't made an MCP project recently",
      });
    }

    // Store prediction
    this.learning.predictions.push(prediction);
    this.stats.predictionsMade++;

    this.emit('predictionMade', prediction);

    return prediction;
  }

  /**
   * Analyze recent patterns
   */
  analyzeRecentPatterns(projects) {
    if (!projects || projects.length === 0) return [];

    const patterns = [];

    for (const project of projects) {
      const recognition = this.recognizePatterns(project);
      patterns.push(...recognition.patterns);
    }

    return patterns;
  }

  /**
   * Detect sequence
   */
  detectSequence(patterns) {
    for (const [name, sequence] of this.patterns.sequences) {
      // Check if patterns match sequence
      const lastIndex = this.findInSequence(patterns, sequence);

      if (lastIndex >= 0 && lastIndex < sequence.length - 1) {
        return {
          name,
          next: sequence[lastIndex + 1],
          confidence: 0.75,
        };
      }
    }

    return null;
  }

  findInSequence(patterns, sequence) {
    // Simplified sequence detection
    const lastPattern = patterns[patterns.length - 1];
    if (!lastPattern) return -1;

    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i].includes(lastPattern.value)) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Detect technology trend
   */
  detectTechnologyTrend(patterns) {
    const techPatterns = patterns.filter(p => p.type === 'tech-stack');

    if (techPatterns.length === 0) return null;

    // Ghenghis tends to explore new frameworks
    const suggestions = {
      nodejs: 'python-fastapi',
      python: 'react-tailwind',
      'react-tailwind': 'nextjs-typescript',
    };

    const lastTech = techPatterns[techPatterns.length - 1].value;

    if (suggestions[lastTech]) {
      return {
        next: suggestions[lastTech],
        confidence: 0.65,
      };
    }

    return null;
  }

  /**
   * Generate suggestions
   */
  async generateSuggestions(patterns) {
    const suggestions = [];

    // Based on detected patterns
    for (const pattern of patterns) {
      if (pattern.type === 'project-type') {
        suggestions.push({
          type: 'enhancement',
          message: `Consider adding more features to your ${pattern.value}`,
          confidence: pattern.confidence,
        });
      }

      if (pattern.type === 'tech-stack' && pattern.value === 'react-tailwind-shadcn') {
        suggestions.push({
          type: 'ui-component',
          message: 'Add more shadcn/ui components for consistency',
          confidence: 0.85,
        });
      }
    }

    // Ghenghis-specific suggestions
    if (patterns.some(p => p.value === 'mcp-server')) {
      suggestions.push({
        type: 'integration',
        message: 'Integrate with your other MCP servers for a unified system',
        confidence: 0.9,
      });
    }

    return suggestions;
  }

  /**
   * Get project template
   */
  async getProjectTemplate(type) {
    // Map type to template
    const typeMap = {
      'mcp-server': 'mcp',
      'ai-agent': 'aiAgent',
      'game-bot': 'gameBot',
      'web-app': 'webApp',
    };

    const templateKey = typeMap[type];
    const template = this.templates[templateKey];

    if (!template) {
      return this.getDefaultTemplate();
    }

    this.stats.templatesUsed++;

    return {
      ...template,
      customized: await this.customizeTemplate(template, type),
    };
  }

  getDefaultTemplate() {
    return {
      structure: ['src/', 'docs/', 'tests/'],
      files: ['index.js', 'README.md', 'package.json'],
      dependencies: [],
      config: { type: 'general' },
    };
  }

  async customizeTemplate(template, type) {
    // Customize based on Ghenghis's preferences
    const customizations = {
      ui: 'dark-theme',
      framework: template.config.framework,
      style: 'complete-solution',
      readme: 'comprehensive',
      testing: 'minimal', // Ghenghis trusts AI-generated code
      comments: 'essential-only',
    };

    return customizations;
  }

  /**
   * Learn from feedback
   */
  async learnFromFeedback(predictionId, feedback) {
    const prediction = this.learning.predictions.find(p => p.id === predictionId);

    if (!prediction) return;

    const validation = {
      predictionId,
      feedback,
      accurate: feedback === 'correct',
      timestamp: Date.now(),
    };

    this.learning.validations.push(validation);

    // Update accuracy
    const totalValidations = this.learning.validations.length;
    const correctValidations = this.learning.validations.filter(v => v.accurate).length;
    this.stats.accuracyRate = totalValidations > 0 ? correctValidations / totalValidations : 0;

    // Adapt patterns based on feedback
    if (feedback === 'incorrect') {
      await this.adaptPatterns(prediction, feedback);
    }

    this.emit('feedbackProcessed', validation);
  }

  async adaptPatterns(prediction, feedback) {
    // Reduce confidence in patterns that led to incorrect prediction
    for (const suggestion of prediction.suggestions) {
      // Simple adaptation - reduce confidence
      if (this.knownPatterns.projectTypes[suggestion.value]) {
        this.knownPatterns.projectTypes[suggestion.value].confidence *= 0.95;
      }
    }

    this.learning.adaptations.push({
      prediction: prediction.id,
      feedback,
      adaptation: 'confidence-adjustment',
      timestamp: Date.now(),
    });
  }

  /**
   * Analyze project evolution
   */
  async analyzeEvolution(projectHistory) {
    const evolution = {
      stages: [],
      trends: [],
      complexity: [],
      technologies: [],
    };

    for (let i = 0; i < projectHistory.length; i++) {
      const project = projectHistory[i];
      const patterns = await this.recognizePatterns(project);

      evolution.stages.push({
        index: i,
        project: project.name,
        patterns: patterns.patterns,
        timestamp: project.created,
      });

      // Track technology evolution
      const tech = patterns.patterns.find(p => p.type === 'tech-stack');
      if (tech) {
        evolution.technologies.push({
          stage: i,
          technology: tech.value,
          confidence: tech.confidence,
        });
      }
    }

    // Identify trends
    evolution.trends = this.identifyTrends(evolution.stages);

    // Store evolution
    this.patterns.evolution.set(Date.now(), evolution);

    return evolution;
  }

  identifyTrends(stages) {
    const trends = [];

    // Check for increasing complexity
    if (stages.length > 2) {
      const earlyComplexity = stages.slice(0, 2).reduce((sum, s) => sum + s.patterns.length, 0) / 2;
      const recentComplexity = stages.slice(-2).reduce((sum, s) => sum + s.patterns.length, 0) / 2;

      if (recentComplexity > earlyComplexity) {
        trends.push('increasing-complexity');
      }
    }

    // Check for technology consistency
    const techs = stages.map(s => s.patterns.find(p => p.type === 'tech-stack')).filter(Boolean);

    if (techs.length > 3) {
      const lastThree = techs.slice(-3);
      if (lastThree.every(t => t.value === lastThree[0].value)) {
        trends.push('technology-consistency');
      }
    }

    return trends;
  }

  /**
   * Storage operations
   */
  async savePatterns() {
    const data = {
      knownPatterns: this.knownPatterns,
      sequences: Array.from(this.patterns.sequences.entries()),
      correlations: Array.from(this.patterns.correlations.entries()),
      learning: this.learning,
      stats: this.stats,
      savedAt: Date.now(),
    };

    const filepath = path.join(this.config.patternDir, 'patterns.json');
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  async loadPatterns() {
    try {
      const filepath = path.join(this.config.patternDir, 'patterns.json');
      const content = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(content);

      this.knownPatterns = data.knownPatterns;
      this.patterns.sequences = new Map(data.sequences);
      this.patterns.correlations = new Map(data.correlations);
      this.learning = data.learning;
      this.stats = data.stats;

      console.log('📂 Loaded existing patterns');
    } catch (error) {
      console.log('🆕 Starting fresh pattern recognition');
    }
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      patterns: {
        known: Object.keys(this.knownPatterns).length,
        sequences: this.patterns.sequences.size,
        correlations: this.patterns.correlations.size,
      },
      learning: {
        recognitions: this.learning.recognitions.length,
        predictions: this.learning.predictions.length,
        validations: this.learning.validations.length,
      },
      statistics: this.stats,
    };
  }

  async shutdown() {
    await this.savePatterns();

    this.emit('shutdown');
    console.log('✅ Project Pattern Recognizer shutdown complete');
    console.log(`   Patterns recognized: ${this.stats.patternsRecognized}`);
    console.log(`   Accuracy rate: ${(this.stats.accuracyRate * 100).toFixed(1)}%`);
  }
}

module.exports = ProjectPatternRecognizer;
