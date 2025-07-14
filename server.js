#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Configuration from environment variables
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const GSC_SITE_URL = process.env.GSC_SITE_URL;

// Validate required environment variables
if (!CREDENTIALS_PATH) {
    console.error("ERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable not set");
    console.error("Please set it to the path of your service account JSON file");
    process.exit(1);
}

if (!GSC_SITE_URL) {
    console.error("ERROR: GSC_SITE_URL environment variable not set");
    console.error("Please set it to your verified site URL (e.g., https://example.com/)");
    process.exit(1);
}

// Validate credentials file exists
if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`ERROR: Credentials file not found: ${CREDENTIALS_PATH}`);
    console.error("Please check the GOOGLE_APPLICATION_CREDENTIALS path");
    process.exit(1);
}

// Load JSON data files
const gscDimensions = JSON.parse(fs.readFileSync(path.join(__dirname, 'gsc_dimensions.json'), 'utf8'));
const gscMetrics = JSON.parse(fs.readFileSync(path.join(__dirname, 'gsc_metrics.json'), 'utf8'));
const gscFilters = JSON.parse(fs.readFileSync(path.join(__dirname, 'gsc_filters.json'), 'utf8'));

// Initialize Google Search Console API client
async function getGscService() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
        });
        
        const authClient = await auth.getClient();
        return google.searchconsole({ version: 'v1', auth: authClient });
    } catch (error) {
        console.error(`Error initializing GSC service: ${error.message}`);
        throw error;
    }
}

// Helper function to format dates
function formatDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

