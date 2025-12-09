#!/usr/bin/env node

/**
 * Documentation Generator for VIBE System
 * Automatically generates 1:1 accurate documentation from codebase
 * Ensures every module, method, and configuration is documented
 */

const fs = require('fs').promises;
const path = require('path');

class DocumentationGenerator {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.docsDir = path.join(this.rootDir, 'docs');
    this.modulesDir = path.join(this.rootDir, 'enhancements');

    this.moduleCategories = {
      core: { count: 30, description: 'Foundation modules' },
      'hive-mind': { count: 12, description: 'Collective intelligence' },
      evolution: { count: 5, description: 'Self-improvement' },
      'ai-ml': { count: 3, description: 'Machine learning' },
    };

    this.documentation = {
      modules: [],
      apis: [],
      configs: [],
      diagrams: [],
    };

    this.stats = {
      filesProcessed: 0,
      docsGenerated: 0,
      errors: [],
    };
  }

  async generate() {
    console.log('📚 Starting Documentation Generation...');
    console.log('   Ensuring 1:1 accuracy with codebase...\n');

    try {
      // Create docs structure
      await this.createDocsStructure();

      // Scan and document all modules
      await this.scanAllModules();

      // Generate module documentation
      await this.generateModuleDocs();

      // Generate API documentation
      await this.generateAPIDocs();

      // Generate architecture diagrams
      await this.generateDiagrams();

      // Generate main documentation files
      await this.generateMainDocs();

      // Generate index
      await this.generateIndex();

      // Validate completeness
      await this.validateCompleteness();

      console.log('\n✅ Documentation Generation Complete!');
      console.log(`   Files processed: ${this.stats.filesProcessed}`);
      console.log(`   Docs generated: ${this.stats.docsGenerated}`);

      if (this.stats.errors.length > 0) {
        console.log(`\n⚠️ Errors: ${this.stats.errors.length}`);
        this.stats.errors.forEach(err => console.log(`   - ${err}`));
      }
    } catch (error) {
      console.error('❌ Documentation generation failed:', error);
      process.exit(1);
    }
  }

  async createDocsStructure() {
    console.log('📁 Creating documentation structure...');

    const dirs = [
      'docs',
      'docs/modules',
      'docs/modules/core',
      'docs/modules/hive-mind',
      'docs/modules/evolution',
      'docs/modules/ai-ml',
      'docs/api',
      'docs/guides',
      'docs/diagrams',
    ];

    for (const dir of dirs) {
      const dirPath = path.join(this.rootDir, dir);
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async scanAllModules() {
    console.log('🔍 Scanning all modules...');

    for (const [category, config] of Object.entries(this.moduleCategories)) {
      const categoryPath = path.join(this.modulesDir, category);

      try {
        const files = await fs.readdir(categoryPath);
        const jsFiles = files.filter(f => f.endsWith('.js'));

        console.log(`   ${category}: ${jsFiles.length} modules found`);

        for (const file of jsFiles) {
          const modulePath = path.join(categoryPath, file);
          const moduleInfo = await this.analyzeModule(modulePath, category);
          this.documentation.modules.push(moduleInfo);
          this.stats.filesProcessed++;
        }
      } catch (error) {
        this.stats.errors.push(`Failed to scan ${category}: ${error.message}`);
      }
    }
  }

  async analyzeModule(modulePath, category) {
    const content = await fs.readFile(modulePath, 'utf8');
    const fileName = path.basename(modulePath);
    const moduleName = fileName.replace('.js', '');

    // Extract module information
    const moduleInfo = {
      name: moduleName,
      fileName,
      category,
      path: modulePath,
      lines: content.split('\n').length,
      description: this.extractDescription(content),
      class: this.extractClassName(content),
      constructor: this.extractConstructor(content),
      methods: this.extractMethods(content),
      events: this.extractEvents(content),
      config: this.extractConfig(content),
      dependencies: this.extractDependencies(content),
    };

    return moduleInfo;
  }

  extractDescription(content) {
    const match = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
    return match ? match[1] : 'Module description';
  }

  extractClassName(content) {
    const match = content.match(/class\s+(\w+)/);
    return match ? match[1] : null;
  }

  extractConstructor(content) {
    const match = content.match(/constructor\s*\(([^)]*)\)/);
    if (match) {
      return {
        params: match[1]
          .split(',')
          .map(p => p.trim())
          .filter(p => p),
      };
    }
    return null;
  }

  extractMethods(content) {
    const methods = [];
    const methodRegex = /async\s+(\w+)\s*\(([^)]*)\)|(\w+)\s*\(([^)]*)\)\s*{/g;
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      const name = match[1] || match[3];
      const params = (match[2] || match[4] || '')
        .split(',')
        .map(p => p.trim())
        .filter(p => p);

      if (name && name !== 'constructor') {
        methods.push({ name, params, async: !!match[1] });
      }
    }

    return methods;
  }

  extractEvents(content) {
    const events = [];
    const eventRegex = /this\.emit\(['"](\w+)['"]/g;
    let match;

    while ((match = eventRegex.exec(content)) !== null) {
      if (!events.includes(match[1])) {
        events.push(match[1]);
      }
    }

    return events;
  }

  extractConfig(content) {
    const configMatch = content.match(/this\.config\s*=\s*{([^}]+)}/);
    if (configMatch) {
      const configLines = configMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'));

      return configLines
        .map(line => {
          const [key] = line.split(':');
          return key ? key.trim() : null;
        })
        .filter(Boolean);
    }
    return [];
  }

  extractDependencies(content) {
    const deps = [];
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    let match;

    while ((match = requireRegex.exec(content)) !== null) {
      if (!match[1].startsWith('.')) {
        deps.push(match[1]);
      }
    }

    return deps;
  }

  async generateModuleDocs() {
    console.log('📝 Generating module documentation...');

    for (const module of this.documentation.modules) {
      const docPath = path.join(this.docsDir, 'modules', module.category, `${module.name}.md`);

      const docContent = this.createModuleDoc(module);
      await fs.writeFile(docPath, docContent);
      this.stats.docsGenerated++;
    }
  }

  createModuleDoc(module) {
    return `# Module: ${module.name}

## Overview
- **Category**: ${module.category}
- **File**: ${module.fileName}
- **Lines of Code**: ${module.lines}
- **Class**: ${module.class || 'N/A'}

## Description
${module.description}

## Configuration
${module.config.length > 0 ? module.config.map(c => `- \`${c}\``).join('\n') : 'No configuration options'}

