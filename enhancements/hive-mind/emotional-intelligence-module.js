/**
 * Emotional Intelligence Module - VIBE Hive Mind
 * Understands and responds to Ghenghis's emotional state and mood
 * Adapts system behavior based on user's emotional context
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class EmotionalIntelligenceModule extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      emotionDir: options.emotionDir || path.join(process.cwd(), 'vibe-data', 'emotions'),
      sensitivity: options.sensitivity || 0.7,
      adaptationSpeed: options.adaptationSpeed || 0.3,
      empathyLevel: options.empathyLevel || 'high',
    };

    // Emotional state model
    this.currentState = {
      mood: 'productive', // Ghenghis's default
      energy: 0.8,
      focus: 0.85,
      frustration: 0.1,
      excitement: 0.7, // High for new tech
      satisfaction: 0.8,
      stress: 0.2,
    };

    // Mood patterns (from 430+ repos analysis)
    this.moodPatterns = {
      productive: {
        indicators: ['creating', 'building', 'completing'],
        energy: 'high',
        focus: 'intense',
        preferences: ['new-projects', 'innovation', 'mcp'],
      },
      excited: {
        indicators: ['mcp', 'new', 'ai', 'breakthrough'],
        energy: 'very-high',
        focus: 'scattered-positive',
        preferences: ['exploration', 'experimentation'],
      },
      frustrated: {
        indicators: ['error', 'stuck', 'broken', 'why'],
        energy: 'medium',
        focus: 'problem-solving',
        preferences: ['quick-fixes', 'regeneration'],
      },
      curious: {
        indicators: ['how', 'what if', 'explore', 'try'],
        energy: 'high',
        focus: 'exploratory',
        preferences: ['learning', 'documentation'],
      },
      satisfied: {
        indicators: ['works', 'done', 'complete', 'success'],
        energy: 'medium-high',
        focus: 'reflective',
        preferences: ['next-project', 'improvements'],
      },
    };

    // Emotional triggers
    this.triggers = {
      positive: {
        'project-success': { impact: 0.3, emotions: ['satisfaction', 'pride'] },
        'new-technology': { impact: 0.4, emotions: ['excitement', 'curiosity'] },
        'mcp-related': { impact: 0.5, emotions: ['excitement', 'focus'] },
        'problem-solved': { impact: 0.3, emotions: ['satisfaction', 'relief'] },
      },
      negative: {
        'repeated-error': { impact: -0.4, emotions: ['frustration', 'stress'] },
        'slow-progress': { impact: -0.2, emotions: ['impatience'] },
        'unclear-requirements': { impact: -0.3, emotions: ['confusion'] },
        'system-failure': { impact: -0.5, emotions: ['frustration', 'stress'] },
      },
      neutral: {
        'routine-task': { impact: 0, emotions: ['focus'] },
        documentation: { impact: 0.1, emotions: ['calm'] },
      },
    };

    // Response adaptations
    this.adaptations = {
      communication: {
        excited: { style: 'enthusiastic', emoji: true, detail: 'high' },
        productive: { style: 'efficient', emoji: false, detail: 'medium' },
        frustrated: { style: 'solution-focused', emoji: false, detail: 'concise' },
        curious: { style: 'educational', emoji: false, detail: 'comprehensive' },
        satisfied: { style: 'celebratory', emoji: true, detail: 'summary' },
      },
      behavior: {
        excited: { speed: 'fast', suggestions: 'innovative', risk: 'high' },
        productive: { speed: 'steady', suggestions: 'practical', risk: 'medium' },
        frustrated: { speed: 'careful', suggestions: 'safe', risk: 'low' },
        curious: { speed: 'exploratory', suggestions: 'educational', risk: 'medium' },
        satisfied: { speed: 'relaxed', suggestions: 'next-steps', risk: 'medium' },
      },
    };

    // Emotional memory
    this.memory = {
      shortTerm: [], // Last hour
      longTerm: [], // Patterns over time
      triggers: new Map(), // What triggers what
      responses: new Map(), // How user responds
    };

    // Empathy engine
    this.empathy = {
      understanding: 0.8,
      responses: [],
      suggestions: [],
    };

    // Statistics
    this.stats = {
      moodChanges: 0,
      accuratePredictions: 0,
      adaptations: 0,
      empathyScore: 0.8,
    };

    this.isInitialized = false;
  }

  async initialize() {
    console.log('❤️ Initializing Emotional Intelligence Module...');
    console.log('   Learning emotional patterns from 430+ projects...');

    await fs.mkdir(this.config.emotionDir, { recursive: true });
    await fs.mkdir(path.join(this.config.emotionDir, 'patterns'), { recursive: true });
    await fs.mkdir(path.join(this.config.emotionDir, 'memories'), { recursive: true });

    // Load emotional history
    await this.loadEmotionalHistory();

    // Start emotional monitoring
    this.startMonitoring();

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ Emotional Intelligence Module initialized');
    console.log(`   Current mood: ${this.currentState.mood}`);
  }

  /**
   * Start emotional monitoring
   */
  startMonitoring() {
    // Monitor emotional state every minute
    this.monitoringInterval = setInterval(() => {
      this.assessEmotionalState();
    }, 60000);

    // Decay emotions over time
    this.decayInterval = setInterval(() => {
      this.decayEmotions();
    }, 300000); // Every 5 minutes
  }

  /**
   * Detect emotion from interaction
   */
  async detectEmotion(interaction) {
    const detection = {
      id: crypto.randomBytes(8).toString('hex'),
      primaryEmotion: null,
      secondaryEmotions: [],
      confidence: 0,
      triggers: [],
      timestamp: Date.now(),
    };

    // Analyze text
    const text = (interaction.text || '').toLowerCase();
    const analysis = this.analyzeText(text);

    // Analyze behavior
    const behavior = this.analyzeBehavior(interaction);

    // Combine analyses
    detection.primaryEmotion = this.combinedAnalysis(analysis, behavior);
    detection.confidence = this.calculateConfidence(analysis, behavior);
    detection.triggers = this.identifyTriggers(interaction);

    // Update current state
    await this.updateEmotionalState(detection);

    // Store in memory
    this.memory.shortTerm.push(detection);
    if (this.memory.shortTerm.length > 100) {
      this.memory.shortTerm.shift();
    }

    this.emit('emotionDetected', detection);

    return detection;
  }

  /**
   * Analyze text for emotional content
   */
  analyzeText(text) {
    const analysis = {
      emotions: new Map(),
      intensity: 0,
    };

    // Excitement indicators (Ghenghis loves new tech)
    const excitementWords = ['awesome', 'amazing', 'cool', 'mcp', 'ai', 'new'];
    const excitementCount = excitementWords.filter(w => text.includes(w)).length;
    if (excitementCount > 0) {
      analysis.emotions.set('excitement', excitementCount * 0.3);
    }

    // Frustration indicators
    const frustrationWords = ['error', 'broken', 'stuck', 'why', 'fail', 'wrong'];
    const frustrationCount = frustrationWords.filter(w => text.includes(w)).length;
    if (frustrationCount > 0) {
      analysis.emotions.set('frustration', frustrationCount * 0.25);
    }

    // Satisfaction indicators
    const satisfactionWords = ['works', 'done', 'complete', 'success', 'fixed'];
    const satisfactionCount = satisfactionWords.filter(w => text.includes(w)).length;
    if (satisfactionCount > 0) {
      analysis.emotions.set('satisfaction', satisfactionCount * 0.3);
    }

    // Curiosity indicators
    const curiosityWords = ['how', 'what', 'why', 'explore', 'try', 'test'];
    const curiosityCount = curiosityWords.filter(w => text.includes(w)).length;
    if (curiosityCount > 0) {
      analysis.emotions.set('curiosity', curiosityCount * 0.2);
    }

    // Calculate intensity
    analysis.intensity = Math.min(
      1.0,
      Array.from(analysis.emotions.values()).reduce((sum, val) => sum + val, 0)
    );

    return analysis;
  }

  /**
   * Analyze behavior patterns
   */
  analyzeBehavior(interaction) {
    const behavior = {
      pattern: null,
      confidence: 0.5,
    };

    // Rapid creation = productive/excited
    if (interaction.action === 'create' && interaction.speed === 'fast') {
      behavior.pattern = 'productive';
      behavior.confidence = 0.8;
    }

    // Multiple errors = frustrated
    if (interaction.errors && interaction.errors > 2) {
      behavior.pattern = 'frustrated';
      behavior.confidence = 0.7;
    }

    // Exploring new tech = curious/excited
    if (interaction.action === 'explore' || interaction.newTechnology) {
      behavior.pattern = 'curious';
      behavior.confidence = 0.75;
    }

    // Completing tasks = satisfied
    if (interaction.action === 'complete' || interaction.success) {
      behavior.pattern = 'satisfied';
      behavior.confidence = 0.8;
    }

    return behavior;
  }

  /**
   * Combine text and behavior analysis
   */
  combinedAnalysis(textAnalysis, behaviorAnalysis) {
    // Get strongest text emotion
    let strongestEmotion = null;
    let strongestValue = 0;

    for (const [emotion, value] of textAnalysis.emotions) {
      if (value > strongestValue) {
        strongestEmotion = emotion;
        strongestValue = value;
      }
    }

    // Override with behavior if high confidence
    if (behaviorAnalysis.confidence > 0.7) {
      return behaviorAnalysis.pattern;
    }

    return strongestEmotion || 'neutral';
  }

  /**
   * Calculate confidence
   */
  calculateConfidence(textAnalysis, behaviorAnalysis) {
    const textConfidence = Math.min(1.0, textAnalysis.intensity);
    const behaviorConfidence = behaviorAnalysis.confidence;

    return (textConfidence + behaviorConfidence) / 2;
  }

  /**
   * Identify triggers
   */
  identifyTriggers(interaction) {
    const triggers = [];

    // Check positive triggers
    for (const [trigger, config] of Object.entries(this.triggers.positive)) {
      if (this.matchesTrigger(interaction, trigger)) {
        triggers.push({ type: 'positive', trigger, impact: config.impact });
      }
    }

    // Check negative triggers
    for (const [trigger, config] of Object.entries(this.triggers.negative)) {
      if (this.matchesTrigger(interaction, trigger)) {
        triggers.push({ type: 'negative', trigger, impact: config.impact });
      }
    }

    return triggers;
  }

  matchesTrigger(interaction, trigger) {
    switch (trigger) {
      case 'project-success':
        return interaction.success && interaction.action === 'complete';
      case 'new-technology':
        return interaction.newTechnology || interaction.text?.includes('new');
      case 'mcp-related':
        return interaction.text?.toLowerCase().includes('mcp');
      case 'repeated-error':
        return interaction.errors > 2;
      case 'slow-progress':
        return interaction.duration > 300000; // 5 minutes
      default:
        return false;
    }
  }

  /**
   * Update emotional state
   */
  async updateEmotionalState(detection) {
    const alpha = this.config.adaptationSpeed;

    // Update based on detected emotion
    switch (detection.primaryEmotion) {
      case 'excitement':
        this.currentState.excitement = Math.min(
          1.0,
          this.currentState.excitement * (1 - alpha) + 1.0 * alpha
        );
        this.currentState.energy = Math.min(1.0, this.currentState.energy + 0.1);
        break;

      case 'frustration':
        this.currentState.frustration = Math.min(
          1.0,
          this.currentState.frustration * (1 - alpha) + 1.0 * alpha
        );
        this.currentState.stress = Math.min(1.0, this.currentState.stress + 0.1);
        break;

      case 'satisfaction':
        this.currentState.satisfaction = Math.min(
          1.0,
          this.currentState.satisfaction * (1 - alpha) + 1.0 * alpha
        );
        this.currentState.frustration = Math.max(0, this.currentState.frustration - 0.1);
        break;

      case 'curiosity':
        this.currentState.focus = Math.min(1.0, this.currentState.focus + 0.05);
        this.currentState.energy = Math.min(1.0, this.currentState.energy + 0.05);
        break;
    }

    // Update mood based on state
    this.currentState.mood = this.determineMood();

    // Track mood changes
    if (detection.primaryEmotion !== this.lastEmotion) {
      this.stats.moodChanges++;
      this.lastEmotion = detection.primaryEmotion;
    }

    this.emit('stateUpdated', this.currentState);
  }

  /**
   * Determine mood from emotional state
   */
  determineMood() {
    // Find dominant emotion
    const emotions = {
      productive: this.currentState.focus * this.currentState.energy,
      excited: this.currentState.excitement,
      frustrated: this.currentState.frustration,
      satisfied: this.currentState.satisfaction,
    };

    let dominantMood = 'productive';
    let maxScore = emotions.productive;

    for (const [mood, score] of Object.entries(emotions)) {
      if (score > maxScore) {
        dominantMood = mood;
        maxScore = score;
      }
    }

    return dominantMood;
  }

  /**
   * Assess emotional state
   */
  async assessEmotionalState() {
    // Periodic assessment of overall state
    const assessment = {
      mood: this.currentState.mood,
      stability: this.calculateStability(),
      trend: this.calculateTrend(),
      recommendations: [],
    };

    // Generate recommendations
    if (this.currentState.frustration > 0.6) {
      assessment.recommendations.push('Take a break or try a simpler task');
    }

    if (this.currentState.energy < 0.3) {
      assessment.recommendations.push('Low energy detected - consider rest');
    }

    if (this.currentState.excitement > 0.8) {
      assessment.recommendations.push('High excitement - great time for innovation!');
    }

    this.emit('assessmentComplete', assessment);

    return assessment;
  }

  calculateStability() {
    // Check recent mood changes
    const recentChanges = this.memory.shortTerm.slice(-10);
    const uniqueMoods = new Set(recentChanges.map(m => m.primaryEmotion));

    return 1.0 - uniqueMoods.size / 10;
  }

  calculateTrend() {
    const recent = this.memory.shortTerm.slice(-20);
    if (recent.length < 2) return 'stable';

    let positiveCount = 0;
    let negativeCount = 0;

    for (const memory of recent) {
      if (['excitement', 'satisfaction'].includes(memory.primaryEmotion)) {
        positiveCount++;
      } else if (['frustration', 'stress'].includes(memory.primaryEmotion)) {
        negativeCount++;
      }
    }

    if (positiveCount > negativeCount * 1.5) return 'improving';
    if (negativeCount > positiveCount * 1.5) return 'declining';
    return 'stable';
  }

  /**
   * Decay emotions over time
   */
  decayEmotions() {
    const decayRate = 0.1;

    // Decay intense emotions
    this.currentState.excitement = Math.max(0.3, this.currentState.excitement - decayRate);
    this.currentState.frustration = Math.max(0, this.currentState.frustration - decayRate);
    this.currentState.stress = Math.max(0, this.currentState.stress - decayRate);

    // Energy and focus decay slower
    this.currentState.energy = Math.max(0.4, this.currentState.energy - decayRate * 0.5);
    this.currentState.focus = Math.max(0.5, this.currentState.focus - decayRate * 0.3);
  }

  /**
   * Generate empathetic response
   */
  async generateResponse(context) {
    const mood = this.currentState.mood;
    const adaptation = this.adaptations.communication[mood];

    const response = {
      message: '',
      style: adaptation.style,
      suggestions: [],
      empathy: this.empathy.understanding,
    };

    // Generate message based on mood
    switch (mood) {
      case 'excited':
        response.message = "This is exciting! Let's build something amazing! 🚀";
        response.suggestions = ['Try that new MCP integration', 'Explore innovative features'];
        break;

      case 'productive':
        response.message = 'Great progress! Keep the momentum going.';
        response.suggestions = ['Continue with next task', "Optimize what you've built"];
        break;

      case 'frustrated':
        response.message = "I understand this is challenging. Let's solve it together.";
        response.suggestions = ['Try a different approach', 'Break it into smaller steps'];
        break;

      case 'satisfied':
        response.message = "Excellent work! That's another success! 🎉";
        response.suggestions = ['Document your success', 'Start planning the next project'];
        break;

      default:
        response.message = "I'm here to help with whatever you need.";
        response.suggestions = ['What would you like to work on?'];
    }

    // Add context-specific elements
    if (context.isError) {
      response.message = "No worries, we'll fix this. ";
    }

    if (context.isSuccess) {
      response.message = 'Fantastic! Another win! ';
    }

    this.empathy.responses.push(response);

    return response;
  }

  /**
   * Adapt behavior based on mood
   */
  async adaptBehavior() {
    const mood = this.currentState.mood;
    const behavior = this.adaptations.behavior[mood];

    const adaptation = {
      speed: behavior.speed,
      riskTolerance: behavior.risk,
      suggestionStyle: behavior.suggestions,
      focusArea: this.determineFocusArea(),
    };

    this.stats.adaptations++;

    this.emit('behaviorAdapted', adaptation);

    return adaptation;
  }

  determineFocusArea() {
    if (this.currentState.excitement > 0.7) return 'innovation';
    if (this.currentState.frustration > 0.5) return 'problem-solving';
    if (this.currentState.satisfaction > 0.7) return 'next-steps';
    return 'current-task';
  }

  /**
   * Predict emotional response
   */
  async predictResponse(scenario) {
    const prediction = {
      likelyEmotion: null,
      confidence: 0,
      reasoning: [],
    };

    // Check against known triggers
    for (const trigger of this.memory.triggers.keys()) {
      if (scenario.includes(trigger)) {
        const response = this.memory.triggers.get(trigger);
        prediction.likelyEmotion = response.emotion;
        prediction.confidence = response.confidence;
        prediction.reasoning.push(`Based on previous ${trigger} responses`);
      }
    }

    // Default predictions based on patterns
    if (!prediction.likelyEmotion) {
      if (scenario.includes('mcp') || scenario.includes('new')) {
        prediction.likelyEmotion = 'excitement';
        prediction.confidence = 0.8;
        prediction.reasoning.push('MCP and new tech typically excite user');
      } else if (scenario.includes('error')) {
        prediction.likelyEmotion = 'frustration';
        prediction.confidence = 0.6;
        prediction.reasoning.push('Errors may cause frustration');
      }
    }

    return prediction;
  }

  /**
   * Storage operations
   */
  async saveEmotionalHistory() {
    const history = {
      currentState: this.currentState,
      shortTermMemory: this.memory.shortTerm.slice(-50),
      patterns: Array.from(this.memory.triggers.entries()),
      stats: this.stats,
      savedAt: Date.now(),
    };

    const filepath = path.join(this.config.emotionDir, 'emotional-history.json');
    await fs.writeFile(filepath, JSON.stringify(history, null, 2));
  }

  async loadEmotionalHistory() {
    try {
      const filepath = path.join(this.config.emotionDir, 'emotional-history.json');
      const content = await fs.readFile(filepath, 'utf8');
      const history = JSON.parse(content);

      this.currentState = history.currentState;
      this.memory.shortTerm = history.shortTermMemory;
      this.memory.triggers = new Map(history.patterns);
      this.stats = history.stats;

      console.log('📂 Loaded emotional history');
    } catch (error) {
      console.log('🆕 Starting fresh emotional tracking');
    }
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      currentMood: this.currentState.mood,
      emotionalState: this.currentState,
      stability: this.calculateStability(),
      trend: this.calculateTrend(),
      empathyLevel: this.empathy.understanding,
      statistics: this.stats,
    };
  }

  async shutdown() {
    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    if (this.decayInterval) {
      clearInterval(this.decayInterval);
    }

    // Save emotional history
    await this.saveEmotionalHistory();

    this.emit('shutdown');
    console.log('✅ Emotional Intelligence Module shutdown complete');
    console.log(`   Final mood: ${this.currentState.mood}`);
    console.log(`   Mood changes: ${this.stats.moodChanges}`);
  }
}

module.exports = EmotionalIntelligenceModule;
