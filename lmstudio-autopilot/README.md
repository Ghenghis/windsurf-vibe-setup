# LM Studio Autopilot MCP Server

> Zero-code task completion for local LLM users

Runs **separately** from windsurf-autopilot — no conflicts when using both!

## Features

- **Works offline** — Uses your local LLMs
- **No API keys** — Everything runs locally
- **Project creation** — React, Next.js, Python, Node
- **System diagnostics** — Checks Node, Git, Python
- **Zero conflicts** — Different server identity from windsurf-autopilot

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

## Available Tools

| Tool | What It Does |
|------|--------------|
| `get_status` | Check if system is ready |
| `diagnose_environment` | Find issues (Node, Git, Python) |
| `auto_fix` | Create directories automatically |
| `complete_setup` | Set up LM Studio environment |
| `create_project` | Create new projects |
| `guide_task` | Get step-by-step help |

## Example Usage

Just tell your local LLM:
- "Check my system status"
- "Create a new Python project called my-api"
- "What can you help me with?"

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
