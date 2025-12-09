# MCP Server Development Rules

## Project Type

This is a Model Context Protocol (MCP) server implementation.

## Tech Stack

- Node.js 18+ or Python 3.10+
- MCP SDK (@modelcontextprotocol/sdk)
- TypeScript (preferred for Node.js)
- JSON-RPC 2.0 protocol

## Code Standards

### File Structure (Node.js)

```
src/
├── index.ts           # Entry point
├── server.ts          # MCP server setup
├── tools/             # Tool implementations
│   ├── index.ts       # Tool registry
│   └── *.ts           # Individual tools
├── resources/         # Resource providers
├── prompts/           # Prompt templates
└── utils/             # Helpers
```

### MCP Concepts

- **Tools**: Functions the AI can call
- **Resources**: Data the AI can read
- **Prompts**: Reusable prompt templates

### Tool Implementation

```typescript
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'my_tool':
      return {
        content: [{ type: 'text', text: result }],
      };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});
```

## Best Practices

- Validate all tool inputs
- Return structured, parseable output
- Handle errors gracefully with clear messages
- Log tool invocations for debugging
- Keep tools focused and single-purpose
- Document tool parameters clearly

## Security

- Never expose sensitive data
- Validate and sanitize all inputs
- Use least privilege for file access
- Don't execute arbitrary code
- Rate limit expensive operations

## Testing

- Test each tool independently
- Test error handling paths
- Verify output format is correct
- Test with actual MCP client

## Don't Do

- No blocking operations without timeout
- No unbounded loops
- No hardcoded credentials
- No filesystem access outside allowed paths
- No network requests without validation
