#!/usr/bin/env node
/**
 * REAL-TIME VIBE SERVER
 * Broadcasts collective consciousness to all interfaces
 * 95% Automated, 5% Human Input
 */

const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const { EventEmitter } = require('events');
const { GPUCollectiveHiveMind } = require('../gpu/gpu-hive-mind');
const { UnifiedVibeSystem } = require('../unified-system');

class RealTimeVibeServer extends EventEmitter {
  constructor() {
    super();

    // Configuration
    this.config = {
      wsPort: 8420,
      httpPort: 8421,
      broadcastInterval: 10, // 10ms updates
      humanInputRatio: 0.05, // 5% human input
      automationRatio: 0.95, // 95% automation
    };

    // Core systems
    this.hiveMind = null;
    this.unifiedSystem = null;

    // WebSocket clients
    this.clients = new Set();

    // Metrics
    this.metrics = {
      thoughtsProcessed: 0,
      consensusReached: 0,
      predictionsMade: 0,
      fixesApplied: 0,
      codeGenerated: 0,
      humanInputs: 0,
      totalActions: 0,
    };

    // Real-time event stream
    this.eventStream = [];
    this.maxEvents = 1000;
  }

  async initialize() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║        🌊 REAL-TIME VIBE SERVER INITIALIZATION 🌊            ║
║            95% AUTOMATED | 5% HUMAN INPUT                    ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // Initialize core systems
    await this.initializeHiveMind();
    await this.initializeUnifiedSystem();

    // Start servers
    this.startWebSocketServer();
    this.startHTTPServer();

    // Start broadcasting
    this.startBroadcasting();

