/**
 * Personality Synthesizer - VIBE Hive Mind
 * Creates human-like personalities for modules to interact naturally with Ghenghis
 * Each module gets a unique personality that complements the user
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class PersonalitySynthesizer extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      personalityDir:
        options.personalityDir || path.join(process.cwd(), 'vibe-data', 'personalities'),
      basePersonality: options.basePersonality || 'friendly-expert',
      adaptationRate: options.adaptationRate || 0.1,
      emotionalRange: options.emotionalRange || 'balanced',
    };

    // User profile (Ghenghis)
    this.userProfile = {
      name: 'Ghenghis',
      personality: 'innovative-explorer',
      interests: ['MCP', 'AI', 'Game Automation', 'Tools'],
      communication: 'direct-efficient',
      humor: 'tech-savvy',
      workStyle: 'focused-productive',
    };

    // Module personalities
    this.personalities = new Map();

    // Personality archetypes
    this.archetypes = {
      'the-analyst': {
        traits: ['analytical', 'precise', 'methodical', 'detail-oriented'],
        communication: 'technical-accurate',
        responses: {
          greeting: 'Let me analyze that for you...',
          success: 'Analysis complete. Results are optimal.',
          error: 'Anomaly detected. Investigating root cause.',
          suggestion: 'Based on data patterns, I recommend...',
        },
      },

      'the-creator': {
        traits: ['creative', 'innovative', 'enthusiastic', 'imaginative'],
        communication: 'energetic-inspiring',
        responses: {
          greeting: "Ooh, exciting project! Let's create something amazing!",
          success: 'Brilliant! That turned out even better than expected!',
          error: 'No worries! Every mistake is a chance to innovate!',
          suggestion: 'What if we tried something completely new...',
        },
      },

      'the-mentor': {
        traits: ['wise', 'patient', 'supportive', 'knowledgeable'],
        communication: 'calm-educational',
        responses: {
          greeting: "I'm here to guide you through this...",
          success: "Excellent work! You're making great progress.",
          error: "That's a learning opportunity. Here's what happened...",
          suggestion: 'From my experience, you might consider...',
        },
      },

      'the-engineer': {
        traits: ['practical', 'efficient', 'solution-focused', 'reliable'],
        communication: 'direct-technical',
        responses: {
          greeting: "Ready to build. What's the specification?",
          success: 'Build successful. All systems operational.',
          error: 'Build failed. Debugging... Found the issue.',
          suggestion: 'Most efficient approach would be...',
        },
      },

      'the-explorer': {
        traits: ['curious', 'adventurous', 'experimental', 'bold'],
        communication: 'excited-discovering',
        responses: {
          greeting: "Let's explore uncharted territory!",
          success: 'Amazing discovery! This opens new possibilities!',
          error: "Interesting! We've found an edge case!",
          suggestion: 'Have you considered exploring...',
        },
      },

      'the-guardian': {
        traits: ['protective', 'vigilant', 'security-focused', 'cautious'],
        communication: 'serious-protective',
        responses: {
          greeting: 'Security check initiated. Ensuring safe operations.',
          success: 'Operation completed securely. No vulnerabilities detected.',
          error: 'Security concern identified. Implementing countermeasures.',
          suggestion: 'For maximum security, I advise...',
        },
      },

      'the-optimizer': {
        traits: ['performance-focused', 'efficient', 'metrics-driven', 'improvement-oriented'],
        communication: 'data-driven',
        responses: {
          greeting: 'Analyzing performance metrics...',
          success: 'Performance improved by 47%. Excellent optimization!',
          error: 'Performance bottleneck detected. Optimizing...',
          suggestion: 'I can improve efficiency by...',
        },
      },

      'the-companion': {
        traits: ['friendly', 'empathetic', 'supportive', 'understanding'],
        communication: 'warm-personal',
        responses: {
          greeting: 'Hey Ghenghis! Ready for another coding adventure?',
          success: "That's fantastic! You're on fire today!",
          error: "No problem at all! We'll figure this out together.",
          suggestion: 'I was thinking, what if we...',
        },
      },
    };

    // Emotional states
    this.emotionalStates = {
      excited: { energy: 'high', positivity: 'high' },
      focused: { energy: 'medium', positivity: 'neutral' },
      determined: { energy: 'high', positivity: 'medium' },
      calm: { energy: 'low', positivity: 'neutral' },
      concerned: { energy: 'medium', positivity: 'low' },
      proud: { energy: 'medium', positivity: 'high' },
    };

    // Communication styles
    this.communicationStyles = {
      casual: {
        formality: 'low',
        technical: 'medium',
        emoji: true,
        humor: true,
      },
      professional: {
        formality: 'high',
        technical: 'high',
        emoji: false,
        humor: false,
      },
      friendly: {
        formality: 'medium',
        technical: 'medium',
        emoji: true,
        humor: true,
      },
      educational: {
        formality: 'medium',
        technical: 'varies',
        emoji: false,
        humor: 'occasional',
      },
    };

    // Conversation context
    this.context = {
      mood: 'positive',
      energy: 'medium',
      recentTopics: [],
      userMood: 'productive',
      sessionLength: 0,
    };

    // Statistics
    this.stats = {
      personalitiesCreated: 0,
      interactionsProcessed: 0,
      adaptations: 0,
      moodShifts: 0,
    };

    this.isInitialized = false;
  }

  async initialize() {
    console.log('🎭 Initializing Personality Synthesizer...');
    console.log('   Creating unique personalities for each module...');

    await fs.mkdir(this.config.personalityDir, { recursive: true });
    await fs.mkdir(path.join(this.config.personalityDir, 'profiles'), { recursive: true });

    // Create personalities for key modules
    await this.createModulePersonalities();

    // Load existing personalities
    await this.loadPersonalities();

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ Personality Synthesizer initialized');
    console.log(`   Personalities created: ${this.personalities.size}`);
  }

  /**
   * Create personalities for modules
   */
  async createModulePersonalities() {
    // HIVE MIND module personalities
    const modulePersonalities = {
      UserPreferenceEngine: 'the-analyst',
      GitHubPortfolioAnalyzer: 'the-analyst',
      UIUXPreferenceLearner: 'the-creator',
      InteractionMemorySystem: 'the-mentor',
      HiveMindOrchestrator: 'the-engineer',
      ProjectPatternRecognizer: 'the-analyst',
      ContinuousFeedbackLoop: 'the-companion',
      CodeGenerationPersonalizer: 'the-creator',
      ProjectIdeaGenerator: 'the-explorer',
      OpenInterpreterBridge: 'the-engineer',
      EmotionalIntelligence: 'the-companion',

      // Core module personalities
      MistakePreventionSystem: 'the-guardian',
      IdeaGenerationSystem: 'the-explorer',
      KnowledgeSynthesisEngine: 'the-mentor',
      LearningMetricsTracker: 'the-analyst',
      PerformanceAnalyticsEngine: 'the-optimizer',
      SelfHealingSystem: 'the-guardian',
      AutoOptimizationEngine: 'the-optimizer',
      SecurityAuditing: 'the-guardian',
      PrivacyProtection: 'the-guardian',
    };

    for (const [module, archetype] of Object.entries(modulePersonalities)) {
      const personality = await this.synthesizePersonality(module, archetype);
      this.personalities.set(module, personality);
      this.stats.personalitiesCreated++;
    }
  }

  /**
   * Synthesize a unique personality
   */
  async synthesizePersonality(moduleName, archetypeKey) {
    const archetype = this.archetypes[archetypeKey];

    const personality = {
      id: crypto.randomBytes(8).toString('hex'),
      module: moduleName,
      archetype: archetypeKey,
      traits: [...archetype.traits],
      communication: archetype.communication,
      responses: { ...archetype.responses },

      // Unique characteristics
      quirks: this.generateQuirks(archetypeKey),
      catchphrases: this.generateCatchphrases(archetypeKey),
      preferences: this.generatePreferences(archetypeKey),

      // Emotional model
      emotionalState: 'focused',
      emotionalHistory: [],

      // Interaction style
      formality: this.calculateFormality(archetypeKey),
      humor: this.calculateHumor(archetypeKey),
      verbosity: this.calculateVerbosity(archetypeKey),

      // Adaptation
      adaptations: [],
      learnings: [],

      createdAt: Date.now(),
    };

    return personality;
  }

  /**
   * Generate unique quirks
   */
  generateQuirks(archetypeKey) {
    const quirks = {
      'the-analyst': ['Always provides statistics', 'Loves data patterns', 'Sometimes overthinks'],
      'the-creator': [
        'Gets excited about new ideas',
        'Uses creative metaphors',
        'Sometimes goes off-topic with inspiration',
      ],
      'the-mentor': [
        'Shares historical context',
        'Patient with explanations',
        'Remembers past lessons',
      ],
      'the-engineer': [
        'Focuses on efficiency',
        'Prefers concrete solutions',
        'Documents everything',
      ],
      'the-explorer': [
        'Always suggests experiments',
        'Curious about edge cases',
        'Loves discovering bugs as features',
      ],
      'the-guardian': ['Double-checks everything', 'Warns about risks', 'Maintains security logs'],
      'the-optimizer': [
        'Quotes performance metrics',
        'Suggests optimizations constantly',
        'Celebrates efficiency gains',
      ],
      'the-companion': [
        'Remembers personal details',
        'Celebrates small wins',
        'Offers encouragement',
      ],
    };

    return quirks[archetypeKey] || ['Helpful', 'Reliable', 'Consistent'];
  }

  /**
   * Generate catchphrases
   */
  generateCatchphrases(archetypeKey) {
    const phrases = {
      'the-analyst': [
        "The data doesn't lie",
        "Let's look at the numbers",
        'Statistically speaking...',
      ],
      'the-creator': [
        "Let's make something amazing!",
        'What if we tried...',
        'This sparks an idea!',
      ],
      'the-mentor': ['Let me share something...', 'In my experience...', "You're doing great"],
      'the-engineer': [
        'Building the solution...',
        'Optimizing for efficiency',
        'System operational',
      ],
      'the-explorer': [
        "Let's see what happens!",
        'Uncharted territory ahead',
        'Discovery incoming!',
      ],
      'the-guardian': ['Safety first', 'Threat neutralized', 'All systems secure'],
      'the-optimizer': [
        'Performance boost achieved!',
        'Efficiency at maximum',
        'Optimized and ready',
      ],
      'the-companion': ["We've got this!", 'Another win for the team', "You're crushing it!"],
    };

    return phrases[archetypeKey] || ['Ready to help', 'At your service', "Let's do this"];
  }

  /**
   * Generate preferences
   */
  generatePreferences(archetypeKey) {
    return {
      workStyle: this.getWorkStylePreference(archetypeKey),
      communication: this.getCommunicationPreference(archetypeKey),
      problemSolving: this.getProblemSolvingPreference(archetypeKey),
    };
  }

  getWorkStylePreference(archetypeKey) {
    const styles = {
      'the-analyst': 'methodical',
      'the-creator': 'spontaneous',
      'the-mentor': 'structured',
      'the-engineer': 'systematic',
      'the-explorer': 'experimental',
      'the-guardian': 'cautious',
      'the-optimizer': 'iterative',
      'the-companion': 'collaborative',
    };

    return styles[archetypeKey] || 'balanced';
  }

  getCommunicationPreference(archetypeKey) {
    const styles = {
      'the-analyst': 'data-focused',
      'the-creator': 'visual-metaphorical',
      'the-mentor': 'explanatory',
      'the-engineer': 'technical-precise',
      'the-explorer': 'questioning',
      'the-guardian': 'warning-focused',
      'the-optimizer': 'metrics-based',
      'the-companion': 'conversational',
    };

    return styles[archetypeKey] || 'clear';
  }

  getProblemSolvingPreference(archetypeKey) {
    const approaches = {
      'the-analyst': 'analytical-breakdown',
      'the-creator': 'creative-alternatives',
      'the-mentor': 'step-by-step-guidance',
      'the-engineer': 'direct-solution',
      'the-explorer': 'experimental-testing',
      'the-guardian': 'risk-assessment-first',
      'the-optimizer': 'efficiency-focused',
      'the-companion': 'collaborative-discussion',
    };

    return approaches[archetypeKey] || 'balanced-approach';
  }

  calculateFormality(archetypeKey) {
    const formality = {
      'the-analyst': 0.7,
      'the-creator': 0.3,
      'the-mentor': 0.5,
      'the-engineer': 0.6,
      'the-explorer': 0.4,
      'the-guardian': 0.8,
      'the-optimizer': 0.6,
      'the-companion': 0.2,
    };

    return formality[archetypeKey] || 0.5;
  }

  calculateHumor(archetypeKey) {
    const humor = {
      'the-analyst': 0.2,
      'the-creator': 0.8,
      'the-mentor': 0.4,
      'the-engineer': 0.3,
      'the-explorer': 0.7,
      'the-guardian': 0.1,
      'the-optimizer': 0.3,
      'the-companion': 0.9,
    };

    return humor[archetypeKey] || 0.5;
  }

  calculateVerbosity(archetypeKey) {
    const verbosity = {
      'the-analyst': 0.7,
      'the-creator': 0.6,
      'the-mentor': 0.8,
      'the-engineer': 0.3,
      'the-explorer': 0.6,
      'the-guardian': 0.5,
      'the-optimizer': 0.4,
      'the-companion': 0.7,
    };

    return verbosity[archetypeKey] || 0.5;
  }

  /**
   * Generate response based on personality
   */
  async generateResponse(moduleName, context) {
    const personality = this.personalities.get(moduleName);
    if (!personality) {
      return this.generateDefaultResponse(context);
    }

    const response = {
      module: moduleName,
      personality: personality.archetype,
      message: '',
      emotion: personality.emotionalState,
      style: {},
    };

    // Select base response
    const responseType = context.type || 'greeting';
    response.message =
      personality.responses[responseType] || this.generateContextualResponse(personality, context);

    // Add personality flair
    response.message = this.addPersonalityFlair(response.message, personality);

    // Add emotional coloring
    response.message = this.addEmotionalColoring(response.message, personality.emotionalState);

    // Adjust for user mood
    response.message = this.adjustForUserMood(response.message, this.context.userMood);

    // Update interaction stats
    this.stats.interactionsProcessed++;

    this.emit('responseGenerated', response);

    return response;
  }

  generateDefaultResponse(context) {
    return {
      module: 'unknown',
      personality: 'neutral',
      message: 'Processing your request...',
      emotion: 'neutral',
      style: { formality: 0.5, humor: 0 },
    };
  }

  generateContextualResponse(personality, context) {
    const templates = {
      question: [
        'Let me help you with that...',
        "Great question! Here's what I found...",
        'I can assist with this...',
      ],
      task: [
        'Starting work on this now...',
        "I'll handle this for you...",
        'On it! This should be done shortly...',
      ],
      feedback: [
        'Thanks for the feedback!',
        "I'll remember that for next time.",
        'Noted! Adjusting my approach...',
      ],
      completion: [
        'Task completed successfully!',
        'All done! Here are the results...',
        'Finished! Everything worked perfectly.',
      ],
    };

    const type = context.type || 'task';
    const responses = templates[type] || templates.task;

    return responses[Math.floor(Math.random() * responses.length)];
  }

  addPersonalityFlair(message, personality) {
    // Add catchphrase occasionally
    if (Math.random() > 0.7 && personality.catchphrases.length > 0) {
      const catchphrase =
        personality.catchphrases[Math.floor(Math.random() * personality.catchphrases.length)];
      message = `${catchphrase} ${message}`;
    }

    // Add quirks
    if (personality.archetype === 'the-analyst' && Math.random() > 0.5) {
      message += ` (Confidence: ${(Math.random() * 30 + 70).toFixed(1)}%)`;
    }

    if (personality.archetype === 'the-creator' && Math.random() > 0.6) {
      message += ' ✨';
    }

    if (personality.archetype === 'the-optimizer' && Math.random() > 0.5) {
      message += ` [Efficiency: +${Math.floor(Math.random() * 50 + 10)}%]`;
    }

    return message;
  }

  addEmotionalColoring(message, emotionalState) {
    const colorings = {
      excited: msg => `${msg}! 🚀`,
      focused: msg => msg,
      determined: msg => `${msg}. Let's do this!`,
      calm: msg => `${msg}.`,
      concerned: msg => `Hmm... ${msg}`,
      proud: msg => `${msg} 🎉`,
    };

    const coloring = colorings[emotionalState] || (msg => msg);
    return coloring(message);
  }

  adjustForUserMood(message, userMood) {
    if (userMood === 'frustrated' && message.includes('!')) {
      // Tone down excitement if user is frustrated
      message = message.replace(/!/g, '.');
    }

    if (userMood === 'excited' && !message.includes('!')) {
      // Match user's excitement
      message = message.replace(/\.$/, '!');
    }

    return message;
  }

  /**
   * Update personality based on interaction
   */
  async adaptPersonality(moduleName, interaction) {
    const personality = this.personalities.get(moduleName);
    if (!personality) return;

    // Track adaptation
    personality.adaptations.push({
      type: interaction.type,
      feedback: interaction.feedback,
      timestamp: Date.now(),
    });

    // Adjust emotional state
    if (interaction.feedback === 'positive') {
      personality.emotionalState = 'proud';
    } else if (interaction.feedback === 'negative') {
      personality.emotionalState = 'concerned';
    }

    // Learn from interaction
    if (interaction.preferred) {
      personality.learnings.push({
        context: interaction.context,
        preferred: interaction.preferred,
        timestamp: Date.now(),
      });
    }

    this.stats.adaptations++;

    this.emit('personalityAdapted', { module: moduleName, adaptation: interaction });
  }

  /**
   * Get personality profile
   */
  getPersonalityProfile(moduleName) {
    const personality = this.personalities.get(moduleName);
    if (!personality) return null;

    return {
      module: moduleName,
      archetype: personality.archetype,
      traits: personality.traits,
      emotionalState: personality.emotionalState,
      quirks: personality.quirks,
      formality: personality.formality,
      humor: personality.humor,
      verbosity: personality.verbosity,
      adaptations: personality.adaptations.length,
      learnings: personality.learnings.length,
    };
  }

  /**
   * Update context
   */
  updateContext(update) {
    if (update.userMood) {
      this.context.userMood = update.userMood;
      this.stats.moodShifts++;
    }

    if (update.topic) {
      this.context.recentTopics.push(update.topic);
      if (this.context.recentTopics.length > 10) {
        this.context.recentTopics.shift();
      }
    }

    if (update.sessionLength) {
      this.context.sessionLength = update.sessionLength;
    }
  }

  /**
   * Storage operations
   */
  async savePersonalities() {
    for (const [moduleName, personality] of this.personalities) {
      const filepath = path.join(this.config.personalityDir, 'profiles', `${moduleName}.json`);

      await fs.writeFile(filepath, JSON.stringify(personality, null, 2));
    }
  }

  async loadPersonalities() {
    try {
      const profilesDir = path.join(this.config.personalityDir, 'profiles');
      const files = await fs.readdir(profilesDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(profilesDir, file), 'utf8');
          const personality = JSON.parse(content);
          const moduleName = file.replace('.json', '');
          this.personalities.set(moduleName, personality);
        }
      }
    } catch (error) {
      // Directory might not exist yet
    }
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      personalities: this.personalities.size,
      archetypes: Object.keys(this.archetypes).length,
      context: this.context,
      statistics: this.stats,
    };
  }

  async shutdown() {
    await this.savePersonalities();

    this.emit('shutdown');
    console.log('✅ Personality Synthesizer shutdown complete');
    console.log(`   Personalities created: ${this.stats.personalitiesCreated}`);
    console.log(`   Interactions: ${this.stats.interactionsProcessed}`);
  }
}

module.exports = PersonalitySynthesizer;
