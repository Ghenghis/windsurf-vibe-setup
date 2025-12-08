#!/usr/bin/env node
/**
 * Windsurf Autopilot - Embedding Tools v2.6
 *
 * Vector embeddings for semantic search using local models.
 * No external API calls required - runs entirely locally.
 *
 * Tools:
 * - embed_text: Generate embeddings from text
 * - semantic_search: Search codebase semantically
 * - index_project: Index a project for semantic search
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Data directory for embeddings
const DATA_DIR = process.platform === 'win32'
  ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot', 'embeddings')
  : path.join(process.env.HOME || '', '.windsurf-autopilot', 'embeddings');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory embedding cache
const embeddingCache = new Map();

// Project indexes
const projectIndexes = new Map();

/**
 * Simple TF-IDF based embedding (fallback when transformers not available)
 * This provides basic semantic search without external dependencies
 */
class SimpleTFIDF {
  constructor() {
    this.vocabulary = new Map();
    this.idf = new Map();
    this.documents = [];
  }

  // Tokenize text into words
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  // Build vocabulary from documents
  fit(documents) {
    this.documents = documents;
    const docFreq = new Map();

    // Count document frequencies
    for (const doc of documents) {
      const tokens = new Set(this.tokenize(doc));
      for (const token of tokens) {
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      }
    }

    // Calculate IDF
    const N = documents.length;
    for (const [token, freq] of docFreq) {
      this.idf.set(token, Math.log((N + 1) / (freq + 1)) + 1);
      this.vocabulary.set(token, this.vocabulary.size);
    }
  }

  // Transform text to TF-IDF vector
  transform(text) {
    const tokens = this.tokenize(text);
    const tf = new Map();

    // Calculate term frequency
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // Create sparse vector
    const vector = new Array(this.vocabulary.size).fill(0);
    for (const [token, freq] of tf) {
      if (this.vocabulary.has(token)) {
        const idx = this.vocabulary.get(token);
        const idf = this.idf.get(token) || 1;
        vector[idx] = (freq / tokens.length) * idf;
      }
    }

    // Normalize
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  // Cosine similarity between two vectors
  cosineSimilarity(v1, v2) {
    if (v1.length !== v2.length) {
      return 0;
    }
    let dot = 0, norm1 = 0, norm2 = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }
    const denom = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denom > 0 ? dot / denom : 0;
  }
}

// Global TF-IDF model
let tfidfModel = null;

/**
 * Embedding Tools Export
 */
