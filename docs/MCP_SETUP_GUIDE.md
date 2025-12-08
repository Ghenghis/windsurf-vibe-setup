# MCP Setup Guide - Model Context Protocol Servers

> Give your AI superpowers with MCP servers

---

## 🚀 Zero-Code Option

**Don't want to configure anything?** Just tell Windsurf:

> "Set up MCP servers for me"

The **Autopilot MCP Server** will install everything automatically!

---

## What Are MCP Servers?

**MCP (Model Context Protocol)** servers extend your AI assistant's capabilities. Think of them as "plugins" that let Cascade AI:

- 🤖 **Autopilot** — Zero-code setup and self-repair (our custom server!)
- 🔗 Connect to GitHub and manage repositories
- 📁 Access and modify files on your computer
- 🐳 Control Docker containers
- 🔍 Search the web
- 🗄️ Query databases
- 🧠 Remember things across conversations

---

## Quick Setup

### Step 1: Copy the Example Config

```powershell
# Create the config folder if needed
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codeium\windsurf"

# Copy the example config
Copy-Item .\examples\mcp_config.json "$env:USERPROFILE\.codeium\windsurf\"
```

### Step 2: Edit with Your API Keys

Open the file in a text editor:
```powershell
notepad "$env:USERPROFILE\.codeium\windsurf\mcp_config.json"
```

### Step 3: Restart Windsurf

Close and reopen Windsurf for MCP servers to load.

---

## Available MCP Servers

### 🤖 Autopilot Server (Our Custom Server!)

| Server | Purpose | API Key Needed? |
|--------|---------|-----------------|
| **windsurf-autopilot** | Zero-code setup, diagnosis, repair, project creation | No |

**Tools provided:**
- `get_status` — Check system readiness
- `diagnose_environment` — Find issues automatically
- `auto_fix` — Repair problems without commands
- `complete_setup` — Full automatic installation
- `create_project` — Create React/Python/Node projects
- `guide_task` — Step-by-step assistance

### Essential Servers (Recommended)

| Server | Purpose | API Key Needed? |
|--------|---------|-----------------|
| **filesystem** | Read/write local files | No |
| **git** | Git operations | No |
| **memory** | Persistent AI memory | No |
| **fetch** | HTTP requests | No |
| **context7** | Library documentation | No |

### Extended Servers (Optional)

| Server | Purpose | API Key Needed? |
|--------|---------|-----------------|
| **github** | GitHub API access | Yes (PAT) |
| **docker** | Container management | No |
| **brave-search** | Web search | Yes |
| **puppeteer** | Browser automation | No |
| **playwright** | Browser testing | No |
| **postgresql** | Database queries | Connection string |
| **sqlite** | Local database | No |

---

## Server Configuration Details

### Filesystem Server

**Purpose**: Lets AI read and write files in specific directories.

**Config**:
```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "C:/Users/YourName/Projects",
    "C:/Users/YourName/Documents"
  ]
}
```

**⚠️ Security Warning**: Only grant access to directories you trust AI with!

**Don't include**:
- Home directory (`~` or `C:/Users/YourName`)
- System folders (`C:/Windows`, `/etc`)
- Credential folders (`.ssh`, `.aws`)

---

### GitHub Server

**Purpose**: Manage repos, issues, PRs, and Actions.

**Requirements**:
1. Create a Personal Access Token (PAT):
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `read:org`, `read:user`
   - Copy the token

2. **Config**:
```json
"github": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github", "--toolsets", "repos,issues,prs,actions"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
  }
}
```

**Better: Use Environment Variable**:
```json
"env": {
  "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PAT}"
}
```

Then set in PowerShell:
```powershell
[System.Environment]::SetEnvironmentVariable('GITHUB_PAT', 'ghp_xxxx', 'User')
```

---

### Context7 Server

**Purpose**: Fetches up-to-date library documentation.

**Config**:
```json
"context7": {
  "command": "npx",
  "args": ["-y", "@upstash/context7-mcp@latest"]
}
```