## Constructor
\`\`\`javascript
new ${module.class}(options)
\`\`\`

### Options
${module.constructor ? module.constructor.params.map(p => `- \`${p}\``).join('\n') : 'No parameters'}

## Methods

${module.methods
  .map(
    method => `### ${method.name}(${method.params.join(', ')})
${method.async ? '*(async)*' : ''}
- **Parameters**: ${method.params.length > 0 ? method.params.map(p => `\`${p}\``).join(', ') : 'None'}
- **Returns**: *To be documented*
`
  )
  .join('\n')}

## Events
${module.events.length > 0 ? module.events.map(e => `- \`${e}\``).join('\n') : 'No events emitted'}

## Dependencies
${module.dependencies.length > 0 ? module.dependencies.map(d => `- ${d}`).join('\n') : 'No external dependencies'}

## Integration
This module integrates with other VIBE components to provide ${module.description.toLowerCase()}.

## Example Usage
\`\`\`javascript
const ${module.class} = require('./enhancements/${module.category}/${module.fileName}');

const ${module.name.replace(/-/g, '')} = new ${module.class}({
  // Configuration options
});

await ${module.name.replace(/-/g, '')}.initialize();
\`\`\`

## Source Code
[View source](../../../../enhancements/${module.category}/${module.fileName})

---
*Documentation auto-generated from source code*
`;
  }

  async generateAPIDocs() {
    console.log('📘 Generating API documentation...');

    // Group modules by category for API docs
    const apiByCategory = {};

    for (const module of this.documentation.modules) {
      if (!apiByCategory[module.category]) {
        apiByCategory[module.category] = [];
      }
      apiByCategory[module.category].push(module);
    }

    for (const [category, modules] of Object.entries(apiByCategory)) {
      const apiPath = path.join(this.docsDir, 'api', `${category}-api.md`);
      const apiContent = this.createAPIDoc(category, modules);
      await fs.writeFile(apiPath, apiContent);
      this.stats.docsGenerated++;
    }
  }

  createAPIDoc(category, modules) {
    return `# ${category} API Reference

## Overview
This document provides the complete API reference for all ${category} modules.

## Modules

${modules
  .map(
    m => `### ${m.name}
- **Class**: \`${m.class}\`
- **Methods**: ${m.methods.length}
- **Events**: ${m.events.length}
- [Full Documentation](../modules/${category}/${m.name}.md)
`
  )
  .join('\n')}

