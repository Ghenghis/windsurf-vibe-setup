# Windsurf Autopilot MCP Server v2.0

> **COMPLETE Zero-Code Autopilot** for vibe coders and non-coders.  
> The AI does EVERYTHING - you never touch a terminal.

## 🚀 What It Does

This MCP server gives Windsurf AI **FULL control** to:

| Capability | What You Say | What Happens |
|------------|--------------|--------------|
| **Run Commands** | "Install express" | AI runs `npm install express` |
| **Create Files** | "Create a config file" | AI writes the file |
| **Edit Files** | "Update the README" | AI modifies it |
| **Git Operations** | "Commit my changes" | AI stages, commits, pushes |
| **Create Projects** | "Make me a website" | AI scaffolds entire project |
| **Fix Issues** | "Fix my setup" | AI diagnoses and repairs |
| **Run Tasks** | "Set everything up" | AI runs multi-step workflow |

## 📦 Installation

### Option 1: Automatic (Recommended)

Open Windsurf and say:
```
"Set up windsurf autopilot for me"
```

### Option 2: Manual

Add to your MCP config (`~/.codeium/windsurf/mcp_config.json`):

```json
{
  "mcpServers": {
    "windsurf-autopilot": {
      "command": "node",
      "args": ["C:\\Users\\Admin\\windsurf-vibe-setup\\mcp-server\\src\\index.js"]
    }
  }
}
```

Then restart Windsurf.

## 🛠️ Available Tools (25 Total)

### Command Execution
| Tool | Description |
|------|-------------|
| `execute_command` | Run ANY terminal command |

### File Operations
| Tool | Description |
|------|-------------|
| `read_file` | Read file contents |
| `write_file` | Create/write files |
| `edit_file` | Find & replace in files |
| `delete_file` | Delete files/folders |
| `list_directory` | List folder contents |
| `search_files` | Search by name or content |

### Git Operations
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
| `run_script` | Run npm scripts |

### Project Creation
| Tool | Description |
|------|-------------|
| `create_project` | Create full project (react, nextjs, python, node, mcp) |

### Task Orchestration
| Tool | Description |
|------|-------------|
| `run_task` | Execute multi-step tasks |
| `continue_task` | Resume/retry/skip failed steps |

### Environment Management
| Tool | Description |
|------|-------------|
| `diagnose_environment` | Find all issues |
| `auto_fix` | Fix issues automatically |
| `complete_setup` | Full environment setup |

### Guidance & Status
| Tool | Description |
|------|-------------|
| `guide_task` | Get step-by-step guidance |
| `get_status` | Check system status |
| `get_history` | View action history |

## 💬 Example Conversations

### Create a Website
```
User: "Create a website called my-portfolio"
AI: [Uses create_project with type=nextjs]
    → Creates Next.js project with TypeScript & Tailwind
    → Initializes git
    → Installs dependencies
    "Done! Open C:\Users\Admin\Projects\my-portfolio to start editing"
```

### Fix Setup Issues
```
User: "Something's wrong with my setup"
AI: [Uses diagnose_environment]
    → Found 3 issues
    "I found some problems. Want me to fix them?"

User: "Yes, fix everything"
AI: [Uses auto_fix with all=true]
    → Fixed MCP config
    → Installed global rules
    → Created Projects folder
    "All fixed! Restart Windsurf to apply changes."
```

### Git Workflow
```
User: "Commit my changes and push"
AI: [Uses git_status]
    → 5 files changed

    [Uses git_commit with message="feat: add new features"]
    → Changes committed

    [Uses git_push]
    → Pushed to origin/main
    "Done! Your changes are live."
```

### Install Packages
```
User: "I need axios and lodash for my project"
AI: [Uses install_packages with packages=["axios", "lodash"]]
    → npm install axios lodash
    "Installed! You can now import them in your code."
```

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WINDSURF IDE                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Cascade AI                          │   │
│  │  "Create a website" → understands intent            │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           windsurf-autopilot MCP Server              │   │
│  │                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │ Commands │ │  Files   │ │   Git    │            │   │
│  │  │execute_  │ │read/write│ │commit/   │            │   │
│  │  │command   │ │edit/list │ │push/pull │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  │                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │ Packages │ │ Projects │ │  Tasks   │            │   │
│  │  │npm/pip   │ │scaffold  │ │multi-step│            │   │
│  │  │install   │ │create    │ │workflows │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  │                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │ Diagnose │ │ Auto-Fix │ │  Status  │            │   │
│  │  │find      │ │repair    │ │check all │            │   │
│  │  │issues    │ │auto      │ │systems   │            │   │
│  │  └──────────┘ └──────────┘ └──────────┘            │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               YOUR FILE SYSTEM                       │   │
│  │  ~/Projects/  ~/.codeium/  package.json  etc.       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 For Non-Coders

You literally just talk to Windsurf:

1. **"Set everything up"** → Full environment configuration
2. **"Make me a website called my-site"** → Complete project created
3. **"Add a contact form"** → AI writes the code
4. **"Something's broken"** → AI diagnoses and fixes
5. **"Save my work"** → AI commits and pushes to Git

**You NEVER need to:**
- Open a terminal
- Run commands
- Know what npm/pip/git is
- Understand file paths
- Debug errors manually

## 📁 Project Structure

```
mcp-server/
├── src/
│   └── index.js      # Main server (1963 lines, 25 tools)
├── package.json      # Dependencies
└── README.md         # This file
```

## 🔒 Security Notes

- The server runs commands as your user
- It can access your entire file system
- Only use with trusted AI models
- Review actions before major operations

## 📝 Version History

- **v2.0.0** - Complete rewrite with 25 tools
- **v1.0.0** - Initial release with 6 tools

## 🆘 Troubleshooting

### Server Not Starting
```
User: "Check my status"
```
If no response, restart Windsurf.

### Commands Failing
The AI will show you the error and suggest fixes automatically.

### Need Help
Just ask: "What can you help me with?"

---

**Built for vibe coders who want to create, not configure.** 🚀
