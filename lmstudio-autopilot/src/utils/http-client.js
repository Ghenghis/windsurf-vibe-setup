/**
 * HTTP Client Utility
 * Fixes the fetch() issues in Node.js environment
 */

const fetch = require('node-fetch');
const axios = require('axios');
const winston = require('winston');

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

class HttpClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;

    // Create axios instance with defaults
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      config => {
        logger.debug(`HTTP ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      error => {
        logger.error(`Request error: ${error.message}`);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for retry logic
    this.client.interceptors.response.use(
      response => {
        logger.debug(`HTTP ${response.status} ${response.config.url}`);
        return response;
      },
      async error => {
        const config = error.config;

        if (!config || !config.retry) {
          config.retry = 0;
        }

        if (config.retry < this.retries) {
          config.retry++;

          const delay = this.retryDelay * Math.pow(2, config.retry - 1);
          logger.warn(`Retry ${config.retry}/${this.retries} after ${delay}ms`);

          await new Promise(resolve => setTimeout(resolve, delay));
          return this.client(config);
        }

        logger.error(`Failed after ${this.retries} retries: ${error.message}`);
        return Promise.reject(error);
      }
    );
  }

  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async post(url, data = {}, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async put(url, data = {}, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Fallback to node-fetch for simple requests
  async fetchSimple(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: this.timeout,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error(`Fetch error: ${error.message}`);
      throw error;
    }
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = `HTTP ${error.response.status}: ${error.response.statusText}`;
      logger.error(message);
      throw new Error(message);
    } else if (error.request) {
      // Request made but no response
      logger.error('No response from server');
      throw new Error('Server unreachable');
    } else {
      // Something else happened
      logger.error(`Request error: ${error.message}`);
      throw error;
    }
  }
}

// Singleton instances for common services
const ollamaClient = new HttpClient('http://localhost:11434', {
  timeout: 60000, // Longer timeout for model responses
});

const lmStudioClient = new HttpClient('http://localhost:1234', {
  timeout: 60000,
});

const chromaClient = new HttpClient('http://localhost:8000', {
  timeout: 30000,
});

// Helper functions for specific API calls
const llmClients = {
  /**
   * Call Ollama API
   */
  async callOllama(model, prompt, options = {}) {
    try {
      const response = await ollamaClient.post('/api/generate', {
        model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          ...options,
        },
      });
      return response.response;
    } catch (error) {
      logger.error(`Ollama error: ${error.message}`);
      return null;
    }
  },

  /**
   * Call LM Studio API
   */
  async callLMStudio(model, messages, options = {}) {
    try {
      const response = await lmStudioClient.post('/v1/chat/completions', {
        model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 4096,
        ...options,
      });
      return response.choices?.[0]?.message?.content || null;
    } catch (error) {
      logger.error(`LM Studio error: ${error.message}`);
      return null;
    }
  },

  /**
   * Check Ollama models
   */
  async checkOllamaModels() {
    try {
      const response = await ollamaClient.get('/api/tags');
      return response.models || [];
    } catch (error) {
      logger.error(`Failed to get Ollama models: ${error.message}`);
      return [];
    }
  },

  /**
   * Check LM Studio models
   */
  async checkLMStudioModels() {
    try {
      const response = await lmStudioClient.get('/v1/models');
      return response.data || [];
    } catch (error) {
      logger.error(`Failed to get LM Studio models: ${error.message}`);
      return [];
    }
  },

  /**
   * Generate embeddings via Ollama
   */
  async generateEmbedding(text, model = 'nomic-embed-text') {
    try {
      const response = await ollamaClient.post('/api/embeddings', {
        model,
        prompt: text,
      });
      return response.embedding;
    } catch (error) {
      logger.error(`Embedding error: ${error.message}`);
      return null;
    }
  },
};

module.exports = {
  HttpClient,
  ollamaClient,
  lmStudioClient,
  chromaClient,
  llmClients,
  logger,
};
