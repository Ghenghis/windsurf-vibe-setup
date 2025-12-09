# Windsurf Vibe Setup - Troubleshooting Guide

> Solutions to common problems - you're not alone!

---

## Quick Fixes

### 🔴 Windsurf Won't Start After Copying Settings

**Problem**: After copying `settings.json`, Windsurf crashes or won't open.

**Fix**:

```powershell
# Delete the settings and restart
Remove-Item "$env:APPDATA\Windsurf\User\settings.json"

# Restart Windsurf (it will create fresh settings)
# Then copy settings line-by-line to identify the problem
```

**Why it happens**: Invalid JSON or settings incompatible with your Windsurf version.

---

### 🔴 "npm install" Fails

**Problem**: Running `npm install` shows errors.

**Common Causes & Fixes**:

**1. Node.js not installed or outdated**

```powershell
# Check version (need 18+)
node --version

# If lower than 18, download new version from nodejs.org
```

**2. Network/proxy issues**

```powershell
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

**3. Permission errors (Windows)**

```powershell
# Run PowerShell as Administrator, then:
npm install
```

---

### 🔴 AI (Cascade) Not Responding

**Problem**: You press Ctrl+L but nothing happens, or AI doesn't respond.

**Fixes**:

**1. Check if Windsurf is logged in**

- Click your profile icon (bottom left)
- Make sure you're signed in to Codeium

**2. Check internet connection**

- Cascade needs internet to work
- Try opening a website in your browser

**3. Restart Windsurf**

- Close completely and reopen

**4. Clear Cascade cache**

```powershell
# Windows: Delete cache folder
Remove-Item -Recurse -Force "$env:USERPROFILE\.codeium\*"

# Restart Windsurf
```

---

### 🔴 Settings Not Taking Effect

**Problem**: You copied settings.json but Windsurf looks/behaves the same.

**Fixes**:

**1. Verify the file was copied**

```powershell
# Check if file exists
Test-Path "$env:APPDATA\Windsurf\User\settings.json"

# View contents
Get-Content "$env:APPDATA\Windsurf\User\settings.json" | Select-Object -First 20
```

**2. Restart Windsurf completely**

- Close all Windsurf windows
- Wait 5 seconds
- Reopen

**3. Check for JSON errors**

```powershell
# In the project folder:
npm run validate:json
```

---

### 🔴 MCP Servers Not Working

**Problem**: AI doesn't use GitHub/Docker/other MCP tools.

**Fixes**:

**1. Verify mcp_config.json location**

```powershell
# Check if file exists
Test-Path "$env:USERPROFILE\.codeium\windsurf\mcp_config.json"

# If not, copy it:
Copy-Item .\examples\mcp_config.json "$env:USERPROFILE\.codeium\windsurf\"
```

**2. Check if Node.js can run npx**

```powershell
# Test npx
npx --version

# If this fails, reinstall Node.js
```

**3. Check environment variables**

```powershell
# For GitHub MCP, you need a PAT
$env:GITHUB_PAT = "your_token_here"

# Or add to Windows environment variables permanently
```

**4. Restart Windsurf after adding mcp_config.json**

---

### 🔴 Python Not Found / Wrong Python

**Problem**: Python errors or wrong version being used.

**Fixes**:

**1. Check Python installation**

```powershell
python --version
# or
python3 --version
```

**2. Update settings.json Python path**

```json
// For Windows:
"python.defaultInterpreterPath": "C:\\Users\\YourName\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"

// For virtual environment:
"python.defaultInterpreterPath": "${workspaceFolder}\\.venv\\Scripts\\python.exe"
```

**3. Create virtual environment**

```powershell
# In your project folder:
python -m venv .venv

# Activate it:
.\.venv\Scripts\Activate

# Windsurf should now detect it
```

---

### 🔴 Benchmark Fails to Run

**Problem**: `npm run benchmark` or `Run-WindsurfBenchmark.ps1` errors.

**Fixes**:

**1. Make sure you're in the right folder**

```powershell
# Should be in windsurf-vibe-setup folder
cd C:\Users\Admin\windsurf-vibe-setup
```

**2. PowerShell execution policy**

```powershell
# Allow scripts to run (one-time)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**3. Run directly**

