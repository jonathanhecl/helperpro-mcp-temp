import * as path from 'path';
import { getFilesInDirectory } from '../utils/fileUtils';
import { CodeEntity, getParserForFile } from '../utils/parsers';

/**
 * Get all functions in the specified directory
 * @param dirPath Directory path to search
 * @param maxDepth Maximum directory depth to search (default: 3)
 * @returns Array of function entities
 */
export async function getFunctions(dirPath: string, maxDepth: number = 3): Promise<CodeEntity[]> {
  try {
    // Normalize the path
    const normalizedPath = path.resolve(dirPath);
    
    // Get all files in the directory
    const files = await getFilesInDirectory(normalizedPath, maxDepth);
    
    // Parse each file and collect functions
    const allFunctions: CodeEntity[] = [];
    
    for (const file of files) {
      const parser = getParserForFile(file);
      if (parser) {
        // Pass the base directory to the parser for relative path calculation
        const entities = parser.parseFile(file, normalizedPath);
        // Filter only functions
        const functions = entities.filter(entity => entity.type === 'function');
        allFunctions.push(...functions);
      }
    }
    
    return allFunctions;
  } catch (error) {
    console.error(`Error getting functions: ${error}`);
    return [];
  }
}

/**
 * Format function entities as a table
 * @param functions Array of function entities
 * @returns Formatted table string
 */
export function formatFunctionsTable(functions: CodeEntity[]): string {
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
