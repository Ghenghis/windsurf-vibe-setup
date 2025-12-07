#!/usr/bin/env node
/**
 * Dependency Vulnerability Scanner
 * Scans npm and pip dependencies for known vulnerabilities
 * Implements "Dependency vulnerability alerts" from SECURITY.md
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  rootDir: path.join(__dirname, '..'),
  outputDir: path.join(__dirname, '..', 'security-reports'),
  npmAuditLevel: 'moderate', // low, moderate, high, critical
  pipCheckEnabled: true
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Run npm audit and parse results
 */
function runNpmAudit() {
  console.log(`${colors.cyan}[NPM]${colors.reset} Running npm audit...`);

  const packageJsonPath = path.join(CONFIG.rootDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`${colors.gray}  No package.json found, skipping npm audit${colors.reset}`);
    return { vulnerabilities: [], summary: null };
  }

  try {
    // Run npm audit with JSON output
    const result = spawnSync('npm', ['audit', '--json'], {
      cwd: CONFIG.rootDir,
      encoding: 'utf8',
      shell: true,
      timeout: 60000
    });

    let auditData;
    try {
      auditData = JSON.parse(result.stdout || '{}');
    } catch (e) {
      console.log(`${colors.yellow}  Warning: Could not parse npm audit output${colors.reset}`);
      return { vulnerabilities: [], summary: null };
    }

    const vulnerabilities = [];
    const metadata = auditData.metadata || {};

    // Process vulnerabilities from npm audit v2 format
    if (auditData.vulnerabilities) {
      for (const [pkgName, vuln] of Object.entries(auditData.vulnerabilities)) {
        vulnerabilities.push({
          package: pkgName,
          severity: vuln.severity,
          title: vuln.name || pkgName,
          range: vuln.range,
          fixAvailable: vuln.fixAvailable,
          via: Array.isArray(vuln.via) ? vuln.via.map(v => typeof v === 'string' ? v : v.title).join(', ') : ''
        });
      }
    }

    const summary = {
      total: metadata.vulnerabilities?.total || vulnerabilities.length,
      critical: metadata.vulnerabilities?.critical || 0,
      high: metadata.vulnerabilities?.high || 0,
      moderate: metadata.vulnerabilities?.moderate || 0,
      low: metadata.vulnerabilities?.low || 0,
      info: metadata.vulnerabilities?.info || 0
    };

    return { vulnerabilities, summary };
  } catch (error) {
    console.log(`${colors.red}  Error running npm audit: ${error.message}${colors.reset}`);
    return { vulnerabilities: [], summary: null };
  }
}

/**
 * Run pip-audit or safety check for Python dependencies
 */
function runPipAudit() {
  console.log(`${colors.cyan}[PIP]${colors.reset} Checking Python dependencies...`);

  const requirementsPath = path.join(CONFIG.rootDir, 'requirements.txt');
  if (!fs.existsSync(requirementsPath)) {
    console.log(`${colors.gray}  No requirements.txt found, skipping pip audit${colors.reset}`);
    return { vulnerabilities: [], summary: null };
  }

  const vulnerabilities = [];

  // Try pip-audit first
  try {
    const result = spawnSync('pip-audit', ['--format', 'json', '-r', requirementsPath], {
      cwd: CONFIG.rootDir,
      encoding: 'utf8',
      shell: true,
      timeout: 120000
    });

    if (result.stdout) {
      const auditData = JSON.parse(result.stdout);
      for (const vuln of auditData) {
        vulnerabilities.push({
          package: vuln.name,
          version: vuln.version,
          severity: vuln.vulns?.[0]?.fix_versions ? 'high' : 'moderate',
          id: vuln.vulns?.[0]?.id || 'Unknown',
          description: vuln.vulns?.[0]?.description || 'Vulnerability detected',
          fixVersions: vuln.vulns?.[0]?.fix_versions || []
        });
      }
    }
  } catch (error) {
    // Try safety as fallback
    try {
      console.log(`${colors.gray}  pip-audit not found, trying safety...${colors.reset}`);
      const result = spawnSync('safety', ['check', '--json', '-r', requirementsPath], {
        cwd: CONFIG.rootDir,
        encoding: 'utf8',
        shell: true,
        timeout: 120000
      });

      if (result.stdout) {
        try {
          const safetyData = JSON.parse(result.stdout);
          for (const vuln of safetyData) {
            vulnerabilities.push({
              package: vuln[0],
              version: vuln[2],
              severity: 'moderate',
              id: vuln[4],
              description: vuln[3]
            });
          }
        } catch (e) {
          // Safety might output different format
        }
      }
    } catch (safetyError) {
      console.log(`${colors.yellow}  Neither pip-audit nor safety available${colors.reset}`);
      console.log(`${colors.gray}  Install with: pip install pip-audit${colors.reset}`);
    }
  }

  const summary = {
    total: vulnerabilities.length,
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    moderate: vulnerabilities.filter(v => v.severity === 'moderate').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length
  };

  return { vulnerabilities, summary };
}

/**
 * Check for outdated packages
 */
