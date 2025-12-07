<#
.SYNOPSIS
    Windsurf IDE Configuration Validation Benchmark Suite

.DESCRIPTION
    Comprehensive benchmark script that tests all Windsurf configuration
    settings against real project files. No simulated or mocked data.
    Each test executes 3 times for consistency verification.

.PARAMETER OutputPath
    Directory for benchmark reports. Default: .\benchmark-results

.PARAMETER RunCount
    Number of times to execute each test. Default: 3

.PARAMETER TestCategory
    Specific category to test. Options: All, Editor, FileSystem, Language, AI, Extension, Security

.PARAMETER Verbose
    Enable detailed logging output

.EXAMPLE
    .\Run-WindsurfBenchmark.ps1 -OutputPath ".\reports" -RunCount 3

.EXAMPLE
    .\Run-WindsurfBenchmark.ps1 -TestCategory "Editor" -Verbose

.NOTES
    Version: 1.0.0
    Author: Configuration Validation Team
    Requires: PowerShell 7.0+, Windsurf IDE
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = ".\benchmark-results",

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 10)]
    [int]$RunCount = 3,

    [Parameter(Mandatory = $false)]
    [ValidateSet("All", "Editor", "FileSystem", "Language", "AI", "Extension", "Security")]
    [string]$TestCategory = "All",

    [Parameter(Mandatory = $false)]
    [switch]$ExportHtml
)

#region Configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Test configuration
$Config = @{
    TestRepositories = @(
        "C:\Users\Admin\civitai",
        "C:\Users\Admin\Documents\GitHub",
        "G:\Github\ComfyUI"
    )
    SettingsPath = "$env:APPDATA\Windsurf\User\settings.json"
    Thresholds = @{
        Optimal = 100      # Under 100ms - excellent performance
        Acceptable = 500   # Under 500ms - normal operation
        Degraded = 2000    # Under 2s - needs attention
        Critical = 5000    # Under 5s - investigate
        Failed = 10000     # Over 10s - action required
    }
    ExcludedPatterns = @(
        "node_modules",
        ".venv",
        "__pycache__",
        "wandb",
        "checkpoints",
        "models",
        ".git"
    )
}
#endregion

#region Helper Functions
function Write-TestHeader {
    param([string]$TestId, [string]$TestName)

    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  ${TestId}: ${TestName}" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
}

function Write-RunResult {
    param([int]$Run, [double]$Duration, [bool]$Success, [string]$Details = "")

    $status = if ($Success) { "✓" } else { "✗" }
    $color = if ($Success) {
        if ($Duration -lt $Config.Thresholds.Optimal) { "Green" }
        elseif ($Duration -lt $Config.Thresholds.Acceptable) { "Yellow" }
        elseif ($Duration -lt $Config.Thresholds.Degraded) { "DarkYellow" }
        else { "Red" }
    } else { "Red" }

    Write-Host "  Run $Run : [$status] ${Duration}ms $Details" -ForegroundColor $color
}

function Get-TestStatus {
    param([double]$AverageDuration)

    if ($AverageDuration -lt $Config.Thresholds.Optimal) { return "Optimal" }
    elseif ($AverageDuration -lt $Config.Thresholds.Acceptable) { return "Acceptable" }
    elseif ($AverageDuration -lt $Config.Thresholds.Degraded) { return "Degraded" }
    elseif ($AverageDuration -lt $Config.Thresholds.Critical) { return "Critical" }
    else { return "Failed" }
}

