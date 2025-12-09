/**
 * User Preference Engine - VIBE Hive Mind
 * Learns and tracks ALL user preferences for a 100% VIBE Coder
 * Understands user has NEVER coded manually - all AI-generated
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class UserPreferenceEngine extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      preferenceDir: options.preferenceDir || path.join(process.cwd(), 'vibe-data', 'preferences'),
      learningRate: options.learningRate || 0.1,
      confidenceThreshold: options.confidenceThreshold || 0.8,
      memoryLimit: options.memoryLimit || 10000,
    };

    // User profile - 100% VIBE Coder
    this.userProfile = {
      id: 'vibe-coder-001',
      type: '100% AI-Assisted Developer',
      codingExperience: 'Never coded manually',
      githubRepos: 400, // Approximate
      yearsActive: 0,
      primaryLanguage: 'Natural Language',
      createdAt: Date.now(),
    };

    // Preference categories
    this.preferences = {
      // UI/UX Preferences
      ui: {
        colorSchemes: new Map(),
        layouts: new Map(),
        frameworks: new Map(),
        components: new Map(),
        animations: new Map(),
        typography: new Map(),
        spacing: new Map(),
        themes: new Map(),
      },

      // Project Preferences
      project: {
        structures: new Map(),
        technologies: new Map(),
        architectures: new Map(),
        databases: new Map(),
        deployments: new Map(),
        testing: new Map(),
        documentation: new Map(),
      },

      // Interaction Preferences
      interaction: {
        communicationStyle: new Map(),
        responseLength: new Map(),
        detailLevel: new Map(),
        explanationStyle: new Map(),
        errorHandling: new Map(),
        feedbackStyle: new Map(),
      },

      // Development Preferences
      development: {
        frameworks: new Map(),
        libraries: new Map(),
        tools: new Map(),
        patterns: new Map(),
        bestPractices: new Map(),
        codeStyle: new Map(), // Even though user doesn't code
      },

      // Personal Preferences
      personal: {
        workingHours: new Map(),
        projectTypes: new Map(),
        interests: new Map(),
        goals: new Map(),
        constraints: new Map(),
        values: new Map(),
      },
    };

    // Learning history
    this.learningHistory = [];
    this.interactions = [];
    this.decisions = [];

    // Preference changes tracking
    this.changeHistory = new Map();
    this.contradictions = new Map();

    // Confidence scores
    this.confidence = new Map();

    // Statistics
    this.stats = {
      totalPreferences: 0,
      preferencesLearned: 0,
      preferencesChanged: 0,
      contradictionsResolved: 0,
      interactionsAnalyzed: 0,
      accuracyRate: 0,
    };

    this.isInitialized = false;
  }

  async initialize() {
    console.log('👤 Initializing User Preference Engine...');
    console.log('   User Type: 100% VIBE Coder (Never codes manually)');

    // Create directories
    await fs.mkdir(this.config.preferenceDir, { recursive: true });
    await fs.mkdir(path.join(this.config.preferenceDir, 'profiles'), { recursive: true });
    await fs.mkdir(path.join(this.config.preferenceDir, 'history'), { recursive: true });
    await fs.mkdir(path.join(this.config.preferenceDir, 'analytics'), { recursive: true });

    // Load existing preferences
    await this.loadPreferences();

    // Initialize default preferences for VIBE Coder
    await this.initializeVIBECoderDefaults();

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ User Preference Engine initialized');
    console.log(`   GitHub Repos: ~${this.userProfile.githubRepos}`);
    console.log(`   Coding Style: 100% AI-Generated`);
  }

  /**
   * Initialize defaults for a 100% VIBE Coder
   */
  async initializeVIBECoderDefaults() {
    // UI/UX Defaults - Modern, Clean, Professional
    this.setPreference('ui', 'colorSchemes', 'primary', {
      value: 'modern-dark',
      confidence: 0.7,
      reason: 'Common in AI-generated projects',
    });

    this.setPreference('ui', 'frameworks', 'preferred', {
      value: ['React', 'Next.js', 'TailwindCSS'],
      confidence: 0.8,
      reason: 'Most AI tools generate these',
    });

    // Project Structure - Complete, Production-Ready
    this.setPreference('project', 'structures', 'default', {
      value: 'complete-application',
      confidence: 0.9,
      reason: 'User never writes partial code',
    });

    // Interaction Style - Natural Language
    this.setPreference('interaction', 'communicationStyle', 'primary', {
      value: 'natural-conversational',
      confidence: 1.0,
      reason: 'User only uses natural language',
    });

    // Development - Full Stack, Modern
    this.setPreference('development', 'patterns', 'architecture', {
      value: 'modern-full-stack',
      confidence: 0.85,
      reason: 'AI generates complete solutions',
    });
  }

  /**
   * Learn from user interaction
   */
  async learnFromInteraction(interaction) {
    const learning = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      type: interaction.type,
      content: interaction.content,
      context: interaction.context,
      preferences: [],
    };

    // Analyze interaction for preferences
    const detectedPreferences = await this.analyzeInteraction(interaction);

    for (const pref of detectedPreferences) {
      await this.updatePreference(pref.category, pref.subcategory, pref.key, {
        value: pref.value,
        confidence: pref.confidence,
        source: 'interaction',
        interactionId: learning.id,
      });

      learning.preferences.push(pref);
    }

    // Store interaction
    this.interactions.push(learning);
    this.learningHistory.push({
      type: 'interaction',
      data: learning,
      timestamp: Date.now(),
    });

    this.stats.interactionsAnalyzed++;

    // Limit history
    if (this.interactions.length > this.config.memoryLimit) {
      this.interactions.shift();
    }

    this.emit('learned', learning);

    return learning;
  }

  /**
   * Analyze interaction for preferences
   */
  async analyzeInteraction(interaction) {
    const preferences = [];

    // Check for UI preferences
    if (interaction.content?.includes('dark mode') || interaction.content?.includes('dark theme')) {
      preferences.push({
        category: 'ui',
        subcategory: 'themes',
        key: 'mode',
        value: 'dark',
        confidence: 0.9,
      });
    }

    if (interaction.content?.includes('modern') || interaction.content?.includes('clean')) {
      preferences.push({
        category: 'ui',
        subcategory: 'themes',
        key: 'style',
        value: 'modern-clean',
        confidence: 0.8,
      });
    }

    // Check for framework preferences
    const frameworks = ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt'];
    for (const fw of frameworks) {
      if (interaction.content?.toLowerCase().includes(fw.toLowerCase())) {
        preferences.push({
          category: 'development',
          subcategory: 'frameworks',
          key: 'mentioned',
          value: fw,
          confidence: 0.7,
        });
      }
    }

    // Check for project type preferences
    const projectTypes = [
      'web app',
      'mobile app',
      'API',
      'dashboard',
      'landing page',
      'e-commerce',
    ];
    for (const type of projectTypes) {
      if (interaction.content?.toLowerCase().includes(type.toLowerCase())) {
        preferences.push({
          category: 'personal',
          subcategory: 'projectTypes',
          key: 'interested',
          value: type,
          confidence: 0.75,
        });
      }
    }

    // Check for response preferences
    if (interaction.feedback?.includes('too long')) {
      preferences.push({
        category: 'interaction',
        subcategory: 'responseLength',
        key: 'preferred',
        value: 'concise',
        confidence: 0.85,
      });
    }

    if (interaction.feedback?.includes('more detail')) {
      preferences.push({
        category: 'interaction',
        subcategory: 'detailLevel',
        key: 'preferred',
        value: 'detailed',
        confidence: 0.85,
      });
    }

    return preferences;
  }

  /**
   * Update a preference with learning
   */
  async updatePreference(category, subcategory, key, update) {
    const prefKey = `${category}.${subcategory}.${key}`;

    // Get existing preference
    const existing = this.preferences[category]?.[subcategory]?.get(key);

    if (existing) {
      // Check for contradiction
      if (existing.value !== update.value) {
        await this.handleContradiction(prefKey, existing, update);
      }

      // Update with learning rate
      const newConfidence =
        existing.confidence * (1 - this.config.learningRate) +
        update.confidence * this.config.learningRate;

      // Update if new confidence is higher
      if (newConfidence > existing.confidence || update.confidence > 0.9) {
        const updated = {
          ...update,
          confidence: newConfidence,
          previousValue: existing.value,
          updatedAt: Date.now(),
        };

        this.preferences[category][subcategory].set(key, updated);

        // Track change
        this.trackChange(prefKey, existing, updated);
        this.stats.preferencesChanged++;
      }
    } else {
      // New preference
      this.setPreference(category, subcategory, key, update);
      this.stats.preferencesLearned++;
    }
  }

  /**
   * Handle contradictions in preferences
   */
  async handleContradiction(key, existing, update) {
    const contradiction = {
      key,
      existing: existing.value,
      new: update.value,
      existingConfidence: existing.confidence,
      newConfidence: update.confidence,
      timestamp: Date.now(),
    };

    // Store contradiction
    if (!this.contradictions.has(key)) {
      this.contradictions.set(key, []);
    }
    this.contradictions.get(key).push(contradiction);

    // Resolve based on confidence
    if (update.confidence > existing.confidence * 1.2) {
      // Strong preference change
      this.emit('preferenceChanged', {
        key,
        from: existing.value,
        to: update.value,
        reason: 'Higher confidence',
      });

      this.stats.contradictionsResolved++;
    }
  }

  /**
   * Track preference changes
   */
  trackChange(key, from, to) {
    if (!this.changeHistory.has(key)) {
      this.changeHistory.set(key, []);
    }

    this.changeHistory.get(key).push({
      from: from.value,
      to: to.value,
      timestamp: Date.now(),
      confidence: to.confidence,
    });
  }

  /**
   * Set a preference
   */
  setPreference(category, subcategory, key, data) {
    if (!this.preferences[category]?.[subcategory]) {
      return false;
    }

    this.preferences[category][subcategory].set(key, {
      ...data,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    });

    this.stats.totalPreferences++;

    return true;
  }

  /**
   * Get preference with confidence
   */
  getPreference(category, subcategory, key) {
    const pref = this.preferences[category]?.[subcategory]?.get(key);

    if (pref) {
      // Update last used
      pref.lastUsed = Date.now();

      // Return with confidence check
      if (pref.confidence >= this.config.confidenceThreshold) {
        return {
          value: pref.value,
          confident: true,
          confidence: pref.confidence,
        };
      } else {
        return {
          value: pref.value,
          confident: false,
          confidence: pref.confidence,
          needsConfirmation: true,
        };
      }
    }

    return null;
  }

  /**
   * Get all preferences in a category
   */
  getCategoryPreferences(category) {
    const catPrefs = {};

    if (this.preferences[category]) {
      for (const [subcat, map] of Object.entries(this.preferences[category])) {
        catPrefs[subcat] = {};
        for (const [key, value] of map) {
          catPrefs[subcat][key] = value;
        }
      }
    }

    return catPrefs;
  }

  /**
   * Predict user preference
   */
  async predictPreference(context) {
    const predictions = [];

    // Analyze context
    const relevantPrefs = await this.findRelevantPreferences(context);

    for (const pref of relevantPrefs) {
      predictions.push({
        category: pref.category,
        prediction: pref.value,
        confidence: pref.confidence,
        reasoning: pref.reason,
      });
    }

    // Sort by confidence
    predictions.sort((a, b) => b.confidence - a.confidence);

    return predictions;
  }

  /**
   * Find relevant preferences for context
   */
  async findRelevantPreferences(context) {
    const relevant = [];

    // Check each category
    for (const [category, subcategories] of Object.entries(this.preferences)) {
      for (const [subcat, prefs] of Object.entries(subcategories)) {
        for (const [key, value] of prefs) {
          // Check if preference is relevant to context
          if (this.isRelevant(context, category, subcat, key)) {
            relevant.push({
              category: `${category}.${subcat}.${key}`,
              value: value.value,
              confidence: value.confidence,
              reason: value.reason || 'Historical preference',
            });
          }
        }
      }
    }

    return relevant;
  }

  isRelevant(context, category, subcategory, key) {
    // Simple relevance check - would be more sophisticated in production
    const contextStr = JSON.stringify(context).toLowerCase();

    return (
      contextStr.includes(category.toLowerCase()) ||
      contextStr.includes(subcategory.toLowerCase()) ||
      contextStr.includes(key.toLowerCase())
    );
  }

  /**
   * Generate preference report
   */
  async generateReport() {
    const report = {
      userProfile: this.userProfile,
      summary: {
        totalPreferences: this.stats.totalPreferences,
        highConfidence: 0,
        mediumConfidence: 0,
        lowConfidence: 0,
        recentChanges: this.changeHistory.size,
        contradictions: this.contradictions.size,
      },
      categories: {},
      topPreferences: [],
      recentLearning: this.learningHistory.slice(-10),
    };

    // Analyze confidence levels
    for (const category of Object.values(this.preferences)) {
      for (const subcategory of Object.values(category)) {
        for (const pref of subcategory.values()) {
          if (pref.confidence > 0.8) report.summary.highConfidence++;
          else if (pref.confidence > 0.5) report.summary.mediumConfidence++;
          else report.summary.lowConfidence++;
        }
      }
    }

    // Get category summaries
    for (const [cat, data] of Object.entries(this.preferences)) {
      report.categories[cat] = this.getCategoryPreferences(cat);
    }

    // Top preferences
    const allPrefs = [];
    for (const category of Object.values(this.preferences)) {
      for (const subcategory of Object.values(category)) {
        for (const [key, pref] of subcategory) {
          allPrefs.push({ key, ...pref });
        }
      }
    }

    report.topPreferences = allPrefs.sort((a, b) => b.confidence - a.confidence).slice(0, 10);

    return report;
  }

  /**
   * Save preferences
   */
  async savePreferences() {
    const data = {
      userProfile: this.userProfile,
      preferences: {},
      changeHistory: Array.from(this.changeHistory.entries()),
      stats: this.stats,
      savedAt: Date.now(),
    };

    // Convert Maps to objects
    for (const [cat, subcats] of Object.entries(this.preferences)) {
      data.preferences[cat] = {};
      for (const [subcat, map] of Object.entries(subcats)) {
        data.preferences[cat][subcat] = Object.fromEntries(map);
      }
    }

    const filepath = path.join(this.config.preferenceDir, 'profiles', 'user-preferences.json');

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  /**
   * Load preferences
   */
  async loadPreferences() {
    try {
      const filepath = path.join(this.config.preferenceDir, 'profiles', 'user-preferences.json');

      const content = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(content);

      // Restore profile
      this.userProfile = data.userProfile;

      // Restore preferences
      for (const [cat, subcats] of Object.entries(data.preferences)) {
        for (const [subcat, prefs] of Object.entries(subcats)) {
          for (const [key, value] of Object.entries(prefs)) {
            this.preferences[cat][subcat].set(key, value);
          }
        }
      }

      // Restore history
      this.changeHistory = new Map(data.changeHistory);
      this.stats = data.stats;

      console.log('📂 Loaded existing user preferences');
    } catch (error) {
      console.log('🆕 Starting fresh preference learning');
    }
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      userProfile: this.userProfile,
      preferences: {
        total: this.stats.totalPreferences,
        learned: this.stats.preferencesLearned,
        changed: this.stats.preferencesChanged,
      },
      confidence: {
        high: this.getConfidenceCount(0.8, 1.0),
        medium: this.getConfidenceCount(0.5, 0.8),
        low: this.getConfidenceCount(0, 0.5),
      },
      learning: {
        interactions: this.interactions.length,
        history: this.learningHistory.length,
      },
      statistics: this.stats,
    };
  }

  getConfidenceCount(min, max) {
    let count = 0;
    for (const category of Object.values(this.preferences)) {
      for (const subcategory of Object.values(category)) {
        for (const pref of subcategory.values()) {
          if (pref.confidence >= min && pref.confidence < max) {
            count++;
          }
        }
      }
    }
    return count;
  }

  async shutdown() {
    // Save all preferences
    await this.savePreferences();

    // Generate final report
    const report = await this.generateReport();
    const reportPath = path.join(
      this.config.preferenceDir,
      'analytics',
      `report-${Date.now()}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    this.emit('shutdown');
    console.log('✅ User Preference Engine shutdown complete');
    console.log(`   Preferences learned: ${this.stats.preferencesLearned}`);
    console.log(`   Interactions analyzed: ${this.stats.interactionsAnalyzed}`);
  }
}

module.exports = UserPreferenceEngine;
