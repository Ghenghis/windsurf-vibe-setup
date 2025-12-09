# Windsurf Vibe Setup - Scripts Reference

> Complete guide to all automation scripts

---

## Overview

This project includes several scripts to help maintain code quality, security, and performance. All scripts can be run via npm or directly.

```
scripts/
├── validate-json.js        # Validate JSON/JSONC files
├── scan-secrets.js         # Detect leaked credentials
├── scan-dependencies.js    # Check for vulnerabilities
├── auto-repair.js          # Fix common code issues
├── collect-metrics.js      # Code quality metrics
├── security-audit.js       # Security audit logging
└── testing/
    └── Run-WindsurfBenchmark.ps1  # Performance benchmark
```

---

## Quick Reference

| Command                 | What It Does                             | When to Use          |
| ----------------------- | ---------------------------------------- | -------------------- |
| `npm run test`          | Run lint + JSON validation + secret scan | Before commits       |
| `npm run lint`          | Check JavaScript code style              | During development   |
| `npm run lint:fix`      | Auto-fix JavaScript issues               | After writing code   |
| `npm run format`        | Format all files with Prettier           | Before commits       |
| `npm run validate:json` | Check all JSON files                     | After editing JSON   |
| `npm run scan:secrets`  | Find leaked credentials                  | Before commits       |
| `npm run scan:deps`     | Check dependency vulnerabilities         | Weekly               |
| `npm run repair`        | Auto-fix common issues                   | When lint fails      |
| `npm run repair:dry`    | Preview repairs (no changes)             | Before actual repair |
| `npm run metrics`       | Generate code quality report             | Monthly review       |
| `npm run security`      | Full security audit                      | Before releases      |
| `npm run benchmark`     | Run performance tests                    | After config changes |

---

## Script Details

### 1. JSON Validation (`validate-json.js`)

**Purpose**: Validates all JSON and JSONC files in the project.

**Run**:

```powershell
npm run validate:json
# or directly:
node scripts/validate-json.js
```

**What It Does**:

- Finds all `.json` and `.jsonc` files
- Strips comments from JSONC files
- Validates JSON syntax
- Reports errors with line numbers

**Output Example**:

```
JSON/JSONC Validation
==================================================
Scanning: C:\Users\Admin\windsurf-vibe-setup

Found 8 JSON files to validate

[OK] settings.json
[OK] package.json
[OK] .eslintrc.json
[FAIL] examples/mcp_config.json
       Error: Unexpected token at position 234
       Near line: 15

==================================================
Summary
  Valid: 7
  Invalid: 1
  Total: 8
```

**Excludes**:

- `node_modules/`
- `.git/`
- `benchmark-results/`
- Virtual environments

---

### 2. Secret Scanner (`scan-secrets.js`)

**Purpose**: Detects accidentally committed API keys, passwords, and tokens.

**Run**:

```powershell
npm run scan:secrets
# or directly:
node scripts/scan-secrets.js
```

**What It Detects**:
| Type | Pattern Example |
|------|-----------------|
| AWS Access Key | `AKIA...` |
| GitHub Token | `ghp_...` |
| OpenAI API Key | `sk-...` |
| Anthropic API Key | `sk-ant-...` |
| Private Keys | `-----BEGIN PRIVATE KEY-----` |
| Database URLs | `mongodb://user:pass@...` |
| Hardcoded Passwords | `password = "secret123"` |

**False Positive Handling**:

- Ignores `${ENV_VAR}` placeholders
- Ignores `process.env.` patterns
- Ignores example/test values

**Output Example**:

```
Secret Scanning Tool
==================================================
Scanning: C:\Users\Admin\windsurf-vibe-setup

Found 45 files to scan
Scanned 45 files

⚠ Found 2 potential secret(s)

CRITICAL OpenAI API Key
  File: examples/test.js:15
  Match: sk-abc123...

HIGH Generic API Key
  File: config/api.json:8
  Match: api_key": "real...

Report saved to: secret-scan-report.json
```

**Exit Codes**:

- `0` = No secrets found
- `1` = Secrets detected (fails CI)

---

### 3. Dependency Scanner (`scan-dependencies.js`)

**Purpose**: Checks for known vulnerabilities in npm dependencies.

**Run**:

```powershell
npm run scan:deps
# or directly:
node scripts/scan-dependencies.js
```

**What It Does**:

- Runs `npm audit`
- Parses vulnerability data
- Creates detailed report
- Suggests fixes

**Output Location**: `security-reports/dependency-scan-{timestamp}.json`

---

### 4. Auto-Repair (`auto-repair.js`)

**Purpose**: Automatically fixes common code issues.

**Run**:

```powershell
# Preview changes (recommended first)
npm run repair:dry

# Apply fixes
npm run repair
```

**What It Fixes**:

| Language | Fix                   | Auto-Fix? |
| -------- | --------------------- | --------- |
| JS/TS    | `var` → `const`       | ✅ Yes    |
| JS/TS    | Trailing whitespace   | ✅ Yes    |
| JS/TS    | Multiple blank lines  | ✅ Yes    |
| JS/TS    | Missing final newline | ✅ Yes    |
| JS/TS    | `console.log` removal | ❌ Manual |
| Python   | Trailing whitespace   | ✅ Yes    |
| Python   | Tabs → 4 spaces       | ✅ Yes    |
| Python   | Multiple blank lines  | ✅ Yes    |
| Python   | `print()` removal     | ❌ Manual |
| JSON     | Trailing commas       | ✅ Yes    |
| Markdown | Trailing whitespace   | ✅ Yes    |

