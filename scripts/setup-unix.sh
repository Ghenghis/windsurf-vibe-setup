#!/bin/bash
#
# Windsurf Vibe Setup - Unix Installer (macOS/Linux)
#
# Usage:
#   ./setup-unix.sh [options]
#
# Options:
#   --skip-backup    Skip backing up existing settings
#   --skip-mcp       Skip MCP configuration
#   --force          Overwrite without prompting

set -e

# ==============================================================================
# Configuration
# ==============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    WINDSURF_SETTINGS="$HOME/Library/Application Support/Windsurf/User"
    OS_NAME="macOS"
else
    WINDSURF_SETTINGS="$HOME/.config/Windsurf/User"
    OS_NAME="Linux"
fi

CODEIUM_PATH="$HOME/.codeium/windsurf"
BACKUP_PATH="$HOME/.windsurf-backup"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_BACKUP=false
SKIP_MCP=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backup) SKIP_BACKUP=true; shift ;;
        --skip-mcp) SKIP_MCP=true; shift ;;
        --force) FORCE=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# ==============================================================================
# Helper Functions
# ==============================================================================
success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
step() { echo -e "\n${MAGENTA}▶ $1${NC}"; }

confirm() {
    if [ "$FORCE" = true ]; then
        return 0
    fi
    read -p "$1 (y/N): " response
    [[ "$response" =~ ^[Yy]$ ]]
}

# ==============================================================================
# Header
# ==============================================================================
clear
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     █░█░█ █ █▄░█ █▀▄ █▀ █░█ █▀█ █▀▀   █░█ █ █▄▄ █▀▀   █▀ █▀▀ ▀█▀ █░█ █▀█   ║
║     ▀▄▀▄▀ █ █░▀█ █▄▀ ▄█ █▄█ █▀▄ █▀░   ▀▄▀ █ █▄█ ██▄   ▄█ ██▄ ░█░ █▄█ █▀▀   ║
║                                                                              ║
║                    Enterprise Configuration Installer                         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo "Detected OS: $OS_NAME"

# ==============================================================================
# Prerequisites Check
# ==============================================================================
step "Checking prerequisites..."

# Check project files
if [ ! -f "$PROJECT_ROOT/settings.json" ]; then
    error "Cannot find settings.json. Run from windsurf-vibe-setup folder."
    exit 1
fi
success "Project files found"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js $NODE_VERSION detected"
else
    warning "Node.js not found. Some features may not work."
    info "Install from: https://nodejs.org"
fi

# Check/create Windsurf directory
if [ -d "$WINDSURF_SETTINGS" ]; then
    success "Windsurf settings directory found"
else
    warning "Windsurf settings directory not found"
    info "Creating: $WINDSURF_SETTINGS"
    mkdir -p "$WINDSURF_SETTINGS"
fi

# ==============================================================================
# Backup Existing Settings
# ==============================================================================
if [ "$SKIP_BACKUP" = false ]; then
    step "Backing up existing settings..."
    
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    BACKUP_DIR="$BACKUP_PATH/backup-$TIMESTAMP"
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "$WINDSURF_SETTINGS/settings.json" ]; then
        cp "$WINDSURF_SETTINGS/settings.json" "$BACKUP_DIR/"
        success "Backed up settings.json"
    fi
    
    if [ -f "$CODEIUM_PATH/mcp_config.json" ]; then
        cp "$CODEIUM_PATH/mcp_config.json" "$BACKUP_DIR/"
        success "Backed up mcp_config.json"
    fi
    
    if [ -f "$CODEIUM_PATH/memories/global_rules.md" ]; then
        cp "$CODEIUM_PATH/memories/global_rules.md" "$BACKUP_DIR/"
        success "Backed up global_rules.md"
    fi
    
    info "Backup location: $BACKUP_DIR"
fi

# ==============================================================================
# Install Settings
# ==============================================================================
step "Installing Windsurf settings..."

SETTINGS_DEST="$WINDSURF_SETTINGS/settings.json"