function checkOutdatedPackages() {
  console.log(`${colors.cyan}[NPM]${colors.reset} Checking for outdated packages...`);

  try {
    const result = spawnSync('npm', ['outdated', '--json'], {
      cwd: CONFIG.rootDir,
      encoding: 'utf8',
      shell: true,
      timeout: 60000
    });

    if (result.stdout) {
      const outdated = JSON.parse(result.stdout || '{}');
      return Object.entries(outdated).map(([name, info]) => ({
        package: name,
        current: info.current,
        wanted: info.wanted,
        latest: info.latest,
        type: info.type
      }));
    }
  } catch (error) {
    // No outdated packages or error
  }

  return [];
}

/**
 * Format severity with color
 */
function formatSeverity(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return `${colors.red}${colors.bold}CRITICAL${colors.reset}`;
    case 'high':
      return `${colors.red}HIGH${colors.reset}`;
    case 'moderate':
      return `${colors.yellow}MODERATE${colors.reset}`;
    case 'low':
      return `${colors.cyan}LOW${colors.reset}`;
    default:
      return severity || 'UNKNOWN';
  }
}

/**
 * Generate JSON report
 */
function generateReport(npmResults, pipResults, outdated) {
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    npm: {
      vulnerabilities: npmResults.vulnerabilities,
      summary: npmResults.summary
    },
    pip: {
      vulnerabilities: pipResults.vulnerabilities,
      summary: pipResults.summary
    },
    outdated: outdated,
    totalVulnerabilities:
      (npmResults.summary?.total || 0) +
      (pipResults.summary?.total || 0)
  };

  const reportPath = path.join(CONFIG.outputDir, `dependency-scan-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return reportPath;
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.bold}Dependency Vulnerability Scanner${colors.reset}`);
  console.log('='.repeat(50));
  console.log(`Scanning: ${CONFIG.rootDir}`);
  console.log('');

  // Run scans
  const npmResults = runNpmAudit();
  console.log('');

  const pipResults = CONFIG.pipCheckEnabled ? runPipAudit() : { vulnerabilities: [], summary: null };
  console.log('');

  const outdated = checkOutdatedPackages();
  console.log('');

  // Display results
  console.log('='.repeat(50));
  console.log(`${colors.bold}Results${colors.reset}`);
  console.log('');

  // NPM vulnerabilities
  if (npmResults.summary) {
    console.log(`${colors.cyan}NPM Vulnerabilities:${colors.reset}`);
    console.log(`  Critical: ${npmResults.summary.critical}`);
    console.log(`  High: ${npmResults.summary.high}`);
    console.log(`  Moderate: ${npmResults.summary.moderate}`);
    console.log(`  Low: ${npmResults.summary.low}`);
    console.log('');

    if (npmResults.vulnerabilities.length > 0) {
      for (const vuln of npmResults.vulnerabilities.slice(0, 10)) {
        console.log(`  ${formatSeverity(vuln.severity)} ${vuln.package}`);
        if (vuln.via) {
          console.log(`    ${colors.gray}Via: ${vuln.via}${colors.reset}`);
        }
        if (vuln.fixAvailable) {
          console.log(`    ${colors.green}Fix available${colors.reset}`);
        }
      }
      if (npmResults.vulnerabilities.length > 10) {
        console.log(`  ${colors.gray}...and ${npmResults.vulnerabilities.length - 10} more${colors.reset}`);
      }
      console.log('');
    }
  }

  // Pip vulnerabilities
  if (pipResults.summary && pipResults.summary.total > 0) {
    console.log(`${colors.cyan}Python Vulnerabilities:${colors.reset}`);
    console.log(`  Total: ${pipResults.summary.total}`);
    console.log('');

    for (const vuln of pipResults.vulnerabilities.slice(0, 5)) {
      console.log(`  ${formatSeverity(vuln.severity)} ${vuln.package}@${vuln.version}`);
      console.log(`    ${colors.gray}${vuln.id}: ${vuln.description?.substring(0, 60)}...${colors.reset}`);
    }
    console.log('');
  }

  // Outdated packages
  if (outdated.length > 0) {
    console.log(`${colors.cyan}Outdated Packages:${colors.reset} ${outdated.length} packages`);
    for (const pkg of outdated.slice(0, 5)) {
      console.log(`  ${pkg.package}: ${pkg.current} → ${colors.green}${pkg.latest}${colors.reset}`);
    }
    if (outdated.length > 5) {
      console.log(`  ${colors.gray}...and ${outdated.length - 5} more${colors.reset}`);
    }
    console.log('');
  }

  // Generate report
  const reportPath = generateReport(npmResults, pipResults, outdated);
  console.log(`${colors.gray}Report saved: ${reportPath}${colors.reset}`);
  console.log('');

  // Summary
  const totalVulns = (npmResults.summary?.total || 0) + (pipResults.summary?.total || 0);
  const criticalHigh =
    (npmResults.summary?.critical || 0) + (npmResults.summary?.high || 0) +
    (pipResults.summary?.critical || 0) + (pipResults.summary?.high || 0);

  if (totalVulns === 0) {
    console.log(`${colors.green}${colors.bold}✓ No vulnerabilities found${colors.reset}`);
    process.exit(0);
  } else if (criticalHigh > 0) {
    console.log(`${colors.red}${colors.bold}⚠ Found ${totalVulns} vulnerabilities (${criticalHigh} critical/high)${colors.reset}`);
    console.log(`${colors.gray}Run 'npm audit fix' to fix npm vulnerabilities${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.yellow}${colors.bold}⚠ Found ${totalVulns} vulnerabilities (none critical/high)${colors.reset}`);
    process.exit(0);
  }
}

main();
