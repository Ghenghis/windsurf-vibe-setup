# Windsurf Autopilot MCP Server v2.5.0 - ULTIMATE EDITION

> **80+ Tools** | **95% Autopilot** | **Zero-Code Development**

## Overview

This is the MCP (Model Context Protocol) server that powers Windsurf Autopilot. It provides 80+ tools for complete development automation.

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

Add to `~/.codeium/windsurf/mcp_config.json`:

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

## Files

| File | Description |
|------|-------------|
| `src/index.js` | Main MCP server (v2.5.0) |
| `src/additional-tools.js` | v2.1 intelligence tools |
| `src/advanced-tools.js` | v2.2 AI decision engine |
| `src/autopilot-intelligence.js` | v2.3 learning engine |
| `src/realtime-ai-engine.js` | v2.4 web integration |
| `src/ultimate-tools.js` | v2.5 ULTIMATE tools (40 new) |

## Tool Categories (80+)

### v2.5 NEW Tools (40)
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
