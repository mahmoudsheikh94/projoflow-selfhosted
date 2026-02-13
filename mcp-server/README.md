# ProjoFlow MCP Server

Connect your AI assistant (Claude Code, Cursor, Windsurf, etc.) directly to your ProjoFlow project management instance.

**The only project management tool your AI can talk to.™**

## Features

18 powerful tools for AI-powered project management:

| Category | Tools |
|----------|-------|
| **Projects** | `list_projects`, `get_project`, `create_project`, `update_project`, `get_project_summary` |
| **Tasks** | `list_tasks`, `create_task`, `update_task` |
| **Time Tracking** | `log_time`, `get_time_entries` |
| **Clients** | `list_clients`, `create_client` |
| **Leads** | `list_leads`, `update_lead` |
| **Notes** | `add_note` |
| **Comments** | `list_task_comments`, `add_task_comment` |
| **Dashboard** | `get_dashboard` |

## Quick Start

### 1. Create an MCP User in ProjoFlow

In your ProjoFlow instance, create a user account for the MCP server:
- Email: `mcp@your-domain.com` (or any email)
- Password: Generate a secure password
- Role: Admin (for full access) or restricted as needed

### 2. Get Your Supabase Credentials

From your Supabase project dashboard:
- **Project URL**: `https://your-project-id.supabase.co`
- **Anon Key**: Found in Settings → API → Project API keys

### 3. Configure Claude Code Desktop

Add to your `claude_desktop_config.json`:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "projoflow": {
      "command": "node",
      "args": ["/path/to/projoflow/mcp-server/index.js"],
      "env": {
        "PROJOFLOW_SUPABASE_URL": "https://your-project.supabase.co",
        "PROJOFLOW_SUPABASE_ANON_KEY": "your-anon-key",
        "PROJOFLOW_MCP_EMAIL": "mcp@your-domain.com",
        "PROJOFLOW_MCP_PASSWORD": "your-secure-password"
      }
    }
  }
}
```

### 4. Restart Claude Code

Restart Claude Code Desktop to load the MCP server.

## Usage Examples

Once connected, your AI assistant can:

**List active projects:**
> "Show me all active projects"

**Create a task:**
> "Create a task 'Fix login bug' in the Website Redesign project with high priority"

**Log time:**
> "Log 2 hours on the API Integration project for database optimization"

**Get dashboard:**
> "What's my dashboard looking like? Show me active projects and upcoming tasks"

**Project summary:**
> "Give me a summary of the Mobile App project including tasks and time spent"

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PROJOFLOW_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `PROJOFLOW_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `PROJOFLOW_MCP_EMAIL` | ✅ | MCP service account email |
| `PROJOFLOW_MCP_PASSWORD` | ✅ | MCP service account password |

## Alternative: Global npm Install

```bash
# From the mcp-server directory
npm install -g .

# Then in your config, use:
{
  "mcpServers": {
    "projoflow": {
      "command": "projoflow-mcp",
      "env": {
        "PROJOFLOW_SUPABASE_URL": "...",
        "PROJOFLOW_SUPABASE_ANON_KEY": "...",
        "PROJOFLOW_MCP_EMAIL": "...",
        "PROJOFLOW_MCP_PASSWORD": "..."
      }
    }
  }
}
```

## Cursor IDE Setup

Add to your Cursor settings (`.cursor/settings.json`):

```json
{
  "mcpServers": {
    "projoflow": {
      "command": "node",
      "args": ["/path/to/projoflow/mcp-server/index.js"],
      "env": {
        "PROJOFLOW_SUPABASE_URL": "https://your-project.supabase.co",
        "PROJOFLOW_SUPABASE_ANON_KEY": "your-anon-key",
        "PROJOFLOW_MCP_EMAIL": "mcp@your-domain.com",
        "PROJOFLOW_MCP_PASSWORD": "your-secure-password"
      }
    }
  }
}
```

## Security Notes

- The MCP user should have appropriate permissions in your ProjoFlow instance
- Store credentials securely; don't commit config files with real credentials
- Consider creating a dedicated MCP user with limited permissions
- The anon key is safe to use (it's a public key); authentication is handled via user login

## Troubleshooting

**"Authentication failed"**
- Verify the email/password are correct
- Check the user exists in your ProjoFlow instance
- Ensure the user has confirmed their email

**"Missing environment variables"**
- All 4 environment variables are required
- Check for typos in variable names

**"Connection refused"**
- Verify your Supabase URL is correct
- Check your internet connection
- Ensure Supabase project is active

## Support

For issues with the MCP server, check:
1. ProjoFlow documentation
2. Claude Code MCP documentation
3. Supabase connection guides

---

**ProjoFlow** - Project management built for the AI age 🚀
