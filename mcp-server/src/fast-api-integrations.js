/**
 * FAST API INTEGRATIONS - FREE & OPEN SOURCE ONLY
 * Addressing Claude Audit weaknesses with immediate integrations
 */

const { spawn } = require('child_process');
const Docker = require('dockerode');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class FastAPIIntegrations {
  constructor() {
    this.docker = new Docker();
    this.integrations = new Map();
  }

  /**
   * 1. MICROSANDBOX - Secure Code Execution (MIT License)
   * Replaces unsafe direct execution
   */
  async setupMicrosandbox() {
    console.log('🔒 Setting up Microsandbox for secure execution...');
    
    const sandboxConfig = {
      name: 'microsandbox',
      image: 'ghcr.io/microsandbox/microsandbox:latest',
      volumes: {
        '/tmp/sandbox': '/workspace'
      },
      env: ['SANDBOX_MODE=strict'],
      networkMode: 'none' // Isolated from network
    };

    // Pull and run container
    await this.docker.pull(sandboxConfig.image);
    const container = await this.docker.createContainer(sandboxConfig);
    
    this.integrations.set('sandbox', {
      execute: async (code, language = 'javascript') => {
        const exec = await container.exec({
          Cmd: ['node', '-e', code],
          AttachStdout: true,
          AttachStderr: true
        });
        const stream = await exec.start();
        return new Promise((resolve) => {
          let output = '';
          stream.on('data', (chunk) => output += chunk.toString());
          stream.on('end', () => resolve(output));
        });
      }
    });

    return container;
  }

  /**
   * 2. CHROMADB - Local Vector Database (Apache 2.0)
   * Better than Qdrant for local-first, no cloud needed
   */
  async setupChromaDB() {
    console.log('🧠 Setting up ChromaDB for vector search...');
    
    // Install via npm (local JS client)
    const { ChromaClient } = await import('chromadb');
    const client = new ChromaClient();

    // Create collections for different data types
    const collections = {
      code: await client.createCollection({ name: 'code_embeddings' }),
      docs: await client.createCollection({ name: 'documentation' }),
      errors: await client.createCollection({ name: 'error_patterns' }),
      user: await client.createCollection({ name: 'user_preferences' })
    };

    this.integrations.set('vectordb', {
      embed: async (text, collection = 'code') => {
        return await collections[collection].add({
          documents: [text],
          ids: [`id_${Date.now()}`]
        });
      },
      search: async (query, collection = 'code', k = 10) => {
        return await collections[collection].query({
          queryTexts: [query],
          nResults: k
        });
      }
    });

    return client;
  }

  /**
   * 3. PLAYWRIGHT - Browser Automation (Apache 2.0)
   * For web scraping and testing
   */
  async setupPlaywright() {
    console.log('🌐 Setting up Playwright for browser automation...');
    
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.integrations.set('browser', {
      scrape: async (url) => {
        const page = await browser.newPage();
        await page.goto(url);
        const content = await page.content();
        await page.close();
        return content;
      },
      screenshot: async (url, path) => {
        const page = await browser.newPage();
        await page.goto(url);
        await page.screenshot({ path });
        await page.close();
        return path;
      },
      test: async (url, selectors) => {
        const page = await browser.newPage();
        await page.goto(url);
        const results = {};
        for (const [name, selector] of Object.entries(selectors)) {
          results[name] = await page.$(selector) !== null;
        }
        await page.close();
        return results;
      }
    });

    return browser;
  }

  /**
   * 4. REDIS - High-Speed Caching (BSD License)
   * Local Redis for fast data access
   */
  async setupRedis() {
    console.log('⚡ Setting up Redis for caching...');
    
    const Redis = await import('ioredis');
    const redis = new Redis.default({
      host: 'localhost',
      port: 6379,
      lazyConnect: true
    });

    try {
      await redis.connect();
    } catch (error) {
      // Start Redis via Docker if not running
      await this.docker.createContainer({
        Image: 'redis:alpine',
        name: 'vibe-redis',
        HostConfig: {
          PortBindings: { '6379/tcp': [{ HostPort: '6379' }] }
        }
      }).then(c => c.start());
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await redis.connect();
    }

    this.integrations.set('cache', {
      set: async (key, value, ttl = 3600) => {
        return await redis.set(key, JSON.stringify(value), 'EX', ttl);
      },
      get: async (key) => {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
      },
      invalidate: async (pattern) => {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    });

    return redis;
  }

  /**
   * 5. DUCKDB - Fast Analytical Database (MIT License)
   * For complex queries and analytics
   */
  async setupDuckDB() {
    console.log('🦆 Setting up DuckDB for analytics...');
    
    const duckdb = await import('duckdb');
    const db = new duckdb.Database(':memory:');
    const conn = db.connect();

    // Create tables for metrics and analytics
    conn.exec(`
      CREATE TABLE metrics (
        timestamp TIMESTAMP,
        metric_name VARCHAR,
        value DOUBLE,
        metadata JSON
      );
      
      CREATE TABLE performance (
        timestamp TIMESTAMP,
        operation VARCHAR,
        duration_ms INTEGER,
        success BOOLEAN
      );
    `);

    this.integrations.set('analytics', {
      query: async (sql) => {
        return new Promise((resolve, reject) => {
          conn.all(sql, (err, res) => {
            if (err) reject(err);
            else resolve(res);
          });
        });
      },
      insert: async (table, data) => {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map(() => '?').join(',');
        const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
        return new Promise((resolve, reject) => {
          conn.run(sql, values, (err) => {
            if (err) reject(err);
            else resolve(true);
          });
        });
      }
    });

    return conn;
  }

  /**
   * 6. LOCAL LLMs - Ollama + LM Studio Integration
   * Use existing Ollama and LM Studio instances
   */
  async setupLocalLLMs() {
    console.log('🤖 Setting up Local LLMs (Ollama + LM Studio)...');
    
    const lmstudioUrl = process.env.LMSTUDIO_URL || 'http://192.168.0.3:1234';
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    
    // Check LM Studio first (preferred for Qwen model)
    try {
      const response = await axios.get(`${lmstudioUrl}/v1/models`);
      console.log('✅ LM Studio connected at', lmstudioUrl);
      
      this.integrations.set('llm', {
        generate: async (prompt, model = 'qwen2.5-14b-instruct-1m') => {
          try {
            // Try LM Studio first
            const response = await axios.post(`${lmstudioUrl}/v1/chat/completions`, {
              model,
              messages: [
                { role: 'system', content: 'You are VIBE, a consciousness-level AI assistant.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 2000
            });
            return response.data.choices[0].message.content;
          } catch (e) {
            // Fallback to Ollama if LM Studio fails
            console.log('Falling back to Ollama...');
            const response = await axios.post(`${ollamaUrl}/api/generate`, {
              model: 'codellama:7b',
              prompt,
              stream: false
            });
            return response.data.response;
          }
        },
        embed: async (text, model = 'nomic-embed-text') => {
          // Use Ollama for embeddings
          try {
            const response = await axios.post(`${ollamaUrl}/api/embeddings`, {
              model,
              prompt: text
            });
            return response.data.embedding;
          } catch (e) {
            console.log('Embedding generation failed:', e.message);
            return null;
          }
        }
      });
      
      console.log('✅ Using Qwen2.5-14B via LM Studio for generation');
      console.log('✅ Using Ollama for embeddings');
      return true;
      
    } catch (error) {
      console.log('⚠️ LM Studio not available, using Ollama only');
      
      // Fallback to Ollama only
      this.integrations.set('llm', {
        generate: async (prompt, model = 'codellama:7b') => {
          const response = await axios.post(`${ollamaUrl}/api/generate`, {
            model,
            prompt,
            stream: false
          });
          return response.data.response;
        },
        embed: async (text, model = 'nomic-embed-text') => {
          const response = await axios.post(`${ollamaUrl}/api/embeddings`, {
            model,
            prompt: text
          });
          return response.data.embedding;
        }
      });
      
      return true;
    }
  }

  /**
   * 7. GITEA - Local Git Server (MIT License)
   * Self-hosted GitHub alternative
   */
  async setupGitea() {
    console.log('🔀 Setting up Gitea for local git hosting...');
    
    await this.docker.createContainer({
      Image: 'gitea/gitea:latest',
      name: 'vibe-gitea',
      HostConfig: {
        PortBindings: { 
          '3000/tcp': [{ HostPort: '3030' }],
          '22/tcp': [{ HostPort: '2222' }]
        }
      },
      Env: [
        'USER_UID=1000',
        'USER_GID=1000',
        'GITEA__database__DB_TYPE=sqlite3',
        'GITEA__database__PATH=/data/gitea.db'
      ]
    }).then(c => c.start());

    this.integrations.set('git', {
      createRepo: async (name) => {
        return await axios.post('http://localhost:3030/api/v1/user/repos', {
          name,
          private: false,
          auto_init: true
        });
      }
    });

    return true;
  }

  /**
   * 8. MINIO - S3-Compatible Storage (AGPL-3.0)
   * Local object storage
   */
  async setupMinio() {
    console.log('☁️ Setting up MinIO for object storage...');
    
    await this.docker.createContainer({
      Image: 'minio/minio:latest',
      name: 'vibe-minio',
      Cmd: ['server', '/data', '--console-address', ':9001'],
      HostConfig: {
        PortBindings: { 
          '9000/tcp': [{ HostPort: '9000' }],
          '9001/tcp': [{ HostPort: '9001' }]
        }
      },
      Env: [
        'MINIO_ROOT_USER=minioadmin',
        'MINIO_ROOT_PASSWORD=minioadmin'
      ]
    }).then(c => c.start());

    const Minio = await import('minio');
    const minioClient = new Minio.Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin'
    });

    this.integrations.set('storage', {
      upload: async (bucket, name, filePath) => {
        await minioClient.fPutObject(bucket, name, filePath);
      },
      download: async (bucket, name, filePath) => {
        await minioClient.fGetObject(bucket, name, filePath);
      }
    });

    return minioClient;
  }

  /**
   * FAST INITIALIZATION - All tools at once
   */
  async initializeAll() {
    console.log('🚀 FAST API: Initializing all free & open source tools...');
    
    const startTime = Date.now();
    
    // Parallel initialization for speed
    const results = await Promise.allSettled([
      this.setupMicrosandbox(),
      this.setupChromaDB(),
      this.setupPlaywright(),
      this.setupRedis(),
      this.setupDuckDB(),
      this.setupLocalLLMs(),  // Updated to use existing LLMs
      this.setupGitea(),
      this.setupMinio()
    ]);

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected');
    
    console.log(`✅ Initialized ${successful}/8 integrations in ${Date.now() - startTime}ms`);
    
    if (failed.length > 0) {
      console.log('⚠️ Failed integrations:', failed.map(f => f.reason?.message));
    }

    return this.integrations;
  }

  /**
   * Get all available integrations
   */
  getIntegrations() {
    return this.integrations;
  }
}

// Export for immediate use
module.exports = FastAPIIntegrations;

// Auto-initialize if run directly
if (require.main === module) {
  const fastAPI = new FastAPIIntegrations();
  fastAPI.initializeAll().then(() => {
    console.log('🎉 All free & open source integrations ready!');
  });
}
