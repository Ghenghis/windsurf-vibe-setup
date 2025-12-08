# Windsurf Vibe Setup - Architecture Guide v3.2

> Understanding how all the pieces fit together - 250+ tools across 32 source files

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WINDSURF VIBE SETUP                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │   WINDSURF IDE  │────▶│  settings.json  │────▶│   AI ASSISTANT  │   │
│  │  (Your Editor)  │     │  (Your Config)  │     │   (Cascade)     │   │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘   │
│           │                       │                       │             │
│           ▼                       ▼                       ▼             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │  🤖 AUTOPILOT   │     │  GLOBAL RULES   │     │   WORKSPACE     │   │
│  │  MCP SERVER     │     │ (AI Behavior)   │     │   RULES         │   │
│  │  (Zero-Code!)   │     │                 │     │                 │   │
│  └────────┬────────┘     └─────────────────┘     └─────────────────┘   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  OTHER MCP SERVERS: filesystem, git, memory, fetch, puppeteer   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 🤖 Autopilot MCP Server (Key Feature!)

The **Autopilot MCP Server** enables zero-code operation:

| Tool | What It Does |
|------|--------------|
| `get_status` | Check if everything is set up |
| `diagnose_environment` | Find problems automatically |
| `auto_fix` | Fix issues without user input |
| `complete_setup` | Install everything automatically |
| `create_project` | Create new projects by type |
| `guide_task` | Get step-by-step help |

**Non-coders just say**: "Set everything up for me" - the AI handles the rest.

### Tool Summary by Version

| Version | Category | Tools | Key Functionality |
|---------|----------|-------|-------------------|
| v2.0 | Core Operations | 20+ | Git, packages, files, commands |
| v2.1 | Intelligence | 16 | HTTP, error handling, Docker |
| v2.2 | AI Decision | 16 | Smart analysis, decisions |
| v2.3 | Autopilot | 8 | Learning, context |
| v2.4 | AI/ML | 11 | Real-time learning |
| v2.5 | ULTIMATE | 40 | Cloud, CI/CD, security |
| v2.6 | Data | 21 | Database, context, recovery |
| v3.0 | Enterprise | 25 | Workflows, teams, AI models |
| v3.1 | Integrations | 36 | IaC, testing, comms, PM |
| v3.2 | Vibe Coder | 39 | Smart assist, wizards, no-code |
| **Total** | | **250+** | **100%++ Vibe Coder** |

---

## Component Breakdown

### 1. Core Configuration (`settings.json`)

**Purpose**: The main settings file that controls how Windsurf IDE behaves.

**Location**: 
- Windows: `%APPDATA%\Windsurf\User\settings.json`
- macOS: `~/Library/Application Support/Windsurf/User/settings.json`
- Linux: `~/.config/Windsurf/User/settings.json`

**What It Controls**:
```
settings.json
├── AI Assistant Settings     → How Cascade (AI) responds
├── Security Settings         → Command allow/deny lists
├── Language Settings         → Python, JS, TypeScript, PowerShell
├── Performance Settings      → File watching, memory limits
├── Editor Settings           → Formatting, suggestions
└── Terminal Settings         → GPU, CUDA configuration
```

### 2. MCP Servers (`mcp_config.json`)

**Purpose**: Extend AI capabilities with specialized tools.

**Location**: `~/.codeium/windsurf/mcp_config.json`

**How It Works**:
```
┌─────────────────────────────────────────────────┐
│                    CASCADE AI                    │
│                   (Built-in AI)                 │
└─────────────────────┬───────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│  GitHub   │  │ Filesystem│  │  Docker   │
│   MCP     │  │    MCP    │  │    MCP    │
└───────────┘  └───────────┘  └───────────┘
     │              │              │
     ▼              ▼              ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│  GitHub   │  │   Local   │  │  Docker   │
│    API    │  │   Files   │  │  Daemon   │
└───────────┘  └───────────┘  └───────────┘
```

### 3. Global Rules (`global_rules.md`)

**Purpose**: Define how the AI assistant behaves across ALL projects.

**Location**: `~/.codeium/windsurf/memories/global_rules.md`

**Persistence**: Rules persist across conversations and restarts.

### 4. Workspace Rules (`.windsurf/rules/`)

**Purpose**: Project-specific rules that override global rules.

**Location**: `{project}/.windsurf/rules/*.md`

