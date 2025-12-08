/**
 * Health Monitoring Dashboard
 * Windsurf Vibe Setup v4.3.0
 * 
 * Real-time health monitoring and performance metrics dashboard
 * for the Hive Mind system and task queue.
 */

const http = require('http');
const path = require('path');
const EventEmitter = require('events');

class HealthDashboard extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      port: config.port || 9090,
      refreshInterval: config.refreshInterval || 5000,
      historySize: config.historySize || 100,
      ...config
    };
    
    this.server = null;
    this.metrics = {
      system: {
        cpu: [],
        memory: [],
        uptime: 0
      },
      hiveMind: {
        swarms: 0,
        agents: 0,
        tasks: [],
        responseTime: []
      },
      taskQueue: {
        queued: [],
        processed: [],
        failed: [],
        queueSizes: {
          critical: [],
          high: [],
          normal: [],
          low: []
        }
      },
      performance: {
        successRate: [],
        averageTime: [],
        throughput: []
      }
    };
    
    this.controllers = {
      hiveMind: null,
      taskQueue: null
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  async start(hiveMindController, taskQueue) {
    this.controllers.hiveMind = hiveMindController;
    this.controllers.taskQueue = taskQueue;
    
    // Start metrics collection
    this.startMetricsCollection();
    
    // Create HTTP server
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });
    
    this.server.listen(this.config.port, () => {
      console.log(`📊 Health Dashboard running at http://localhost:${this.config.port}`);
      this.emit('started', { port: this.config.port });
    });
  }
  
  async stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    console.log('📊 Health Dashboard stopped');
    this.emit('stopped');
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // METRICS COLLECTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.refreshInterval);
    
    // Collect initial metrics
    this.collectMetrics();
  }
  
  collectMetrics() {
    const timestamp = new Date();
    
    // System metrics
    const memUsage = process.memoryUsage();
    this.addMetric('system.memory', {
      timestamp,
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    });
    
    this.addMetric('system.cpu', {
      timestamp,
      usage: process.cpuUsage()
    });
    
    this.metrics.system.uptime = process.uptime();
    
    // Hive Mind metrics
    if (this.controllers.hiveMind) {
      const status = this.controllers.hiveMind.getStatus();
      
      this.metrics.hiveMind.swarms = status.swarms;
      this.metrics.hiveMind.agents = status.agents;
      
      this.addMetric('hiveMind.tasks', {
        timestamp,
        processed: status.metrics.tasksProcessed,
        queue: status.tasksInQueue
      });
      
      this.addMetric('hiveMind.responseTime', {
        timestamp,
        average: status.metrics.averageResponseTime
      });
      
      this.addMetric('performance.successRate', {
        timestamp,
        rate: status.metrics.successRate
      });
    }
    
    // Task Queue metrics
    if (this.controllers.taskQueue) {
      const queueStatus = this.controllers.taskQueue.getStatus();
      const metrics = queueStatus.metrics;
      
      this.addMetric('taskQueue.queued', {
        timestamp,
        count: metrics.totalQueued
      });
      
      this.addMetric('taskQueue.processed', {
        timestamp,
        count: metrics.totalProcessed
      });
      
      this.addMetric('taskQueue.failed', {
        timestamp,
        count: metrics.totalFailed
      });
      
      // Queue sizes
      Object.entries(metrics.queueSizes).forEach(([priority, size]) => {
        this.addMetric(`taskQueue.queueSizes.${priority}`, {
          timestamp,
          size
        });
      });
      
      this.addMetric('performance.averageTime', {
        timestamp,
        time: metrics.averageProcessingTime
      });
      
      // Calculate throughput
      const throughput = metrics.totalProcessed > 0 
        ? (metrics.totalProcessed / (process.uptime() / 60)).toFixed(2)
        : 0;
      
      this.addMetric('performance.throughput', {
        timestamp,
        tasksPerMinute: throughput
      });
    }
  }
  
  addMetric(path, value) {
    const parts = path.split('.');
    let target = this.metrics;
    
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]];
    }
    
    const key = parts[parts.length - 1];
    if (!Array.isArray(target[key])) {
      target[key] = [];
    }
    
    target[key].push(value);
    
    // Limit history size
    if (target[key].length > this.config.historySize) {
      target[key].shift();
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HTTP SERVER
  // ═══════════════════════════════════════════════════════════════════════════
  
  handleRequest(req, res) {
    const url = req.url;
    
    if (url === '/' || url === '/dashboard') {
      this.serveDashboardHTML(res);
    } else if (url === '/api/metrics') {
      this.serveMetrics(res);
    } else if (url === '/api/status') {
      this.serveStatus(res);
    } else if (url === '/api/health') {
      this.serveHealth(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
  
  serveDashboardHTML(res) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Windsurf Vibe - Health Dashboard</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    h1 {
      text-align: center;
      margin-bottom: 30px;
      font-size: 2.5em;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }
    
    .card h2 {
      margin-bottom: 15px;
      font-size: 1.2em;
      opacity: 0.9;
    }
    
    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .metric:last-child {
      border-bottom: none;
    }
    
    .metric-label {
      opacity: 0.8;
    }
    
    .metric-value {
      font-size: 1.5em;
      font-weight: bold;
    }
    
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: bold;
    }
    
    .status-healthy {
      background: rgba(52, 211, 153, 0.3);
      border: 1px solid #34d399;
    }
    
    .status-degraded {
      background: rgba(251, 191, 36, 0.3);
      border: 1px solid #fbbf24;
    }
    
    .status-unhealthy {
      background: rgba(239, 68, 68, 0.3);
      border: 1px solid #ef4444;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 5px;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #34d399, #10b981);
      transition: width 0.3s ease;
    }
    
    .refresh-info {
      text-align: center;
      margin-top: 30px;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 Windsurf Vibe Health Dashboard</h1>
    
    <div class="grid">
      <!-- System Status -->
      <div class="card">
        <h2>⚙️ System Status</h2>
        <div class="metric">
          <span class="metric-label">Status</span>
          <span class="status-badge status-healthy" id="system-status">Healthy</span>
        </div>
        <div class="metric">
          <span class="metric-label">Uptime</span>
          <span class="metric-value" id="uptime">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Memory Usage</span>
          <span class="metric-value" id="memory">--</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" id="memory-bar" style="width: 0%"></div>
        </div>
      </div>
      
      <!-- Hive Mind Status -->
      <div class="card">
        <h2>🐝 Hive Mind</h2>
        <div class="metric">
          <span class="metric-label">Swarms</span>
          <span class="metric-value" id="swarms">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Agents</span>
          <span class="metric-value" id="agents">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Tasks Processed</span>
          <span class="metric-value" id="hive-tasks">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Response Time</span>
          <span class="metric-value" id="response-time">-- ms</span>
        </div>
      </div>
      
      <!-- Task Queue Status -->
      <div class="card">
        <h2>📋 Task Queue</h2>
        <div class="metric">
          <span class="metric-label">Queued</span>
          <span class="metric-value" id="queued">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Processed</span>
          <span class="metric-value" id="processed">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Failed</span>
          <span class="metric-value" id="failed">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Active Tasks</span>
          <span class="metric-value" id="active-tasks">--</span>
        </div>
      </div>
      
      <!-- Performance Metrics -->
      <div class="card">
        <h2>📊 Performance</h2>
        <div class="metric">
          <span class="metric-label">Success Rate</span>
          <span class="metric-value" id="success-rate">--%</span>
        </div>
        <div class="metric">
          <span class="metric-label">Avg Processing</span>
          <span class="metric-value" id="avg-time">-- ms</span>
        </div>
        <div class="metric">
          <span class="metric-label">Throughput</span>
          <span class="metric-value" id="throughput">-- /min</span>
        </div>
        <div class="metric">
          <span class="metric-label">Queue Utilization</span>
          <span class="metric-value" id="queue-util">--%</span>
        </div>
      </div>
      
      <!-- Queue Breakdown -->
      <div class="card">
        <h2>🎯 Queue Priorities</h2>
        <div class="metric">
          <span class="metric-label">Critical</span>
          <span class="metric-value" id="queue-critical">0</span>
        </div>
        <div class="metric">
          <span class="metric-label">High</span>
          <span class="metric-value" id="queue-high">0</span>
        </div>
        <div class="metric">
          <span class="metric-label">Normal</span>
          <span class="metric-value" id="queue-normal">0</span>
        </div>
        <div class="metric">
          <span class="metric-label">Low</span>
          <span class="metric-value" id="queue-low">0</span>
        </div>
      </div>
      
      <!-- Agent Activity -->
      <div class="card">
        <h2>🤖 Agent Activity</h2>
        <div class="metric">
          <span class="metric-label">Idle Agents</span>
          <span class="metric-value" id="idle-agents">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Busy Agents</span>
          <span class="metric-value" id="busy-agents">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Agent Utilization</span>
          <span class="metric-value" id="agent-util">--%</span>
        </div>
      </div>
    </div>
    
    <div class="refresh-info">
      Auto-refreshing every 5 seconds • Last update: <span id="last-update">--</span>
    </div>
  </div>
  
  <script>
    function formatUptime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return hours + 'h ' + minutes + 'm';
    }
    
    function updateDashboard() {
      fetch('/api/status')
        .then(res => res.json())
        .then(data => {
          // System metrics
          document.getElementById('uptime').textContent = formatUptime(data.system.uptime);
          const memPercent = data.system.memory.percentage || 0;
          document.getElementById('memory').textContent = memPercent + '%';
          document.getElementById('memory-bar').style.width = memPercent + '%';
          
          // Hive Mind metrics
          document.getElementById('swarms').textContent = data.hiveMind.swarms || '0';
          document.getElementById('agents').textContent = data.hiveMind.agents || '0';
          document.getElementById('hive-tasks').textContent = data.hiveMind.tasksProcessed || '0';
          document.getElementById('response-time').textContent = 
            Math.round(data.hiveMind.averageResponseTime || 0) + ' ms';
          
          // Task Queue metrics
          document.getElementById('queued').textContent = data.taskQueue.totalQueued || '0';
          document.getElementById('processed').textContent = data.taskQueue.totalProcessed || '0';
          document.getElementById('failed').textContent = data.taskQueue.totalFailed || '0';
          document.getElementById('active-tasks').textContent = data.taskQueue.activeTasks || '0';
          
          // Performance metrics
          document.getElementById('success-rate').textContent = 
            (data.performance.successRate || 100) + '%';
          document.getElementById('avg-time').textContent = 
            Math.round(data.performance.averageTime || 0) + ' ms';
          document.getElementById('throughput').textContent = 
            (data.performance.throughput || 0) + ' /min';
          
          // Queue priorities
          document.getElementById('queue-critical').textContent = 
            data.taskQueue.queueSizes?.critical || '0';
          document.getElementById('queue-high').textContent = 
            data.taskQueue.queueSizes?.high || '0';
          document.getElementById('queue-normal').textContent = 
            data.taskQueue.queueSizes?.normal || '0';
          document.getElementById('queue-low').textContent = 
            data.taskQueue.queueSizes?.low || '0';
          
          // Queue utilization
          const queueUtil = data.taskQueue.health?.queueUtilization || 0;
          document.getElementById('queue-util').textContent = queueUtil + '%';
          
          // Agent activity
          document.getElementById('idle-agents').textContent = 
            data.hiveMind.idleAgents || '0';
          document.getElementById('busy-agents').textContent = 
            data.hiveMind.busyAgents || '0';
          const agentUtil = data.hiveMind.busyAgents && data.hiveMind.agents
            ? Math.round((data.hiveMind.busyAgents / data.hiveMind.agents) * 100)
            : 0;
          document.getElementById('agent-util').textContent = agentUtil + '%';
          
          // Update status badge
          const statusBadge = document.getElementById('system-status');
          const health = data.health?.status || 'healthy';
          statusBadge.textContent = health.charAt(0).toUpperCase() + health.slice(1);
          statusBadge.className = 'status-badge status-' + health;
          
          // Update last update time
          document.getElementById('last-update').textContent = 
            new Date().toLocaleTimeString();
        })
        .catch(err => console.error('Failed to fetch metrics:', err));
    }
    
    // Initial update
    updateDashboard();
    
    // Auto-refresh every 5 seconds
    setInterval(updateDashboard, 5000);
  </script>
</body>
</html>
    `;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
  
  serveMetrics(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(this.metrics, null, 2));
  }
  
  serveStatus(res) {
    const status = this.getAggregatedStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status, null, 2));
  }
  
  serveHealth(res) {
    const health = this.getHealth();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 503 : 500;
    
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS AGGREGATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  getAggregatedStatus() {
    const status = {
      system: {
        uptime: this.metrics.system.uptime,
        memory: this.getLatestMetric('system.memory')
      },
      hiveMind: {},
      taskQueue: {},
      performance: {}
    };
    
    // Hive Mind status
    if (this.controllers.hiveMind) {
      const hmStatus = this.controllers.hiveMind.getStatus();
      status.hiveMind = {
        swarms: hmStatus.swarms,
        agents: hmStatus.agents,
        tasksProcessed: hmStatus.metrics.tasksProcessed,
        averageResponseTime: hmStatus.metrics.averageResponseTime,
        idleAgents: this.controllers.hiveMind.getIdleAgentCount(),
        busyAgents: this.controllers.hiveMind.getBusyAgentCount()
      };
    }
    
    // Task Queue status
    if (this.controllers.taskQueue) {
      const tqStatus = this.controllers.taskQueue.getStatus();
      status.taskQueue = {
        ...tqStatus.metrics,
        health: tqStatus.health
      };
    }
    
    // Performance metrics
    status.performance = {
      successRate: this.getLatestMetric('performance.successRate')?.rate || 100,
      averageTime: this.getLatestMetric('performance.averageTime')?.time || 0,
      throughput: this.getLatestMetric('performance.throughput')?.tasksPerMinute || 0
    };
    
    // Overall health
    status.health = this.getHealth();
    
    return status;
  }
  
  getLatestMetric(path) {
    const parts = path.split('.');
    let target = this.metrics;
    
    for (const part of parts) {
      target = target[part];
      if (!target) return null;
    }
    
    if (Array.isArray(target) && target.length > 0) {
      return target[target.length - 1];
    }
    
    return target;
  }
  
  getHealth() {
    let status = 'healthy';
    const issues = [];
    
    // Check memory usage
    const memory = this.getLatestMetric('system.memory');
    if (memory && memory.percentage > 90) {
      status = 'degraded';
      issues.push('High memory usage');
    }
    
    // Check task queue health
    if (this.controllers.taskQueue) {
      const queueHealth = this.controllers.taskQueue.getHealth();
      if (queueHealth.status !== 'healthy') {
        status = queueHealth.status;
        issues.push('Task queue issues');
      }
    }
    
    // Check Hive Mind
    if (this.controllers.hiveMind && !this.controllers.hiveMind.isRunning) {
      status = 'unhealthy';
      issues.push('Hive Mind not running');
    }
    
    return {
      status,
      issues,
      timestamp: new Date()
    };
  }
}

// Export singleton instance
const dashboard = new HealthDashboard();

module.exports = {
  HealthDashboard,
  dashboard,
  
  // Convenience functions
  async start(hiveMindController, taskQueue) {
    return dashboard.start(hiveMindController, taskQueue);
  },
  
  async stop() {
    return dashboard.stop();
  },
  
  getStatus() {
    return dashboard.getAggregatedStatus();
  },
  
  getHealth() {
    return dashboard.getHealth();
  }
};
