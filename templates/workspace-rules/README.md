# Workspace Rules Templates

Pre-made AI behavior rules for common project types.

## Usage

1. Choose the template that matches your project type
2. Copy to your project: `.windsurf/rules/`
3. Rename to match your needs
4. Customize as needed

### Quick Setup

```powershell
# Create rules directory in your project
mkdir .windsurf/rules

# Copy a template
cp templates/workspace-rules/react-app.md .windsurf/rules/
```

## Available Templates

| Template | Best For |
|----------|----------|
| `react-app.md` | React, Next.js, frontend projects |
| `python-api.md` | FastAPI, Django, Flask backends |
| `ml-project.md` | PyTorch, TensorFlow, ML research |
| `mcp-server.md` | MCP server development |
| `docker-project.md` | Containerized applications |

## Creating Custom Rules

1. Start from the closest template
2. Modify the tech stack section
3. Add project-specific conventions
4. Include team coding standards
5. Document what NOT to do

## How Rules Work

- **Global rules** (`~/.codeium/windsurf/memories/global_rules.md`) apply everywhere
- **Workspace rules** (`.windsurf/rules/*.md`) apply only to that project
- Workspace rules override global rules for conflicts
- Multiple rule files can be combined