**Use Cases**:
- MCP server development rules
- ML/AI project rules
- Game server rules
- Frontend rules

---

## Data Flow

### When You Open a Project

```
1. Windsurf Loads
       │
       ▼
2. Read settings.json
       │
       ├──▶ Apply editor settings
       ├──▶ Apply security rules
       └──▶ Configure languages
       │
       ▼
3. Load MCP Servers
       │
       ├──▶ Connect to GitHub
       ├──▶ Connect to Filesystem
       └──▶ Connect to Docker (etc.)
       │
       ▼
4. Load Rules
       │
       ├──▶ Global Rules (always)
       └──▶ Workspace Rules (if exists)
       │
       ▼
5. AI Ready to Help
```

### When You Ask AI for Help

```
┌─────────────┐
│ Your Prompt │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         CASCADE AI ENGINE           │
├─────────────────────────────────────┤
│ 1. Read Global Rules                │
│ 2. Read Workspace Rules             │
│ 3. Analyze Project Context          │
│ 4. Check MCP Servers for Tools      │
│ 5. Generate Response                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│        SECURITY CHECK               │
├─────────────────────────────────────┤
│ • Check command deny list           │
│ • Validate file access              │
│ • Ensure safe operations            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Response  │
└─────────────┘
```

---

## File Structure Explained

```
windsurf-vibe-setup/
│
├── 📁 mcp-server/                ← WINDSURF MCP SERVER (250+ tools)
│   ├── src/
│   │   ├── index.js              ← Main server entry point
│   │   ├── ultimate-tools.js     ← v2.5 ULTIMATE tools (40)
│   │   ├── realtime-ai-engine.js ← AI/ML learning engine
│   │   ├── autopilot-intelligence.js ← Learning system
│   │   ├── advanced-tools.js     ← v2.2 AI decision tools
│   │   ├── additional-tools.js   ← v2.1 intelligence tools
│   │   ├── database-tools.js     ← v2.6 database (5)
│   │   ├── embedding-tools.js    ← v2.6 vector search (3)
│   │   ├── context-tools.js      ← v2.6 context persistence (5)
│   │   ├── recovery-tools.js     ← v2.6 error recovery (4)
│   │   ├── plugin-tools.js       ← v2.6 plugin system (4)
│   │   ├── workflow-tools.js     ← v3.0 workflows (5)
│   │   ├── team-tools.js         ← v3.0 team collab (6)
│   │   ├── cloud-tools.js        ← v3.0 cloud sync (4)
│   │   ├── model-tools.js        ← v3.0 AI models (5)
│   │   ├── agent-tools.js        ← v3.0 multi-agent (5)
│   │   ├── iac-tools.js          ← v3.1 Terraform/K8s (5)
│   │   ├── testing-tools.js      ← v3.1 advanced testing (5)
│   │   ├── comms-tools.js        ← v3.1 communications (5)
│   │   ├── pm-tools.js           ← v3.1 project mgmt (5)
│   │   ├── security-advanced-tools.js ← v3.1 SAST/SBOM (5)
│   │   ├── devenv-tools.js       ← v3.1 dev environment (3)
│   │   ├── publish-tools.js      ← v3.1 publishing (4)
│   │   ├── observability-tools.js ← v3.1 observability (4)
│   │   ├── smart-assist-tools.js ← v3.2 smart assistance (6)
│   │   ├── wizard-tools.js       ← v3.2 quick wizards (6)
│   │   ├── asset-tools.js        ← v3.2 asset generation (5)
│   │   ├── nocode-tools.js       ← v3.2 no-code integration (6)
│   │   ├── business-tools.js     ← v3.2 business analytics (5)
│   │   ├── launch-tools.js       ← v3.2 launch tools (5)
│   │   ├── pair-tools.js         ← v3.2 AI pair programming (6)
│   │   └── health-tools.js       ← Health check utilities
│   └── package.json
│
├── 📁 lmstudio-autopilot/        ← LM STUDIO MCP SERVER (identical)
│   ├── src/                      ← Mirror of mcp-server/src
│   └── package.json
│
├── 📄 settings.json              ← MAIN CONFIG - Copy to Windsurf
│
├── 📄 Windsurf-IDE-config*.md    ← COMPREHENSIVE GUIDE - Read this!
│
├── 📁 examples/                  ← TEMPLATES TO COPY
│   ├── global_rules.md           ← AI behavior rules
│   └── README.md                 ← Examples documentation
│
├── 📁 scripts/                   ← AUTOMATION TOOLS
│   ├── validate-json.js          ← Check JSON files
│   ├── scan-secrets.js           ← Find leaked secrets
│   ├── scan-dependencies.js      ← Security scan
│   ├── auto-repair.js            ← Auto-fix code issues
│   ├── collect-metrics.js        ← Code quality metrics
│   └── security-audit.js         ← Security logging
│
├── 📁 docs/                      ← DOCUMENTATION
│   ├── ARCHITECTURE.md           ← This file
│   ├── AUTOPILOT_STATUS.md       ← Current tool status
│   ├── QUICKSTART.md             ← Get started fast
│   ├── TROUBLESHOOTING.md        ← Fix common problems
│   ├── MCP_SETUP_GUIDE.md        ← MCP configuration
│   ├── WORKFLOW.md               ← Development workflow
│   └── TODO.md                   ← Task tracking
│
├── 📁 .github/                   ← GITHUB AUTOMATION
│   ├── workflows/ci.yml          ← Automated testing
│   ├── ISSUE_TEMPLATE/           ← Bug/feature templates
│   └── PULL_REQUEST_TEMPLATE.md  ← PR template
│
└── 📄 Config Files
    ├── .eslintrc.json            ← JavaScript linting
    ├── .prettierrc.json          ← Code formatting
    ├── .editorconfig             ← Editor consistency
    ├── CHANGELOG.md              ← Version history
    ├── ROADMAP.md                ← Feature roadmap
    ├── GAP_ANALYSIS.md           ← Completion status
    ├── ACTION_PLAN.md            ← Development plan
    ├── CONTRIBUTING.md           ← Contribution guide
    ├── SECURITY.md               ← Security policy
    └── package.json              ← Node.js dependencies
```

