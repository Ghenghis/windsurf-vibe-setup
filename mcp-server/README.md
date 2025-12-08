# 🚀 Windsurf Autopilot MCP Server

> **Zero-Code Project Automation for Vibe Coders**
> 
> Let AI handle ALL the technical work. You describe, Autopilot builds.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-purple.svg)]()

---

## 🎯 What is Windsurf Autopilot?

**Windsurf Autopilot** is an MCP (Model Context Protocol) server that gives Windsurf AI **complete control** over your development environment. Instead of copying commands or writing code yourself, you simply tell the AI what you want:

```
You: "Create me a website called my-portfolio"
AI: ✅ Created Next.js project with TypeScript, Tailwind, all dependencies installed, Git initialized
```

```
You: "Fix the errors in my project"
AI: ✅ Found 3 linting errors, 1 missing dependency, 2 type errors - all fixed
```

```
You: "Push my changes to GitHub"
AI: ✅ Staged all files, committed with message, pushed to origin/main
```

---

## ✨ Features

### 🖥️ Command Execution
- Execute **ANY** terminal command
- npm, pip, git, docker - everything works
- Background processes supported
- Automatic timeout handling

### 📁 File Operations
- Read, write, edit any file
- Create directories automatically
- Search files by name or content
- Pattern-based file discovery

### 🔀 Git Version Control
- Status, commit, push, pull
- Branch management
- Clone repositories
- Full Git workflow

### 📦 Package Management
- Auto-detect npm, pip, yarn, pnpm
- Install dependencies
- Run project scripts
- Dev/prod dependency handling

### 🏗️ Project Creation
| Template | What You Get |
|----------|-------------|
| `react` | Vite + React + TypeScript |
| `nextjs` | Next.js + TypeScript + Tailwind + App Router |
| `python` | FastAPI + uvicorn + pytest + venv |
| `node` | Express + Jest + ESLint |
| `mcp` | MCP Server template |
| `empty` | Blank project with Git |

### 🔧 Environment Management
- Diagnose system issues
- Auto-fix problems
- One-command complete setup
- Health monitoring

### 🤖 Task Automation
- Multi-step task execution
- Automatic error recovery
- Continue/retry/skip on failure
- Task history tracking

---

