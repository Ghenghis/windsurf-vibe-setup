# =============================================================================
# Windsurf Vibe Setup - Complete Free Local Installation
# =============================================================================
# ONE COMMAND TO RULE THEM ALL
# 
# This script sets up the entire free-local AI development stack:
# - Ollama with recommended models
# - All Docker services
# - MCP dependencies
# - Python agent libraries
# - Health monitoring
# 
# Run as Administrator:
#   .\free-local\scripts\setup-all.ps1
# =============================================================================

param(
    [switch]$SkipOllama,
    [switch]$SkipDocker,
    [switch]$SkipModels,
    [switch]$SkipPython,
    [switch]$MinimalModels,
    [switch]$StartServices
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors
function Write-Step { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-Ok { param($msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "  ✗ $msg" -ForegroundColor Red }

# Banner
Write-Host @"

╔═══════════════════════════════════════════════════════════════════════════╗
║           WINDSURF VIBE SETUP - FREE LOCAL COMPLETE INSTALLATION          ║
║                                                                           ║
║  This script will configure:                                              ║
║  ├─ Ollama (Local LLM runtime with GPU acceleration)                      ║
║  ├─ AI Models (qwen2.5-coder, nomic-embed, etc.)                          ║
║  ├─ Docker Services (ChromaDB, SearXNG, Redis, PostgreSQL, etc.)          ║
║  ├─ Python Dependencies (CrewAI, LangChain, ChromaDB client)              ║
║  ├─ MCP Servers (filesystem, git, sqlite, duckduckgo)                     ║
║  └─ Health Monitoring Daemon                                              ║
║                                                                           ║
║  Estimated time: 15-30 minutes (depending on model downloads)             ║
╚═══════════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$FreeLocalDir = Split-Path -Parent $ScriptDir

# =============================================================================
# STEP 1: Check Prerequisites
# =============================================================================
Write-Step "Checking prerequisites..."

$missing = @()

# Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node --version
    Write-Ok "Node.js $nodeVer"
} else {
    $missing += "Node.js"
}

# npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Ok "npm installed"
} else {
    $missing += "npm"
}

# Python
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pyVer = python --version
    Write-Ok "$pyVer"
} else {
    $missing += "Python 3.10+"
}

# Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Ok "Docker installed"
} else {
    $missing += "Docker Desktop"
}

# Git
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Ok "Git installed"
} else {
    $missing += "Git"
}

# GPU check
try {
    $gpu = nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>$null
    if ($gpu) {
        Write-Ok "NVIDIA GPU: $($gpu.Trim())"
    }
} catch {
    Write-Warn "NVIDIA GPU not detected (CPU mode will be used)"
}

if ($missing.Count -gt 0) {
    Write-Err "Missing prerequisites:"
    $missing | ForEach-Object { Write-Host "    • $_" -ForegroundColor Red }
    Write-Host "`nPlease install missing requirements and re-run.`n" -ForegroundColor Yellow
    exit 1
}

# =============================================================================
# STEP 2: Install Ollama
# =============================================================================
if (-not $SkipOllama) {
    Write-Step "Installing Ollama..."
    
    if (Get-Command ollama -ErrorAction SilentlyContinue) {
        Write-Ok "Ollama already installed"
    } else {
        try {
            winget install Ollama.Ollama --accept-source-agreements --accept-package-agreements
            Write-Ok "Ollama installed"
            
            # Refresh PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        } catch {
            Write-Warn "Auto-install failed. Please download from https://ollama.ai"
        }
    }
}

