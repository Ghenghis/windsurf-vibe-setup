# LM Studio Autopilot MCP Server v2.0

> **Complete Zero-Code Autopilot** for local LLM users

Runs **separately** from windsurf-autopilot — no conflicts when using both!

## 🚀 v2.0 Features

### Command Execution
- **Execute ANY command** — npm, pip, git, shell commands
- **Background processes** — Start servers without blocking
- **Timeout control** — Safe execution with limits

### File Operations
- **Read/Write/Edit** — Full file system access
- **Search files** — Find by name or content
- **Directory management** — List, create, delete

### Git Integration
- **Full Git control** — status, commit, push, pull, clone, branch
- **Automated commits** — Stage and commit automatically

### Project Creation
- **React** — Vite + TypeScript
- **Next.js** — TypeScript + Tailwind + App Router
- **Python** — FastAPI + uvicorn + tests
- **Node.js** — Express server
- **MCP Server** — Custom MCP server template

### Task Orchestration
- **Multi-step tasks** — Run complex workflows
- **Error recovery** — Retry, skip, or abort failed steps
- **History tracking** — See what happened

## Setup in LM Studio

1. **Open LM Studio** → Settings → MCP Servers

2. **Add this config:**
```json
{
  "lmstudio-autopilot": {
    "command": "node",
    "args": ["C:\\Users\\Admin\\windsurf-vibe-setup\\lmstudio-autopilot\\src\\index.js"]
  }
}
```

3. **Restart LM Studio**

## Available Tools (22 Total)

### Command & File Operations
| Tool | Description |
|------|-------------|
| `execute_command` | Run ANY terminal command |
| `read_file` | Read file contents |
| `write_file` | Create or overwrite files |
| `edit_file` | Find and replace in files |
| `delete_file` | Remove files/directories |
| `list_directory` | List files in directory |
| `search_files` | Search by name or content |

### Git Operations
| Tool | Description |
|------|-------------|
| `git_status` | Repository status |
| `git_commit` | Stage and commit |
| `git_push` | Push to remote |
| `git_pull` | Pull from remote |
| `git_clone` | Clone repository |
| `git_branch` | Manage branches |

### Project & Package Management
| Tool | Description |
|------|-------------|
| `create_project` | Create full project structure |
| `install_packages` | npm/pip package installation |
| `run_script` | Run npm scripts |

### Task Orchestration
| Tool | Description |
|------|-------------|
| `run_task` | Execute multi-step workflows |
| `continue_task` | Handle failed steps |

### Environment
| Tool | Description |
|------|-------------|
| `diagnose_environment` | Find issues |
| `auto_fix` | Fix problems automatically |
| `complete_setup` | Full setup in one command |
| `guide_task` | Get step-by-step guidance |
| `get_status` | System readiness |
| `get_history` | Action history |

## Example Usage

Just tell your local LLM:
- "Create a React project called my-app"
- "Run npm install in /path/to/project"
- "Commit my changes with message 'feat: add login'"
- "Search for TODO in my project"
- "What's my git status?"

## Differences from windsurf-autopilot

| Feature | windsurf-autopilot | lmstudio-autopilot |
|---------|-------------------|-------------------|
| Target | Windsurf IDE | LM Studio |
| Paths | ~/.codeium/windsurf | ~/.lmstudio |
| Server name | windsurf-autopilot | lmstudio-autopilot |
| Can run together | ✅ Yes | ✅ Yes |

## Install Dependencies

```bash
cd lmstudio-autopilot
npm install
```

## Test Locally

```bash
node src/index.js
```