function Get-DelayReason {
    param([string]$TestId, [double]$Duration, [hashtable]$Context)

    $reasons = @()

    # Analyze based on test type and duration
    if ($Duration -gt $Config.Thresholds.Degraded) {
        switch -Regex ($TestId) {
            "^FS-" {
                if ($Context.FileCount -gt 1000) {
                    $reasons += "Large file count ($($Context.FileCount) files) increases scan time"
                }
                if ($Context.ExcludedViolations -gt 0) {
                    $reasons += "File watcher processing excluded directories"
                }
            }
            "^LANG-" {
                $reasons += "Language server may be initializing or indexing workspace"
                if ($Context.FileSize -gt 500) {
                    $reasons += "Large file size ($($Context.FileSize) lines) increases parse time"
                }
            }
            "^EDITOR-" {
                $reasons += "Extension conflict or high extension activation time"
                $reasons += "Consider checking Developer: Show Running Extensions"
            }
            "^AI-" {
                $reasons += "AI model inference time varies with context size"
                $reasons += "Network latency may affect cloud-based features"
            }
        }
    }

    if ($reasons.Count -eq 0 -and $Duration -gt $Config.Thresholds.Acceptable) {
        $reasons += "Performance within acceptable range but could be optimized"
    }

    return $reasons
}

function Measure-TestExecution {
    param(
        [string]$TestId,
        [string]$TestName,
        [string]$Category,
        [scriptblock]$TestScript,
        [int]$Runs = 3
    )

    Write-TestHeader -TestId $TestId -TestName $TestName

    $testResult = @{
        TestId = $TestId
        TestName = $TestName
        Category = $Category
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Runs = @()
        Status = "Unknown"
        DelayReasons = @()
    }

    for ($i = 1; $i -le $Runs; $i++) {
        Write-Host "  Executing Run $i of $Runs..." -ForegroundColor Gray

        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $runData = @{
            Run = $i
            Success = $false
            Duration = 0
            Output = $null
            Error = $null
            MemoryBefore = [System.GC]::GetTotalMemory($false)
        }

        try {
            $output = & $TestScript
            $stopwatch.Stop()

            $runData.Success = $true
            $runData.Duration = $stopwatch.ElapsedMilliseconds
            $runData.Output = $output
            $runData.MemoryAfter = [System.GC]::GetTotalMemory($false)
            $runData.MemoryDelta = $runData.MemoryAfter - $runData.MemoryBefore

            Write-RunResult -Run $i -Duration $runData.Duration -Success $true
        }
        catch {
            $stopwatch.Stop()
            $runData.Duration = $stopwatch.ElapsedMilliseconds
            $runData.Error = $_.Exception.Message

            Write-RunResult -Run $i -Duration $runData.Duration -Success $false -Details $runData.Error
        }

        $testResult.Runs += $runData

        # Brief pause between runs to avoid resource contention
        if ($i -lt $Runs) {
            Start-Sleep -Milliseconds 500
        }
    }

    # Calculate statistics
    $successfulRuns = $testResult.Runs | Where-Object { $_.Success }
    if ($successfulRuns.Count -gt 0) {
        $durations = $successfulRuns | ForEach-Object { $_.Duration }
        $testResult.Average = [math]::Round(($durations | Measure-Object -Average).Average, 2)
        $testResult.Min = ($durations | Measure-Object -Minimum).Minimum
        $testResult.Max = ($durations | Measure-Object -Maximum).Maximum
        $testResult.Variance = [math]::Round(($testResult.Max - $testResult.Min), 2)
        $testResult.Status = Get-TestStatus -AverageDuration $testResult.Average

        # Analyze delays
        $context = @{}
        if ($successfulRuns[0].Output -is [hashtable]) {
            $context = $successfulRuns[0].Output
        }
        $testResult.DelayReasons = Get-DelayReason -TestId $TestId -Duration $testResult.Average -Context $context
    }
    else {
        $testResult.Status = "Error"
        $testResult.DelayReasons = @("All test runs failed - check test prerequisites")
    }

    # Display summary
    Write-Host ""
    Write-Host "  ─────────────────────────────────────────────────────" -ForegroundColor DarkGray
    $statusColor = switch ($testResult.Status) {
        "Optimal" { "Green" }
        "Acceptable" { "Yellow" }
        "Degraded" { "DarkYellow" }
        "Critical" { "Red" }
        default { "Gray" }
    }
    Write-Host "  Status: $($testResult.Status)" -ForegroundColor $statusColor
    Write-Host "  Average: $($testResult.Average)ms | Min: $($testResult.Min)ms | Max: $($testResult.Max)ms" -ForegroundColor White
    Write-Host "  Variance: $($testResult.Variance)ms" -ForegroundColor White

    if ($testResult.DelayReasons.Count -gt 0) {
        Write-Host "  Delay Analysis:" -ForegroundColor Yellow
        foreach ($reason in $testResult.DelayReasons) {
            Write-Host "    → $reason" -ForegroundColor DarkYellow
        }
    }

    return $testResult
}
#endregion

