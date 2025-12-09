const fetch = require('node-fetch');
/**
 * ============================================================================
 * WINDSURF VIBE SETUP - MEM0 INTEGRATION v4.1
 * ============================================================================
 * Persistent AI memory layer using Mem0 for context continuity
 * https://github.com/mem0ai/mem0
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEMORY_TYPES = {
  CONVERSATION: 'conversation',
  PREFERENCE: 'preference',
  KNOWLEDGE: 'knowledge',
  TASK: 'task',
  CODE: 'code',
  RELATIONSHIP: 'relationship',
};

class LocalMem0 {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.join(process.cwd(), '.windsurf-memory');
    this.memories = new Map();
    this.relationships = new Map();
    this.index = new Map();

    this.config = {
      maxMemories: options.maxMemories || 10000,
      embedModel: options.embedModel || 'nomic-embed-text',
      ollamaUrl: options.ollamaUrl || 'http://localhost:11434',
    };

    this.stats = { totalMemories: 0, totalRelationships: 0, lastSync: null };
    this.initialized = false;
  }

  async initialize() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
    await this.loadFromDisk();
    this.initialized = true;
    console.log(`🧠 Mem0 initialized with ${this.memories.size} memories`);
    return this;
  }

  async add(content, options = {}) {
    const memoryId = options.id || this.generateId();
    const timestamp = new Date().toISOString();

    const memory = {
      id: memoryId,
      content,
      type: options.type || MEMORY_TYPES.KNOWLEDGE,
      metadata: options.metadata || {},
      userId: options.userId || 'default',
      agentId: options.agentId || null,
      tags: options.tags || [],
      embedding: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      accessCount: 0,
      lastAccessed: null,
    };

    if (this.config.embedModel) {
      try {
        memory.embedding = await this.generateEmbedding(content);
      } catch (error) {
        console.warn('Could not generate embedding:', error.message);
      }
    }

    this.memories.set(memoryId, memory);
    this.indexMemory(memory);
    this.stats.totalMemories++;
    this.saveToDisk();

    return memory;
  }

  async search(query, options = {}) {
    const limit = options.limit || 10;
    const userId = options.userId || 'default';
    const type = options.type;

    let results = [];

    if (this.config.embedModel) {
      try {
        const queryEmbedding = await this.generateEmbedding(query);
        results = this.semanticSearch(queryEmbedding, limit * 2);
      } catch {
        results = this.keywordSearch(query, limit * 2);
      }
    } else {
      results = this.keywordSearch(query, limit * 2);
    }

    results = results.filter(m => {
      if (userId && m.userId !== userId) return false;
      if (type && m.type !== type) return false;
      return true;
    });

    results.slice(0, limit).forEach(m => {
      m.accessCount++;
      m.lastAccessed = new Date().toISOString();
    });

    return results.slice(0, limit);
  }

  async generateEmbedding(text) {
    try {
      const response = await fetch(`${this.config.ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.config.embedModel, prompt: text }),
      });
      const data = await response.json();
      return data.embedding;
    } catch (error) {
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  semanticSearch(queryEmbedding, limit) {
    const scored = [];
    for (const [id, memory] of this.memories) {
      if (memory.embedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding);
        scored.push({ ...memory, similarity });
      }
    }
    return scored.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dotProduct = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  keywordSearch(query, limit) {
    const keywords = query.toLowerCase().split(/\s+/);
    const scored = [];

    for (const [id, memory] of this.memories) {
      const content = memory.content.toLowerCase();
      const score = keywords.reduce((acc, kw) => acc + (content.includes(kw) ? 1 : 0), 0);
      if (score > 0) scored.push({ ...memory, similarity: score / keywords.length });
    }

    return scored.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  indexMemory(memory) {
    const words = memory.content.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (!this.index.has(word)) this.index.set(word, new Set());
      this.index.get(word).add(memory.id);
    });

    memory.tags.forEach(tag => {
      if (!this.index.has(`tag:${tag}`)) this.index.set(`tag:${tag}`, new Set());
      this.index.get(`tag:${tag}`).add(memory.id);
    });
  }

  async get(memoryId) {
    return this.memories.get(memoryId) || null;
  }

  async update(memoryId, updates) {
    const memory = this.memories.get(memoryId);
    if (!memory) return null;

    Object.assign(memory, updates, { updatedAt: new Date().toISOString() });

    if (updates.content && this.config.embedModel) {
      try {
        memory.embedding = await this.generateEmbedding(updates.content);
      } catch {}
    }

    this.saveToDisk();
    return memory;
  }

  async delete(memoryId) {
    const memory = this.memories.get(memoryId);
    if (!memory) return false;

    this.memories.delete(memoryId);
    this.stats.totalMemories--;
    this.saveToDisk();
    return true;
  }

  async addRelationship(fromId, toId, type, metadata = {}) {
    const relId = `${fromId}->${toId}:${type}`;
    this.relationships.set(relId, {
      id: relId,
      fromId,
      toId,
      type,
      metadata,
      createdAt: new Date().toISOString(),
    });
    this.stats.totalRelationships++;
    return this.relationships.get(relId);
  }

  async getRelated(memoryId, type = null) {
    const related = [];
    for (const [id, rel] of this.relationships) {
      if (rel.fromId === memoryId || rel.toId === memoryId) {
        if (!type || rel.type === type) {
          const otherId = rel.fromId === memoryId ? rel.toId : rel.fromId;
          const otherMemory = this.memories.get(otherId);
          if (otherMemory) related.push({ relationship: rel, memory: otherMemory });
        }
      }
    }
    return related;
  }

  generateId() {
    return crypto.randomBytes(16).toString('hex');
  }

  async saveToDisk() {
    const data = {
      memories: Array.from(this.memories.entries()),
      relationships: Array.from(this.relationships.entries()),
      stats: this.stats,
      savedAt: new Date().toISOString(),
    };

    const filepath = path.join(this.storagePath, 'memories.json');
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    this.stats.lastSync = new Date().toISOString();
  }

  async loadFromDisk() {
    const filepath = path.join(this.storagePath, 'memories.json');
    if (fs.existsSync(filepath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        this.memories = new Map(data.memories || []);
        this.relationships = new Map(data.relationships || []);
        this.stats = data.stats || this.stats;

        // Rebuild index
        for (const [id, memory] of this.memories) {
          this.indexMemory(memory);
        }
      } catch (error) {
        console.warn('Could not load memories:', error.message);
      }
    }
  }

  getStats() {
    return {
      ...this.stats,
      indexSize: this.index.size,
      memoriesCount: this.memories.size,
      relationshipsCount: this.relationships.size,
    };
  }
}

const mem0 = new LocalMem0();
module.exports = { LocalMem0, mem0, MEMORY_TYPES };
