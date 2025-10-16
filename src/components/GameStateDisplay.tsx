"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StateResponse } from "@/types/api";

interface GameStateDisplayProps {
  gameState: StateResponse | null;
  gameId: string | null;
}

function formatCardName(cardId: string): string {
  // Format card IDs like "tree-oak-1" to "Oak Tree #1"
  const parts = cardId.split("-");
  if (parts.length >= 2) {
    const type = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const name = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    const number = parts[2] || "";
    return `${name} ${type}${number ? ` #${number}` : ""}`;
  }
  return cardId;
}

export function GameStateDisplay({
  gameState,
  gameId,
}: GameStateDisplayProps) {
  if (!gameState || !gameId) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Game State</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create a game and start playing to see the game state here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const state = gameState.state.state;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {/* Game Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Game Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Game ID:</span>
              <span className="font-mono text-xs">{gameId.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge>{gameState.state.status}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Phase:</span>
              <Badge variant="outline">{state.phase}</Badge>
            </div>
            {state.current_player_id && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Player:</span>
                <Badge variant="secondary">{state.current_player_id}</Badge>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Winter Cards:</span>
              <Badge variant="destructive">
                {state.winter_cards_revealed} / 3
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Deck & Clearing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Deck & Clearing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Deck
                </span>
                <Badge variant="outline">{state.deck.length} cards</Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Clearing
                </span>
                <Badge variant="outline">{state.clearing.length} cards</Badge>
              </div>
              {state.clearing.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {state.clearing.slice(0, 5).map((cardId, i) => (
                    <Badge key={`${cardId}-${i}`} variant="secondary" className="text-xs">
                      {formatCardName(cardId)}
                    </Badge>
                  ))}
                  {state.clearing.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{state.clearing.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Players */}
        {Object.entries(state.players).map(([playerId, playerState]) => (
          <Card
            key={playerId}
            className={
              state.current_player_id === playerId
                ? "border-primary shadow-md"
                : ""
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{playerId}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Score: {playerState.score}</Badge>
                  {state.current_player_id === playerId && (
                    <Badge className="bg-green-600">Active</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Hand */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Hand
                  </span>
                  <Badge variant="outline">{playerState.hand.length} cards</Badge>
                </div>
                {playerState.hand.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {playerState.hand.map((cardId, i) => (
                      <Badge key={`${cardId}-${i}`} className="text-xs">
                        {formatCardName(cardId)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Trees */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Trees
                  </span>
                  <Badge variant="outline">{playerState.trees.length} trees</Badge>
                </div>
                {playerState.trees.length > 0 && (
                  <div className="space-y-2">
                    {playerState.trees.map((tree, treeIndex) => (
                      <div
                        key={`${tree.card_id}-${treeIndex}`}
                        className="border rounded-md p-2 bg-muted/50"
                      >
                        <div className="text-xs font-medium mb-1">
                          {formatCardName(tree.card_id)}
                        </div>
                        {/* Dwellers Grid */}
                        <div className="grid grid-cols-3 gap-1 mt-2">
                          <div className="col-start-2 text-center">
                            {tree.dwellers.TOP && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                ⬆ {formatCardName(tree.dwellers.TOP)}
                              </Badge>
                            )}
                          </div>
                          <div className="col-start-1 text-center">
                            {tree.dwellers.LEFT && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                ⬅ {formatCardName(tree.dwellers.LEFT)}
                              </Badge>
                            )}
                          </div>
                          <div className="col-start-3 text-center">
                            {tree.dwellers.RIGHT && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                ➡ {formatCardName(tree.dwellers.RIGHT)}
                              </Badge>
                            )}
                          </div>
                          <div className="col-start-2 text-center">
                            {tree.dwellers.BOTTOM && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                ⬇ {formatCardName(tree.dwellers.BOTTOM)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