## 📦 Installation

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org))
- **Windsurf IDE** ([Download](https://codeium.com/windsurf))
- **Git** (recommended)

### Quick Install

```bash
# Clone the repository
git clone https://github.com/Ghenghis/windsurf-vibe-setup.git
cd windsurf-vibe-setup

# Install dependencies
npm install
cd mcp-server && npm install && cd ..

# Run setup
npm run setup
```

### Configure Windsurf

Add to your MCP config (`~/.codeium/windsurf/mcp_config.json`):

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

**Restart Windsurf** to activate.

---

## 🎮 Usage

Just talk to Windsurf naturally. The AI will use Autopilot tools automatically.

### Basic Commands

| What You Say | What Happens |
|-------------|--------------|
| "Check my status" | Shows system readiness |
| "What can you help me with?" | Lists all capabilities |
| "Create a website called portfolio" | Creates full Next.js project |
| "Create a Python API called my-api" | Creates FastAPI project |
| "Fix any issues" | Diagnoses and repairs problems |

### Project Creation

```
"Make me a React app called dashboard"
"Create a Python backend for user management"  
"Start a new MCP server project called my-tools"
```

### Git Operations

```
"What's my git status?"
"Commit these changes as 'Added login feature'"
"Push to GitHub"
"Pull the latest changes"
```

### File Operations

```
"Show me what's in the src folder"
"Search for files containing 'TODO'"
"Create a new file called utils.js"
"Edit package.json and update the version"
```

### Task Automation

```
"Set up everything for me"
"Run the development server"
"Install axios and lodash"
"Run my tests"
```

---

## 🛠️ Available Tools

### Command & Process
| Tool | Description |
|------|-------------|
| `execute_command` | Run any terminal command |
| `run_script` | Execute npm scripts |

### File System
| Tool | Description |
|------|-------------|
| `read_file` | Read file contents |
| `write_file` | Create/overwrite files |
| `edit_file` | Find and replace in files |
| `delete_file` | Delete files/folders |
| `list_directory` | List folder contents |
| `search_files` | Search by name/content |

### Git
| Tool | Description |
|------|-------------|
| `git_status` | Check repo status |
| `git_commit` | Stage and commit |
| `git_push` | Push to remote |
| `git_pull` | Pull from remote |
| `git_clone` | Clone repository |
| `git_branch` | Manage branches |

### Package Management
| Tool | Description |
|------|-------------|
| `install_packages` | Install npm/pip packages |
| `run_script` | Run package.json scripts |

### Project
| Tool | Description |
|------|-------------|
| `create_project` | Create new projects |
| `diagnose_environment` | Check for issues |
| `auto_fix` | Fix detected issues |
| `complete_setup` | Full environment setup |

### Orchestration
| Tool | Description |
|------|-------------|
| `run_task` | Execute multi-step tasks |
| `continue_task` | Resume failed tasks |
| `guide_task` | Get step-by-step guidance |
| `get_status` | Current system status |
| `get_history` | Action history |

---

## 🗂️ Project Structure

```
windsurf-vibe-setup/
├── mcp-server/              # Windsurf Autopilot MCP Server
│   ├── src/
│   │   └── index.js         # Main server (1,900+ lines)
│   ├── package.json
│   └── README.md
├── lmstudio-autopilot/      # LM Studio version (separate)
│   ├── src/
│   │   └── index.js
│   └── package.json
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md
│   ├── QUICKSTART.md
│   ├── WORKFLOW.md
│   └── ...
├── examples/                # Example configurations
│   ├── global_rules.md
│   └── mcp_config.json
├── scripts/                 # Utility scripts
│   ├── setup-windows.ps1
│   └── setup-unix.sh
├── templates/               # Project templates
│   └── workspace-rules/
├── settings.json            # Windsurf IDE settings
└── README.md
```

---

## 🔧 Configuration

### Paths Used

| Path | Purpose |
|------|---------|
| `~/.codeium/windsurf/` | MCP config, memories |
| `~/Projects/` | Default project location |
| `%APPDATA%/Windsurf/User/` | Windsurf settings (Windows) |

### Customization

Edit `mcp-server/src/index.js` to customize:
- Default project location
- Supported project templates  
- Tool behaviors

---

## 🐛 Troubleshooting

### "Tools not appearing in Windsurf"
1. Verify MCP config path is correct
2. Check Node.js path in config uses full path
3. Restart Windsurf completely

### "Command failed"
- Check the error message in the output
- Ensure the working directory exists
- Verify required tools are installed (Git, npm, etc.)

### "Project creation failed"
- Ensure Node.js 18+ is installed
- Check internet connection for package downloads
- Verify write permissions to project directory

### Get Diagnostics
```
"Run diagnose_environment and show me the results"
```

---

## 🚀 Roadmap

### v2.1 - Smart Autopilot
- [ ] `analyze_project` - Understand any project
- [ ] `detect_tech_stack` - Auto-detect frameworks
- [ ] `smart_retry` - Intelligent error recovery
- [ ] `analyze_error` - Error understanding

### v2.2 - Quality & Testing
- [ ] `run_tests` - Execute tests
- [ ] `lint_code` - Code linting
- [ ] `format_code` - Auto-formatting
- [ ] `fix_lint_errors` - Auto-fix

### v2.3 - Process & Docker
- [ ] `start_server` - Dev server management
- [ ] `docker_build` - Container builds
- [ ] `docker_run` - Run containers

### v3.0 - Full Autonomy
- [ ] `decide_next_step` - AI decision making
- [ ] `find_solution` - Problem solving
- [ ] `generate_tests` - Test generation

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) - MCP Protocol
- [Codeium](https://codeium.com) - Windsurf IDE
- The vibe coding community

---

<div align="center">

**Built for vibe coders who dream big and code zero.**

[Report Bug](https://github.com/Ghenghis/windsurf-vibe-setup/issues) · [Request Feature](https://github.com/Ghenghis/windsurf-vibe-setup/issues)

</div>
