import * as fs from 'fs';
import * as path from 'path';
import { getFileLanguage, readFileContent } from '../fileUtils';

/**
 * Interface for code entities (functions or classes)
 */
export interface CodeEntity {
  name: string;
  line: number;
  file: string;
  relativePath: string;
  type: 'function' | 'class';
}

/**
 * Base parser interface
 */
export interface Parser {
  parseFile(filePath: string, basePath?: string): CodeEntity[];
}

/**
 * Simple regex-based parser for JavaScript/TypeScript
 */
export class JSParser implements Parser {
  parseFile(filePath: string, basePath: string = ''): CodeEntity[] {
    const content = readFileContent(filePath);
    const entities: CodeEntity[] = [];
    
    // Calculate relative path
    const relativePath = basePath ? path.relative(basePath, filePath) : filePath;
    
    // Find functions
    this.findFunctions(content, filePath, relativePath, entities);
    
    // Find classes
    this.findClasses(content, filePath, relativePath, entities);
    
    return entities;
  }

  private findFunctions(content: string, filePath: string, relativePath: string, entities: CodeEntity[]): void {
    // Match function declarations, arrow functions, and methods
    const functionPatterns = [
      // Function declarations: function name() {}
      /function\s+([a-zA-Z0-9_$]+)\s*\(/g,
      // Arrow functions with explicit name: const name = () => {}
      /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(.*?\)\s*=>/g,
      // Methods in classes: name() {}
      /([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*{/g
    ];

    // Precompute line positions for faster line number lookup
    const linePositions: number[] = [];
    let position = 0;
    for (const line of content.split('\n')) {
      linePositions.push(position);
      position += line.length + 1; // +1 for the newline character
    }
    
    // Reserved words to skip
    const reservedWords = new Set(['if', 'for', 'while', 'switch', 'catch']);
    
    // Process each pattern
    for (const pattern of functionPatterns) {
      let match;
      
      // Reset the regex index
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(content)) !== null) {
        const functionName = match[1];
        
        // Skip if it's a reserved word or likely not a function
        if (reservedWords.has(functionName)) {
          continue;
        }
        
        // Find line number (more efficient method)
        const matchPosition = match.index;
        let lineNumber = 1; // Start at line 1
        
        // Binary search to find the line number
        let low = 0;
        let high = linePositions.length - 1;
        
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (linePositions[mid] <= matchPosition && (mid === linePositions.length - 1 || linePositions[mid + 1] > matchPosition)) {
            lineNumber = mid + 1; // +1 because line numbers are 1-based
            break;
          } else if (linePositions[mid] > matchPosition) {
            high = mid - 1;
          } else {
            low = mid + 1;
          }
        }
        
        entities.push({
          name: functionName,
          line: lineNumber,
          file: path.basename(filePath),
          relativePath: relativePath,
          type: 'function'
        });
      }
    }
  }

  private findClasses(content: string, filePath: string, relativePath: string, entities: CodeEntity[]): void {
    // Match class declarations - be more specific to avoid false positives
    // Look for 'class' keyword followed by a space and then a valid class name
    // Avoid matching 'class' in other contexts like HTML class attributes or text
    const classPattern = /(?:^|\s)class\s+([a-zA-Z][a-zA-Z0-9_$]*)(?:\s|\{|$)/gm;
    
    // Precompute line positions if not already done
    let linePositions: number[] = [];
    if (entities.length === 0) { // Only compute if not already done in findFunctions
      let position = 0;
      for (const line of content.split('\n')) {
        linePositions.push(position);
        position += line.length + 1; // +1 for the newline character
      }
    }
    
    // Keep track of classes we've already found to avoid duplicates
    const foundClasses = new Set<string>();
    
    let match;
    // Reset the regex index
    classPattern.lastIndex = 0;
    
    // Split content into lines for better context checking
    const lines = content.split('\n');
    
    while ((match = classPattern.exec(content)) !== null) {
      const className = match[1];
      
      // Skip if we've already found this class in this file
      const classKey = `${className}:${filePath}`;
      if (foundClasses.has(classKey)) {
        continue;
      }
      
      // Find line number (more efficient method)
      const matchPosition = match.index;
      let lineNumber = 0; // Start at line 0 (will be adjusted to 1-based later)
      
      // Binary search to find the line number
      let low = 0;
      let high = linePositions.length - 1;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (linePositions[mid] <= matchPosition && (mid === linePositions.length - 1 || linePositions[mid + 1] > matchPosition)) {
          lineNumber = mid;
          break;
        } else if (linePositions[mid] > matchPosition) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }
      
      // Get the line content to verify this is actually a class declaration
      const lineContent = lines[lineNumber];
      
      // Skip if this doesn't look like a real class declaration
      // For example, skip if 'class' is part of a string or comment
      if (lineContent.trim().startsWith('//') || 
          (lineContent.includes('"class') && !lineContent.includes('class ')) || 
          (lineContent.includes('\'class') && !lineContent.includes('class '))) {
        continue;
      }
      
      // Add to found classes set to avoid duplicates
      foundClasses.add(classKey);
      
      entities.push({
        name: className,
        line: lineNumber + 1, // +1 because line numbers are 1-based
        file: path.basename(filePath),
        relativePath: relativePath,
        type: 'class'
      });
    }
  }
}

/**
 * Simple regex-based parser for Python
 */
export class PythonParser implements Parser {
  parseFile(filePath: string, basePath: string = ''): CodeEntity[] {
    const content = readFileContent(filePath);
    const entities: CodeEntity[] = [];
    
    // Calculate relative path
    const relativePath = basePath ? path.relative(basePath, filePath) : filePath;
    
    // Find functions
    this.findFunctions(content, filePath, relativePath, entities);
    
    // Find classes
    this.findClasses(content, filePath, relativePath, entities);
    
    return entities;
  }

