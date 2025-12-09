#!/usr/bin/env node
/**
 * Windsurf Autopilot - Observability Tools v3.1
 *
 * Sentry, Prometheus metrics, Grafana dashboards, and alerting.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR =
  process.platform === 'win32'
    ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot')
    : path.join(process.env.HOME || '', '.windsurf-autopilot');

const OBS_DIR = path.join(DATA_DIR, 'observability');
const CONFIG_FILE = path.join(OBS_DIR, 'config.json');

// Ensure directory exists
if (!fs.existsSync(OBS_DIR)) {
  fs.mkdirSync(OBS_DIR, { recursive: true });
}

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return {};
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

const observabilityTools = {
  // Setup Sentry error tracking
  sentry_setup: {
    name: 'sentry_setup',
    description: 'Configure Sentry error tracking for project',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path' },
        dsn: { type: 'string', description: 'Sentry DSN' },
        environment: {
          type: 'string',
          description: 'Environment (production, staging, development)',
        },
        framework: {
          type: 'string',
          enum: ['node', 'react', 'nextjs', 'express', 'python', 'django'],
          description: 'Framework',
        },
        release: { type: 'string', description: 'Release version' },
      },
      required: ['path'],
    },
    handler: async args => {
      const projectPath = args.path;
      const dsn = args.dsn;
      const environment = args.environment || 'development';
      let framework = args.framework;
      const release = args.release;

      // Auto-detect framework
      if (!framework) {
        const pkgPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (deps['next']) {
            framework = 'nextjs';
          } else if (deps['react']) {
            framework = 'react';
          } else if (deps['express']) {
            framework = 'express';
          } else {
            framework = 'node';
          }
        } else if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) {
          const reqs = fs.readFileSync(path.join(projectPath, 'requirements.txt'), 'utf8');
          if (reqs.includes('django')) {
            framework = 'django';
          } else {
            framework = 'python';
          }
        }
      }

      if (!dsn) {
        return {
          success: false,
          error: 'Sentry DSN required',
          hint: 'Get DSN from https://sentry.io/settings/projects/YOUR_PROJECT/keys/',
          framework,
          instructions: getSentryInstructions(framework),
        };
      }

      // Generate setup code based on framework
      let setupCode = '';
      let installCmd = '';
      let configFile = '';

      if (framework === 'node' || framework === 'express') {
        installCmd = 'npm install @sentry/node';
        configFile = 'sentry.js';
        setupCode = `const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "${dsn}",
  environment: "${environment}",
  ${release ? `release: "${release}",` : ''}
  tracesSampleRate: 1.0,
});

module.exports = Sentry;
`;
      } else if (framework === 'react') {
        installCmd = 'npm install @sentry/react';
        configFile = 'src/sentry.js';
        setupCode = `import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "${dsn}",
  environment: "${environment}",
  ${release ? `release: "${release}",` : ''}
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export default Sentry;
`;
      } else if (framework === 'nextjs') {
        installCmd = 'npm install @sentry/nextjs';
        configFile = 'sentry.client.config.js';
        setupCode = `import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "${dsn}",
  environment: "${environment}",
  ${release ? `release: "${release}",` : ''}
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
`;
      } else if (framework === 'python' || framework === 'django') {
        installCmd = 'pip install sentry-sdk';
        configFile = 'sentry_config.py';
        setupCode = `import sentry_sdk
${framework === 'django' ? 'from sentry_sdk.integrations.django import DjangoIntegration' : ''}

sentry_sdk.init(
    dsn="${dsn}",
    environment="${environment}",
    ${release ? `release="${release}",` : ''}
    ${framework === 'django' ? 'integrations=[DjangoIntegration()],' : ''}
    traces_sample_rate=1.0,
)
`;
      }

      // Write config file
      const configPath = path.join(projectPath, configFile);
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(configPath, setupCode);

      // Save config
      const config = loadConfig();
      config.sentryDsn = dsn;
      saveConfig(config);

      return {
        success: true,
        framework,
        dsn: dsn.replace(/[a-f0-9]{32}/g, '****'),
        configFile,
        installCommand: installCmd,
        message: `Sentry configured for ${framework}`,
        nextSteps: [
          `Run: ${installCmd}`,
          `Import ${configFile} in your entry point`,
          'Deploy and verify errors appear in Sentry dashboard',
        ],
      };
    },
  },

  // Add Prometheus metrics
  add_metrics: {
    name: 'add_metrics',
    description: 'Add Prometheus metrics to project',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path' },
        port: { type: 'number', description: 'Metrics port' },
        metrics: {
          type: 'array',
          description: 'Custom metrics to add',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['counter', 'gauge', 'histogram'] },
              help: { type: 'string' },
            },
          },
        },
      },
      required: ['path'],
    },
    handler: async args => {
      const projectPath = args.path;
      const port = args.port || 9090;
      const customMetrics = args.metrics || [];

      // Detect if Node.js project
      const isNode = fs.existsSync(path.join(projectPath, 'package.json'));

      if (isNode) {
        // Generate prom-client setup
        let metricsCode = `const promClient = require('prom-client');
const express = require('express');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
`;
        for (const metric of customMetrics) {
          if (metric.type === 'counter') {
            metricsCode += `const ${metric.name} = new promClient.Counter({
  name: '${metric.name}',
  help: '${metric.help || metric.name}',
  registers: [register]
});
`;
          } else if (metric.type === 'gauge') {
            metricsCode += `const ${metric.name} = new promClient.Gauge({
  name: '${metric.name}',
  help: '${metric.help || metric.name}',
  registers: [register]
});
`;
          } else if (metric.type === 'histogram') {
            metricsCode += `const ${metric.name} = new promClient.Histogram({
  name: '${metric.name}',
  help: '${metric.help || metric.name}',
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register]
});
`;
          }
        }

        metricsCode += `
// Metrics endpoint
const metricsApp = express();
metricsApp.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

metricsApp.listen(${port}, () => {
  console.log('Metrics server on port ${port}');
});

module.exports = { register${customMetrics.map(m => `, ${m.name}`).join('')} };
`;

        fs.writeFileSync(path.join(projectPath, 'metrics.js'), metricsCode);

        return {
          success: true,
          type: 'nodejs',
          port,
          file: 'metrics.js',
          customMetrics: customMetrics.length,
          installCommand: 'npm install prom-client express',
          endpoint: `http://localhost:${port}/metrics`,
          message: `Added Prometheus metrics on port ${port}`,
        };
      }

      return {
        success: false,
        error: 'Only Node.js projects currently supported',
        hint: 'Create package.json first',
      };
    },
  },

  // Create Grafana dashboard
  create_dashboard: {
    name: 'create_dashboard',
    description: 'Generate Grafana dashboard JSON',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Dashboard title' },
        datasource: { type: 'string', description: 'Prometheus datasource name' },
        panels: {
          type: 'array',
          description: 'Dashboard panels',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string', enum: ['graph', 'stat', 'gauge', 'table'] },
              query: { type: 'string' },
            },
          },
        },
        output: { type: 'string', description: 'Output file path' },
      },
      required: ['title'],
    },
    handler: async args => {
      const title = args.title;
      const datasource = args.datasource || 'Prometheus';
      const panels = args.panels || [
        { title: 'Request Rate', type: 'graph', query: 'rate(http_requests_total[5m])' },
        {
          title: 'Error Rate',
          type: 'stat',
          query: 'rate(http_requests_total{status=~"5.."}[5m])',
        },
        {
          title: 'Latency P95',
          type: 'gauge',
          query: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
        },
      ];
      const output = args.output;

      const dashboard = {
        dashboard: {
          id: null,
          uid: null,
          title,
          tags: ['generated', 'windsurf'],
          timezone: 'browser',
          schemaVersion: 30,
          refresh: '30s',
          panels: panels.map((panel, i) => ({
            id: i + 1,
            type: panel.type === 'graph' ? 'timeseries' : panel.type,
            title: panel.title,
            gridPos: { x: (i % 2) * 12, y: Math.floor(i / 2) * 8, w: 12, h: 8 },
            datasource: { type: 'prometheus', uid: datasource },
            targets: [
              {
                expr: panel.query,
                refId: 'A',
              },
            ],
            options: panel.type === 'stat' ? { colorMode: 'value', graphMode: 'area' } : {},
          })),
        },
        overwrite: true,
      };

      const dashboardJson = JSON.stringify(dashboard, null, 2);

      if (output) {
        const outputPath = path.isAbsolute(output) ? output : path.join(OBS_DIR, output);
        fs.writeFileSync(outputPath, dashboardJson);
        return {
          success: true,
          title,
          panels: panels.length,
          outputPath,
          message: `Dashboard saved to ${outputPath}`,
          hint: 'Import via Grafana UI: Dashboards > Import > Upload JSON',
        };
      }

      return {
        success: true,
        title,
        panels: panels.length,
        dashboard: dashboardJson.slice(0, 2000),
        message: 'Dashboard JSON generated',
        hint: 'Import via Grafana UI or use output parameter to save',
      };
    },
  },

  // Setup alerting rules
  setup_alerts: {
    name: 'setup_alerts',
    description: 'Configure alerting rules for Prometheus/Alertmanager',
    inputSchema: {
      type: 'object',
      properties: {
        output: { type: 'string', description: 'Output file path' },
        alerts: {
          type: 'array',
          description: 'Alert definitions',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              expr: { type: 'string' },
              for: { type: 'string' },
              severity: { type: 'string' },
              summary: { type: 'string' },
            },
          },
        },
      },
    },
    handler: async args => {
      const output = args.output || path.join(OBS_DIR, 'alert-rules.yml');
      const alerts = args.alerts || [
        {
          name: 'HighErrorRate',
          expr: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.1',
          for: '5m',
          severity: 'critical',
          summary: 'High error rate detected',
        },
        {
          name: 'HighLatency',
          expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1',
          for: '10m',
          severity: 'warning',
          summary: 'High latency detected (p95 > 1s)',
        },
        {
          name: 'HighMemoryUsage',
          expr: 'process_resident_memory_bytes / 1024 / 1024 > 500',
          for: '5m',
          severity: 'warning',
          summary: 'Memory usage above 500MB',
        },
      ];

      let yamlContent = `groups:
  - name: windsurf-alerts
    rules:
`;

      for (const alert of alerts) {
        yamlContent += `      - alert: ${alert.name}
        expr: ${alert.expr}
        for: ${alert.for || '5m'}
        labels:
          severity: ${alert.severity || 'warning'}
        annotations:
          summary: "${alert.summary || alert.name}"
          description: "{{ $labels.instance }}: ${alert.summary || alert.name}"
`;
      }

      const outputPath = path.isAbsolute(output) ? output : path.join(OBS_DIR, output);
      fs.writeFileSync(outputPath, yamlContent);

      return {
        success: true,
        alerts: alerts.length,
        outputPath,
        rules: alerts.map(a => a.name),
        message: `Created ${alerts.length} alert rules`,
        hint: 'Add to Prometheus: rule_files: ["alert-rules.yml"]',
      };
    },
  },
};

function getSentryInstructions(framework) {
  const instructions = {
    node: 'npm install @sentry/node && require("./sentry") at top of app',
    express: 'npm install @sentry/node && add Sentry.setupExpressErrorHandler(app)',
    react: 'npm install @sentry/react && wrap App with Sentry.ErrorBoundary',
    nextjs: 'npx @sentry/wizard@latest -i nextjs',
    python: 'pip install sentry-sdk && import sentry_config at start',
    django: 'pip install sentry-sdk && add to settings.py',
  };
  return instructions[framework] || 'See Sentry docs for your framework';
}

module.exports = observabilityTools;
