#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Windsurf Vibe Setup - Windows Installer

.DESCRIPTION
    One-click installation script for Windsurf Vibe Setup.
    Backs up existing settings, copies configuration files,
    and validates the installation.

.PARAMETER SkipBackup
    Skip backing up existing settings (not recommended)

.PARAMETER SkipMcp
    Skip MCP configuration installation

.PARAMETER Force
    Overwrite existing files without prompting

.EXAMPLE
    .\setup-windows.ps1

.EXAMPLE
    .\setup-windows.ps1 -Force -SkipMcp
#>

param(
    [switch]$SkipBackup,
    [switch]$SkipMcp,
    [switch]$Force
)

# ==============================================================================
# Configuration
# ==============================================================================
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Script:WindsurfSettingsPath = "$env:APPDATA\Windsurf\User"
$Script:CodeiumPath = "$env:USERPROFILE\.codeium\windsurf"
$Script:BackupPath = "$env:USERPROFILE\.windsurf-backup"
$Script:ProjectRoot = $PSScriptRoot | Split-Path -Parent

# Colors
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success { param([string]$Message) Write-ColorOutput "✅ $Message" "Green" }
function Write-Error { param([string]$Message) Write-ColorOutput "❌ $Message" "Red" }
function Write-Warning { param([string]$Message) Write-ColorOutput "⚠️ $Message" "Yellow" }
function Write-Info { param([string]$Message) Write-ColorOutput "ℹ️ $Message" "Cyan" }
function Write-Step { param([string]$Message) Write-ColorOutput "`n▶ $Message" "Magenta" }

# ==============================================================================
# Header
# ==============================================================================
Clear-Host
Write-Host @"

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     █░█░█ █ █▄░█ █▀▄ █▀ █░█ █▀█ █▀▀   █░█ █ █▄▄ █▀▀   █▀ █▀▀ ▀█▀ █░█ █▀█   ║
║     ▀▄▀▄▀ █ █░▀█ █▄▀ ▄█ █▄█ █▀▄ █▀░   ▀▄▀ █ █▄█ ██▄   ▄█ ██▄ ░█░ █▄█ █▀▀   ║
║                                                                              ║
║                    Enterprise Configuration Installer                         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# ==============================================================================
# Prerequisites Check
# ==============================================================================
Write-Step "Checking prerequisites..."

# Check if running from correct directory
if (-not (Test-Path "$Script:ProjectRoot\settings.json")) {
    Write-Error "Cannot find settings.json. Please run this script from the windsurf-vibe-setup folder."
    Write-Info "Expected path: $Script:ProjectRoot\settings.json"
    exit 1
}
Write-Success "Project files found"

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion -match "v(\d+)\.") {
        $majorVersion = [int]$Matches[1]
        if ($majorVersion -ge 18) {
            Write-Success "Node.js $nodeVersion detected"
        } else {
            Write-Warning "Node.js $nodeVersion is older than recommended (v18+)"
        }
    }
} catch {
    Write-Warning "Node.js not found. Some features may not work."
    Write-Info "Download from: https://nodejs.org"
}

# Check if Windsurf directory exists
if (Test-Path $Script:WindsurfSettingsPath) {
    Write-Success "Windsurf settings directory found"
} else {
    Write-Warning "Windsurf settings directory not found"
    Write-Info "Creating: $Script:WindsurfSettingsPath"
    New-Item -ItemType Directory -Path $Script:WindsurfSettingsPath -Force | Out-Null
}

# ==============================================================================
# Backup Existing Settings
# ==============================================================================
if (-not $SkipBackup) {
    Write-Step "Backing up existing settings..."
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupDir = "$Script:BackupPath\backup-$timestamp"
    
    # Create backup directory
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    # Backup settings.json
    $existingSettings = "$Script:WindsurfSettingsPath\settings.json"
    if (Test-Path $existingSettings) {
        Copy-Item $existingSettings "$backupDir\settings.json"
        Write-Success "Backed up settings.json"
    }
    
    # Backup MCP config
    $existingMcp = "$Script:CodeiumPath\mcp_config.json"
    if (Test-Path $existingMcp) {
        Copy-Item $existingMcp "$backupDir\mcp_config.json"
        Write-Success "Backed up mcp_config.json"
    }
    
    # Backup global rules
    $existingRules = "$Script:CodeiumPath\memories\global_rules.md"
    if (Test-Path $existingRules) {
        Copy-Item $existingRules "$backupDir\global_rules.md"
        Write-Success "Backed up global_rules.md"
    }
    
    Write-Info "Backup location: $backupDir"
}

