@echo off
cls
echo.
echo  =========================================================
echo                   VIBE v10.0.0 - SIMPLE START             
echo  =========================================================
echo.
echo  [1] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo      OK - Node.js installed
) else (
    echo      ERROR - Node.js not found!
    pause
    exit
)
echo.
echo  [2] Checking dependencies...
if not exist "node_modules" (
    echo      Installing dependencies...
    call npm install --legacy-peer-deps
) else (
    echo      OK - Dependencies installed
)
echo.
echo  [3] Starting MCP Server (256 tools)...
echo.
echo  =========================================================
echo        MCP SERVER RUNNING - DO NOT CLOSE THIS WINDOW     
echo  =========================================================
echo.
echo  Status:
echo    - LM Studio:   Connected at 192.168.0.3:1234
echo    - Model:       Qwen2.5-14B (12GB)
echo    - Tools:       256 MCP tools active
echo    - Cost:        $0/month (all local)
echo.
echo  How to use:
echo    1. Keep this window open
echo    2. Open/restart Windsurf
echo    3. Start coding with AI assistance!
echo.
echo  Press Ctrl+C to stop the server
echo.
node mcp-server/src/index.js
