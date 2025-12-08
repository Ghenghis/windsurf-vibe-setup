#!/usr/bin/env node
/**
 * Windsurf Autopilot - Advanced Security Tools v3.1
 * 
 * SAST, SBOM, Dependency Graph, Tech Debt, and Compliance.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Data directory
const DATA_DIR = process.platform === 'win32'
  ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot')
  : path.join(process.env.HOME || '', '.windsurf-autopilot');

const SECURITY_DIR = path.join(DATA_DIR, 'security');
const REPORTS_DIR = path.join(SECURITY_DIR, 'reports');

// Ensure directories exist
[SECURITY_DIR, REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const securityAdvancedTools = {

  // Static Application Security Testing
  sast_scan: {
    name: 'sast_scan',
    description: 'Run Static Application Security Testing with Semgrep or CodeQL',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path to scan' },
        tool: { type: 'string', enum: ['semgrep', 'codeql', 'eslint-security'], description: 'SAST tool' },
        rules: { type: 'array', items: { type: 'string' }, description: 'Rule sets to use' },
        severity: { type: 'string', enum: ['error', 'warning', 'info'], description: 'Minimum severity' },
        output: { type: 'string', description: 'Output file path' }
      },
      required: ['path']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const tool = args.tool || 'semgrep';
      const rules = args.rules || ['auto'];
      const severity = args.severity || 'warning';
      const output = args.output;

      if (!fs.existsSync(projectPath)) {
        return { success: false, error: 'Project path does not exist' };
      }

      const findings = [];
      const reportPath = output || path.join(REPORTS_DIR, `sast-${Date.now()}.json`);

      if (tool === 'semgrep') {
        // Check if semgrep is installed
        try {
          execSync('semgrep --version', { encoding: 'utf8' });
        } catch {
          return {
            success: false,
            error: 'Semgrep is not installed',
            hint: 'Install with: pip install semgrep OR brew install semgrep'
          };
        }

        const ruleConfig = rules.includes('auto') ? '--config=auto' : rules.map(r => `--config=${r}`).join(' ');
        
        try {
          const cmd = `semgrep ${ruleConfig} --json --severity=${severity} "${projectPath}"`;
          const output = execSync(cmd, { 
            encoding: 'utf8',
            timeout: 300000,
            maxBuffer: 50 * 1024 * 1024
          });

          const results = JSON.parse(output);
          
          for (const result of results.results || []) {
            findings.push({
              rule: result.check_id,
              severity: result.extra?.severity || 'unknown',
              message: result.extra?.message || result.check_id,
              file: result.path,
              line: result.start?.line,
              code: result.extra?.lines
            });
          }
        } catch (error) {
          // Semgrep returns non-zero if findings exist
          try {
            const results = JSON.parse(error.stdout || '{}');
            for (const result of results.results || []) {
              findings.push({
                rule: result.check_id,
                severity: result.extra?.severity || 'unknown',
                message: result.extra?.message || result.check_id,
                file: result.path,
                line: result.start?.line
              });
            }
          } catch {
            return { success: false, error: error.message };
          }
        }
      } else if (tool === 'eslint-security') {
        // Use ESLint with security plugins
        const eslintInstalled = fs.existsSync(path.join(projectPath, 'node_modules', 'eslint'));
        
        if (!eslintInstalled) {
          return {
            success: false,
            error: 'ESLint not installed in project',
            hint: 'Run: npm install -D eslint eslint-plugin-security'
          };
        }

        try {
          const cmd = `npx eslint --format json "${projectPath}/src" || true`;
          const output = execSync(cmd, {
            cwd: projectPath,
            encoding: 'utf8',
            timeout: 120000
          });

          const results = JSON.parse(output || '[]');
          
          for (const file of results) {
            for (const msg of file.messages || []) {
              if (msg.ruleId?.includes('security') || msg.message?.toLowerCase().includes('security')) {
                findings.push({
                  rule: msg.ruleId,
                  severity: msg.severity === 2 ? 'error' : 'warning',
                  message: msg.message,
                  file: file.filePath,
                  line: msg.line
                });
              }
            }
          }
        } catch (error) {
          // ESLint may return non-zero
        }
      }

      // Group by severity
      const bySeverity = {
        error: findings.filter(f => f.severity === 'error' || f.severity === 'ERROR'),
        warning: findings.filter(f => f.severity === 'warning' || f.severity === 'WARNING'),
        info: findings.filter(f => f.severity === 'info' || f.severity === 'INFO')
      };

      // Save report
      const report = {
        tool,
        timestamp: new Date().toISOString(),
        path: projectPath,
        findings,
        summary: {
          total: findings.length,
          errors: bySeverity.error.length,
          warnings: bySeverity.warning.length,
          info: bySeverity.info.length
        }
      };
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      return {
        success: true,
        tool,
        findings: findings.length,
        summary: report.summary,
        reportPath,
        criticalFindings: findings.slice(0, 10),
        message: findings.length === 0 
          ? 'No security issues found'
          : `Found ${findings.length} potential security issues`
      };
    }
  },

  // Generate Software Bill of Materials
  sbom_generate: {
    name: 'sbom_generate',
    description: 'Generate Software Bill of Materials (SBOM)',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path' },
        format: { type: 'string', enum: ['cyclonedx', 'spdx'], description: 'SBOM format' },
        output: { type: 'string', description: 'Output file path' },
        includeDevDeps: { type: 'boolean', description: 'Include dev dependencies' }
      },
      required: ['path']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const format = args.format || 'cyclonedx';
      const includeDevDeps = args.includeDevDeps !== false;
      
      if (!fs.existsSync(projectPath)) {
        return { success: false, error: 'Project path does not exist' };
      }

      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageLockPath = path.join(projectPath, 'package-lock.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        return { success: false, error: 'No package.json found' };
      }

      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...pkg.dependencies };
      if (includeDevDeps) Object.assign(deps, pkg.devDependencies);

      const components = [];
      
      for (const [name, version] of Object.entries(deps || {})) {
        const cleanVersion = version.replace(/[\^~>=<]/g, '');
        components.push({
          type: 'library',
          name,
          version: cleanVersion,
          purl: `pkg:npm/${name}@${cleanVersion}`,
          licenses: [], // Would need to fetch from registry
          externalReferences: [{
            type: 'website',
            url: `https://www.npmjs.com/package/${name}`
          }]
        });
      }

      let sbom;
      const timestamp = new Date().toISOString();

      if (format === 'cyclonedx') {
        sbom = {
          bomFormat: 'CycloneDX',
          specVersion: '1.4',
          serialNumber: `urn:uuid:${Date.now()}`,
          version: 1,
          metadata: {
            timestamp,
            tools: [{
              vendor: 'Windsurf',
              name: 'Autopilot',
              version: '3.1.0'
            }],
            component: {
              type: 'application',
              name: pkg.name || 'unknown',
              version: pkg.version || '0.0.0'
            }
          },
          components
        };
      } else {
        // SPDX format
        sbom = {
          spdxVersion: 'SPDX-2.3',
          dataLicense: 'CC0-1.0',
          SPDXID: 'SPDXRef-DOCUMENT',
          name: pkg.name || 'unknown',
          documentNamespace: `https://windsurf.dev/sbom/${pkg.name || 'unknown'}`,
          creationInfo: {
            created: timestamp,
            creators: ['Tool: Windsurf-Autopilot-3.1.0']
          },
          packages: components.map((c, i) => ({
            SPDXID: `SPDXRef-Package-${i}`,
            name: c.name,
            versionInfo: c.version,
            downloadLocation: c.externalReferences?.[0]?.url || 'NOASSERTION'
          }))
        };
      }

      const outputPath = args.output || path.join(REPORTS_DIR, `sbom-${format}-${Date.now()}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(sbom, null, 2));

      return {
        success: true,
        format,
        project: pkg.name,
        version: pkg.version,
        components: components.length,
        outputPath,
        message: `Generated ${format.toUpperCase()} SBOM with ${components.length} components`
      };
    }
  },

  // Dependency graph visualization
  dep_graph: {
    name: 'dep_graph',
    description: 'Generate dependency graph visualization',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path' },
        format: { type: 'string', enum: ['json', 'dot', 'mermaid'], description: 'Output format' },
        depth: { type: 'number', description: 'Max depth to traverse' },
        output: { type: 'string', description: 'Output file path' }
      },
      required: ['path']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const format = args.format || 'mermaid';
      const depth = args.depth || 3;

      if (!fs.existsSync(projectPath)) {
        return { success: false, error: 'Project path does not exist' };
      }

      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return { success: false, error: 'No package.json found' };
      }

      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      const nodes = [{ id: pkg.name || 'root', label: pkg.name || 'root', type: 'root' }];
      const edges = [];

      for (const [name, version] of Object.entries(deps || {})) {
        nodes.push({ id: name, label: `${name}@${version.replace(/[\^~]/g, '')}`, type: 'dependency' });
        edges.push({ from: pkg.name || 'root', to: name });
      }

      let output;
      if (format === 'json') {
        output = JSON.stringify({ nodes, edges }, null, 2);
      } else if (format === 'dot') {
        output = `digraph Dependencies {\n`;
        output += `  rankdir=LR;\n`;
        output += `  node [shape=box];\n`;
        for (const node of nodes) {
          output += `  "${node.id}" [label="${node.label}"];\n`;
        }
        for (const edge of edges) {
          output += `  "${edge.from}" -> "${edge.to}";\n`;
        }
        output += `}\n`;
      } else {
        // Mermaid format
        output = `graph LR\n`;
        for (const node of nodes) {
          const shape = node.type === 'root' ? `((${node.label}))` : `[${node.label}]`;
          output += `  ${node.id.replace(/[^a-zA-Z0-9]/g, '_')}${shape}\n`;
        }
        for (const edge of edges) {
          const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, '_');
          const toId = edge.to.replace(/[^a-zA-Z0-9]/g, '_');
          output += `  ${fromId} --> ${toId}\n`;
        }
      }

      const outputPath = args.output || path.join(REPORTS_DIR, `dep-graph.${format === 'mermaid' ? 'md' : format}`);
      fs.writeFileSync(outputPath, format === 'mermaid' ? `\`\`\`mermaid\n${output}\`\`\`\n` : output);

      return {
        success: true,
        format,
        nodes: nodes.length,
        edges: edges.length,
        outputPath,
        preview: output.slice(0, 1000),
        message: `Generated dependency graph with ${nodes.length} packages`
      };
    }
  },

  // Technical debt score
  tech_debt_score: {
    name: 'tech_debt_score',
    description: 'Calculate technical debt score and metrics',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path' },
        include: { type: 'array', items: { type: 'string' }, description: 'File patterns to include' }
      },
      required: ['path']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const include = args.include || ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx'];

      if (!fs.existsSync(projectPath)) {
        return { success: false, error: 'Project path does not exist' };
      }

      const metrics = {
        todoCount: 0,
        fixmeCount: 0,
        hackCount: 0,
        longFiles: 0,
        complexFunctions: 0,
        duplicatePatterns: 0,
        outdatedDeps: 0
      };

      // Scan source files
      function scanDir(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
              scanDir(fullPath);
            }
          } else if (entry.isFile() && /\.(js|ts|jsx|tsx)$/.test(entry.name)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              const lines = content.split('\n');
              
              // Count debt markers
              metrics.todoCount += (content.match(/TODO/gi) || []).length;
              metrics.fixmeCount += (content.match(/FIXME/gi) || []).length;
              metrics.hackCount += (content.match(/HACK|XXX|TEMP/gi) || []).length;
              
              // Long files (>500 lines)
              if (lines.length > 500) metrics.longFiles++;
              
              // Complex functions (simple heuristic: functions with many conditions)
              const functionBlocks = content.match(/function\s*\w*\s*\([^)]*\)\s*\{[^}]+\}/g) || [];
              for (const block of functionBlocks) {
                const conditions = (block.match(/if|else|switch|case|\?|&&|\|\|/g) || []).length;
                if (conditions > 10) metrics.complexFunctions++;
              }
            } catch {}
          }
        }
      }

      scanDir(projectPath);

      // Check for outdated dependencies
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const output = execSync('npm outdated --json', { 
            cwd: projectPath, 
            encoding: 'utf8',
            timeout: 60000
          });
          const outdated = JSON.parse(output || '{}');
          metrics.outdatedDeps = Object.keys(outdated).length;
        } catch (error) {
          // npm outdated returns non-zero if outdated deps exist
          try {
            const outdated = JSON.parse(error.stdout || '{}');
            metrics.outdatedDeps = Object.keys(outdated).length;
          } catch {}
        }
      }

      // Calculate score (0-100, lower is better)
      const weights = {
        todoCount: 1,
        fixmeCount: 2,
        hackCount: 3,
        longFiles: 5,
        complexFunctions: 4,
        outdatedDeps: 2
      };

      let rawScore = 0;
      for (const [key, weight] of Object.entries(weights)) {
        rawScore += metrics[key] * weight;
      }

      // Normalize to 0-100 scale
      const score = Math.min(100, rawScore);
      const grade = score < 20 ? 'A' : score < 40 ? 'B' : score < 60 ? 'C' : score < 80 ? 'D' : 'F';

      const reportPath = path.join(REPORTS_DIR, `tech-debt-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify({ metrics, score, grade }, null, 2));

      return {
        success: true,
        score,
        grade,
        metrics,
        reportPath,
        recommendations: [
          metrics.todoCount > 10 ? `Address ${metrics.todoCount} TODO comments` : null,
          metrics.fixmeCount > 5 ? `Fix ${metrics.fixmeCount} FIXME items` : null,
          metrics.hackCount > 0 ? `Remove ${metrics.hackCount} temporary hacks` : null,
          metrics.longFiles > 0 ? `Refactor ${metrics.longFiles} long files` : null,
          metrics.outdatedDeps > 5 ? `Update ${metrics.outdatedDeps} outdated dependencies` : null
        ].filter(Boolean),
        message: `Technical debt score: ${score}/100 (Grade: ${grade})`
      };
    }
  },

  // Compliance check
  compliance_check: {
    name: 'compliance_check',
    description: 'Check project against compliance frameworks (SOC2, GDPR, HIPAA)',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path' },
        framework: { 
          type: 'string', 
          enum: ['soc2', 'gdpr', 'hipaa', 'pci-dss'],
          description: 'Compliance framework'
        }
      },
      required: ['path', 'framework']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const framework = args.framework;

      if (!fs.existsSync(projectPath)) {
        return { success: false, error: 'Project path does not exist' };
      }

      // Define checklists for each framework
      const checklists = {
        soc2: [
          { id: 'CC6.1', check: 'Authentication', test: () => hasFile(['auth', 'login', 'session']) },
          { id: 'CC6.2', check: 'Access Control', test: () => hasFile(['rbac', 'permission', 'role']) },
          { id: 'CC6.6', check: 'Encryption', test: () => hasPatternInCode(/encrypt|crypto|bcrypt|hash/) },
          { id: 'CC7.1', check: 'Logging', test: () => hasPatternInCode(/log|winston|bunyan|pino/) },
          { id: 'CC7.2', check: 'Monitoring', test: () => hasFile(['monitor', 'metrics', 'health']) },
          { id: 'A1.2', check: 'Data Backup', test: () => hasFile(['backup', 'snapshot']) }
        ],
        gdpr: [
          { id: 'Art.5', check: 'Data Minimization', test: () => !hasPatternInCode(/SELECT \*/) },
          { id: 'Art.17', check: 'Right to Erasure', test: () => hasPatternInCode(/delete.*user|remove.*data/i) },
          { id: 'Art.20', check: 'Data Portability', test: () => hasPatternInCode(/export|download.*data/i) },
          { id: 'Art.25', check: 'Privacy by Design', test: () => hasFile(['privacy', 'consent']) },
          { id: 'Art.32', check: 'Security Measures', test: () => hasPatternInCode(/encrypt|https|ssl|tls/) },
          { id: 'Art.33', check: 'Breach Notification', test: () => hasFile(['incident', 'breach', 'alert']) }
        ],
        hipaa: [
          { id: '164.312(a)', check: 'Access Control', test: () => hasPatternInCode(/auth|login|access.*control/) },
          { id: '164.312(b)', check: 'Audit Controls', test: () => hasPatternInCode(/audit|log/) },
          { id: '164.312(c)', check: 'Integrity', test: () => hasPatternInCode(/checksum|hash|verify/) },
          { id: '164.312(d)', check: 'Authentication', test: () => hasPatternInCode(/authenticate|credential/) },
          { id: '164.312(e)', check: 'Transmission Security', test: () => hasPatternInCode(/https|ssl|tls|encrypt/) }
        ],
        'pci-dss': [
          { id: 'Req.3', check: 'Protect Stored Data', test: () => hasPatternInCode(/encrypt.*card|mask.*pan/i) },
          { id: 'Req.4', check: 'Encrypt Transmission', test: () => hasPatternInCode(/https|tls/) },
          { id: 'Req.6', check: 'Secure Systems', test: () => hasFile(['security', 'patch']) },
          { id: 'Req.8', check: 'Identify Access', test: () => hasPatternInCode(/user.*id|auth/) },
          { id: 'Req.10', check: 'Track Access', test: () => hasPatternInCode(/log|audit/) }
        ]
      };

      // Helper functions
      function hasFile(keywords) {
        try {
          const files = execSync(`find "${projectPath}" -type f -name "*.js" -o -name "*.ts" 2>/dev/null || dir /s /b "${projectPath}\\*.js" "${projectPath}\\*.ts" 2>nul`, {
            encoding: 'utf8',
            timeout: 10000
          });
          return keywords.some(kw => files.toLowerCase().includes(kw));
        } catch {
          return false;
        }
      }

      function hasPatternInCode(pattern) {
        try {
          const srcDir = path.join(projectPath, 'src');
          const searchDir = fs.existsSync(srcDir) ? srcDir : projectPath;
          
          const grepCmd = process.platform === 'win32'
            ? `findstr /s /i /r "${pattern.source}" "${searchDir}\\*.js" "${searchDir}\\*.ts"`
            : `grep -r -l "${pattern.source}" "${searchDir}" --include="*.js" --include="*.ts"`;
          
          execSync(grepCmd, { encoding: 'utf8', timeout: 10000 });
          return true;
        } catch {
          return false;
        }
      }

      const checklist = checklists[framework] || [];
      const results = [];

      for (const item of checklist) {
        let passed = false;
        try {
          passed = item.test();
        } catch {}
        
        results.push({
          id: item.id,
          check: item.check,
          status: passed ? 'PASS' : 'REVIEW',
          note: passed ? 'Evidence found' : 'Manual review recommended'
        });
      }

      const passCount = results.filter(r => r.status === 'PASS').length;
      const compliance = Math.round((passCount / results.length) * 100);

      return {
        success: true,
        framework: framework.toUpperCase(),
        compliance: `${compliance}%`,
        passed: passCount,
        total: results.length,
        results,
        message: `${framework.toUpperCase()} compliance: ${compliance}% (${passCount}/${results.length} checks passed)`,
        disclaimer: 'This is an automated scan. Professional audit required for certification.'
      };
    }
  }
};

module.exports = securityAdvancedTools;