const embeddingTools = {

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: embed_text
  // ═══════════════════════════════════════════════════════════════════════════
  embed_text: {
    name: 'embed_text',
    description: 'Generate vector embeddings from text. Uses local TF-IDF by default, or transformer models if available.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } }
          ],
          description: 'Text or array of texts to embed'
        },
        model: {
          type: 'string',
          description: 'Model to use (default: tfidf, or specify transformer model)',
          default: 'tfidf'
        },
        cache: {
          type: 'boolean',
          description: 'Cache embeddings for reuse',
          default: true
        }
      },
      required: ['text']
    },
    handler: async (args) => {
      const texts = Array.isArray(args.text) ? args.text : [args.text];
      const useCache = args.cache !== false;

      try {
        const embeddings = [];
        const model = args.model || 'tfidf';

        for (const text of texts) {
          // Check cache
          const cacheKey = crypto.createHash('md5').update(text).digest('hex');
          if (useCache && embeddingCache.has(cacheKey)) {
            embeddings.push(embeddingCache.get(cacheKey));
            continue;
          }

          let embedding;

          if (model === 'tfidf') {
            // Use simple TF-IDF
            if (!tfidfModel) {
              tfidfModel = new SimpleTFIDF();
              // Fit on the input text (will be re-fit when indexing projects)
              tfidfModel.fit(texts);
            }
            embedding = tfidfModel.transform(text);

          } else {
            // Try to use transformers.js
            try {
              const { pipeline } = require('@xenova/transformers');
              const extractor = await pipeline('feature-extraction', model);
              const output = await extractor(text, { pooling: 'mean', normalize: true });
              embedding = Array.from(output.data);
            } catch (e) {
              // Fallback to TF-IDF
              if (!tfidfModel) {
                tfidfModel = new SimpleTFIDF();
                tfidfModel.fit(texts);
              }
              embedding = tfidfModel.transform(text);
            }
          }

          // Cache the embedding
          if (useCache) {
            embeddingCache.set(cacheKey, embedding);
          }

          embeddings.push(embedding);
        }

        return {
          success: true,
          embeddings,
          dimensions: embeddings[0]?.length || 0,
          count: embeddings.length,
          model: model,
          cached: useCache
        };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: semantic_search
  // ═══════════════════════════════════════════════════════════════════════════
  semantic_search: {
    name: 'semantic_search',
    description: 'Search codebase or documents using semantic similarity. Requires index_project to be run first.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        projectPath: {
          type: 'string',
          description: 'Project path to search (must be indexed first)'
        },
        topK: {
          type: 'number',
          description: 'Number of results to return',
          default: 10
        },
        threshold: {
          type: 'number',
          description: 'Minimum similarity score (0-1)',
          default: 0.3
        },
        fileTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by file extensions (e.g., [".js", ".py"])'
        }
      },
      required: ['query', 'projectPath']
    },
    handler: async (args) => {
      const projectPath = args.projectPath;
      const indexId = crypto.createHash('md5').update(projectPath).digest('hex');

      // Check if project is indexed
      let index = projectIndexes.get(indexId);
      if (!index) {
        // Try to load from disk
        const indexPath = path.join(DATA_DIR, `index_${indexId}.json`);
        if (fs.existsSync(indexPath)) {
          try {
            index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
            projectIndexes.set(indexId, index);
          } catch (e) {
            return {
              success: false,
              error: 'Project not indexed. Run index_project first.',
              suggestion: `Use index_project with path: ${projectPath}`
            };
          }
        } else {
          return {
            success: false,
            error: 'Project not indexed. Run index_project first.',
            suggestion: `Use index_project with path: ${projectPath}`
          };
        }
      }

      try {
        // Ensure TF-IDF model is fitted with index documents
        if (!tfidfModel || tfidfModel.documents.length === 0) {
          tfidfModel = new SimpleTFIDF();
          tfidfModel.fit(index.chunks.map(c => c.content));
        }

        // Embed the query
        const queryEmbedding = tfidfModel.transform(args.query);

        // Calculate similarities
        const results = [];
        for (const chunk of index.chunks) {
          // Filter by file type if specified
          if (args.fileTypes && args.fileTypes.length > 0) {
            const ext = path.extname(chunk.file);
            if (!args.fileTypes.includes(ext)) {
              continue;
            }
          }

          const similarity = tfidfModel.cosineSimilarity(queryEmbedding, chunk.embedding);

          if (similarity >= (args.threshold || 0.3)) {
            results.push({
              file: chunk.file,
              line: chunk.line,
              content: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''),
              score: Math.round(similarity * 1000) / 1000
            });
          }
        }

        // Sort by score and limit
        results.sort((a, b) => b.score - a.score);
        const topResults = results.slice(0, args.topK || 10);

        return {
          success: true,
          query: args.query,
          results: topResults,
          totalMatches: results.length,
          returned: topResults.length,
          threshold: args.threshold || 0.3
        };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL: index_project
  // ═══════════════════════════════════════════════════════════════════════════
  index_project: {
    name: 'index_project',
    description: 'Index a project for semantic search. Creates embeddings for all code files.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Project path to index'
        },
        fileTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'File extensions to index (default: common code files)',
          default: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.md', '.txt']
        },
        chunkSize: {
          type: 'number',
          description: 'Number of lines per chunk',
          default: 20
        },
        incremental: {
          type: 'boolean',
          description: 'Only index changed files',
          default: true
        },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Patterns to exclude (e.g., node_modules)',
          default: ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next']
        }
      },
      required: ['path']
    },
    handler: async (args) => {
      const projectPath = args.path;

      if (!fs.existsSync(projectPath)) {
        return { success: false, error: `Path not found: ${projectPath}` };
      }

      try {
        const fileTypes = args.fileTypes || ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.md', '.txt'];
        const excludePatterns = args.excludePatterns || ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next'];
        const chunkSize = args.chunkSize || 20;

        const indexId = crypto.createHash('md5').update(projectPath).digest('hex');
        const indexPath = path.join(DATA_DIR, `index_${indexId}.json`);

        // Load existing index for incremental updates
        let existingIndex = null;
        const existingChunks = new Map();
        if (args.incremental !== false && fs.existsSync(indexPath)) {
          try {
            existingIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
            for (const chunk of existingIndex.chunks) {
              existingChunks.set(`${chunk.file}:${chunk.line}:${chunk.hash}`, chunk);
            }
          } catch (e) {
            // Ignore, will reindex
          }
        }

        // Collect all files
        const files = [];
        const collectFiles = (dir) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(projectPath, fullPath);

            // Check exclusions
            if (excludePatterns.some(p => relativePath.includes(p))) {
              continue;
            }

            if (entry.isDirectory()) {
              collectFiles(fullPath);
            } else if (entry.isFile()) {
              const ext = path.extname(entry.name);
              if (fileTypes.includes(ext)) {
                files.push({ fullPath, relativePath });
              }
            }
          }
        };

        collectFiles(projectPath);

        // Create chunks and embeddings
        const chunks = [];
        const allContents = [];

        for (const file of files) {
          try {
            const content = fs.readFileSync(file.fullPath, 'utf8');
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i += chunkSize) {
              const chunkLines = lines.slice(i, i + chunkSize);
              const chunkContent = chunkLines.join('\n');

              if (chunkContent.trim().length < 10) {
                continue;
              } // Skip nearly empty chunks

              const hash = crypto.createHash('md5').update(chunkContent).digest('hex').substring(0, 8);
              const chunkKey = `${file.relativePath}:${i + 1}:${hash}`;

              // Check if we can reuse existing embedding
              if (existingChunks.has(chunkKey)) {
                chunks.push(existingChunks.get(chunkKey));
              } else {
                allContents.push(chunkContent);
                chunks.push({
                  file: file.relativePath,
                  line: i + 1,
                  content: chunkContent,
                  hash,
                  embedding: null // Will be filled after TF-IDF fit
                });
              }
            }
          } catch (e) {
            // Skip files that can't be read
          }
        }

        // Fit TF-IDF model on all content
        if (allContents.length > 0) {
          tfidfModel = new SimpleTFIDF();
          tfidfModel.fit(allContents);

          // Generate embeddings for new chunks
          for (const chunk of chunks) {
            if (!chunk.embedding) {
              chunk.embedding = tfidfModel.transform(chunk.content);
            }
          }
        }

        // Create index
        const index = {
          projectPath,
          indexedAt: new Date().toISOString(),
          fileCount: files.length,
          chunkCount: chunks.length,
          fileTypes,
          chunks
        };

        // Save index
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
        projectIndexes.set(indexId, index);

        return {
          success: true,
          projectPath,
          indexPath,
          filesIndexed: files.length,
          chunksCreated: chunks.length,
          indexSize: formatBytes(fs.statSync(indexPath).size),
          message: `Indexed ${files.length} files with ${chunks.length} searchable chunks`
        };

      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  // Get all tool definitions for registration
  getToolDefinitions: function () {
    return [
      { name: this.embed_text.name, description: this.embed_text.description, inputSchema: this.embed_text.inputSchema },
      { name: this.semantic_search.name, description: this.semantic_search.description, inputSchema: this.semantic_search.inputSchema },
      { name: this.index_project.name, description: this.index_project.description, inputSchema: this.index_project.inputSchema }
    ];
  },

  // Get handler for a tool
  getHandler: function (toolName) {
    const tool = this[toolName];
    return tool ? tool.handler : null;
  }
};

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = embeddingTools;
