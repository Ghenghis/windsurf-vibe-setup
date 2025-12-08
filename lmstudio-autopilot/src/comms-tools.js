#!/usr/bin/env node
/**
 * Windsurf Autopilot - Communications Tools v3.1
 * 
 * Slack, Discord, Teams, Email, and SMS notifications.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Data directory
const DATA_DIR = process.platform === 'win32'
  ? path.join(process.env.APPDATA || '', 'WindsurfAutopilot')
  : path.join(process.env.HOME || '', '.windsurf-autopilot');

const COMMS_DIR = path.join(DATA_DIR, 'communications');
const CONFIG_FILE = path.join(COMMS_DIR, 'config.json');

// Ensure directories exist
if (!fs.existsSync(COMMS_DIR)) {
  fs.mkdirSync(COMMS_DIR, { recursive: true });
}

// Load config
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return {};
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// HTTP POST helper
function httpPost(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

const commsTools = {

  // Slack notification
  slack_notify: {
    name: 'slack_notify',
    description: 'Send notification to Slack via webhook',
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', description: 'Slack webhook URL (or use saved config)' },
        message: { type: 'string', description: 'Message text' },
        channel: { type: 'string', description: 'Channel override' },
        username: { type: 'string', description: 'Bot username' },
        iconEmoji: { type: 'string', description: 'Bot icon emoji' },
        blocks: { 
          type: 'array', 
          description: 'Slack Block Kit blocks for rich formatting'
        },
        attachments: {
          type: 'array',
          description: 'Legacy attachments'
        }
      },
      required: ['message']
    },
    handler: async (args) => {
      const config = loadConfig();
      const webhookUrl = args.webhookUrl || config.slackWebhook;
      const message = args.message;
      const channel = args.channel;
      const username = args.username || 'Windsurf Autopilot';
      const iconEmoji = args.iconEmoji || ':robot_face:';
      const blocks = args.blocks;
      const attachments = args.attachments;

      if (!webhookUrl) {
        return {
          success: false,
          error: 'No webhook URL provided',
          hint: 'Provide webhookUrl or save it to config'
        };
      }

      // Save webhook for future use
      if (args.webhookUrl && args.webhookUrl !== config.slackWebhook) {
        config.slackWebhook = args.webhookUrl;
        saveConfig(config);
      }

      const payload = {
        text: message,
        username,
        icon_emoji: iconEmoji
      };

      if (channel) payload.channel = channel;
      if (blocks) payload.blocks = blocks;
      if (attachments) payload.attachments = attachments;

      try {
        const response = await httpPost(webhookUrl, payload);
        
        return {
          success: response.statusCode === 200,
          statusCode: response.statusCode,
          message: response.statusCode === 200 
            ? 'Message sent to Slack successfully'
            : `Slack returned status ${response.statusCode}`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  },

  // Discord notification
  discord_notify: {
    name: 'discord_notify',
    description: 'Send notification to Discord via webhook',
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', description: 'Discord webhook URL' },
        content: { type: 'string', description: 'Message content' },
        username: { type: 'string', description: 'Bot username' },
        avatarUrl: { type: 'string', description: 'Bot avatar URL' },
        embeds: {
          type: 'array',
          description: 'Discord embed objects',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              color: { type: 'number' },
              fields: { type: 'array' }
            }
          }
        },
        tts: { type: 'boolean', description: 'Text-to-speech' }
      },
      required: ['content']
    },
    handler: async (args) => {
      const config = loadConfig();
      const webhookUrl = args.webhookUrl || config.discordWebhook;
      const content = args.content;
      const username = args.username || 'Windsurf Autopilot';
      const avatarUrl = args.avatarUrl;
      const embeds = args.embeds;
      const tts = args.tts || false;

      if (!webhookUrl) {
        return {
          success: false,
          error: 'No webhook URL provided'
        };
      }

      // Save webhook for future use
      if (args.webhookUrl && args.webhookUrl !== config.discordWebhook) {
        config.discordWebhook = args.webhookUrl;
        saveConfig(config);
      }

      const payload = {
        content,
        username,
        tts
      };

      if (avatarUrl) payload.avatar_url = avatarUrl;
      if (embeds) payload.embeds = embeds;

      try {
        const response = await httpPost(webhookUrl, payload);
        
        return {
          success: response.statusCode >= 200 && response.statusCode < 300,
          statusCode: response.statusCode,
          message: response.statusCode >= 200 && response.statusCode < 300
            ? 'Message sent to Discord successfully'
            : `Discord returned status ${response.statusCode}`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  },

  // Microsoft Teams notification
  teams_notify: {
    name: 'teams_notify',
    description: 'Send notification to Microsoft Teams via webhook',
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: { type: 'string', description: 'Teams webhook URL' },
        title: { type: 'string', description: 'Card title' },
        text: { type: 'string', description: 'Card text' },
        themeColor: { type: 'string', description: 'Theme color hex' },
        sections: {
          type: 'array',
          description: 'Message card sections'
        },
        potentialAction: {
          type: 'array',
          description: 'Action buttons'
        }
      },
      required: ['text']
    },
    handler: async (args) => {
      const config = loadConfig();
      const webhookUrl = args.webhookUrl || config.teamsWebhook;
      const title = args.title || 'Windsurf Autopilot Notification';
      const text = args.text;
      const themeColor = args.themeColor || '0076D7';
      const sections = args.sections;
      const potentialAction = args.potentialAction;

      if (!webhookUrl) {
        return {
          success: false,
          error: 'No webhook URL provided'
        };
      }

      // Save webhook
      if (args.webhookUrl && args.webhookUrl !== config.teamsWebhook) {
        config.teamsWebhook = args.webhookUrl;
        saveConfig(config);
      }

      // MessageCard format
      const payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor,
        summary: title,
        title,
        text
      };

      if (sections) payload.sections = sections;
      if (potentialAction) payload.potentialAction = potentialAction;

      try {
        const response = await httpPost(webhookUrl, payload);
        
        return {
          success: response.statusCode === 200,
          statusCode: response.statusCode,
          message: response.statusCode === 200
            ? 'Message sent to Teams successfully'
            : `Teams returned status ${response.statusCode}`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  },

  // Email notification
  email_send: {
    name: 'email_send',
    description: 'Send email via SMTP or SendGrid',
    inputSchema: {
      type: 'object',
      properties: {
        provider: { 
          type: 'string', 
          enum: ['smtp', 'sendgrid'],
          description: 'Email provider'
        },
        to: { type: 'string', description: 'Recipient email' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body (text or HTML)' },
        html: { type: 'boolean', description: 'Body is HTML' },
        from: { type: 'string', description: 'Sender email' },
        // SMTP config
        smtpHost: { type: 'string' },
        smtpPort: { type: 'number' },
        smtpUser: { type: 'string' },
        smtpPass: { type: 'string' },
        // SendGrid config
        sendgridApiKey: { type: 'string' }
      },
      required: ['to', 'subject', 'body']
    },
    handler: async (args) => {
      const provider = args.provider || 'sendgrid';
      const to = args.to;
      const subject = args.subject;
      const body = args.body;
      const isHtml = args.html || body.includes('<');
      const from = args.from || 'autopilot@windsurf.dev';

      const config = loadConfig();

      if (provider === 'sendgrid') {
        const apiKey = args.sendgridApiKey || config.sendgridApiKey;
        
        if (!apiKey) {
          return {
            success: false,
            error: 'SendGrid API key not provided',
            hint: 'Get API key from https://sendgrid.com'
          };
        }

        // Save API key
        if (args.sendgridApiKey && args.sendgridApiKey !== config.sendgridApiKey) {
          config.sendgridApiKey = args.sendgridApiKey;
          saveConfig(config);
        }

        const payload = {
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from },
          subject,
          content: [{
            type: isHtml ? 'text/html' : 'text/plain',
            value: body
          }]
        };

        try {
          const response = await httpPost(
            'https://api.sendgrid.com/v3/mail/send',
            payload,
            { 'Authorization': `Bearer ${apiKey}` }
          );

          return {
            success: response.statusCode === 202,
            statusCode: response.statusCode,
            message: response.statusCode === 202
              ? `Email sent to ${to}`
              : `SendGrid returned status ${response.statusCode}`
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      } else {
        // SMTP
        return {
          success: false,
          error: 'SMTP support requires nodemailer',
          hint: 'Install nodemailer: npm install nodemailer',
          command: `
// Example with nodemailer:
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: '${args.smtpHost || 'smtp.example.com'}',
  port: ${args.smtpPort || 587},
  auth: { user: '${args.smtpUser || 'user'}', pass: '***' }
});
await transporter.sendMail({
  from: '${from}',
  to: '${to}',
  subject: '${subject}',
  ${isHtml ? 'html' : 'text'}: body
});
`
        };
      }
    }
  },

  // SMS notification
  sms_send: {
    name: 'sms_send',
    description: 'Send SMS via Twilio',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Phone number (E.164 format)' },
        message: { type: 'string', description: 'SMS message' },
        from: { type: 'string', description: 'Twilio phone number' },
        accountSid: { type: 'string', description: 'Twilio Account SID' },
        authToken: { type: 'string', description: 'Twilio Auth Token' }
      },
      required: ['to', 'message']
    },
    handler: async (args) => {
      const to = args.to;
      const message = args.message;
      const config = loadConfig();
      
      const from = args.from || config.twilioFrom;
      const accountSid = args.accountSid || config.twilioAccountSid;
      const authToken = args.authToken || config.twilioAuthToken;

      if (!accountSid || !authToken) {
        return {
          success: false,
          error: 'Twilio credentials not provided',
          hint: 'Get credentials from https://twilio.com/console'
        };
      }

      if (!from) {
        return {
          success: false,
          error: 'Twilio phone number (from) not provided'
        };
      }

      // Save config
      if (args.accountSid) config.twilioAccountSid = args.accountSid;
      if (args.authToken) config.twilioAuthToken = args.authToken;
      if (args.from) config.twilioFrom = args.from;
      saveConfig(config);

      // Twilio API
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const formData = new URLSearchParams({
        To: to,
        From: from,
        Body: message
      });

      return new Promise((resolve) => {
        const urlObj = new URL(url);
        const req = https.request({
          hostname: urlObj.hostname,
          path: urlObj.pathname,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              resolve({
                success: res.statusCode === 201,
                statusCode: res.statusCode,
                sid: data.sid,
                message: res.statusCode === 201
                  ? `SMS sent to ${to}`
                  : data.message || `Twilio returned status ${res.statusCode}`
              });
            } catch {
              resolve({
                success: false,
                error: 'Failed to parse response'
              });
            }
          });
        });

        req.on('error', (error) => {
          resolve({ success: false, error: error.message });
        });

        req.write(formData.toString());
        req.end();
      });
    }
  }
};

module.exports = commsTools;
