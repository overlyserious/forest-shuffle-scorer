'use client';

import React from 'react';
import { InferenceResult } from '@/types/image-scorer';
import { MVP_CARDS, CardPosition } from '@/types/cards';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type ReconstructedForestVisualProps = {
  inferenceResult: InferenceResult;
};

export function ReconstructedForestVisual({ inferenceResult }: ReconstructedForestVisualProps) {
  // Group assignments by tree
  const treeMap = new Map<string, {
    treeCardId: string;
    dwellers: {
      TOP?: string;
      BOTTOM?: string;
      LEFT?: string;
      RIGHT?: string;
    };
  }>();

  for (const assignment of inferenceResult.assignments) {
    const treeId = assignment.tree.cardId;
    
    if (!treeMap.has(treeId)) {
      treeMap.set(treeId, {
        treeCardId: treeId,
        dwellers: {},
      });
    }
    
    const tree = treeMap.get(treeId)!;
    tree.dwellers[assignment.slot] = assignment.dweller.cardId;
  }

  function formatCardName(cardId: string): string {
    const card = MVP_CARDS.find(c => c.id === cardId);
    return card?.name || cardId;
  }

  const trees = Array.from(treeMap.values());

  if (trees.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No trees with dwellers found.
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trees.map((tree, index) => (
          <div key={`${tree.treeCardId}-${index}`} className="border rounded-md p-4 bg-muted/50">
            {/* Tree Header */}
            <div className="text-sm font-medium mb-3 text-center">
              <Badge variant="default" className="text-xs">
                🌳 {formatCardName(tree.treeCardId)}
              </Badge>
            </div>

            {/* Dwellers Grid (3x3 with tree in center) */}
            <div className="grid grid-cols-3 gap-2">
              {/* Top Row */}
              <div className="col-start-2 flex justify-center">
                {tree.dwellers.TOP ? (
                  <Badge variant="secondary" className="text-[10px] px-2 py-1">
                    ⬆ {formatCardName(tree.dwellers.TOP)}
                  </Badge>
                ) : (
                  <div className="text-xs text-muted-foreground">-</div>
                )}
              </div>

              {/* Middle Row */}
              <div className="flex justify-center items-center">
                {tree.dwellers.LEFT ? (
                  <Badge variant="secondary" className="text-[10px] px-2 py-1">
                    ⬅ {formatCardName(tree.dwellers.LEFT)}
                  </Badge>
                ) : (
                  <div className="text-xs text-muted-foreground">-</div>
                )}
              </div>
              <div className="flex justify-center items-center">
                <div className="text-2xl">🌳</div>
              </div>
              <div className="flex justify-center items-center">
                {tree.dwellers.RIGHT ? (
                  <Badge variant="secondary" className="text-[10px] px-2 py-1">
                    ➡ {formatCardName(tree.dwellers.RIGHT)}
                  </Badge>
                ) : (
                  <div className="text-xs text-muted-foreground">-</div>
                )}
              </div>

              {/* Bottom Row */}
              <div className="col-start-2 flex justify-center">
                {tree.dwellers.BOTTOM ? (
                  <Badge variant="secondary" className="text-[10px] px-2 py-1">
                    ⬇ {formatCardName(tree.dwellers.BOTTOM)}
                  </Badge>
                ) : (
                  <div className="text-xs text-muted-foreground">-</div>
                )}
              </div>
            </div>

            {/* Slot Summary */}
            <div className="mt-3 text-xs text-muted-foreground text-center">
              {Object.keys(tree.dwellers).length} / 4 slots filled
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}