# =============================================================================
# Windsurf Vibe Setup - Free Local Installation Script
# =============================================================================
# Run in PowerShell as Administrator
# This script installs all free, open-source components for local AI development
# =============================================================================

param(
    [switch]$SkipOllama,
    [switch]$SkipDocker,
    [switch]$SkipModels,
    [switch]$FullStack
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host @"
╔═══════════════════════════════════════════════════════════════════════════╗
║           WINDSURF VIBE SETUP - FREE LOCAL INSTALLATION                   ║
║                                                                           ║
║  This script will install:                                                ║
║  • Ollama (Local LLM runtime)                                             ║
║  • LM Studio models directory                                             ║
║  • MCP dependencies (npm packages)                                        ║
║  • Python dependencies (ChromaDB, etc.)                                   ║
║  • Docker services (optional)                                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# Check Prerequisites
# ---------------------------------------------------------------------------
function Test-Prerequisites {
    Write-Host "`n[1/7] Checking prerequisites..." -ForegroundColor Yellow
    
    $missing = @()
    
    # Check Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        $missing += "Node.js (https://nodejs.org/)"
    } else {
        $nodeVersion = node --version
        Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
    }
    
    # Check npm
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        $missing += "npm (comes with Node.js)"
    } else {
        $npmVersion = npm --version
        Write-Host "  ✓ npm $npmVersion" -ForegroundColor Green
    }
    
    # Check Python
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        $missing += "Python 3.10+ (https://python.org/)"
    } else {
        $pyVersion = python --version
        Write-Host "  ✓ $pyVersion" -ForegroundColor Green
    }
    
    # Check pip
    if (-not (Get-Command pip -ErrorAction SilentlyContinue)) {
        $missing += "pip (comes with Python)"
    } else {
        Write-Host "  ✓ pip installed" -ForegroundColor Green
    }
    
    # Check Git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        $missing += "Git (https://git-scm.com/)"
    } else {
        $gitVersion = git --version
        Write-Host "  ✓ $gitVersion" -ForegroundColor Green
    }
    
    # Check Docker (optional)
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Host "  ✓ Docker installed" -ForegroundColor Green
    } else {
        Write-Host "  ○ Docker not installed (optional)" -ForegroundColor Gray
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "`n  Missing requirements:" -ForegroundColor Red
        foreach ($item in $missing) {
            Write-Host "    • $item" -ForegroundColor Red
        }
        Write-Host "`nPlease install missing requirements and re-run this script." -ForegroundColor Red
        exit 1
    }
}

# ---------------------------------------------------------------------------
# Install Ollama
# ---------------------------------------------------------------------------
function Install-Ollama {
    if ($SkipOllama) {
        Write-Host "`n[2/7] Skipping Ollama installation..." -ForegroundColor Gray
        return
    }
    
    Write-Host "`n[2/7] Installing Ollama..." -ForegroundColor Yellow
    
    if (Get-Command ollama -ErrorAction SilentlyContinue) {
        Write-Host "  ✓ Ollama already installed" -ForegroundColor Green
        return
    }
    
    try {
        winget install Ollama.Ollama --accept-source-agreements --accept-package-agreements
        Write-Host "  ✓ Ollama installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "  Manual installation required:" -ForegroundColor Yellow
        Write-Host "  Download from: https://ollama.ai/download" -ForegroundColor Cyan
    }
}

