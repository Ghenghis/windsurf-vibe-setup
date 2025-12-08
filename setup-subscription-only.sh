#!/bin/bash

# ============================================================================
# CLAUDE SUBSCRIPTION SETUP - NO API KEYS ALLOWED!
# Based on Cole Medin's method from YouTube tutorial
# This script enforces subscription-only usage and blocks ALL API keys
# ============================================================================

echo "
╔══════════════════════════════════════════════════════════════════════════╗
║                    CLAUDE SUBSCRIPTION SETUP                              ║
║                                                                            ║
║         💰 Use $20/month subscription - NOT expensive API keys!           ║
║         🚫 This system BLOCKS all API keys automatically!                 ║
║         ✅ Save $480-$4980 per project!                                   ║
╚══════════════════════════════════════════════════════════════════════════╝
"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# STEP 1: Block ALL API Keys
# ============================================================================

echo -e "${YELLOW}Step 1: Checking for API keys to block...${NC}"

# List of API key variables to block
API_KEYS=(
    "ANTHROPIC_API_KEY"
    "OPENAI_API_KEY"
    "CLAUDE_API_KEY"
    "API_KEY"
    "OPENAI_KEY"
    "CLAUDE_KEY"
)

# Check and unset any API keys
FOUND_KEYS=false
for key in "${API_KEYS[@]}"; do
    if [ ! -z "${!key}" ]; then
        echo -e "${RED}❌ Found $key - BLOCKING IT!${NC}"
        unset $key
        FOUND_KEYS=true
    fi
done

if [ "$FOUND_KEYS" = true ]; then
    echo -e "${RED}Removed API keys from environment!${NC}"
    echo -e "${YELLOW}API keys are NOT allowed in this system!${NC}"
else
    echo -e "${GREEN}✅ No API keys found - good!${NC}"
fi

# Check .env file for API keys
if [ -f .env ]; then
    echo -e "${YELLOW}Checking .env file for API keys...${NC}"
    
    # Remove any API key lines from .env
    for key in "${API_KEYS[@]}"; do
        if grep -q "^$key=" .env; then
            echo -e "${RED}❌ Found $key in .env - REMOVING IT!${NC}"
            sed -i "/^$key=/d" .env
            FOUND_KEYS=true
        fi
    done
    
    if [ "$FOUND_KEYS" = true ]; then
        echo -e "${YELLOW}Cleaned .env file - API keys removed!${NC}"
    fi
fi

# ============================================================================
# STEP 2: Check for Claude Subscription
# ============================================================================

echo -e "\n${YELLOW}Step 2: Checking Claude subscription status...${NC}"

# Check if CLAUDE_TOKEN exists
if [ ! -z "$CLAUDE_TOKEN" ]; then
    echo -e "${GREEN}✅ Claude subscription token found!${NC}"
    SETUP_NEEDED=false
elif [ -f .env ] && grep -q "^CLAUDE_TOKEN=" .env; then
    echo -e "${GREEN}✅ Claude subscription token found in .env!${NC}"
    export CLAUDE_TOKEN=$(grep "^CLAUDE_TOKEN=" .env | cut -d'=' -f2)
    SETUP_NEEDED=false
else
    echo -e "${YELLOW}⚠️ Claude subscription token not found${NC}"
    SETUP_NEEDED=true
fi

# ============================================================================
# STEP 3: Install Claude CLI if needed
# ============================================================================

if [ "$SETUP_NEEDED" = true ]; then
    echo -e "\n${YELLOW}Step 3: Installing Claude CLI...${NC}"
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed!${NC}"
        echo "Please install Node.js first: https://nodejs.org"
        exit 1
    fi
    
    # Install Claude CLI globally
    echo "Installing @anthropic-ai/claude-cli..."
    npm install -g @anthropic-ai/claude-cli
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Claude CLI installed successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to install Claude CLI${NC}"
        echo "Try running: sudo npm install -g @anthropic-ai/claude-cli"
        exit 1
    fi
fi

# ============================================================================
# STEP 4: Setup Claude Subscription Token
# ============================================================================

if [ "$SETUP_NEEDED" = true ]; then
    echo -e "\n${YELLOW}Step 4: Setting up Claude subscription token...${NC}"
    echo -e "${BLUE}This will open your browser to authenticate with Claude${NC}"
    echo -e "${BLUE}You need an active Claude Pro subscription ($20/month)${NC}"
    echo ""
    echo "Press Enter to continue..."
    read
    
    # Run Claude setup
    claude setup-token
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}✅ Token generated successfully!${NC}"
        echo -e "${YELLOW}Now you need to add it to your .env file${NC}"
        echo ""
        echo "Copy the token shown above and add to .env:"
        echo "CLAUDE_TOKEN=your_token_here"
        echo ""
        echo "Press Enter after adding the token to .env..."
        read
    else
        echo -e "${RED}❌ Token setup failed${NC}"
        echo "Please try again or check your Claude subscription"
        exit 1
    fi
