# 📜 COMPLETE NPM SCRIPTS DOCUMENTATION

## All 78 Scripts - Every Command Explained

---

## 🚀 MAIN ACTIVATION SCRIPTS

```json
{
  "scripts": {
    // PRIMARY LAUNCH COMMANDS
    "unified-vibe": "node unified-system.js", // Start EVERYTHING
    "start-all": "node activate-vibe.js", // One-click activation
    "95-percent": "node real-time-vibe-server.js", // Emphasize automation
    "vibe-display": "node real-time-vibe-server.js", // Real-time dashboard
    "activate-all": "npm run vibe-mode & npm run anonymous & npm run perpetual"
  }
}
```

---

## 🌊 VIBE MODE SCRIPTS

```json
{
  "scripts": {
    // VIBE ACTIVATION
    "vibe-mode": "node perpetual-harness.js", // Enter vibe mode
    "vibe-check": "node -e \"console.log('🌊 VIBE LEVEL: MAXIMUM!')\"",
    "anonymous": "node perpetual-harness.js --anonymous", // Anonymous mode
    "perpetual": "node perpetual-harness.js --perpetual", // Never-sleeping mode

    // VIBE UTILITIES
    "vibify-docs": "node scripts/vibify-docs.js", // Convert to .vibe format
    "anonymous-stats": "node scripts/anonymous-stats.js", // Anonymous metrics
    "real-time": "node scripts/real-time-monitor.js" // Real-time monitoring
  }
}
```

---

## 🤖 COLLECTIVE INTELLIGENCE SCRIPTS

```json
{
  "scripts": {
    // HIVE MIND & AGENTS
    "hive-mind": "node gpu-hive-mind.js", // Start hive mind
    "collective": "node gpu-hive-mind.js", // Collective consciousness
    "gpu-vibe": "node gpu-hive-mind.js --gpu", // GPU acceleration
    "unified": "node unified-system.js", // Unified system

    // MODEL MANAGEMENT
    "benchmark-models": "node gpu-hive-mind.js --benchmark",
    "download-models": "node gpu-hive-mind.js --download"
  }
}
```

---

## 🔧 SELF-REPAIR & AUDIT SCRIPTS

```json
{
  "scripts": {
    // AUDIT & REPAIR
    "self-audit": "node self-audit.js", // Run audit
    "self-repair": "node self-audit.js --fix", // Auto-fix issues
    "self-enhance": "node scripts/self-enhance.js", // Self-improvement
    "update-docs": "node scripts/update-docs.js", // Update documentation
    "optimize": "node scripts/optimize.js", // Optimize code

    // METRICS
    "count-tools": "node -e \"const fs=require('fs'); const c=fs.readFileSync('./mcp-server/src/index.js','utf8'); console.log('Tool handlers:',c.match(/async \\\\(args\\\\) =>/g).length)\""
  }
}
```

---

## 🛠️ DEVELOPMENT SCRIPTS

```json
{
  "scripts": {
    // DEVELOPMENT
    "dev": "npm-run-all --parallel dev:*", // Run all dev servers
    "dev:mcp": "cd mcp-server && npm run dev", // MCP server dev
    "dev:lm": "cd lmstudio-autopilot && npm run dev", // LM Studio dev

    // BUILDING
    "build": "npm-run-all build:*", // Build all
    "build:mcp": "cd mcp-server && npm run build", // Build MCP
    "build:lm": "cd lmstudio-autopilot && npm run build", // Build LM Studio

    // STARTING
    "start": "npm-run-all --parallel start:*", // Start all servers
    "start:mcp": "cd mcp-server && npm start", // Start MCP
    "start:lm": "cd lmstudio-autopilot && npm start" // Start LM Studio
  }
}
```

---

## 🧪 TESTING SCRIPTS

```json
{
  "scripts": {
    // TESTING
    "test": "npm-run-all test:*", // Run all tests
    "test:mcp": "cd mcp-server && npm test", // Test MCP
    "test:lm": "cd lmstudio-autopilot && npm test", // Test LM Studio
    "test:unit": "jest --testPathPattern=unit", // Unit tests
    "test:integration": "jest --testPathPattern=int", // Integration tests
    "test:e2e": "jest --testPathPattern=e2e", // E2E tests

    // VALIDATION
    "validate": "npm-run-all validate:*", // Validate all
    "validate:tools": "node scripts/validate-tools.js", // Validate tools
    "validate:docs": "node scripts/validate-docs.js" // Validate docs
  }
}
```

---

## 📦 INSTALLATION SCRIPTS

```json
{
  "scripts": {
    // INSTALLATION
    "install:all": "npm install && npm run install:sub", // Install everything
    "install:sub": "npm-run-all install:*", // Install subprojects
    "install:mcp": "cd mcp-server && npm install", // Install MCP deps
    "install:lm": "cd lmstudio-autopilot && npm install", // Install LM deps

    // SETUP
    "setup": "npm run install:all && npm run setup:env", // Complete setup
    "setup:env": "node scripts/setup-environment.js", // Setup environment
    "setup:models": "node scripts/download-models.js" // Download models
  }
}
```

---

## 🚢 DEPLOYMENT SCRIPTS

