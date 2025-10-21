"use client";

import { useState } from "react";
import { ForestShuffleAPI } from "@/lib/api-client";
import { GameControls } from "@/components/GameControls";
import { GameStateDisplay } from "@/components/GameStateDisplay";
import { CodeDisplay } from "@/components/CodeDisplay";
import { ExecutionHistoryModal } from "@/components/ExecutionHistoryModal";
import { CompleteCodeModal } from "@/components/CompleteCodeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History, FileCode } from "lucide-react";
import type { StateResponse, CodeExecution } from "@/types/api";

export default function Home() {
  const [apiUrl, setApiUrl] = useState("http://localhost:8080");
  const [api, setApi] = useState<ForestShuffleAPI | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<StateResponse | null>(null);
  const [codeExecutions, setCodeExecutions] = useState<CodeExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<CodeExecution | null>(
    null,
  );
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [codeModalOpen, setCodeModalOpen] = useState(false);

  const handleConnect = () => {
    const newApi = new ForestShuffleAPI(apiUrl);
    newApi.onCodeExecutionUpdate((executions) => {
      setCodeExecutions(executions);
      if (executions.length > 0) {
        setCurrentExecution(executions[executions.length - 1]);
      }
    });
    setApi(newApi);
  };

  const handleGameCreated = (newGameId: string) => {
    setGameId(newGameId);
  };

  const handleStateUpdate = async (retries = 3): Promise<void> => {
    if (!api || !gameId) return;
    
    try {
      const state = await api.getGameStateSilent(gameId);
      
      // Check if projection is lagging
      if (state.projection_lagging && retries > 0) {
        // Wait 500ms and retry
        await new Promise(resolve => setTimeout(resolve, 500));
        return handleStateUpdate(retries - 1);
      }
      
      setGameState(state);
    } catch (error) {
      console.error("Failed to update state:", error);
      
      // Retry on error too
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return handleStateUpdate(retries - 1);
      }
    }
  };

  const handleClearCode = () => {
    if (api) {
      api.clearCodeExecutions();
      setCodeExecutions([]);
      setCurrentExecution(null);
    }
  };

  if (!api) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Forest Shuffle API Simulator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              An educational tool to learn the Forest Shuffle API by seeing both
              the UI interactions and the underlying code.
            </p>
            <div>
              <Label htmlFor="apiUrl">API Base URL</Label>
              <Input
                id="apiUrl"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:8080"
                className="mt-1"
              />
            </div>
            <Button onClick={handleConnect} className="w-full">
              Connect to API
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">
                🌲 Forest Shuffle API Simulator
              </h1>
              <p className="text-xs text-muted-foreground">
                Educational split-screen API explorer
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">API:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {apiUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryModalOpen(true)}
                disabled={codeExecutions.length === 0}
              >
                <History className="mr-2 h-4 w-4" />
                Execution History
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCodeModalOpen(true)}
                disabled={codeExecutions.length === 0}
              >
                <FileCode className="mr-2 h-4 w-4" />
                Complete Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCode}
              >
                Clear History
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - User Interaction */}
        <div className="w-1/2 border-r flex flex-col bg-white">
          <div className="border-b bg-zinc-50 px-4 py-2">
            <h2 className="text-sm font-semibold">
              User Interface & Game State
            </h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="h-full grid grid-rows-2">
              {/* Game Controls */}
              <div className="border-b overflow-auto p-4">
                <GameControls
                  api={api}
                  gameId={gameId}
                  gameState={gameState}
                  onGameCreated={handleGameCreated}
                  onStateUpdate={handleStateUpdate}
                />
              </div>
              {/* Game State */}
              <div className="overflow-auto">
                <GameStateDisplay gameState={gameState} gameId={gameId} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Code Display */}
        <div className="w-1/2 flex flex-col bg-zinc-900">
          <div className="border-b border-zinc-700 bg-zinc-800 px-4 py-2">
            <h2 className="text-sm font-semibold text-zinc-100">
              Live Code Execution
            </h2>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <CodeDisplay
              currentExecution={currentExecution}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExecutionHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        executions={codeExecutions}
      />

      <CompleteCodeModal
        open={codeModalOpen}
        onOpenChange={setCodeModalOpen}
        executions={codeExecutions}
        apiUrl={apiUrl}
      />

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-2">
        <p className="text-xs text-center text-muted-foreground">
          Educational tool for learning Forest Shuffle API •{" "}
          <a
            href="https://github.com/overlyserious/forest-shuffle-backend/blob/main/API_DOCUMENTATION.md"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            View API Documentation
          </a>
        </p>
      </footer>
    </div>
  );
}