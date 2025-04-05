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
exports.getFunctions = getFunctions;
exports.formatFunctionsTable = formatFunctionsTable;
const path = __importStar(require("path"));
const fileUtils_1 = require("../utils/fileUtils");
const parsers_1 = require("../utils/parsers");
/**
 * Get all functions in the specified directory
 * @param dirPath Directory path to search
 * @param maxDepth Maximum directory depth to search (default: 3)
 * @returns Array of function entities
 */
async function getFunctions(dirPath, maxDepth = 3) {
    try {
        // Normalize the path
        const normalizedPath = path.resolve(dirPath);
        // Get all files in the directory
        const files = await (0, fileUtils_1.getFilesInDirectory)(normalizedPath, maxDepth);
        // Parse each file and collect functions
        const allFunctions = [];
        for (const file of files) {
            const parser = (0, parsers_1.getParserForFile)(file);
            if (parser) {
                // Pass the base directory to the parser for relative path calculation
                const entities = parser.parseFile(file, normalizedPath);
                // Filter only functions
                const functions = entities.filter(entity => entity.type === 'function');
                allFunctions.push(...functions);
            }
        }
        return allFunctions;
    }
    catch (error) {
        console.error(`Error getting functions: ${error}`);
        return [];
    }
}
/**
 * Format function entities as a table
 * @param functions Array of function entities
 * @returns Formatted table string
 */
function formatFunctionsTable(functions) {
    if (functions.length === 0) {
        return 'No functions found.';
    }
    // Header
    let table = 'function | line | file | path\n';
    table += '---------|------|------|------\n';
    // Rows
    for (const func of functions) {
        table += `function ${func.name} | ${func.line} | ${func.file} | ${func.relativePath}\n`;
    }
    return table;
}
