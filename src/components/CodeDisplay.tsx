"use client";

import { useEffect, useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { CodeExecution } from "@/types/api";

interface CodeDisplayProps {
  executions: CodeExecution[];
  currentExecution: CodeExecution | null;
}

export function CodeDisplay({
  executions,
  currentExecution,
}: CodeDisplayProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (currentExecution) {
      const index = executions.findIndex(
        (e) => e.timestamp === currentExecution.timestamp,
      );
      setSelectedIndex(index);
    }
  }, [currentExecution, executions]);

  const displayExecution =
    selectedIndex !== null ? executions[selectedIndex] : currentExecution;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {executions.length === 0 ? (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="font-medium">No API calls yet</p>
                  <p className="text-xs">
                    Start by creating a game in the Setup tab. You'll see the
                    exact JavaScript code here!
                  </p>
                </div>
              ) : (
                executions.map((execution, index) => (
                  <button
                    type="button"
                    key={`${execution.timestamp.getTime()}-${index}`}
                    onClick={() => setSelectedIndex(index)}
                    className={`w-full text-left p-2 rounded-md text-xs transition-colors ${
                      selectedIndex === index
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{execution.action}</span>
                      <span className="text-xs opacity-70">
                        {execution.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {execution.error && (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        Error
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Code Display */}
      {displayExecution ? (
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{displayExecution.action}</CardTitle>
              {displayExecution.error && (
                <Badge variant="destructive">Error</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 gap-4">
            {/* Request Code */}
            <div className="flex-1 min-h-0 flex flex-col">
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                Request Code
              </h4>
              <ScrollArea className="flex-1 rounded-md border bg-zinc-950">
                <Highlight
                  theme={themes.nightOwl}
                  code={displayExecution.code}
                  language="javascript"
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={`${className} p-4 text-xs`} style={style}>
                      {tokens.map((line, i) => (
                        <div key={`req-line-${displayExecution.timestamp.getTime()}-${i}`} {...getLineProps({ line })}>
                          {line.map((token, tokenIndex) => (
                            <span key={`req-token-${i}-${tokenIndex}`} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </ScrollArea>
            </div>

            {/* Response/Error */}
            {(displayExecution.response || displayExecution.error) && (
              <div className="flex-1 min-h-0 flex flex-col">
                <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                  {displayExecution.error ? "Error" : "Response"}
                </h4>
                <ScrollArea className="flex-1 rounded-md border bg-zinc-950">
                  <Highlight
                    theme={themes.nightOwl}
                    code={
                      displayExecution.error
                        ? displayExecution.error
                        : JSON.stringify(displayExecution.response, null, 2)
                    }
                    language={displayExecution.error ? "text" : "json"}
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
                          <div key={`res-line-${displayExecution.timestamp.getTime()}-${i}`} {...getLineProps({ line })}>
                            {line.map((token, tokenIndex) => (
                              <span key={`res-token-${i}-${tokenIndex}`} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    )}
                  </Highlight>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader>
            <CardTitle className="text-sm">Code Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
            <div className="space-y-2 max-w-md">
              <h3 className="text-lg font-semibold text-zinc-100">
                👋 Welcome to the API Simulator!
              </h3>
              <p className="text-sm text-zinc-400">
                Make an API call using the controls on the left, and you'll see
                the exact JavaScript code appear here.
              </p>
              <div className="mt-6 p-4 bg-zinc-800 rounded-md text-left">
                <p className="text-xs text-zinc-500 mb-2">Example code you'll see:</p>
                <pre className="text-xs text-zinc-300 overflow-x-auto">
{`fetch('http://localhost:8080/games', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({
    name: 'My Game',
    owner_id: 'player1',
    max_players: 2
  })
})
  .then(res => res.json())
  .then(data => {
    console.log(data);
    return data;
  });`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
