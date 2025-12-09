/**
 * Universal API Connector - v6.0
 * Connects to any API automatically with intelligent schema discovery
 * Handles authentication, rate limiting, and error recovery
 *
 * Part 1: Core initialization and API discovery
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

class UniversalAPIConnector extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.config = {
      apiDir: options.apiDir || path.join(process.cwd(), 'vibe-data', 'apis'),
      discoveryTimeout: options.discoveryTimeout || 10000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      rateLimitBuffer: options.rateLimitBuffer || 0.9,
      autoDiscovery: options.autoDiscovery !== false,
      cacheResponses: options.cacheResponses !== false,
      cacheTTL: options.cacheTTL || 300000, // 5 minutes
    };

    // API Registry
    this.apis = new Map();
    this.endpoints = new Map();
    this.schemas = new Map();

    // Authentication methods
    this.authMethods = {
      apiKey: this.authenticateWithApiKey.bind(this),
      oauth2: this.authenticateWithOAuth2.bind(this),
      bearer: this.authenticateWithBearer.bind(this),
      basic: this.authenticateWithBasic.bind(this),
      jwt: this.authenticateWithJWT.bind(this),
      custom: this.authenticateWithCustom.bind(this),
    };

    // Rate limiting
    this.rateLimits = new Map();
    this.requestQueues = new Map();

    // Response cache
    this.responseCache = new Map();

    // Error handling
    this.errorHandlers = {
      400: this.handleBadRequest.bind(this),
      401: this.handleUnauthorized.bind(this),
      403: this.handleForbidden.bind(this),
      404: this.handleNotFound.bind(this),
      429: this.handleRateLimited.bind(this),
      500: this.handleServerError.bind(this),
      503: this.handleServiceUnavailable.bind(this),
    };

    // Statistics
    this.stats = {
      totalAPIs: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedResponses: 0,
      rateLimitHits: 0,
      averageResponseTime: 0,
    };

    this.isInitialized = false;
  }

  /**
   * Initialize API connector
   */
  async initialize() {
    try {
      console.log('🔌 Initializing Universal API Connector...');

      // Create directory structure
      await this.createDirectories();

      // Load saved API configurations
      await this.loadAPIConfigs();

      // Load schemas
      await this.loadSchemas();

      // Start rate limit manager
      this.startRateLimitManager();

      this.isInitialized = true;
      this.emit('initialized');

      console.log('✅ Universal API Connector initialized');
      console.log(`   - APIs registered: ${this.apis.size}`);
      console.log(`   - Endpoints available: ${this.endpoints.size}`);
    } catch (error) {
      console.error('❌ Failed to initialize API Connector:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = ['configs', 'schemas', 'auth', 'cache', 'logs', 'responses'];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.apiDir, dir), { recursive: true });
    }
  }

  /**
   * Register and discover APIs
   */
  async registerAPI(config) {
    const api = {
      id: config.id || crypto.randomBytes(8).toString('hex'),
      name: config.name,
      baseUrl: config.baseUrl,
      version: config.version || '1.0',
      authentication: config.authentication || { type: 'none' },
      rateLimit: config.rateLimit || { requests: 100, window: 60000 },
      headers: config.headers || {},
      endpoints: new Map(),
      status: 'active',
    };

    // Discover endpoints if enabled
    if (this.config.autoDiscovery) {
      await this.discoverEndpoints(api);
    }

    // Load predefined endpoints
    if (config.endpoints) {
      for (const endpoint of config.endpoints) {
        this.registerEndpoint(api.id, endpoint);
      }
    }

    // Store API
    this.apis.set(api.id, api);
    this.stats.totalAPIs++;

    // Save configuration
    await this.saveAPIConfig(api);

    this.emit('apiRegistered', { id: api.id, name: api.name });

    return api.id;
  }

  async discoverEndpoints(api) {
    console.log(`🔍 Discovering endpoints for ${api.name}...`);

    // Try common discovery endpoints
    const discoveryPaths = [
      '/api-docs',
      '/swagger.json',
      '/openapi.json',
      '/_meta',
      '/api/v1',
      '/api',
    ];

    for (const path of discoveryPaths) {
      try {
        const response = await this.makeRequest({
          url: `${api.baseUrl}${path}`,
          method: 'GET',
          timeout: this.config.discoveryTimeout,
        });

        if (response && response.data) {
          await this.parseDiscoveredSchema(api, response.data);
          break;
        }
      } catch (error) {
        // Continue trying other paths
      }
    }
  }

  async parseDiscoveredSchema(api, schema) {
    if (schema.paths) {
      // OpenAPI/Swagger schema
      await this.parseOpenAPISchema(api, schema);
    } else if (schema.endpoints) {
      // Custom schema format
      await this.parseCustomSchema(api, schema);
    } else if (Array.isArray(schema)) {
      // Array of endpoints
      for (const endpoint of schema) {
        this.registerEndpoint(api.id, endpoint);
      }
    }
  }

  async parseOpenAPISchema(api, schema) {
    for (const [path, methods] of Object.entries(schema.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        const endpoint = {
          path,
          method: method.toUpperCase(),
          description: details.summary || details.description,
          parameters: details.parameters || [],
          requestBody: details.requestBody,
          responses: details.responses,
        };

        this.registerEndpoint(api.id, endpoint);
      }
    }

    // Store schema
    this.schemas.set(api.id, schema);
  }

  async parseCustomSchema(api, schema) {
    for (const endpoint of schema.endpoints) {
      this.registerEndpoint(api.id, {
        path: endpoint.path || endpoint.url,
        method: endpoint.method || 'GET',
        description: endpoint.description,
        parameters: endpoint.params || endpoint.parameters,
      });
    }
  }

  registerEndpoint(apiId, endpoint) {
    const endpointId = `${apiId}:${endpoint.method}:${endpoint.path}`;

    this.endpoints.set(endpointId, {
      apiId,
      ...endpoint,
      id: endpointId,
      stats: {
        calls: 0,
        successes: 0,
        failures: 0,
        avgResponseTime: 0,
      },
    });
  }

  /**
   * Make API requests
   */
  async call(apiId, endpoint, options = {}) {
    const api = this.apis.get(apiId);
    if (!api) {
      throw new Error(`API ${apiId} not found`);
    }

    // Check rate limit
    if (await this.isRateLimited(apiId)) {
      await this.waitForRateLimit(apiId);
    }

    // Check cache
    const cacheKey = this.getCacheKey(apiId, endpoint, options);
    if (this.config.cacheResponses) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.stats.cachedResponses++;
        return cached;
      }
    }

    // Prepare request
    const request = await this.prepareRequest(api, endpoint, options);

    // Add authentication
    await this.addAuthentication(api, request);

    // Make request with retry logic
    const response = await this.executeWithRetry(request);

    // Cache response
    if (this.config.cacheResponses && response.success) {
      this.cacheResponse(cacheKey, response);
    }

    // Update statistics
    this.updateStatistics(apiId, endpoint, response);

    return response;
  }

  async prepareRequest(api, endpoint, options) {
    const endpointConfig = this.endpoints.get(
      `${api.id}:${endpoint.method || 'GET'}:${endpoint.path}`
    );

    const request = {
      url: `${api.baseUrl}${endpoint.path}`,
      method: endpoint.method || 'GET',
      headers: {
        ...api.headers,
        ...options.headers,
      },
      params: options.params,
      data: options.data,
      timeout: options.timeout || 30000,
    };

    // Process path parameters
    if (options.pathParams) {
      for (const [key, value] of Object.entries(options.pathParams)) {
        request.url = request.url.replace(`{${key}}`, value);
      }
    }

    // Add query parameters
    if (options.params) {
      const queryString = new URLSearchParams(options.params).toString();
      request.url += `?${queryString}`;
    }

    return request;
  }

  /**
   * Authentication Methods (Part 2)
   */

  async addAuthentication(api, request) {
    const auth = api.authentication;

    if (auth.type === 'none') {
      return;
    }

    const authMethod = this.authMethods[auth.type];
    if (authMethod) {
      await authMethod(request, auth);
    } else {
      throw new Error(`Unknown authentication type: ${auth.type}`);
    }
  }

  async authenticateWithApiKey(request, auth) {
    if (auth.location === 'header') {
      request.headers[auth.key || 'X-API-Key'] = auth.value;
    } else if (auth.location === 'query') {
      request.params = request.params || {};
      request.params[auth.key || 'api_key'] = auth.value;
    }
  }

  async authenticateWithBearer(request, auth) {
    request.headers['Authorization'] = `Bearer ${auth.token}`;
  }

  async authenticateWithBasic(request, auth) {
    const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
    request.headers['Authorization'] = `Basic ${encoded}`;
  }

  async authenticateWithOAuth2(request, auth) {
    // Get or refresh token
    const token = await this.getOAuth2Token(auth);
    request.headers['Authorization'] = `Bearer ${token}`;
  }

  async authenticateWithJWT(request, auth) {
    const token = await this.generateJWT(auth);
    request.headers['Authorization'] = `Bearer ${token}`;
  }

  async authenticateWithCustom(request, auth) {
    // Custom authentication logic
    if (auth.handler) {
      await auth.handler(request);
    }
  }

  async getOAuth2Token(auth) {
    // Check if token exists and is valid
    const tokenKey = `oauth2:${auth.clientId}`;
    const stored = this.authTokens?.get(tokenKey);

    if (stored && stored.expiresAt > Date.now()) {
      return stored.accessToken;
    }

    // Refresh or get new token
    const tokenResponse = await this.refreshOAuth2Token(auth);

    // Store token
    this.authTokens = this.authTokens || new Map();
    this.authTokens.set(tokenKey, {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    });

    return tokenResponse.access_token;
  }

  async refreshOAuth2Token(auth) {
    const params = {
      grant_type: auth.refreshToken ? 'refresh_token' : 'client_credentials',
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
    };

    if (auth.refreshToken) {
      params.refresh_token = auth.refreshToken;
    }

    const response = await this.makeRequest({
      url: auth.tokenUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: new URLSearchParams(params).toString(),
    });

    return response.data;
  }

  async generateJWT(auth) {
    // Simple JWT generation (would use jsonwebtoken in production)
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      ...auth.claims,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', auth.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Request execution with retry
   */

  async executeWithRetry(request, retryCount = 0) {
    try {
      const startTime = Date.now();
      const response = await this.makeRequest(request);
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers,
        responseTime,
      };
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        const shouldRetry = await this.shouldRetry(error, retryCount);

        if (shouldRetry) {
          await this.delay(this.config.retryDelay * Math.pow(2, retryCount));
          return this.executeWithRetry(request, retryCount + 1);
        }
      }

      return {
        success: false,
        error: error.message,
        status: error.status || 500,
        retryCount,
      };
    }
  }

  async shouldRetry(error, retryCount) {
    // Retry on network errors and specific status codes
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const status = error.status || error.response?.status;

    if (retryableStatuses.includes(status)) {
      return true;
    }

    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    return false;
  }

  async makeRequest(config) {
    return new Promise((resolve, reject) => {
      const url = new URL(config.url);
      const protocol = url.protocol === 'https:' ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: config.method || 'GET',
        headers: config.headers || {},
        timeout: config.timeout || 30000,
      };

      const req = protocol.request(options, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);

            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                data: parsed,
                status: res.statusCode,
                headers: res.headers,
              });
            } else {
              const error = new Error(`Request failed with status ${res.statusCode}`);
              error.status = res.statusCode;
              error.response = { data: parsed, headers: res.headers };
              reject(error);
            }
          } catch (parseError) {
            // Return raw data if not JSON
            resolve({
              data,
              status: res.statusCode,
              headers: res.headers,
            });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (config.data) {
        req.write(typeof config.data === 'string' ? config.data : JSON.stringify(config.data));
      }

      req.end();
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Rate limiting
   */

  async isRateLimited(apiId) {
    const api = this.apis.get(apiId);
    if (!api.rateLimit) return false;

    const limitKey = `rate:${apiId}`;
    const limit = this.rateLimits.get(limitKey);

    if (!limit) {
      this.rateLimits.set(limitKey, {
        requests: 0,
        windowStart: Date.now(),
      });
      return false;
    }

    // Check if window has expired
    if (Date.now() - limit.windowStart > api.rateLimit.window) {
      limit.requests = 0;
      limit.windowStart = Date.now();
      return false;
    }

    // Check if limit reached
    return limit.requests >= api.rateLimit.requests * this.config.rateLimitBuffer;
  }

  async waitForRateLimit(apiId) {
    const api = this.apis.get(apiId);
    const limitKey = `rate:${apiId}`;
    const limit = this.rateLimits.get(limitKey);

    if (limit) {
      const timeToWait = api.rateLimit.window - (Date.now() - limit.windowStart);
      if (timeToWait > 0) {
        console.log(`⏳ Rate limited. Waiting ${timeToWait}ms...`);
        await this.delay(timeToWait);

        // Reset limit
        limit.requests = 0;
        limit.windowStart = Date.now();
      }
    }

    this.stats.rateLimitHits++;
  }

  startRateLimitManager() {
    // Update rate limit counters
    this.rateLimitInterval = setInterval(() => {
      for (const [key, limit] of this.rateLimits) {
        const apiId = key.replace('rate:', '');
        const api = this.apis.get(apiId);

        if (api && Date.now() - limit.windowStart > api.rateLimit.window) {
          limit.requests = 0;
          limit.windowStart = Date.now();
        }
      }
    }, 1000);
  }

  /**
   * Error handling
   */

  async handleBadRequest(error, request) {
    console.error('Bad request:', error.message);
    return {
      retry: false,
      error: 'Invalid request parameters',
    };
  }

  async handleUnauthorized(error, request) {
    console.error('Unauthorized:', error.message);
    // Try refreshing authentication
    return {
      retry: true,
      refreshAuth: true,
      error: 'Authentication failed',
    };
  }

  async handleForbidden(error, request) {
    console.error('Forbidden:', error.message);
    return {
      retry: false,
      error: 'Access denied',
    };
  }

  async handleNotFound(error, request) {
    console.error('Not found:', error.message);
    return {
      retry: false,
      error: 'Resource not found',
    };
  }

  async handleRateLimited(error, request) {
    console.warn('Rate limited');
    return {
      retry: true,
      delay: 60000,
      error: 'Rate limit exceeded',
    };
  }

  async handleServerError(error, request) {
    console.error('Server error:', error.message);
    return {
      retry: true,
      delay: 5000,
      error: 'Server error',
    };
  }

  async handleServiceUnavailable(error, request) {
    console.error('Service unavailable');
    return {
      retry: true,
      delay: 30000,
      error: 'Service temporarily unavailable',
    };
  }

  /**
   * Caching and Statistics (Part 3)
   */

  getCacheKey(apiId, endpoint, options) {
    const key = `${apiId}:${endpoint.method}:${endpoint.path}`;
    const params = JSON.stringify(options.params || {});
    const data = JSON.stringify(options.data || {});

    return crypto.createHash('sha256').update(`${key}:${params}:${data}`).digest('hex');
  }

  getFromCache(key) {
    const cached = this.responseCache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      console.log('📦 Returning cached response');
      return cached.data;
    }

    // Remove expired cache
    if (cached) {
      this.responseCache.delete(key);
    }

    return null;
  }

  cacheResponse(key, response) {
    this.responseCache.set(key, {
      data: response,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.cacheTTL,
    });

    // Limit cache size
    if (this.responseCache.size > 1000) {
      // Remove oldest entries
      const sorted = Array.from(this.responseCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      for (let i = 0; i < 100; i++) {
        this.responseCache.delete(sorted[i][0]);
      }
    }
  }

  clearCache(apiId = null) {
    if (apiId) {
      // Clear cache for specific API
      for (const [key] of this.responseCache) {
        if (key.startsWith(apiId)) {
          this.responseCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.responseCache.clear();
    }
  }

  updateStatistics(apiId, endpoint, response) {
    this.stats.totalRequests++;

    if (response.success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    // Update average response time
    if (response.responseTime) {
      const weight = 0.1; // Exponential moving average
      this.stats.averageResponseTime =
        this.stats.averageResponseTime * (1 - weight) + response.responseTime * weight;
    }

    // Update endpoint statistics
    const endpointId = `${apiId}:${endpoint.method}:${endpoint.path}`;
    const endpointConfig = this.endpoints.get(endpointId);

    if (endpointConfig) {
      endpointConfig.stats.calls++;

      if (response.success) {
        endpointConfig.stats.successes++;
      } else {
        endpointConfig.stats.failures++;
      }

      if (response.responseTime) {
        endpointConfig.stats.avgResponseTime =
          endpointConfig.stats.avgResponseTime * 0.9 + response.responseTime * 0.1;
      }
    }

    // Update rate limit counter
    const limitKey = `rate:${apiId}`;
    const limit = this.rateLimits.get(limitKey);
    if (limit) {
      limit.requests++;
    }
  }

  /**
   * API Management
   */

  async updateAPI(apiId, updates) {
    const api = this.apis.get(apiId);
    if (!api) {
      throw new Error(`API ${apiId} not found`);
    }

    // Update configuration
    Object.assign(api, updates);

    // Save updated configuration
    await this.saveAPIConfig(api);

    this.emit('apiUpdated', { id: apiId, updates });
  }

  async removeAPI(apiId) {
    const api = this.apis.get(apiId);
    if (!api) {
      throw new Error(`API ${apiId} not found`);
    }

    // Remove API and its endpoints
    this.apis.delete(apiId);

    for (const [endpointId] of this.endpoints) {
      if (endpointId.startsWith(apiId)) {
        this.endpoints.delete(endpointId);
      }
    }

    // Clear cache
    this.clearCache(apiId);

    // Remove saved config
    const configPath = path.join(this.config.apiDir, 'configs', `${apiId}.json`);
    await fs.unlink(configPath).catch(() => {});

    this.stats.totalAPIs--;
    this.emit('apiRemoved', { id: apiId });
  }

  /**
   * Batch operations
   */

  async batch(apiId, requests) {
    const api = this.apis.get(apiId);
    if (!api) {
      throw new Error(`API ${apiId} not found`);
    }

    const results = [];
    const batchSize = api.batchSize || 10;

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(req => this.call(apiId, req.endpoint, req.options))
      );

      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await this.delay(100);
      }
    }

    return results;
  }

  /**
   * WebSocket support
   */

  async connectWebSocket(apiId, endpoint, handlers = {}) {
    const api = this.apis.get(apiId);
    if (!api) {
      throw new Error(`API ${apiId} not found`);
    }

    const wsUrl = api.baseUrl.replace(/^http/, 'ws') + endpoint.path;

    // Would use 'ws' package in production
    const connection = {
      url: wsUrl,
      status: 'connecting',
      handlers,
    };

    // Store WebSocket connection
    this.wsConnections = this.wsConnections || new Map();
    const connectionId = crypto.randomBytes(8).toString('hex');
    this.wsConnections.set(connectionId, connection);

    this.emit('websocketConnected', { apiId, connectionId });

    return connectionId;
  }

  /**
   * Storage methods
   */

  async loadAPIConfigs() {
    try {
      const configDir = path.join(this.config.apiDir, 'configs');
      const files = await fs.readdir(configDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(configDir, file), 'utf8');
          const api = JSON.parse(content);

          this.apis.set(api.id, api);

          // Load endpoints
          if (api.endpoints) {
            for (const endpoint of api.endpoints) {
              this.registerEndpoint(api.id, endpoint);
            }
          }
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async loadSchemas() {
    try {
      const schemaDir = path.join(this.config.apiDir, 'schemas');
      const files = await fs.readdir(schemaDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(schemaDir, file), 'utf8');
          const schema = JSON.parse(content);
          const apiId = file.replace('.json', '');

          this.schemas.set(apiId, schema);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  async saveAPIConfig(api) {
    const configPath = path.join(this.config.apiDir, 'configs', `${api.id}.json`);

    // Don't save sensitive auth data
    const toSave = { ...api };
    if (toSave.authentication) {
      toSave.authentication = {
        type: toSave.authentication.type,
        configured: true,
      };
    }

    await fs.writeFile(configPath, JSON.stringify(toSave, null, 2));
  }

  async saveSchema(apiId, schema) {
    const schemaPath = path.join(this.config.apiDir, 'schemas', `${apiId}.json`);
    await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2));
  }

  /**
   * Generate API documentation
   */

  async generateDocumentation(apiId) {
    const api = this.apis.get(apiId);
    if (!api) {
      throw new Error(`API ${apiId} not found`);
    }

    const endpoints = Array.from(this.endpoints.values()).filter(e => e.apiId === apiId);

    const documentation = {
      name: api.name,
      version: api.version,
      baseUrl: api.baseUrl,
      authentication: api.authentication.type,
      endpoints: endpoints.map(e => ({
        path: e.path,
        method: e.method,
        description: e.description,
        parameters: e.parameters,
        stats: e.stats,
      })),
    };

    return documentation;
  }

  /**
   * Get status and shutdown
   */

  getStatus() {
    return {
      initialized: this.isInitialized,
      apis: {
        total: this.apis.size,
        active: Array.from(this.apis.values()).filter(a => a.status === 'active').length,
      },
      endpoints: this.endpoints.size,
      cache: {
        size: this.responseCache.size,
        hits: this.stats.cachedResponses,
      },
      statistics: this.stats,
      rateLimits: {
        active: this.rateLimits.size,
        hits: this.stats.rateLimitHits,
      },
    };
  }

  async shutdown() {
    // Stop rate limit manager
    if (this.rateLimitInterval) {
      clearInterval(this.rateLimitInterval);
    }

    // Save all configurations
    for (const [id, api] of this.apis) {
      await this.saveAPIConfig(api);
    }

    // Save statistics
    const statsPath = path.join(this.config.apiDir, 'stats.json');
    await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));

    // Clear cache
    this.responseCache.clear();

    this.emit('shutdown');
    console.log('✅ Universal API Connector shutdown complete');
    console.log(`   Total requests: ${this.stats.totalRequests}`);
    console.log(
      `   Success rate: ${((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(1)}%`
    );
  }
}

module.exports = UniversalAPIConnector;
