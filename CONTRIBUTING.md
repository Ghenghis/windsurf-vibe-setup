# Contributing to Windsurf Vibe Setup

Thank you for your interest in contributing to Windsurf Vibe Setup! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

---

## Code of Conduct

### Our Standards

- **Be Respectful**: Treat all contributors with respect
- **Be Constructive**: Provide helpful feedback
- **Be Professional**: Maintain professional communication
- **Be Inclusive**: Welcome contributors of all backgrounds

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Publishing private information without consent

---

## Getting Started

### Prerequisites

```powershell
# Required software
- Windsurf IDE (latest version)
- PowerShell 7.0+
- Node.js 20.x+
- Python 3.11+
- Git 2.40+
```

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/windsurf-vibe-setup.git
cd windsurf-vibe-setup

# Add upstream remote
git remote add upstream https://github.com/Ghenghis/windsurf-vibe-setup.git
```

### Install Dependencies

```powershell
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Install PowerShell modules
Install-Module -Name PSScriptAnalyzer -Force -Scope CurrentUser
```

---

## Development Workflow

### Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/add-gpu-support` |
| Bug Fix | `fix/description` | `fix/search-performance` |
| Documentation | `docs/description` | `docs/update-readme` |
| Refactor | `refactor/description` | `refactor/benchmark-script` |

### Creating a Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in small, logical commits
2. Write clear commit messages following conventional commits
3. Test your changes locally
4. Run linting and validation

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(config): add GPU acceleration settings

Add CUDA environment variables for ML workflows.
Includes PyTorch memory allocation configuration.

Closes #42
```

```
fix(benchmark): correct timing measurement accuracy

The previous implementation used Date.now() which has
millisecond precision. Changed to performance.now()
for microsecond accuracy.
```

---

## Coding Standards

### PowerShell

```powershell
# Use approved verbs
Get-Something, Set-Something, New-Something

# Use PascalCase for functions
function Get-BenchmarkResults { }

# Use descriptive parameter names
param(
    [Parameter(Mandatory = $true)]
    [string]$ConfigPath,

    [Parameter(Mandatory = $false)]
    [int]$TimeoutSeconds = 30
)

# Add comment-based help
<#
.SYNOPSIS
    Brief description
.DESCRIPTION
    Detailed description
.PARAMETER ConfigPath
    Path to configuration file
.EXAMPLE
    Get-BenchmarkResults -ConfigPath ".\config.json"
#>
```

### JavaScript/TypeScript

```javascript
// Use const for immutable, let for mutable
const CONFIG = { };
let counter = 0;

// Use arrow functions for callbacks
items.map((item) => item.value);

// Use template literals
const message = `Hello, ${name}!`;

// Document functions with JSDoc
/**
 * Calculate benchmark metrics
 * @param {Object[]} results - Array of test results
 * @returns {Object} Aggregated metrics
 */
function calculateMetrics(results) { }
```

### Python

```python
# Follow PEP 8 style guide
# Use type hints
def calculate_average(values: list[float]) -> float:
    """Calculate the average of a list of values.

    Args:
        values: List of numeric values

    Returns:
        The arithmetic mean of the values
    """
    return sum(values) / len(values)

# Use descriptive names
file_path = Path("./config.json")  # Good
fp = Path("./config.json")         # Bad
```

### JSON Configuration

```json
{
  "use_consistent_indentation": 2,
  "use_double_quotes": true,
  "no_trailing_commas": true,
  "add_comments_with_jsonc": "// Like this"
}
```

---

## Testing Requirements

### Before Submitting

1. **Run Benchmark Suite**
   ```powershell
   .\scripts\testing\Run-WindsurfBenchmark.ps1 -RunCount 3
   ```

2. **Run Linting**
   ```powershell
   # PowerShell
   Invoke-ScriptAnalyzer -Path . -Recurse

   # JavaScript
   npx eslint .

   # Python
   python -m flake8 .
   python -m black --check .
   ```

3. **Validate JSON**
   ```powershell
   Get-ChildItem -Recurse -Filter *.json | ForEach-Object {
       $content = Get-Content $_.FullName -Raw
       $null = $content | ConvertFrom-Json
       Write-Host "[OK] $($_.Name)"
   }
   ```

### Performance Requirements

| Metric | Requirement |
|--------|-------------|
| Autocomplete | < 200ms average |
| File Search | < 500ms average |
| Format on Save | < 500ms average |
| No Regressions | Performance must not degrade |

---

## Pull Request Process

### Before Opening PR

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] Benchmark results show no regression
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention

### PR Checklist

```markdown
## Checklist
- [ ] I have read CONTRIBUTING.md
- [ ] My code follows the coding standards
- [ ] I have tested my changes
- [ ] I have updated documentation
- [ ] All CI checks pass
```

### Review Process

1. **Automated Checks**: CI must pass
2. **Code Review**: At least one approval required
3. **Testing**: Reviewer verifies changes work
4. **Merge**: Squash and merge to main

### After Merge

- Delete your feature branch
- Sync your fork with upstream
- Celebrate your contribution!

---

## Issue Guidelines

### Bug Reports

Use the bug report template and include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Relevant logs/screenshots

### Feature Requests

Use the feature request template and include:
- Problem statement
- Proposed solution
- Alternative approaches
- Implementation ideas

### Good First Issues

Look for issues labeled `good first issue` if you're new to the project. These are typically:
- Well-documented
- Limited in scope
- Good learning opportunities

---

## Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Project README for major features

---

## Questions?

- Open a Discussion on GitHub
- Review existing issues and PRs
- Check the documentation

Thank you for contributing!
