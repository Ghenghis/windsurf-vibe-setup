# LM Studio Autopilot MCP Server v3.0.0 - ENTERPRISE EDITION

> **120+ Tools** | **100% Technical Autopilot** | **Zero-Code Development**

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
      "args": ["C:\\Users\\YOUR_USERNAME\\windsurf-vibe-setup\\lmstudio-autopilot\\src\\index.js"]
    }
  }
}
```

## Files

| File | Description |
|------|-------------|
| `src/index.js` | Main MCP server (v3.0.0) |
| `src/additional-tools.js` | v2.1 intelligence tools |
| `src/advanced-tools.js` | v2.2 AI decision engine |
| `src/autopilot-intelligence.js` | v2.3 learning engine |
| `src/realtime-ai-engine.js` | v2.4 web integration |
| `src/ultimate-tools.js` | v2.5 ULTIMATE tools (40) |
| `src/database-tools.js` | v2.6 database integration |
| `src/embedding-tools.js` | v2.6 semantic search |
| `src/context-tools.js` | v2.6 context persistence |
| `src/recovery-tools.js` | v2.6 error recovery |
| `src/plugin-tools.js` | v2.6 plugin system |
| `src/workflow-tools.js` | v3.0 workflow automation |
| `src/team-tools.js` | v3.0 team collaboration |
| `src/cloud-tools.js` | v3.0 cloud sync |
| `src/model-tools.js` | v3.0 AI model management |
| `src/agent-tools.js` | v3.0 multi-agent orchestration |

## Tool Categories (120+)

### v3.0 NEW Tools (25)
- 🔄 Workflows: `create_workflow`, `run_workflow`, `edit_workflow`, `share_workflow`, `workflow_templates`
- 👥 Teams: `create_team`, `invite_member`, `share_settings`, `team_templates`, `activity_log`, `list_teams`
- ☁️ Cloud: `cloud_login`, `sync_settings`, `sync_templates`, `sync_history`
- 🤖 Models: `add_model`, `switch_model`, `model_benchmark`, `fine_tune`, `list_models`
- 🕵️ Agents: `create_agent`, `assign_task`, `agent_status`, `agent_collaborate`, `list_agents`

### v2.6 NEW Tools (21)
- 🗄️ Database: `db_connect`, `db_schema`, `db_backup`, `db_restore`, `db_query_direct`
- 🔍 Search: `embed_text`, `semantic_search`, `index_project`
- 💾 Context: `save_context`, `load_context`, `clear_context`, `get_context`, `list_contexts`
- 🔙 Recovery: `create_checkpoint`, `rollback`, `auto_recover`, `list_checkpoints`
- 🔌 Plugins: `install_plugin`, `list_plugins`, `uninstall_plugin`, `create_plugin`

### v2.5 Tools (40)
- ☁️ Cloud Deployment: `deploy_vercel`, `deploy_netlify`, `deploy_railway`, `deploy_docker_hub`
- 🔄 CI/CD: `setup_github_actions`, `setup_gitlab_ci`, `run_pipeline`, `check_pipeline_status`
- 🔧 Code Ops: `refactor_code`, `generate_docs`, `code_review`, `find_dead_code`, `analyze_complexity`
- 🔒 Security: `security_audit`, `update_dependencies`, `check_licenses`, `scan_secrets`
- 🌐 API: `test_api`, `mock_server`, `generate_api_docs`
- 📁 Templates: `save_template`, `list_templates`, `use_template`
- 🔔 Notifications: `notify`, `send_webhook`, `schedule_task`
- 📄 Files: `file_diff`, `file_merge`, `bulk_rename`, `find_replace_all`
- 📊 Logs: `analyze_logs`, `tail_logs`, `search_logs`
- ⚡ Performance: `benchmark_project`, `profile_app`, `analyze_bundle`
- 🏢 Workspace: `switch_project`, `list_projects`, `project_health`, `cleanup_project`

### Previous Tools (v2.0-v2.4)
- Commands, Files, Git, Packages, Projects, Tasks, Environment
- Error handling, HTTP, Code quality, Testing, Process, Docker
- AI decision, Code generation, Database, Backup, Progress
- Learning, Web search, Knowledge graph, Feedback

## Sync with Windsurf

Both servers share the same codebase. To sync:

```powershell
# Copy from mcp-server to lmstudio-autopilot
Copy-Item -Path "mcp-server\src\*" -Destination "lmstudio-autopilot\src\" -Force
```

## Testing

```bash
# Syntax check
node --check src/index.js

# Start server (for testing)
node src/index.js
```

## Version

- **Version**: 2.5.0 ULTIMATE EDITION
- **Tools**: 80+
- **Autopilot**: 95%
