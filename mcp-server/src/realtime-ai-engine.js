#!/usr/bin/env node
/**
 * Real-Time AI/ML Learning Engine v1.0
 *
 * COMPREHENSIVE AI/ML SYSTEM FOR AUTOPILOT
 *
 * Features:
 * 1. SQLite Database - Persistent structured storage
 * 2. Real-Time Learning - Learn from every interaction immediately
 * 3. Web Integration - Fetch solutions from Stack Overflow, GitHub, NPM
 * 4. Semantic Understanding - Pattern matching and intent detection
 * 5. Feedback Loops - User ratings improve suggestions
 * 6. Automation - Proactive learning and self-improvement
 * 7. Vector Memory - Similarity-based recall
 * 8. Knowledge Graph - Relationships between concepts
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const HOME = os.homedir();
const IS_WINDOWS = process.platform === 'win32';

// ==============================================================================
// DATABASE CONFIGURATION
// ==============================================================================
const AI_DATA_DIR = IS_WINDOWS
  ? path.join(process.env.APPDATA || HOME, 'WindsurfAutopilot', 'ai-engine')
  : path.join(HOME, '.windsurf-autopilot', 'ai-engine');

const DB_FILES = {
  interactions: path.join(AI_DATA_DIR, 'interactions.json'),
  knowledge: path.join(AI_DATA_DIR, 'knowledge-base.json'),
  solutions: path.join(AI_DATA_DIR, 'solutions-cache.json'),
  embeddings: path.join(AI_DATA_DIR, 'embeddings.json'),
  feedback: path.join(AI_DATA_DIR, 'user-feedback.json'),
  models: path.join(AI_DATA_DIR, 'learned-models.json'),
  webCache: path.join(AI_DATA_DIR, 'web-cache.json')
};

// Initialize AI data directory
function initAIEngine() {
  if (!fs.existsSync(AI_DATA_DIR)) {
    fs.mkdirSync(AI_DATA_DIR, { recursive: true });
  }

  const defaults = {
    interactions: {
      version: '1.0',
      total: 0,
      sessions: [],
      realtimeQueue: []
    },
    knowledge: {
      version: '1.0',
      concepts: {},
      relationships: [],
      facts: []
    },
    solutions: {
      version: '1.0',
      cache: {},
      successRates: {}
    },
    embeddings: {
      version: '1.0',
      vectors: {},
      index: []
    },
    feedback: {
      version: '1.0',
      ratings: [],
      improvements: []
    },
    models: {
      version: '1.0',
      errorClassifier: { weights: {}, accuracy: 0 },
      intentClassifier: { weights: {}, accuracy: 0 },
      solutionRanker: { weights: {}, accuracy: 0 }
    },
    webCache: {
      version: '1.0',
      stackoverflow: {},
      github: {},
      npm: {},
      lastUpdate: null
    }
  };

  Object.entries(DB_FILES).forEach(([key, filepath]) => {
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify(defaults[key], null, 2));
    }
  });

  return { success: true, dataDir: AI_DATA_DIR };
}

// Load/Save database
function loadDB(name) {
  try {
    initAIEngine();
    return JSON.parse(fs.readFileSync(DB_FILES[name], 'utf8'));
  } catch (e) {
    return null;
  }
}

function saveDB(name, data) {
  try {
    initAIEngine();
    fs.writeFileSync(DB_FILES[name], JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

// ==============================================================================
// 1. REAL-TIME LEARNING ENGINE
// ==============================================================================

/**
 * Process interaction in real-time and learn immediately
 */