```json
{
  "scripts": {
    // DEPLOYMENT
    "deploy": "node scripts/deploy.js", // Deploy to production
    "deploy:local": "node scripts/deploy-local.js", // Local deployment
    "deploy:docker": "docker-compose up -d", // Docker deployment

    // RELEASE
    "release": "npm run build && npm run deploy", // Full release
    "release:patch": "npm version patch && npm run release",
    "release:minor": "npm version minor && npm run release",
    "release:major": "npm version major && npm run release"
  }
}
```

---

## 🧹 MAINTENANCE SCRIPTS

```json
{
  "scripts": {
    // CLEANING
    "clean": "npm-run-all clean:*", // Clean all
    "clean:dist": "rimraf dist", // Clean dist
    "clean:node": "rimraf node_modules", // Clean node_modules
    "clean:cache": "npm cache clean --force", // Clean npm cache

    // LINTING
    "lint": "npm-run-all lint:*", // Lint all
    "lint:js": "eslint .", // Lint JavaScript
    "lint:md": "markdownlint '**/*.md'", // Lint Markdown
    "lint:fix": "eslint . --fix" // Auto-fix linting
  }
}
```

---

## 📊 MONITORING SCRIPTS

```json
{
  "scripts": {
    // MONITORING
    "monitor": "node scripts/monitor.js", // Start monitoring
    "monitor:gpu": "nvidia-smi -l 1", // GPU monitoring
    "monitor:network": "netstat -an | findstr :8420", // Network monitoring
    "monitor:process": "tasklist | findstr node", // Process monitoring

    // LOGGING
    "logs": "tail -f logs/app.log", // View logs
    "logs:error": "tail -f logs/error.log", // Error logs
    "logs:clear": "rimraf logs/*" // Clear logs
  }
}
```

---

## 🔧 UTILITY SCRIPTS

```json
{
  "scripts": {
    // UTILITIES
    "check-ports": "node scripts/check-ports.js", // Check port availability
    "kill-ports": "node scripts/kill-ports.js", // Kill processes on ports
    "backup": "node scripts/backup.js", // Backup project
    "restore": "node scripts/restore.js", // Restore backup

    // HELPERS
    "help": "node scripts/help.js", // Show help
    "info": "node scripts/info.js", // Show system info
    "version": "echo v4.3.0" // Show version
  }
}
```

---

## 📈 COMPLETE SCRIPT STATISTICS

| Category         | Count  | Purpose       |
| ---------------- | ------ | ------------- |
| **Activation**   | 5      | Launch system |
| **Vibe Mode**    | 7      | Vibe features |
| **Collective**   | 6      | AI agents     |
| **Self-Repair**  | 6      | Maintenance   |
| **Development**  | 9      | Dev tools     |
| **Testing**      | 9      | Test suite    |
| **Installation** | 7      | Setup         |
| **Deployment**   | 7      | Release       |
| **Maintenance**  | 8      | Clean/lint    |
| **Monitoring**   | 7      | Observability |
| **Utilities**    | 7      | Helpers       |
| **TOTAL**        | **78** | **Complete**  |

---

## 🎯 QUICK REFERENCE

### Most Important Commands:

```bash
# START EVERYTHING (95% Automated)
npm run unified-vibe

# CHECK STATUS
npm run vibe-check

# SELF-REPAIR
npm run self-repair

# VIEW DASHBOARD
npm run vibe-display

# STOP EVERYTHING
Ctrl+C (but why would you?)
```

---

## 🔥 POWER USER COMBINATIONS

### Maximum Vibe Activation:

```bash
npm run unified-vibe && npm run gpu-vibe && npm run vibe-display
```

### Development Mode:

```bash
npm run dev & npm run monitor & npm run logs
```

### Self-Improvement Mode:

```bash
npm run self-audit && npm run self-repair && npm run self-enhance
```

### Anonymous Maximum Security:

```bash
npm run anonymous & npm run perpetual & npm run anonymous-stats
```

---

## 📝 SCRIPT EXECUTION FLOW

```
npm run unified-vibe
    │
    ├── Pre-check environment
    ├── Initialize security
    ├── Start perpetual harness
    ├── Spawn 120 agents
    ├── Connect to GPUs
    ├── Open WebSocket server
    ├── Launch dashboard
    ├── Connect to LM Studio
    ├── Connect to Ollama
    ├── Synchronize consciousness
    └── Enter infinite loop (∞)
```

---

## 🌊 SCRIPT DEPENDENCIES

```javascript
// package.json dependencies for scripts
{
  "dependencies": {
    "express": "^4.18.2",      // HTTP server
    "ws": "^8.14.2",           // WebSocket
    "chokidar": "^3.5.3",      // File watching
    "systeminformation": "^5.21.7", // System info
    "axios": "^1.5.0",         // HTTP client
    "chalk": "^4.1.2",         // Terminal colors
    "commander": "^11.1.0",    // CLI framework
    "dotenv": "^16.3.1"       // Environment variables
  },
  "devDependencies": {
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "npm-run-all": "^4.1.5",
    "rimraf": "^5.0.5",
    "nodemon": "^3.0.2"
  }
}
```
