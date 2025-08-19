# time-mcp

Simple stdio MCP for getting the current time or relative time values

## Installation

### Using with Claude Desktop

Add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "time": {
      "command": "npx",
      "args": ["github:scottoasis/time-mcp"]
    }
  }
}
```

### Local Development

Just run `yarn` to install the dependencies (chrono-node, @modelcontextprotocol/sdk, date-fns).

See .cursor/mcp.json for configuration.