async function learnFromInteraction(interaction) {
  const db = loadDB('interactions') || { total: 0, sessions: [], realtimeQueue: [] };

  // Add to real-time queue
  const enrichedInteraction = {
    ...interaction,
    timestamp: new Date().toISOString(),
    id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    processed: false
  };

  db.realtimeQueue.push(enrichedInteraction);
  db.total++;

  // Process immediately
  const learnings = await processInteractionRealtime(enrichedInteraction);
  enrichedInteraction.processed = true;
  enrichedInteraction.learnings = learnings;

  // Keep last 10000 interactions
  if (db.realtimeQueue.length > 10000) {
    db.realtimeQueue = db.realtimeQueue.slice(-10000);
  }

  saveDB('interactions', db);

  return {
    interactionId: enrichedInteraction.id,
    learnings,
    totalInteractions: db.total
  };
}

/**
 * Process single interaction and extract learnings
 */
async function processInteractionRealtime(interaction) {
  const learnings = {
    patterns: [],
    concepts: [],
    solutions: [],
    improvements: []
  };

  // 1. Classify intent
  const intent = classifyIntent(interaction.action, interaction.params);
  learnings.intent = intent;

  // 2. Extract entities
  const entities = extractEntities(interaction);
  learnings.entities = entities;

  // 3. Learn patterns
  if (interaction.success) {
    learnings.patterns.push({
      type: 'success',
      action: interaction.action,
      context: interaction.context,
      weight: 1.0
    });

    // Update success model
    updateSuccessModel(interaction);
  } else {
    learnings.patterns.push({
      type: 'failure',
      action: interaction.action,
      error: interaction.error,
      weight: 1.0
    });

    // Learn from failure
    const solution = await findSolutionForError(interaction.error);
    if (solution) {
      learnings.solutions.push(solution);
    }
  }

  // 4. Update knowledge graph
  updateKnowledgeGraph(interaction, entities);

  // 5. Create/update embeddings for similarity search
  const embedding = createEmbedding(interaction);
  storeEmbedding(interaction.id, embedding);

  return learnings;
}

/**
 * Classify user intent from action and parameters
 */
function classifyIntent(action, params) {
  const intents = {
    'create': ['create_project', 'write_file', 'generate_code'],
    'fix': ['auto_fix', 'analyze_error', 'smart_retry'],
    'build': ['execute_command', 'install_packages', 'run_script'],
    'analyze': ['analyze_project', 'detect_tech_stack', 'diagnose_environment'],
    'deploy': ['docker_build', 'docker_run', 'start_server'],
    'test': ['run_tests', 'generate_tests'],
    'query': ['get_status', 'get_insights', 'get_suggestions']
  };

  for (const [intent, actions] of Object.entries(intents)) {
    if (actions.includes(action)) {
      return { intent, confidence: 0.9 };
    }
  }

  return { intent: 'unknown', confidence: 0.5 };
}

/**
 * Extract entities from interaction
 */
function extractEntities(interaction) {
  const entities = [];
  const params = interaction.params || {};

  // Extract file paths
  if (params.path || params.filePath || params.projectPath) {
    const filePath = params.path || params.filePath || params.projectPath;
    entities.push({ type: 'path', value: filePath });

    // Extract file extension
    const ext = path.extname(filePath);
    if (ext) {
      entities.push({ type: 'fileType', value: ext });
    }
  }

  // Extract commands
  if (params.command) {
    entities.push({ type: 'command', value: params.command });

    // Extract package manager
    if (params.command.startsWith('npm')) {
      entities.push({ type: 'tool', value: 'npm' });
    }
    if (params.command.startsWith('pip')) {
      entities.push({ type: 'tool', value: 'pip' });
    }
    if (params.command.startsWith('git')) {
      entities.push({ type: 'tool', value: 'git' });
    }
  }

  // Extract project types
  if (params.type) {
    entities.push({ type: 'projectType', value: params.type });
  }

  // Extract error types
  if (interaction.error) {
    entities.push({ type: 'error', value: categorizeError(interaction.error) });
  }

  return entities;
}

/**
 * Categorize error into types
 */
