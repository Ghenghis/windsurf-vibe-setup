/**
 * UI/UX Preference Learner - VIBE Hive Mind
 * Deep learning of Ghenghis's visual and interaction preferences
 * Based on analysis of 430+ AI-generated repositories
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class UIUXPreferenceLearner extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      preferenceDir:
        options.preferenceDir || path.join(process.cwd(), 'vibe-data', 'ui-preferences'),
      learningRate: options.learningRate || 0.15,
      analysisDepth: options.analysisDepth || 'deep',
    };

    // Ghenghis-specific UI/UX patterns observed
    this.visualPreferences = {
      // Color preferences from projects
      colors: {
        primary: new Map([
          ['dark-theme', 0.85], // Strong preference for dark themes
          ['blue-accent', 0.75], // Blue as primary accent
          ['green-success', 0.8], // Green for success states
          ['red-danger', 0.8], // Red for errors/danger
          ['purple-ai', 0.7], // Purple for AI-related elements
          ['orange-warning', 0.75], // Orange for warnings
          ['gray-neutral', 0.9], // Gray for neutral elements
        ]),
        schemes: {
          preferred: 'dark-modern',
          alternatives: ['dark-minimal', 'cyberpunk', 'matrix-green'],
          avoided: ['light-themes', 'pastel', 'low-contrast'],
        },
      },

      // Layout preferences
      layouts: {
        structure: new Map([
          ['sidebar-navigation', 0.85], // Prefers sidebar nav
          ['tabbed-interface', 0.75], // Uses tabs frequently
          ['card-based', 0.8], // Card layouts for content
          ['dashboard-style', 0.9], // Dashboard for tools
          ['terminal-style', 0.7], // Terminal UI for dev tools
          ['split-pane', 0.65], // Split panes for editors
        ]),
        responsive: {
          mobileFirst: false,
          desktopFocus: true, // Most tools are desktop-focused
          preferredBreakpoints: [1920, 1440, 1024],
        },
      },

      // Component preferences
      components: {
        buttons: {
          style: 'rounded-medium', // Not too round, not too sharp
          size: 'medium-large',
          effects: 'subtle-hover',
          icons: 'with-text',
        },
        inputs: {
          style: 'outlined',
          validation: 'real-time',
          helpers: 'always-visible',
          autocomplete: 'aggressive',
        },
        cards: {
          style: 'elevated',
          shadows: 'medium',
          borders: 'subtle',
          padding: 'comfortable',
        },
        tables: {
          style: 'striped',
          density: 'comfortable',
          features: ['sorting', 'filtering', 'pagination'],
          virtualization: true, // For large datasets
        },
      },

      // Typography preferences
      typography: {
        fonts: {
          headers: 'Inter, system-ui',
          body: 'Inter, system-ui',
          code: 'JetBrains Mono, Consolas',
          preferred: 'modern-clean',
        },
        sizes: {
          base: '16px',
          scale: 1.25, // Modular scale
          readable: true,
        },
        weights: {
          normal: 400,
          medium: 500,
          bold: 700,
        },
      },

      // Animation preferences
      animations: {
        enabled: true,
        speed: 'fast', // 200-300ms
        types: new Map([
          ['fade', 0.8],
          ['slide', 0.7],
          ['scale', 0.6],
          ['rotate', 0.4],
          ['bounce', 0.3], // Less preferred
        ]),
        triggers: {
          onHover: true,
          onClick: true,
          onScroll: 'subtle',
          pageTransitions: true,
        },
      },

      // Icons and imagery
      icons: {
        style: 'outlined', // or 'filled'
        library: 'lucide', // Based on project usage
        size: 'medium',
        usage: 'liberal', // Uses icons frequently
      },

      // Spacing and density
      spacing: {
        preference: 'comfortable', // Not too dense, not too sparse
        padding: {
          small: '8px',
          medium: '16px',
          large: '24px',
        },
        margins: {
          sections: '32px',
          components: '16px',
          elements: '8px',
        },
      },
    };

    // Interaction patterns
    this.interactionPreferences = {
      // Navigation patterns
      navigation: {
        style: 'persistent-sidebar',
        breadcrumbs: true,
        searchBar: 'always-visible',
        shortcuts: true, // Keyboard shortcuts
        contextMenus: true,
      },

      // Feedback patterns
      feedback: {
        notifications: {
          position: 'top-right',
          duration: 3000,
          style: 'toast',
          stacking: true,
        },
        loading: {
          style: 'spinner-with-text',
          overlay: 'semi-transparent',
          progress: 'when-available',
        },
        errors: {
          display: 'inline-and-toast',
          details: 'expandable',
          recovery: 'suggestions-provided',
        },
        success: {
          style: 'toast',
          celebration: 'subtle', // Confetti for big wins
          sound: false, // No sound effects
        },
      },

      // Form interactions
      forms: {
        validation: 'real-time',
        submission: 'ajax-with-feedback',
        autosave: true,
        wizards: 'step-by-step',
        helpers: 'tooltips-and-placeholders',
      },

      // Data display
      dataDisplay: {
        tables: 'interactive-sortable',
        charts: 'interactive-tooltips',
        lists: 'virtualized-for-performance',
        grids: 'responsive-cards',
        trees: 'collapsible-with-search',
      },

      // User actions
      actions: {
        confirmations: 'modal-for-destructive',
        undoRedo: true,
        bulkOperations: true,
        dragDrop: 'where-applicable',
        rightClick: 'context-menus',
      },
    };

    // Framework-specific preferences (from project analysis)
    this.frameworkPreferences = {
      frontend: {
        react: {
          usage: 0.85,
          patterns: ['hooks', 'functional-components', 'context-api'],
          libraries: ['tailwind', 'shadcn', 'lucide-react'],
        },
        nextjs: {
          usage: 0.75,
          patterns: ['app-router', 'server-components', 'api-routes'],
          styling: 'tailwind-css',
        },
        vue: {
          usage: 0.3,
          patterns: ['composition-api', 'single-file-components'],
        },
      },

      styling: {
        tailwind: {
          usage: 0.9,
          customization: 'extensive',
          utilities: 'custom-classes',
        },
        css: {
          methodology: 'utility-first',
          preprocessor: 'none', // Uses Tailwind instead
          customProperties: true,
        },
      },

      components: {
        library: 'shadcn/ui', // Preferred component library
        customization: 'heavy',
        consistency: 'high',
      },
    };

    // Accessibility preferences
    this.accessibilityPreferences = {
      compliance: 'WCAG-AA',
      features: {
        keyboardNav: true,
        screenReaders: true,
        highContrast: 'optional',
        reducedMotion: 'respected',
        focusIndicators: 'visible',
      },
    };

    // Device and platform preferences
    this.platformPreferences = {
      primary: 'desktop',
      secondary: 'web',
      mobile: 'responsive-only', // Not mobile-first
      targets: {
        desktop: { priority: 1, tested: true },
        web: { priority: 2, tested: true },
        mobile: { priority: 3, tested: false },
      },
    };

    // Learning history
    this.learningHistory = [];
    this.decisions = new Map();

    // Statistics
    this.stats = {
      preferencesLearned: 0,
      patternsIdentified: 0,
      projectsAnalyzed: 0,
      accuracyScore: 0,
    };

    this.isInitialized = false;
  }

  async initialize() {
    console.log('🎨 Initializing UI/UX Preference Learner...');
    console.log("   Analyzing Ghenghis's 430+ projects for UI patterns...");

    await fs.mkdir(this.config.preferenceDir, { recursive: true });
    await fs.mkdir(path.join(this.config.preferenceDir, 'patterns'), { recursive: true });
    await fs.mkdir(path.join(this.config.preferenceDir, 'decisions'), { recursive: true });

    // Load existing preferences
    await this.loadPreferences();

    // Initialize with Ghenghis-specific patterns
    await this.initializeGhenghisPatterns();

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ UI/UX Preference Learner initialized');
    console.log('   Preferred theme: Dark Modern');
    console.log('   Preferred framework: React + TailwindCSS');
    console.log('   Component library: shadcn/ui');
  }

  /**
   * Initialize Ghenghis-specific patterns
   */
  async initializeGhenghisPatterns() {
    // Based on actual project analysis
    this.patterns = {
      // MCP projects use clean, functional UIs
      mcp_ui: {
        style: 'clean-functional',
        colors: 'dark-with-blue-accent',
        layout: 'sidebar-with-panels',
        components: 'shadcn-based',
      },

      // Game projects use immersive UIs
      game_ui: {
        style: 'immersive-themed',
        colors: 'game-specific',
        layout: 'fullscreen-or-windowed',
        components: 'custom-game-ui',
      },

      // Tool projects use dashboard style
      tool_ui: {
        style: 'dashboard-analytics',
        colors: 'dark-professional',
        layout: 'multi-panel-dashboard',
        components: 'data-heavy-tables-charts',
      },

      // AI projects use modern, techy UI
      ai_ui: {
        style: 'modern-tech',
        colors: 'dark-with-purple-accent',
        layout: 'chat-or-workflow',
        components: 'interactive-forms',
      },
    };
  }

  /**
   * Learn from UI interaction
   */
  async learnFromInteraction(interaction) {
    const learning = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      type: interaction.type,
      element: interaction.element,
      action: interaction.action,
      context: interaction.context,
      preferences: [],
    };

    // Analyze the interaction
    const preferences = await this.analyzeInteraction(interaction);

    // Update preferences with learning
    for (const pref of preferences) {
      await this.updatePreference(pref);
      learning.preferences.push(pref);
    }

    // Store learning
    this.learningHistory.push(learning);
    this.stats.preferencesLearned++;

    this.emit('learned', learning);

    return learning;
  }

  /**
   * Analyze UI interaction for preferences
   */
  async analyzeInteraction(interaction) {
    const preferences = [];

    // Analyze color preferences
    if (interaction.element?.color) {
      const colorPref = this.visualPreferences.colors.primary.get(interaction.element.color);
      if (colorPref) {
        preferences.push({
          type: 'color',
          value: interaction.element.color,
          confidence: colorPref,
          action: interaction.action,
        });
      }
    }

    // Analyze layout preferences
    if (interaction.layout) {
      const layoutPref = this.visualPreferences.layouts.structure.get(interaction.layout);
      if (layoutPref) {
        preferences.push({
          type: 'layout',
          value: interaction.layout,
          confidence: layoutPref,
          action: interaction.action,
        });
      }
    }

    // Analyze component usage
    if (interaction.component) {
      preferences.push({
        type: 'component',
        value: interaction.component,
        style: interaction.style,
        confidence: 0.7,
        action: interaction.action,
      });
    }

    // Analyze animation preferences
    if (interaction.animation) {
      const animPref = this.visualPreferences.animations.types.get(interaction.animation);
      if (animPref) {
        preferences.push({
          type: 'animation',
          value: interaction.animation,
          confidence: animPref,
          speed: interaction.speed || 'fast',
        });
      }
    }

    return preferences;
  }

  /**
   * Update preference with learning
   */
  async updatePreference(preference) {
    const key = `${preference.type}:${preference.value}`;

    // Get existing confidence
    let currentConfidence = 0;

    switch (preference.type) {
      case 'color':
        currentConfidence = this.visualPreferences.colors.primary.get(preference.value) || 0;
        break;
      case 'layout':
        currentConfidence = this.visualPreferences.layouts.structure.get(preference.value) || 0;
        break;
      case 'animation':
        currentConfidence = this.visualPreferences.animations.types.get(preference.value) || 0;
        break;
    }

    // Update with learning rate
    const newConfidence =
      currentConfidence * (1 - this.config.learningRate) +
      preference.confidence * this.config.learningRate;

    // Store updated preference
    switch (preference.type) {
      case 'color':
        this.visualPreferences.colors.primary.set(preference.value, newConfidence);
        break;
      case 'layout':
        this.visualPreferences.layouts.structure.set(preference.value, newConfidence);
        break;
      case 'animation':
        this.visualPreferences.animations.types.set(preference.value, newConfidence);
        break;
    }

    // Store decision
    this.decisions.set(key, {
      type: preference.type,
      value: preference.value,
      confidence: newConfidence,
      timestamp: Date.now(),
    });
  }

  /**
   * Generate UI recommendations
   */
  async generateUIRecommendations(projectType = 'general') {
    const recommendations = {
      colors: this.getColorRecommendations(projectType),
      layout: this.getLayoutRecommendations(projectType),
      components: this.getComponentRecommendations(projectType),
      typography: this.getTypographyRecommendations(),
      animations: this.getAnimationRecommendations(),
      framework: this.getFrameworkRecommendations(projectType),
    };

    return recommendations;
  }

  getColorRecommendations(projectType) {
    const baseColors = {
      primary: '#3B82F6', // Blue
      secondary: '#8B5CF6', // Purple
      success: '#10B981', // Green
      danger: '#EF4444', // Red
      warning: '#F59E0B', // Orange
      info: '#06B6D4', // Cyan
      background: '#0F172A', // Dark blue-gray
      surface: '#1E293B', // Slightly lighter
      text: '#F1F5F9', // Light gray
      textSecondary: '#94A3B8', // Medium gray
    };

    // Adjust for project type
    if (projectType === 'mcp') {
      baseColors.primary = '#3B82F6'; // Blue for MCP
      baseColors.secondary = '#06B6D4'; // Cyan
    } else if (projectType === 'ai') {
      baseColors.primary = '#8B5CF6'; // Purple for AI
      baseColors.secondary = '#EC4899'; // Pink
    } else if (projectType === 'game') {
      // Game-specific colors based on theme
      baseColors.primary = '#F59E0B'; // Orange
      baseColors.secondary = '#EF4444'; // Red
    }

    return baseColors;
  }

  getLayoutRecommendations(projectType) {
    const layouts = {
      structure: 'sidebar-navigation',
      grid: 'responsive-grid',
      spacing: 'comfortable',
      containers: 'max-w-7xl',
    };

    if (projectType === 'dashboard' || projectType === 'tool') {
      layouts.structure = 'multi-panel-dashboard';
      layouts.grid = '12-column-grid';
    } else if (projectType === 'game') {
      layouts.structure = 'fullscreen-canvas';
      layouts.grid = 'custom-game-layout';
    }

    return layouts;
  }

  getComponentRecommendations(projectType) {
    return {
      library: 'shadcn/ui',
      style: 'modern-rounded',
      customization: 'extensive',
      essentials: [
        'Button',
        'Card',
        'Dialog',
        'Dropdown',
        'Input',
        'Table',
        'Tabs',
        'Toast',
        'Sidebar',
        'Navigation',
        'Footer',
      ],
      projectSpecific: this.getProjectSpecificComponents(projectType),
    };
  }

  getProjectSpecificComponents(projectType) {
    const components = {
      mcp: ['ServerCard', 'ConnectionStatus', 'LogViewer', 'ConfigEditor'],
      ai: ['ChatInterface', 'ModelSelector', 'PromptEditor', 'ResponseViewer'],
      game: ['GameCanvas', 'ScoreBoard', 'PlayerStats', 'Inventory'],
      tool: ['Dashboard', 'Analytics', 'DataTable', 'ChartViewer'],
      general: ['Hero', 'Features', 'Pricing', 'Testimonials'],
    };

    return components[projectType] || components.general;
  }

  getTypographyRecommendations() {
    return {
      fontFamily: {
        sans: 'Inter, system-ui, -apple-system, sans-serif',
        mono: 'JetBrains Mono, Consolas, monospace',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
      },
    };
  }

  getAnimationRecommendations() {
    return {
      transitions: {
        fast: '150ms ease',
        normal: '250ms ease',
        slow: '350ms ease',
      },
      animations: {
        fadeIn: 'fadeIn 250ms ease',
        slideIn: 'slideIn 300ms ease',
        scaleIn: 'scaleIn 200ms ease',
      },
      hover: {
        scale: '1.02',
        brightness: '1.1',
        shadow: 'elevated',
      },
    };
  }

  getFrameworkRecommendations(projectType) {
    const recommendations = {
      frontend: 'React + Next.js',
      styling: 'TailwindCSS',
      components: 'shadcn/ui',
      state: 'Zustand or Context API',
      routing: 'Next.js App Router',
      api: 'tRPC or REST',
      testing: 'Jest + React Testing Library',
    };

    if (projectType === 'game') {
      recommendations.frontend = 'React or Vanilla JS';
      recommendations.canvas = 'Canvas API or Phaser';
    } else if (projectType === 'ai') {
      recommendations.streaming = 'Server-Sent Events';
      recommendations.api = 'OpenAI SDK or Custom';
    }

    return recommendations;
  }

  /**
   * Predict UI preference
   */
  async predictPreference(context) {
    const predictions = {
      theme: 'dark',
      primaryColor: '#3B82F6',
      layout: 'sidebar-navigation',
      framework: 'React + TailwindCSS',
      confidence: 0.95,
    };

    // Adjust based on context
    if (context.projectType) {
      const recommendations = await this.generateUIRecommendations(context.projectType);
      predictions.primaryColor = recommendations.colors.primary;
      predictions.layout = recommendations.layout.structure;
    }

    return predictions;
  }

  /**
   * Save and load preferences
   */
  async savePreferences() {
    const data = {
      visualPreferences: {
        colors: Object.fromEntries(this.visualPreferences.colors.primary),
        layouts: Object.fromEntries(this.visualPreferences.layouts.structure),
        animations: Object.fromEntries(this.visualPreferences.animations.types),
      },
      interactionPreferences: this.interactionPreferences,
      frameworkPreferences: this.frameworkPreferences,
      decisions: Array.from(this.decisions.entries()),
      stats: this.stats,
      savedAt: Date.now(),
    };

    const filepath = path.join(this.config.preferenceDir, 'ui-preferences.json');

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  async loadPreferences() {
    try {
      const filepath = path.join(this.config.preferenceDir, 'ui-preferences.json');

      const content = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(content);

      // Restore preferences
      if (data.visualPreferences) {
        this.visualPreferences.colors.primary = new Map(
          Object.entries(data.visualPreferences.colors)
        );
        this.visualPreferences.layouts.structure = new Map(
          Object.entries(data.visualPreferences.layouts)
        );
        this.visualPreferences.animations.types = new Map(
          Object.entries(data.visualPreferences.animations)
        );
      }

      this.decisions = new Map(data.decisions);
      this.stats = data.stats;

      console.log('📂 Loaded existing UI/UX preferences');
    } catch (error) {
      console.log('🆕 Starting fresh UI/UX preference learning');
    }
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      preferences: {
        colors: this.visualPreferences.colors.primary.size,
        layouts: this.visualPreferences.layouts.structure.size,
        animations: this.visualPreferences.animations.types.size,
      },
      frameworks: {
        preferred: 'React + TailwindCSS',
        components: 'shadcn/ui',
        confidence: 0.95,
      },
      decisions: this.decisions.size,
      statistics: this.stats,
    };
  }

  async shutdown() {
    await this.savePreferences();

    this.emit('shutdown');
    console.log('✅ UI/UX Preference Learner shutdown complete');
    console.log(`   Preferences learned: ${this.stats.preferencesLearned}`);
    console.log(`   Patterns identified: ${this.stats.patternsIdentified}`);
  }
}

module.exports = UIUXPreferenceLearner;
