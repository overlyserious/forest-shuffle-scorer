"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ForestShuffleAPI } from "@/lib/api-client";
import type { StateResponse } from "@/types/api";

interface GameControlsProps {
  api: ForestShuffleAPI;
  gameId: string | null;
  gameState: StateResponse | null;
  onGameCreated: (gameId: string) => void;
  onStateUpdate: () => void;
}

export function GameControls({
  api,
  gameId,
  gameState,
  onGameCreated,
  onStateUpdate,
}: GameControlsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [gameName, setGameName] = useState("My Forest Shuffle Game");
  const [ownerId, setOwnerId] = useState("player1");
  const [maxPlayers, setMaxPlayers] = useState("2");

  const [playerIdToAdd, setPlayerIdToAdd] = useState("player2");
  const [playerDisplayName, setPlayerDisplayName] = useState("Player 2");

  const [drawSource1, setDrawSource1] = useState<"DECK" | "CLEARING">("DECK");
  const [drawSource2, setDrawSource2] = useState<"DECK" | "CLEARING">("DECK");

  const [treeCardId, setTreeCardId] = useState("");
  const [treePaymentCards, setTreePaymentCards] = useState("");

  const [dwellerCardId, setDwellerCardId] = useState("");
  const [dwellerTreeIndex, setDwellerTreeIndex] = useState("0");
  const [dwellerPosition, setDwellerPosition] = useState<
    "TOP" | "BOTTOM" | "LEFT" | "RIGHT"
  >("TOP");
  const [dwellerPaymentCards, setDwellerPaymentCards] = useState("");

  const currentPlayer = gameState?.state.current_player_id || "";

const handleAction = async (action: () => Promise<void>) => {
  setLoading(true);
  setError(null);
  try {
    await action();
    
    // Trigger state update (will retry if projection is lagging)
    onStateUpdate();
  } catch (err) {
    setError(err instanceof Error ? err.message : String(err));
  } finally {
    setLoading(false);
  }
};

  const createGame = async () => {
    const result = await api.createGame({
      name: gameName,
      owner_id: ownerId,
      max_players: Number.parseInt(maxPlayers),
    });
    onGameCreated(result.game.id);
  };

  const addPlayer = async () => {
    if (!gameId) return;
    await api.addPlayer(gameId, {
      player_id: playerIdToAdd,
      client_id: `join-${playerIdToAdd}-${Date.now()}`,
      display_name: playerDisplayName,
    });
  };

  const startGame = async () => {
    if (!gameId) return;
    await api.startGame(gameId, {
      client_id: `start-${Date.now()}`,
    });
  };

  const drawCards = async () => {
    if (!gameId || !currentPlayer) return;
    await api.drawCards(gameId, {
      actor: currentPlayer,
      client_id: `draw-${currentPlayer}-${Date.now()}`,
      sources: [drawSource1, drawSource2],
    });
  };

  const playTree = async () => {
    if (!gameId || !currentPlayer || !treeCardId) return;
    await api.playTree(gameId, {
      actor: currentPlayer,
      client_id: `play-tree-${currentPlayer}-${Date.now()}`,
      card_id: treeCardId,
      payment_card_ids: treePaymentCards
        ? treePaymentCards.split(",").map((s) => s.trim())
        : [],
    });
    setTreeCardId("");
    setTreePaymentCards("");
  };

  const playDweller = async () => {
    if (!gameId || !currentPlayer || !dwellerCardId) return;
    await api.playDweller(gameId, {
      actor: currentPlayer,
      client_id: `play-dweller-${currentPlayer}-${Date.now()}`,
      card_id: dwellerCardId,
      tree_index: Number.parseInt(dwellerTreeIndex),
      position: dwellerPosition,
      payment_card_ids: dwellerPaymentCards
        ? dwellerPaymentCards.split(",").map((s) => s.trim())
        : [],
    });
    setDwellerCardId("");
    setDwellerPaymentCards("");
  };

  const endTurn = async () => {
    if (!gameId || !currentPlayer) return;
    await api.endTurn(gameId, {
      actor: currentPlayer,
      client_id: `end-turn-${currentPlayer}-${Date.now()}`,
    });
  };

  const getGameState = async () => {
    if (!gameId) return;
    await api.getGameState(gameId);
  };

  const getEvents = async () => {
    if (!gameId) return;
    await api.getEvents(gameId, 0, 50);
  };

  const healthCheck = async () => {
    await api.healthCheck();
  };

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Tabs defaultValue="setup" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger 
            value="actions" 
            disabled={!gameId}
            title={!gameId ? "Create a game first to enable Actions" : ""}
          >
            Actions
          </TabsTrigger>
          <TabsTrigger 
            value="query" 
            disabled={!gameId}
            title={!gameId ? "Create a game first to enable Query" : ""}
          >
            Query
          </TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-4 overflow-auto">
          {/* Setup Tab */}
          <TabsContent value="setup" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Create Game</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="gameName" className="text-xs">
                    Game Name
                  </Label>
                  <Input
                    id="gameName"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    placeholder="My Game"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="ownerId" className="text-xs">
                    Owner ID
                  </Label>
                  <Input
                    id="ownerId"
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    placeholder="player1"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="maxPlayers" className="text-xs">
                    Max Players
                  </Label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    min="2"
                    max="8"
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={() => handleAction(createGame)}
                  disabled={loading || !!gameId}
                  className="w-full"
                  size="sm"
                >
                  {loading ? "Creating..." : "Create Game"}
                </Button>
                {gameId && (
                  <Badge variant="secondary" className="w-full justify-center">
                    Game Created: {gameId.slice(0, 8)}...
                  </Badge>
                )}
              </CardContent>
            </Card>

            {gameId && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Add Player</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="playerId" className="text-xs">
                        Player ID
                      </Label>
                      <Input
                        id="playerId"
                        value={playerIdToAdd}
                        onChange={(e) => setPlayerIdToAdd(e.target.value)}
                        placeholder="player2"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="playerName" className="text-xs">
                        Display Name
                      </Label>
                      <Input
                        id="playerName"
                        value={playerDisplayName}
                        onChange={(e) => setPlayerDisplayName(e.target.value)}
                        placeholder="Player 2"
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={() => handleAction(addPlayer)}
                      disabled={loading}
                      className="w-full"
                      size="sm"
                    >
                      {loading ? "Adding..." : "Add Player"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Start Game</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleAction(startGame)}
                      disabled={loading}
                      className="w-full"
                      size="sm"
                    >
                      {loading ? "Starting..." : "Start Game"}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="mt-0 space-y-4">
            {currentPlayer && (
              <Badge variant="outline" className="w-full justify-center">
                Current Player: {currentPlayer}
              </Badge>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Draw Cards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Source 1</Label>
                    <select
                      value={drawSource1}
                      onChange={(e) =>
                        setDrawSource1(e.target.value as "DECK" | "CLEARING")
                      }
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="DECK">Deck</option>
                      <option value="CLEARING">Clearing</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Source 2</Label>
                    <select
                      value={drawSource2}
                      onChange={(e) =>
                        setDrawSource2(e.target.value as "DECK" | "CLEARING")
                      }
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="DECK">Deck</option>
                      <option value="CLEARING">Clearing</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={() => handleAction(drawCards)}
                  disabled={loading || !currentPlayer}
                  className="w-full"
                  size="sm"
                >
                  Draw 2 Cards
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Play Tree</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="treeCard" className="text-xs">
                    Tree Card ID
                  </Label>
                  <Input
                    id="treeCard"
                    value={treeCardId}
                    onChange={(e) => setTreeCardId(e.target.value)}
                    placeholder="tree-oak-1"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="treePayment" className="text-xs">
                    Payment Cards (comma-separated)
                  </Label>
                  <Input
                    id="treePayment"
                    value={treePaymentCards}
                    onChange={(e) => setTreePaymentCards(e.target.value)}
                    placeholder="tree-birch-2, tree-oak-3"
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={() => handleAction(playTree)}
                  disabled={loading || !currentPlayer || !treeCardId}
                  className="w-full"
                  size="sm"
                >
                  Play Tree
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Play Dweller</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="dwellerCard" className="text-xs">
                    Dweller Card ID
                  </Label>
                  <Input
                    id="dwellerCard"
                    value={dwellerCardId}
                    onChange={(e) => setDwellerCardId(e.target.value)}
                    placeholder="dweller-bird-1"
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="treeIndex" className="text-xs">
                      Tree Index
                    </Label>
                    <Input
                      id="treeIndex"
                      type="number"
                      value={dwellerTreeIndex}
                      onChange={(e) => setDwellerTreeIndex(e.target.value)}
                      min="0"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Position</Label>
                    <select
                      value={dwellerPosition}
                      onChange={(e) =>
                        setDwellerPosition(
                          e.target.value as "TOP" | "BOTTOM" | "LEFT" | "RIGHT",
                        )
                      }
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="TOP">Top</option>
                      <option value="BOTTOM">Bottom</option>
                      <option value="LEFT">Left</option>
                      <option value="RIGHT">Right</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="dwellerPayment" className="text-xs">
                    Payment Cards (comma-separated)
                  </Label>
                  <Input
                    id="dwellerPayment"
                    value={dwellerPaymentCards}
                    onChange={(e) => setDwellerPaymentCards(e.target.value)}
                    placeholder="tree-oak-2"
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={() => handleAction(playDweller)}
                  disabled={loading || !currentPlayer || !dwellerCardId}
                  className="w-full"
                  size="sm"
                >
                  Play Dweller
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">End Turn</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleAction(endTurn)}
                  disabled={loading || !currentPlayer}
                  className="w-full"
                  size="sm"
                >
                  End Turn
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Query Tab */}
          <TabsContent value="query" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Game State</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleAction(getGameState)}
                  disabled={loading}
                  className="w-full"
                  size="sm"
                >
                  Get Game State
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Event History</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleAction(getEvents)}
                  disabled={loading}
                  className="w-full"
                  size="sm"
                >
                  Get Events (50 recent)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="mt-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">API Health Check</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleAction(healthCheck)}
                  disabled={loading}
                  className="w-full"
                  size="sm"
                >
                  Check API Health
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