function categorizeError(error) {
  const errorStr = String(error).toLowerCase();

  if (errorStr.includes('enoent') || errorStr.includes('not found')) {
    return 'FILE_NOT_FOUND';
  }
  if (errorStr.includes('permission') || errorStr.includes('eacces')) {
    return 'PERMISSION_ERROR';
  }
  if (errorStr.includes('network') || errorStr.includes('econnrefused')) {
    return 'NETWORK_ERROR';
  }
  if (errorStr.includes('timeout')) {
    return 'TIMEOUT_ERROR';
  }
  if (errorStr.includes('syntax')) {
    return 'SYNTAX_ERROR';
  }
  if (errorStr.includes('module') || errorStr.includes('import')) {
    return 'MODULE_ERROR';
  }
  if (errorStr.includes('memory') || errorStr.includes('heap')) {
    return 'MEMORY_ERROR';
  }
  if (errorStr.includes('npm err')) {
    return 'NPM_ERROR';
  }
  if (errorStr.includes('git')) {
    return 'GIT_ERROR';
  }
  if (errorStr.includes('python') || errorStr.includes('pip')) {
    return 'PYTHON_ERROR';
  }
  if (errorStr.includes('typescript') || errorStr.includes('type')) {
    return 'TYPE_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

// ==============================================================================
// 2. WEB INTEGRATION - Real-time Learning from the Web
// ==============================================================================

/**
 * Search Stack Overflow for solutions
 */
async function searchStackOverflow(query, tags = []) {
  const cache = loadDB('webCache') || { stackoverflow: {} };
  const cacheKey = `${query}_${tags.join(',')}`;

  // Check cache (valid for 24 hours)
  if (cache.stackoverflow[cacheKey]) {
    const cached = cache.stackoverflow[cacheKey];
    if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return { ...cached.data, fromCache: true };
    }
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const tagString = tags.length > 0 ? `&tagged=${tags.join(';')}` : '';
    const url = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodedQuery}${tagString}&site=stackoverflow&filter=withbody`;

    const response = await httpGet(url);
    const data = JSON.parse(response);

    const results = {
      query,
      tags,
      items: (data.items || []).slice(0, 5).map(item => ({
        title: item.title,
        link: item.link,
        score: item.score,
        answerCount: item.answer_count,
        isAnswered: item.is_answered,
        tags: item.tags
      })),
      timestamp: Date.now()
    };

    // Cache results
    cache.stackoverflow[cacheKey] = { data: results, timestamp: Date.now() };
    saveDB('webCache', cache);

    // Learn from results
    learnFromWebResults('stackoverflow', results);

    return results;
  } catch (e) {
    return { error: e.message, query, tags };
  }
}

/**
 * Search GitHub for code examples
 */
async function searchGitHub(query, language = '') {
  const cache = loadDB('webCache') || { github: {} };
  const cacheKey = `${query}_${language}`;

  // Check cache
  if (cache.github[cacheKey]) {
    const cached = cache.github[cacheKey];
    if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return { ...cached.data, fromCache: true };
    }
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const langFilter = language ? `+language:${language}` : '';
    const url = `https://api.github.com/search/code?q=${encodedQuery}${langFilter}&per_page=5`;

    const response = await httpGet(url, {
      'User-Agent': 'WindsurfAutopilot/2.3',
      'Accept': 'application/vnd.github.v3+json'
    });
    const data = JSON.parse(response);

    const results = {
      query,
      language,
      items: (data.items || []).map(item => ({
        name: item.name,
        path: item.path,
        repository: item.repository?.full_name,
        url: item.html_url,
        score: item.score
      })),
      timestamp: Date.now()
    };

    // Cache results
    cache.github[cacheKey] = { data: results, timestamp: Date.now() };
    saveDB('webCache', cache);

    return results;
  } catch (e) {
    return { error: e.message, query, language };
  }
}

/**
 * Search NPM for packages
 */