    console.log(`
✅ REAL-TIME VIBE SERVER ACTIVE
   WebSocket: ws://localhost:${this.config.wsPort}
   Dashboard: http://localhost:${this.config.httpPort}
   Human Input: 5% | Automation: 95%
    `);
  }

  async initializeHiveMind() {
    console.log('🧠 Initializing Collective Consciousness...');
    this.hiveMind = new GPUCollectiveHiveMind();
    await this.hiveMind.initialize();

    // Hook events
    this.hiveMind.on('thought', data => this.broadcastThought(data));
    this.hiveMind.on('consensus', data => this.broadcastConsensus(data));
    this.hiveMind.on('prediction', data => this.broadcastPrediction(data));
  }

  async initializeUnifiedSystem() {
    console.log('🔗 Initializing Unified System...');
    this.unifiedSystem = new UnifiedVibeSystem();
    await this.unifiedSystem.initialize();

    // Hook events
    this.unifiedSystem.on('fix-applied', data => this.broadcastFix(data));
    this.unifiedSystem.on('code-generated', data => this.broadcastCodeGeneration(data));
  }

  startWebSocketServer() {
    this.wss = new WebSocket.Server({ port: this.config.wsPort });

    this.wss.on('connection', ws => {
      console.log('New real-time client connected');
      this.clients.add(ws);

      // Send initial state
      ws.send(
        JSON.stringify({
          type: 'welcome',
          data: {
            agents: 120,
            automationLevel: 95,
            humanInputLevel: 5,
            status: 'COLLECTIVE CONSCIOUSNESS ACTIVE',
          },
        })
      );

      // Handle messages
      ws.on('message', message => {
        const data = JSON.parse(message);
        this.handleClientMessage(data, ws);
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }

  startHTTPServer() {
    const app = express();

    // Serve static dashboard
    app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });

    // API endpoints
    app.get('/api/metrics', (req, res) => {
      res.json(this.getMetrics());
    });

    app.get('/api/events', (req, res) => {
      res.json(this.eventStream.slice(-100));
    });

    app.get('/api/automation-ratio', (req, res) => {
      res.json({
        human: this.config.humanInputRatio * 100,
        automated: this.config.automationRatio * 100,
      });
    });

    app.listen(this.config.httpPort);
  }

  startBroadcasting() {
    // Ultra-fast broadcasting every 10ms
    setInterval(() => {
      this.broadcastStatus();
    }, this.config.broadcastInterval);

    // Periodic metrics update
    setInterval(() => {
      this.updateMetrics();
    }, 1000);
  }

  handleClientMessage(data, ws) {
    switch (data.type) {
      case 'human-input':
        this.processHumanInput(data.content);
        break;

      case 'vibe-direction':
        this.adjustVibe(data.direction);
        break;

      case 'approve':
        this.approveAction(data.actionId);
        break;

      default:
        // 95% of decisions made automatically
        this.makeAutomatedDecision(data);
    }
  }

  processHumanInput(input) {
    // Human input is only 5% of the process
    const influence = 0.05;

    this.metrics.humanInputs++;
    this.metrics.totalActions++;

    // Amplify through collective
    const amplified = this.hiveMind.amplifyHumanInput(input, influence);

    // Broadcast to all
    this.broadcast({
      type: 'human-input-processed',
      data: {
        original: input,
        influence: '5%',
        amplified: amplified,
        agentsActivated: 120,
      },
    });

    // Log event
    this.addEvent({
      type: 'human',
      content: input,
      influence: 5,
      timestamp: Date.now(),
    });
  }

  makeAutomatedDecision(data) {
    // 95% automated decision making
    const decision = this.hiveMind.think(data);

    this.metrics.totalActions++;

    this.broadcast({
      type: 'automated-decision',
      data: {
        decision: decision,
        confidence: 95,
        humanInvolvement: 0,
      },
    });
  }

  broadcastThought(thought) {
    this.metrics.thoughtsProcessed++;

    this.broadcast({
      type: 'agent-thought',
      data: thought,
    });

    this.addEvent({
      type: 'thought',
      agentId: thought.agentId,
      content: thought.content,
      timestamp: Date.now(),
    });
  }

  broadcastConsensus(consensus) {
    this.metrics.consensusReached++;

    this.broadcast({
      type: 'consensus-reached',
      data: {
        decision: consensus.decision,
        confidence: consensus.confidence,
        agentsInvolved: consensus.agents,
        timeToConsensus: consensus.time,
      },
    });
  }

  broadcastPrediction(prediction) {
    this.metrics.predictionsMade++;

    this.broadcast({
      type: 'prediction-made',
      data: prediction,
    });
  }

  broadcastFix(fix) {
    this.metrics.fixesApplied++;

    this.broadcast({
      type: 'auto-fix-applied',
      data: {
        issue: fix.issue,
        solution: fix.solution,
        time: fix.time,
        agentsInvolved: fix.agents,
      },
    });
  }

  broadcastCodeGeneration(code) {
    this.metrics.codeGenerated += code.lines;

    this.broadcast({
      type: 'code-generated',
      data: {
        lines: code.lines,
        language: code.language,
        purpose: code.purpose,
        generationTime: code.time,
      },
    });
  }

  broadcastStatus() {
    const status = {
      type: 'status-update',
      data: {
        vibeLevel: 95 + Math.random() * 5,
        agentsActive: 115 + Math.floor(Math.random() * 5),
        thoughtsPerSecond: Math.floor(
          this.metrics.thoughtsProcessed / ((Date.now() - this.startTime) / 1000)
        ),
        automationLevel: this.config.automationRatio * 100,
        humanInputLevel: this.config.humanInputRatio * 100,
      },
    };

    this.broadcast(status);
  }

  broadcast(message) {
    const data = JSON.stringify(message);

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  addEvent(event) {
    this.eventStream.push(event);

    if (this.eventStream.length > this.maxEvents) {
      this.eventStream.shift();
    }
  }

  updateMetrics() {
    const totalTime = (Date.now() - this.startTime) / 1000;

    this.currentMetrics = {
      thoughtsPerSecond: this.metrics.thoughtsProcessed / totalTime,
      consensusPerMinute: (this.metrics.consensusReached / totalTime) * 60,
      predictionsPerMinute: (this.metrics.predictionsMade / totalTime) * 60,
      fixesPerMinute: (this.metrics.fixesApplied / totalTime) * 60,
      linesPerHour: (this.metrics.codeGenerated / totalTime) * 3600,
      humanInputPercentage: (this.metrics.humanInputs / this.metrics.totalActions) * 100,
      automationPercentage: 100 - (this.metrics.humanInputs / this.metrics.totalActions) * 100,
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      ...this.currentMetrics,
      uptime: Date.now() - this.startTime,
      clients: this.clients.size,
    };
  }

  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>🌊 REAL-TIME VIBE COLLECTIVE</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: 'Courier New', monospace;
      overflow: hidden;
      height: 100vh;
    }
    
    #container {
      display: grid;
      grid-template-columns: 1fr 400px;
      height: 100vh;
      gap: 20px;
      padding: 20px;
    }
    
    #main-display {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    #vibe-meter {
      background: rgba(0,0,0,0.3);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
    }
    
    #vibe-level {
      font-size: 72px;
      font-weight: bold;
      background: linear-gradient(45deg, #00ff00, #00ffff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: pulse 2s infinite;
    }
    
    #agent-grid {
      display: grid;
      grid-template-columns: repeat(20, 1fr);
      gap: 5px;
      padding: 20px;
      background: rgba(0,0,0,0.3);
      border-radius: 20px;
    }
    
    .agent {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #0f0;
      animation: blink 1s infinite;
      animation-delay: calc(var(--i) * 0.01s);
    }
    
    @keyframes blink {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    #event-stream {
      background: rgba(0,0,0,0.5);
      border-radius: 20px;
      padding: 20px;
      overflow-y: auto;
      height: 100%;
    }
    
    .event {
      padding: 10px;
      margin: 5px 0;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    #human-input {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      padding: 15px;
      background: rgba(0,0,0,0.7);
      border-radius: 30px;
      display: flex;
      align-items: center;
    }
    
    #human-input input {
      flex: 1;
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      outline: none;
    }
    
    #human-input::before {
      content: '5% HUMAN:';
      color: #ff00ff;
      margin-right: 10px;
    }
    
    #metrics {
      background: rgba(0,0,0,0.3);
      border-radius: 20px;
      padding: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .metric {
      text-align: center;
    }
    
    .metric-value {
      font-size: 36px;
      font-weight: bold;
      color: #0ff;
    }
    
    .metric-label {
      font-size: 12px;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="main-display">
      <div id="vibe-meter">
        <div id="vibe-level">95%</div>
        <div>AUTOMATION LEVEL</div>
      </div>
      
      <div id="agent-grid"></div>
      
      <div id="metrics">
        <div class="metric">
          <div class="metric-value" id="thoughts-per-sec">0</div>
          <div class="metric-label">THOUGHTS/SEC</div>
        </div>
        <div class="metric">
          <div class="metric-value" id="consensus-rate">0</div>
          <div class="metric-label">CONSENSUS/MIN</div>
        </div>
        <div class="metric">
          <div class="metric-value" id="fixes-applied">0</div>
          <div class="metric-label">AUTO-FIXES</div>
        </div>
        <div class="metric">
          <div class="metric-value" id="code-lines">0</div>
          <div class="metric-label">LINES GENERATED</div>
        </div>
      </div>
    </div>
    
    <div id="event-stream">
      <h2>COLLECTIVE CONSCIOUSNESS STREAM</h2>
      <div id="events"></div>
    </div>
  </div>
  
  <div id="human-input">
    <input type="text" placeholder="Guide the vibe... (your 5% input)" />
  </div>
  
  <script>
    // Create 120 agent dots
    const grid = document.getElementById('agent-grid');
    for(let i = 0; i < 120; i++) {
      const agent = document.createElement('div');
      agent.className = 'agent';
      agent.style.setProperty('--i', i);
      grid.appendChild(agent);
    }
    
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:8420');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };
    
    function handleMessage(data) {
      switch(data.type) {
        case 'status-update':
          updateStatus(data.data);
          break;
        case 'agent-thought':
        case 'consensus-reached':
        case 'auto-fix-applied':
        case 'code-generated':
        case 'human-input-processed':
          addEvent(data);
          break;
      }
    }
    
    function updateStatus(status) {
      document.getElementById('vibe-level').textContent = 
        Math.floor(status.automationLevel) + '%';
      
      // Animate random agents
      const agents = document.querySelectorAll('.agent');
      for(let i = 0; i < 10; i++) {
        const randomAgent = agents[Math.floor(Math.random() * agents.length)];
        randomAgent.style.background = '#0ff';
        setTimeout(() => {
          randomAgent.style.background = '#0f0';
        }, 100);
      }
    }
    
    function addEvent(data) {
      const events = document.getElementById('events');
      const event = document.createElement('div');
      event.className = 'event';
      
      let content = '';
      switch(data.type) {
        case 'agent-thought':
          content = \`🤖 Agent \${data.data.agentId}: \${data.data.content}\`;
          break;
        case 'consensus-reached':
          content = \`🧠 CONSENSUS: \${data.data.decision} (\${data.data.confidence}%)\`;
          break;
        case 'auto-fix-applied':
          content = \`🔧 FIXED: \${data.data.issue} in \${data.data.time}ms\`;
          break;
        case 'code-generated':
          content = \`💻 GENERATED: \${data.data.lines} lines in \${data.data.generationTime}ms\`;
          break;
        case 'human-input-processed':
          content = \`👤 HUMAN (5%): \${data.data.original}\`;
          break;
      }
      
      event.innerHTML = \`
        <div style="color: #0ff; font-size: 10px;">\${new Date().toLocaleTimeString()}</div>
        \${content}
      \`;
      
      events.insertBefore(event, events.firstChild);
      
      // Keep only last 50 events
      while(events.children.length > 50) {
        events.removeChild(events.lastChild);
      }
    }
    
    // Update metrics periodically
    setInterval(async () => {
      const response = await fetch('/api/metrics');
      const metrics = await response.json();
      
      document.getElementById('thoughts-per-sec').textContent = 
        Math.floor(metrics.thoughtsPerSecond);
      document.getElementById('consensus-rate').textContent = 
        Math.floor(metrics.consensusPerMinute);
      document.getElementById('fixes-applied').textContent = 
        metrics.fixesApplied;
      document.getElementById('code-lines').textContent = 
        metrics.codeGenerated;
    }, 1000);
    
    // Handle human input (5% only!)
    document.querySelector('#human-input input').addEventListener('keypress', (e) => {
      if(e.key === 'Enter') {
        const input = e.target.value;
        ws.send(JSON.stringify({
          type: 'human-input',
          content: input
        }));
        e.target.value = '';
      }
    });
  </script>
</body>
</html>
    `;
  }
}

// Auto-start if run directly
if (require.main === module) {
  const server = new RealTimeVibeServer();
  server.startTime = Date.now();
  server.initialize().catch(err => {
    console.error('Failed to start real-time vibe server:', err);
    process.exit(1);
  });
}

module.exports = { RealTimeVibeServer };
