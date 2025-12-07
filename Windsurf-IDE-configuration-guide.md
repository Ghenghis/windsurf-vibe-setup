# The Ultimate Windsurf IDE Configuration for Vibe Coders

Enterprise-grade AI-assisted development without traditional programming expertise is now possible through "vibe coding"—a paradigm coined by Andrej Karpathy where you describe what you want in natural language and iterate through AI-generated code. For someone managing **401 repositories** spanning MCP servers, ML/AI, game development, and agent frameworks, Windsurf IDE offers the most comprehensive agentic coding environment available in 2025. This guide delivers every configuration, setting, and workflow needed to maximize productivity across your diverse project portfolio.

## Windsurf's core advantage lies in automatic context

Unlike Cursor's manual @-file system, Windsurf's **Cascade** automatically indexes your entire codebase (~200K tokens) and selects relevant files without explicit tagging. This proves essential when working across **100+ repositories** with varied tech stacks. The **SWE-1.5** model achieves **950 tokens/second**—13x faster than Claude Sonnet 4.5—while **Fast Context** provides 20x faster codebase retrieval through parallel tool calls.

The pricing structure matters for prolific developers: Windsurf Pro at **$15/month** (500 credits) undercuts Cursor's $20/month while providing unlimited **Cascade Base** model access and one-click deployment via windsurf.build. Enterprise compliance (SOC 2, HIPAA, FedRAMP, ITAR) exceeds Cursor's SOC 2-only certification.

---

## Essential settings.json configuration

This master configuration addresses multi-language development, performance optimization for large projects, and AI assistance tuning:

```json
{
  "windsurf.enableAutocomplete": true,
  "windsurf.enableSupercomplete": true,
  "windsurf.enableTabToJump": true,
  "windsurf.autocompleteSpeed": "fast",
  "windsurf.autoExecutionPolicy": "auto",
  "windsurf.cascadeCommandsAllowList": ["git", "npm", "yarn", "pnpm", "pip", "python", "docker", "pytest", "make"],
  "windsurf.cascadeCommandsDenyList": ["rm -rf", "sudo rm", "DROP TABLE", "format"],
  "windsurf.openRecentConversation": true,
  "windsurf.explainAndFixInCurrentConversation": true,
  "windsurf.rememberLastModelSelection": true,
  "windsurf.cascadeGitignoreAccess": false,
  "windsurf.useClipboardAsContext": true,
  "windsurf.marketplaceExtensionGalleryServiceURL": "https://marketplace.visualstudio.com/_apis/public/gallery",
  "windsurf.marketplaceGalleryItemURL": "https://marketplace.visualstudio.com/items",

  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "python.terminal.activateEnvironment": true,
  "python.analysis.typeCheckingMode": "basic",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.analysis.extraPaths": ["${workspaceFolder}/src", "${workspaceFolder}/ultralytics"],

  "java.configuration.runtimes": [
    { "name": "JavaSE-17", "path": "/usr/lib/jvm/java-17-openjdk" }
  ],

  "typescript.preferences.importModuleSpecifier": "relative",
  "javascript.updateImportsOnFileMove.enabled": "always",

  "docker.host": "unix:///var/run/docker.sock",
  "docker.showStartPage": false,
  "docker.containers.sortBy": "CreatedTime",

  "terminal.integrated.env.linux": {
    "CUDA_VISIBLE_DEVICES": "0",
    "PYTORCH_CUDA_ALLOC_CONF": "max_split_size_mb:128"
  },

  "git.enableSmartCommit": true,
  "git.confirmSync": false,
  "git.autofetch": true,
  "git.fetchOnPull": true,

  "files.watcherExclude": {
    "**/data/**": true,
    "**/datasets/**": true,
    "**/checkpoints/**": true,
    "**/models/**": true,
    "**/.venv/**": true,
    "**/wandb/**": true,
    "**/logs/**": true,
    "**/__pycache__/**": true,
    "**/node_modules/**": true,
    "**/runs/**": true,
    "**/weights/**": true
  },
  "search.exclude": {
    "**/data": true,
    "**/datasets": true,
    "**/checkpoints": true,
    "**/*.safetensors": true,
    "**/*.ckpt": true,
    "**/*.pt": true
  },
  "files.exclude": {
    "**/__pycache__": true,
    "**/.ipynb_checkpoints": true
  },

  "editor.formatOnSave": true,
  "editor.largeFileOptimizations": true
}
```

---

## Global rules for vibe coding excellence

