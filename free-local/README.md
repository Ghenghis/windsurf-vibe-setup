# 🆓 Windsurf Vibe Setup - Free & Local Module

> **100% free, self-hosted AI development stack with AI/ML automation**

[![Free](https://img.shields.io/badge/Cost-$0%2Fmonth-brightgreen?style=flat-square)](.)
[![Local](https://img.shields.io/badge/Privacy-100%25%20Local-blue?style=flat-square)](.)
[![GPU](https://img.shields.io/badge/GPU-NVIDIA%20Optimized-76B900?style=flat-square&logo=nvidia)](.)
[![Tools](https://img.shields.io/badge/MCP%20Tools-250%2B-purple?style=flat-square)](.)

---

## 🎯 What This Module Provides

This module adds **AI-powered automation** to your local development stack:

| Component           | Purpose                   | Replaces          | Savings   |
| ------------------- | ------------------------- | ----------------- | --------- |
| **Ollama**          | Local LLM runtime         | OpenAI/Claude API | $50+/mo   |
| **SearXNG**         | Private web search        | Perplexity API    | $20/mo    |
| **ChromaDB**        | Vector database           | Pinecone          | $70+/mo   |
| **Qdrant**          | Production vectors        | Weaviate Cloud    | $100/mo   |
| **n8n**             | Workflow automation       | Zapier            | $20+/mo   |
| **CrewAI Agents**   | Multi-agent orchestration | Custom dev        | Priceless |
| **AI Orchestrator** | Smart task routing        | Manual config     | Time      |

**Total Potential Savings: $880+/month**

---

## 📁 Module Contents

```
free-local/
├── README.md                     # This file
├── INTEGRATION_PLAN.md           # AI/ML automation roadmap
├── ACTION_PLAN.md                # Implementation guide
│
├── scripts/
│   ├── setup-all.ps1             # 🚀 ONE-COMMAND INSTALLER
│   ├── ai-orchestrator.js        # 🤖 AI task automation
│   ├── agent-crew.py             # 👥 CrewAI multi-agent system
│   ├── health-daemon.js          # 💓 Auto-healing monitor
│   ├── orchestrate.js            # Service management
│   └── model-router.js           # Smart model selection
│
├── components/
│   └── FreeLocalComparison.jsx   # React dashboard
│
├── docker-compose-vibe-stack.yml # Docker services
└── mcp_config_free_local.json    # MCP configuration
```

---

## 🚀 Quick Start

### Option 1: One-Command Setup (Recommended)

```powershell
# Run as Administrator
cd windsurf-vibe-setup
.\free-local\scripts\setup-all.ps1
```

This installs everything: Ollama, models, Docker services, Python deps, MCP servers.

### Option 2: Step-by-Step

```powershell
# 1. Install Ollama
winget install Ollama.Ollama
ollama pull qwen2.5-coder:32b

# 2. Start Docker services
cd free-local
docker-compose -f docker-compose-vibe-stack.yml up -d

# 3. Install Python deps
pip install crewai langchain chromadb

# 4. Test the orchestrator
node scripts/ai-orchestrator.js health
```

---

## 🤖 AI Orchestrator

The AI Orchestrator automatically provisions services and selects models:

```bash
# Run a task with auto-provisioning
node scripts/ai-orchestrator.js run "Write a React hook for authentication"

# Use multi-agent crew for complex tasks
node scripts/ai-orchestrator.js run "Design a microservices architecture" --agents

# Check system health
node scripts/ai-orchestrator.js health

# Provision for specific task type
node scripts/ai-orchestrator.js provision rag
```

### Task Types & Model Selection

| Task Type     | Auto-Selected Model   | Services          |
| ------------- | --------------------- | ----------------- |
| coding        | qwen2.5-coder:32b     | Ollama            |
| debugging     | qwen2.5-coder:32b     | Ollama            |
| architecture  | llama3.1:70b          | Ollama            |
| research      | deepseek-coder-v2:16b | Ollama + SearXNG  |
| rag           | nomic-embed-text      | Ollama + ChromaDB |
| documentation | deepseek-coder-v2:16b | Ollama            |

---

## 👥 CrewAI Agent Crew

Run specialized AI agents for complex tasks:

```bash
# Simple: single agent
python scripts/agent-crew.py --task "Write unit tests" --agents tester

# Complex: multi-agent collaboration
python scripts/agent-crew.py --task "Design and implement auth API" \
    --agents architect,coder,tester,reviewer
```

### Available Agents

| Agent          | Role           | Best For                 |
| -------------- | -------------- | ------------------------ |
| **architect**  | System design  | Architecture, patterns   |
| **coder**      | Implementation | Code generation          |
| **tester**     | QA             | Test writing, edge cases |
| **reviewer**   | Code review    | Security, best practices |
| **researcher** | Research       | Documentation, examples  |
| **docwriter**  | Documentation  | README, API docs         |

---

## 💓 Health Daemon

Auto-healing service monitor:

```bash
# Start continuous monitoring with auto-restart
AUTO_RESTART=true node scripts/health-daemon.js start

# Single health check
node scripts/health-daemon.js check
```

Features:

- ✅ Monitors all services every 30 seconds
- ✅ Auto-restarts failed services
- ✅ GPU memory monitoring
- ✅ Temperature alerts
- ✅ Detailed logging

---

## 🐳 Docker Services

| Service        | Port      | Description      |
| -------------- | --------- | ---------------- |
| **Ollama**     | 11434     | Local LLM server |
| **Open WebUI** | 3000      | Chat interface   |
| **SearXNG**    | 8080      | Web search       |
| **ChromaDB**   | 8000      | Vector DB (dev)  |
| **Qdrant**     | 6333/6334 | Vector DB (prod) |
| **PostgreSQL** | 5432      | SQL database     |
| **Redis**      | 6379      | Cache            |
| **n8n**        | 5678      | Automation       |
| **Adminer**    | 8081      | DB admin UI      |
| **MinIO**      | 9002/9003 | Object storage   |

```bash
# Start all services
docker-compose -f docker-compose-vibe-stack.yml up -d

# Start specific services
docker-compose -f docker-compose-vibe-stack.yml up -d chromadb searxng

# View logs
docker-compose -f docker-compose-vibe-stack.yml logs -f ollama
```

---

## 🔧 MCP Integration

The free-local tools integrate with the main MCP server (250+ tools):

### New Free-Local MCP Tools

| Tool                   | Description               |
| ---------------------- | ------------------------- |
| `local_llm_query`      | Query local Ollama models |
| `local_llm_select`     | Smart model selection     |
| `local_vector_store`   | Store in ChromaDB         |
| `local_vector_search`  | Search ChromaDB           |
| `local_web_search`     | Search via SearXNG        |
| `local_service_status` | Check service health      |
| `local_service_start`  | Start services            |
| `local_agent_run`      | Run CrewAI agents         |

Copy `mcp_config_free_local.json` to your Windsurf config:

```
~/.codeium/windsurf/mcp_config.json
```

---

## 🧠 Recommended Models

### For RTX 3090 Ti (24GB VRAM)

| Model                   | Size     | Use Case          |
| ----------------------- | -------- | ----------------- |
| `qwen2.5-coder:32b`     | ~20GB    | Primary coding    |
| `deepseek-coder-v2:16b` | ~10GB    | Fast coding       |
| `llama3.1:70b`          | ~24GB Q4 | Complex reasoning |
| `command-r:35b`         | ~20GB    | RAG tasks         |

### For Secondary GPU (8GB)

| Model              | Size   | Use Case       |
| ------------------ | ------ | -------------- |
| `starcoder2:3b`    | ~2GB   | Autocomplete   |
| `nomic-embed-text` | ~275MB | Embeddings     |
| `phi3:3.8b`        | ~2GB   | Fast assistant |

---

## 📊 Your Hardware Advantage

```
┌─────────────────────────────────────────────────────────────┐
│  RTX 3090 Ti     │  24GB VRAM  │  Run 70B+ models          │
│  RTX 3060 Ti     │  8GB VRAM   │  Embeddings + autocomplete │
│  System RAM      │  128GB      │  Massive context windows   │
│  Storage         │  4TB NVMe   │  200+ local models         │
│  Monthly Cost    │  $0         │  100% self-hosted          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Related Documentation

- [Main README](../README.md) - Full project overview
- [Integration Plan](./INTEGRATION_PLAN.md) - AI automation roadmap
- [QUICKSTART](../docs/QUICKSTART.md) - Get started fast
- [ARCHITECTURE](../docs/ARCHITECTURE.md) - System design

---

_Part of [Windsurf Vibe Setup](https://github.com/Ghenghis/windsurf-vibe-setup) v4.0.0 FREE & LOCAL EDITION_
