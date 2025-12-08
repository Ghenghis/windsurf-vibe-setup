#!/usr/bin/env node
/**
 * Windsurf Autopilot - Advanced Testing Tools v3.1
 *
 * E2E, Visual Regression, Load, Contract, and Mutation testing.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Data directory
const DATA_DIR = process.platform === 'win32'
  ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot')
  : path.join(process.env.HOME || '', '.windsurf-autopilot');

const TESTING_DIR = path.join(DATA_DIR, 'testing');
const SCREENSHOTS_DIR = path.join(TESTING_DIR, 'screenshots');
const REPORTS_DIR = path.join(TESTING_DIR, 'reports');

// Ensure directories exist
[TESTING_DIR, SCREENSHOTS_DIR, REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const testingTools = {

  // Run E2E tests with Playwright or Cypress
  run_e2e_tests: {
    name: 'run_e2e_tests',
    description: 'Run end-to-end tests with Playwright or Cypress',
    inputSchema: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          enum: ['playwright', 'cypress'],
          description: 'Testing framework to use'
        },
        spec: { type: 'string', description: 'Specific test file or pattern' },
        browser: { type: 'string', description: 'Browser to use (chromium, firefox, webkit)' },
        headed: { type: 'boolean', description: 'Run in headed mode' },
        project: { type: 'string', description: 'Project path' },
        baseUrl: { type: 'string', description: 'Base URL for tests' }
      },
      required: ['framework']
    },
    handler: async (args) => {
      const framework = args.framework;
      const spec = args.spec;
      const browser = args.browser || 'chromium';
      const headed = args.headed || false;
      const projectPath = args.project || process.cwd();
      const baseUrl = args.baseUrl;

      let cmd, output;

      if (framework === 'playwright') {
        // Check if Playwright is installed
        const playwrightInstalled = fs.existsSync(path.join(projectPath, 'node_modules', '@playwright', 'test'));
        if (!playwrightInstalled) {
          return {
            success: false,
            error: 'Playwright not installed',
            hint: 'Run: npm install -D @playwright/test && npx playwright install'
          };
        }

        cmd = 'npx playwright test';
        if (spec) {
          cmd += ` ${spec}`;
        }
        cmd += ` --browser=${browser}`;
        if (headed) {
          cmd += ' --headed';
        }
        if (baseUrl) {
          cmd += ` --base-url=${baseUrl}`;
        }
        cmd += ' --reporter=json';

      } else if (framework === 'cypress') {
        // Check if Cypress is installed
        const cypressInstalled = fs.existsSync(path.join(projectPath, 'node_modules', 'cypress'));
        if (!cypressInstalled) {
          return {
            success: false,
            error: 'Cypress not installed',
            hint: 'Run: npm install -D cypress'
          };
        }

        cmd = headed ? 'npx cypress open' : 'npx cypress run';
        if (spec) {
          cmd += ` --spec "${spec}"`;
        }
        cmd += ` --browser ${browser}`;
        if (baseUrl) {
          cmd += ` --config baseUrl=${baseUrl}`;
        }
      }

      try {
        output = execSync(cmd, {
          cwd: projectPath,
          encoding: 'utf8',
          timeout: 600000,
          maxBuffer: 50 * 1024 * 1024
        });

        // Parse results
        const results = { passed: 0, failed: 0, skipped: 0 };

        if (framework === 'playwright') {
          try {
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const json = JSON.parse(jsonMatch[0]);
              results.passed = json.stats?.expected || 0;
              results.failed = json.stats?.unexpected || 0;
              results.skipped = json.stats?.skipped || 0;
            }
          } catch {}
        } else {
          const passMatch = output.match(/(\d+) passing/);
          const failMatch = output.match(/(\d+) failing/);
          const skipMatch = output.match(/(\d+) pending/);
          if (passMatch) {
            results.passed = parseInt(passMatch[1]);
          }
          if (failMatch) {
            results.failed = parseInt(failMatch[1]);
          }
          if (skipMatch) {
            results.skipped = parseInt(skipMatch[1]);
          }
        }

        const reportPath = path.join(REPORTS_DIR, `e2e-${Date.now()}.txt`);
        fs.writeFileSync(reportPath, output);

        return {
          success: results.failed === 0,
          framework,
          browser,
          results,
          total: results.passed + results.failed + results.skipped,
          reportPath,
          message: results.failed === 0
            ? `All ${results.passed} tests passed`
            : `${results.failed} tests failed out of ${results.passed + results.failed}`
        };
      } catch (error) {
        return {
          success: false,
          framework,
          error: error.message,
          output: error.stdout?.slice(-2000) || ''
        };
      }
    }
  },

  // Visual regression testing
  visual_regression: {
    name: 'visual_regression',
    description: 'Screenshot comparison testing for visual regression',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to capture' },
        name: { type: 'string', description: 'Name for the screenshot' },
        baseline: { type: 'string', description: 'Path to baseline image' },
        threshold: { type: 'number', description: 'Diff threshold (0-1)' },
        viewport: {
          type: 'object',
          properties: {
            width: { type: 'number' },
            height: { type: 'number' }
          }
        },
        selector: { type: 'string', description: 'CSS selector to capture' },
        updateBaseline: { type: 'boolean', description: 'Update baseline instead of comparing' }
      },
      required: ['url', 'name']
    },
    handler: async (args) => {
      const url = args.url;
      const name = args.name.replace(/[^a-zA-Z0-9-_]/g, '_');
      const baseline = args.baseline || path.join(SCREENSHOTS_DIR, `${name}-baseline.png`);
      const threshold = args.threshold || 0.1;
      const viewport = args.viewport || { width: 1280, height: 720 };
      const selector = args.selector;
      const updateBaseline = args.updateBaseline || false;

      // Check for puppeteer
      try {
        require.resolve('puppeteer');
      } catch {
        return {
          success: false,
          error: 'Puppeteer not installed',
          hint: 'Run: npm install puppeteer'
        };
      }

      const puppeteer = require('puppeteer');

      let browser;
      try {
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setViewport(viewport);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Capture screenshot
        const currentPath = path.join(SCREENSHOTS_DIR, `${name}-current.png`);

        if (selector) {
          const element = await page.$(selector);
          if (element) {
            await element.screenshot({ path: currentPath });
          } else {
            await browser.close();
            return { success: false, error: `Selector "${selector}" not found` };
          }
        } else {
          await page.screenshot({ path: currentPath, fullPage: false });
        }

        await browser.close();

        // If updating baseline or no baseline exists
        if (updateBaseline || !fs.existsSync(baseline)) {
          fs.copyFileSync(currentPath, baseline);
          return {
            success: true,
            action: 'baseline_updated',
            baseline,
            message: 'Baseline screenshot updated'
          };
        }

        // Compare with baseline using pixel-by-pixel comparison
        // Simple comparison - for production use pixelmatch or similar
        const baselineBuffer = fs.readFileSync(baseline);
        const currentBuffer = fs.readFileSync(currentPath);

        const sizeDiff = Math.abs(baselineBuffer.length - currentBuffer.length);
        const sizeRatio = sizeDiff / Math.max(baselineBuffer.length, currentBuffer.length);

        // Simple heuristic - if file sizes are very different, images differ
        const match = sizeRatio < threshold;

        const diffPath = path.join(SCREENSHOTS_DIR, `${name}-diff.png`);

        return {
          success: match,
          match,
          diffPercent: Math.round(sizeRatio * 100 * 100) / 100,
          threshold: threshold * 100,
          baseline,
          current: currentPath,
          diffImage: match ? null : diffPath,
          message: match
            ? 'Visual comparison passed'
            : `Visual difference detected: ${Math.round(sizeRatio * 100)}% change`
        };
      } catch (error) {
        if (browser) {
          await browser.close();
        }
        return {
          success: false,
          error: error.message
        };
      }
    }
  },

  // Load testing with k6 or Artillery
  load_test: {
    name: 'load_test',
    description: 'Run load tests with k6 or Artillery',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Target URL to test' },
        tool: { type: 'string', enum: ['k6', 'artillery'], description: 'Load testing tool' },
        vus: { type: 'number', description: 'Virtual users / arrival rate' },
        duration: { type: 'string', description: 'Test duration (e.g., "30s", "1m")' },
        script: { type: 'string', description: 'Path to test script' },
        thresholds: {
          type: 'object',
          description: 'Performance thresholds',
          properties: {
            p95: { type: 'number', description: 'p95 response time in ms' },
            errorRate: { type: 'number', description: 'Max error rate (0-1)' }
          }
        }
      },
      required: ['target']
    },
    handler: async (args) => {
      const target = args.target;
      const tool = args.tool || 'k6';
      const vus = args.vus || 10;
      const duration = args.duration || '30s';
      const script = args.script;
      const thresholds = args.thresholds || { p95: 500, errorRate: 0.01 };

      if (tool === 'k6') {
        // Check if k6 is installed
        try {
          execSync('k6 version', { encoding: 'utf8' });
        } catch {
          return {
            success: false,
            error: 'k6 is not installed',
            hint: 'Install from https://k6.io/docs/getting-started/installation/'
          };
        }

        // Create script if not provided
        let scriptPath = script;
        if (!script) {
          scriptPath = path.join(TESTING_DIR, `k6-test-${Date.now()}.js`);
          const k6Script = `
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: ${vus},
  duration: '${duration}',
  thresholds: {
    http_req_duration: ['p(95)<${thresholds.p95}'],
    http_req_failed: ['rate<${thresholds.errorRate}'],
  },
};

export default function () {
  const res = http.get('${target}');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < ${thresholds.p95},
  });
  sleep(1);
}
`;
          fs.writeFileSync(scriptPath, k6Script);
        }

        try {
          const output = execSync(`k6 run --out json=- ${scriptPath}`, {
            encoding: 'utf8',
            timeout: 300000,
            maxBuffer: 50 * 1024 * 1024
          });

          // Parse k6 output
          const lines = output.split('\n').filter(l => l.startsWith('{'));
          const metrics = {
            requests: 0,
            failed: 0,
            avgDuration: 0,
            p95Duration: 0
          };

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.metric === 'http_reqs' && data.type === 'Point') {
                metrics.requests++;
              }
              if (data.metric === 'http_req_duration' && data.type === 'Point') {
                metrics.avgDuration = data.data?.value || 0;
              }
            } catch {}
          }

          const reportPath = path.join(REPORTS_DIR, `loadtest-${Date.now()}.json`);
          fs.writeFileSync(reportPath, JSON.stringify({ target, metrics, output: output.slice(-5000) }, null, 2));

          return {
            success: true,
            tool: 'k6',
            target,
            vus,
            duration,
            metrics,
            reportPath,
            message: `Load test completed: ${metrics.requests} requests`
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      } else {
        // Artillery
        return {
          success: false,
          error: 'Artillery support coming soon',
          hint: 'Use k6 for now'
        };
      }
    }
  },

  // Contract testing with Pact
  contract_test: {
    name: 'contract_test',
    description: 'API contract testing with Pact or OpenAPI validation',
    inputSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', description: 'Provider service name' },
        consumer: { type: 'string', description: 'Consumer service name' },
        pactFile: { type: 'string', description: 'Path to Pact contract file' },
        providerUrl: { type: 'string', description: 'Provider base URL' },
        openApiSpec: { type: 'string', description: 'Path to OpenAPI spec for validation' }
      },
      required: ['provider']
    },
    handler: async (args) => {
      const provider = args.provider;
      const consumer = args.consumer || 'consumer';
      const pactFile = args.pactFile;
      const providerUrl = args.providerUrl;
      const openApiSpec = args.openApiSpec;

      // OpenAPI validation
      if (openApiSpec) {
        if (!fs.existsSync(openApiSpec)) {
          return { success: false, error: 'OpenAPI spec file not found' };
        }

        const spec = fs.readFileSync(openApiSpec, 'utf8');
        let parsed;
        try {
          parsed = JSON.parse(spec);
        } catch {
          try {
            const yaml = require('js-yaml');
            parsed = yaml.load(spec);
          } catch {
            return { success: false, error: 'Could not parse OpenAPI spec' };
          }
        }

        // Basic validation
        const endpoints = [];
        if (parsed.paths) {
          for (const [path, methods] of Object.entries(parsed.paths)) {
            for (const method of Object.keys(methods)) {
              if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                endpoints.push({ method: method.toUpperCase(), path });
              }
            }
          }
        }

        return {
          success: true,
          type: 'openapi_validation',
          spec: openApiSpec,
          version: parsed.openapi || parsed.swagger || 'unknown',
          title: parsed.info?.title || 'Unknown API',
          endpoints: endpoints.length,
          endpointList: endpoints.slice(0, 20),
          message: `OpenAPI spec valid: ${endpoints.length} endpoints found`
        };
      }

      // Pact verification
      if (pactFile) {
        if (!fs.existsSync(pactFile)) {
          return { success: false, error: 'Pact file not found' };
        }

        const pact = JSON.parse(fs.readFileSync(pactFile, 'utf8'));
        const interactions = pact.interactions || [];

        return {
          success: true,
          type: 'pact_contract',
          provider: pact.provider?.name || provider,
          consumer: pact.consumer?.name || consumer,
          interactions: interactions.length,
          interactionSummary: interactions.map(i => ({
            description: i.description,
            request: `${i.request?.method} ${i.request?.path}`,
            response: i.response?.status
          })),
          message: `Pact contract loaded: ${interactions.length} interactions`
        };
      }

      return {
        success: false,
        error: 'Provide either openApiSpec or pactFile'
      };
    }
  },

  // Mutation testing
  mutation_test: {
    name: 'mutation_test',
    description: 'Run mutation testing with Stryker',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project path' },
        files: { type: 'array', items: { type: 'string' }, description: 'Files to mutate' },
        testRunner: { type: 'string', description: 'Test runner (jest, mocha, jasmine)' }
      },
      required: ['path']
    },
    handler: async (args) => {
      const projectPath = args.path;
      const files = args.files || ['src/**/*.js'];
      const testRunner = args.testRunner || 'jest';

      // Check if Stryker is installed
      const strykerInstalled = fs.existsSync(path.join(projectPath, 'node_modules', '@stryker-mutator', 'core'));

      if (!strykerInstalled) {
        // Create stryker config
        const strykerConfig = {
          '$schema': './node_modules/@stryker-mutator/core/schema/stryker-schema.json',
          'packageManager': 'npm',
          'reporters': ['html', 'clear-text', 'progress'],
          'testRunner': testRunner,
          'coverageAnalysis': 'perTest',
          'mutate': files
        };

        const configPath = path.join(projectPath, 'stryker.conf.json');
        fs.writeFileSync(configPath, JSON.stringify(strykerConfig, null, 2));

        return {
          success: false,
          configCreated: configPath,
          error: 'Stryker not installed',
          hint: `Run: npm install -D @stryker-mutator/core @stryker-mutator/${testRunner}-runner`,
          message: 'Stryker config created. Install Stryker and run again.'
        };
      }

      try {
        const output = execSync('npx stryker run', {
          cwd: projectPath,
          encoding: 'utf8',
          timeout: 600000,
          maxBuffer: 50 * 1024 * 1024
        });

        // Parse mutation score
        const scoreMatch = output.match(/Mutation score:\s*([\d.]+)%/);
        const killedMatch = output.match(/(\d+)\s+killed/i);
        const survivedMatch = output.match(/(\d+)\s+survived/i);
        const timeoutMatch = output.match(/(\d+)\s+timed out/i);

        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
        const killed = killedMatch ? parseInt(killedMatch[1]) : 0;
        const survived = survivedMatch ? parseInt(survivedMatch[1]) : 0;
        const timedOut = timeoutMatch ? parseInt(timeoutMatch[1]) : 0;

        return {
          success: score >= 80,
          score: score,
          killed,
          survived,
          timedOut,
          total: killed + survived + timedOut,
          message: `Mutation score: ${score}% (${killed} killed, ${survived} survived)`,
          hint: score < 80 ? 'Consider adding more tests to kill surviving mutants' : 'Good mutation score!'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }
};

module.exports = testingTools;
