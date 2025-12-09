# Installation Guide

## Prerequisites

- Node.js v18 or higher
- Git
- 8GB+ RAM
- Optional: GPU for ML acceleration

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/Ghenghis/windsurf-vibe-setup.git
cd windsurf-vibe-setup
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

### 4. Initialize System

```bash
npm run init
```

### 5. Start VIBE

```bash
npm run vibe:start
```

## Optional: ML Setup

### Install ML Dependencies

```bash
npm install @xenova/transformers @huggingface/hub sqlite3
```

### Configure HuggingFace

1. Create account at huggingface.co
2. Generate access token
3. Add to .env.local: `HUGGINGFACE_TOKEN=your_token`

## Verification

Run system check:

```bash
npm run vibe:check
```

Expected output:

- ✅ 50 modules loaded
- ✅ ML system ready
- ✅ HuggingFace connected
- ✅ System operational
