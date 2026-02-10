import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat, access } from "node:fs/promises";
import { join, extname, relative } from "node:path";
import chalk from "chalk";

export interface ServeOptions {
  port?: number;
  host?: string;
}

/**
 * MIME types for common file extensions
 */
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".json": "application/json",
  ".md": "text/markdown",
  ".txt": "text/plain",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/**
 * Get MIME type for file extension
 */
function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * Log request
 */
function logRequest(
  method: string,
  url: string,
  status: number,
  size?: number
): void {
  const statusColor = status >= 400 ? chalk.red : status >= 300 ? chalk.yellow : chalk.green;
  const sizeStr = size ? chalk.gray(` (${formatBytes(size)})`) : "";

  console.log(
    chalk.gray(new Date().toLocaleTimeString()) +
      " " +
      chalk.cyan(method) +
      " " +
      url +
      " " +
      statusColor(status.toString()) +
      sizeStr
  );
}

/**
 * Serve static files with PKP-specific features
 */
async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  rootDir: string
): Promise<void> {
  const url = req.url || "/";
  const method = req.method || "GET";

  // Only allow GET and HEAD
  if (method !== "GET" && method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
    logRequest(method, url, 405);
    return;
  }

  // Parse URL (handle query strings)
  const urlPath = url.split("?")[0] || "/";

  // Map URL to file path
  let filePath: string;

  if (urlPath === "/") {
    // Serve index or catalog info
    filePath = join(rootDir, "index.html");
    try {
      await access(filePath);
    } catch {
      // If no index.html, check for PKP catalog
      const catalogPath = join(rootDir, ".well-known", "pkp", "catalog.json");
      try {
        await access(catalogPath);
        // Redirect to catalog
        res.writeHead(302, { Location: "/.well-known/pkp/catalog.json" });
        res.end();
        logRequest(method, url, 302);
        return;
      } catch {
        // No index, no catalog - show info page
        const html = `<!DOCTYPE html>
<html>
<head>
  <title>PKP Development Server</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #2563eb; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
    pre { background: #1f2937; color: #f9fafb; padding: 16px; border-radius: 8px; overflow-x: auto; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>PKP Development Server</h1>
  <p>No <code>catalog.json</code> found. Run <code>pkp build</code> to generate the PKP structure.</p>
  <h2>Available endpoints:</h2>
  <ul>
    <li><a href="/pkp.txt">/pkp.txt</a> - PKP pointer file</li>
    <li><a href="/.well-known/pkp/catalog.json">/.well-known/pkp/catalog.json</a> - Product catalog</li>
  </ul>
</body>
</html>`;
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
        logRequest(method, url, 200, html.length);
        return;
      }
    }
  } else {
    filePath = join(rootDir, urlPath);
  }

  // Security: prevent directory traversal
  const realPath = join(rootDir, urlPath);
  if (!realPath.startsWith(rootDir)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    logRequest(method, url, 403);
    return;
  }

  // Check if file exists
  try {
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      // Try index.html in directory
      const indexPath = join(filePath, "index.html");
      try {
        await access(indexPath);
        filePath = indexPath;
      } catch {
        // List directory (for development convenience)
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        logRequest(method, url, 404);
        return;
      }
    }

    // Read and serve file
    const content = await readFile(filePath);
    const mimeType = getMimeType(filePath);

    // Add CORS headers for JSON (useful for MCP clients)
    const headers: Record<string, string> = {
      "Content-Type": mimeType,
      "Content-Length": content.length.toString(),
    };

    if (mimeType === "application/json" || mimeType === "text/markdown") {
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Methods"] = "GET, HEAD, OPTIONS";
    }

    // Cache control for development
    headers["Cache-Control"] = "no-cache";

    res.writeHead(200, headers);

    if (method === "GET") {
      res.end(content);
    } else {
      res.end();
    }

    logRequest(method, url, 200, content.length);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
    logRequest(method, url, 404);
  }
}

/**
 * Serve PKP catalog locally for testing
 */
export async function serveCommand(
  directory: string = ".",
  options: ServeOptions = {}
): Promise<void> {
  const port = options.port || 3000;
  const host = options.host || "localhost";
  const rootDir = join(process.cwd(), directory);

  // Check if directory exists
  try {
    await stat(rootDir);
  } catch {
    console.log(chalk.red("\n✗ Directory not found: " + directory + "\n"));
    process.exit(1);
  }

  // Check for PKP structure
  const catalogPath = join(rootDir, ".well-known", "pkp", "catalog.json");
  const pkpTxtPath = join(rootDir, "pkp.txt");

  let hasCatalog = false;
  let hasPkpTxt = false;

  try {
    await access(catalogPath);
    hasCatalog = true;
  } catch {
    // No catalog
  }

  try {
    await access(pkpTxtPath);
    hasPkpTxt = true;
  } catch {
    // No pkp.txt
  }

  console.log(chalk.blue("\n🚀 Starting PKP development server...\n"));

  if (!hasCatalog && !hasPkpTxt) {
    console.log(chalk.yellow("⚠️  No PKP structure found in " + directory));
    console.log(chalk.yellow("   Run " + chalk.cyan("pkp build") + " first to generate the catalog.\n"));
  }

  // Create server
  const server = createServer((req, res) => {
    handleRequest(req, res, rootDir).catch((error) => {
      console.error(chalk.red("Server error:"), error);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    });
  });

  // Handle server errors
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.log(chalk.red(`\n✗ Port ${port} is already in use.`));
      console.log(chalk.yellow(`  Try: pkp serve ${directory} -p ${port + 1}\n`));
      process.exit(1);
    }
    throw error;
  });

  // Start server
  server.listen(port, host, () => {
    console.log(chalk.green("✓") + " Server running at " + chalk.cyan(`http://${host}:${port}`));
    console.log(chalk.gray("  Serving: " + (relative(process.cwd(), rootDir) || ".")));
    console.log("");

    if (hasCatalog) {
      console.log("  PKP endpoints:");
      console.log("  " + chalk.cyan(`http://${host}:${port}/pkp.txt`));
      console.log("  " + chalk.cyan(`http://${host}:${port}/.well-known/pkp/catalog.json`));
    }

    console.log(chalk.gray("\n  Press Ctrl+C to stop.\n"));
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log(chalk.yellow("\n\n👋 Shutting down...\n"));
    server.close(() => {
      process.exit(0);
    });
  });
}