fi

# ============================================================================
# STEP 5: Verify Setup
# ============================================================================

echo -e "\n${YELLOW}Step 5: Verifying setup...${NC}"

# Re-check for token
if [ -f .env ]; then
    source .env
fi

# Final verification
VERIFICATION_PASSED=true

# Check no API keys exist
for key in "${API_KEYS[@]}"; do
    if [ ! -z "${!key}" ]; then
        echo -e "${RED}❌ ERROR: $key is still set!${NC}"
        VERIFICATION_PASSED=false
    fi
done

# Check token exists
if [ -z "$CLAUDE_TOKEN" ]; then
    echo -e "${RED}❌ ERROR: CLAUDE_TOKEN not found!${NC}"
    VERIFICATION_PASSED=false
else
    echo -e "${GREEN}✅ Claude subscription token verified${NC}"
fi

# ============================================================================
# STEP 6: Create/Update .env file
# ============================================================================

if [ "$VERIFICATION_PASSED" = true ]; then
    echo -e "\n${YELLOW}Step 6: Updating .env file...${NC}"
    
    # Backup existing .env if it exists
    if [ -f .env ]; then
        cp .env .env.backup
        echo -e "${BLUE}Backed up existing .env to .env.backup${NC}"
    fi
    
    # Create new .env with subscription-only config
    cat > .env << 'EOF'
# ============================================================================
# CLAUDE SUBSCRIPTION CONFIGURATION - NO API KEYS ALLOWED!
# ============================================================================
# This system ONLY uses Claude subscription ($20/month)
# API keys are automatically BLOCKED and will cause errors!
# ============================================================================

# Claude Subscription Token (NOT an API key!)
# Generated by: claude setup-token
CLAUDE_TOKEN=YOUR_TOKEN_HERE

# 🚨 WARNING: Do NOT add these (they will be BLOCKED):
# ❌ ANTHROPIC_API_KEY
# ❌ OPENAI_API_KEY  
# ❌ CLAUDE_API_KEY
# ❌ Any other API keys

# Local LLM Providers (these are OK - they're local)
OLLAMA_URL=http://localhost:11434
LMSTUDIO_URL=http://localhost:1234

# Other Configuration
HARNESS_ENABLED=true
HARNESS_MAX_HOURS=24
HARNESS_MAX_SESSIONS=100
EOF
    
    # Update token if we have it
    if [ ! -z "$CLAUDE_TOKEN" ]; then
        sed -i "s/YOUR_TOKEN_HERE/$CLAUDE_TOKEN/" .env
        echo -e "${GREEN}✅ Updated .env with your token${NC}"
    else
        echo -e "${YELLOW}Remember to update CLAUDE_TOKEN in .env!${NC}"
    fi
fi

# ============================================================================
# FINAL STATUS
# ============================================================================

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"

if [ "$VERIFICATION_PASSED" = true ]; then
    echo -e "${GREEN}🎉 SETUP COMPLETE! 🎉${NC}"
    echo -e "${GREEN}You're using Claude subscription ($20/month)${NC}"
    echo -e "${GREEN}NO API charges - run for 24-48 hours for the same $20!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Make sure CLAUDE_TOKEN is in your .env file"
    echo "2. Run: npm start"
    echo "3. Use: harness_start to begin 24-hour development!"
    echo ""
    echo -e "${YELLOW}Remember: This system will REJECT any API keys!${NC}"
else
    echo -e "${RED}❌ SETUP INCOMPLETE${NC}"
    echo ""
    echo "Please fix the issues above and run this script again"
    echo "Make sure you have:"
    echo "1. An active Claude Pro subscription ($20/month)"
    echo "2. Removed ALL API keys from environment"
    echo "3. Added CLAUDE_TOKEN to your .env file"
fi

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# ============================================================================
# Create verification script
# ============================================================================

cat > verify-subscription.sh << 'EOF'
#!/bin/bash

# Quick verification script
echo "Checking subscription-only setup..."

# Check for blocked API keys
if [ ! -z "$ANTHROPIC_API_KEY" ] || [ ! -z "$OPENAI_API_KEY" ]; then
    echo "❌ ERROR: API keys found! Remove them!"
    exit 1
fi

# Check for subscription token
if [ -z "$CLAUDE_TOKEN" ]; then
    if [ -f .env ]; then
        source .env
    fi
fi

if [ -z "$CLAUDE_TOKEN" ]; then
    echo "❌ ERROR: CLAUDE_TOKEN not found!"
    echo "Run: ./setup-subscription-only.sh"
    exit 1
fi

echo "✅ Setup verified!"
echo "Using Claude subscription - NO API charges!"
echo "Ready for 24-48 hour development sessions!"
EOF

chmod +x verify-subscription.sh

echo -e "\n${BLUE}Created verify-subscription.sh for quick checks${NC}"
