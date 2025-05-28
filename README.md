# Google Search Console MCP Server Setup Guide

## Prerequisites

1. **Google Search Console Access**: You need to have a verified property in Google Search Console
2. **Existing Service Account**: You can reuse your service account from the GA4 MCP project
3. **Google Cloud Project**: Use your existing Google Cloud project

## Step 1: Enable Search Console API (Reusing Existing Setup)

Since you already have a Google Cloud project with a service account from your GA4 MCP:

### 1.1 Enable the Search Console API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project (the one with your GA4 service account)
3. Go to "APIs & Services" > "Library"
4. Search for "Google Search Console API"
5. Click on it and press "Enable"

## Step 2: Grant Search Console Access to Your Existing Service Account

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property/website
3. Go to "Settings" > "Users and permissions"
4. Click "Add user"
5. Enter your service account email (the `client_email` from your existing JSON key file)
6. Set permission level to "Full" or "Restricted" (Restricted is sufficient for read-only access)
7. Click "Add"

**Important**: The `GSC_SITE_URL` must exactly match how your property appears in Search Console:
- For URL prefix properties: `https://example.com/`
- For domain properties: `sc-domain:example.com`

## Step 3: Install the GSC MCP Server

### 3.1 Create Project Directory
```bash
mkdir gsc-mcp-server
cd gsc-mcp-server
```

### 3.2 Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3.3 Install Dependencies
```bash
pip install fastmcp google-api-python-client google-auth google-auth-oauthlib google-auth-httplib2
```

### 3.4 Create Project Files
Save the provided files in your project directory:
- `gsc_mcp_server.py` (main server file)
- `gsc_dimensions.json` (dimensions configuration)
- `gsc_metrics.json` (metrics configuration)
- `gsc_filters.json` (filters and validation configuration)
- `pyproject.toml` (package configuration)

## Step 4: Test the Server

```bash
python gsc_mcp_server.py
```

If successful, you should see: "Starting GSC MCP server..."

## Step 5: Claude Desktop Integration

### 5.1 Update Claude Configuration
Add the GSC MCP server to your existing Claude desktop configuration file alongside your GA4 server:

**Location**: 
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ga4-analytics": {
      "command": "/path/to/your/ga4-mcp-server/venv/bin/python",
      "args": ["/path/to/your/ga4-mcp-server/ga4_mcp_server.py"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/your/service-account-key.json",
        "GA4_PROPERTY_ID": "your-ga4-property-id"
      }
    },
    "gsc-search-console": {
      "command": "/path/to/your/gsc-mcp-server/venv/bin/python",
      "args": ["/path/to/your/gsc-mcp-server/gsc_mcp_server.py"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/your/service-account-key.json",
        "GSC_SITE_URL": "https://your-verified-site.com/"
      }
    }
  }
}
```

### 5.2 Restart Claude Desktop
Close and reopen Claude Desktop to load the new MCP server.

## Available Functions

The GSC MCP server provides these functions based on the official GSC API:

1. **list_gsc_sites()** - List all verified sites in your Search Console
2. **list_available_dimensions()** - Show all 6 available dimensions with descriptions
3. **list_available_metrics()** - Show all 4 available metrics with descriptions
4. **get_search_analytics()** - Get search performance data with comprehensive options
5. **get_sitemaps()** - List all submitted sitemaps for your site
6. **submit_sitemap()** - Submit a new sitemap
7. **delete_sitemap()** - Remove a sitemap

## API Reference

### Available Dimensions
- **country**: Three-letter ISO 3166-1 alpha-3 country code
- **device**: DESKTOP, MOBILE, or TABLET
- **page**: Canonical URL of the page
- **query**: Search query string
- **searchAppearance**: Type like AMP_BLUE_LINK, RICHCARD, FEATURED_SNIPPET
- **date**: Date in YYYY-MM-DD format

### Available Metrics (Always Returned)
- **clicks**: Total number of clicks
- **impressions**: Total number of impressions
- **ctr**: Click-through rate as percentage
- **position**: Average search position

### Search Types
- web, image, video, news, discover, googleNews

## Example Usage

Once set up, you can ask Claude:

- "Show me top search queries for the last 30 days"
- "What are my top performing pages by clicks?"
- "Compare mobile vs desktop performance"
- "Show me all featured snippets performance"
- "What countries generate the most traffic?"
- "List my sitemaps and their status"

## Sample API Calls

### Basic Query Analysis
```python
get_search_analytics(
    dimensions=["query"],
    start_date="2024-01-01",
    end_date="2024-01-31",
    row_limit=100
)
```

### Mobile Performance by Country
```python
get_search_analytics(
    dimensions=["country", "device"],
    filters=[{"dimension": "device", "operator": "equals", "expression": "MOBILE"}],
    start_date="2024-01-01",
    end_date="2024-01-31"
)
```

### Featured Snippets Analysis
```python
get_search_analytics(
    dimensions=["page", "query"],
    filters=[{"dimension": "searchAppearance", "operator": "equals", "expression": "FEATURED_SNIPPET"}]
)
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure your service account has been added to Search Console users
2. **Site Not Found**: Verify the `GSC_SITE_URL` exactly matches your Search Console property
3. **API Not Enabled**: Make sure Google Search Console API is enabled in Google Cloud
4. **Invalid Dimension**: Use only the 6 valid dimensions from the official API
5. **Date Range**: GSC data has a 3-day delay, so end_date should be 3+ days ago

### Debug Mode
Add debug logging to see detailed error messages:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Security Notes

- Reuse your existing service account key file from the GA4 project
- The same security practices apply as with your GA4 MCP
- Keep credentials secure and use environment variables only in the MCP configuration
- Both GA4 and GSC will use the same service account seamlessly