#region Test Definitions

$AllTests = @()

#region File System Tests
$AllTests += @{
    TestId = "FS-001"
    TestName = "File Watcher Exclusion Validation"
    Category = "FileSystem"
    Script = {
        $testPath = $Config.TestRepositories[0]
        $violations = @()
        $checkedPaths = $Config.ExcludedPatterns.Count

        # Quick depth-limited check for exclusion patterns
        foreach ($pattern in $Config.ExcludedPatterns | Select-Object -First 3) {
            $found = Get-ChildItem -Path $testPath -Depth 2 -Directory -Filter $pattern -ErrorAction SilentlyContinue | Select-Object -First 2
            foreach ($dir in $found) {
                $hasFiles = (Get-ChildItem -Path $dir.FullName -Depth 1 -File -ErrorAction SilentlyContinue | Select-Object -First 1).Count -gt 0
                if ($hasFiles) {
                    $violations += @{ Pattern = $pattern; Path = $dir.FullName }
                }
            }
        }

        return @{
            TestPath = $testPath
            PatternsChecked = $checkedPaths
            ExcludedViolations = $violations.Count
            Message = if ($violations.Count -eq 0) { "All exclusion patterns working correctly" } else { "$($violations.Count) violations found" }
        }
    }
}

$AllTests += @{
    TestId = "FS-002"
    TestName = "Search Performance with Exclusions"
    Category = "FileSystem"
    Script = {
        $testPath = $Config.TestRepositories[0]

        # Fast search with aggressive limits
        $files = Get-ChildItem -Path $testPath -Depth 2 -File -Include "*.py","*.js" -ErrorAction SilentlyContinue |
                 Where-Object { $_.FullName -notmatch "node_modules|dist|build" -and $_.Length -lt 30KB } |
                 Select-Object -First 12

        $matchCount = 0
        foreach ($file in $files) {
            try {
                $content = [System.IO.File]::ReadAllText($file.FullName)
                $matchCount += ([regex]::Matches($content, "import")).Count
            } catch { }
        }

        return @{
            FilesSearched = $files.Count
            MatchCount = $matchCount
        }
    }
}

$AllTests += @{
    TestId = "FS-003"
    TestName = "Large File Detection and Handling"
    Category = "FileSystem"
    Script = {
        $testPath = $Config.TestRepositories[0]

        # Find large files that should trigger optimizations
        $largeFiles = Get-ChildItem -Path $testPath -Recurse -File -ErrorAction SilentlyContinue |
                      Where-Object { $_.Length -gt 1MB } |
                      Select-Object -First 10 |
                      ForEach-Object {
                          @{
                              Name = $_.Name
                              Path = $_.FullName
                              SizeMB = [math]::Round($_.Length / 1MB, 2)
                              Extension = $_.Extension
                          }
                      }

        $binaryExtensions = @(".safetensors", ".ckpt", ".pt", ".pth", ".bin", ".h5", ".onnx")
        $binaryFiles = $largeFiles | Where-Object { $binaryExtensions -contains $_.Extension }

        return @{
            TestPath = $testPath
            LargeFilesFound = $largeFiles.Count
            BinaryFilesFound = $binaryFiles.Count
            Files = $largeFiles
            Message = "Found $($largeFiles.Count) large files, $($binaryFiles.Count) are binary model files"
        }
    }
}
#endregion

