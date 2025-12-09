# VIBE Environment Configuration Guide

## 🎯 Overview

The VIBE project uses a **hybrid configuration model**:

- **Works 100% FREE** without any API keys using local models
- **Enhanced capabilities** available with optional API keys
- **Complete privacy** - your keys stay local and are never shared

## 📁 Configuration Files

### `.env.example`

- Template showing all available configuration options
- Contains placeholders and documentation
- Safe to commit to repository
- Copy this to `.env.local` to get started

### `.env.local`

- Your private configuration with actual API keys
- **NEVER COMMITTED** - excluded in `.gitignore`
- Contains your personal API tokens and preferences
- Enables enhanced features when keys are present

## 🚀 Quick Start

### For Free Users (No API Keys)

```bash
# 1. Copy the example file
cp .env.example .env.local

# 2. That's it! The system will use local models
# - LM Studio at localhost:1234
# - Ollama at localhost:11434
```

### For Power Users (With API Keys)

```bash
# 1. Copy the example file
cp .env.example .env.local

# 2. Add your API keys to .env.local
# Edit the file and add your keys for:
# - OpenAI, Anthropic, Google AI, xAI
# - GitHub, HuggingFace, etc.
```

## 🔑 Available Services

### Always Free (No Keys Needed)

- **LM Studio** - Local LLM inference
- **Ollama** - Local model serving
- **SQLite** - Local database
- **Git** - Local version control
- **Docker** - Local containers
- **Node.js tools** - npm, ESLint, Prettier, etc.

### Optional Enhancements (With Keys)

| Service      | Environment Variable           | Purpose              |
| ------------ | ------------------------------ | -------------------- |
| OpenAI       | `OPENAI_API_KEY`               | GPT-4, DALL-E access |
| Anthropic    | `ANTHROPIC_API_KEY`            | Claude models        |
| Google AI    | `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini models        |
| xAI          | `XAI_API_KEY`                  | Grok models          |
| GitHub       | `GITHUB_TOKEN`                 | Private repo access  |
| HuggingFace  | `HUGGINGFACE_TOKEN`            | Model downloads      |
| Eleven Labs  | `ELEVENLABS_API_KEY`           | Voice synthesis      |
| Brave Search | `BRAVE_SEARCH_API_KEY`         | Web search           |

## 🎨 How It Works

The system automatically detects available services:

```javascript
// In Multi-Model Orchestration
const models = [];

// Always available (free)
if (process.env.LMSTUDIO_API_BASE_URL) {
  models.push({ type: 'lmstudio', endpoint: process.env.LMSTUDIO_API_BASE_URL });
}

// Enhanced if keys present
if (process.env.OPENAI_API_KEY) {
  models.push({ type: 'openai', key: process.env.OPENAI_API_KEY });
}

// Smart fallback - always works
const result = await orchestrate(task, models);
```

## ⚙️ Configuration Categories

### 🤖 AI Models

```env
# Local (Free)
LMSTUDIO_API_BASE_URL=http://localhost:1234
OLLAMA_API_BASE_URL=http://localhost:11434

# Enhanced (Optional)
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
```

### 💾 Storage

```env
VIBE_DATA_DIR=./vibe-data
STORAGE_PATH=./vibe-data
BACKUP_PATH=./vibe-data/backups
SNAPSHOT_PATH=./vibe-data/snapshots
```

### 🔧 Performance

```env
DEFAULT_NUM_CTX=12288         # Model context size
MAX_MEMORY_MB=16384          # Max memory usage
CACHE_SIZE_MB=2048           # Cache size
MAX_WORKERS=4                # Parallel workers
```

### 📊 Monitoring

```env
LOG_LEVEL=info               # Logging verbosity
ENABLE_METRICS=true          # Performance metrics
TIME_TRAVEL_ENABLED=true     # Debug time-travel
AUTO_BACKUP_ENABLED=true     # Automatic backups
```

### 🌐 Network

```env
VIBE_PORT=5000              # Main API port
WEBSOCKET_PORT=8080         # Real-time sync
WEB_UI_PORT=3000           # Web interface
```

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Rotate API keys regularly** - Update them monthly
3. **Use environment-specific files** - `.env.local`, `.env.production`
4. **Set minimal permissions** - Only enable what you need
5. **Monitor usage** - Check API usage dashboards

## 🚨 Troubleshooting

### System not detecting API keys?

```bash
# Check if .env.local is loaded
node -e "require('dotenv').config({path: '.env.local'}); console.log(process.env.OPENAI_API_KEY ? 'Found' : 'Not found')"
```

### Want to run 100% offline?

```bash
# Simply don't add any API keys
# System will use only local models
```

### Reset to defaults?

```bash
# Copy fresh example
cp .env.example .env.local
```

## 📝 Example Configurations

### Minimal (Free User)

```env
LMSTUDIO_API_BASE_URL=http://localhost:1234
OLLAMA_API_BASE_URL=http://localhost:11434
VIBE_DATA_DIR=./vibe-data
LOG_LEVEL=info
```

### Enhanced (Power User)

```env
# Local models
LMSTUDIO_API_BASE_URL=http://localhost:1234
OLLAMA_API_BASE_URL=http://localhost:11434

# API enhancements
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Advanced features
TIME_TRAVEL_ENABLED=true
AUTO_OPTIMIZE_ENABLED=true
ENABLE_METRICS=true
```

### Development

```env
NODE_ENV=development
DEBUG_MODE=true
LOG_LEVEL=debug
ENABLE_PROFILING=true
```

### Production

```env
NODE_ENV=production
DEBUG_MODE=false
LOG_LEVEL=error
AUTO_BACKUP_ENABLED=true
```

## 🎯 Module-Specific Settings

### Multi-Model Orchestration

- Automatically detects all available models
- Intelligently routes to best available model
- Falls back to local if API fails

### Universal API Connector

- Connects to local APIs first
- Can use authenticated APIs if keys present
- Caches responses for efficiency

### Real-Time Synchronization

- Uses local WebSocket server
- No external sync services needed
- Works on localhost or LAN

### External Tool Integration

- Uses local Git, Docker, npm
- No cloud CI/CD required
- Everything runs on your machine

## 📚 Further Reading

- [VIBE Architecture](./README.vibe)
- [Module Documentation](./docs/modules.md)
- [API Reference](./docs/api.md)
- [Contributing Guide](./CONTRIBUTING.md)
