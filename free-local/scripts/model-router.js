#!/usr/bin/env node
/**
 * Smart Model Router
 * ==================
 * Uses heuristics to route requests to the optimal local model
 * based on task complexity, context length, and available resources.
 */

const http = require('http');

// Model configurations with capabilities
const MODELS = {
  'qwen2.5-coder:32b': {
    vramRequired: 20000, // MB
    maxContext: 32768,
    strengths: ['code', 'refactor', 'debug', 'explain', 'review'],
    speed: 'medium',
    quality: 'high'
  },
  'deepseek-coder-v2:16b': {
    vramRequired: 10000,
    maxContext: 16384,
    strengths: ['code', 'quick', 'chat', 'simple'],
    speed: 'fast',
    quality: 'good'
  },
  'llama3.1:70b': {
    vramRequired: 24000,
    maxContext: 131072,
    strengths: ['reasoning', 'analysis', 'complex', 'longform'],
    speed: 'slow',
    quality: 'highest'
  },
  'starcoder2:3b': {
    vramRequired: 2000,
    maxContext: 4096,
    strengths: ['autocomplete', 'inline', 'snippet'],
    speed: 'fastest',
    quality: 'basic'
  },
  'nomic-embed-text': {
    vramRequired: 500,
    maxContext: 8192,
    strengths: ['embedding', 'rag', 'similarity'],
    speed: 'fastest',
    quality: 'specialized'
  },
  'mixtral:8x7b': {
    vramRequired: 16000,
    maxContext: 32768,
    strengths: ['general', 'multilingual', 'balanced'],
    speed: 'medium',
    quality: 'high'
  }
};

// Task type keywords
const TASK_KEYWORDS = {
  code: ['code', 'function', 'class', 'implement', 'write', 'create', 'build'],
  refactor: ['refactor', 'optimize', 'clean', 'improve', 'restructure'],
  debug: ['debug', 'fix', 'error', 'bug', 'issue', 'broken', 'wrong'],
  explain: ['explain', 'what', 'how', 'why', 'understand', 'teach'],
  review: ['review', 'check', 'audit', 'security', 'best practice'],
  quick: ['quick', 'fast', 'simple', 'short', 'brief'],
  reasoning: ['analyze', 'compare', 'design', 'architect', 'plan', 'complex'],
  autocomplete: ['complete', 'suggest', 'next', 'continue', 'finish'],
  embedding: ['embed', 'vector', 'similar', 'search', 'rag', 'retrieve']
};

/**
 * Detect task type from prompt
 */
function detectTaskType(prompt) {
  const lower = prompt.toLowerCase();
  const scores = {};
  
  for (const [taskType, keywords] of Object.entries(TASK_KEYWORDS)) {
    scores[taskType] = keywords.filter(kw => lower.includes(kw)).length;
  }
  
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : 'code';
}

/**
 * Estimate context/prompt length
 */
function estimateTokens(text) {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}

/**
 * Select optimal model
 */
function selectModel(prompt, options = {}) {
  const taskType = options.taskType || detectTaskType(prompt);
  const estimatedTokens = estimateTokens(prompt);
  const preferSpeed = options.preferSpeed || false;
  const availableVram = options.availableVram || 24000;
  
  // Filter models by VRAM availability
  const availableModels = Object.entries(MODELS)
    .filter(([_, config]) => config.vramRequired <= availableVram);
  
  // Score each model
  const scored = availableModels.map(([name, config]) => {
    let score = 0;
    
    // Task match bonus
    if (config.strengths.includes(taskType)) score += 50;
    
    // Quality bonus
    if (config.quality === 'highest') score += 30;
    else if (config.quality === 'high') score += 20;
    else if (config.quality === 'good') score += 10;
    
    // Speed bonus (if preferred)
    if (preferSpeed) {
      if (config.speed === 'fastest') score += 30;
      else if (config.speed === 'fast') score += 20;
    }
    
    // Context length check
    if (estimatedTokens > config.maxContext * 0.8) score -= 50;
    
    // Penalize overkill for simple tasks
    if (['quick', 'autocomplete'].includes(taskType) && config.vramRequired > 15000) {
      score -= 20;
    }
    
    return { name, score, config };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return {
    recommended: scored[0].name,
    taskType,
    estimatedTokens,
    alternatives: scored.slice(1, 3).map(s => s.name),
    reasoning: `Selected ${scored[0].name} for ${taskType} task (score: ${scored[0].score})`
  };
}

/**
 * Create a proxy server that auto-routes to optimal model
 */
function startProxyServer(port = 11435) {
  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'Model Router Proxy', port }));
      return;
    }
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const selection = selectModel(data.prompt || data.messages?.[0]?.content || '');
        
        // Override model with selection
        data.model = selection.recommended;
        
        // Forward to Ollama
        const ollamaReq = http.request({
          hostname: 'localhost',
          port: 11434,
          path: req.url,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, (ollamaRes) => {
          res.writeHead(ollamaRes.statusCode, ollamaRes.headers);
          ollamaRes.pipe(res);
        });
        
        ollamaReq.write(JSON.stringify(data));
        ollamaReq.end();
        
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  });
  
  server.listen(port, () => {
    console.log(`Model Router running on http://localhost:${port}`);
    console.log('Proxying to Ollama with smart model selection');
  });
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'serve') {
    startProxyServer(args[1] || 11435);
  } else if (args[0] === 'select') {
    const prompt = args.slice(1).join(' ') || 'Write a function';
    console.log(JSON.stringify(selectModel(prompt), null, 2));
  } else {
    console.log(`
Smart Model Router
==================

Usage:
  node model-router.js serve [port]    Start proxy server (default: 11435)
  node model-router.js select <prompt> Get model recommendation for prompt

Example:
  node model-router.js select "Write a React component for user login"
  node model-router.js serve 11435
`);
  }
}

module.exports = { selectModel, detectTaskType, MODELS };
