@echo off
echo.
echo ============================================
echo     STARTING VIBE SYSTEM v10.0.0 (FIXED)
echo ============================================
echo.

echo [1/4] Checking dependencies...
call npm ls --depth=0 >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing dependencies...
    call npm install --legacy-peer-deps
)

echo [2/4] Starting MCP Server...
if exist "mcp-server\src\index.js" (
    start "MCP Server" cmd /k "node mcp-server/src/index.js"
    echo    MCP Server started!
) else (
    echo    WARNING: MCP Server not found at mcp-server/src/index.js
)
timeout /t 3 >nul

echo [3/4] Starting VIBE Core (if available)...
if exist "systems\activate-vibe.js" (
    start "VIBE Core" cmd /k "node systems/activate-vibe.js"
    echo    VIBE Core started!
) else (
    echo    WARNING: VIBE Core not found at systems/activate-vibe.js
)
timeout /t 3 >nul

echo [4/4] Starting Real-Time Display (if available)...
if exist "systems\real-time\real-time-vibe-server.js" (
    start "Real-Time Display" cmd /k "node systems/real-time/real-time-vibe-server.js"
    echo    Real-Time Display started!
) else (
    echo    WARNING: Real-Time Display not found
)

echo.
echo ============================================
echo     STARTUP COMPLETE!
echo ============================================
echo.
echo Services Status:
echo   - MCP Server: Check window for status
echo   - VIBE Core: Check window for status
echo   - Real-Time Display: Check window for status
echo.
echo NOTE: If any service shows an error, check:
echo   1. File exists at the correct path
echo   2. Dependencies are installed (npm install)
echo   3. No syntax errors in the JS files
echo.
echo Press any key to exit this window...
pause >nul
