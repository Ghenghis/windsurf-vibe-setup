/**
 * ============================================================================
 * WINDSURF VIBE SETUP - HIVE MIND MCP TOOLS v4.1
 * ============================================================================
 * 🐝 The Hive Mind: 200+ AI Agents Working in Perfect Harmony
 * ============================================================================
 */

const { EventEmitter } = require('events');

// ============================================================================
// SWARM TEMPLATES - Agent configurations for different task types
// ============================================================================

const SWARM_TEMPLATES = {
  'full-stack': [
    'architect', 'frontend-coder', 'backend-coder', 'database', 
    'security', 'tester', 'devops', 'docs', 'reviewer'
  ],
  'api': ['architect', 'backend-coder', 'database', 'security', 'tester', 'docs'],
  'frontend': ['architect', 'frontend-coder', 'ui-designer', 'tester', 'docs'],
  'testing': ['test-architect', 'unit-tester', 'e2e-tester', 'performance-tester'],
  'security': ['security-auditor', 'sast-analyst', 'secrets-scanner', 'compliance'],
  'debugging': ['bug-hunter', 'log-analyzer', 'code-reviewer', 'tester'],
  'code-review': ['security-auditor', 'performance', 'code-reviewer', 'docs'],
  'default': ['architect', 'coder', 'tester', 'reviewer']
};

// ============================================================================
// COLLECTIVE MEMORY - Shared knowledge across all agents
// ============================================================================

class CollectiveMemory {
  constructor() {
    this.patterns = new Map();
    this.solutions = new Map();
    this.experiences = [];
    this.maxExperiences = 10000;
  }

  async store(key, data, metadata = {}) {
    this.patterns.set(key, { data, metadata, timestamp: Date.now(), accessCount: 0 });
    return { stored: true, key };
  }

  async query(query) {
    const results = [];
    for (const [key, value] of this.patterns) {
      if (key.toLowerCase().includes(query.toLowerCase())) {
        value.accessCount++;
        results.push({ key, ...value });
      }
    }
    return results;
  }

  async learn(pattern, solution, context) {
    this.experiences.push({ pattern, solution, context, timestamp: Date.now() });
    if (this.experiences.length > this.maxExperiences) {
      this.experiences = this.experiences.slice(-this.maxExperiences);
    }
    return { learned: true, totalExperiences: this.experiences.length };
  }

  getStats() {
    return { patterns: this.patterns.size, solutions: this.solutions.size, experiences: this.experiences.length };
  }
}

// ============================================================================
// PROVIDER MANAGER - Ollama, LM Studio integration
// ============================================================================

class ProviderManager {
  constructor() {
    this.providers = {
      ollama: { url: 'http://localhost:11434', status: 'unknown', models: [] },
      lmstudio: { url: 'http://localhost:1234', status: 'unknown', models: [] }
    };
  }

  async checkProviders() {
    try {
      const response = await fetch(`${this.providers.ollama.url}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        this.providers.ollama.status = 'online';
        this.providers.ollama.models = data.models?.map(m => m.name) || [];
      }
    } catch { this.providers.ollama.status = 'offline'; }

    try {
      const response = await fetch(`${this.providers.lmstudio.url}/v1/models`);
      if (response.ok) {
        const data = await response.json();
        this.providers.lmstudio.status = 'online';
        this.providers.lmstudio.models = data.data?.map(m => m.id) || [];
      }
    } catch { this.providers.lmstudio.status = 'offline'; }
    return this.getStatus();
  }

  getStatus() {
    return {
      ollama: { status: this.providers.ollama.status, modelCount: this.providers.ollama.models.length },
      lmstudio: { status: this.providers.lmstudio.status, modelCount: this.providers.lmstudio.models.length }
    };
  }

  getBestProvider() {
    if (this.providers.ollama.status === 'online') return 'ollama';
    if (this.providers.lmstudio.status === 'online') return 'lmstudio';
    return null;
  }
}

module.exports = { CollectiveMemory, ProviderManager, SWARM_TEMPLATES };
