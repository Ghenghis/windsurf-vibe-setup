# 🚨 CLAUDE SUBSCRIPTION SETUP - NO API KEYS ALLOWED! 🚨

## ⚠️ CRITICAL: This System ONLY Uses Claude Subscription!

**We BLOCK all API keys!** This system is designed to use ONLY your $20/month Claude subscription, saving you THOUSANDS in API charges!

---

## 💰 Why Subscription Only?

### ❌ NEVER Use API Keys (Expensive!)

- API keys charge PER TOKEN
- A 24-hour session can cost $500-$5000
- You pay for EVERY request
- Costs add up FAST

### ✅ ALWAYS Use Claude Subscription (Cheap!)

- Fixed $20/month
- UNLIMITED usage within fair use
- Run for 24-48 hours for same $20
- Save $480-$4980 per project!

---

## 🚀 Setup Instructions (Cole Medin Method)

### Step 1: Get Claude Pro Subscription

1. **Sign up for Claude Pro** (if you haven't already):
   ```
   https://claude.ai/subscribe
   ```
   - Costs: $20/month
   - Gives you UNLIMITED Claude usage
   - No per-token charges!

### Step 2: Install Claude CLI

```bash
# Install the Claude CLI tool
npm install -g @anthropic-ai/claude-cli
```

### Step 3: Get Your Subscription Token

```bash
# Run this command
claude setup-token
```

This will:

1. Open your browser
2. Ask you to log in to Claude
3. Generate a token for your subscription
4. Display the token in terminal

### Step 4: Save Token to .env File

```bash
# Edit the .env file
nano .env

# Add this line (replace YOUR_TOKEN with actual token):
CLAUDE_TOKEN=YOUR_TOKEN_HERE

# Save and exit
```

### Step 5: Verify Setup

```bash
# Run verification
node -e "
const token = process.env.CLAUDE_TOKEN;
if (!token) {
  console.log('❌ Token not found!');
} else if (process.env.ANTHROPIC_API_KEY) {
  console.log('❌ ERROR: API key found! Remove it!');
} else {
  console.log('✅ Setup complete! Using subscription.');
}
"
```

---

## 🛡️ Security Features

### Automatic API Key Blocking

The system automatically BLOCKS these environment variables:

- ❌ `ANTHROPIC_API_KEY`
- ❌ `OPENAI_API_KEY`
- ❌ `CLAUDE_API_KEY`
- ❌ `API_KEY`

If ANY of these are found, the system will:

1. **REFUSE to start**
2. Show an error message
3. Tell you to remove the API key
4. Guide you to use subscription instead

### What Happens If You Try to Use API Keys?

```
❌ ERROR: API keys are NOT allowed!
Found ANTHROPIC_API_KEY in environment.
This system ONLY uses Claude subscription ($20/month).
Remove all API keys and use: claude setup-token
```

---

## 📝 Complete Setup Script

For convenience, here's a one-liner that does everything:

```bash
# Run this complete setup
curl -fsSL https://raw.githubusercontent.com/Ghenghis/windsurf-vibe-setup/main/setup-subscription.sh | bash
```

Or manually:

```bash
#!/bin/bash
# setup-subscription.sh

echo "🎯 Setting up Claude SUBSCRIPTION (No API keys!)"

# Check for blocked API keys
if [ ! -z "$ANTHROPIC_API_KEY" ] || [ ! -z "$OPENAI_API_KEY" ]; then
    echo "❌ ERROR: API keys detected! Remove them first!"
    echo "Run: unset ANTHROPIC_API_KEY OPENAI_API_KEY"
    exit 1
fi

# Install Claude CLI
echo "📦 Installing Claude CLI..."
npm install -g @anthropic-ai/claude-cli

# Get token
echo "🔑 Getting subscription token..."
claude setup-token

# Prompt to save
echo "
Now add to your .env file:
CLAUDE_TOKEN=<your_token_here>

Do NOT add any API keys!
"

echo "✅ Setup complete! You're using subscription ($20/month)!"
```

---

## 🚫 What NOT to Do

### NEVER Do This:

```bash
# ❌ WRONG - This will be BLOCKED!
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# ❌ WRONG - This costs money per token!
ANTHROPIC_API_KEY=sk-ant-xxxxx npm start

# ❌ WRONG - Any API key will be rejected!
echo "ANTHROPIC_API_KEY=sk-ant-xxx" >> .env
```

### ALWAYS Do This:

```bash
# ✅ CORRECT - Use subscription token
export CLAUDE_TOKEN=your-subscription-token

# ✅ CORRECT - This uses your $20/month subscription
CLAUDE_TOKEN=your-token npm start

# ✅ CORRECT - Save subscription token
echo "CLAUDE_TOKEN=your-token" >> .env
```

---

## 🎯 Quick Troubleshooting

| Problem                  | Solution                                              |
| ------------------------ | ----------------------------------------------------- |
| "API key detected" error | Remove ALL API keys from .env and environment         |
| "Token not found" error  | Run `claude setup-token` again                        |
| "Claude CLI not found"   | Install it: `npm install -g @anthropic-ai/claude-cli` |
| "Unauthorized" error     | Your subscription expired, renew at claude.ai         |
| Still using API credits  | You have an API key somewhere - find and remove it!   |

---

## 💡 Pro Tips

1. **Check your setup regularly:**

   ```bash
   # This should show NO API keys
   env | grep API_KEY

   # This should show your token
   echo $CLAUDE_TOKEN
   ```

2. **Monitor usage:**

   - Go to https://claude.ai/settings
   - Check your subscription is active
   - No per-token charges should appear!

3. **Never share your token:**
   - Treat it like a password
   - Don't commit to git
   - Keep .env in .gitignore

---

## ✨ Benefits of Subscription-Only

| Feature             | API Keys    | Subscription |
| ------------------- | ----------- | ------------ |
| **Monthly Cost**    | $500-$5000+ | $20 flat     |
| **24-hour session** | $500+       | $0 extra     |
| **48-hour session** | $1000+      | $0 extra     |
| **Usage anxiety**   | High        | None         |
| **Bill surprises**  | Common      | Never        |
| **Rate limits**     | Strict      | Generous     |

---

## 🎉 You're All Set!

Once configured with your Claude subscription token:

- ✅ Run unlimited 24-48 hour sessions
- ✅ Build complex projects for $20/month
- ✅ Never worry about token costs
- ✅ Full automation without budget anxiety

**Remember: This system will NEVER accept API keys - only subscriptions!**

---

## 📚 References

- Cole Medin's Tutorial: https://youtube.com/watch?v=usQ2HBTTWxs
- Claude Subscription: https://claude.ai/subscribe
- Anthropic Article: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

---

# 🚀 Start Building for $20/month, Not $5000!
