#!/usr/bin/env node

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { spawn } = require('child_process');

async function testMCPConnection() {
    console.log('🧪 Testing Google Search Console MCP Connection...\n');
    
    let transport;
    let client;
    
    try {
        // Set up environment variables
        const env = {
            ...process.env,
            GOOGLE_APPLICATION_CREDENTIALS: 'C:\\Users\\Admin\\vs_code\\google_api\\vscode-mcps-fc79d0a8902f.json',
            GSC_SITE_URL: 'https://seyali.com/'
        };

        console.log('📋 Environment Check:');
        console.log(`  GOOGLE_APPLICATION_CREDENTIALS: ${env.GOOGLE_APPLICATION_CREDENTIALS}`);
        console.log(`  GSC_SITE_URL: ${env.GSC_SITE_URL}\n`);

        // Spawn the MCP server process
        console.log('🚀 Starting MCP server via npx...');
        const serverProcess = spawn('npx', ['google-search-console-mcp-js'], {
            env,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true
        });

        // Create transport and client
        transport = new StdioClientTransport({
            reader: serverProcess.stdout,
            writer: serverProcess.stdin
        });

        client = new Client({
            name: "test-client",
            version: "1.0.0"
        }, {
            capabilities: {}
        });

        // Connect to the server
        console.log('🔌 Connecting to MCP server...');
        await client.connect(transport);
        console.log('✅ Connected successfully!\n');

        // Test 1: List available tools
        console.log('🔧 Testing tool listing...');
        const tools = await client.listTools();
        console.log(`✅ Found ${tools.tools?.length || 0} tools:`);
        if (tools.tools) {
            tools.tools.forEach(tool => {
                console.log(`  - ${tool.name}: ${tool.description}`);
            });
        }
        console.log();

        // Test 2: List GSC sites
        if (tools.tools?.some(tool => tool.name === 'list_gsc_sites')) {
            console.log('🌐 Testing GSC sites listing...');
            try {
                const sitesResult = await client.callTool({
                    name: 'list_gsc_sites',
                    arguments: {}
                });
                console.log('✅ GSC sites test passed');
                console.log('Response:', JSON.stringify(sitesResult, null, 2));
            } catch (error) {
                console.log('❌ GSC sites test failed:', error.message);
            }
            console.log();
        }

        // Test 3: List available dimensions
        if (tools.tools?.some(tool => tool.name === 'list_available_dimensions')) {
            console.log('📊 Testing dimensions listing...');
            try {
                const dimensionsResult = await client.callTool({
                    name: 'list_available_dimensions',
                    arguments: {}
                });
                console.log('✅ Dimensions test passed');
                const dimensions = JSON.parse(dimensionsResult.content[0]?.text || '[]');
                console.log(`Found ${dimensions.length} dimensions`);
                if (dimensions.length > 0) {
                    console.log('Sample dimensions:', dimensions.slice(0, 3).map(d => d.name));
                }
            } catch (error) {
                console.log('❌ Dimensions test failed:', error.message);
            }
            console.log();
        }

        // Test 4: Get search analytics (basic query)
        if (tools.tools?.some(tool => tool.name === 'get_search_analytics')) {
            console.log('📈 Testing search analytics...');
            try {
                const analyticsResult = await client.callTool({
                    name: 'get_search_analytics',
                    arguments: {
                        dimensions: ['query'],
                        start_date: '2024-01-01',
                        end_date: '2024-01-31',
                        row_limit: 5
                    }
                });
                console.log('✅ Search analytics test passed');
                console.log('Sample result structure received');
            } catch (error) {
                console.log('❌ Search analytics test failed:', error.message);
                console.log('This might be due to no data available for the test date range');
            }
            console.log();
        }

        console.log('🎉 MCP Connection Test Complete!');
        
        // Cleanup
        serverProcess.kill();
        
    } catch (error) {
        console.error('❌ MCP Connection Test Failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (client && transport) {
            try {
                await client.close();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}

// Run the test
testMCPConnection().catch(console.error);