Create `~/.codeium/windsurf/memories/global_rules.md` with these foundational guidelines that persist across all 401 repositories:

```markdown
# Vibe Coder Global Rules

## Core Philosophy
- You are assisting a "vibe coder" who builds enterprise-grade projects through AI assistance
- Prioritize working code over perfect code
- Explain decisions briefly when making architectural choices
- Always show diffs before applying changes
- Follow the principle of minimal viable change

## Communication Style
- Respond concisely unless asked for detail
- Provide code examples, not just explanations
- When asked "tell me your plan first," do not write any code
- Ask clarifying questions when requirements are ambiguous

## Code Quality Standards
- Use type hints in Python, TypeScript strict mode in JS/TS
- Follow PEP8 for Python, Airbnb style for JavaScript
- Prefer early returns over nested conditionals
- Document all public functions with docstrings
- Use meaningful variable names (isLoading, hasError, fetchUserData)

## Safety Protocols
- Never delete files without explicit confirmation
- Use git commits at logical checkpoints
- Prefer .safetensors over .ckpt for model files (security)
- Never hardcode API keys—use .env files
- Test in localhost after every change

## Project Awareness
- Check for existing patterns before adding new code
- Look for package.json, requirements.txt, pyproject.toml
- Respect existing folder structure and naming conventions
- Use existing utility functions rather than creating duplicates

## Error Handling
- When encountering errors, analyze the full stack trace
- Check browser console (Cmd+Option+J) for frontend errors
- Suggest targeted fixes, not complete rewrites
- Offer multiple solutions starting with the simplest
```

---

## Workspace rules tailored to your repository categories

### MCP server development (.windsurf/rules/mcp-dev.md)

For repositories like MCP_Server_Collection, AIO-MCP, mcp-doctor:

```markdown
# MCP Server Development Rules

<activation>
Glob: **/mcp*/**/*.{ts,js,py}
</activation>

## Architecture
- All MCP servers must implement the stdio or HTTP transport
- Use @modelcontextprotocol/sdk for TypeScript servers
- Use mcp package for Python servers
- Maximum 100 tools per configuration

## TypeScript MCP Server Template
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: "server-name",
  version: "1.0.0"
});

// Register tools, handle requests
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Security Requirements
- Use environment variables for credentials
- Apply principle of least privilege for filesystem access
- Validate all inputs before processing
- Never grant access to home directory (~) or root (/)

## Testing Protocol
- Test stdio transport with direct stdin/stdout
- Test HTTP transport with curl or httpie
- Verify tool schema matches implementation
- Check for proper error handling and messages
```

### ML/AI development (.windsurf/rules/ml-project.md)

For YOLO, Mario-Training-Platform, dreamerv3:

```markdown
# ML/AI Development Rules

<activation>
Glob: **/*.{py}
Model Decision: Activate for PyTorch, TensorFlow, or ML-related code
</activation>

## Framework Guidelines
- You are a PyTorch ML engineer
- Use torch.nn.Module for all model definitions
- Implement forward() with tensor shape comments
- Use torch.cuda.amp for mixed precision training
- Use DataLoader with pin_memory=True for GPU training

## Project Structure
```
project/
├── configs/          # Hydra/YAML configs
├── src/
│   ├── models/       # Model architectures
│   ├── data/         # Data loading utilities
│   ├── training/     # Training loops
│   └── evaluation/   # Metrics
├── checkpoints/      # Model checkpoints (gitignored)
└── outputs/          # Training outputs (gitignored)
```

## GPU Best Practices
- Always check torch.cuda.is_available() before GPU operations
- Implement gradient checkpointing for large models
- Use CUDA_VISIBLE_DEVICES environment variable
- Monitor GPU memory with nvidia-smi

## Model File Handling
- ALWAYS use .safetensors format (secure, faster loading)
- NEVER use .ckpt files in production (pickle vulnerability)
- Convert existing .ckpt files: torch.load() → save_file()
```

### Game server development (.windsurf/rules/game-server.md)

For CosmicMS, Bravian-Docker, TravianZ:

```markdown
# Game Server Development Rules

<activation>
Glob: **/src/**/*.{java,php}
Model Decision: Activate for game server or emulator development
</activation>

## Java (MapleStory v83)
- Target Java 17+
- Use MySQL for persistent data
- Follow existing package structure in CosmicMS
- Implement proper connection pooling

## PHP (Travian)
- Target PHP 8.x
- Use PDO for database queries
- Follow PSR-12 coding standards
- Implement CSRF protection for all forms

## Docker Deployment
- Use multi-stage builds for smaller images
- Implement health checks in docker-compose
- Use volumes for persistent game data
- Configure proper networking between services
```