**Output Example**:

```
Auto-Repair Script
==================================================
Scanning: C:\Users\Admin\windsurf-vibe-setup
DRY RUN MODE - No changes will be made

Found 25 files to analyze

Issues Found:

scripts/example.js
  MEDIUM Convert var to const/let (3x) [would fix]
  LOW Fix trailing whitespace (5x) [would fix]

docs/README.md
  LOW Fix multiple blank lines (2x) [would fix]

==================================================
Summary
  Files scanned: 25
  Issues found: 10
  Issues fixed: 0
  Errors: 0

Run without --dry-run to apply fixes
```

---

### 5. Metrics Collection (`collect-metrics.js`)

**Purpose**: Generates code quality metrics and statistics.

**Run**:

```powershell
npm run metrics
# or directly:
node scripts/collect-metrics.js
```

**Metrics Collected**:

- Lines of code by language
- Comment density
- Cyclomatic complexity
- Function/class counts
- TODO/FIXME hotspots
- Largest files
- Most complex files

**Output Example**:

```
Code Metrics Collection
============================================================
Scanning: C:\Users\Admin\windsurf-vibe-setup

Analyzing 45 files...

Metrics by Language:
------------------------------------------------------------
Language         Files     Code  Comments  Complexity
------------------------------------------------------------
JavaScript           8     1250       180          45
PowerShell           1      890       120          35
Python               2      340        60          15
Markdown            12     1800         0           0
------------------------------------------------------------

Project Totals:
  Files: 45
  Size: 156.2 KB
  Total Lines: 5,200
  Code Lines: 3,480
  Comment Lines: 360
  Blank Lines: 1,360

  Functions: 89
  Classes: 12
  Imports: 156
  Complexity Score: 95
  TODOs/FIXMEs: 8

Quality Indicators:
  Comment Ratio: 10.3%
  Avg Complexity/File: 4.2

Detailed report: metrics-reports/metrics-1234567890.json
```

**Report Location**: `metrics-reports/metrics-{timestamp}.json`

---

### 6. Security Audit (`security-audit.js`)

**Purpose**: Logs security events and generates audit reports.

**Run**:

```powershell
npm run audit:security
# or directly:
node scripts/security-audit.js
```

**Full Security Suite**:

```powershell
# Run all security checks at once
npm run security
```

This runs:

1. Secret scanning
2. Dependency scanning
3. Security audit logging

---

### 7. Benchmark (`Run-WindsurfBenchmark.ps1`)

**Purpose**: Tests Windsurf configuration performance.

**Run**:

```powershell
# Basic run (3 iterations per test)
npm run benchmark

# With HTML report
npm run benchmark:html

# Direct PowerShell execution
.\scripts\testing\Run-WindsurfBenchmark.ps1 -ExportHtml
```

**Parameters**:
| Parameter | Description | Default |
|-----------|-------------|---------|
| `-TestCategory` | Run specific category | All |
| `-OutputPath` | Report output directory | `benchmark-results/` |
| `-RunCount` | Iterations per test | 3 |
| `-ExportHtml` | Generate HTML report | false |

**Test Categories**:

- `FileSystem` - File watcher, search, large files
- `Language` - Python, JS/TS, PowerShell servers
- `Security` - Command deny list validation
- `Extension` - Todo Tree, Git, JSON, Markdown
- `Editor` - Core editor performance

**Output Example**:

```
Windsurf Configuration Benchmark
================================

Test: FS-001 File Watcher Validation
Run 1: 45ms
Run 2: 52ms
Run 3: 48ms
Average: 48.3ms [OPTIMAL]

Test: LANG-001 Python Server Response
Run 1: 180ms
Run 2: 165ms
Run 3: 172ms
Average: 172.3ms [ACCEPTABLE]

================================
Summary
Total: 14 tests
Optimal: 9
Acceptable: 5
Failed: 0

Report saved to: benchmark-results/benchmark-report-20251206.json
```

---

## Integration with CI/CD

All scripts are integrated into the GitHub Actions CI pipeline:

```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    - npm run lint
    - npm run validate:json

  security:
    - npm run scan:secrets
    - npm run scan:deps

  test:
    - npm run test
```

**When Scripts Run**:

- On every push to any branch
- On every pull request
- Can be run manually

---

## Creating Custom Scripts

To add your own script:

1. **Create the file**:

```javascript
// scripts/my-script.js
#!/usr/bin/env node
console.log('Hello from my script!');
```

2. **Add to package.json**:

```json
{
  "scripts": {
    "my-script": "node scripts/my-script.js"
  }
}
```

3. **Run it**:

```powershell
npm run my-script
```

---

## Exit Codes Reference

All scripts follow standard exit codes:

| Code | Meaning                            |
| ---- | ---------------------------------- |
| 0    | Success                            |
| 1    | Errors found (lint, secrets, etc.) |
| 2    | Invalid arguments                  |
| 127  | Command not found                  |

CI pipelines fail on non-zero exit codes.

---

## Troubleshooting Scripts

### "Permission denied"

```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "node: command not found"

```powershell
# Install Node.js and restart terminal
# Download from: https://nodejs.org
```

### "Cannot find module"

```powershell
# Reinstall dependencies
rm -rf node_modules
npm install
```
