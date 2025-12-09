/**
 * ============================================================================
 * Free-Local Tools for MCP Server Integration
 * ============================================================================
 * These tools expose the free-local AI stack to the MCP server,
 * enabling seamless integration with the existing 250+ tools.
 *
 * Tools:
 * - local_llm_query: Query local Ollama models
 * - local_llm_select: Smart model selection
 * - local_vector_store: Store embeddings in ChromaDB
 * - local_vector_search: Search ChromaDB
 * - local_web_search: Search via SearXNG
 * - local_service_status: Check service health
 * - local_service_start: Start services
 * - local_agent_run: Execute CrewAI agent crews
 * ============================================================================
 */

const http = require('http');
const { execSync, spawn } = require('child_process');
const path = require('path');

// Configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const CHROMADB_HOST = process.env.CHROMADB_HOST || 'http://localhost:8000';
const SEARXNG_HOST = process.env.SEARXNG_HOST || 'http://localhost:8080';

// HTTP helpers
async function httpGet(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.get(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        timeout,
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

async function httpPost(url, body, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(body);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        timeout,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.write(postData);
    req.end();
  });
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const FREE_LOCAL_TOOLS = [
  {
    name: 'local_llm_query',
    description:
      'Query a local Ollama LLM. Use for code generation, explanations, debugging, etc. Completely free, runs on your GPU.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The prompt/question to send to the LLM' },
        model: {
          type: 'string',
          description: 'Model to use (default: qwen2.5-coder:32b)',
          default: 'qwen2.5-coder:32b',
        },
        temperature: { type: 'number', description: 'Temperature (0-1)', default: 0.7 },
        maxTokens: { type: 'number', description: 'Maximum tokens in response', default: 4096 },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'local_llm_select',
    description:
      'Get the optimal local model recommendation for a given task type (coding, reasoning, embedding, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        taskType: {
          type: 'string',
          description:
            'Task type: coding, debugging, refactoring, reasoning, embedding, documentation, testing',
          enum: [
            'coding',
            'debugging',
            'refactoring',
            'reasoning',
            'embedding',
            'documentation',
            'testing',
            'research',
          ],
        },
        preferSpeed: {
          type: 'boolean',
          description: 'Prefer faster model over quality',
          default: false,
        },
      },
      required: ['taskType'],
    },
  },
  {
    name: 'local_vector_store',
    description:
      'Store text embeddings in local ChromaDB for RAG. Use for building knowledge bases, code search, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name' },
        documents: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of text documents to store',
        },
        metadata: {
          type: 'array',
          items: { type: 'object' },
          description: 'Optional metadata for each document',
        },
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional IDs for documents',
        },
      },
      required: ['collection', 'documents'],
    },
  },
  {
    name: 'local_vector_search',
    description:
      'Search local ChromaDB for similar documents. Use for RAG retrieval, code search, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Collection name to search' },
        query: { type: 'string', description: 'Search query text' },
        nResults: { type: 'number', description: 'Number of results to return', default: 5 },
        filter: { type: 'object', description: 'Optional metadata filter' },
      },
      required: ['collection', 'query'],
    },
  },
  {
    name: 'local_web_search',
    description: 'Search the web using self-hosted SearXNG. Privacy-preserving, no API key needed.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'Search categories: general, images, news, science, it',
          default: ['general'],
        },
        maxResults: { type: 'number', description: 'Maximum results', default: 10 },
      },
      required: ['query'],
    },
  },
  {
    name: 'local_service_status',
    description: 'Check the status of free-local services (Ollama, ChromaDB, SearXNG, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        services: {
          type: 'array',
          items: { type: 'string' },
          description: 'Services to check: ollama, chromadb, searxng, qdrant, redis, postgres',
          default: ['ollama', 'chromadb', 'searxng'],
        },
      },
    },
  },
  {
    name: 'local_service_start',
    description: 'Start a free-local Docker service',
    inputSchema: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          description:
            'Service to start: chromadb, searxng, qdrant, redis, postgres, n8n, open-webui',
          enum: ['chromadb', 'searxng', 'qdrant', 'redis', 'postgres', 'n8n', 'open-webui', 'all'],
        },
      },
      required: ['service'],
    },
  },
  {
    name: 'local_agent_run',
    description:
      'Execute a CrewAI agent crew for complex tasks. Uses multiple specialized AI agents working together.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task description for the agent crew' },
        agents: {
          type: 'array',
          items: { type: 'string' },
          description: 'Agents to use: architect, coder, tester, reviewer, researcher, docwriter',
          default: ['coder'],
        },
      },
      required: ['task'],
    },
  },
];

// ============================================================================
// TOOL HANDLERS
// ============================================================================