### Agent frameworks (.windsurf/rules/agents.md)

For A2A-Maestro, agent-zero, crewAI:

```markdown
# AI Agent Development Rules

<activation>
Glob: **/agent*/**/*.py
Model Decision: Activate for multi-agent or LLM orchestration code
</activation>

## Architecture Patterns
- Implement clear separation between agents and tools
- Use async/await for agent communication
- Design for idempotency in agent actions
- Log all agent decisions for debugging

## A2A Protocol
- Follow Agent-to-Agent protocol specifications
- Implement proper message serialization
- Handle timeouts and retries gracefully
- Support both synchronous and asynchronous modes

## Memory Management
- Implement conversation memory limits
- Use vector stores for long-term retrieval
- Clear context between unrelated tasks
- Track token usage per agent
```

---

## Complete MCP server configuration

Create `~/.codeium/windsurf/mcp_config.json` for maximum productivity across your projects:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github", "--toolsets", "repos,issues,prs,actions"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PAT}"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/home/user/projects"
      ]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    },
    "docker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-docker"]
    },
    "postgresql": {
      "command": "npx",
      "args": [
        "-y",
        "@executeautomation/database-server",
        "--postgresql",
        "--host", "localhost",
        "--database", "gamedb",
        "--user", "postgres",
        "--password", "${POSTGRES_PASSWORD}"
      ]
    },
    "sqlite": {
      "command": "npx",
      "args": [
        "-y",
        "@executeautomation/database-server",
        "/home/user/projects/data/local.db"
      ]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@brave/brave-search-mcp-server"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

**Key MCP servers for your workflow:**
- **Context7**: Auto-fetches up-to-date library documentation—add `use context7` to prompts
- **GitHub**: Essential for managing 401 repositories—enables PR reviews, issue creation, Actions monitoring
- **Docker**: Critical for your Bravian-Docker, docker-travian containerized projects
- **Memory**: Persistent knowledge graph for cross-session context
- **PostgreSQL/SQLite**: Direct database interaction for game servers

---

## Multi-project workspace configuration

For managing 100+ repositories efficiently, create category-based workspaces:

```json
{
  "folders": [
    { "path": "./mcp-ecosystem", "name": "🔌 MCP Servers" },
    { "path": "./ml-models", "name": "🧠 ML/AI" },
    { "path": "./game-servers", "name": "🎮 Game Servers" },
    { "path": "./agent-frameworks", "name": "🤖 Agents" },
    { "path": "./comfyui-extensions", "name": "🎨 ComfyUI" },
    { "path": "./cad-projects", "name": "📐 3D/CAD" }
  ],
  "settings": {
    "files.exclude": {
      "**/__pycache__": true,
      "**/node_modules": true,
      "**/.git": false,
      "**/runs": true,
      "**/weights": true,
      "**/checkpoints": true
    },
    "search.exclude": {
      "**/data": true,
      "**/datasets": true,
      "**/*.safetensors": true,
      "**/*.pt": true
    }
  }
}
```

---

## The vibe coding workflow that actually works

Andrej Karpathy's vibe coding principle—"see stuff, say stuff, run stuff, copy-paste stuff"—requires systematic execution:

### Phase 1: Planning before coding

```
Prompt: "Tell me your plan first; don't code."
Prompt: "Give me a few options, starting with the simplest first. Don't code."
Prompt: "Think as long as you need and ask me questions if you need more info."
```

### Phase 2: Vertical slice implementation

Build features end-to-end in manageable slices:
1. Define database entities for one feature only
2. Define server operations
3. Build UI components
4. Connect with hooks
5. Test thoroughly
6. Document what was built

### Phase 3: Iteration with context

```
Prompt: "@auth.ts @login-form.tsx Fix the bug where user session isn't persisting"
Prompt: "Act as a Senior React Engineer obsessed with performance. Refactor this component."
Prompt: "Think about 3 different strategies, pick the best one, give your rationale"
```

### Critical mistakes to avoid

**Blindly accepting AI code**: Review every line, understand why it's structured that way. Use `Cmd+Option+J` to check browser console after every change.

**Vague prompts**: Instead of "Build me a social media app," use "Create user auth with JWT, then build post component with validation."

**No version control**: Git provides the safety net beyond IDE checkpoints. Commit at every milestone.

**Ignoring security**: Explicitly include security requirements. Ask "Improve the security of this code" as a separate step.

---

## GPU acceleration for ML development

### WSL2 + CUDA configuration

```bash
# Install CUDA Toolkit
wget https://developer.download.nvidia.com/compute/cuda/repos/wsl-ubuntu/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt-get update
sudo apt-get -y install cuda-toolkit-12-3

# Environment variables
echo 'export PATH=/usr/local/cuda-12.3/bin${PATH:+:${PATH}}' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/cuda-12.3/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}' >> ~/.bashrc
source ~/.bashrc
```

### Dev container with GPU passthrough

```json
{
  "name": "GPU ML Development",
  "image": "nvidia/cuda:12.1.0-devel-ubuntu22.04",
  "runArgs": ["--gpus", "all", "--ipc=host"],
  "hostRequirements": { "gpu": "optional" },
  "remoteEnv": {
    "PATH": "${containerEnv:PATH}:/usr/local/cuda/bin",
    "LD_LIBRARY_PATH": "$LD_LIBRARY_PATH:/usr/local/cuda/lib64"
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-toolsai.jupyter",
        "ms-python.vscode-pylance"
      ]
    }
  },
  "postCreateCommand": "pip install torch torchvision torchaudio"
}
```

---

## Comprehensive .gitignore for ML projects

```gitignore
# Virtual environments
.venv/
venv/
.conda/

# Python cache
__pycache__/
*.py[cod]
*.so

# Model files (CRITICAL - always exclude)
*.ckpt
*.safetensors
*.bin
*.pt
*.pth
*.h5
*.onnx
*.keras

# Model directories
models/
checkpoints/
weights/
pretrained/

# Data files
*.csv
*.parquet
*.pickle
*.npy
*.npz
data/
datasets/

# Logs and outputs
logs/
runs/
outputs/
wandb/
mlruns/
tensorboard/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbbs.db
```

---

## Essential keyboard shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Open Cascade | `⌘+L` | `Ctrl+L` |
| New Cascade conversation | `⌘+⇧+L` | `Ctrl+Shift+L` |
| Force Fast Context | `⌘+Enter` | `Ctrl+Enter` |
| Accept suggestion | `Tab` | `Tab` |
| Accept word-by-word | `⌘+→` | `Alt+Shift+\` |
| Toggle Write/Chat mode | `Ctrl+.` | `Ctrl+.` |
| Command palette | `⌘+⇧+P` | `Ctrl+Shift+P` |
| Accept diff hunk | `⌥+Enter` | `Alt+Enter` |
| Reject diff hunk | `⌥+⇧+Backspace` | `Alt+Shift+Backspace` |

---

## Community resources for continued learning

| Resource | URL | Description |
|----------|-----|-------------|
| **awesome-windsurf** | github.com/ichoosetoaccept/awesome-windsurf | 503+ star community hub |
| **RuleSurf** | github.com/akapug/RuleSurf | Adaptive Project State framework |
| **windsurfrules** | github.com/kinopeee/windsurfrules | Optimized rule templates |
| **Discord** | discord.com/invite/3XFf78nAx5 | 100k+ members |
| **windsurf.run/mcp** | windsurf.run/mcp | Curated MCP server directory |
| **mcp.so** | mcp.so | 17,000+ MCP servers database |

---

## Conclusion: Windsurf optimizes for your exact use case

For a vibe coder managing 401 repositories across MCP servers, ML/AI, game servers, and agent frameworks, Windsurf delivers three decisive advantages: **automatic context indexing** eliminates manual file tagging across massive codebases; **enterprise compliance** (HIPAA, FedRAMP, ITAR) satisfies institutional requirements; and **Cascade Memories** persist project understanding across sessions.

The configuration above—global rules, workspace-specific rules, comprehensive MCP setup, and GPU-accelerated dev containers—creates an environment where you can describe intent in natural language and receive working code. The key insight from vibe coding practitioners: **structure beats speed**. Invest time in PRDs, rules files, and vertical slice planning before prompting. Test after every change. Use Git as your safety net. The AI augments but never replaces human judgment on quality and security.

Your 401-repository portfolio spanning Python (60%), JavaScript (20%), Java (10%), and TypeScript (5%) is precisely the multi-language, multi-domain complexity where Windsurf's automatic RAG indexing outperforms Cursor's manual context system. Enable Turbo Mode for trusted commands, pin critical files for persistent context, and leverage Context7 for up-to-date library documentation. The result: enterprise-grade output from natural language input.
