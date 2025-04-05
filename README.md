# HelperPro MCP

A TypeScript implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) for code analysis. This server provides endpoints to analyze code in different programming languages and extract information about functions and classes.

## Features

- `get_functions`: Retrieve all functions in a specified directory
- `get_classes`: Retrieve all classes in a specified directory
- Support for multiple programming languages including JavaScript, TypeScript, Python, and Go
- Respects `.gitignore` files to exclude ignored directories and files
- Automatically ignores common directories like `node_modules`, `dist`, etc.
- Includes relative paths in results for easier navigation
- Smart detection of classes and functions to avoid duplicates and false positives
- Timeout handling to prevent long-running operations

## Installation

```bash
npm install
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### Get Functions

```
GET /get_functions?path=<directory_path>&format=<json|table>
```

Example response (JSON format):

```json
{
  "functions": [
    {
      "name": "closePopup",
      "line": 206,
      "file": "scripts.js",
      "relativePath": "src/js/scripts.js",
      "type": "function"
    },
    {
      "name": "InitDB",
      "line": 81,
      "file": "database.go",
      "relativePath": "src/backend/database.go",
      "type": "function"
    }
  ]
}
```

Example response (table format):

```
function | line | file | path
---------|------|------|------
function closePopup | 206 | scripts.js | src/js/scripts.js
function InitDB | 81 | database.go | src/backend/database.go
```

### Get Classes

```
GET /get_classes?path=<directory_path>&format=<json|table>
```

Example response (JSON format):

```json
{
  "classes": [
    {
      "name": "UserController",
      "line": 15,
      "file": "controllers.js",
      "relativePath": "src/controllers/controllers.js",
      "type": "class"
    }
  ]
}
```

Example response (table format):

```
class | line | file | path
------|------|------|------
class UserController | 15 | controllers.js | src/controllers/controllers.js
```

## Supported Languages

- JavaScript/TypeScript
- Python
- Go
- Basic support for other languages (Java, C#, Ruby, PHP, Swift, C/C++)

## Additional Parameters

### Common Parameters

- `path`: (Required) Directory path to search
- `format`: (Optional) Output format, either `json` (default) or `table`
- `maxDepth`: (Optional) Maximum directory depth to search, default is 3

### Example Usage

```
# Get functions in JSON format
GET /get_functions?path=/path/to/project

# Get classes in table format with max depth of 5
GET /get_classes?path=/path/to/project&format=table&maxDepth=5
```

## Performance Considerations

- The server has a 30-second timeout for all operations
- Large codebases may take longer to analyze
- Use the `maxDepth` parameter to limit the search depth for better performance
- The server automatically ignores common directories like `node_modules` to improve performance

## Integration with MCP Clients

This MCP server can be integrated with MCP clients like Cascade or other AI assistants that support the Model Context Protocol.

### Using with Cascade or Similar Tools

Add the following configuration to your `.cascade.json` file:

```json
{
  "mcpServers": {
    "code-analyzer": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-code-analyzer"
      ]
    }
  }
}
```

### Publishing and Installation

To publish this package to npm:

```bash
# Login to npm (you need an npm account)
npm login

# Build the package
npm run build

# Publish the package
npm publish
```

To install and use globally:

```bash
npm install -g mcp-code-analyzer

# Run the server
mcp-code-analyzer
```

## License

[MIT License](LICENSE)