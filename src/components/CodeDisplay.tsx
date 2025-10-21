"use client";

import { Highlight, themes } from "prism-react-renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CodeExecution } from "@/types/api";

interface CodeDisplayProps {
  currentExecution: CodeExecution | null;
}

export function CodeDisplay({ currentExecution }: CodeDisplayProps) {
  return (
    <div className="h-full flex flex-col gap-4">
      {currentExecution ? (
        <>
          {/* Request Code */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="text-sm">Request Code</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col">
              <div className="mb-2">
                <h4 className="text-xs font-semibold text-zinc-400">
                  {currentExecution.action}
                </h4>
                <p className="text-xs text-zinc-500">
                  {currentExecution.timestamp.toLocaleString()}
                </p>
              </div>
              <ScrollArea className="flex-1 rounded-md border bg-zinc-950">
                <Highlight
                  theme={themes.nightOwl}
                  code={currentExecution.code}
                  language="javascript"
                >
                  {({
                    className,
                    style,
                    tokens,
                    getLineProps,
                    getTokenProps,
                  }) => {
                    const timestamp = currentExecution.timestamp.getTime();
                    return (
                      <pre className={`${className} p-4 text-xs`} style={style}>
                        {tokens.map((line, i) => (
                          <div key={`req-line-${timestamp}-${i}`} {...getLineProps({ line })}>
                            {line.map((token, tokenIndex) => (
                              <span key={`req-token-${i}-${tokenIndex}`} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    );
                  }}
                </Highlight>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Response/Error */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="text-sm">
                {currentExecution.error ? "Error" : "Response"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col">
              <ScrollArea className="flex-1 rounded-md border bg-zinc-950">
                <Highlight
                  theme={themes.nightOwl}
                  code={
                    currentExecution.error
                      ? currentExecution.error
                      : JSON.stringify(currentExecution.response, null, 2)
                  }
                  language={currentExecution.error ? "text" : "json"}
                >
                  {({
                    className,
                    style,
                    tokens,
                    getLineProps,
                    getTokenProps,
                  }) => {
                    const timestamp = currentExecution.timestamp.getTime();
                    return (
                      <pre className={`${className} p-4 text-xs`} style={style}>
                        {tokens.map((line, i) => (
                          <div key={`res-line-${timestamp}-${i}`} {...getLineProps({ line })}>
                            {line.map((token, tokenIndex) => (
                              <span key={`res-token-${i}-${tokenIndex}`} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    );
                  }}
                </Highlight>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
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