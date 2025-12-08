# Windsurf Autopilot MCP Server

> Zero-code task completion for vibe coders

This MCP server gives Windsurf AI the ability to:
- **Set itself up** - No commands needed
- **Diagnose issues** - Find what's wrong
- **Auto-fix problems** - Repair without user input
- **Create projects** - Just describe what you want
- **Guide users** - Step-by-step assistance

## For Users (Non-Coders)

You don't need to do anything! Just tell Windsurf what you want:

### Example Conversations

**Setup:**
> "Set up Windsurf for me"
> 
> AI will automatically install all configurations.

**Fix Issues:**
> "Something's not working right"
> 
> AI will diagnose and fix automatically.

**Create Project:**
> "Create a new website called my-portfolio"
> 
> AI will create the project with all the right files.

## Available Tools

| Tool | What It Does |
|------|--------------|
| `diagnose_environment` | Checks for issues |
| `auto_fix` | Fixes a specific issue |
| `complete_setup` | Full automatic setup |
| `create_project` | Creates new projects |
| `guide_task` | Explains what AI will do |
| `get_status` | Shows system status |

## Installation

This server is included in the Windsurf Vibe Setup project. To activate:

1. The setup script adds it to your MCP config automatically
2. Restart Windsurf
3. Start asking for help!

## Manual Installation

If needed, add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "windsurf-autopilot": {
      "command": "node",
      "args": ["path/to/windsurf-vibe-setup/mcp-server/src/index.js"]
    }
  }
}
```

## Philosophy

**Users should never need to:**
- Type commands
- Edit configuration files
- Understand code
- Debug errors manually

**Windsurf AI should:**
- Handle everything automatically
- Explain what it's doing
- Fix its own problems
- Guide users conversationally