```powershell
pwsh .\scripts\testing\Run-WindsurfBenchmark.ps1
```

---

### 🔴 Format on Save Not Working

**Problem**: Files don't auto-format when you save.

**Fixes**:

**1. Check if Prettier is installed**

- In Windsurf: Extensions sidebar (Ctrl+Shift+X)
- Search "Prettier"
- Install "Prettier - Code formatter"

**2. Verify settings**

```json
// In settings.json, make sure these exist:
"editor.formatOnSave": true,
"[javascript]": {
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

**3. Check for conflicting formatters**

- Disable other formatters
- Only keep Prettier

---

## Error Messages Explained

### "Cannot find module..."

**Meaning**: A JavaScript package is missing.

**Fix**:

```powershell
npm install
```

### "EACCES: permission denied"

**Meaning**: No permission to write files.

**Fix (Windows)**:

- Run PowerShell as Administrator

**Fix (macOS/Linux)**:

```bash
sudo chown -R $USER:$USER ~/.codeium
```

### "JSON Parse Error" or "Unexpected token"

**Meaning**: Invalid JSON syntax.

**Fix**:

```powershell
# Find the problem:
npm run validate:json

# Look for the file it mentions and fix:
# - Missing commas
# - Trailing commas
# - Missing quotes
```

### "Command not found: npx"

**Meaning**: Node.js not installed or not in PATH.

**Fix**:

1. Install Node.js from https://nodejs.org
2. Restart your terminal
3. Try again

---

## Performance Issues

### Windsurf is Slow/Laggy

**Quick fixes**:

1. **Exclude large folders from watching**

   - Already configured in settings.json
   - Add more if needed:

   ```json
   "files.watcherExclude": {
     "**/your_big_folder/**": true
   }
   ```

2. **Close unused tabs**

   - Windsurf keeps files in memory

3. **Increase memory limit** (in settings.json):

   ```json
   "files.maxMemoryForLargeFilesMB": 8192
   ```

4. **Restart Windsurf**
   - Clears memory buildup

### AI Responses are Slow

**Possible causes**:

- Internet connection
- Large codebase being indexed
- Many files open

**Fixes**:

- Wait for initial indexing to complete
- Close files you're not using
- Use `Ctrl+Enter` for Fast Context mode

---

## Getting More Help

### 1. Check Windsurf Logs

```powershell
# Windows - Open log folder
explorer "$env:USERPROFILE\.codeium\windsurf\logs"
```

### 2. Run Diagnostics

```powershell
# In the project folder:
npm run test        # Check everything
npm run validate:json   # Check JSON files
npm run scan:secrets    # Check for leaked secrets
```

### 3. Reset to Defaults

```powershell
# Delete all Codeium/Windsurf config (nuclear option)
Remove-Item -Recurse -Force "$env:USERPROFILE\.codeium"
Remove-Item "$env:APPDATA\Windsurf\User\settings.json"

# Restart Windsurf - it will create fresh defaults
```

### 4. Report a Bug

1. Go to: https://github.com/Ghenghis/windsurf-vibe-setup/issues
2. Click "New Issue"
3. Use the Bug Report template
4. Include:
   - What you tried to do
   - What happened
   - Error messages (screenshot or copy/paste)
   - Your OS version

---

## Checklist When Something Breaks

Use this checklist to diagnose problems:

- [ ] Is Windsurf open and logged in?
- [ ] Did you restart Windsurf after changes?
- [ ] Is Node.js installed? (`node --version`)
- [ ] Did `npm install` complete without errors?
- [ ] Is the file in the right location?
- [ ] Is the JSON valid? (`npm run validate:json`)
- [ ] Are there any error messages? (Check terminal output)
- [ ] Did you try the specific fix for your error?

---

## Still Stuck?

If nothing works:

1. **Take a screenshot** of the error
2. **Copy the exact error message**
3. **Open an issue** on GitHub with details
4. **Include**: OS version, Windsurf version, what you tried

We'll help you out! 🚀
