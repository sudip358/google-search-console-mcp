# 🔍 Google Search Console MCP Server

[![npm version](https://badge.fury.io/js/google-search-console-mcp-js.svg)](https://badge.fury.io/js/google-search-console-mcp-js)
[![Node.js Version](https://img.shields.io/node/v/google-search-console-mcp-js.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful **Model Context Protocol (MCP) server** that connects Google Search Console data to AI assistants like Claude, Cursor, and other MCP-compatible clients. Get instant access to your website's search performance, keywords, rankings, and more through natural language queries.

## ✨ Features

- 🔗 **Direct GSC Integration** - Connect to Google Search Console API
- 📊 **Rich Analytics** - Access search performance, clicks, impressions, CTR, rankings
- 🎯 **Smart Filtering** - Filter by device, country, query, page, and date ranges  
- 🗺️ **Sitemap Management** - Submit, list, and delete sitemaps
- 🚀 **Zero Dependencies** - Pure Node.js implementation, no Python required
- 🔧 **Easy Setup** - Simple configuration with service account credentials
- 🤖 **AI-Friendly** - Designed for natural language queries with AI assistants

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g google-search-console-mcp-js

# Or run directly with npx (recommended)
npx google-search-console-mcp-js
```

### Prerequisites

1. **Google Search Console property** with verified ownership
2. **Google Cloud Project** with Search Console API enabled
3. **Service account credentials** (JSON file)

## ⚙️ Setup

### 1. Create Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Search Console API**
4. Create a **Service Account**:
   - Go to IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Download the JSON credentials file
5. **Share your GSC property** with the service account email

### 2. Configure Environment Variables

```bash
# Set the path to your credentials file
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/credentials.json"

# Set your GSC site URL (include protocol)
export GSC_SITE_URL="sc-domain:yourdomain.com"
```

### 3. MCP Client Configuration

Add to your MCP client configuration (e.g., `.roo/mcp.json` for Roo/Cline):

```json
{
  "mcpServers": {
    "gsc-search": {
      "command": "npx",
      "args": ["google-search-console-mcp-js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/your/credentials.json",
        "GSC_SITE_URL": "sc-domain:yourdomain.com"
      }
    }
  }
}
```

## 🛠️ Available Tools

### Analytics & Data

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_search_analytics` | Get search performance data | dimensions, dates, filters, search_type |
| `list_available_dimensions` | Show all GSC dimensions | none |
| `list_available_metrics` | Show all GSC metrics | none |
| `list_gsc_sites` | List verified GSC properties | none |

### Sitemap Management

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_sitemaps` | List submitted sitemaps | none |
| `submit_sitemap` | Submit new sitemap | sitemap_url |
| `delete_sitemap` | Remove sitemap | sitemap_url |

## 💬 Usage Examples

### Basic Queries

```
"Show me my top performing pages from last month"
"What are my top 10 keywords by clicks?"
"List all my submitted sitemaps"
"How is my site performing on mobile vs desktop?"
```

### Advanced Analytics

```
"Get search data for pages containing 'product' from last 30 days"
"Show me queries with high impressions but low CTR"
"Compare my rankings in US vs UK"
"Find pages that dropped in rankings this week"
```

### Sitemap Operations

```
"Submit my sitemap at https://mysite.com/sitemap.xml"
"Delete the old sitemap from GSC"
"Check the status of all my sitemaps"
```

## 📊 Supported Dimensions & Metrics

### Dimensions
- `query` - Search queries
- `page` - Landing pages  
- `country` - Geographic location
- `device` - Device type (desktop, mobile, tablet)
- `searchAppearance` - Search result features
- `date` - Date ranges

### Metrics
- `clicks` - Number of clicks
- `impressions` - Number of impressions
- `ctr` - Click-through rate
- `position` - Average search position

### Search Types
- `web` - Web search results
- `image` - Image search results
- `video` - Video search results
- `news` - News search results

## 🔧 Configuration Options

### Search Analytics Parameters

```javascript
{
  dimensions: ['query', 'page'],        // What to group by
  start_date: '2024-01-01',            // YYYY-MM-DD format
  end_date: '2024-01-31',              // YYYY-MM-DD format
  search_type: 'web',                  // web, image, video, news
  row_limit: 1000,                     // Max results (up to 25,000)
  filters: [                           // Optional filtering
    {
      dimension: 'country',
      operator: 'equals',
      expression: 'usa'
    }
  ]
}
```

### Filter Operators
- `equals` / `notEquals`
- `contains` / `notContains`
- `includingRegex` / `excludingRegex`

## 🐛 Troubleshooting

### Common Issues

**Connection Errors**
```bash
# Test your setup
node test-server.js

# Verify credentials
echo $GOOGLE_APPLICATION_CREDENTIALS
```

**Permission Denied**
- Ensure the service account email is added as a user in GSC
- Verify the GSC API is enabled in Google Cloud Console
- Check credentials file path and permissions

**No Data Returned**
- Verify your site URL format: `sc-domain:example.com` or `https://example.com/`
- Ensure the property exists and is verified in GSC
- Check date ranges (GSC data has ~3 day delay)

### Debug Mode

Set debug environment variable for detailed logging:
```bash
export DEBUG=gsc-mcp:*
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/google-search-console-mcp-js)
- [GitHub Repository](https://github.com/sudip358/google-search-console-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Google Search Console API](https://developers.google.com/webmaster-tools/search-console-api-original)

## 🆘 Support

- 📧 **Email**: sudipkumar211@gmail.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/sudip358/google-search-console-mcp/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/sudip358/google-search-console-mcp/discussions)

---

**Made with ❤️ for the MCP community**