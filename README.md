# Windsurf Vibe Setup

> Enterprise-grade Windsurf IDE configuration for vibe coding excellence

[![CI Pipeline](https://github.com/Ghenghis/windsurf-vibe-setup/actions/workflows/ci.yml/badge.svg)](https://github.com/Ghenghis/windsurf-vibe-setup/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

A professional, production-ready Windsurf IDE configuration optimized for:
- **Multi-language development** (Python, JavaScript, TypeScript, PowerShell)
- **AI/ML workflows** with GPU acceleration
- **100+ repository management**
- **Enterprise security** with command deny lists

## Opening This Project in Windsurf IDE

### Option 1: From Command Line
```powershell
# Navigate to project and open in Windsurf
cd C:\Users\Admin\windsurf-vibe-setup
windsurf .
```

### Option 2: From Windsurf IDE
1. Open Windsurf IDE
2. Go to **File > Open Folder**
3. Navigate to `C:\Users\Admin\windsurf-vibe-setup`
4. Click **Select Folder**

### Option 3: From File Explorer
1. Navigate to `C:\Users\Admin\windsurf-vibe-setup`
2. Right-click in the folder
3. Select **Open with Windsurf** (if available)

## Quick Start

### Clone from GitHub
```bash
git clone https://github.com/Ghenghis/windsurf-vibe-setup.git
cd windsurf-vibe-setup
npm install
```

### Local Development (Already Cloned)
```powershell
cd C:\Users\Admin\windsurf-vibe-setup
npm install
```

## Features

- **Security**: Command deny list, credential file exclusions
- **Performance**: Optimized file watcher, smart search exclusions
- **Code Quality**: ESLint, Prettier, Markdownlint
- **Testing**: Triple-execution benchmark suite
- **CI/CD**: 7-job GitHub Actions pipeline

## Documentation

- [Configuration Guide](Windsurf-IDE-configuration-guide.md)
- [Example Configurations](examples/README.md)
- [Test Suite](docs/testing/README.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

## Quick Apply

```powershell
# Copy sample settings to Windsurf
Copy-Item .\settings.json "$env:APPDATA\Windsurf\User\settings.json"

# Copy global rules
Copy-Item .\examples\global_rules.md "$env:USERPROFILE\.codeium\windsurf\memories\"

# Copy MCP configuration (edit first!)
Copy-Item .\examples\mcp_config.json "$env:USERPROFILE\.codeium\windsurf\"
```

## License

MIT License - see [LICENSE](LICENSE) for details.