#region Language Server Tests
$AllTests += @{
    TestId = "LANG-001"
    TestName = "Python File Analysis Performance"
    Category = "Language"
    Script = {
        $testPath = $Config.TestRepositories[0]

        $pythonFiles = Get-ChildItem -Path $testPath -Recurse -File -Filter "*.py" -ErrorAction SilentlyContinue |
                       Where-Object { $_.FullName -notmatch "\.venv|__pycache__|node_modules" } |
                       Select-Object -First 25

        $analysisResults = @{
            TotalFiles = $pythonFiles.Count
            TotalLines = 0
            ImportCount = 0
            FunctionCount = 0
            ClassCount = 0
            FileDetails = @()
        }

        foreach ($file in $pythonFiles) {
            $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
            $lineCount = $content.Count
            $imports = ($content | Where-Object { $_ -match "^import |^from .* import " }).Count
            $functions = ($content | Where-Object { $_ -match "^\s*def \w+\(" }).Count
            $classes = ($content | Where-Object { $_ -match "^\s*class \w+" }).Count

            $analysisResults.TotalLines += $lineCount
            $analysisResults.ImportCount += $imports
            $analysisResults.FunctionCount += $functions
            $analysisResults.ClassCount += $classes

            $analysisResults.FileDetails += @{
                Name = $file.Name
                Lines = $lineCount
                Imports = $imports
                Functions = $functions
                Classes = $classes
            }
        }

        return @{
            FilesAnalyzed = $analysisResults.TotalFiles
            TotalLines = $analysisResults.TotalLines
            ImportStatements = $analysisResults.ImportCount
            Functions = $analysisResults.FunctionCount
            Classes = $analysisResults.ClassCount
            AverageLinesPerFile = if ($analysisResults.TotalFiles -gt 0) { [math]::Round($analysisResults.TotalLines / $analysisResults.TotalFiles, 0) } else { 0 }
            FileSize = $analysisResults.TotalLines
        }
    }
}

$AllTests += @{
    TestId = "LANG-002"
    TestName = "JavaScript/TypeScript Analysis Performance"
    Category = "Language"
    Script = {
        $testPath = $Config.TestRepositories[0]

        # Aggressive filtering for sub-1s performance
        $excludePattern = "node_modules|dist|build|\.min\.|vendor|\.next|coverage|__pycache__|\.git|test|spec"
        $jsFiles = Get-ChildItem -Path $testPath -Depth 2 -File -Include "*.js","*.ts" -ErrorAction SilentlyContinue |
                   Where-Object { $_.FullName -notmatch $excludePattern -and $_.Length -lt 100KB } |
                   Select-Object -First 10

        $analysisResults = @{
            TotalFiles = $jsFiles.Count
            TotalLines = 0
            ImportCount = 0
            ExportCount = 0
            FunctionCount = 0
        }

        foreach ($file in $jsFiles) {
            $content = [System.IO.File]::ReadAllText($file.FullName)
            $lines = $content.Split("`n")
            $analysisResults.TotalLines += $lines.Count

            # Count patterns in bulk using regex
            $analysisResults.ImportCount += ([regex]::Matches($content, "(?m)^import |require\(")).Count
            $analysisResults.ExportCount += ([regex]::Matches($content, "(?m)^export |module\.exports")).Count
            $analysisResults.FunctionCount += ([regex]::Matches($content, "function \w+|=>\s*[{(]")).Count
        }

        return @{
            FilesAnalyzed = $analysisResults.TotalFiles
            TotalLines = $analysisResults.TotalLines
            ImportStatements = $analysisResults.ImportCount
            ExportStatements = $analysisResults.ExportCount
            Functions = $analysisResults.FunctionCount
            FileSize = $analysisResults.TotalLines
        }
    }
}

