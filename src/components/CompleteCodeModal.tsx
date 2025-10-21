"use client";

import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check } from "lucide-react";
import type { CodeExecution } from "@/types/api";

interface CompleteCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  executions: CodeExecution[];
  apiUrl: string;
}

export function CompleteCodeModal({
  open,
  onOpenChange,
  executions,
  apiUrl,
}: CompleteCodeModalProps) {
  const [copied, setCopied] = useState(false);

  const generateCompleteScript = (): string => {
    if (executions.length === 0) {
      return "// No API calls to export yet";
    }

    const lines: string[] = [];
    
    lines.push("// ============================================================================");
    lines.push("// Forest Shuffle API - Complete Execution Script");
    lines.push("// ============================================================================");
    lines.push("//");
    lines.push("// This script recreates the execution history from the simulator.");
    lines.push("// It handles:");
    lines.push("//   - Dynamic game ID capture and reuse");
    lines.push("//   - Dynamic client ID generation (for idempotency)");
    lines.push("//   - Projection lag with automatic retry");
    lines.push("//   - Delays between requests to avoid overwhelming the backend");
    lines.push("//");
    lines.push("// Run with: node script.js");
    lines.push("// (Requires Node.js 18+ for native fetch support)");
    lines.push("//");
    lines.push("// ============================================================================");
    lines.push("");
    lines.push(`const BASE_URL = '${apiUrl}';`);
    lines.push("");
    lines.push("// ============================================================================");
    lines.push("// HELPER FUNCTIONS");
    lines.push("// ============================================================================");
    lines.push("");
    lines.push("/**");
    lines.push(" * Sleep/delay utility - pauses execution for specified milliseconds");
    lines.push(" * Used to give the backend projection time to catch up");
    lines.push(" */");
    lines.push("const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));");
    lines.push("");
    lines.push("/**");
    lines.push(" * Makes an API request with automatic retry on 503 (projection lag)");
    lines.push(" * @param {string} url - Full URL to fetch");
    lines.push(" * @param {object} options - Fetch options (method, headers, body)");
    lines.push(" * @param {string} stepDescription - Description for logging");
    lines.push(" * @returns {Promise<object>} Response data");
    lines.push(" */");
    lines.push("async function fetchWithRetry(url, options, stepDescription) {");
    lines.push("  console.log(`Making request: ${stepDescription}`);");
    lines.push("  ");
    lines.push("  // First attempt");
    lines.push("  let response = await fetch(url, options);");
    lines.push("  let data = await response.json();");
    lines.push("  ");
    lines.push("  // If projection is lagging (503), wait and retry");
    lines.push("  if (response.status === 503) {");
    lines.push("    console.log('⏳ Projection lagging - waiting 1 second before retry...');");
    lines.push("    await sleep(1000);");
    lines.push("    ");
    lines.push("    // Retry with fresh client_id (if applicable)");
    lines.push("    if (options.body) {");
    lines.push("      const bodyData = JSON.parse(options.body);");
    lines.push("      if (bodyData.client_id) {");
    lines.push("        // Generate new client_id for retry (maintains idempotency)");
    lines.push("        const prefix = bodyData.client_id.split('-').slice(0, -1).join('-');");
    lines.push("        bodyData.client_id = `${prefix}-${Date.now()}`;");
    lines.push("        options.body = JSON.stringify(bodyData);");
    lines.push("      }");
    lines.push("    }");
    lines.push("    ");
    lines.push("    console.log('🔄 Retrying request...');");
    lines.push("    response = await fetch(url, options);");
    lines.push("    data = await response.json();");
    lines.push("  }");
    lines.push("  ");
    lines.push("  // Check if request succeeded");
    lines.push("  if (!response.ok) {");
    lines.push("    throw new Error(`HTTP ${response.status}: ${data.error || 'Request failed'}`);");
    lines.push("  }");
    lines.push("  ");
    lines.push("  return data;");
    lines.push("}");
    lines.push("");
    lines.push("// ============================================================================");
    lines.push("// MAIN SIMULATION");
    lines.push("// ============================================================================");
    lines.push("");
    lines.push("async function runSimulation() {");
    lines.push("  console.log('\\n🌲 Starting Forest Shuffle API simulation...\\n');");
    lines.push("  console.log('============================================================================\\n');");
    lines.push("");
    lines.push("  // Track game ID across requests (captured from Create Game response)");
    lines.push("  let gameId = null;");
    lines.push("");

    executions.forEach((execution, index) => {
      const stepNum = index + 1;
      
      lines.push(`  // --------------------------------------------------------------------------`);
      lines.push(`  // Step ${stepNum}: ${execution.action}`);
      lines.push(`  // --------------------------------------------------------------------------`);
      lines.push("  try {");
      
      // Parse the fetch call from the code
      const codeLines = execution.code.split('\n');
      const fetchLine = codeLines.find(line => line.trim().startsWith('fetch('));
      
      if (fetchLine) {
        // Extract URL from fetch call
        const urlMatch = fetchLine.match(/fetch\(['"`]([^'"`]+)['"`]/);
        let url = urlMatch ? urlMatch[1] : '';
        
        // Replace hardcoded game ID with variable reference
        const gameIdMatch = url.match(/\/games\/([a-f0-9-]+)/);
        if (gameIdMatch) {
          const hardcodedGameId = gameIdMatch[1];
          url = url.replace(hardcodedGameId, '${gameId}');
        }
        
        // Determine HTTP method
        const hasBody = execution.request !== undefined;
        const method = execution.code.includes("method: 'POST'") ? 'POST' : 
                      execution.code.includes("method: 'PUT'") ? 'PUT' :
                      execution.code.includes("method: 'DELETE'") ? 'DELETE' : 'GET';
        
        // Build request body with dynamic client_id
        let requestBodyStr = "undefined";
        if (hasBody && execution.request) {
          let requestBody = JSON.stringify(execution.request, null, 6);
          
          // Replace hardcoded client_id with dynamic generation
          const clientIdMatch = requestBody.match(/"client_id":\s*"([^"]+)"/);
          if (clientIdMatch) {
            const originalClientId = clientIdMatch[1];
            const prefixMatch = originalClientId.match(/^([^-]+(?:-[^-]+)?)/);
            if (prefixMatch) {
              const prefix = prefixMatch[1];
              requestBody = requestBody.replace(
                `"client_id": "${originalClientId}"`,
                `"client_id": "${prefix}-\${Date.now()}"`
              );
            }
          }
          
          requestBodyStr = requestBody.replace(/\n/g, '\n      ');
        }
        
        lines.push(`    const data${stepNum} = await fetchWithRetry(`);
        lines.push(`      \`${url}\`,`);
        lines.push(`      {`);
        lines.push(`        method: '${method}',`);
        lines.push(`        headers: { 'Content-Type': 'application/json' }${hasBody ? ',' : ''}`);
        
        if (hasBody) {
          lines.push(`        body: JSON.stringify(${requestBodyStr})`);
        }
        
        lines.push(`      },`);
        lines.push(`      'Step ${stepNum}: ${execution.action}'`);
        lines.push(`    );`);
        lines.push("");
        
        // If this was a create game request, capture the game ID
        if (execution.action.includes("Create Game")) {
          lines.push(`    // Capture the game ID for use in subsequent requests`);
          lines.push(`    gameId = data${stepNum}.game.id;`);
          lines.push(`    console.log(\`✅ Game created with ID: \${gameId}\`);`);
        } else {
          lines.push(`    console.log('✅ Success!');`);
        }
        
        lines.push("");
        lines.push(`    // Pretty-print the response`);
        lines.push(`    console.log('Response:');`);
        lines.push(`    console.log(JSON.stringify(data${stepNum}, null, 2));`);
        lines.push(`    console.log('\\n');`);
        lines.push("");
        lines.push(`    // Brief delay before next request (helps avoid projection lag)`);
        lines.push(`    await sleep(200);`);
      }
      
      lines.push("");
      lines.push("  } catch (error) {");
      lines.push(`    console.error('❌ Error in Step ${stepNum}:', error.message);`);
      
      if (execution.error) {
        lines.push(`    // Original error from simulator: ${execution.error.replace(/\n/g, ' ')}`);
      }
      
      lines.push(`    console.log('\\n⚠️  Simulation stopped due to error\\n');`);
      lines.push(`    throw error; // Stop execution on error`);
      lines.push("  }");
      lines.push("");
    });

    lines.push("  console.log('============================================================================');");
    lines.push("  console.log('\\n🎉 Simulation complete! All steps executed successfully.\\n');");
    lines.push("}");
    lines.push("");
    lines.push("// ============================================================================");
    lines.push("// RUN THE SIMULATION");
    lines.push("// ============================================================================");
    lines.push("");
    lines.push("runSimulation()");
    lines.push("  .then(() => {");
    lines.push("    console.log('✅ Script finished successfully');");
    lines.push("    // Exit if running in Node.js, otherwise just complete");
    lines.push("    if (typeof process !== 'undefined' && process.exit) {");
    lines.push("      process.exit(0);");
    lines.push("    }");
    lines.push("  })");
    lines.push("  .catch((error) => {");
    lines.push("    console.error('\\n❌ Script failed:', error.message);");
    lines.push("    // Exit if running in Node.js, otherwise just complete");
    lines.push("    if (typeof process !== 'undefined' && process.exit) {");
    lines.push("      process.exit(1);");
    lines.push("    }");
    lines.push("  });");

    return lines.join('\n');
  };

  const handleCopy = async () => {
    const code = generateCompleteScript();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completeScript = generateCompleteScript();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Complete Code Export</DialogTitle>
          <DialogDescription>
            Copy this Node.js script to recreate the entire execution history.
            Includes automatic retry logic for projection lag and detailed comments.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex justify-end">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              disabled={executions.length === 0}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>

          <ScrollArea className="flex-1 rounded-md border bg-zinc-950">
            <Highlight
              theme={themes.nightOwl}
              code={completeScript}
              language="javascript"
            >
              {({
                className,
                style,
                tokens,
                getLineProps,
                getTokenProps,
              }) => (
                <pre className={`${className} p-4 text-xs`} style={style}>
                  {tokens.map((line, i) => (
                    <div key={`complete-line-${i}`} {...getLineProps({ line })}>
                      {line.map((token, tokenIndex) => (
                        <span key={`complete-token-${i}-${tokenIndex}`} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}