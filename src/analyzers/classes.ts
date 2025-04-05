import * as path from 'path';
import { getFilesInDirectory } from '../utils/fileUtils';
import { CodeEntity, getParserForFile } from '../utils/parsers';

/**
 * Get all classes in the specified directory
 * @param dirPath Directory path to search
 * @param maxDepth Maximum directory depth to search (default: 3)
 * @returns Array of class entities
 */
export async function getClasses(dirPath: string, maxDepth: number = 3): Promise<CodeEntity[]> {
  try {
    // Normalize the path
    const normalizedPath = path.resolve(dirPath);
    
    // Get all files in the directory
    const files = await getFilesInDirectory(normalizedPath, maxDepth);
    
    // Parse each file and collect classes
    const allClasses: CodeEntity[] = [];
    
    for (const file of files) {
      const parser = getParserForFile(file);
      if (parser) {
        // Pass the base directory to the parser for relative path calculation
        const entities = parser.parseFile(file, normalizedPath);
        // Filter only classes
        const classes = entities.filter(entity => entity.type === 'class');
        allClasses.push(...classes);
      }
    }
    
    return allClasses;
  } catch (error) {
    console.error(`Error getting classes: ${error}`);
    return [];
  }
}

/**
 * Format class entities as a table
 * @param classes Array of class entities
 * @returns Formatted table string
 */
export function formatClassesTable(classes: CodeEntity[]): string {
  if (classes.length === 0) {
    return 'No classes found.';
  }
  
  // Header
  let table = 'class | line | file | path\n';
  table += '------|------|------|------\n';
  
  // Rows
  for (const cls of classes) {
    table += `class ${cls.name} | ${cls.line} | ${cls.file} | ${cls.relativePath}\n`;
  }
  
  return table;
}
