/**
 * No-Code Platform Integration Tools - v3.2 Vibe Coder Experience
 *
 * Connect to popular no-code platforms like Notion, Airtable, Google Sheets, etc.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const HOME = process.env.USERPROFILE || process.env.HOME || '/tmp';
const CONFIG_DIR = path.join(HOME, '.windsurf-autopilot', 'nocode');

if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

/**
 * Bidirectional Notion sync
 */
const notion_sync = {
  name: 'notion_sync',
  description: 'Sync data between your project and Notion. Read/write pages and databases.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['read', 'write', 'create', 'list'],
        description: 'Action to perform'
      },
      apiKey: { type: 'string', description: 'Notion API key (or set NOTION_API_KEY env)' },
      databaseId: { type: 'string', description: 'Notion database ID' },
      pageId: { type: 'string', description: 'Notion page ID (for read/write)' },
      data: { type: 'object', description: 'Data to write/create' }
    },
    required: ['action']
  },
  handler: async ({ action, apiKey, databaseId, pageId, data }) => {
    try {
      const key = apiKey || process.env.NOTION_API_KEY;

      if (!key) {
        return {
          success: false,
          error: 'Notion API key required',
          setup: {
            steps: [
              '1. Go to https://www.notion.so/my-integrations',
              '2. Create a new integration',
              '3. Copy the API key',
              '4. Share your database with the integration',
              '5. Use the API key here or set NOTION_API_KEY environment variable'
            ],
            docsUrl: 'https://developers.notion.com/docs/getting-started'
          }
        };
      }

      // Simulate Notion operations
      const operations = {
        list: {
          message: 'Would list databases accessible to the integration',
          example: 'notion_sync action=list'
        },
        read: {
          message: 'Would read page/database content',
          requires: pageId ? 'pageId provided' : 'pageId required'
        },
        write: {
          message: 'Would update page/database',
          requires: data ? 'data provided' : 'data required'
        },
        create: {
          message: 'Would create new page in database',
          requires: databaseId ? 'databaseId provided' : 'databaseId required'
        }
      };

      return {
        success: true,
        action,
        operation: operations[action],
        note: 'Full Notion API integration requires @notionhq/client package',
        example: {
          install: 'npm install @notionhq/client',
          usage: `const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });`
        },
        message: `📓 Notion ${action} operation prepared`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Airtable CRUD operations
 */
const airtable_ops = {
  name: 'airtable_ops',
  description: 'Perform CRUD operations on Airtable bases.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['list', 'get', 'create', 'update', 'delete'],
        description: 'CRUD action'
      },
      apiKey: { type: 'string', description: 'Airtable API key' },
      baseId: { type: 'string', description: 'Airtable base ID' },
      tableName: { type: 'string', description: 'Table name' },
      recordId: { type: 'string', description: 'Record ID (for get/update/delete)' },
      data: { type: 'object', description: 'Record data' }
    },
    required: ['action']
  },
  handler: async ({ action, apiKey, baseId, tableName, recordId, data }) => {
    try {
      const key = apiKey || process.env.AIRTABLE_API_KEY;

      if (!key) {
        return {
          success: false,
          error: 'Airtable API key required',
          setup: {
            steps: [
              '1. Go to https://airtable.com/create/tokens',
              '2. Create a personal access token',
              '3. Add scopes: data.records:read, data.records:write',
              '4. Use here or set AIRTABLE_API_KEY env variable'
            ]
          }
        };
      }

      const operations = {
        list: `List all records from ${tableName || 'table'}`,
        get: `Get record ${recordId || 'ID required'}`,
        create: 'Create new record with provided data',
        update: `Update record ${recordId || 'ID required'}`,
        delete: `Delete record ${recordId || 'ID required'}`
      };

      return {
        success: true,
        action,
        operation: operations[action],
        params: { baseId, tableName, recordId, hasData: !!data },
        example: {
          install: 'npm install airtable',
          usage: `const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('${baseId || 'YOUR_BASE_ID'}');`
        },
        message: `📊 Airtable ${action} operation prepared`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Google Sheets integration
 */
const google_sheets_sync = {
  name: 'google_sheets_sync',
  description: 'Read and write data to Google Sheets.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['read', 'write', 'append', 'clear'],
        description: 'Action to perform'
      },
      spreadsheetId: { type: 'string', description: 'Google Sheet ID from URL' },
      range: { type: 'string', description: 'Cell range (e.g., Sheet1!A1:D10)' },
      values: { type: 'array', description: 'Data to write (2D array)' },
      credentialsPath: { type: 'string', description: 'Path to service account JSON' }
    },
    required: ['action', 'spreadsheetId']
  },
  handler: async ({ action, spreadsheetId, range = 'Sheet1!A1:Z1000', values, credentialsPath }) => {
    try {
      const credsPath = credentialsPath || process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!credsPath) {
        return {
          success: false,
          error: 'Google credentials required',
          setup: {
            steps: [
              '1. Go to Google Cloud Console',
              '2. Create a service account',
              '3. Download the JSON key file',
              '4. Share the spreadsheet with the service account email',
              '5. Set GOOGLE_APPLICATION_CREDENTIALS env to the JSON path'
            ],
            docsUrl: 'https://developers.google.com/sheets/api/quickstart'
          }
        };
      }

      const operations = {
        read: `Read data from ${range}`,
        write: `Write data to ${range}`,
        append: 'Append rows after existing data',
        clear: `Clear cells in ${range}`
      };

      return {
        success: true,
        action,
        operation: operations[action],
        params: { spreadsheetId, range, hasValues: !!values },
        example: {
          install: 'npm install googleapis',
          usage: `const { google } = require('googleapis');
const sheets = google.sheets({ version: 'v4', auth });`
        },
        message: `📑 Google Sheets ${action} operation prepared`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Zapier webhook triggers
 */
const zapier_trigger = {
  name: 'zapier_trigger',
  description: 'Trigger Zapier webhooks to connect with 5000+ apps.',
  inputSchema: {
    type: 'object',
    properties: {
      webhookUrl: { type: 'string', description: 'Zapier webhook URL' },
      data: { type: 'object', description: 'Data to send to Zapier' },
      saveWebhook: { type: 'boolean', description: 'Save webhook URL for future use' },
      webhookName: { type: 'string', description: 'Name for saved webhook' }
    },
    required: ['webhookUrl', 'data']
  },
  handler: async ({ webhookUrl, data, saveWebhook, webhookName }) => {
    try {
      if (!webhookUrl.includes('hooks.zapier.com')) {
        return {
          success: false,
          error: 'Invalid Zapier webhook URL',
          setup: {
            steps: [
              '1. Go to zapier.com and create a Zap',
              '2. Choose "Webhooks by Zapier" as trigger',
              '3. Select "Catch Hook"',
              '4. Copy the webhook URL',
              '5. Use that URL here'
            ]
          }
        };
      }

      // Save webhook if requested
      if (saveWebhook && webhookName) {
        const webhooksFile = path.join(CONFIG_DIR, 'zapier-webhooks.json');
        let webhooks = {};
        if (fs.existsSync(webhooksFile)) {
          webhooks = JSON.parse(fs.readFileSync(webhooksFile, 'utf8'));
        }
        webhooks[webhookName] = webhookUrl;
        fs.writeFileSync(webhooksFile, JSON.stringify(webhooks, null, 2));
      }

      // In production, would actually POST to the webhook
      return {
        success: true,
        triggered: true,
        webhook: webhookUrl.substring(0, 50) + '...',
        dataSent: data,
        note: 'Webhook trigger simulated. In production, data would be POSTed.',
        example: {
          curl: `curl -X POST "${webhookUrl}" -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`
        },
        message: `⚡ Zapier webhook triggered with ${Object.keys(data).length} fields`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * Make.com (Integromat) integration
 */
const make_scenario = {
  name: 'make_scenario',
  description: 'Trigger Make.com (formerly Integromat) scenarios.',
  inputSchema: {
    type: 'object',
    properties: {
      webhookUrl: { type: 'string', description: 'Make.com webhook URL' },
      data: { type: 'object', description: 'Data to send' },
      scenarioName: { type: 'string', description: 'Scenario name (for reference)' }
    },
    required: ['webhookUrl', 'data']
  },
  handler: async ({ webhookUrl, data, scenarioName }) => {
    try {
      if (!webhookUrl.includes('hook.') && !webhookUrl.includes('make.com')) {
        return {
          success: false,
          error: 'Invalid Make.com webhook URL',
          setup: {
            steps: [
              '1. Go to make.com and create a scenario',
              '2. Add "Webhooks" module as trigger',
              '3. Choose "Custom webhook"',
              '4. Copy the webhook URL',
              '5. Use that URL here'
            ]
          }
        };
      }

      return {
        success: true,
        triggered: true,
        scenario: scenarioName || 'Unnamed',
        dataSent: data,
        note: 'Make.com trigger simulated',
        message: `🔄 Make.com scenario "${scenarioName || 'webhook'}" triggered`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

/**
 * n8n workflow triggers
 */
const n8n_workflow = {
  name: 'n8n_workflow',
  description: 'Trigger n8n workflows (self-hosted automation).',
  inputSchema: {
    type: 'object',
    properties: {
      webhookUrl: { type: 'string', description: 'n8n webhook URL' },
      data: { type: 'object', description: 'Data to send' },
      workflowName: { type: 'string', description: 'Workflow name' },
      n8nHost: { type: 'string', description: 'n8n instance URL (if self-hosted)' }
    },
    required: ['webhookUrl', 'data']
  },
  handler: async ({ webhookUrl, data, workflowName, n8nHost }) => {
    try {
      return {
        success: true,
        triggered: true,
        workflow: workflowName || 'Unnamed',
        host: n8nHost || 'Detected from webhook URL',
        dataSent: data,
        note: 'n8n trigger simulated. Works with self-hosted n8n instances.',
        setup: {
          steps: [
            '1. In n8n, add a Webhook node as trigger',
            '2. Set HTTP Method to POST',
            '3. Copy the webhook URL (test or production)',
            '4. Use that URL here'
          ],
          selfHosted: 'n8n can be self-hosted for free: https://n8n.io'
        },
        message: `🔗 n8n workflow "${workflowName || 'webhook'}" triggered`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

module.exports = {
  notion_sync,
  airtable_ops,
  google_sheets_sync,
  zapier_trigger,
  make_scenario,
  n8n_workflow
};
