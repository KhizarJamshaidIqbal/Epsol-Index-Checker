# PostgreSQL MCP Server Setup

## Problem
The PostgreSQL MCP server is showing an "Error" status in Windsurf because it's not properly configured with your database connection.

## Solution: Configure PostgreSQL MCP Server

### Step 1: Open MCP Settings

1. Click on the **Settings** icon (⚙️) in the MCP Marketplace
2. Or go to: **File** → **Preferences** → **Settings** → Search for "MCP"

### Step 2: Configure PostgreSQL MCP

Add your database connection string to the PostgreSQL MCP configuration:

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://epsol_user:epsol_password@786@69.57.161.70:5432/epsol_indexing"
      ]
    }
  }
}
```

### Step 3: Alternative Configuration

If the above doesn't work, try this format:

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "uvx",
      "args": [
        "mcp-server-postgres",
        "--connection-string",
        "postgresql://epsol_user:epsol_password@786@69.57.161.70:5432/epsol_indexing"
      ]
    }
  }
}
```

### Step 4: Using Environment Variable

**Recommended Approach** - Use environment variable for security:

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres"
      ],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://epsol_user:epsol_password@786@69.57.161.70:5432/epsol_indexing"
      }
    }
  }
}
```

### Step 5: Reload MCP

After configuration:
1. Click the **Refresh** icon (🔄) in MCP Marketplace
2. Or restart Windsurf
3. The PostgreSQL MCP should now show **"Enabled"** status

---

## Your Database Connection Details

```
Host: 69.57.161.70
Port: 5432
Database: epsol_indexing
User: epsol_user
Password: epsol_password@786
```

**Connection String:**
```
postgresql://epsol_user:epsol_password%40786@69.57.161.70:5432/epsol_indexing
```

Note: `%40` is the URL-encoded version of `@` in the password.

---

## Troubleshooting

### Error: "Connection refused"

**Check if PostgreSQL server is accessible:**

```powershell
Test-NetConnection -ComputerName 69.57.161.70 -Port 5432
```

If it fails:
- ❌ Port 5432 might be blocked by firewall
- ❌ PostgreSQL server might be down
- ❌ Your IP might not be whitelisted

**Solution:**
1. Contact your database administrator
2. Check firewall rules
3. Verify PostgreSQL is running
4. Ensure your IP is allowed to connect

### Error: "Authentication failed"

**Verify credentials:**
- Username: `epsol_user`
- Password: `epsol_password@786`
- Database: `epsol_indexing`

### Error: "Database does not exist"

**Verify database name:**
```sql
-- Connect to PostgreSQL and check
\l
-- Should show epsol_indexing database
```

---

## What MCP Server Provides

Once configured, the PostgreSQL MCP server gives you:

✅ **Database Schema Inspection** - View tables, columns, types  
✅ **Read-Only Queries** - Execute SELECT queries safely  
✅ **Table Information** - See indexes, constraints, relationships  
✅ **Data Preview** - View sample data from tables  

**Note:** MCP server is READ-ONLY for safety. It cannot modify data.

---

## Alternative: Prisma Studio

If you prefer a visual database browser, use Prisma Studio:

```bash
npx prisma studio
```

This will open at: http://localhost:5555

---

## Quick Setup Commands

**1. Install MCP Server Package (if needed):**
```bash
npm install -g @modelcontextprotocol/server-postgres
```

**2. Test Database Connection:**
```bash
psql "postgresql://epsol_user:epsol_password@786@69.57.161.70:5432/epsol_indexing"
```

**3. Restart Windsurf** after configuration

---

## Configuration File Location

MCP settings are typically stored in:

**Windows:**
```
%APPDATA%\Windsurf\User\settings.json
```

**Or in Windsurf workspace settings:**
```
.vscode/settings.json
```

Add the `mcpServers` configuration to this file.

---

## Example Complete Configuration

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://epsol_user:epsol_password%40786@69.57.161.70:5432/epsol_indexing"
      ]
    },
    "prisma": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-prisma"
      ]
    }
  }
}
```

---

## Security Best Practices

🔒 **Never commit database credentials to Git!**

Use environment variables:

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${env:DATABASE_URL}"
      }
    }
  }
}
```

Then set in your environment:
```powershell
$env:DATABASE_URL = "postgresql://epsol_user:epsol_password@786@69.57.161.70:5432/epsol_indexing"
```

---

## Summary

1. ⚙️ Open MCP settings in Windsurf
2. 📝 Add PostgreSQL configuration with your connection string
3. 🔄 Reload/restart Windsurf
4. ✅ PostgreSQL MCP should show "Enabled"

**Need Help?** Check the MCP Marketplace logs for specific error messages.