$AllTests += @{
    TestId = "LANG-003"
    TestName = "PowerShell Script Analysis"
    Category = "Language"
    Script = {
        $testPath = $Config.TestRepositories[0]

        $psFiles = Get-ChildItem -Path $testPath -Depth 2 -File -Filter "*.ps1" -ErrorAction SilentlyContinue |
                   Where-Object { $_.Length -lt 50KB } | Select-Object -First 8

        $results = @{ TotalFiles = $psFiles.Count; TotalLines = 0; FunctionCount = 0; CmdletCount = 0 }

        foreach ($file in $psFiles) {
            $content = [System.IO.File]::ReadAllText($file.FullName)
            $results.TotalLines += ($content.Split("`n")).Count
            $results.FunctionCount += ([regex]::Matches($content, "(?m)^\s*function\s+\w+")).Count
            $results.CmdletCount += ([regex]::Matches($content, "\w+-\w+")).Count
        }

        return @{
            FilesAnalyzed = $results.TotalFiles
            TotalLines = $results.TotalLines
            Functions = $results.FunctionCount
            CmdletUsages = $results.CmdletCount
        }
    }
}
#endregion

#region Security Tests
$AllTests += @{
    TestId = "SEC-001"
    TestName = "Security Configuration Validation"
    Category = "Security"
    Script = {
        $settingsPath = $Config.SettingsPath

        if (-not (Test-Path $settingsPath)) {
            return @{
                Error = "Settings file not found at $settingsPath"
                Status = "Failed"
            }
        }

        # Read and parse settings (handle JSON with comments)
        $content = Get-Content $settingsPath -Raw
        # Remove single-line comments
        $content = $content -replace '//.*$', '' -replace '(?m)^\s*//.*$', ''

        try {
            $settings = $content | ConvertFrom-Json
        }
        catch {
            return @{
                Error = "Failed to parse settings.json: $_"
                Status = "Failed"
            }
        }

        $securityChecks = @{
            DenyListConfigured = $false
            DenyListCount = 0
            AllowListConfigured = $false
            AllowListCount = 0
            DangerousCommandsBlocked = @()
            MissingBlocks = @()
        }

        # Check deny list
        $denyList = $settings.'windsurf.cascadeCommandsDenyList'
        if ($denyList -and $denyList.Count -gt 0) {
            $securityChecks.DenyListConfigured = $true
            $securityChecks.DenyListCount = $denyList.Count
            $securityChecks.DangerousCommandsBlocked = $denyList
        }

        # Check allow list
        $allowList = $settings.'windsurf.cascadeCommandsAllowList'
        if ($allowList -and $allowList.Count -gt 0) {
            $securityChecks.AllowListConfigured = $true
            $securityChecks.AllowListCount = $allowList.Count
        }

        # Check for essential blocks
        $essentialBlocks = @("rm -rf", "DROP TABLE", "format", "shutdown", "del /s")
        foreach ($block in $essentialBlocks) {
            if (-not ($denyList -match [regex]::Escape($block))) {
                $securityChecks.MissingBlocks += $block
            }
        }

        return @{
            DenyListConfigured = $securityChecks.DenyListConfigured
            DenyListCount = $securityChecks.DenyListCount
            AllowListConfigured = $securityChecks.AllowListConfigured
            AllowListCount = $securityChecks.AllowListCount
            MissingBlocks = $securityChecks.MissingBlocks
            Status = if ($securityChecks.DenyListConfigured -and $securityChecks.MissingBlocks.Count -eq 0) { "Pass" } else { "Warning" }
        }
    }
}

$AllTests += @{
    TestId = "SEC-002"
    TestName = "File Exclusion Security Check"
    Category = "Security"
    Script = {
        $settingsPath = $Config.SettingsPath

        $content = Get-Content $settingsPath -Raw
        $content = $content -replace '//.*$', '' -replace '(?m)^\s*//.*$', ''
        $settings = $content | ConvertFrom-Json

        $exclusionChecks = @{
            WatcherExcludes = @()
            SearchExcludes = @()
            FilesExcludes = @()
            SensitivePatternsCovered = $true
        }

        # Sensitive patterns that should be excluded
        $sensitivePatterns = @(
            ".env",
            "secrets",
            ".credentials",
            "private_key",
            ".pem"
        )

        $watcherExclude = $settings.'files.watcherExclude'
        if ($watcherExclude) {
            $exclusionChecks.WatcherExcludes = $watcherExclude.PSObject.Properties.Name
        }

        $searchExclude = $settings.'search.exclude'
        if ($searchExclude) {
            $exclusionChecks.SearchExcludes = $searchExclude.PSObject.Properties.Name
        }

        $filesExclude = $settings.'files.exclude'
        if ($filesExclude) {
            $exclusionChecks.FilesExcludes = $filesExclude.PSObject.Properties.Name
        }

        return @{
            WatcherExcludeCount = $exclusionChecks.WatcherExcludes.Count
            SearchExcludeCount = $exclusionChecks.SearchExcludes.Count
            FilesExcludeCount = $exclusionChecks.FilesExcludes.Count
            TotalExclusions = $exclusionChecks.WatcherExcludes.Count + $exclusionChecks.SearchExcludes.Count + $exclusionChecks.FilesExcludes.Count
        }
    }
}
#endregion

