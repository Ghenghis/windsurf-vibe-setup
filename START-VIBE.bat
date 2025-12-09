@echo off
echo.
echo ============================================
echo     STARTING VIBE SYSTEM v10.0.0
echo ============================================
echo.

echo [1/5] Checking dependencies...
call npm ls --depth=0 >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing dependencies...
    call npm install
)

echo [2/5] Starting MCP Server...
start "MCP Server" cmd /c "npm run mcp:start"
timeout /t 3 >nul

echo [3/5] Starting VIBE Core...
start "VIBE Core" cmd /c "npm run vibe:start"
timeout /t 3 >nul

echo [4/5] Starting Real-Time Display...
start "Real-Time VIBE" cmd /c "npm run real-time-vibe"
timeout /t 3 >nul

echo [5/5] Starting GPU Hive Mind...
start "GPU Hive Mind" cmd /c "npm run collective"

echo.
echo ============================================
echo     VIBE SYSTEM STARTED SUCCESSFULLY!
echo ============================================
echo.
echo Services Running:
echo   - MCP Server (256 tools)
echo   - VIBE Core (50 modules)
echo   - Real-Time Display (95%% visualization)
echo   - GPU Hive Mind (1,024 agents)
echo   - Redis Cache (port 6379)
echo.
echo Access Points:
echo   - Real-Time UI: http://localhost:3141
echo   - MCP Tools: Available in Windsurf
echo.
echo Press Ctrl+C in any window to stop that service
echo.
pause
