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
exports.SUPPORTED_EXTENSIONS = void 0;
exports.readGitignore = readGitignore;
exports.convertGitignorePatternsToGlob = convertGitignorePatternsToGlob;
exports.getFilesInDirectory = getFilesInDirectory;
exports.readFileContent = readFileContent;
exports.getFileLanguage = getFileLanguage;
exports.getLineContent = getLineContent;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
/**
 * Supported file extensions for code analysis
 */
exports.SUPPORTED_EXTENSIONS = [
    '.js', '.ts', '.jsx', '.tsx', // JavaScript/TypeScript
    '.py', // Python
    '.java', // Java
    '.cs', // C#
    '.go', // Go
    '.rb', // Ruby
    '.php', // PHP
    '.swift', // Swift
    '.c', '.cpp', '.h', '.hpp' // C/C++
];
/**
 * Read and parse .gitignore file
 * @param dirPath Directory path where .gitignore file is located
 * @returns Array of ignore patterns
 */
function readGitignore(dirPath) {
    try {
        const gitignorePath = path.join(dirPath, '.gitignore');
        // Check if .gitignore exists
        if (!fs.existsSync(gitignorePath)) {
            console.log('No .gitignore file found in', dirPath);
            return [];
        }
        // Read and parse .gitignore file
        const content = fs.readFileSync(gitignorePath, 'utf8');
        const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => {
            // Filter out empty lines and comments
            return line.length > 0 && !line.startsWith('#');
        });
        console.log('Gitignore patterns:', lines);
        return lines;
    }
    catch (error) {
        console.error(`Error reading .gitignore: ${error}`);
        return [];
    }
}
/**
 * Convert gitignore patterns to glob ignore patterns
 * @param patterns Array of gitignore patterns
 * @param basePath Base path for the patterns
 * @returns Array of glob ignore patterns
 */
function convertGitignorePatternsToGlob(patterns, basePath) {
    const normalizedBasePath = basePath.replace(/\\/g, '/');
    return patterns.map(pattern => {
        // Remove leading slash if present
        let normalizedPattern = pattern.startsWith('/') ? pattern.substring(1) : pattern;
        // Handle directory-specific patterns (ending with /)
        if (normalizedPattern.endsWith('/')) {
            normalizedPattern = normalizedPattern + '**';
        }
        // Handle negation patterns (starting with !)
        if (normalizedPattern.startsWith('!')) {
            return `!${normalizedBasePath}/${normalizedPattern.substring(1)}`;
        }
        // Handle normal patterns
        return `${normalizedBasePath}/${normalizedPattern}`;
    });
}
/**
 * Get all files in a directory with supported extensions
 * @param dirPath Directory path to search
 * @param maxDepth Maximum directory depth to search (default: 3)
 * @returns Array of file paths
 */
async function getFilesInDirectory(dirPath, maxDepth = 3) {
    try {
        console.time('getFilesInDirectory');
        // Normalize path for glob pattern
        const normalizedPath = dirPath.replace(/\\/g, '/');
        // Read .gitignore patterns
        const gitignorePatterns = readGitignore(dirPath);
        let ignorePatterns = convertGitignorePatternsToGlob(gitignorePatterns, normalizedPath);
        // Always ignore node_modules, dist, and other common directories
        const commonIgnores = [
            'node_modules/**',
            'dist/**',
            '.git/**',
            'coverage/**',
            'build/**',
            '.cache/**',
            '.vscode/**',
            '.idea/**'
        ].map(pattern => `${normalizedPath}/${pattern}`);
        // Combine with gitignore patterns
        ignorePatterns = [...ignorePatterns, ...commonIgnores];
        // Create patterns for each supported extension
        const patterns = exports.SUPPORTED_EXTENSIONS.map(ext => `${normalizedPath}/**/*${ext}`);
        console.log('Searching with patterns:', patterns);
        console.log('Ignoring patterns:', ignorePatterns);
        // Set a timeout for the glob operation
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('File search timed out after 20 seconds')), 20000);
        });
        // Run the glob operation with a timeout
        const files = await Promise.race([
            (0, glob_1.glob)(patterns, {
                nodir: true,
                ignore: ignorePatterns
            }),
            timeoutPromise
        ]);
        console.timeEnd('getFilesInDirectory');
        console.log(`Found ${files.length} files in ${dirPath}`);
        if (files.length < 20) {
            console.log('Files:', files);
        }
        return files;
    }
    catch (error) {
        console.error(`Error getting files: ${error}`);
        return [];
    }
}
/**
 * Read file content
 * @param filePath Path to the file
 * @returns File content as string
 */
function readFileContent(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    }
    catch (error) {
        console.error(`Error reading file ${filePath}: ${error}`);
        return '';
    }
}
/**
 * Determine the language of a file based on its extension
 * @param filePath Path to the file
 * @returns Language identifier
 */
function getFileLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.js':
        case '.jsx':
            return 'javascript';
        case '.ts':
        case '.tsx':
            return 'typescript';
        case '.py':
            return 'python';
        case '.java':
            return 'java';
        case '.cs':
            return 'csharp';
        case '.go':
            return 'go';
        case '.rb':
            return 'ruby';
        case '.php':
            return 'php';
        case '.swift':
            return 'swift';
        case '.c':
        case '.h':
            return 'c';
        case '.cpp':
        case '.hpp':
            return 'cpp';
        default:
            return 'unknown';
    }
}
/**
 * Count the number of lines in a file
 * @param content File content
 * @param lineNumber Target line number
 * @returns Line content
 */
function getLineContent(content, lineNumber) {
    const lines = content.split('\n');
    if (lineNumber >= 0 && lineNumber < lines.length) {
        return lines[lineNumber];
    }
    return '';
}