  private findFunctions(content: string, filePath: string, relativePath: string, entities: CodeEntity[]): void {
    // Match function declarations: def name():
    const functionPattern = /def\s+([a-zA-Z0-9_]+)\s*\(/g;
    
    let match;
    const contentCopy = content.slice();
    
    while ((match = functionPattern.exec(contentCopy)) !== null) {
      const functionName = match[1];
      
      // Find line number
      const upToMatch = contentCopy.substring(0, match.index);
      const lineNumber = upToMatch.split('\n').length;
      
      entities.push({
        name: functionName,
        line: lineNumber,
        file: path.basename(filePath),
        relativePath: relativePath,
        type: 'function'
      });
    }
  }

  private findClasses(content: string, filePath: string, relativePath: string, entities: CodeEntity[]): void {
    // Match class declarations: class Name:
    const classPattern = /class\s+([a-zA-Z0-9_]+)\s*(?:\(.*\))?\s*:/g;
    
    // Keep track of classes we've already found to avoid duplicates
    const foundClasses = new Set<string>();
    
    // Split content into lines for better context checking
    const lines = content.split('\n');
    
    let match;
    // Reset the regex index
    classPattern.lastIndex = 0;
    
    while ((match = classPattern.exec(content)) !== null) {
      const className = match[1];
      
      // Skip if we've already found this class in this file
      const classKey = `${className}:${filePath}`;
      if (foundClasses.has(classKey)) {
        continue;
      }
      
      // Find line number more accurately
      const upToMatch = content.substring(0, match.index);
      const lineNumber = upToMatch.split('\n').length;
      
      // Get the line content to verify this is actually a class declaration
      const lineContent = lineNumber > 0 && lineNumber <= lines.length ? lines[lineNumber - 1] : '';
      
      // Skip if this doesn't look like a real class declaration
      // For example, skip if 'class' is part of a string or comment
      if (lineContent.trim().startsWith('#') || 
          (lineContent.includes('"class') && !lineContent.includes('class ')) || 
          (lineContent.includes('\'class') && !lineContent.includes('class '))) {
        continue;
      }
      
      // Add to found classes set to avoid duplicates
      foundClasses.add(classKey);
      
      entities.push({
        name: className,
        line: lineNumber,
        file: path.basename(filePath),
        relativePath: relativePath,
        type: 'class'
      });
    }
  }
}

/**
 * Simple regex-based parser for Go
 */
export class GoParser implements Parser {
  parseFile(filePath: string, basePath: string = ''): CodeEntity[] {
    const content = readFileContent(filePath);
    const entities: CodeEntity[] = [];
    
    // Calculate relative path
    const relativePath = basePath ? path.relative(basePath, filePath) : filePath;
    
    // Find functions
    this.findFunctions(content, filePath, relativePath, entities);
    
    // Go doesn't have traditional classes, but it has structs with methods
    // For simplicity, we're not including those as classes
    
    return entities;
  }

  private findFunctions(content: string, filePath: string, relativePath: string, entities: CodeEntity[]): void {
    // Match function declarations: func name() or func (r Receiver) name()
    const functionPattern = /func\s+(?:\([^)]*\)\s+)?([a-zA-Z0-9_]+)\s*\(/g;
    
    let match;
    const contentCopy = content.slice();
    
    while ((match = functionPattern.exec(contentCopy)) !== null) {
      const functionName = match[1];
      
      // Find line number
      const upToMatch = contentCopy.substring(0, match.index);
      const lineNumber = upToMatch.split('\n').length;
      
      entities.push({
        name: functionName,
        line: lineNumber,
        file: path.basename(filePath),
        relativePath: relativePath,
        type: 'function'
      });
    }
  }
}

/**
 * Get the appropriate parser for a file
 * @param filePath Path to the file
 * @returns Parser instance
 */
export function getParserForFile(filePath: string, basePath: string = ''): Parser | null {
  const language = getFileLanguage(filePath);
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      return new JSParser();
    case 'python':
      return new PythonParser();
    case 'go':
      return new GoParser();
    default:
      // For unsupported languages, we'll use a basic JS parser as fallback
      // This won't be accurate but provides some results
      return new JSParser();
  }
}