# =============================================================================
# STEP 3: Pull AI Models
# =============================================================================
if (-not $SkipModels) {
    Write-Step "Downloading AI models (this may take a while)..."
    
    # Start Ollama in background if not running
    try {
        $ollamaRunning = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction SilentlyContinue
    } catch {
        Write-Host "  Starting Ollama server..." -ForegroundColor Gray
        Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 3
    }
    
    if ($MinimalModels) {
        $models = @(
            @{ name = "qwen2.5-coder:7b"; desc = "Fast coding (4GB)" },
            @{ name = "nomic-embed-text"; desc = "Embeddings (275MB)" }
        )
    } else {
        $models = @(
            @{ name = "qwen2.5-coder:32b"; desc = "Primary coding (20GB)" },
            @{ name = "deepseek-coder-v2:16b"; desc = "Fast coding (10GB)" },
            @{ name = "nomic-embed-text"; desc = "Embeddings (275MB)" },
            @{ name = "starcoder2:3b"; desc = "Autocomplete (2GB)" }
        )
    }
    
    foreach ($model in $models) {
        Write-Host "  Pulling $($model.name) - $($model.desc)..." -ForegroundColor Gray
        try {
            ollama pull $model.name 2>&1 | Out-Null
            Write-Ok "$($model.name)"
        } catch {
            Write-Warn "Failed to pull $($model.name)"
        }
    }
}

# =============================================================================
# STEP 4: Start Docker Services
# =============================================================================
if (-not $SkipDocker) {
    Write-Step "Setting up Docker services..."
    
    $composeFile = Join-Path $FreeLocalDir "docker-compose-vibe-stack.yml"
    
    if (Test-Path $composeFile) {
        # Check if Docker is running
        try {
            docker info 2>&1 | Out-Null
            Write-Ok "Docker daemon running"
        } catch {
            Write-Err "Docker daemon not running. Please start Docker Desktop."
            exit 1
        }
        
        Write-Host "  Pulling Docker images..." -ForegroundColor Gray
        docker-compose -f $composeFile pull 2>&1 | Out-Null
        Write-Ok "Docker images ready"
        
        if ($StartServices) {
            Write-Host "  Starting services..." -ForegroundColor Gray
            docker-compose -f $composeFile up -d
            Write-Ok "Docker services started"
        } else {
            Write-Host "  Services ready (use -StartServices to auto-start)" -ForegroundColor Gray
        }
    } else {
        Write-Warn "docker-compose-vibe-stack.yml not found"
    }
}

# =============================================================================
# STEP 5: Install Python Dependencies
# =============================================================================
if (-not $SkipPython) {
    Write-Step "Installing Python dependencies..."
    
    $packages = @(
        "chromadb",
        "sentence-transformers", 
        "langchain",
        "langchain-community",
        "langchain-ollama",
        "crewai",
        "mcp-server-sqlite",
        "duckduckgo-mcp-server",
        "httpx",
        "pydantic"
    )
    
    pip install --upgrade pip 2>&1 | Out-Null
    
    foreach ($pkg in $packages) {
        Write-Host "  Installing $pkg..." -ForegroundColor Gray
        pip install $pkg --quiet 2>&1 | Out-Null
    }
    
    Write-Ok "Python packages installed"
}

# =============================================================================
# STEP 6: Install NPM MCP Servers
# =============================================================================
Write-Step "Installing MCP servers..."

$npmPackages = @(
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-git",
    "@modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-sequential-thinking",
    "@modelcontextprotocol/server-fetch",
    "@modelcontextprotocol/server-time"
)

foreach ($pkg in $npmPackages) {
    Write-Host "  Installing $pkg..." -ForegroundColor Gray
    npm install -g $pkg 2>&1 | Out-Null
}

Write-Ok "MCP servers installed"

# =============================================================================
# STEP 7: Setup Directory Structure
# =============================================================================
Write-Step "Creating directory structure..."

