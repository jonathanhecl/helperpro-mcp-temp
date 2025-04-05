# HelperPro MCP

A TypeScript implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) for code analysis. This server provides endpoints to analyze code in different programming languages and extract information about functions and classes.

## Features

- `get_functions`: Retrieve all functions in a specified directory
- `get_classes`: Retrieve all classes in a specified directory
- Support for multiple programming languages including JavaScript, TypeScript, Python, and Go

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
      "type": "function"
    },
    {
      "name": "InitDB",
      "line": 81,
      "file": "database.go",
      "type": "function"
    }
  ]
}
```

Example response (table format):

```
function | line | file
---------|------|------
function closePopup | 206 | scripts.js
function InitDB | 81 | database.go
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
      "type": "class"
    }
  ]
}
```

Example response (table format):

```
class | line | file
------|------|------
class UserController | 15 | controllers.js
```

## Supported Languages

- JavaScript/TypeScript
- Python
- Go
- Basic support for other languages

## License

ISC