---

## Security Architecture

### Defense Layers

```
┌─────────────────────────────────────────────────────────┐
│                    LAYER 1: DENY LIST                   │
│  Blocks dangerous commands like 'rm -rf /', 'format'   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   LAYER 2: ALLOW LIST                   │
│  Only permits safe commands: git, npm, pip, python     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 LAYER 3: FILE EXCLUSIONS                │
│  Hides .env, secrets/, *.pem from AI and search        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 LAYER 4: SECRET SCANNING                │
│  npm run scan:secrets finds leaked credentials         │
└─────────────────────────────────────────────────────────┘
```

---

## Integration Points

### VS Code Extensions (Windsurf Compatible)

| Extension | Purpose | Required? |
|-----------|---------|-----------|
| Prettier | Code formatting | Yes |
| ESLint | JavaScript linting | Yes |
| Black Formatter | Python formatting | Recommended |
| Todo Tree | Track TODOs | Recommended |
| Error Lens | Inline errors | Recommended |
| GitLens | Git superpowers | Recommended |

### External Services

| Service | MCP Server | Purpose |
|---------|------------|---------|
| GitHub | `@modelcontextprotocol/server-github` | Repo management |
| Docker | `@modelcontextprotocol/server-docker` | Container ops |
| Brave Search | `@brave/brave-search-mcp-server` | Web search |
| Context7 | `@upstash/context7-mcp` | Docs lookup |

---

## Performance Considerations

### What Gets Watched

```
✅ WATCHED (Active monitoring)
├── Source code (*.js, *.py, *.ts)
├── Configuration files (*.json, *.yaml)
└── Documentation (*.md)

❌ EXCLUDED (Saves CPU/Memory)
├── node_modules/
├── .venv/, venv/
├── __pycache__/
├── Model files (*.safetensors, *.pt)
├── Data directories (data/, datasets/)
├── Training outputs (runs/, wandb/)
└── Checkpoints (checkpoints/)
```

### Memory Allocation

```
Large File Optimization: 4096 MB max
Max Tokenization Line: 20,000 characters
GPU Memory Split: 128 MB chunks (PyTorch)
```

---

## Next Steps

1. **Beginners**: Read [QUICKSTART.md](QUICKSTART.md)
2. **Setup Issues**: Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. **Scripts**: See [SCRIPTS_REFERENCE.md](SCRIPTS_REFERENCE.md)
4. **MCP Setup**: Follow [MCP_SETUP_GUIDE.md](MCP_SETUP_GUIDE.md)
