# 🖥️ Open Interpreter Integration Guide

> **Full Computer Control for Autonomous Vibe Coding**

---

<div align="center">

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    OPEN INTERPRETER + HIVE MIND                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 ║
║    │ 🧠 Hive Mind │───▶│ 🖥️ Open     │───▶│ 💻 Computer │                 ║
║    │  Controller  │    │ Interpreter │    │  Control    │                 ║
║    └─────────────┘    └─────────────┘    └─────────────┘                 ║
║           │                  │                   │                        ║
║           ▼                  ▼                   ▼                        ║
║    ┌─────────────────────────────────────────────────────┐               ║
║    │  Code Exec  │  File Ops  │  Browser  │  Terminal   │               ║
║    └─────────────────────────────────────────────────────┘               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

</div>

---

## 🌟 Overview

**Open Interpreter** integration enables the Hive Mind to interact directly with your computer, executing code, managing files, browsing the web, and controlling applications. This creates a truly autonomous development environment where AI agents can perform any task a human developer could.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| 💻 **Code Execution** | Run Python, JavaScript, shell commands in real-time |
| 📁 **File Operations** | Create, edit, move, delete files and directories |
| 🌐 **Browser Control** | Navigate web, fill forms, scrape data |
| 🖥️ **Computer Control** | Mouse, keyboard, screen capture |
| 🔄 **Workflow Automation** | Chain operations into complex workflows |

---

## 🚀 Installation

### Prerequisites

```bash
# Python 3.10+ required
python --version

# Install Open Interpreter
pip install open-interpreter

# Verify installation
interpreter --version
```

### Docker Setup (Recommended for Safety)

```yaml
# docker-compose-open-interpreter.yml
version: '3.8'

services:
  open-interpreter:
    image: openinterpreter/open-interpreter:latest
    container_name: oi-sandbox
    volumes:
      - ./workspace:/workspace
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - OI_SAFE_MODE=true
      - OI_LOCAL_MODEL=true
    ports:
      - "8765:8765"
    deploy:
      resources:
        limits:
          memory: 16G
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

### Integration with Hive Mind

```javascript
// mcp-server/src/open-interpreter/oi-bridge.js
const { spawn } = require('child_process');
const WebSocket = require('ws');

class OpenInterpreterBridge {
  constructor(config) {
    this.config = config;
    this.process = null;
    this.ws = null;
  }
  
  async start() {
    // Start OI in server mode
    this.process = spawn('interpreter', [
      '--server',
      '--port', '8765',
      '--model', this.config.model || 'local'
    ]);
    
    // Connect via WebSocket
    this.ws = new WebSocket('ws://localhost:8765');
    
    await this.waitForReady();
    console.log('Open Interpreter bridge ready');
  }
  
  async execute(code, language = 'python') {
    return new Promise((resolve, reject) => {
      this.ws.send(JSON.stringify({
        type: 'execute',
        code,
        language
      }));
      
      this.ws.once('message', (data) => {
        const result = JSON.parse(data);
        if (result.error) reject(result.error);
        else resolve(result.output);
      });
    });
  }
}
```

---

## 🛠️ MCP Tools

### Code Execution Tools

| Tool | Description | Example |
|------|-------------|---------|
| `oi_execute` | Execute code snippet | `oi_execute({ code: "print('hello')", lang: "python" })` |
| `oi_shell` | Run shell command | `oi_shell({ command: "ls -la" })` |
| `oi_script` | Run script file | `oi_script({ path: "./setup.py" })` |
| `oi_repl` | Interactive REPL | `oi_repl({ language: "python" })` |

### File Operation Tools

| Tool | Description | Example |
|------|-------------|---------|
| `oi_read` | Read file contents | `oi_read({ path: "./config.json" })` |
| `oi_write` | Write to file | `oi_write({ path: "./out.txt", content: "..." })` |
| `oi_edit` | Edit file in-place | `oi_edit({ path: "./src/app.js", changes: [...] })` |
| `oi_tree` | Directory tree | `oi_tree({ path: "./", depth: 3 })` |

### Browser Control Tools

| Tool | Description | Example |
|------|-------------|---------|
| `oi_browse` | Open URL | `oi_browse({ url: "https://github.com" })` |
| `oi_scrape` | Extract page data | `oi_scrape({ url: "...", selector: ".content" })` |
| `oi_click` | Click element | `oi_click({ selector: "#submit-btn" })` |
| `oi_fill` | Fill form field | `oi_fill({ selector: "#email", value: "..." })` |

### Computer Control Tools

| Tool | Description | Example |
|------|-------------|---------|
| `oi_screenshot` | Capture screen | `oi_screenshot({ region: "full" })` |
| `oi_click_pos` | Click coordinates | `oi_click_pos({ x: 100, y: 200 })` |
| `oi_type` | Type text | `oi_type({ text: "Hello World" })` |
| `oi_hotkey` | Send hotkey | `oi_hotkey({ keys: ["ctrl", "s"] })` |

---

## 🔄 Workflow Examples

### Example 1: Automated Project Setup

```python
# Create a new Next.js project with full configuration
workflow = """
1. Create project directory
2. Initialize Next.js with TypeScript
3. Install dependencies (tailwind, prisma, next-auth)
4. Setup database schema
5. Create initial components
6. Configure environment
7. Run initial tests
8. Start development server
"""