**Usage**: Add `use context7` to your prompts:
```
use context7 - How do I use React hooks?
```

---

### Memory Server

**Purpose**: Persistent knowledge graph AI can reference.

**Config**:
```json
"memory": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-memory"]
}
```

**Usage Examples**:
```
Remember that my project uses Python 3.11
What do you remember about my project?
```

---

### Docker Server

**Purpose**: Manage containers without leaving Windsurf.

**Config**:
```json
"docker": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-docker"]
}
```

**Requirements**: Docker Desktop must be running.

---

### Brave Search Server

**Purpose**: Web search directly from AI.

**Requirements**:
1. Get API key: https://brave.com/search/api/
2. Add to config:

```json
"brave-search": {
  "command": "npx",
  "args": ["-y", "@brave/brave-search-mcp-server"],
  "env": {
    "BRAVE_API_KEY": "your_brave_api_key"
  }
}
```

---

### Database Servers

#### PostgreSQL
```json
"postgresql": {
  "command": "npx",
  "args": [
    "-y",
    "@executeautomation/database-server",
    "--postgresql",
    "--host", "localhost",
    "--database", "mydb",
    "--user", "postgres",
    "--password", "${POSTGRES_PASSWORD}"
  ]
}
```

#### SQLite
```json
"sqlite": {
  "command": "npx",
  "args": [
    "-y",
    "@executeautomation/database-server",
    "C:/path/to/database.db"
  ]
}
```

---

## Complete Example Config

Here's a full `mcp_config.json` with common servers:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:/Users/Admin/Projects"
      ]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PAT}"
      }
    },
    "docker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-docker"]
    }
  }
}
```

---

## Verifying MCP Servers Work

### 1. Check Windsurf Logs

After restarting Windsurf, check if servers loaded:
```powershell
# View recent logs
Get-Content "$env:USERPROFILE\.codeium\windsurf\logs\mcp*.log" -Tail 50
```

### 2. Test in Cascade

Open Cascade (Ctrl+L) and try:
```
What MCP tools do you have available?
```

Or test specific servers:
```
# GitHub
List my GitHub repositories

# Filesystem
List files in C:/Users/Admin/Projects

# Memory
Remember that today is project setup day
```

---

## Troubleshooting MCP

### "MCP server failed to start"

**Causes**:
1. **npx not found**: Install Node.js
2. **Invalid JSON**: Check config syntax
3. **Missing API key**: Add required environment variables

**Debug**:
```powershell
# Test if npx works
npx --version

# Test a server manually
npx -y @modelcontextprotocol/server-git
# Should wait for input (press Ctrl+C to exit)
```

### "Tool not found" errors

**Cause**: Server didn't load properly.

**Fix**:
1. Check JSON syntax
2. Restart Windsurf completely
3. Check logs for errors

### "Permission denied" for filesystem

**Cause**: Path doesn't exist or can't be accessed.

**Fix**:
```powershell
# Verify path exists
Test-Path "C:/Users/Admin/Projects"

# Use forward slashes or escaped backslashes
"C:/Users/Admin/Projects"     # Good
"C:\\Users\\Admin\\Projects"  # Also good
"C:\Users\Admin\Projects"     # Bad in JSON!
```

---

## Security Best Practices

### ✅ Do

- Use environment variables for API keys
- Limit filesystem access to specific folders
- Review what each MCP server can do
- Keep MCP packages updated

### ❌ Don't

- Hardcode API keys in config
- Grant access to home directory
- Grant access to `.ssh`, `.aws`, or credential folders
- Use MCP servers you don't understand

---

## Finding More MCP Servers

- **Official MCP servers**: https://github.com/modelcontextprotocol
- **Community directory**: https://mcp.so
- **Windsurf curated**: https://windsurf.run/mcp

---

## Next Steps

- [WORKFLOW.md](WORKFLOW.md) - Learn daily vibe coding workflow
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Fix common problems
- [ARCHITECTURE.md](ARCHITECTURE.md) - Understand the full system
