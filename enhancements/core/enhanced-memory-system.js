/**
 * Enhanced Memory System - v5.0
 * Multi-level memory hierarchy with semantic search
 * L1: Working Memory, L2: Short-term, L3: Episodic, L4: Semantic, L5: Long-term
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class EnhancedMemorySystem extends EventEmitter {
  constructor(options = {}) {
    super();

    this.memoryDir = options.memoryDir || path.join(process.cwd(), 'memory');
    this.maxMemorySize = options.maxMemorySize || {
      working: 10 * 1024 * 1024, // 10MB
      shortTerm: 100 * 1024 * 1024, // 100MB
      episodic: 500 * 1024 * 1024, // 500MB
      semantic: 1024 * 1024 * 1024, // 1GB
      longTerm: 10 * 1024 * 1024 * 1024, // 10GB
    };

    // Memory levels
    this.workingMemory = new Map(); // L1: Current task
    this.shortTermMemory = new Map(); // L2: Current session
    this.episodicMemory = []; // L3: Event sequences
    this.semanticMemory = new Map(); // L4: Knowledge graph
    this.longTermMemory = new Map(); // L5: Everything learned

    // Memory indexes for fast retrieval
    this.memoryIndex = new Map();
    this.embeddings = new Map();

    // Consolidation settings
    this.consolidationInterval = options.consolidationInterval || 3600000; // 1 hour
    this.consolidationTimer = null;

    this.isInitialized = false;
  }

  /**
   * Initialize memory system
   */
  async initialize() {
    try {
      // Create memory directories
      await fs.mkdir(this.memoryDir, { recursive: true });
      await fs.mkdir(path.join(this.memoryDir, 'working'), { recursive: true });
      await fs.mkdir(path.join(this.memoryDir, 'short-term'), { recursive: true });
      await fs.mkdir(path.join(this.memoryDir, 'episodic'), { recursive: true });
      await fs.mkdir(path.join(this.memoryDir, 'semantic'), { recursive: true });
      await fs.mkdir(path.join(this.memoryDir, 'long-term'), { recursive: true });

      // Load existing memories
      await this.loadMemories();

      // Start consolidation timer
      this.startConsolidation();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Enhanced Memory System initialized');
      console.log(`   - Memory directory: ${this.memoryDir}`);
      console.log(`   - Memories loaded: ${this.getTotalMemories()}`);
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Memory System:', error);
      throw error;
    }
  }

  /**
   * Remember information
   */
  async remember(key, value, type = 'working', metadata = {}) {
    try {
      const memory = {
        id: crypto.randomBytes(16).toString('hex'),
        key,
        value,
        type,
        timestamp: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        importance: metadata.importance || this.calculateImportance(value),
        context: metadata.context || this.getCurrentContext(),
        embedding: await this.generateEmbedding(value),
        metadata,
      };

      // Store in appropriate memory level
      switch (type) {
        case 'working':
          this.workingMemory.set(key, memory);
          await this.persistMemory('working', memory);
          break;

        case 'short-term':
          this.shortTermMemory.set(key, memory);
          await this.persistMemory('short-term', memory);
          break;

        case 'episodic':
          this.episodicMemory.push(memory);
          await this.persistMemory('episodic', memory);
          // Consolidate if needed
          if (this.episodicMemory.length > 1000) {
            await this.consolidateEpisodic();
          }
          break;

        case 'semantic':
          await this.updateKnowledgeGraph(memory);
          break;

        case 'long-term':
          this.longTermMemory.set(key, memory);
          await this.persistMemory('long-term', memory);
          break;

        default:
          this.workingMemory.set(key, memory);
      }

      // Update index
      this.updateIndex(memory);

      // Store embedding for similarity search
      if (memory.embedding) {
        this.embeddings.set(memory.id, memory.embedding);
      }

      this.emit('remembered', { key, type, id: memory.id });

      return memory;
    } catch (error) {
      console.error(`❌ Failed to remember ${key}:`, error);
      throw error;
    }
  }

  /**
   * Recall information
   */
  async recall(query, type = 'all', options = {}) {
    try {
      const results = [];
      const maxResults = options.maxResults || 10;
      const threshold = options.threshold || 0.7;

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Search in specified memory types
      if (type === 'all' || type === 'working') {
        for (const [key, memory] of this.workingMemory) {
          if (this.isRelevant(query, memory, queryEmbedding, threshold)) {
            results.push({ ...memory, source: 'working' });
          }
        }
      }

      if (type === 'all' || type === 'short-term') {
        for (const [key, memory] of this.shortTermMemory) {
          if (this.isRelevant(query, memory, queryEmbedding, threshold)) {
            results.push({ ...memory, source: 'short-term' });
          }
        }
      }

      if (type === 'all' || type === 'episodic') {
        const relevantEpisodes = this.findRelevantEpisodes(query, queryEmbedding, threshold);
        results.push(...relevantEpisodes.map(e => ({ ...e, source: 'episodic' })));
      }

      if (type === 'all' || type === 'semantic') {
        const knowledgeResults = await this.searchKnowledgeGraph(query, queryEmbedding);
        results.push(...knowledgeResults.map(k => ({ ...k, source: 'semantic' })));
      }

      if (type === 'all' || type === 'long-term') {
        for (const [key, memory] of this.longTermMemory) {
          if (this.isRelevant(query, memory, queryEmbedding, threshold)) {
            results.push({ ...memory, source: 'long-term' });
          }
        }
      }

      // Rank by relevance
      const ranked = this.rankByRelevance(results, query, queryEmbedding);

      // Update access counts
      for (const memory of ranked.slice(0, maxResults)) {
        memory.accessCount++;
        memory.lastAccessed = Date.now();
      }

      this.emit('recalled', { query, resultCount: ranked.length });

      return ranked.slice(0, maxResults);
    } catch (error) {
      console.error(`❌ Failed to recall ${query}:`, error);
      throw error;
    }
  }

  /**
   * Consolidate memories
   */
  async consolidateMemory() {
    try {
      console.log('🧠 Starting memory consolidation...');

      // Move important working memory to short-term
      for (const [key, memory] of this.workingMemory) {
        if (this.isImportant(memory)) {
          this.shortTermMemory.set(key, memory);
          await this.persistMemory('short-term', memory);
        }
      }

      // Move frequently accessed short-term to long-term
      for (const [key, memory] of this.shortTermMemory) {
        if (memory.accessCount > 5 || memory.importance > 0.8) {
          this.longTermMemory.set(key, memory);
          await this.persistMemory('long-term', memory);
        }
      }

      // Extract patterns from episodic memory
      const patterns = await this.extractPatterns(this.episodicMemory);
      for (const pattern of patterns) {
        await this.updateKnowledgeGraph(pattern);
      }

      // Clean up old memories
      await this.pruneOldMemories();

      this.emit('consolidated', {
        working: this.workingMemory.size,
        shortTerm: this.shortTermMemory.size,
        episodic: this.episodicMemory.length,
        semantic: this.semanticMemory.size,
        longTerm: this.longTermMemory.size,
      });

      console.log('✅ Memory consolidation complete');
    } catch (error) {
      console.error('❌ Failed to consolidate memory:', error);
    }
  }

  /**
   * Generate embedding for similarity search
   */
  async generateEmbedding(text) {
    // Simplified embedding - in production, use a real embedding model
    const hash = crypto.createHash('sha256').update(String(text)).digest();
    const embedding = [];

    for (let i = 0; i < 32; i++) {
      embedding.push(hash[i] / 255);
    }

    return embedding;
  }

  /**
   * Calculate similarity between embeddings
   */
  calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return 0;

    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Check if memory is relevant
   */
  isRelevant(query, memory, queryEmbedding, threshold) {
    // Text similarity
    const queryLower = String(query).toLowerCase();
    const keyLower = String(memory.key).toLowerCase();
    const valueLower = String(memory.value).toLowerCase();

    if (keyLower.includes(queryLower) || valueLower.includes(queryLower)) {
      return true;
    }

    // Embedding similarity
    if (queryEmbedding && memory.embedding) {
      const similarity = this.calculateSimilarity(queryEmbedding, memory.embedding);
      if (similarity >= threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Rank results by relevance
   */
  rankByRelevance(results, query, queryEmbedding) {
    return results.sort((a, b) => {
      // Calculate scores
      const scoreA = this.calculateRelevanceScore(a, query, queryEmbedding);
      const scoreB = this.calculateRelevanceScore(b, query, queryEmbedding);

      return scoreB - scoreA;
    });
  }

  /**
   * Calculate relevance score
   */
  calculateRelevanceScore(memory, query, queryEmbedding) {
    let score = 0;

    // Recency factor
    const age = Date.now() - memory.timestamp;
    const recencyScore = Math.exp(-age / (7 * 24 * 60 * 60 * 1000)); // Decay over 7 days
    score += recencyScore * 0.2;

    // Access frequency factor
    const frequencyScore = Math.min(memory.accessCount / 10, 1);
    score += frequencyScore * 0.2;

    // Importance factor
    score += memory.importance * 0.3;

    // Similarity factor
    if (queryEmbedding && memory.embedding) {
      const similarity = this.calculateSimilarity(queryEmbedding, memory.embedding);
      score += similarity * 0.3;
    }

    return score;
  }

  /**
   * Calculate importance of memory
   */
  calculateImportance(value) {
    // Simple heuristic - can be enhanced
    const length = String(value).length;
    const hasCode = /```|function|class|const|let|var/.test(String(value));
    const hasError = /error|exception|failed|bug/.test(String(value).toLowerCase());
    const hasSuccess = /success|complete|fixed|resolved/.test(String(value).toLowerCase());

    let importance = 0.5;

    if (length > 1000) importance += 0.1;
    if (hasCode) importance += 0.2;
    if (hasError) importance += 0.15;
    if (hasSuccess) importance += 0.15;

    return Math.min(importance, 1);
  }

  /**
   * Check if memory is important
   */
  isImportant(memory) {
    return (
      memory.importance > 0.7 || memory.accessCount > 3 || Date.now() - memory.lastAccessed < 600000
    ); // Accessed in last 10 minutes
  }

  /**
   * Get current context
   */
  getCurrentContext() {
    // Simplified context - can be enhanced
    return {
      timestamp: Date.now(),
      workingMemorySize: this.workingMemory.size,
      activeTask: null, // Would be set by task manager
    };
  }

  /**
   * Update knowledge graph (semantic memory)
   */
  async updateKnowledgeGraph(memory) {
    // Extract entities and relationships
    const entities = this.extractEntities(memory.value);
    const relationships = this.extractRelationships(memory.value);

    // Store in semantic memory
    for (const entity of entities) {
      if (!this.semanticMemory.has(entity)) {
        this.semanticMemory.set(entity, {
          type: 'entity',
          name: entity,
          connections: [],
          memories: [],
        });
      }

      const node = this.semanticMemory.get(entity);
      node.memories.push(memory.id);
    }

    // Store relationships
    for (const rel of relationships) {
      const relKey = `${rel.from}-${rel.type}-${rel.to}`;
      if (!this.semanticMemory.has(relKey)) {
        this.semanticMemory.set(relKey, {
          type: 'relationship',
          ...rel,
          memories: [],
        });
      }

      const relNode = this.semanticMemory.get(relKey);
      relNode.memories.push(memory.id);
    }

    await this.persistMemory('semantic', memory);
  }

  /**
   * Extract entities from text (simplified)
   */
  extractEntities(text) {
    const entities = [];
    const textStr = String(text);

    // Extract function names
    const funcMatches = textStr.match(/function\s+(\w+)/g) || [];
    entities.push(...funcMatches.map(m => m.split(' ')[1]));

    // Extract class names
    const classMatches = textStr.match(/class\s+(\w+)/g) || [];
    entities.push(...classMatches.map(m => m.split(' ')[1]));

    // Extract file names
    const fileMatches = textStr.match(/[\w-]+\.(js|json|md|css|html)/g) || [];
    entities.push(...fileMatches);

    return [...new Set(entities)];
  }

  /**
   * Extract relationships from text (simplified)
   */
  extractRelationships(text) {
    const relationships = [];
    const textStr = String(text);

    // Extract imports/requires
    const importMatches = textStr.match(/require\(['"](.+?)['"]\)/g) || [];
    for (const match of importMatches) {
      const module = match.match(/require\(['"](.+?)['"]\)/)[1];
      relationships.push({
        from: 'current',
        to: module,
        type: 'imports',
      });
    }

    return relationships;
  }

  /**
   * Find relevant episodes
   */
  findRelevantEpisodes(query, queryEmbedding, threshold) {
    const relevant = [];

    for (const episode of this.episodicMemory) {
      if (this.isRelevant(query, episode, queryEmbedding, threshold)) {
        relevant.push(episode);
      }
    }

    return relevant;
  }

  /**
   * Search knowledge graph
   */
  async searchKnowledgeGraph(query, queryEmbedding) {
    const results = [];

    for (const [key, node] of this.semanticMemory) {
      if (node.type === 'entity' && key.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          key,
          value: node,
          type: 'semantic',
          importance: 0.8,
        });
      }
    }

    return results;
  }

  /**
   * Extract patterns from episodic memory
   */
  async extractPatterns(episodes) {
    const patterns = [];

    // Group episodes by similarity
    const groups = [];

    for (const episode of episodes) {
      let added = false;

      for (const group of groups) {
        if (this.calculateSimilarity(episode.embedding, group[0].embedding) > 0.8) {
          group.push(episode);
          added = true;
          break;
        }
      }

      if (!added) {
        groups.push([episode]);
      }
    }

    // Extract pattern from each group
    for (const group of groups) {
      if (group.length >= 3) {
        patterns.push({
          key: `pattern-${Date.now()}`,
          value: {
            type: 'pattern',
            instances: group.length,
            examples: group.slice(0, 3),
          },
          type: 'semantic',
          importance: Math.min(group.length / 10, 1),
        });
      }
    }

    return patterns;
  }

  /**
   * Consolidate episodic memory
   */
  async consolidateEpisodic() {
    // Keep only recent and important episodes
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days

    this.episodicMemory = this.episodicMemory.filter(
      episode => episode.timestamp > cutoff || episode.importance > 0.8
    );
  }

  /**
   * Update memory index
   */
  updateIndex(memory) {
    // Index by key words
    const words = String(memory.key)
      .split(/\s+/)
      .concat(String(memory.value).split(/\s+/).slice(0, 10));

    for (const word of words) {
      const lower = word.toLowerCase();
      if (!this.memoryIndex.has(lower)) {
        this.memoryIndex.set(lower, []);
      }
      this.memoryIndex.get(lower).push(memory.id);
    }
  }

  /**
   * Persist memory to disk
   */
  async persistMemory(type, memory) {
    try {
      const dir = path.join(this.memoryDir, type);
      const file = path.join(dir, `${memory.id}.json`);

      await fs.writeFile(file, JSON.stringify(memory, null, 2));
    } catch (error) {
      console.error(`⚠️ Failed to persist memory:`, error.message);
    }
  }

  /**
   * Load memories from disk
   */
  async loadMemories() {
    const types = ['working', 'short-term', 'episodic', 'semantic', 'long-term'];

    for (const type of types) {
      try {
        const dir = path.join(this.memoryDir, type);
        const files = await fs.readdir(dir);

        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const data = await fs.readFile(path.join(dir, file), 'utf8');
              const memory = JSON.parse(data);

              switch (type) {
                case 'working':
                  this.workingMemory.set(memory.key, memory);
                  break;
                case 'short-term':
                  this.shortTermMemory.set(memory.key, memory);
                  break;
                case 'episodic':
                  this.episodicMemory.push(memory);
                  break;
                case 'semantic':
                  this.semanticMemory.set(memory.key, memory);
                  break;
                case 'long-term':
                  this.longTermMemory.set(memory.key, memory);
                  break;
              }

              if (memory.embedding) {
                this.embeddings.set(memory.id, memory.embedding);
              }
            } catch (error) {
              console.warn(`⚠️ Failed to load memory ${file}:`, error.message);
            }
          }
        }
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`⚠️ Failed to load ${type} memories:`, error.message);
        }
      }
    }
  }

  /**
   * Prune old memories
   */
  async pruneOldMemories() {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days

    // Clear old working memory
    this.workingMemory.clear();

    // Prune short-term memory
    for (const [key, memory] of this.shortTermMemory) {
      if (memory.timestamp < cutoff && memory.importance < 0.5) {
        this.shortTermMemory.delete(key);
      }
    }
  }

  /**
   * Start memory consolidation timer
   */
  startConsolidation() {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
    }

    this.consolidationTimer = setInterval(
      () => this.consolidateMemory(),
      this.consolidationInterval
    );

    console.log(`⏰ Memory consolidation enabled (every ${this.consolidationInterval / 1000}s)`);
  }

  /**
   * Create agent-specific memory
   */
  createAgentMemory(agentId) {
    return {
      remember: (key, value, metadata) =>
        this.remember(`agent-${agentId}-${key}`, value, 'working', metadata),
      recall: query => this.recall(query, 'all', { maxResults: 5 }),
    };
  }

  /**
   * Get total memory count
   */
  getTotalMemories() {
    return (
      this.workingMemory.size +
      this.shortTermMemory.size +
      this.episodicMemory.length +
      this.semanticMemory.size +
      this.longTermMemory.size
    );
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      memoryDir: this.memoryDir,
      levels: {
        working: this.workingMemory.size,
        shortTerm: this.shortTermMemory.size,
        episodic: this.episodicMemory.length,
        semantic: this.semanticMemory.size,
        longTerm: this.longTermMemory.size,
      },
      total: this.getTotalMemories(),
      embeddings: this.embeddings.size,
      index: this.memoryIndex.size,
      consolidation: this.consolidationTimer !== null,
    };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    try {
      // Final consolidation
      await this.consolidateMemory();

      // Stop consolidation timer
      if (this.consolidationTimer) {
        clearInterval(this.consolidationTimer);
        this.consolidationTimer = null;
      }

      this.emit('shutdown');
      console.log('✅ Enhanced Memory System shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

module.exports = EnhancedMemorySystem;