await oi.execute(f"""
# Step 1: Create project
import os
os.makedirs('my-app', exist_ok=True)
os.chdir('my-app')

# Step 2: Initialize Next.js
!npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Step 3: Install additional deps
!npm install prisma @prisma/client next-auth @tanstack/react-query

# Step 4: Initialize Prisma
!npx prisma init

# Step 5: Create basic schema
with open('prisma/schema.prisma', 'w') as f:
    f.write('''
    datasource db {{
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }}
    
    generator client {{
      provider = "prisma-client-js"
    }}
    
    model User {{
      id        String   @id @default(cuid())
      email     String   @unique
      name      String?
      createdAt DateTime @default(now())
    }}
    ''')

# Step 6: Generate Prisma client
!npx prisma generate

print("✅ Project setup complete!")
""")
```

### Example 2: Automated Bug Fix

```python
# Agent detects bug and fixes it automatically
async def auto_fix_bug(error_log, file_path):
    # Analyze error
    analysis = await oi.execute(f"""
    error = '''{error_log}'''
    
    # Parse error to understand issue
    import re
    line_match = re.search(r'line (\\d+)', error)
    line_num = int(line_match.group(1)) if line_match else None
    
    # Read the problematic file
    with open('{file_path}', 'r') as f:
        lines = f.readlines()
    
    # Get context around error
    if line_num:
        start = max(0, line_num - 5)
        end = min(len(lines), line_num + 5)
        context = ''.join(lines[start:end])
    
    print(f"Error on line {{line_num}}")
    print(f"Context:\\n{{context}}")
    """)
    
    # Generate fix
    fix = await hiveMind.ask(
        agent="bugfix-expert",
        question=f"Fix this error: {error_log}",
        context=analysis
    )
    
    # Apply fix
    await oi.execute(f"""
    # Apply the fix
    {fix.code}
    
    # Run tests to verify
    !npm test
    
    print("✅ Bug fixed and verified!")
    """)
```

### Example 3: Full Deployment Pipeline

```python
# Complete CI/CD pipeline execution
async def deploy_to_production(project_path):
    await oi.execute(f"""
    import os
    os.chdir('{project_path}')
    
    print("🚀 Starting deployment pipeline...")
    
    # Step 1: Run tests
    print("\\n📋 Running tests...")
    !npm test
    
    # Step 2: Build
    print("\\n🔨 Building project...")
    !npm run build
    
    # Step 3: Security scan
    print("\\n🔒 Running security audit...")
    !npm audit
    
    # Step 4: Docker build
    print("\\n🐳 Building Docker image...")
    !docker build -t myapp:latest .
    
    # Step 5: Push to registry
    print("\\n📤 Pushing to registry...")
    !docker push myregistry.com/myapp:latest
    
    # Step 6: Deploy to Kubernetes
    print("\\n☸️ Deploying to Kubernetes...")
    !kubectl apply -f k8s/deployment.yaml
    
    # Step 7: Verify deployment
    print("\\n✅ Verifying deployment...")
    !kubectl rollout status deployment/myapp
    
    print("\\n🎉 Deployment complete!")
    """)
```

---

## ⚙️ Configuration

### open-interpreter-config.yaml

```yaml
openInterpreter:
  # Execution settings
  execution:
    safeMode: true           # Require confirmation for dangerous ops
    autoRun: true            # Auto-run code without confirmation
    maxRuntime: 300          # Max seconds per execution
    sandboxed: true          # Run in Docker sandbox
    
  # Model settings
  model:
    provider: "ollama"       # ollama | openai | anthropic | lmstudio
    name: "qwen2.5-coder:32b"
    fallback: "llama3.1:8b"
    
  # Computer control
  computerControl:
    enabled: true
    screenshotInterval: 1000  # ms between screenshots
    mouseAcceleration: 1.0
    
  # Browser automation
  browser:
    headless: false
    defaultTimeout: 30000
    userAgent: "Mozilla/5.0..."
    
  # File operations
  files:
    allowedPaths:
      - "./workspace"
      - "./projects"
    blockedPaths:
      - "/etc"
      - "/usr"
    maxFileSize: "100MB"
    
  # Security
  security:
    blockedCommands:
      - "rm -rf /"
      - "format"
      - "del /s"
    requireConfirmation:
      - "DELETE"
      - "DROP"
      - "TRUNCATE"
    auditLog: "./logs/oi-audit.log"
```

---

## 🔒 Security Best Practices

### 1. Sandboxed Execution

Always run Open Interpreter in a Docker container:

```bash
# Start sandboxed OI
docker run -it --rm \
  -v $(pwd)/workspace:/workspace \
  --gpus all \
  openinterpreter/open-interpreter
```

### 2. Permission Scoping

```python
# Only allow specific operations
oi = OpenInterpreter(
    allowed_commands=["npm", "git", "python"],
    blocked_commands=["rm -rf", "sudo", "chmod"],
    allowed_paths=["./workspace"],
    require_confirmation=True
)
```

### 3. Audit Logging

```python
# All actions logged for review
oi.on('execute', lambda cmd: 
    logger.info(f"OI executed: {cmd}")
)
```

### 4. Resource Limits

```yaml
# docker-compose limits
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 16G
    reservations:
      memory: 8G
```

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Permission denied" | Check allowed_paths config |
| "Timeout exceeded" | Increase maxRuntime setting |
| "Model not found" | Verify Ollama is running |
| "Screenshot failed" | Install pyautogui/pillow |

### Debug Mode

```bash
# Enable verbose logging
interpreter --verbose --debug
```

---

## 📊 Integration Status

| Component | Status | Notes |
|-----------|--------|-------|
| Core Integration | ✅ Complete | Bridge and basic tools |
| Code Execution | ✅ Complete | Python, JS, Shell |
| File Operations | ✅ Complete | Full CRUD support |
| Browser Control | 🔄 90% | Selenium integration |
| Computer Control | 🔄 80% | Mouse/keyboard working |
| Security Sandbox | ✅ Complete | Docker isolation |
| Hive Mind Sync | ✅ Complete | Real-time coordination |

---

*Documentation Version: 4.2.0*
*Last Updated: December 8, 2025*