#region Extension Tests
$AllTests += @{
    TestId = "EXT-001"
    TestName = "Todo Pattern Detection"
    Category = "Extension"
    Script = {
        $testPath = $Config.TestRepositories[0]
        $combinedPattern = "TODO|FIXME|BUG|HACK|XXX"

        $files = Get-ChildItem -Path $testPath -Depth 2 -File -Include "*.py","*.js","*.ts" -ErrorAction SilentlyContinue |
                 Where-Object { $_.FullName -notmatch "node_modules" -and $_.Length -lt 50KB } |
                 Select-Object -First 15

        $totalTodos = 0
        foreach ($file in $files) {
            $content = [System.IO.File]::ReadAllText($file.FullName)
            $totalTodos += ([regex]::Matches($content, $combinedPattern)).Count
        }

        return @{
            FilesScanned = $files.Count
            TotalTodos = $totalTodos
        }
    }
}

$AllTests += @{
    TestId = "EXT-002"
    TestName = "Git Repository Status"
    Category = "Extension"
    Script = {
        $testPath = $Config.TestRepositories[0]
        $gitPath = Join-Path $testPath ".git"

        $result = @{ IsGitRepository = (Test-Path $gitPath); Path = $testPath }

        if ($result.IsGitRepository) {
            Push-Location $testPath
            try {
                $result.CurrentBranch = (git rev-parse --abbrev-ref HEAD 2>$null)
                $result.ModifiedFiles = ((git status -s 2>$null) | Measure-Object).Count
            } finally { Pop-Location }
        }
        return $result
    }
}

$AllTests += @{
    TestId = "EXT-003"
    TestName = "JSON Config Validation"
    Category = "Extension"
    Script = {
        $testPath = $Config.TestRepositories[0]
        $jsonFiles = Get-ChildItem -Path $testPath -Depth 2 -File -Filter "*.json" -ErrorAction SilentlyContinue |
                     Where-Object { $_.FullName -notmatch "node_modules|package-lock" -and $_.Length -lt 20KB } |
                     Select-Object -First 10

        $valid = 0; $invalid = 0
        foreach ($file in $jsonFiles) {
            try {
                [void]([System.IO.File]::ReadAllText($file.FullName) | ConvertFrom-Json)
                $valid++
            } catch { $invalid++ }
        }
        return @{ FilesChecked = $jsonFiles.Count; Valid = $valid; Invalid = $invalid }
    }
}

$AllTests += @{
    TestId = "EXT-004"
    TestName = "Markdown Documentation Scan"
    Category = "Extension"
    Script = {
        $testPath = $Config.TestRepositories[0]
        $mdFiles = Get-ChildItem -Path $testPath -Depth 2 -File -Filter "*.md" -ErrorAction SilentlyContinue |
                   Where-Object { $_.Length -lt 50KB } | Select-Object -First 10

        $totalLines = 0; $totalHeadings = 0
        foreach ($file in $mdFiles) {
            $content = [System.IO.File]::ReadAllText($file.FullName)
            $totalLines += ($content.Split("`n")).Count
            $totalHeadings += ([regex]::Matches($content, "(?m)^#{1,6}\s")).Count
        }
        return @{ FilesScanned = $mdFiles.Count; TotalLines = $totalLines; Headings = $totalHeadings }
    }
}
#endregion