# ==============================================================================
# Install Settings
# ==============================================================================
Write-Step "Installing Windsurf settings..."

$settingsSource = "$Script:ProjectRoot\settings.json"
$settingsDest = "$Script:WindsurfSettingsPath\settings.json"

if ((Test-Path $settingsDest) -and -not $Force) {
    Write-Warning "settings.json already exists"
    $confirm = Read-Host "Overwrite? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Info "Skipping settings.json"
    } else {
        Copy-Item $settingsSource $settingsDest -Force
        Write-Success "Installed settings.json"
    }
} else {
    Copy-Item $settingsSource $settingsDest -Force
    Write-Success "Installed settings.json"
}

# ==============================================================================
# Install Global Rules
# ==============================================================================
Write-Step "Installing AI global rules..."

$memoriesPath = "$Script:CodeiumPath\memories"
New-Item -ItemType Directory -Path $memoriesPath -Force | Out-Null

$rulesSource = "$Script:ProjectRoot\examples\global_rules.md"
$rulesDest = "$memoriesPath\global_rules.md"

if ((Test-Path $rulesDest) -and -not $Force) {
    Write-Warning "global_rules.md already exists"
    $confirm = Read-Host "Overwrite? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Info "Skipping global_rules.md"
    } else {
        Copy-Item $rulesSource $rulesDest -Force
        Write-Success "Installed global_rules.md"
    }
} else {
    Copy-Item $rulesSource $rulesDest -Force
    Write-Success "Installed global_rules.md"
}

# ==============================================================================
# Install MCP Configuration
# ==============================================================================
if (-not $SkipMcp) {
    Write-Step "Installing MCP configuration..."
    
    $mcpSource = "$Script:ProjectRoot\examples\mcp_config.json"
    $mcpDest = "$Script:CodeiumPath\mcp_config.json"
    
    if ((Test-Path $mcpDest) -and -not $Force) {
        Write-Warning "mcp_config.json already exists"
        $confirm = Read-Host "Overwrite? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Info "Skipping mcp_config.json"
        } else {
            Copy-Item $mcpSource $mcpDest -Force
            Write-Success "Installed mcp_config.json"
            Write-Warning "Remember to update paths and API keys in mcp_config.json!"
        }
    } else {
        Copy-Item $mcpSource $mcpDest -Force
        Write-Success "Installed mcp_config.json"
        Write-Warning "Remember to update paths and API keys in mcp_config.json!"
    }
}

# ==============================================================================
# Install npm Dependencies
# ==============================================================================
Write-Step "Installing npm dependencies..."

Push-Location $Script:ProjectRoot
try {
    npm install 2>&1 | Out-Null
    Write-Success "npm dependencies installed"
} catch {
    Write-Warning "Could not install npm dependencies"
    Write-Info "Run 'npm install' manually later"
}
Pop-Location

# ==============================================================================
# Validate Installation
# ==============================================================================
Write-Step "Validating installation..."

$validationPassed = $true

# Check settings.json is valid JSON
try {
    $null = Get-Content $settingsDest -Raw | ConvertFrom-Json
    Write-Success "settings.json is valid JSON"
} catch {
    Write-Error "settings.json is invalid JSON!"
    $validationPassed = $false
}

# Check mcp_config.json is valid JSON
if (Test-Path $mcpDest) {
    try {
        $null = Get-Content $mcpDest -Raw | ConvertFrom-Json
        Write-Success "mcp_config.json is valid JSON"
    } catch {
        Write-Error "mcp_config.json is invalid JSON!"
        $validationPassed = $false
    }
}

# ==============================================================================
# Summary
# ==============================================================================
Write-Host "`n"
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($validationPassed) {
    Write-Success "Installation complete!"
} else {
    Write-Warning "Installation completed with warnings"
}

Write-Host @"

Files installed:
  • $settingsDest
  • $rulesDest
"@

if (-not $SkipMcp) {
    Write-Host "  • $mcpDest"
}

if (-not $SkipBackup) {
    Write-Host "`nBackup location: $backupDir"
}

Write-Host @"

╔══════════════════════════════════════════════════════════════════════════════╗
║                              NEXT STEPS                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  1. Restart Windsurf IDE for changes to take effect                         ║
║  2. Edit mcp_config.json to add your API keys (if using MCP servers)        ║
║  3. Open a project and test with Ctrl+L to open Cascade                     ║
║                                                                              ║
║  📖 Documentation: $Script:ProjectRoot\docs\                                                      ║
║  🐛 Issues: https://github.com/Ghenghis/windsurf-vibe-setup/issues          ║
╚══════════════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "Happy vibe coding! 🚀`n" -ForegroundColor Green
