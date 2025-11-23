'use client';

import React from 'react';
import { Marker, LabeledMarker } from '@/types/image-scorer';
import { MVP_CARDS, CardType } from '@/types/cards';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

type CardLabelerProps = {
  markers: Marker[];
  labeledMarkers: LabeledMarker[];
  onLabeledMarkersChange: (labeled: LabeledMarker[]) => void;
  onMarkerSelect: (markerId: string) => void;
  selectedMarkerId?: string;
};

export function CardLabeler({
  markers,
  labeledMarkers,
  onLabeledMarkersChange,
  onMarkerSelect,
  selectedMarkerId,
}: CardLabelerProps) {
  // Get all trees and dwellers from MVP_CARDS
  const treeCards = MVP_CARDS.filter(c => c.cardType === CardType.TREE);
  const dwellerCards = MVP_CARDS.filter(c => c.cardType === CardType.DWELLER);

  function handleCardIdChange(markerId: string, cardId: string) {
    const marker = markers.find(m => m.id === markerId);
    if (!marker) return;

    // Remove existing label for this marker if any
    const withoutCurrent = labeledMarkers.filter(lm => lm.id !== markerId);
    
    // Add new label
    onLabeledMarkersChange([
      ...withoutCurrent,
      { ...marker, cardId },
    ]);
  }

  function handleRemoveMarker(markerId: string) {
    // Remove from labeled markers
    onLabeledMarkersChange(labeledMarkers.filter(lm => lm.id !== markerId));
  }

  function getLabelForMarker(markerId: string): string | undefined {
    return labeledMarkers.find(lm => lm.id === markerId)?.cardId;
  }

  function getCardType(markerId: string): CardType | null {
    const cardId = getLabelForMarker(markerId);
    if (!cardId) return null;
    
    const card = MVP_CARDS.find(c => c.id === cardId);
    return card?.cardType || null;
  }

  function formatCardName(cardId: string): string {
    const card = MVP_CARDS.find(c => c.id === cardId);
    return card ? `${card.name} (${card.id})` : cardId;
  }

  const labeledCount = labeledMarkers.length;
  const totalCount = markers.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Label Card Markers</h3>
        <Badge variant={labeledCount === totalCount ? 'default' : 'secondary'}>
          {labeledCount} / {totalCount} labeled
        </Badge>
      </div>

      <ScrollArea className="h-96 border rounded-lg p-4">
        <div className="space-y-3">
          {markers.map(marker => {
            const cardId = getLabelForMarker(marker.id);
            const cardType = getCardType(marker.id);
            const isSelected = marker.id === selectedMarkerId;

            return (
              <div
                key={marker.id}
                className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                  isSelected ? 'bg-yellow-50 border-yellow-300' : 'bg-background hover:bg-muted/50'
                }`}
                onClick={() => onMarkerSelect(marker.id)}
              >
                <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
                  {marker.id}
                </div>

                <div className="flex-1">
                  {!cardType ? (
                    // First dropdown: Choose card type
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value === 'tree') {
                          // Set to first tree for now, user will refine
                          handleCardIdChange(marker.id, treeCards[0].id);
                        } else if (value === 'dweller') {
                          handleCardIdChange(marker.id, dwellerCards[0].id);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select card type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tree">Tree</SelectItem>
                        <SelectItem value="dweller">Dweller</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    // Second dropdown: Choose specific card
                    <Select value={cardId} onValueChange={(value) => handleCardIdChange(marker.id, value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {cardId ? formatCardName(cardId) : 'Select card...'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {cardType === CardType.TREE &&
                          treeCards.map(card => (
                            <SelectItem key={card.id} value={card.id}>
                              {card.name} ({card.id})
                            </SelectItem>
                          ))}
                        {cardType === CardType.DWELLER &&
                          dwellerCards.map(card => (
                            <SelectItem key={card.id} value={card.id}>
                              {card.name} - {card.position} ({card.id})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveMarker(marker.id);
                  }}
                  className="flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {markers.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No markers placed yet. Go back to place markers on the image.
        </div>
      )}
    </div>
  );
}