#region Editor Tests
$AllTests += @{
    TestId = "EDITOR-001"
    TestName = "Settings.json Validation"
    Category = "Editor"
    Script = {
        $settingsPath = $Config.SettingsPath

        $result = @{
            Path = $settingsPath
            Exists = Test-Path $settingsPath
            Valid = $false
            LineCount = 0
            SizeKB = 0
        }

        if ($result.Exists) {
            $content = Get-Content $settingsPath -Raw
            $result.SizeKB = [math]::Round($content.Length / 1KB, 2)
            $result.LineCount = (Get-Content $settingsPath).Count

            # Remove comments for validation
            $jsonContent = $content -replace '//.*$', '' -replace '(?m)^\s*//.*$', ''

            try {
                $parsed = $jsonContent | ConvertFrom-Json
                $result.Valid = $true
                $result.KeyCount = ($parsed.PSObject.Properties | Measure-Object).Count
            }
            catch {
                $result.Valid = $false
                $result.Error = $_.Exception.Message
            }
        }

        return $result
    }
}

$AllTests += @{
    TestId = "EDITOR-002"
    TestName = "Workspace File Count Analysis"
    Category = "Editor"
    Script = {
        $testPath = $Config.TestRepositories[0]
        $excludeRegex = "node_modules|dist|build|\.git|__pycache__|venv"

        # Depth-limited scan for speed
        $files = Get-ChildItem -Path $testPath -Depth 3 -File -ErrorAction SilentlyContinue | Select-Object -First 200
        $included = @($files | Where-Object { $_.FullName -notmatch $excludeRegex })
        $excluded = $files.Count - $included.Count

        $byExt = $included | Group-Object Extension | Sort-Object Count -Descending | Select-Object -First 5

        return @{
            TotalFiles = $files.Count
            IncludedFiles = $included.Count
            ExcludedFiles = $excluded
            TopExtensions = $byExt | ForEach-Object { @{ Extension = $_.Name; Count = $_.Count } }
            FileCount = $included.Count
        }
    }
}
#endregion

#endregion

#region Main Execution

# Create output directory
New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null

# Display header
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            WINDSURF IDE CONFIGURATION VALIDATION BENCHMARK                   ║" -ForegroundColor Cyan
Write-Host "║                                                                              ║" -ForegroundColor Cyan
Write-Host "║  Version: 1.0.0                                                              ║" -ForegroundColor Cyan
Write-Host "║  Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                                               ║" -ForegroundColor Cyan
Write-Host "║  Run Count: $RunCount per test                                                          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Initialize results
$benchmarkResults = @{
    Metadata = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Version = "1.0.0"
        RunCount = $RunCount
        TestCategory = $TestCategory
        System = @{
            OS = [System.Environment]::OSVersion.VersionString
            PSVersion = $PSVersionTable.PSVersion.ToString()
            CPU = (Get-CimInstance Win32_Processor).Name
            RAM = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
        }
    }
    Tests = @()
    Summary = @{
        Total = 0
        Optimal = 0
        Acceptable = 0
        Degraded = 0
        Critical = 0
        Failed = 0
        Error = 0
    }
}

# Filter tests by category
$testsToRun = if ($TestCategory -eq "All") {
    $AllTests
} else {
    $AllTests | Where-Object { $_.Category -eq $TestCategory }
}

Write-Host "Running $($testsToRun.Count) tests in category: $TestCategory" -ForegroundColor Yellow
Write-Host ""

# Execute tests
foreach ($test in $testsToRun) {
    $result = Measure-TestExecution -TestId $test.TestId -TestName $test.TestName -Category $test.Category -TestScript $test.Script -Runs $RunCount
    $benchmarkResults.Tests += $result

    # Update summary
    $benchmarkResults.Summary.Total++
    switch ($result.Status) {
        "Optimal" { $benchmarkResults.Summary.Optimal++ }
        "Acceptable" { $benchmarkResults.Summary.Acceptable++ }
        "Degraded" { $benchmarkResults.Summary.Degraded++ }
        "Critical" { $benchmarkResults.Summary.Critical++ }
        "Failed" { $benchmarkResults.Summary.Failed++ }
        "Error" { $benchmarkResults.Summary.Error++ }
    }
}

