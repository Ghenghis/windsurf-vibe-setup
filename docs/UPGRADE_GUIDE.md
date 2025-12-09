# 🚀 **UPGRADE GUIDE**
## **Windsurf Vibe Setup - Migration Instructions**

---

## 📋 **Quick Navigation**

- [v3.x → v4.x](#from-v3x-to-v4x)
- [v2.x → v3.x](#from-v2x-to-v3x)
- [Fresh Install](#fresh-install-recommended)
- [Troubleshooting](#troubleshooting)

---

## 🔥 **From v3.x to v4.x** (Major Upgrade)

### **What's New in v4.x**
- 100+ AI Agents with specialized roles
- Hive Mind Swarm Intelligence
- Open Interpreter Integration
- Real-Time Automation Engine
- Multi-Provider AI Support

### **Step 1: Backup Your Data**
```bash
# Create backup directory
mkdir backup-v3
cp -r vibe-data/ backup-v3/
cp .env backup-v3/
```

### **Step 2: Pull Latest Code**
```bash
git stash  # Save local changes
git pull origin main
git stash pop  # Restore local changes
```

### **Step 3: Update Dependencies**
```bash
# Root dependencies
npm install

# MCP Server dependencies
cd mcp-server && npm install && cd ..

# LM Studio Autopilot (if using)
cd lmstudio-autopilot && npm install && cd ..

# Python requirements
pip install -r requirements.txt
```

### **Step 4: Update Environment Variables**
Add these new variables to your `.env`:
```env
# v4.x New Variables
HIVE_MIND_ENABLED=true
SWARM_MAX_AGENTS=100
OPEN_INTERPRETER_ENABLED=true
REALTIME_AUTOMATION=true

# Multi-Provider (optional)
OLLAMA_BASE_URL=http://localhost:11434
LMSTUDIO_BASE_URL=http://localhost:1234
```

### **Step 5: Pull New Models (if using local AI)**
```bash
# Recommended for Hive Mind
ollama pull qwen2.5-coder:32b
ollama pull nomic-embed-text
ollama pull llama3.2:3b
```

### **Step 6: Update MCP Configuration**
Add to `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "windsurf-autopilot": {
      "command": "node",
      "args": ["C:\\Users\\YOUR_USERNAME\\windsurf-vibe-setup\\mcp-server\\src\\index.js"]
    }
  }
}
```

### **Step 7: Start Docker Services**
```bash
docker-compose -f free-local/docker-compose-vibe-stack.yml up -d
```

### **Step 8: Verify Installation**
```bash
npm run test:install
npm run health:check
```

---

## 📦 **From v2.x to v3.x**

### **What's New in v3.x**
- Workflow Automation
- Team Collaboration
- Cloud Sync
- Extended Integrations (IaC, Testing, Comms)

### **Migration Steps**
```bash
# 1. Backup
mkdir backup-v2
cp -r vibe-data/ backup-v2/

# 2. Update
git pull origin main
npm install
cd mcp-server && npm install && cd ..

# 3. Run Migration Script
npm run vibe:migrate

# 4. Verify
npm run test:install
```

---

## 🆕 **Fresh Install (Recommended)**

If you're having issues or starting fresh:

```bash
# Clone fresh
git clone https://github.com/Ghenghis/windsurf-vibe-setup.git
cd windsurf-vibe-setup

# Setup everything
npm install
cd mcp-server && npm install && cd ..
cd lmstudio-autopilot && npm install && cd ..

# Copy environment template
cp .env.example .env
# Edit .env with your settings

# Pull AI models (optional)
ollama pull qwen2.5-coder:32b

# Start Docker services
docker-compose up -d

# Verify
npm run test:install
```

---

## 🔧 **Troubleshooting**

### **Problem: MCP Server Not Starting**
```bash
# Check logs
npm run autopilot 2>&1 | head -50

# Common fix: reinstall dependencies
cd mcp-server
rm -rf node_modules package-lock.json
npm install
```

### **Problem: GPU Not Detected**
```bash
# Verify CUDA
nvidia-smi

# Check GPU in config
npm run benchmark-models
```

### **Problem: Hive Mind Not Responding**
```bash
# Check services
docker-compose ps

# Restart services
docker-compose restart
```

### **Problem: Permission Errors (Windows)**
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📊 **Version Compatibility Matrix**

| Component | v2.x | v3.x | v4.x |
|-----------|------|------|------|
| Node.js | 16+ | 18+ | 18+ |
| npm | 8+ | 9+ | 9+ |
| Python | 3.8+ | 3.9+ | 3.10+ |
| Docker | 20+ | 23+ | 24+ |
| Ollama | - | 0.1+ | 0.3+ |
| LM Studio | - | - | 0.2+ |

---

## 📞 **Need Help?**

- 📖 [Full Documentation](./docs/INDEX.md)
- 🐛 [Report Issues](https://github.com/Ghenghis/windsurf-vibe-setup/issues)
- 💬 Check the troubleshooting guides in `/docs/TROUBLESHOOTING.md`

---

*Last Updated: December 8, 2025 (v4.3.0)*
