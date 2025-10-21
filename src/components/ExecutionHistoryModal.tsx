"use client";

import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CodeExecution } from "@/types/api";

interface ExecutionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  executions: CodeExecution[];
}

export function ExecutionHistoryModal({
  open,
  onOpenChange,
  executions,
}: ExecutionHistoryModalProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const displayExecution =
    selectedIndex !== null ? executions[selectedIndex] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Execution History</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left: Execution List */}
          <div className="w-1/3 flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {executions.length === 0 ? (
                  <div className="text-sm text-muted-foreground space-y-2 p-4">
                    <p className="font-medium">No API calls yet</p>
                    <p className="text-xs">
                      Start by creating a game in the Setup tab.
                    </p>
                  </div>
                ) : (
                  executions.map((execution, index) => (
                    <button
                      type="button"
                      key={`${execution.timestamp.getTime()}-${index}`}
                      onClick={() => setSelectedIndex(index)}
                      className={`w-full text-left p-3 rounded-md text-sm transition-colors border ${
                        selectedIndex === index
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{execution.action}</span>
                        {execution.error && (
                          <Badge variant="destructive" className="text-xs">
                            Error
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs opacity-70">
                        {execution.timestamp.toLocaleTimeString()}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Code and Response */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {displayExecution ? (
              <>
                {/* Request Code */}
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Request Code</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 flex flex-col">
                    <ScrollArea className="flex-1 rounded-md border bg-zinc-950">
                      <Highlight
                        theme={themes.nightOwl}
                        code={displayExecution.code}
                        language="javascript"
                      >
                        {({
                          className,
                          style,
                          tokens,
                          getLineProps,
                          getTokenProps,
                        }) => {
                          const timestamp = displayExecution.timestamp.getTime();
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
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      {displayExecution.error ? "Error" : "Response"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 flex flex-col">
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
                        }) => {
                          const timestamp = displayExecution.timestamp.getTime();
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
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Select an execution to view details</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}