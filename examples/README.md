# Configuration Examples

This directory contains example configuration files to help you set up Windsurf IDE.

## Files

| File | Description | Destination |
|------|-------------|-------------|
| `global_rules.md` | AI assistant behavior rules | `~/.codeium/windsurf/memories/global_rules.md` |
| `mcp_config.json` | MCP server configuration | `~/.codeium/windsurf/mcp_config.json` |
| `windsurf-vibe.code-workspace` | Multi-project workspace template | Your project root |

## Usage

### Global Rules

Copy `global_rules.md` to your Codeium config directory:

**Windows:**
```powershell
Copy-Item .\examples\global_rules.md "$env:USERPROFILE\.codeium\windsurf\memories\"
```

**Linux/macOS:**
```bash
cp ./examples/global_rules.md ~/.codeium/windsurf/memories/
```

### MCP Configuration

1. Edit `mcp_config.json` with your paths and API keys
2. Copy to your Codeium config directory:

**Windows:**
```powershell
Copy-Item .\examples\mcp_config.json "$env:USERPROFILE\.codeium\windsurf\"
```

### Workspace Template

1. Copy `windsurf-vibe.code-workspace` to your projects root
2. Modify the `folders` array to point to your actual project directories
3. Open with: **File > Open Workspace from File...**

## Notes

- The workspace file may show lint warnings for debug configurations - these are resolved when the required extensions (Python, PowerShell) are installed
- Replace placeholder values (e.g., `YourUsername`, `${GITHUB_PAT}`) with your actual values
- API keys should use environment variable references (`${VAR_NAME}`) instead of hardcoded values