if [ -f "$SETTINGS_DEST" ] && [ "$FORCE" = false ]; then
    warning "settings.json already exists"
    if confirm "Overwrite?"; then
        cp "$PROJECT_ROOT/settings.json" "$SETTINGS_DEST"
        success "Installed settings.json"
    else
        info "Skipping settings.json"
    fi
else
    cp "$PROJECT_ROOT/settings.json" "$SETTINGS_DEST"
    success "Installed settings.json"
fi

# ==============================================================================
# Install Global Rules
# ==============================================================================
step "Installing AI global rules..."

MEMORIES_PATH="$CODEIUM_PATH/memories"
mkdir -p "$MEMORIES_PATH"

RULES_DEST="$MEMORIES_PATH/global_rules.md"

if [ -f "$RULES_DEST" ] && [ "$FORCE" = false ]; then
    warning "global_rules.md already exists"
    if confirm "Overwrite?"; then
        cp "$PROJECT_ROOT/examples/global_rules.md" "$RULES_DEST"
        success "Installed global_rules.md"
    else
        info "Skipping global_rules.md"
    fi
else
    cp "$PROJECT_ROOT/examples/global_rules.md" "$RULES_DEST"
    success "Installed global_rules.md"
fi

# ==============================================================================
# Install MCP Configuration
# ==============================================================================
if [ "$SKIP_MCP" = false ]; then
    step "Installing MCP configuration..."
    
    mkdir -p "$CODEIUM_PATH"
    MCP_DEST="$CODEIUM_PATH/mcp_config.json"
    
    if [ -f "$MCP_DEST" ] && [ "$FORCE" = false ]; then
        warning "mcp_config.json already exists"
        if confirm "Overwrite?"; then
            cp "$PROJECT_ROOT/examples/mcp_config.json" "$MCP_DEST"
            success "Installed mcp_config.json"
            warning "Remember to update paths and API keys!"
        else
            info "Skipping mcp_config.json"
        fi
    else
        cp "$PROJECT_ROOT/examples/mcp_config.json" "$MCP_DEST"
        success "Installed mcp_config.json"
        warning "Remember to update paths and API keys!"
    fi
fi

# ==============================================================================
# Install npm Dependencies
# ==============================================================================
step "Installing npm dependencies..."

cd "$PROJECT_ROOT"
if npm install 2>/dev/null; then
    success "npm dependencies installed"
else
    warning "Could not install npm dependencies"
    info "Run 'npm install' manually later"
fi

# ==============================================================================
# Validate Installation
# ==============================================================================
step "Validating installation..."

VALID=true

# Check settings.json
if node -e "JSON.parse(require('fs').readFileSync('$SETTINGS_DEST'))" 2>/dev/null; then
    success "settings.json is valid JSON"
else
    error "settings.json is invalid JSON!"
    VALID=false
fi

# Check mcp_config.json
if [ -f "$MCP_DEST" ]; then
    if node -e "JSON.parse(require('fs').readFileSync('$MCP_DEST'))" 2>/dev/null; then
        success "mcp_config.json is valid JSON"
    else
        error "mcp_config.json is invalid JSON!"
        VALID=false
    fi
fi

# ==============================================================================
# Summary
# ==============================================================================
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

if [ "$VALID" = true ]; then
    success "Installation complete!"
else
    warning "Installation completed with warnings"
fi

echo ""
echo "Files installed:"
echo "  • $SETTINGS_DEST"
echo "  • $RULES_DEST"
[ "$SKIP_MCP" = false ] && echo "  • $MCP_DEST"

[ "$SKIP_BACKUP" = false ] && echo -e "\nBackup location: $BACKUP_DIR"

echo -e "${CYAN}"
cat << "EOF"

╔══════════════════════════════════════════════════════════════════════════════╗
║                              NEXT STEPS                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  1. Restart Windsurf IDE for changes to take effect                         ║
║  2. Edit mcp_config.json to add your API keys (if using MCP servers)        ║
║  3. Open a project and test with Cmd+L (Mac) or Ctrl+L to open Cascade      ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}Happy vibe coding! 🚀${NC}"
echo ""
