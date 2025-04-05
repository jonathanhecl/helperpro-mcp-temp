#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const http = __importStar(require("http"));
const url = __importStar(require("url"));
const analyzers_1 = require("./analyzers");
// Define the port for the MCP server
// Use a random port if the default port is in use
const PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3000;
/**
 * Log a message to the console with a timestamp
 * @param message Message to log
 */
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}
/**
 * Start the MCP server
 */
async function startServer() {
    // Create and start the server
    const server = http.createServer((req, res) => {
        // Set a timeout for the server response (30 seconds)
        res.setTimeout(30000, () => {
            console.error('Response timeout reached (30s)');
            res.writeHead(408, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Request timeout' }));
        });
        // Handle the request
        handleRequest(req, res).catch(error => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Unhandled error: ${errorMessage}`);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });
    });
    server.timeout = 30000; // Set server-wide timeout to 30 seconds
    // Handle server errors
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            log(`Port ${PORT} is already in use. Please specify a different port using the MCP_PORT environment variable.`);
            process.exit(1);
        }
        else {
            log(`Server error: ${error}`);
            process.exit(1);
        }
    });
    // Start the server
    server.listen(PORT, () => {
        log(`MCP Code Analyzer server running at http://localhost:${PORT}`);
        log(`Available endpoints:`);
        log(`- GET /get_functions?path=<directory_path> - Get all functions in the specified directory`);
        log(`- GET /get_classes?path=<directory_path> - Get all classes in the specified directory`);
    });
    // Handle process termination
    process.on('SIGINT', () => {
        log('Shutting down MCP server...');
        server.close(() => {
            log('MCP server stopped');
            process.exit(0);
        });
    });
}
/**
 * Handle MCP requests
 * @param req HTTP request
 * @param res HTTP response
 */
async function handleRequest(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    // Parse URL
    const parsedUrl = url.parse(req.url || '', true);
    const pathname = parsedUrl.pathname || '';
    // Handle different endpoints
    try {
        if (pathname === '/get_functions') {
            await handleGetFunctions(req, res, parsedUrl.query);
        }
        else if (pathname === '/get_classes') {
            await handleGetClasses(req, res, parsedUrl.query);
        }
        else {
            // Return available endpoints
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                endpoints: [
                    {
                        name: 'get_functions',
                        description: 'Get all functions in the specified directory',
                        params: { path: 'Directory path to search' }
                    },
                    {
                        name: 'get_classes',
                        description: 'Get all classes in the specified directory',
                        params: { path: 'Directory path to search' }
                    }
                ]
            }));
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Error handling request: ${errorMessage}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}
/**
 * Handle get_functions endpoint
 * @param req HTTP request
 * @param res HTTP response
 * @param query URL query parameters
 */
async function handleGetFunctions(req, res, query) {
    const path = query.path;
    const maxDepth = query.maxDepth ? parseInt(query.maxDepth, 10) : 3;
    if (!path) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Path parameter is required' }));
        return;
    }
    log(`Getting functions from ${path} with max depth ${maxDepth}`);
    console.time('getFunctions');
    try {
        // Set a timeout for this operation
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timed out after 25 seconds')), 25000);
        });
        // Run the operation with a timeout
        const functions = await Promise.race([
            (0, analyzers_1.getFunctions)(path, maxDepth),
            timeoutPromise
        ]);
        console.timeEnd('getFunctions');
        log(`Found ${functions.length} functions in ${path}`);
        // Check if format=table is specified
        if (query.format === 'table') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end((0, analyzers_1.formatFunctionsTable)(functions));
        }
        else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ functions }));
        }
    }
    catch (error) {
        console.timeEnd('getFunctions');
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Error getting functions: ${errorMessage}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Error getting functions: ${errorMessage}` }));
    }
}
/**
 * Handle get_classes endpoint
 * @param req HTTP request
 * @param res HTTP response
 * @param query URL query parameters
 */
async function handleGetClasses(req, res, query) {
    const path = query.path;
    const maxDepth = query.maxDepth ? parseInt(query.maxDepth, 10) : 3;
    if (!path) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Path parameter is required' }));
        return;
    }
    log(`Getting classes from ${path} with max depth ${maxDepth}`);
    console.time('getClasses');
    try {
        // Set a timeout for this operation
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timed out after 25 seconds')), 25000);
        });
        // Run the operation with a timeout
        const classes = await Promise.race([
            (0, analyzers_1.getClasses)(path, maxDepth),
            timeoutPromise
        ]);
        console.timeEnd('getClasses');
        log(`Found ${classes.length} classes in ${path}`);
        // Check if format=table is specified
        if (query.format === 'table') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end((0, analyzers_1.formatClassesTable)(classes));
        }
        else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ classes }));
        }
    }
    catch (error) {
        console.timeEnd('getClasses');
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Error getting classes: ${errorMessage}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Error getting classes: ${errorMessage}` }));
    }
}
// Start the server when this script is run directly
if (require.main === module) {
    startServer().catch(error => {
        log(`Failed to start server: ${error}`);
        process.exit(1);
    });
}