const toolHandlers = {
  async local_llm_query({
    prompt,
    model = 'qwen2.5-coder:32b',
    temperature = 0.7,
    maxTokens = 4096,
  }) {
    try {
      const response = await httpPost(
        `${OLLAMA_HOST}/api/generate`,
        {
          model,
          prompt,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
          },
        },
        120000
      );

      const result = JSON.parse(response.data);
      return {
        success: true,
        model,
        response: result.response,
        tokens: result.eval_count,
        duration_ms: result.total_duration / 1000000,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async local_llm_select({ taskType, preferSpeed = false }) {
    const modelMap = {
      coding: preferSpeed ? 'deepseek-coder-v2:16b' : 'qwen2.5-coder:32b',
      debugging: 'qwen2.5-coder:32b',
      refactoring: 'qwen2.5-coder:32b',
      reasoning: 'llama3.1:70b',
      embedding: 'nomic-embed-text',
      documentation: 'deepseek-coder-v2:16b',
      testing: 'deepseek-coder-v2:16b',
      research: 'deepseek-coder-v2:16b',
    };

    return {
      taskType,
      recommendedModel: modelMap[taskType] || 'qwen2.5-coder:32b',
      preferSpeed,
      alternatives: Object.entries(modelMap)
        .filter(([k]) => k !== taskType)
        .slice(0, 3)
        .map(([task, model]) => ({ task, model })),
    };
  },

  async local_vector_store({ collection, documents, metadata = [], ids = [] }) {
    try {
      // Generate IDs if not provided
      if (ids.length === 0) {
        ids = documents.map((_, i) => `doc_${Date.now()}_${i}`);
      }

      const response = await httpPost(`${CHROMADB_HOST}/api/v1/collections/${collection}/add`, {
        documents,
        metadatas: metadata.length > 0 ? metadata : undefined,
        ids,
      });

      return { success: true, collection, documentCount: documents.length, ids };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async local_vector_search({ collection, query, nResults = 5, filter }) {
    try {
      const response = await httpPost(`${CHROMADB_HOST}/api/v1/collections/${collection}/query`, {
        query_texts: [query],
        n_results: nResults,
        where: filter,
      });

      const data = JSON.parse(response.data);
      return {
        success: true,
        collection,
        results: data.documents?.[0] || [],
        distances: data.distances?.[0] || [],
        metadatas: data.metadatas?.[0] || [],
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async local_web_search({ query, categories = ['general'], maxResults = 10 }) {
    try {
      const params = new URLSearchParams({
        q: query,
        categories: categories.join(','),
        format: 'json',
      });

      const response = await httpGet(`${SEARXNG_HOST}/search?${params}`);
      const data = JSON.parse(response.data);

      return {
        success: true,
        query,
        results: (data.results || []).slice(0, maxResults).map(r => ({
          title: r.title,
          url: r.url,
          content: r.content,
        })),
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async local_service_status({ services = ['ollama', 'chromadb', 'searxng'] }) {
    const endpoints = {
      ollama: `${OLLAMA_HOST}/api/tags`,
      chromadb: `${CHROMADB_HOST}/api/v1/heartbeat`,
      searxng: `${SEARXNG_HOST}`,
      qdrant: 'http://localhost:6333/collections',
      redis: 'tcp://localhost:6379',
      postgres: 'tcp://localhost:5432',
    };

    const results = {};
    for (const svc of services) {
      try {
        if (endpoints[svc]?.startsWith('tcp://')) {
          // TCP check
          results[svc] = { running: false, note: 'TCP check not implemented' };
        } else {
          await httpGet(endpoints[svc], 3000);
          results[svc] = { running: true };
        }
      } catch {
        results[svc] = { running: false };
      }
    }

    return { services: results };
  },

  async local_service_start({ service }) {
    try {
      const composeFile = path.join(
        __dirname,
        '..',
        '..',
        'free-local',
        'docker-compose-vibe-stack.yml'
      );
      const cmd =
        service === 'all'
          ? `docker-compose -f "${composeFile}" up -d`
          : `docker-compose -f "${composeFile}" up -d ${service}`;

      execSync(cmd, { stdio: 'pipe' });
      return { success: true, service, message: `${service} started` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async local_agent_run({ task, agents = ['coder'] }) {
    try {
      const agentScript = path.join(
        __dirname,
        '..',
        '..',
        'free-local',
        'scripts',
        'agent-crew.py'
      );
      const result = execSync(
        `python "${agentScript}" --task "${task}" --agents ${agents.join(',')}`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 300000 }
      );

      return { success: true, agents, result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  FREE_LOCAL_TOOLS,
  toolHandlers,

  // Helper to register tools with MCP server
  registerTools(server) {
    for (const tool of FREE_LOCAL_TOOLS) {
      server.registerTool(tool.name, tool.description, tool.inputSchema, toolHandlers[tool.name]);
    }
  },
};
