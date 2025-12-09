#!/usr/bin/env node
/**
 * Self-Audit System for Windsurf Vibe Setup
 * Automatically audits, repairs, and enhances the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SelfAuditor {
  constructor() {
    this.rootDir = __dirname;
    this.srcDir = path.join(this.rootDir, 'mcp-server', 'src');
    this.results = {
      timestamp: new Date().toISOString(),
      issues: [],
      gaps: [],
      stats: {},
    };
  }

  async runCompleteAudit() {
    console.log('🔍 Starting comprehensive self-audit...\n');

    // 1. Check file existence
    console.log('📁 Checking file integrity...');
    await this.checkFileIntegrity();

    // 2. Audit code quality
    console.log('📝 Auditing code quality...');
    await this.auditCodeQuality();

    // 3. Count tools
    console.log('🔧 Counting tools...');
    await this.countTools();

    // 4. Check documentation sync
    console.log('📚 Checking documentation...');
    await this.checkDocumentationSync();

    // 5. Find gaps
    console.log('🕳️ Finding gaps...');
    await this.findGaps();

    // 6. Performance check
    console.log('⚡ Checking performance...');
    await this.checkPerformance();

    // 7. Generate report
    console.log('📊 Generating report...');
    await this.generateReport();

    // 8. Auto-fix if enabled
    if (process.argv.includes('--fix')) {
      console.log('🔧 Running auto-fix...');
      await this.autoFix();
    }

    return this.results;
  }

  async checkFileIntegrity() {
    const indexPath = path.join(this.srcDir, 'index.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    // Extract all require statements
    const requires = indexContent.match(/require\(['"]\.\/([^'"]+)['"]\)/g) || [];
    const missingFiles = [];
    const presentFiles = [];

    for (const req of requires) {
      const fileName = req.match(/require\(['"]\.\/([^'"]+)['"]\)/)[1];
      const filePath = path.join(this.srcDir, fileName);

      if (!fileName.endsWith('.js')) {
        continue; // Skip non-JS requires
      }

      if (!fs.existsSync(filePath)) {
        missingFiles.push(fileName);
        this.results.issues.push({
          type: 'MISSING_FILE',
          severity: 'error',
          file: fileName,
          message: `Required file not found: ${fileName}`,
        });
      } else {
        presentFiles.push(fileName);
      }
    }

    this.results.stats.fileIntegrity = {
      total: requires.length,
      present: presentFiles.length,
      missing: missingFiles.length,
    };
  }

  async auditCodeQuality() {
    const files = this.getAllFiles(this.srcDir, '.js');
    let totalTodos = 0;
    let totalFixmes = 0;
    let totalStubs = 0;
    let totalLines = 0;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      totalLines += lines.length;

      // Count TODOs
      const todos = (content.match(/TODO/gi) || []).length;
      if (todos > 0) {
        totalTodos += todos;
        this.results.issues.push({
          type: 'TODO',
          severity: 'warning',
          file: path.basename(file),
          count: todos,
        });
      }

      // Count FIXMEs
      const fixmes = (content.match(/FIXME/gi) || []).length;
      if (fixmes > 0) {
        totalFixmes += fixmes;
        this.results.issues.push({
          type: 'FIXME',
          severity: 'warning',
          file: path.basename(file),
          count: fixmes,
        });
      }

      // Check for stubs
      if (content.includes('Not implemented') || content.includes('TODO: Implement')) {
        totalStubs++;
        this.results.issues.push({
          type: 'STUB',
          severity: 'error',
          file: path.basename(file),
          message: 'Contains unimplemented functionality',
        });
      }
    }

    this.results.stats.codeQuality = {
      totalFiles: files.length,
      totalLines,
      todos: totalTodos,
      fixmes: totalFixmes,
      stubs: totalStubs,
    };
  }

  async countTools() {
    const indexPath = path.join(this.srcDir, 'index.js');
    const content = fs.readFileSync(indexPath, 'utf8');

    // Count tool handlers
    const handlers = new Set();
    const handlerMatches = content.match(/(\w+):\s*async\s*\([^)]*\)\s*=>/g) || [];
    handlerMatches.forEach(match => {
      const name = match.match(/(\w+):/)[1];
      handlers.add(name);
    });

    // Count v3.2 tools specifically
    const v32Files = [
      'smart-assist-tools.js',
      'wizard-tools.js',
      'asset-tools.js',
      'nocode-tools.js',
      'business-tools.js',
      'launch-tools.js',
      'pair-tools.js',
    ];

    let v32Tools = 0;
    for (const file of v32Files) {
      const filePath = path.join(this.srcDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const toolMatches = content.match(/name:\s*['"]([^'"]+)['"]/g) || [];
        v32Tools += toolMatches.length;
      }
    }

    // Count v4.x features
    const v4Features = {
      multiAgent: fs.existsSync(path.join(this.srcDir, 'multi-agent-tools.js')),
      hiveMind: fs.existsSync(path.join(this.srcDir, 'hive-mind.js')),
      openInterpreter: fs.existsSync(path.join(this.srcDir, 'open-interpreter-tools.js')),
      harness: fs.existsSync(path.join(this.srcDir, 'harness', 'index.js')),
    };

    this.results.stats.tools = {
      handlers: handlers.size,
      v32Tools,
      v4Features,
      claimed: 350,
      actual: handlers.size,
      accuracy: Math.round((handlers.size / 350) * 100) + '%',
    };
  }

  async checkDocumentationSync() {
    const docs = [];
    const mdFiles = this.getAllFiles(this.rootDir, '.md');

    for (const file of mdFiles) {
      if (file.includes('node_modules')) continue;

      const content = fs.readFileSync(file, 'utf8');
      const stats = fs.statSync(file);

      // Check for outdated claims
      const issues = [];

      if (content.includes('350+ tools') && this.results.stats.tools.actual < 350) {
        issues.push('Claims 350+ tools but actual count is lower');
      }

      if (content.includes('120+ agents') && !content.includes('REAL AI agents')) {
        // Check if agents are actually implemented
        const agentFile = path.join(this.srcDir, 'ai-agents', 'agent-registry.js');
        if (fs.existsSync(agentFile)) {
          const agentContent = fs.readFileSync(agentFile, 'utf8');
          const agentCount = (agentContent.match(/id:/g) || []).length;
          if (agentCount < 120) {
            issues.push(`Claims 120+ agents but only ${agentCount} found`);
          }
        }
      }

      docs.push({
        file: path.basename(file),
        size: content.length,
        lastModified: stats.mtime,
        issues,
      });

      if (issues.length > 0) {
        this.results.gaps.push({
          type: 'DOC_MISMATCH',
          file: path.basename(file),
          issues,
        });
      }
    }

    this.results.stats.documentation = {
      totalDocs: docs.length,
      withIssues: docs.filter(d => d.issues.length > 0).length,
    };
  }

  async findGaps() {
    const gaps = [];

    // Check for GPU integration
    const openInterpreterPath = path.join(this.srcDir, 'open-interpreter-tools.js');
    if (fs.existsSync(openInterpreterPath)) {
      const content = fs.readFileSync(openInterpreterPath, 'utf8');
      if (!content.includes('GPU') && !content.includes('CUDA')) {
        gaps.push({
          type: 'MISSING_FEATURE',
          feature: 'GPU Integration',
          description: 'No GPU acceleration for Open Interpreter',
        });
      }
    }

    // Check for CI/CD
    const githubWorkflowsDir = path.join(this.rootDir, '.github', 'workflows');
    if (!fs.existsSync(githubWorkflowsDir)) {
      gaps.push({
        type: 'MISSING_CICD',
        description: 'No GitHub Actions CI/CD pipeline',
      });
    }

    // Check for test files
    const testFiles = this.getAllFiles(this.rootDir, '.test.js');
    if (testFiles.length === 0) {
      gaps.push({
        type: 'MISSING_TESTS',
        description: 'No test files found',
      });
    }

    this.results.gaps.push(...gaps);
  }

  async checkPerformance() {
    const start = Date.now();

    // Test require time for main index
    require('./mcp-server/src/index.js');

    const loadTime = Date.now() - start;

    this.results.stats.performance = {
      loadTime: `${loadTime}ms`,
      memory: process.memoryUsage(),
      recommendation: loadTime > 3000 ? 'Optimize load time' : 'Performance acceptable',
    };
  }

  async generateReport() {
    const report = `# 🔍 SELF-AUDIT REPORT
Generated: ${this.results.timestamp}

## 📊 Summary
- **Code Quality Score**: ${this.calculateScore()}/100
- **Tool Accuracy**: ${this.results.stats.tools.accuracy}
- **Issues Found**: ${this.results.issues.length}
- **Gaps Identified**: ${this.results.gaps.length}

## 📁 File Integrity
- Files Checked: ${this.results.stats.fileIntegrity.total}
- Present: ${this.results.stats.fileIntegrity.present}
- Missing: ${this.results.stats.fileIntegrity.missing}

## 📝 Code Quality
- Total Files: ${this.results.stats.codeQuality.totalFiles}
- Total Lines: ${this.results.stats.codeQuality.totalLines.toLocaleString()}
- TODOs: ${this.results.stats.codeQuality.todos}
- FIXMEs: ${this.results.stats.codeQuality.fixmes}
- Stubs: ${this.results.stats.codeQuality.stubs}

## 🔧 Tools Count
- Actual Handlers: ${this.results.stats.tools.handlers}
- v3.2 Tools: ${this.results.stats.tools.v32Tools}
- v4.x Features:
  - Multi-Agent: ${this.results.stats.tools.v4Features.multiAgent ? '✅' : '❌'}
  - Hive Mind: ${this.results.stats.tools.v4Features.hiveMind ? '✅' : '❌'}
  - Open Interpreter: ${this.results.stats.tools.v4Features.openInterpreter ? '✅' : '❌'}
  - Harness: ${this.results.stats.tools.v4Features.harness ? '✅' : '❌'}

## 📚 Documentation
- Total Docs: ${this.results.stats.documentation.totalDocs}
- Docs with Issues: ${this.results.stats.documentation.withIssues}

## ⚡ Performance
- Load Time: ${this.results.stats.performance.loadTime}
- Memory Used: ${Math.round(this.results.stats.performance.memory.heapUsed / 1024 / 1024)}MB
- Status: ${this.results.stats.performance.recommendation}

## 🕳️ Critical Gaps
${this.results.gaps.map(g => `- **${g.type}**: ${g.description || g.feature}`).join('\n')}

## 🚨 Top Issues
${this.results.issues
  .filter(i => i.severity === 'error')
  .slice(0, 5)
  .map(i => `- **${i.type}** in ${i.file}: ${i.message || ''}`)
  .join('\n')}

## ✅ Recommendations
1. ${this.results.stats.codeQuality.todos > 10 ? 'Fix TODO items' : 'TODO count acceptable'}
2. ${this.results.stats.fileIntegrity.missing > 0 ? 'Create missing files' : 'File integrity OK'}
3. ${this.results.gaps.length > 5 ? 'Address critical gaps' : 'Gap count manageable'}
4. ${this.results.stats.tools.accuracy.includes('100') ? 'Tool count accurate' : 'Update tool count claims'}

## 🎯 Action Items
${this.generateActionItems()}

---
*Run with --fix flag to auto-repair issues*
`;

    fs.writeFileSync('AUDIT_REPORT.md', report);
    console.log('\n✅ Audit report saved to AUDIT_REPORT.md');

    return report;
  }

  calculateScore() {
    let score = 100;

    // Deduct for issues
    score -= this.results.issues.filter(i => i.severity === 'error').length * 5;
    score -= this.results.issues.filter(i => i.severity === 'warning').length * 2;

    // Deduct for gaps
    score -= this.results.gaps.length * 3;

    // Deduct for missing files
    score -= this.results.stats.fileIntegrity.missing * 10;

    return Math.max(0, Math.round(score));
  }

  generateActionItems() {
    const items = [];

    if (this.results.stats.fileIntegrity.missing > 0) {
      items.push('- [ ] Create missing required files');
    }

    if (this.results.stats.codeQuality.stubs > 0) {
      items.push('- [ ] Implement stub functions');
    }

    if (this.results.gaps.find(g => g.type === 'MISSING_CICD')) {
      items.push('- [ ] Set up GitHub Actions CI/CD');
    }

    if (this.results.gaps.find(g => g.feature === 'GPU Integration')) {
      items.push('- [ ] Add GPU acceleration support');
    }

    if (this.results.stats.documentation.withIssues > 0) {
      items.push('- [ ] Update documentation to match implementation');
    }

    return items.length > 0 ? items.join('\n') : '- [x] No critical items';
  }

  async autoFix() {
    console.log('\n🔧 Running auto-fix...');
    let fixed = 0;

    // Fix missing files
    for (const issue of this.results.issues) {
      if (issue.type === 'MISSING_FILE') {
        const filePath = path.join(this.srcDir, issue.file);
        const stub = `// Auto-generated stub for ${issue.file}
// TODO: Implement actual functionality

module.exports = {
  // Stub implementation
};
`;
        fs.writeFileSync(filePath, stub);
        console.log(`  ✅ Created stub: ${issue.file}`);
        fixed++;
      }
    }

    // Create CI/CD if missing
    if (this.results.gaps.find(g => g.type === 'MISSING_CICD')) {
      const workflowDir = path.join(this.rootDir, '.github', 'workflows');
      fs.mkdirSync(workflowDir, { recursive: true });

      const workflow = `name: Self Test & Audit

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * 0'

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run self-audit
`;

      fs.writeFileSync(path.join(workflowDir, 'self-test.yml'), workflow);
      console.log('  ✅ Created GitHub Actions workflow');
      fixed++;
    }

    console.log(`\n✅ Auto-fixed ${fixed} issues`);
  }

  getAllFiles(dir, ext) {
    const files = [];

    function scan(d) {
      if (d.includes('node_modules') || d.includes('.git')) return;

      try {
        const items = fs.readdirSync(d);
        for (const item of items) {
          const fullPath = path.join(d, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scan(fullPath);
          } else if (fullPath.endsWith(ext)) {
            files.push(fullPath);
          }
        }
      } catch (e) {
        // Skip inaccessible directories
      }
    }

    scan(dir);
    return files;
  }
}

// Run if called directly
if (require.main === module) {
  const auditor = new SelfAuditor();
  auditor
    .runCompleteAudit()
    .then(results => {
      console.log('\n' + '='.repeat(60));
      console.log(`Audit Complete! Score: ${auditor.calculateScore()}/100`);
      console.log(`Issues: ${results.issues.length} | Gaps: ${results.gaps.length}`);
      console.log('='.repeat(60));

      if (process.argv.includes('--fix')) {
        console.log('Auto-fix completed. Check AUDIT_REPORT.md for details.');
      }
    })
    .catch(err => {
      console.error('Audit failed:', err);
      process.exit(1);
    });
}

module.exports = { SelfAuditor };
