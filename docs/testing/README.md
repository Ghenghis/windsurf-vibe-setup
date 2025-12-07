# Windsurf IDE Configuration Validation Suite

> Professional-grade testing framework for validating Windsurf IDE configurations against real production codebases.

[![PowerShell](https://img.shields.io/badge/PowerShell-7.0%2B-blue)](https://docs.microsoft.com/en-us/powershell/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Real%20Data%20Only-orange)](docs/testing/)

---

## Overview

This validation suite provides comprehensive testing for Windsurf IDE configuration settings. Unlike simulated test frameworks, this suite:

- **Tests real project files** - No mocked or simulated data
- **Executes each test 3 times** - Ensures consistency and identifies variance
- **Measures actual response times** - Captures millisecond-precision metrics
- **Analyzes delay root causes** - Provides actionable remediation steps
- **Generates professional reports** - JSON and HTML output for documentation

## Quick Start

### Prerequisites

```powershell
# Required
- PowerShell 7.0+
- Windsurf IDE (latest)
- Git 2.40+

# Recommended Extensions
- esbenp.prettier-vscode
- ms-python.black-formatter
- Gruntfuggly.todo-tree
- usernamehw.errorlens
- eamodio.gitlens
```

### Running the Benchmark

```powershell
# Navigate to scripts directory
cd c:\Users\Admin\civitai\scripts\testing

# Run all tests (3 times each)
.\Run-WindsurfBenchmark.ps1

# Run specific category
.\Run-WindsurfBenchmark.ps1 -TestCategory "FileSystem"

# Run with HTML report
.\Run-WindsurfBenchmark.ps1 -ExportHtml

# Custom output directory
.\Run-WindsurfBenchmark.ps1 -OutputPath "C:\Reports" -RunCount 5
```

## Test Categories

| Category | Test IDs | Description |
|----------|----------|-------------|
| **Editor** | EDITOR-001 to EDITOR-002 | Core editor performance and settings validation |
| **FileSystem** | FS-001 to FS-003 | File watcher, search, and large file handling |
| **Language** | LANG-001 to LANG-003 | Language server performance (Python, JS/TS, PowerShell) |
| **Security** | SEC-001 to SEC-002 | Command deny list and exclusion security |
| **Extension** | EXT-001 to EXT-002 | Extension functionality (Todo Tree, GitLens) |

## Performance Thresholds

| Classification | Response Time | Indicator |
|---------------|---------------|-----------|
| 🟢 Optimal | < 100ms | No action required |
| 🟡 Acceptable | 100-300ms | Monitor for degradation |
| 🟠 Degraded | 300-1000ms | Investigation recommended |
| 🔴 Critical | 1000-3000ms | Immediate action required |
| ⛔ Failed | > 3000ms | Blocking issue |

## Output Files

### JSON Report
```json
{
  "Metadata": {
    "Timestamp": "2025-12-06 14:30:00",
    "Version": "1.0.0",
    "RunCount": 3
  },
  "Tests": [
    {
      "TestId": "FS-001",
      "TestName": "File Watcher Exclusion Validation",
      "Average": 45.67,
      "Status": "Optimal",
      "DelayReasons": []
    }
  ],
  "Summary": {
    "Total": 10,
    "Optimal": 8,
    "Acceptable": 2
  }
}
```

### HTML Report
Professional formatted report with:
- Summary cards with status counts
- Detailed test results table
- Color-coded status indicators
- System information

## Delay Analysis

When tests exceed acceptable thresholds, the framework automatically analyzes potential causes:

| Category | Code | Common Causes |
|----------|------|---------------|
| Extension Conflict | EXT-CONF | Multiple extensions competing for resources |
| Language Server Overload | LANG-OVER | Large workspace indexing |
| File Watcher Storm | FW-STORM | Too many file change events |
| Memory Pressure | MEM-PRES | Insufficient RAM |
| Disk I/O | DISK-IO | Slow storage operations |

## Directory Structure

```
civitai/
├── docs/
│   └── testing/
│       ├── README.md                                    # This file
│       └── WINDSURF_CONFIGURATION_VALIDATION_PLAN.md   # Detailed test specs
├── scripts/
│   └── testing/
│       └── Run-WindsurfBenchmark.ps1                   # Main benchmark script
└── benchmark-results/                                   # Generated reports
    ├── benchmark-report-20251206-143000.json
    └── benchmark-report-20251206-143000.html
```

## Extending the Test Suite

### Adding a New Test

```powershell
$AllTests += @{
    TestId = "CUSTOM-001"
    TestName = "Custom Test Name"
    Category = "Custom"
    Script = {
        # Your test logic here
        # Must return a hashtable with results

        return @{
            MetricName = $value
            Status = "Pass"
        }
    }
}
```

### Custom Thresholds

```powershell
$Config = @{
    Thresholds = @{
        Optimal = 50      # Stricter threshold
        Acceptable = 150
        Degraded = 500
        Critical = 1500
    }
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Windsurf Config Validation

on:
  push:
    paths:
      - '**/settings.json'

jobs:
  validate:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Benchmark
        shell: pwsh
        run: |
          .\scripts\testing\Run-WindsurfBenchmark.ps1 -OutputPath "./reports" -ExportHtml

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-report
          path: ./reports/
```

## Troubleshooting

### Common Issues

**Test fails with "Settings file not found"**
```powershell
# Verify settings path
Test-Path "$env:APPDATA\Windsurf\User\settings.json"
```

**Language server tests timeout**
```powershell
# Increase timeout or reduce test scope
.\Run-WindsurfBenchmark.ps1 -TestCategory "FileSystem"
```

**High variance between runs**
- Close other applications
- Ensure no background indexing
- Run tests after IDE is fully initialized

## Contributing

1. Follow existing test naming conventions (CATEGORY-XXX)
2. All tests must use real data - no mocks
3. Include delay analysis for new test types
4. Update documentation with new tests

## License

MIT License - See [LICENSE](../../LICENSE) for details.

---

**Documentation:** [WINDSURF_CONFIGURATION_VALIDATION_PLAN.md](WINDSURF_CONFIGURATION_VALIDATION_PLAN.md)
**Script:** [Run-WindsurfBenchmark.ps1](../../scripts/testing/Run-WindsurfBenchmark.ps1)