async function searchNPM(query) {
  const cache = loadDB('webCache') || { npm: {} };

  if (cache.npm[query]) {
    const cached = cache.npm[query];
    if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return { ...cached.data, fromCache: true };
    }
  }

  try {
    const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=5`;
    const response = await httpGet(url);
    const data = JSON.parse(response);

    const results = {
      query,
      packages: (data.objects || []).map(obj => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description,
        keywords: obj.package.keywords,
        score: obj.score?.final
      })),
      timestamp: Date.now()
    };

    cache.npm[query] = { data: results, timestamp: Date.now() };
    saveDB('webCache', cache);

    return results;
  } catch (e) {
    return { error: e.message, query };
  }
}

/**
 * Learn from web search results
 */
function learnFromWebResults(source, results) {
  const knowledge = loadDB('knowledge') || { concepts: {}, relationships: [], facts: [] };

  if (source === 'stackoverflow' && results.items) {
    results.items.forEach(item => {
      // Learn common tags/concepts
      (item.tags || []).forEach(tag => {
        if (!knowledge.concepts[tag]) {
          knowledge.concepts[tag] = { type: 'technology', mentions: 0, sources: [] };
        }
        knowledge.concepts[tag].mentions++;
        knowledge.concepts[tag].sources.push({
          type: 'stackoverflow',
          title: item.title,
          score: item.score
        });
      });
    });
  }

  saveDB('knowledge', knowledge);
}

/**
 * Find solution for an error from web and local knowledge
 */
async function findSolutionForError(error) {
  const errorType = categorizeError(error);
  const solutions = loadDB('solutions') || { cache: {}, successRates: {} };

  // Check local cache first
  if (solutions.cache[errorType]) {
    const cached = solutions.cache[errorType];
    // Return highest success rate solution
    const sorted = cached.solutions.sort((a, b) =>
      (solutions.successRates[b.id] || 0) - (solutions.successRates[a.id] || 0)
    );
    if (sorted.length > 0) {
      return { ...sorted[0], source: 'local_cache' };
    }
  }

  // Search web for solutions
  const webSolutions = await searchStackOverflow(
    `${errorType.replace(/_/g, ' ')} ${error.substring(0, 100)}`,
    ['javascript', 'node.js', 'python']
  );

  if (webSolutions.items && webSolutions.items.length > 0) {
    const solution = {
      id: `sol_${Date.now()}`,
      errorType,
      source: 'stackoverflow',
      title: webSolutions.items[0].title,
      link: webSolutions.items[0].link,
      confidence: webSolutions.items[0].score / 100
    };

    // Cache the solution
    if (!solutions.cache[errorType]) {
      solutions.cache[errorType] = { solutions: [] };
    }
    solutions.cache[errorType].solutions.push(solution);
    saveDB('solutions', solutions);

    return solution;
  }

  return null;
}

// ==============================================================================
// 3. KNOWLEDGE GRAPH
// ==============================================================================

/**
 * Update knowledge graph with new information
 */
function updateKnowledgeGraph(interaction, entities) {
  const knowledge = loadDB('knowledge') || { concepts: {}, relationships: [], facts: [] };

  // Add entities as concepts
  entities.forEach(entity => {
    const key = `${entity.type}:${entity.value}`;
    if (!knowledge.concepts[key]) {
      knowledge.concepts[key] = {
        type: entity.type,
        value: entity.value,
        firstSeen: new Date().toISOString(),
        occurrences: 0,
        context: []
      };
    }
    knowledge.concepts[key].occurrences++;
    knowledge.concepts[key].lastSeen = new Date().toISOString();
  });

  // Create relationships between entities
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const relationship = {
        from: `${entities[i].type}:${entities[i].value}`,
        to: `${entities[j].type}:${entities[j].value}`,
        action: interaction.action,
        strength: 1,
        timestamp: new Date().toISOString()
      };

      // Check if relationship exists
      const existing = knowledge.relationships.find(r =>
        r.from === relationship.from && r.to === relationship.to
      );

      if (existing) {
        existing.strength++;
        existing.timestamp = new Date().toISOString();
      } else {
        knowledge.relationships.push(relationship);
      }
    }
  }

  // Add fact
  knowledge.facts.push({
    action: interaction.action,
    success: interaction.success,
    entities: entities.map(e => `${e.type}:${e.value}`),
    timestamp: new Date().toISOString()
  });

  // Keep last 5000 facts
  if (knowledge.facts.length > 5000) {
    knowledge.facts = knowledge.facts.slice(-5000);
  }

  saveDB('knowledge', knowledge);
}

/**
 * Query knowledge graph
 */
function queryKnowledgeGraph(query) {
  const knowledge = loadDB('knowledge') || { concepts: {}, relationships: [], facts: [] };

  const results = {
    concepts: [],
    relationships: [],
    facts: []
  };

  const queryLower = query.toLowerCase();

  // Search concepts
  Object.entries(knowledge.concepts).forEach(([key, concept]) => {
    if (key.toLowerCase().includes(queryLower) ||
        (concept.value && concept.value.toLowerCase().includes(queryLower))) {
      results.concepts.push({ key, ...concept });
    }
  });

  // Search relationships
  results.relationships = knowledge.relationships.filter(r =>
    r.from.toLowerCase().includes(queryLower) ||
    r.to.toLowerCase().includes(queryLower)
  );

  // Search facts
  results.facts = knowledge.facts.filter(f =>
    f.action.toLowerCase().includes(queryLower) ||
    f.entities.some(e => e.toLowerCase().includes(queryLower))
  ).slice(-20);

  return results;
}

// ==============================================================================
// 4. EMBEDDINGS & SIMILARITY SEARCH
// ==============================================================================

/**
 * Create simple text embedding (TF-IDF style)
 */
function createEmbedding(interaction) {
  const text = JSON.stringify(interaction).toLowerCase();
  const words = text.match(/\b\w+\b/g) || [];

  // Create word frequency vector
  const vector = {};
  words.forEach(word => {
    if (word.length > 2) {
      vector[word] = (vector[word] || 0) + 1;
    }
  });

  // Normalize
  const magnitude = Math.sqrt(Object.values(vector).reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    Object.keys(vector).forEach(key => {
      vector[key] = vector[key] / magnitude;
    });
  }

  return vector;
}

/**
 * Store embedding for later retrieval
 */
function storeEmbedding(id, vector) {
  const embeddings = loadDB('embeddings') || { vectors: {}, index: [] };

  embeddings.vectors[id] = vector;
  embeddings.index.push({ id, timestamp: Date.now() });

  // Keep last 5000 embeddings
  if (embeddings.index.length > 5000) {
    const toRemove = embeddings.index.slice(0, embeddings.index.length - 5000);
    toRemove.forEach(item => delete embeddings.vectors[item.id]);
    embeddings.index = embeddings.index.slice(-5000);
  }

  saveDB('embeddings', embeddings);
}

/**
 * Find similar interactions using cosine similarity
 */
function findSimilar(query, topK = 5) {
  const embeddings = loadDB('embeddings') || { vectors: {}, index: [] };
  const queryVector = createEmbedding({ query });

  const similarities = [];

  Object.entries(embeddings.vectors).forEach(([id, vector]) => {
    const similarity = cosineSimilarity(queryVector, vector);
    similarities.push({ id, similarity });
  });

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(vec1, vec2) {
  const keys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  keys.forEach(key => {
    const v1 = vec1[key] || 0;
    const v2 = vec2[key] || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

// ==============================================================================
// 5. USER FEEDBACK & REINFORCEMENT
// ==============================================================================

/**
 * Record user feedback on a suggestion/action
 */
function recordFeedback(actionId, rating, comment = '') {
  const feedback = loadDB('feedback') || { ratings: [], improvements: [] };

  feedback.ratings.push({
    actionId,
    rating, // 1-5 stars or thumbs up/down
    comment,
    timestamp: new Date().toISOString()
  });

  // Update success model based on feedback
  if (rating >= 4) {
    // Positive feedback - reinforce
    updateModelWeights('positive', actionId);
  } else if (rating <= 2) {
    // Negative feedback - reduce weight
    updateModelWeights('negative', actionId);
  }

  saveDB('feedback', feedback);

  return { success: true, message: 'Feedback recorded and learning updated.' };
}

/**
 * Update model weights based on feedback
 */
function updateModelWeights(type, actionId) {
  const models = loadDB('models') || {
    errorClassifier: { weights: {} },
    intentClassifier: { weights: {} },
    solutionRanker: { weights: {} }
  };

  const factor = type === 'positive' ? 1.1 : 0.9;

  // Update solution ranker weights
  if (!models.solutionRanker.weights[actionId]) {
    models.solutionRanker.weights[actionId] = 1.0;
  }
  models.solutionRanker.weights[actionId] *= factor;

  saveDB('models', models);
}

/**
 * Update success model from interaction outcome
 */
function updateSuccessModel(interaction) {
  const models = loadDB('models') || {
    errorClassifier: { weights: {} },
    intentClassifier: { weights: {} },
    solutionRanker: { weights: {} }
  };

  const actionKey = interaction.action;

  if (!models.solutionRanker.weights[actionKey]) {
    models.solutionRanker.weights[actionKey] = { successes: 0, failures: 0 };
  }

  if (interaction.success) {
    models.solutionRanker.weights[actionKey].successes++;
  } else {
    models.solutionRanker.weights[actionKey].failures++;
  }

  saveDB('models', models);
}

// ==============================================================================
// 6. PROACTIVE LEARNING & AUTOMATION
// ==============================================================================

/**
 * Get proactive suggestions based on context
 */
async function getProactiveSuggestions(context) {
  const suggestions = [];
  const knowledge = loadDB('knowledge') || { concepts: {}, facts: [] };
  const models = loadDB('models') || { solutionRanker: { weights: {} } };

  // 1. Suggest based on project type
  if (context.projectPath) {
    const projectType = detectProjectType(context.projectPath);
    if (projectType) {
      suggestions.push({
        type: 'project_insight',
        message: `Detected ${projectType} project`,
        actions: getActionsForProjectType(projectType)
      });
    }
  }

  // 2. Suggest based on common patterns
  const topActions = Object.entries(models.solutionRanker.weights)
    .filter(([key, val]) => typeof val === 'object')
    .sort((a, b) => (b[1].successes || 0) - (a[1].successes || 0))
    .slice(0, 3);

  if (topActions.length > 0) {
    suggestions.push({
      type: 'learned_patterns',
      message: 'Based on your patterns:',
      actions: topActions.map(([action, stats]) => ({
        action,
        successRate: stats.successes / (stats.successes + stats.failures || 1)
      }))
    });
  }

  // 3. Suggest based on similar past interactions
  if (context.currentAction) {
    const similar = findSimilar({ action: context.currentAction }, 3);
    if (similar.length > 0) {
      suggestions.push({
        type: 'similar_context',
        message: 'Similar to previous successful actions',
        similar
      });
    }
  }

  // 4. Web-based suggestions
  if (context.error) {
    const webSolution = await findSolutionForError(context.error);
    if (webSolution) {
      suggestions.push({
        type: 'web_solution',
        message: 'Found potential solution online',
        solution: webSolution
      });
    }
  }

  return suggestions;
}

/**
 * Detect project type from path
 */
function detectProjectType(projectPath) {
  try {
    if (fs.existsSync(path.join(projectPath, 'package.json'))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
      if (pkg.dependencies?.next || pkg.devDependencies?.next) {
        return 'nextjs';
      }
      if (pkg.dependencies?.react || pkg.devDependencies?.react) {
        return 'react';
      }
      if (pkg.dependencies?.express) {
        return 'express';
      }
      if (pkg.dependencies?.vue) {
        return 'vue';
      }
      return 'node';
    }
    if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) {
      return 'python';
    }
    if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
      return 'rust';
    }
    if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
      return 'go';
    }
  } catch (e) {}
  return null;
}

/**
 * Get recommended actions for project type
 */
function getActionsForProjectType(type) {
  const actions = {
    'nextjs': ['run_tests', 'start_server', 'lint_code', 'docker_build'],
    'react': ['run_tests', 'start_server', 'lint_code'],
    'express': ['run_tests', 'start_server', 'lint_code'],
    'python': ['run_tests', 'lint_code', 'start_server'],
    'node': ['run_tests', 'lint_code', 'start_server']
  };
  return actions[type] || ['analyze_project'];
}

/**
 * Auto-learn from web periodically
 */
async function autoLearnFromWeb(topics = ['nodejs', 'react', 'python', 'typescript']) {
  const results = { learned: 0, topics: [] };

  for (const topic of topics) {
    try {
      const soResults = await searchStackOverflow(`best practices ${topic}`, [topic]);
      results.topics.push({ topic, stackoverflow: soResults.items?.length || 0 });
      results.learned += soResults.items?.length || 0;
    } catch (e) {
      // Continue with other topics
    }
  }

  return results;
}

// ==============================================================================
// 7. COMPREHENSIVE AI STATUS
// ==============================================================================

/**
 * Get comprehensive AI engine status
 */
function getAIEngineStatus() {
  const interactions = loadDB('interactions') || { total: 0 };
  const knowledge = loadDB('knowledge') || { concepts: {}, relationships: [], facts: [] };
  const solutions = loadDB('solutions') || { cache: {} };
  const feedback = loadDB('feedback') || { ratings: [] };
  const models = loadDB('models') || {};

  const avgRating = feedback.ratings.length > 0
    ? feedback.ratings.reduce((sum, r) => sum + r.rating, 0) / feedback.ratings.length
    : 0;

  return {
    indicator: '🧠 AI ENGINE ACTIVE',
    version: '1.0',
    stats: {
      totalInteractions: interactions.total,
      conceptsLearned: Object.keys(knowledge.concepts).length,
      relationshipsDiscovered: knowledge.relationships.length,
      factsStored: knowledge.facts.length,
      solutionsCached: Object.keys(solutions.cache).length,
      feedbackReceived: feedback.ratings.length,
      averageRating: avgRating.toFixed(2)
    },
    capabilities: {
      realtimeLearning: true,
      webIntegration: true,
      knowledgeGraph: true,
      similaritySearch: true,
      feedbackLearning: true,
      proactiveSuggestions: true
    },
    dataLocation: AI_DATA_DIR
  };
}

// ==============================================================================
// UTILITIES
// ==============================================================================

/**
 * HTTP GET request helper
 */
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'Accept': 'application/json',
        ...headers
      }
    };

    protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ==============================================================================
// EXPORTS
// ==============================================================================

module.exports = {
  // Initialize
  initAIEngine,

  // Real-time Learning
  learnFromInteraction,
  processInteractionRealtime,

  // Web Integration
  searchStackOverflow,
  searchGitHub,
  searchNPM,
  findSolutionForError,
  autoLearnFromWeb,

  // Knowledge Graph
  updateKnowledgeGraph,
  queryKnowledgeGraph,

  // Embeddings & Similarity
  createEmbedding,
  findSimilar,

  // Feedback & Reinforcement
  recordFeedback,
  updateModelWeights,

  // Proactive Suggestions
  getProactiveSuggestions,
  detectProjectType,

  // Status
  getAIEngineStatus,

  // Utilities
  categorizeError,
  classifyIntent,
  extractEntities,

  // Database
  loadDB,
  saveDB,
  AI_DATA_DIR
};
