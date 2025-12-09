/**
 * GitHub Portfolio Analyzer - VIBE Hive Mind
 * Analyzes user's 300-400 GitHub repos to understand patterns
 * Designed for a 100% VIBE Coder who has never written code manually
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class GitHubPortfolioAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = {
      analyzerDir: options.analyzerDir || path.join(process.cwd(), 'vibe-data', 'github-analysis'),
      githubUsername: options.githubUsername || 'vibe-coder',
      repoLimit: options.repoLimit || 400,
      analysisDepth: options.analysisDepth || 'deep', // shallow, medium, deep
      useLocalCache: options.useLocalCache !== false,
    };

    // Portfolio overview
    this.portfolio = {
      username: this.config.githubUsername,
      totalRepos: 0,
      analyzedRepos: 0,
      createdByAI: true, // All repos are AI-generated
      yearsActive: 0,
      primaryLanguages: new Map(),
      frameworks: new Map(),
      projectTypes: new Map(),
    };

    // Repository analysis
    this.repositories = new Map();
    this.repoPatterns = new Map();
    this.techStack = new Map();

    // Project categorization
    this.projectCategories = {
      webApps: [],
      mobileApps: [],
      apis: [],
      tools: [],
      games: [],
      dataViz: [],
      automation: [],
      experimental: [],
      templates: [],
      other: [],
    };

    // Pattern recognition
    this.patterns = {
      naming: new Map(), // Repository naming patterns
      structure: new Map(), // Project structure patterns
      dependencies: new Map(), // Common dependencies
      topics: new Map(), // GitHub topics/tags
      descriptions: new Map(), // Description patterns
      readmes: new Map(), // README patterns
    };

    // Technology preferences
    this.techPreferences = {
      frontend: new Map(),
      backend: new Map(),
      database: new Map(),
      deployment: new Map(),
      testing: new Map(),
      styling: new Map(),
      stateManagement: new Map(),
      authentication: new Map(),
    };

    // Evolution tracking
    this.evolution = {
      timeline: [],
      technologyShifts: [],
      complexityGrowth: [],
      interests: [],
    };

    // Success metrics
    this.metrics = {
      mostStarred: [],
      mostForked: [],
      mostActive: [],
      mostComplex: [],
      mostRecent: [],
    };

    // Statistics
    this.stats = {
      totalReposAnalyzed: 0,
      patternsFound: 0,
      technologiesIdentified: 0,
      averageRepoSize: 0,
      averageComplexity: 0,
      uniqueFrameworks: 0,
    };

    this.isInitialized = false;
  }

  async initialize() {
    console.log('📊 Initializing GitHub Portfolio Analyzer...');
    console.log('   Analyzing 300-400 AI-generated repositories...');

    await fs.mkdir(this.config.analyzerDir, { recursive: true });
    await fs.mkdir(path.join(this.config.analyzerDir, 'repos'), { recursive: true });
    await fs.mkdir(path.join(this.config.analyzerDir, 'patterns'), { recursive: true });
    await fs.mkdir(path.join(this.config.analyzerDir, 'reports'), { recursive: true });

    // Load cached analysis if available
    if (this.config.useLocalCache) {
      await this.loadCachedAnalysis();
    }

    this.isInitialized = true;
    this.emit('initialized');

    console.log('✅ GitHub Portfolio Analyzer initialized');
  }

  /**
   * Analyze all repositories
   */
  async analyzePortfolio(repos = null) {
    console.log('🔍 Starting portfolio analysis...');

    // In production, this would fetch from GitHub API
    // For now, simulate with patterns common in AI-generated repos
    const simulatedRepos = repos || (await this.simulateAIGeneratedRepos());

    for (const repo of simulatedRepos) {
      await this.analyzeRepository(repo);
    }

    // Identify patterns
    await this.identifyPatterns();

    // Calculate metrics
    await this.calculateMetrics();

    // Track evolution
    await this.trackEvolution();

    // Generate insights
    const insights = await this.generateInsights();

    this.emit('analysisComplete', insights);

    return insights;
  }

  /**
   * Simulate AI-generated repositories
   */
  async simulateAIGeneratedRepos() {
    const repos = [];
    const projectTypes = [
      'dashboard',
      'landing-page',
      'e-commerce',
      'chat-app',
      'todo-app',
      'portfolio',
      'blog',
      'api',
      'game',
      'tool',
      'visualization',
      'automation',
      'scraper',
      'bot',
      'extension',
    ];

    const frameworks = [
      'react',
      'nextjs',
      'vue',
      'angular',
      'svelte',
      'express',
      'fastapi',
      'django',
      'flask',
      'nestjs',
    ];

    const databases = ['mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'firebase', 'supabase'];

    // Generate 400 simulated repos
    for (let i = 1; i <= 400; i++) {
      const type = projectTypes[Math.floor(Math.random() * projectTypes.length)];
      const framework = frameworks[Math.floor(Math.random() * frameworks.length)];
      const database =
        Math.random() > 0.5 ? databases[Math.floor(Math.random() * databases.length)] : null;

      repos.push({
        id: i,
        name: `${type}-${framework}-${i}`,
        description: `AI-generated ${type} using ${framework}`,
        language: this.getLanguageForFramework(framework),
        framework,
        database,
        type,
        stars: Math.floor(Math.random() * 100),
        forks: Math.floor(Math.random() * 20),
        created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3), // Last 3 years
        updated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        topics: [type, framework, database].filter(Boolean),
        isAIGenerated: true,
        complexity: Math.floor(Math.random() * 10) + 1,
      });
    }

    return repos;
  }

  getLanguageForFramework(framework) {
    const languageMap = {
      react: 'JavaScript',
      nextjs: 'JavaScript',
      vue: 'JavaScript',
      angular: 'TypeScript',
      svelte: 'JavaScript',
      express: 'JavaScript',
      fastapi: 'Python',
      django: 'Python',
      flask: 'Python',
      nestjs: 'TypeScript',
    };

    return languageMap[framework] || 'JavaScript';
  }

  /**
   * Analyze individual repository
   */
  async analyzeRepository(repo) {
    const analysis = {
      id: repo.id,
      name: repo.name,
      type: repo.type,
      language: repo.language,
      framework: repo.framework,
      database: repo.database,
      patterns: [],
      complexity: repo.complexity,
      metrics: {
        stars: repo.stars,
        forks: repo.forks,
        age: Date.now() - new Date(repo.created).getTime(),
        lastUpdate: Date.now() - new Date(repo.updated).getTime(),
      },
      aiGenerated: true,
    };

    // Categorize project
    this.categorizeProject(repo);

    // Track technology usage
    this.trackTechnology(repo);

    // Identify naming patterns
    this.analyzeNamingPattern(repo.name);

    // Store analysis
    this.repositories.set(repo.name, analysis);

    this.stats.totalReposAnalyzed++;
    this.portfolio.analyzedRepos++;

    return analysis;
  }

  /**
   * Categorize projects
   */
  categorizeProject(repo) {
    const typeMap = {
      dashboard: 'webApps',
      'landing-page': 'webApps',
      'e-commerce': 'webApps',
      'chat-app': 'webApps',
      'todo-app': 'webApps',
      portfolio: 'webApps',
      blog: 'webApps',
      api: 'apis',
      game: 'games',
      tool: 'tools',
      visualization: 'dataViz',
      automation: 'automation',
      scraper: 'automation',
      bot: 'automation',
      extension: 'tools',
    };

    const category = typeMap[repo.type] || 'other';
    this.projectCategories[category].push(repo.name);

    // Track project types
    const count = this.patterns.naming.get(repo.type) || 0;
    this.patterns.naming.set(repo.type, count + 1);
  }

  /**
   * Track technology usage
   */
  trackTechnology(repo) {
    // Track language
    if (repo.language) {
      const langCount = this.portfolio.primaryLanguages.get(repo.language) || 0;
      this.portfolio.primaryLanguages.set(repo.language, langCount + 1);
    }

    // Track framework
    if (repo.framework) {
      const fwCount = this.portfolio.frameworks.get(repo.framework) || 0;
      this.portfolio.frameworks.set(repo.framework, fwCount + 1);

      // Categorize by tech type
      if (['react', 'vue', 'angular', 'svelte', 'nextjs'].includes(repo.framework)) {
        const feCount = this.techPreferences.frontend.get(repo.framework) || 0;
        this.techPreferences.frontend.set(repo.framework, feCount + 1);
      } else {
        const beCount = this.techPreferences.backend.get(repo.framework) || 0;
        this.techPreferences.backend.set(repo.framework, beCount + 1);
      }
    }

    // Track database
    if (repo.database) {
      const dbCount = this.techPreferences.database.get(repo.database) || 0;
      this.techPreferences.database.set(repo.database, dbCount + 1);
    }
  }

  /**
   * Analyze naming patterns
   */
  analyzeNamingPattern(name) {
    // Common patterns in AI-generated repo names
    const patterns = [
      { regex: /^(.+)-app-\d+$/, type: 'numbered-app' },
      { regex: /^(.+)-(.+)-\d+$/, type: 'type-framework-number' },
      { regex: /^modern-(.+)$/, type: 'modern-prefix' },
      { regex: /^(.+)-clone$/, type: 'clone-suffix' },
      { regex: /^(.+)-dashboard$/, type: 'dashboard-suffix' },
      { regex: /^(.+)-api$/, type: 'api-suffix' },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(name)) {
        const count = this.patterns.naming.get(pattern.type) || 0;
        this.patterns.naming.set(pattern.type, count + 1);
        this.stats.patternsFound++;
        break;
      }
    }
  }

  /**
   * Identify patterns across portfolio
   */
  async identifyPatterns() {
    // Technology progression pattern
    const techByDate = Array.from(this.repositories.values()).sort(
      (a, b) => a.metrics.age - b.metrics.age
    );

    // Identify shifts in technology preferences
    let currentTech = null;
    let shiftCount = 0;

    for (const repo of techByDate) {
      if (currentTech !== repo.framework) {
        if (currentTech) {
          this.evolution.technologyShifts.push({
            from: currentTech,
            to: repo.framework,
            when: repo.metrics.age,
          });
          shiftCount++;
        }
        currentTech = repo.framework;
      }
    }

    // Complexity growth pattern
    const avgComplexityByQuarter = {};
    for (const repo of this.repositories.values()) {
      const quarter = Math.floor(repo.metrics.age / (90 * 24 * 60 * 60 * 1000));
      if (!avgComplexityByQuarter[quarter]) {
        avgComplexityByQuarter[quarter] = [];
      }
      avgComplexityByQuarter[quarter].push(repo.complexity);
    }

    for (const [quarter, complexities] of Object.entries(avgComplexityByQuarter)) {
      const avg = complexities.reduce((a, b) => a + b, 0) / complexities.length;
      this.evolution.complexityGrowth.push({
        quarter: parseInt(quarter),
        averageComplexity: avg,
      });
    }
  }

  /**
   * Calculate portfolio metrics
   */
  async calculateMetrics() {
    const repos = Array.from(this.repositories.values());

    // Most starred
    this.metrics.mostStarred = repos
      .sort((a, b) => b.metrics.stars - a.metrics.stars)
      .slice(0, 10)
      .map(r => ({ name: r.name, stars: r.metrics.stars }));

    // Most forked
    this.metrics.mostForked = repos
      .sort((a, b) => b.metrics.forks - a.metrics.forks)
      .slice(0, 10)
      .map(r => ({ name: r.name, forks: r.metrics.forks }));

    // Most recent
    this.metrics.mostRecent = repos
      .sort((a, b) => a.metrics.lastUpdate - b.metrics.lastUpdate)
      .slice(0, 10)
      .map(r => ({ name: r.name, updated: r.metrics.lastUpdate }));

    // Most complex
    this.metrics.mostComplex = repos
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10)
      .map(r => ({ name: r.name, complexity: r.complexity }));

    // Calculate averages
    this.stats.averageComplexity = repos.reduce((sum, r) => sum + r.complexity, 0) / repos.length;
    this.stats.uniqueFrameworks = this.portfolio.frameworks.size;
    this.stats.technologiesIdentified =
      this.techPreferences.frontend.size +
      this.techPreferences.backend.size +
      this.techPreferences.database.size;
  }

  /**
   * Track portfolio evolution
   */
  async trackEvolution() {
    // Create timeline
    const repos = Array.from(this.repositories.values()).sort(
      (a, b) => b.metrics.age - a.metrics.age
    );

    // Group by month
    const monthlyActivity = {};
    for (const repo of repos) {
      const monthsAgo = Math.floor(repo.metrics.age / (30 * 24 * 60 * 60 * 1000));
      if (!monthlyActivity[monthsAgo]) {
        monthlyActivity[monthsAgo] = {
          count: 0,
          technologies: new Set(),
          types: new Set(),
        };
      }

      monthlyActivity[monthsAgo].count++;
      monthlyActivity[monthsAgo].technologies.add(repo.framework);
      monthlyActivity[monthsAgo].types.add(repo.type);
    }

    // Convert to timeline
    this.evolution.timeline = Object.entries(monthlyActivity)
      .map(([month, data]) => ({
        monthsAgo: parseInt(month),
        reposCreated: data.count,
        uniqueTechnologies: data.technologies.size,
        projectTypes: Array.from(data.types),
      }))
      .sort((a, b) => b.monthsAgo - a.monthsAgo);
  }

  /**
   * Generate insights from analysis
   */
  async generateInsights() {
    const insights = {
      profile: {
        type: '100% VIBE Coder',
        totalRepos: this.stats.totalReposAnalyzed,
        aiGenerated: '100%',
        yearsActive: Math.ceil(
          Math.max(...Array.from(this.repositories.values()).map(r => r.metrics.age)) /
            (365 * 24 * 60 * 60 * 1000)
        ),
      },

      preferences: {
        primaryLanguage: this.getMostUsed(this.portfolio.primaryLanguages),
        favoriteFramework: this.getMostUsed(this.portfolio.frameworks),
        preferredFrontend: this.getMostUsed(this.techPreferences.frontend),
        preferredBackend: this.getMostUsed(this.techPreferences.backend),
        preferredDatabase: this.getMostUsed(this.techPreferences.database),
      },

      patterns: {
        namingStyle: this.getMostUsed(this.patterns.naming),
        projectTypes: this.getTopCategories(),
        complexity: {
          average: this.stats.averageComplexity.toFixed(1),
          trend: this.getComplexityTrend(),
        },
      },

      evolution: {
        technologyShifts: this.evolution.technologyShifts.length,
        currentFocus: this.getCurrentFocus(),
        growthRate: this.getGrowthRate(),
      },

      recommendations: await this.generateRecommendations(),

      metrics: this.metrics,

      summary: {
        totalTechnologies: this.stats.technologiesIdentified,
        uniqueFrameworks: this.stats.uniqueFrameworks,
        patternsIdentified: this.stats.patternsFound,
        dominantCategory: this.getDominantCategory(),
      },
    };

    return insights;
  }

  getMostUsed(map) {
    if (map.size === 0) return 'None';

    let maxCount = 0;
    let mostUsed = '';

    for (const [key, count] of map) {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = key;
      }
    }

    return mostUsed;
  }

  getTopCategories() {
    const categories = [];
    for (const [category, repos] of Object.entries(this.projectCategories)) {
      if (repos.length > 0) {
        categories.push({
          category,
          count: repos.length,
          percentage: ((repos.length / this.stats.totalReposAnalyzed) * 100).toFixed(1),
        });
      }
    }

    return categories.sort((a, b) => b.count - a.count).slice(0, 5);
  }

  getComplexityTrend() {
    if (this.evolution.complexityGrowth.length < 2) return 'stable';

    const recent = this.evolution.complexityGrowth.slice(-3);
    const older = this.evolution.complexityGrowth.slice(0, 3);

    const recentAvg = recent.reduce((sum, g) => sum + g.averageComplexity, 0) / recent.length;
    const olderAvg = older.reduce((sum, g) => sum + g.averageComplexity, 0) / older.length;

    if (recentAvg > olderAvg * 1.2) return 'increasing';
    if (recentAvg < olderAvg * 0.8) return 'decreasing';
    return 'stable';
  }

  getCurrentFocus() {
    // Get most recent repos
    const recent = Array.from(this.repositories.values())
      .sort((a, b) => a.metrics.lastUpdate - b.metrics.lastUpdate)
      .slice(0, 20);

    const recentTech = new Map();
    for (const repo of recent) {
      const count = recentTech.get(repo.framework) || 0;
      recentTech.set(repo.framework, count + 1);
    }

    return this.getMostUsed(recentTech);
  }

  getGrowthRate() {
    if (this.evolution.timeline.length < 2) return 'unknown';

    const recentMonth = this.evolution.timeline.find(t => t.monthsAgo === 0)?.reposCreated || 0;
    const lastMonth = this.evolution.timeline.find(t => t.monthsAgo === 1)?.reposCreated || 0;

    if (lastMonth === 0) return 'new';

    const rate = (((recentMonth - lastMonth) / lastMonth) * 100).toFixed(1);
    return `${rate > 0 ? '+' : ''}${rate}%`;
  }

  getDominantCategory() {
    let maxCount = 0;
    let dominant = '';

    for (const [category, repos] of Object.entries(this.projectCategories)) {
      if (repos.length > maxCount) {
        maxCount = repos.length;
        dominant = category;
      }
    }

    return dominant;
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations() {
    const recommendations = [];

    // Technology recommendations
    const currentFocus = this.getCurrentFocus();
    if (currentFocus) {
      recommendations.push({
        type: 'technology',
        suggestion: `Continue exploring ${currentFocus} - it's your current focus`,
        confidence: 0.9,
      });
    }

    // Project type recommendations
    const topCategory = this.getDominantCategory();
    recommendations.push({
      type: 'project',
      suggestion: `Consider building more ${topCategory} projects - it's your strength`,
      confidence: 0.85,
    });

    // Complexity recommendations
    const trend = this.getComplexityTrend();
    if (trend === 'increasing') {
      recommendations.push({
        type: 'growth',
        suggestion: 'Your projects are getting more complex - great progress!',
        confidence: 0.8,
      });
    }

    // Framework diversity
    if (this.stats.uniqueFrameworks < 5) {
      recommendations.push({
        type: 'exploration',
        suggestion: 'Try exploring new frameworks to diversify your portfolio',
        confidence: 0.7,
      });
    }

    return recommendations;
  }

  /**
   * Cache management
   */
  async saveAnalysis() {
    const data = {
      portfolio: this.portfolio,
      categories: this.projectCategories,
      patterns: Object.fromEntries(this.patterns.naming),
      techPreferences: {
        frontend: Object.fromEntries(this.techPreferences.frontend),
        backend: Object.fromEntries(this.techPreferences.backend),
        database: Object.fromEntries(this.techPreferences.database),
      },
      evolution: this.evolution,
      metrics: this.metrics,
      stats: this.stats,
      savedAt: Date.now(),
    };

    const filepath = path.join(this.config.analyzerDir, 'portfolio-analysis.json');

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  async loadCachedAnalysis() {
    try {
      const filepath = path.join(this.config.analyzerDir, 'portfolio-analysis.json');

      const content = await fs.readFile(filepath, 'utf8');
      const data = JSON.parse(content);

      // Restore data
      this.portfolio = data.portfolio;
      this.projectCategories = data.categories;
      this.patterns.naming = new Map(Object.entries(data.patterns));
      this.techPreferences.frontend = new Map(Object.entries(data.techPreferences.frontend));
      this.techPreferences.backend = new Map(Object.entries(data.techPreferences.backend));
      this.techPreferences.database = new Map(Object.entries(data.techPreferences.database));
      this.evolution = data.evolution;
      this.metrics = data.metrics;
      this.stats = data.stats;

      console.log('📂 Loaded cached portfolio analysis');
    } catch (error) {
      console.log('🆕 No cached analysis found, will perform fresh analysis');
    }
  }

  /**
   * Status and shutdown
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      portfolio: {
        username: this.portfolio.username,
        totalRepos: this.portfolio.totalRepos,
        analyzed: this.portfolio.analyzedRepos,
      },
      categories: Object.entries(this.projectCategories).map(([cat, repos]) => ({
        category: cat,
        count: repos.length,
      })),
      technologies: {
        languages: this.portfolio.primaryLanguages.size,
        frameworks: this.portfolio.frameworks.size,
        databases: this.techPreferences.database.size,
      },
      patterns: this.patterns.naming.size,
      statistics: this.stats,
    };
  }

  async shutdown() {
    // Save analysis
    await this.saveAnalysis();

    // Generate final report
    const insights = await this.generateInsights();
    const reportPath = path.join(
      this.config.analyzerDir,
      'reports',
      `portfolio-report-${Date.now()}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(insights, null, 2));

    this.emit('shutdown');
    console.log('✅ GitHub Portfolio Analyzer shutdown complete');
    console.log(`   Repos analyzed: ${this.stats.totalReposAnalyzed}`);
    console.log(`   Patterns found: ${this.stats.patternsFound}`);
  }
}

module.exports = GitHubPortfolioAnalyzer;
