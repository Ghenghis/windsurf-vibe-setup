# Windsurf Vibe Setup - Quick Start Guide

> Get up and running in 5 minutes - no coding experience required!

---

## 🚀 Zero-Code Option (Easiest!)

**Already have this project open in Windsurf?** Just say:

> "Set everything up for me"

The Autopilot MCP server will:
1. Install all configurations automatically
2. Set up AI rules
3. Configure MCP servers
4. Tell you when it's done

**That's it!** No commands needed. Skip to [What's Next](#whats-next) after Windsurf finishes.

---

## Manual Setup (If Needed)

If the autopilot isn't available yet, follow these steps:

## What Is This?

This project gives you a **pre-configured setup for Windsurf IDE** - the AI-powered code editor. Think of it as installing a "power-up pack" that makes the AI assistant smarter, safer, and better at helping you code.

**Perfect for "Vibe Coders"** - people who describe what they want and let AI write the code.

---

## Prerequisites

Before starting, make sure you have:

| What | How to Check | Where to Get It |
|------|--------------|-----------------|
| Windsurf IDE | Open Windsurf app | [Download Here](https://www.codeium.com/windsurf) |
| Node.js 18+ | Run `node --version` | [Download Here](https://nodejs.org/) |
| Git | Run `git --version` | [Download Here](https://git-scm.com/) |

---

## 5-Minute Setup

### Step 1: Download This Project

**Option A: Clone with Git (Recommended)**
```powershell
# Open PowerShell or Terminal, then run:
git clone https://github.com/Ghenghis/windsurf-vibe-setup.git
cd windsurf-vibe-setup
```

**Option B: Download ZIP**
1. Go to: https://github.com/Ghenghis/windsurf-vibe-setup
2. Click green "Code" button → "Download ZIP"
3. Extract to a folder you'll remember

### Step 2: Install Dependencies

```powershell
# In the project folder, run:
npm install
```

**What this does**: Installs helper tools for linting, formatting, and testing.

### Step 3: Copy Settings to Windsurf

**Windows (PowerShell)**:
```powershell
# Copy the main settings file
Copy-Item .\settings.json "$env:APPDATA\Windsurf\User\settings.json"

Write-Host "✅ Settings copied!" -ForegroundColor Green
```

**macOS/Linux (Terminal)**:
```bash
# Copy the main settings file
cp ./settings.json ~/Library/Application\ Support/Windsurf/User/settings.json  # macOS
# OR
cp ./settings.json ~/.config/Windsurf/User/settings.json  # Linux

echo "✅ Settings copied!"
```

### Step 4: Copy AI Rules (Optional but Recommended)

```powershell
# Create the memories folder if it doesn't exist
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codeium\windsurf\memories"

# Copy the AI behavior rules
Copy-Item .\examples\global_rules.md "$env:USERPROFILE\.codeium\windsurf\memories\"

Write-Host "✅ AI Rules copied!" -ForegroundColor Green
```

### Step 5: Restart Windsurf

Close and reopen Windsurf IDE for changes to take effect.

---

## ✅ You're Done!

Your Windsurf IDE now has:
- ✅ Optimized AI assistant settings
- ✅ Security protection (dangerous commands blocked)
- ✅ Performance tuning for large projects
- ✅ Multi-language support (Python, JavaScript, TypeScript)
- ✅ Smart formatting on save

---

## Quick Test

Open Windsurf and try these to verify it's working:

1. **Press `Ctrl+L`** (or `Cmd+L` on Mac) to open Cascade AI
2. **Type**: "Create a simple Python hello world script"
3. **Check** that it responds with code

If the AI responds, you're all set! 🎉

---

## What Each File Does (Simple Explanation)

| File | What It Does | Do I Need to Edit It? |
|------|--------------|----------------------|
| `settings.json` | Main Windsurf settings | No, just copy it |
| `examples/global_rules.md` | Teaches AI how to help you | Optional customization |
| `examples/mcp_config.json` | Adds AI superpowers | Yes, add your API keys |
| `scripts/*.js` | Helper tools | No, just run them |

---

## Common Tasks

### Check if Everything is Valid

```powershell
npm run test
```

This runs:
- JSON validation
- Linting checks
- Secret scanning

### Run the Benchmark

```powershell
npm run benchmark
```

This tests your Windsurf performance.

### Scan for Leaked Secrets

```powershell
npm run scan:secrets
```

Finds accidentally committed API keys or passwords.

---

## Next Steps

| What You Want | Go Here |
|---------------|---------|
| Understand how it works | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Fix a problem | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Set up MCP servers | [MCP_SETUP_GUIDE.md](MCP_SETUP_GUIDE.md) |
| Learn the scripts | [SCRIPTS_REFERENCE.md](SCRIPTS_REFERENCE.md) |
| Daily workflow tips | [WORKFLOW.md](WORKFLOW.md) |

---

## One-Liner Setup (Advanced)

For those who want everything in one command:

```powershell
# Clone, install, and copy everything
git clone https://github.com/Ghenghis/windsurf-vibe-setup.git; `
cd windsurf-vibe-setup; `
npm install; `
Copy-Item .\settings.json "$env:APPDATA\Windsurf\User\settings.json"; `
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codeium\windsurf\memories" | Out-Null; `
Copy-Item .\examples\global_rules.md "$env:USERPROFILE\.codeium\windsurf\memories\"; `
Write-Host "✅ Setup complete! Restart Windsurf." -ForegroundColor Green
```

---

## Need Help?

- 📖 Read the [full configuration guide](../Windsurf-IDE-configuration-guide.md)
- 🐛 Found a bug? [Open an issue](https://github.com/Ghenghis/windsurf-vibe-setup/issues)
- 💬 Questions? Check existing [discussions](https://github.com/Ghenghis/windsurf-vibe-setup/discussions)