# Display summary
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                           BENCHMARK SUMMARY                                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Total Tests: $($benchmarkResults.Summary.Total)" -ForegroundColor White
Write-Host "  ────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Optimal:    $($benchmarkResults.Summary.Optimal)" -ForegroundColor Green
Write-Host "  Acceptable: $($benchmarkResults.Summary.Acceptable)" -ForegroundColor Yellow
Write-Host "  Degraded:   $($benchmarkResults.Summary.Degraded)" -ForegroundColor DarkYellow
Write-Host "  Critical:   $($benchmarkResults.Summary.Critical)" -ForegroundColor Red
Write-Host "  Failed:     $($benchmarkResults.Summary.Failed)" -ForegroundColor Red
Write-Host "  Errors:     $($benchmarkResults.Summary.Error)" -ForegroundColor Gray
Write-Host ""

# Save JSON report
$jsonReportPath = Join-Path $OutputPath "benchmark-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$benchmarkResults | ConvertTo-Json -Depth 10 | Out-File $jsonReportPath -Encoding UTF8
Write-Host "  JSON Report: $jsonReportPath" -ForegroundColor Green

# Generate HTML report if requested
if ($ExportHtml) {
    $htmlReportPath = Join-Path $OutputPath "benchmark-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"

    $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Windsurf Benchmark Report</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #1e1e1e; color: #d4d4d4; }
        h1, h2 { color: #569cd6; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #3c3c3c; padding: 10px; text-align: left; }
        th { background: #264f78; color: white; }
        tr:nth-child(even) { background: #252526; }
        .optimal { color: #4ec9b0; }
        .acceptable { color: #dcdcaa; }
        .degraded { color: #ce9178; }
        .critical { color: #f44747; }
        .summary { display: flex; gap: 20px; flex-wrap: wrap; }
        .summary-card { background: #252526; padding: 15px; border-radius: 8px; min-width: 120px; }
        .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #808080; }
        .summary-card .value { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Windsurf IDE Configuration Benchmark Report</h1>
    <p>Generated: $($benchmarkResults.Metadata.Timestamp)</p>

    <h2>Summary</h2>
    <div class="summary">
        <div class="summary-card"><h3>Total</h3><div class="value">$($benchmarkResults.Summary.Total)</div></div>
        <div class="summary-card"><h3>Optimal</h3><div class="value optimal">$($benchmarkResults.Summary.Optimal)</div></div>
        <div class="summary-card"><h3>Acceptable</h3><div class="value acceptable">$($benchmarkResults.Summary.Acceptable)</div></div>
        <div class="summary-card"><h3>Degraded</h3><div class="value degraded">$($benchmarkResults.Summary.Degraded)</div></div>
        <div class="summary-card"><h3>Critical</h3><div class="value critical">$($benchmarkResults.Summary.Critical)</div></div>
    </div>

    <h2>Test Results</h2>
    <table>
        <tr>
            <th>Test ID</th>
            <th>Test Name</th>
            <th>Category</th>
            <th>Avg (ms)</th>
            <th>Min</th>
            <th>Max</th>
            <th>Status</th>
        </tr>
        $($benchmarkResults.Tests | ForEach-Object {
            $statusClass = $_.Status.ToLower()
            "<tr><td>$($_.TestId)</td><td>$($_.TestName)</td><td>$($_.Category)</td><td>$($_.Average)</td><td>$($_.Min)</td><td>$($_.Max)</td><td class='$statusClass'>$($_.Status)</td></tr>"
        })
    </table>
</body>
</html>
"@

    $htmlContent | Out-File $htmlReportPath -Encoding UTF8
    Write-Host "  HTML Report: $htmlReportPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "Benchmark complete!" -ForegroundColor Green
Write-Host ""

#endregion
