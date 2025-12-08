# Windsurf Vibe Setup

> Enterprise-grade Windsurf IDE configuration for vibe coding excellence

[![CI Pipeline](https://github.com/Ghenghis/windsurf-vibe-setup/actions/workflows/ci.yml/badge.svg)](https://github.com/Ghenghis/windsurf-vibe-setup/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PowerShell](https://img.shields.io/badge/PowerShell-7.0%2B-blue)](https://docs.microsoft.com/en-us/powershell/)

---

## Overview

A professional, production-ready Windsurf IDE configuration optimized for:
- **Multi-language development** (Python, JavaScript, TypeScript, PowerShell)
- **AI/ML workflows** with GPU acceleration
- **100+ repository management**
- **Enterprise security** with command deny lists
- **Maximum productivity** with vibe coding principles

## Features

### Security
- Command execution deny list (blocks dangerous commands)
- Safe command allow list for automation
- Credential file exclusions
- Security-focused CI/CD checks

### Performance
- Optimized file watcher exclusions
- Smart search exclusions for ML artifacts
- Memory-efficient language server settings
- GPU/CUDA environment configuration

### Code Quality
- ESLint configuration
- Python linting with Pylint
- PowerShell ScriptAnalyzer
- Markdown linting
- Automated formatting

### Testing
- Triple-execution benchmark suite
- Real data testing (no mocks)
- Performance regression detection
- Delay root cause analysis

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Ghenghis/windsurf-vibe-setup.git
cd windsurf-vibe-setup
```

### 2. Install Dependencies
```powershell
npm install
pip install -r requirements.txt
```

### 3. Run Benchmark
```powershell
.\scripts\testing\Run-WindsurfBenchmark.ps1 -ExportHtml
```

### 4. Apply Configuration
Copy `settings.json` contents to your Windsurf settings:
```
%APPDATA%\Windsurf\User\settings.json
```

## Configuration Highlights

### Security Controls
```json
{
  "windsurf.cascadeCommandsDenyList": [
    "rm -rf /",
    "DROP TABLE",
    "format",
    "shutdown"
  ]
}
```

### ML/AI Optimizations
```json
{
  "files.watcherExclude": {
    "**/wandb/**": true,
    "**/checkpoints/**": true,
    "**/models/**": true
  },
  "terminal.integrated.env.windows": {
    "CUDA_VISIBLE_DEVICES": "0",
    "PYTORCH_CUDA_ALLOC_CONF": "max_split_size_mb:128"
  }
}
```

### Performance Tuning
```json
{
  "windsurf.searchMaxWorkspaceFileCount": 50000,
  "editor.tokenColorCustomizations": {},
  "files.maxMemoryForLargeFilesMB": 4096
}
```

## Project Structure

```
windsurf-vibe-setup/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                    # CI/CD pipeline
│   ├── ISSUE_TEMPLATE/               # Issue templates
│   ├── CODEOWNERS                    # Code ownership
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── WINDSURF_VIBE_SETUP_README.md # Extended README
│   └── testing/
│       ├── WINDSURF_CONFIGURATION_VALIDATION_PLAN.md
│       └── README.md
├── examples/
│   ├── global_rules.md               # AI behavior rules template
│   ├── mcp_config.json               # MCP server config template
│   ├── windsurf-vibe.code-workspace  # Multi-project workspace
│   └── README.md
├── scripts/
│   ├── testing/
│   │   └── Run-WindsurfBenchmark.ps1
│   ├── validate-json.js
│   ├── scan-secrets.js               # Automated secret scanning
│   ├── scan-dependencies.js          # Dependency vulnerability scanner
│   ├── auto-repair.js                # Auto-fix common coding issues
│   ├── collect-metrics.js            # Code metrics collection
│   └── security-audit.js             # Security audit logging
├── settings.json                     # Main Windsurf configuration
├── requirements.txt                  # Python dependencies
├── .eslintrc.json                    # ESLint config
├── .markdownlint.json                # Markdown lint config
├── package.json                      # Node.js dependencies
├── CONTRIBUTING.md                   # Contribution guide
├── SECURITY.md                       # Security policy
└── README.md                         # Main README
```

## Benchmark Results (v1.0.0)

| Test | Category | Avg (ms) | Status |
|------|----------|----------|--------|
| FS-001 | FileSystem | 90 | Optimal |
| FS-002 | FileSystem | 330 | Acceptable |
| FS-003 | FileSystem | 15 | Optimal |
| LANG-001 | Language | 155 | Acceptable |
| LANG-002 | Language | 440 | Acceptable |
| LANG-003 | Language | 25 | Optimal |
| SEC-001 | Security | 9 | Optimal |
| SEC-002 | Security | 5 | Optimal |
| EXT-001 | Extension | 335 | Acceptable |
| EXT-002 | Extension | 270 | Acceptable |
| EXT-003 | Extension | 5 | Optimal |
| EXT-004 | Extension | 17 | Optimal |
| EDITOR-001 | Editor | 4 | Optimal |
| EDITOR-002 | Editor | 17 | Optimal |

**Summary:** 14 tests | 9 Optimal | 5 Acceptable | 0 Failed

## Performance Thresholds

| Classification | Response Time | Indicator |
|----------------|---------------|-----------|
| Optimal | < 100ms | No action needed |
| Acceptable | 100-500ms | Monitor |
| Degraded | 500-2000ms | Investigate |
| Critical | 2000-5000ms | Immediate action |
| Failed | > 10000ms | Blocking issue |

## MCP Server Configuration

The project includes MCP (Model Context Protocol) server templates for enhanced AI capabilities:

### Available MCP Servers
| Server | Purpose | Status |
|--------|---------|--------|
| time | Timezone operations | ✅ Active |
| git | Repository management | ✅ Active |
| fetch | HTTP requests | ✅ Active |
| filesystem | File operations | ✅ Active |
| memory | Persistent memory | ✅ Active |
| puppeteer | Browser automation | ✅ Active |
| playwright | Browser testing | ✅ Active |
| sequential-thinking | Chain-of-thought | ✅ Active |
| github | GitHub API access | Optional |

### Setup MCP
```powershell
# Copy example config to Windsurf
Copy-Item "examples\mcp_config.json" "$env:USERPROFILE\.codeium\windsurf\mcp_config.json"

# Restart Windsurf to load MCP servers
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for security policy and vulnerability reporting.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Repository:** [github.com/Ghenghis/windsurf-vibe-setup](https://github.com/Ghenghis/windsurf-vibe-setup)
