# LM Studio Autopilot MCP Server v3.1.0 - EXTENDED INTEGRATIONS

> **156+ Tools** | **100%+ Technical Autopilot** | **Extended Integrations**

## Overview

This is the MCP server for LM Studio integration. It's identical to the Windsurf MCP server but configured for LM Studio.

## Installation

```bash
cd lmstudio-autopilot
npm install
```

## Configuration

Configure LM Studio to use this MCP server:

```json
{
  "mcpServers": {
    "lmstudio-autopilot": {
      "command": "node",
      "args": ["/path/to/windsurf-vibe-setup/lmstudio-autopilot/src/index.js"]
    }
  }
}
```

## Source Files

| File | Description | Tools |
|------|-------------|-------|
| `index.js` | Main MCP server | Core |
| `additional-tools.js` | v2.1 intelligence | 16 |
| `advanced-tools.js` | v2.2 AI decisions | 16 |
| `autopilot-intelligence.js` | v2.3 learning | 8 |
| `realtime-ai-engine.js` | v2.4 web/AI | 11 |
| `ultimate-tools.js` | v2.5 cloud/CI | 40 |
| `database-tools.js` | v2.6 database | 5 |
| `embedding-tools.js` | v2.6 vectors | 3 |
| `context-tools.js` | v2.6 context | 5 |
| `recovery-tools.js` | v2.6 recovery | 4 |
| `plugin-tools.js` | v2.6 plugins | 4 |
| `workflow-tools.js` | v3.0 workflows | 5 |
| `team-tools.js` | v3.0 teams | 6 |
| `cloud-tools.js` | v3.0 cloud sync | 4 |
| `model-tools.js` | v3.0 AI models | 5 |
| `agent-tools.js` | v3.0 multi-agent | 5 |

## Tool Categories (120+)

### v3.0 Enterprise (25 tools)
- 🔄 Workflows: create, run, edit, share, templates
- 👥 Teams: create, invite, share, templates, activity, list
- ☁️ Cloud: login, sync_settings, sync_templates, sync_history
- 🤖 Models: add, switch, benchmark, fine_tune, list
- 🕵️ Agents: create, assign, status, collaborate, list

### v2.6 Data (21 tools)
- 🗄️ Database: connect, schema, backup, restore, query
- 🔍 Embeddings: embed, search, index
- 💾 Context: save, load, clear, get, list
- 🔙 Recovery: checkpoint, rollback, auto_recover, list
- 🔌 Plugins: install, list, uninstall, create

### v2.5 Ultimate (40 tools)
- ☁️ Deploy: vercel, netlify, railway, docker_hub
- 🔄 CI/CD: github_actions, gitlab_ci, run, status
- 🔧 Code: refactor, docs, review, dead_code, complexity
- 🔒 Security: audit, dependencies, licenses, secrets
- And 24 more...

## Data Storage Locations

| OS | Path |
|-----|------|
| Windows | `%APPDATA%\WindsurfAutopilot\` |
| macOS | `~/.windsurf-autopilot/` |
| Linux | `~/.windsurf-autopilot/` |

## Sync with Windsurf

Both servers share the same codebase. To sync:

```powershell
# Copy from mcp-server to lmstudio-autopilot
Copy-Item -Path "mcp-server\src\*" -Destination "lmstudio-autopilot\src\" -Force -Recurse
```

## Testing

```bash
# Syntax check
node --check src/index.js

# Start server (for testing)
node src/index.js
```

## v3.1 Roadmap

Planned additions:
- Infrastructure as Code (Terraform, K8s)
- Advanced Testing (E2E, Visual, Load)
- Communications (Slack, Discord, Teams)
- Project Management (Jira, Linear)
- And more...

## Version

- **Version**: 3.0.0 ENTERPRISE EDITION
- **Tools**: 120+
- **Autopilot**: 100% Technical