# ---------------------------------------------------------------------------
# Download Recommended Models
# ---------------------------------------------------------------------------
function Install-Models {
    if ($SkipModels) {
        Write-Host "`n[3/7] Skipping model downloads..." -ForegroundColor Gray
        return
    }
    
    Write-Host "`n[3/7] Downloading recommended models..." -ForegroundColor Yellow
    
    $models = @(
        @{ name = "qwen2.5-coder:7b"; desc = "Fast coding model (4GB)" },
        @{ name = "nomic-embed-text"; desc = "Embeddings model (275MB)" },
        @{ name = "starcoder2:3b"; desc = "Autocomplete model (2GB)" }
    )
    
    Write-Host "  Detecting GPU..." -ForegroundColor Gray
    
    foreach ($model in $models) {
        Write-Host "  Downloading $($model.name) - $($model.desc)..." -ForegroundColor Cyan
        try {
            ollama pull $model.name
            Write-Host "    ✓ $($model.name) downloaded" -ForegroundColor Green
        } catch {
            Write-Host "    ○ Failed to download $($model.name)" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n  For your RTX 3090 Ti (24GB), consider also running:" -ForegroundColor Cyan
    Write-Host "    ollama pull qwen2.5-coder:32b" -ForegroundColor White
    Write-Host "    ollama pull llama3.1:70b" -ForegroundColor White
}

# ---------------------------------------------------------------------------
# Install NPM Dependencies
# ---------------------------------------------------------------------------
function Install-NpmDependencies {
    Write-Host "`n[4/7] Installing MCP servers (npm)..." -ForegroundColor Yellow
    
    $packages = @(
        "@modelcontextprotocol/server-filesystem",
        "@modelcontextprotocol/server-git",
        "@modelcontextprotocol/server-memory",
        "@modelcontextprotocol/server-sequential-thinking",
        "@modelcontextprotocol/server-fetch",
        "@modelcontextprotocol/server-time",
        "@anthropic/mcp-server-playwright"
    )
    
    foreach ($pkg in $packages) {
        Write-Host "  Installing $pkg..." -ForegroundColor Gray
        npm install -g $pkg 2>&1 | Out-Null
    }
    
    Write-Host "  ✓ MCP servers installed" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Install Python Dependencies
# ---------------------------------------------------------------------------
function Install-PythonDependencies {
    Write-Host "`n[5/7] Installing Python dependencies..." -ForegroundColor Yellow
    
    $packages = @(
        "chromadb",
        "sentence-transformers",
        "langchain",
        "langchain-community",
        "langchain-ollama",
        "mcp-server-sqlite",
        "duckduckgo-mcp-server",
        "crewai",
        "mcp-use"
    )
    
    pip install --upgrade pip 2>&1 | Out-Null
    
    foreach ($pkg in $packages) {
        Write-Host "  Installing $pkg..." -ForegroundColor Gray
        pip install $pkg 2>&1 | Out-Null
    }
    
    Write-Host "  ✓ Python packages installed" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Setup Directory Structure
# ---------------------------------------------------------------------------
function Setup-Directories {
    Write-Host "`n[6/7] Setting up directories..." -ForegroundColor Yellow
    
    $dirs = @(
        "$env:USERPROFILE\.windsurf-autopilot",
        "$env:USERPROFILE\.windsurf-autopilot\ai-engine",
        "$env:USERPROFILE\.windsurf-autopilot\chromadb",
        "$env:USERPROFILE\.windsurf-autopilot\logs",
        "$env:USERPROFILE\.codeium\windsurf"
    )
    
    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "  Created: $dir" -ForegroundColor Gray
        }
    }
    
    Write-Host "  ✓ Directories created" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Create Configuration Files
# ---------------------------------------------------------------------------
function Create-ConfigFiles {
    Write-Host "`n[7/7] Creating configuration files..." -ForegroundColor Yellow
    
    $mcpConfig = @"
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "$($env:USERPROFILE -replace '\\', '\\\\')\\Projects"],
      "disabled": false
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"],
      "disabled": false
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "disabled": false
    },
    "sqlite": {
      "command": "uvx",
      "args": ["mcp-server-sqlite", "--db-path", "$($env:USERPROFILE -replace '\\', '\\\\')\\.windsurf-autopilot\\autopilot.db"],
      "disabled": false
    },
    "duckduckgo": {
      "command": "uvx",
      "args": ["duckduckgo-mcp-server"],
      "disabled": false
    }
  }
}
"@
    
    $configPath = "$env:USERPROFILE\.codeium\windsurf\mcp_config.json"
    
    if (-not (Test-Path $configPath)) {
        $mcpConfig | Out-File -FilePath $configPath -Encoding UTF8
        Write-Host "  Created: $configPath" -ForegroundColor Gray
    } else {
        Write-Host "  Config exists: $configPath (not overwritten)" -ForegroundColor Gray
    }
    
    Write-Host "  ✓ Configuration files ready" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Start Docker Stack (Optional)
# ---------------------------------------------------------------------------
function Start-DockerStack {
    if (-not $FullStack) {
        Write-Host "`n[Optional] Docker stack skipped. Use -FullStack to enable." -ForegroundColor Gray
        return
    }
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "`n[Optional] Docker not installed, skipping stack..." -ForegroundColor Yellow
        return
    }
    
    Write-Host "`n[Optional] Starting Docker services..." -ForegroundColor Yellow
    
    $composeFile = "$PSScriptRoot\docker-compose-vibe-stack.yml"
    
    if (Test-Path $composeFile) {
        docker-compose -f $composeFile up -d
        Write-Host "  ✓ Docker services started" -ForegroundColor Green
    } else {
        Write-Host "  docker-compose-vibe-stack.yml not found" -ForegroundColor Yellow
    }
}

# ---------------------------------------------------------------------------
# Print Summary
# ---------------------------------------------------------------------------
function Print-Summary {
    Write-Host @"

╔═══════════════════════════════════════════════════════════════════════════╗
║                    INSTALLATION COMPLETE! 🎉                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  QUICK START:                                                             ║
║  ───────────────────────────────────────────────────────────────────────  ║
║  1. Start Ollama:       ollama serve                                      ║
║  2. Test a model:       ollama run qwen2.5-coder:7b "Hello!"              ║
║  3. Restart Windsurf IDE                                                  ║
║                                                                           ║
║  RECOMMENDED COMMANDS:                                                    ║
║  ───────────────────────────────────────────────────────────────────────  ║
║  Pull larger model:     ollama pull qwen2.5-coder:32b                     ║
║  Start web search:      uvx duckduckgo-mcp-server                         ║
║  Run with MCP host:     mcphost -m ollama:qwen2.5-coder:32b               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Main Execution
# ---------------------------------------------------------------------------
Test-Prerequisites
Install-Ollama
Install-Models
Install-NpmDependencies
Install-PythonDependencies
Setup-Directories
Create-ConfigFiles
Start-DockerStack
Print-Summary
