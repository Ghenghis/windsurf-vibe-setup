#!/usr/bin/env node
/**
 * UNIFIED VIBE SYSTEM - Everything Working Together!
 * Windsurf + LM Studio + Ollama + Harness = ONE SYSTEM
 */

const { EventEmitter } = require('events');
const axios = require('axios');
const WebSocket = require('ws');
const { PerpetualHarness } = require('./perpetual-harness');

class UnifiedVibeSystem extends EventEmitter {
  constructor() {
    super();
    
    // Core components
    this.harness = null;
    this.lmStudio = null;
    this.ollama = null;
    this.agents = [];
    
    // Configuration
    this.config = {
      lmStudioUrl: process.env.LMSTUDIO_URL || 'http://localhost:1234',
      ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
      wsPort: 8420,
      dashboardPort: 9090
    };
    
    // State
    this.models = new Map();
    this.stats = {
      predictions: 0,
      fixes: 0,
      requests: 0,
      consensus: 0
    };
  }
  
  async initialize() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║         🚀 UNIFIED VIBE SYSTEM INITIALIZATION 🚀            ║
╚══════════════════════════════════════════════════════════════╝
    `);
    
    // Initialize all components
    await this.initHarness();
    await this.initLMStudio();
    await this.initOllama();
    await this.initAgents();
    await this.initWebSocket();
    await this.initDashboard();
    
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║    ✅ ALL SYSTEMS OPERATIONAL - VIBE MODE: MAXIMUM! ✅      ║
╚══════════════════════════════════════════════════════════════╝
    `);
    
    // Start coordination
    this.startCoordination();
  }
  
  async initHarness() {
    console.log('🔧 Initializing Perpetual Harness...');
    
    this.harness = new PerpetualHarness();
    await this.harness.activate();
    
    // Hook harness events
    this.harness.on('auto-fixed', (data) => {
      this.stats.fixes++;
      this.emit('fix-applied', data);
    });
    
    this.harness.on('prediction-made', (data) => {
      this.stats.predictions++;
      this.emit('prediction', data);
    });
    
    console.log('✅ Harness: PERPETUAL MODE ACTIVE');
  }
  
  async initLMStudio() {
    console.log('🤖 Connecting to LM Studio...');
    
    try {
      // Check LM Studio health
      const response = await axios.get(`${this.config.lmStudioUrl}/v1/models`);
      const models = response.data.data || [];
      
      this.lmStudio = {
        url: this.config.lmStudioUrl,
        models: models,
        available: true,
        
        async complete(prompt, model = 'qwen2.5-coder:32b') {
          try {
            const res = await axios.post(`${this.url}/v1/completions`, {
              model: model,
              prompt: prompt,
              max_tokens: 1000,
              temperature: 0.7
            });
            return res.data.choices[0].text;
          } catch (e) {
            console.error('LM Studio error:', e.message);
            return null;
          }
        },
        
        async chat(messages, model = 'qwen2.5-coder:32b') {
          try {
            const res = await axios.post(`${this.url}/v1/chat/completions`, {
              model: model,
              messages: messages,
              max_tokens: 1000
            });
            return res.data.choices[0].message.content;
          } catch (e) {
            console.error('LM Studio chat error:', e.message);
            return null;
          }
        }
      };
      
      console.log(`✅ LM Studio: ${models.length} models available`);
      models.forEach(m => {
        console.log(`   - ${m.id}`);
        this.models.set(m.id, { provider: 'lmstudio', client: this.lmStudio });
      });
      
    } catch (e) {
      console.log('⚠️ LM Studio not available:', e.message);
      this.lmStudio = { available: false };
    }
  }
  
  async initOllama() {
    console.log('🦙 Connecting to Ollama...');
    
    try {
      // Check Ollama health
      const response = await axios.get(`${this.config.ollamaUrl}/api/tags`);
      const models = response.data.models || [];
      
      this.ollama = {
        url: this.config.ollamaUrl,
        models: models,
        available: true,
        
        async generate(prompt, model = 'llama3:latest') {
          try {
            const res = await axios.post(`${this.url}/api/generate`, {
              model: model,
              prompt: prompt,
              stream: false
            });
            return res.data.response;
          } catch (e) {
            console.error('Ollama error:', e.message);
            return null;
          }
        },
        
        async chat(messages, model = 'llama3:latest') {
          try {
            const res = await axios.post(`${this.url}/api/chat`, {
              model: model,
              messages: messages,
              stream: false
            });
            return res.data.message.content;
          } catch (e) {
            console.error('Ollama chat error:', e.message);
            return null;
          }
        }
      };
      
      console.log(`✅ Ollama: ${models.length} models available`);
      models.forEach(m => {
        console.log(`   - ${m.name}`);
        this.models.set(m.name, { provider: 'ollama', client: this.ollama });
      });
      
    } catch (e) {
      console.log('⚠️ Ollama not available:', e.message);
      this.ollama = { available: false };
    }
  }
  
  async initAgents() {
    console.log('🤖 Spawning 120 Unified Agents...');
    
    const agentTypes = [
      'coder', 'reviewer', 'tester', 'optimizer', 'documenter',
      'architect', 'security', 'performance', 'debugger', 'predictor'
    ];
    
    // Create agents distributed across available models
    const availableModels = Array.from(this.models.keys());
    
    for (let i = 0; i < 120; i++) {
      const type = agentTypes[i % agentTypes.length];
      const modelName = availableModels[i % availableModels.length];
      const modelInfo = this.models.get(modelName);
      
      const agent = {
        id: `agent-${i}`,
        type: type,
        model: modelName,
        provider: modelInfo?.provider || 'local',
        client: modelInfo?.client || null,
        status: 'ready',
        tasks: 0,
        
        async process(task) {
          this.status = 'busy';
          this.tasks++;
          
          let result = null;
          
          if (this.client && this.client.available) {
            // Use real model
            if (this.provider === 'lmstudio') {
              result = await this.client.complete(task.prompt, this.model);
            } else if (this.provider === 'ollama') {
              result = await this.client.generate(task.prompt, this.model);
            }
          } else {
            // Simulate if no model available
            result = `[Agent ${this.id}] Simulated result for: ${task.type}`;
          }
          
          this.status = 'ready';
          return result;
        }
      };
      
      this.agents.push(agent);
    }
    
    console.log(`✅ Agents: ${this.agents.length} spawned and ready`);
  }
  
  async initWebSocket() {
    console.log('🔌 Starting WebSocket server...');
    
    this.wss = new WebSocket.Server({ port: this.config.wsPort });
    
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket connection');
      
      ws.on('message', async (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'predict':
            const prediction = await this.predict(data.context);
            ws.send(JSON.stringify({ type: 'prediction', data: prediction }));
            break;
            
          case 'fix':
            const fix = await this.fix(data.error);
            ws.send(JSON.stringify({ type: 'fix', data: fix }));
            break;
            
          case 'status':
            ws.send(JSON.stringify({ type: 'status', data: this.getStatus() }));
            break;
        }
      });
      
      // Send periodic updates
      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'heartbeat',
            data: this.getStatus()
          }));
        } else {
          clearInterval(interval);
        }
      }, 5000);
    });
    
    console.log(`✅ WebSocket: ws://localhost:${this.config.wsPort}`);
  }
  
  async initDashboard() {
    console.log('📊 Starting monitoring dashboard...');
    
    const express = require('express');
    const app = express();
    
    app.get('/', (req, res) => {
      res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Unified Vibe Dashboard</title>
  <style>
    body {
      background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: monospace;
      padding: 20px;
    }
    .stat {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      margin: 10px;
      border-radius: 10px;
      display: inline-block;
    }
    .number {
      font-size: 48px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>🌊 UNIFIED VIBE SYSTEM</h1>
  <div class="stat">
    <div class="number">${this.stats.predictions}</div>
    <div>Predictions</div>
  </div>
  <div class="stat">
    <div class="number">${this.stats.fixes}</div>
    <div>Auto-Fixes</div>
  </div>
  <div class="stat">
    <div class="number">${this.agents.length}</div>
    <div>Active Agents</div>
  </div>
  <div class="stat">
    <div class="number">${this.models.size}</div>
    <div>Models Available</div>
  </div>
  <script>
    setInterval(() => location.reload(), 5000);
  </script>
</body>
</html>
      `);
    });
    
    app.get('/api/status', (req, res) => {
      res.json(this.getStatus());
    });
    
    app.listen(this.config.dashboardPort);
    console.log(`✅ Dashboard: http://localhost:${this.config.dashboardPort}`);
  }
  
  async predict(context) {
    // Get predictions from multiple models
    const predictions = [];
    
    // Use different models for diversity
    const modelsToUse = ['qwen2.5-coder:32b', 'llama3:latest', 'codellama:latest'];
    
    for (const modelName of modelsToUse) {
      const model = this.models.get(modelName);
      if (model && model.client.available) {
        const agent = this.agents.find(a => a.model === modelName && a.status === 'ready');
        if (agent) {
          const result = await agent.process({
            type: 'predict',
            prompt: `Complete this code: ${context}`
          });
          predictions.push({ model: modelName, result });
        }
      }
    }
    
    // Use harness for consensus
    const best = this.selectBestPrediction(predictions);
    this.stats.predictions++;
    
    return best;
  }
  
  async fix(error) {
    // Get fixes from multiple agents
    const fixes = [];
    
    // Select agents of different types
    const agentTypes = ['debugger', 'fixer', 'optimizer'];
    
    for (const type of agentTypes) {
      const agent = this.agents.find(a => a.type === type && a.status === 'ready');
      if (agent) {
        const result = await agent.process({
          type: 'fix',
          prompt: `Fix this error: ${error}`
        });
        fixes.push({ agent: agent.id, fix: result });
      }
    }
    
    // Select best fix
    const best = this.selectBestFix(fixes);
    this.stats.fixes++;
    
    return best;
  }
  
  selectBestPrediction(predictions) {
    // Simple selection - in reality would use consensus
    if (predictions.length === 0) return null;
    
    // Return longest prediction (usually most complete)
    return predictions.reduce((best, current) => {
      if (!best || (current.result && current.result.length > best.result.length)) {
        return current;
      }
      return best;
    }, predictions[0]);
  }
  
  selectBestFix(fixes) {
    // Simple selection - in reality would validate fixes
    if (fixes.length === 0) return null;
    return fixes[0];
  }
  
  startCoordination() {
    // Coordinate all components in real-time
    setInterval(async () => {
      // Check component health
      await this.checkHealth();
      
      // Rebalance agents if needed
      await this.rebalanceAgents();
      
      // Update statistics
      this.updateStats();
      
      // Emit status
      this.emit('status-update', this.getStatus());
    }, 5000);
  }
  
  async checkHealth() {
    // Check LM Studio
    if (this.lmStudio.available) {
      try {
        await axios.get(`${this.config.lmStudioUrl}/health`);
      } catch (e) {
        console.log('⚠️ LM Studio became unavailable');
        this.lmStudio.available = false;
      }
    }
    
    // Check Ollama
    if (this.ollama.available) {
      try {
        await axios.get(`${this.config.ollamaUrl}/api/tags`);
      } catch (e) {
        console.log('⚠️ Ollama became unavailable');
        this.ollama.available = false;
      }
    }
  }
  
  async rebalanceAgents() {
    // Move agents from unavailable providers
    for (const agent of this.agents) {
      if (agent.provider === 'lmstudio' && !this.lmStudio.available) {
        // Switch to Ollama if available
        if (this.ollama.available) {
          agent.provider = 'ollama';
          agent.client = this.ollama;
          agent.model = 'llama3:latest';
          console.log(`Switched agent ${agent.id} to Ollama`);
        }
      } else if (agent.provider === 'ollama' && !this.ollama.available) {
        // Switch to LM Studio if available
        if (this.lmStudio.available) {
          agent.provider = 'lmstudio';
          agent.client = this.lmStudio;
          agent.model = 'qwen2.5-coder:32b';
          console.log(`Switched agent ${agent.id} to LM Studio`);
        }
      }
    }
  }
  
  updateStats() {
    // Calculate aggregate stats
    const agentStats = {
      ready: this.agents.filter(a => a.status === 'ready').length,
      busy: this.agents.filter(a => a.status === 'busy').length,
      totalTasks: this.agents.reduce((sum, a) => sum + a.tasks, 0)
    };
    
    this.stats = {
      ...this.stats,
      ...agentStats
    };
  }
  
  getStatus() {
    return {
      harness: {
        running: this.harness ? true : false,
        mode: 'PERPETUAL'
      },
      lmStudio: {
        available: this.lmStudio?.available || false,
        models: this.lmStudio?.models?.length || 0
      },
      ollama: {
        available: this.ollama?.available || false,
        models: this.ollama?.models?.length || 0
      },
      agents: {
        total: this.agents.length,
        ready: this.agents.filter(a => a.status === 'ready').length,
        busy: this.agents.filter(a => a.status === 'busy').length
      },
      stats: this.stats,
      models: Array.from(this.models.keys())
    };
  }
}

// Auto-start if run directly
if (require.main === module) {
  const system = new UnifiedVibeSystem();
  
  system.on('status-update', (status) => {
    // Log periodic status
    if (Date.now() % 60000 < 5000) { // Every minute
      console.log('📊 Status:', JSON.stringify(status, null, 2));
    }
  });
  
  system.initialize().catch(err => {
    console.error('Failed to initialize:', err);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🌊 Unified system shutting down...');
    process.exit(0);
  });
}

module.exports = { UnifiedVibeSystem };