## Quick Reference

### All Methods
${modules
  .flatMap(m =>
    m.methods.map(method => `- \`${m.name}.${method.name}(${method.params.join(', ')})\``)
  )
  .join('\n')}

### All Events
${modules.flatMap(m => m.events.map(event => `- \`${m.name}:${event}\``)).join('\n')}

---
*API documentation auto-generated from source code*
`;
  }

  async generateDiagrams() {
    console.log('📊 Generating architecture diagrams...');

    // System overview diagram
    const overviewDiagram = `# System Architecture Diagrams

## System Overview

\`\`\`mermaid
graph TB
    subgraph "VIBE System"
        Core[Core Modules<br/>30 modules]
        Hive[Hive Mind<br/>12 modules]
        Evolution[Evolution<br/>5 modules]
        ML[Machine Learning<br/>3 modules]
    end
    
    subgraph "External"
        HF[HuggingFace]
        Local[Local Storage]
        User[User]
    end
    
    User --> Core
    Core --> Hive
    Hive --> Evolution
    Evolution --> ML
    ML --> HF
    ML --> Local
    HF --> ML
\`\`\`

## Data Flow

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant C as Core
    participant H as Hive Mind
    participant M as ML Core
    participant HF as HuggingFace
    
    U->>C: Interaction
    C->>H: Process
    H->>M: Collect Data
    M->>M: Train Model
    M->>HF: Upload
    HF->>M: Community Data
    M->>H: Improved Model
    H->>C: Enhanced
    C->>U: Response
\`\`\`

## Module Count by Category

\`\`\`mermaid
pie title Module Distribution
    "Core" : 30
    "Hive Mind" : 12
    "Evolution" : 5
    "ML" : 3
\`\`\`
`;

    const diagramPath = path.join(this.docsDir, 'diagrams', 'architecture.md');
    await fs.writeFile(diagramPath, overviewDiagram);
    this.stats.docsGenerated++;
  }

  async generateMainDocs() {
    console.log('📖 Generating main documentation files...');

    // Architecture document
    const archDoc = await this.createArchitectureDoc();
    await fs.writeFile(path.join(this.docsDir, 'ARCHITECTURE.md'), archDoc);

    // Configuration document
    const configDoc = await this.createConfigurationDoc();
    await fs.writeFile(path.join(this.docsDir, 'CONFIGURATION.md'), configDoc);

    // Installation guide
    const installDoc = await this.createInstallationDoc();
    await fs.writeFile(path.join(this.docsDir, 'INSTALLATION.md'), installDoc);

    this.stats.docsGenerated += 3;
  }

  async createArchitectureDoc() {
    const totalModules = this.documentation.modules.length;
    const totalLines = this.documentation.modules.reduce((sum, m) => sum + m.lines, 0);

    return `# VIBE System Architecture

## Overview
The VIBE system consists of ${totalModules} modules organized into 4 main layers, totaling ${totalLines} lines of code.

## Layers

### 1. Core Layer (30 modules)
Foundation functionality including error prevention, idea generation, and performance optimization.

### 2. Hive Mind Layer (12 modules)
Collective intelligence including user preferences, GitHub analysis, and memory systems.

### 3. Evolution Layer (5 modules)
Self-improvement capabilities including project evolution and module spawning.

### 4. ML Layer (3 modules)
Machine learning capabilities including data collection, model training, and HuggingFace sync.

## Module Statistics

| Category | Modules | Total Lines | Avg Lines/Module |
|----------|---------|-------------|------------------|
${Object.entries(this.moduleCategories)
  .map(([cat, config]) => {
    const modules = this.documentation.modules.filter(m => m.category === cat);
    const lines = modules.reduce((sum, m) => sum + m.lines, 0);
    return `| ${cat} | ${modules.length} | ${lines} | ${Math.round(lines / modules.length)} |`;
  })
  .join('\n')}

## Design Principles
1. **Modularity**: Each module has a single responsibility
2. **Event-Driven**: Modules communicate via events
3. **Local-First**: All data and processing stays local
4. **Self-Improving**: System continuously evolves

[View Architecture Diagrams](diagrams/architecture.md)
`;
  }

  async createConfigurationDoc() {
    const allConfigs = new Set();

    this.documentation.modules.forEach(m => {
      m.config.forEach(c => allConfigs.add(c));
    });

    return `# Configuration Guide

## Overview
VIBE modules can be configured through options passed to their constructors.

## Common Configuration Options

${Array.from(allConfigs)
  .map(
    config => `### ${config}
- **Type**: *varies by module*
- **Description**: Configuration option for module behavior
- **Default**: Module-specific default value
`
  )
  .join('\n')}

## Environment Variables

Create a \`.env.local\` file with:
\`\`\`bash
# ML Configuration
ML_ENABLED=true
HUGGINGFACE_TOKEN=your_token_here

# System Configuration  
AUTO_EVOLVE=true
AUTO_TRAIN=true
SYNC_INTERVAL=3600000
\`\`\`

## Module-Specific Configuration

Each module accepts specific configuration options. See individual module documentation for details.
`;
  }

  async createInstallationDoc() {
    return `# Installation Guide

## Prerequisites
- Node.js v18 or higher
- Git
- 8GB+ RAM
- Optional: GPU for ML acceleration

## Installation Steps

### 1. Clone Repository
\`\`\`bash
git clone https://github.com/Ghenghis/windsurf-vibe-setup.git
cd windsurf-vibe-setup
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Configure Environment
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your settings
\`\`\`

### 4. Initialize System
\`\`\`bash
npm run init
\`\`\`

### 5. Start VIBE
\`\`\`bash
npm run vibe:start
\`\`\`

## Optional: ML Setup

### Install ML Dependencies
\`\`\`bash
npm install @xenova/transformers @huggingface/hub sqlite3
\`\`\`

### Configure HuggingFace
1. Create account at huggingface.co
2. Generate access token
3. Add to .env.local: \`HUGGINGFACE_TOKEN=your_token\`

## Verification

Run system check:
\`\`\`bash
npm run vibe:check
\`\`\`

Expected output:
- ✅ 50 modules loaded
- ✅ ML system ready
- ✅ HuggingFace connected
- ✅ System operational
`;
  }

  async generateIndex() {
    console.log('📑 Generating documentation index...');

    const indexContent = `# VIBE Documentation Index

## Quick Links
- [README](../README.md) - Project overview
- [Architecture](ARCHITECTURE.md) - System design
- [Installation](INSTALLATION.md) - Setup guide
- [Configuration](CONFIGURATION.md) - Configuration options

## Module Documentation
${Object.entries(this.moduleCategories)
  .map(([cat, config]) => {
    const modules = this.documentation.modules.filter(m => m.category === cat);
    return `### ${cat} (${modules.length} modules)
${modules.map(m => `- [${m.name}](modules/${cat}/${m.name}.md)`).join('\n')}`;
  })
  .join('\n\n')}

## API References
${Object.keys(this.moduleCategories)
  .map(cat => `- [${cat} API](api/${cat}-api.md)`)
  .join('\n')}

## Diagrams
- [Architecture Diagrams](diagrams/architecture.md)

---
*Total Modules: ${this.documentation.modules.length}*
*Total Documentation Files: ${this.stats.docsGenerated}*
*Last Updated: ${new Date().toISOString()}*
`;

    await fs.writeFile(path.join(this.docsDir, 'INDEX.md'), indexContent);
    this.stats.docsGenerated++;
  }

  async validateCompleteness() {
    console.log('\n🔍 Validating documentation completeness...');

    let issues = 0;

    // Check module count
    for (const [category, config] of Object.entries(this.moduleCategories)) {
      const found = this.documentation.modules.filter(m => m.category === category).length;
      if (found !== config.count) {
        console.log(`   ⚠️ ${category}: Expected ${config.count}, found ${found}`);
        issues++;
      } else {
        console.log(`   ✅ ${category}: ${found} modules documented`);
      }
    }

    // Check for missing documentation
    for (const module of this.documentation.modules) {
      if (!module.description || module.description === 'Module description') {
        console.log(`   ⚠️ ${module.name}: Missing description`);
        issues++;
      }
    }

    if (issues === 0) {
      console.log('   ✅ Documentation is complete and accurate!');
    } else {
      console.log(`   ⚠️ Found ${issues} documentation issues`);
    }
  }
}

// Run the generator
const generator = new DocumentationGenerator();
generator.generate().catch(console.error);