// Create the server
const server = new Server(
    {
        name: "google-search-console-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_gsc_sites",
                description: "List all sites verified in Google Search Console",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "list_available_dimensions",
                description: "List all available GSC dimensions with their descriptions",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "list_available_metrics",
                description: "List all available GSC metrics with their descriptions",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_search_analytics",
                description: "Retrieve Google Search Console search analytics data",
                inputSchema: {
                    type: "object",
                    properties: {
                        dimensions: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of dimensions: country, device, page, query, searchAppearance, date",
                            default: ["query"]
                        },
                        start_date: {
                            type: "string",
                            description: "Start date in YYYY-MM-DD format (defaults to 30 days ago)"
                        },
                        end_date: {
                            type: "string",
                            description: "End date in YYYY-MM-DD format (defaults to 3 days ago)"
                        },
                        filters: {
                            type: "array",
                            description: "List of filter objects",
                            items: {
                                type: "object",
                                properties: {
                                    dimension: { type: "string" },
                                    operator: { type: "string" },
                                    expression: { type: "string" }
                                }
                            }
                        },
                        search_type: {
                            type: "string",
                            description: "Type of search: web, image, video, news, discover, googleNews",
                            default: "web"
                        },
                        row_limit: {
                            type: "number",
                            description: "Maximum number of rows to return (max 25000)",
                            default: 1000
                        },
                        start_row: {
                            type: "number",
                            description: "Starting row for pagination (0-based)",
                            default: 0
                        }
                    },
                },
            },
            {
                name: "get_sitemaps",
                description: "Get all sitemaps for the configured site",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "submit_sitemap",
                description: "Submit a sitemap to Google Search Console",
                inputSchema: {
                    type: "object",
                    properties: {
                        sitemap_url: {
                            type: "string",
                            description: "Full URL of the sitemap to submit"
                        }
                    },
                    required: ["sitemap_url"]
                },
            },
            {
                name: "delete_sitemap",
                description: "Delete a sitemap from Google Search Console",
                inputSchema: {
                    type: "object",
                    properties: {
                        sitemap_url: {
                            type: "string",
                            description: "Full URL of the sitemap to delete"
                        }
                    },
                    required: ["sitemap_url"]
                },
            }
        ],
    };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "list_gsc_sites": {
                const service = await getGscService();
                const response = await service.sites.list();
                
                const result = response.data.siteEntry?.map(site => ({
                    siteUrl: site.siteUrl,
                    permissionLevel: site.permissionLevel
                })) || [];
                
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "list_available_dimensions": {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(gscDimensions.dimensions, null, 2),
                        },
                    ],
                };
            }

            case "list_available_metrics": {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(gscMetrics.metrics, null, 2),
                        },
                    ],
                };
            }

            case "get_search_analytics": {
                const {
                    dimensions = ["query"],
                    start_date,
                    end_date,
                    filters,
                    search_type = "web",
                    row_limit = 1000,
                    start_row = 0
                } = args;

                // Validate dimensions
                const validDimensions = ["country", "device", "page", "query", "searchAppearance", "date"];
                for (const dim of dimensions) {
                    if (!validDimensions.includes(dim)) {
                        throw new Error(`Invalid dimension '${dim}'. Valid dimensions: ${validDimensions.join(', ')}`);
                    }
                }

                // Set default dates
                const startDate = start_date || formatDate(30);
                const endDate = end_date || formatDate(3);

                // Build request
                const requestBody = {
                    startDate,
                    endDate,
                    dimensions,
                    searchType: search_type,
                    rowLimit: Math.min(row_limit, 25000),
                    startRow: start_row
                };

                // Handle filters
                if (filters && filters.length > 0) {
                    requestBody.dimensionFilterGroups = [{
                        filters: filters.map(filter => ({
                            dimension: filter.dimension,
                            operator: filter.operator || 'equals',
                            expression: filter.expression
                        }))
                    }];
                }

                const service = await getGscService();
                const response = await service.searchanalytics.query({
                    siteUrl: GSC_SITE_URL,
                    requestBody
                });

                // Format response
                const result = {
                    metadata: {
                        site_url: GSC_SITE_URL,
                        start_date: startDate,
                        end_date: endDate,
                        dimensions,
                        search_type,
                        total_rows: response.data.rows?.length || 0,
                        row_limit,
                        start_row
                    },
                    data: []
                };

                if (response.data.rows) {
                    result.data = response.data.rows.map(row => {
                        const dataRow = {};
                        
                        // Add dimension values
                        if (row.keys) {
                            dimensions.forEach((dimension, i) => {
                                if (i < row.keys.length) {
                                    dataRow[dimension] = row.keys[i];
                                }
                            });
                        }
                        
                        // Add metrics
                        dataRow.clicks = row.clicks || 0;
                        dataRow.impressions = row.impressions || 0;
                        dataRow.ctr = Math.round((row.ctr || 0) * 100 * 100) / 100; // Convert to percentage
                        dataRow.position = Math.round((row.position || 0) * 10) / 10;
                        
                        return dataRow;
                    });
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "get_sitemaps": {
                const service = await getGscService();
                const response = await service.sitemaps.list({
                    siteUrl: GSC_SITE_URL
                });
                
                const result = response.data.sitemap?.map(sitemap => ({
                    path: sitemap.path,
                    lastSubmitted: sitemap.lastSubmitted,
                    isPending: sitemap.isPending || false,
                    isSitemapsIndex: sitemap.isSitemapsIndex || false,
                    type: sitemap.type,
                    lastDownloaded: sitemap.lastDownloaded,
                    warnings: sitemap.warnings || 0,
                    errors: sitemap.errors || 0
                })) || [];
                
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case "submit_sitemap": {
                const { sitemap_url } = args;
                if (!sitemap_url) {
                    throw new Error("sitemap_url is required");
                }

                const service = await getGscService();
                await service.sitemaps.submit({
                    siteUrl: GSC_SITE_URL,
                    feedpath: sitemap_url
                });
                
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ success: `Sitemap submitted successfully: ${sitemap_url}` }, null, 2),
                        },
                    ],
                };
            }

            case "delete_sitemap": {
                const { sitemap_url } = args;
                if (!sitemap_url) {
                    throw new Error("sitemap_url is required");
                }

                const service = await getGscService();
                await service.sitemaps.delete({
                    siteUrl: GSC_SITE_URL,
                    feedpath: sitemap_url
                });
                
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({ success: `Sitemap deleted successfully: ${sitemap_url}` }, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ error: error.message }, null, 2),
                },
            ],
            isError: true,
        };
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("🚀 Google Search Console MCP server running on stdio");
}

if (require.main === module) {
    main().catch((error) => {
        console.error("Fatal error in main():", error);
        process.exit(1);
    });
}

module.exports = { server };