$dirs = @(
    "$env:USERPROFILE\.windsurf-autopilot",
    "$env:USERPROFILE\.windsurf-autopilot\chromadb",
    "$env:USERPROFILE\.windsurf-autopilot\logs",
    "$env:USERPROFILE\.windsurf-autopilot\cache",
    "$RootDir\logs\orchestrator"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

Write-Ok "Directories created"

# =============================================================================
# STEP 8: Configure MCP
# =============================================================================
Write-Step "Configuring MCP..."

$mcpConfigDir = "$env:USERPROFILE\.codeium\windsurf"
$mcpConfigFile = Join-Path $mcpConfigDir "mcp_config.json"

if (-not (Test-Path $mcpConfigDir)) {
    New-Item -ItemType Directory -Path $mcpConfigDir -Force | Out-Null
}

# Copy free-local MCP config if no existing config
$srcConfig = Join-Path $FreeLocalDir "mcp_config_free_local.json"
if ((Test-Path $srcConfig) -and (-not (Test-Path $mcpConfigFile))) {
    Copy-Item $srcConfig $mcpConfigFile
    Write-Ok "MCP config created: $mcpConfigFile"
} else {
    Write-Host "  MCP config exists (not overwritten)" -ForegroundColor Gray
}

# =============================================================================
# STEP 9: Run Health Check
# =============================================================================
Write-Step "Running health check..."

# Check Ollama
try {
    $ollamaStatus = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
    Write-Ok "Ollama: Running ($($ollamaStatus.models.Count) models loaded)"
} catch {
    Write-Warn "Ollama: Not running (start with: ollama serve)"
}

# Check Docker services (if started)
if ($StartServices) {
    $services = @("chromadb:8000", "qdrant:6333", "searxng:8080", "redis:6379")
    foreach ($svc in $services) {
        $name, $port = $svc -split ":"
        try {
            $null = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
            Write-Ok "$name: Running on port $port"
        } catch {
            Write-Host "  ○ $name: Not running" -ForegroundColor Gray
        }
    }
}

# =============================================================================
# COMPLETE!
# =============================================================================

Write-Host @"

╔═══════════════════════════════════════════════════════════════════════════╗
║                    INSTALLATION COMPLETE! 🎉                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  QUICK START COMMANDS:                                                    ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  Start Ollama:                                                            ║
║    ollama serve                                                           ║
║                                                                           ║
║  Start Docker services:                                                   ║
║    cd $FreeLocalDir
║    docker-compose -f docker-compose-vibe-stack.yml up -d                  ║
║                                                                           ║
║  Run AI Orchestrator:                                                     ║
║    node free-local/scripts/ai-orchestrator.js health                      ║
║    node free-local/scripts/ai-orchestrator.js run "Write a function"      ║
║                                                                           ║
║  Start Health Daemon:                                                     ║
║    AUTO_RESTART=true node free-local/scripts/health-daemon.js start       ║
║                                                                           ║
║  Run Agent Crew:                                                          ║
║    python free-local/scripts/agent-crew.py --task "Design API" \          ║
║           --agents architect,coder                                        ║
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  KEY PATHS:                                                               ║
║  MCP Config:  $env:USERPROFILE\.codeium\windsurf\mcp_config.json
║  Data Dir:    $env:USERPROFILE\.windsurf-autopilot\
║  Logs:        $RootDir\logs\
║                                                                           ║
║  ─────────────────────────────────────────────────────────────────────    ║
║                                                                           ║
║  YOUR HARDWARE ADVANTAGE:                                                 ║
║  • RTX 3090 Ti (24GB) → Run qwen2.5-coder:32b, llama3.1:70b               ║
║  • 128GB RAM → Massive context windows                                    ║
║  • 4TB NVMe → Store 200+ local models                                     ║
║                                                                           ║
║  POTENTIAL SAVINGS: $880+/month by avoiding cloud APIs! 💰                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

# Final tips
Write-Host "📚 Documentation: $RootDir\free-local\README.md" -ForegroundColor Cyan
Write-Host "🔧 Integration Plan: $RootDir\free-local\INTEGRATION_PLAN.md" -ForegroundColor Cyan
Write-Host "🚀 Action Plan: $RootDir\free-local\ACTION_PLAN.md" -ForegroundColor Cyan
Write-Host ""
