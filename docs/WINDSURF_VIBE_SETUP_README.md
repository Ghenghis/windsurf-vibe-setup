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
│   │   └── ci.yml              # CI/CD pipeline
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   ├── CODEOWNERS              # Code ownership
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   └── testing/
│       ├── WINDSURF_CONFIGURATION_VALIDATION_PLAN.md
│       └── README.md
├── scripts/
│   ├── testing/
│   │   └── Run-WindsurfBenchmark.ps1
│   └── validate-json.js
├── settings.json               # Main configuration
├── .eslintrc.json             # ESLint config
├── .markdownlint.json         # Markdown lint config
├── package.json               # Node.js dependencies
├── CONTRIBUTING.md            # Contribution guide
├── SECURITY.md                # Security policy
└── README.md                  # This file
```

## Benchmark Results

| Test | Category | Avg (ms) | Status |
|------|----------|----------|--------|
| FS-001 | FileSystem | 45 | Optimal |
| FS-002 | FileSystem | 120 | Acceptable |
| LANG-001 | Language | 85 | Optimal |
| SEC-001 | Security | 15 | Optimal |
| EXT-001 | Extension | 95 | Optimal |

## Performance Thresholds

| Classification | Response Time | Indicator |
|----------------|---------------|-----------|
| Optimal | < 100ms | No action needed |
| Acceptable | 100-300ms | Monitor |
| Degraded | 300-1000ms | Investigate |
| Critical | > 1000ms | Immediate action |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for security policy and vulnerability reporting.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Repository:** [github.com/Ghenghis/windsurf-vibe-setup](https://github.com/Ghenghis/windsurf-vibe-setup)
