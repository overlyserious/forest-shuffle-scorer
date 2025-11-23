'use client';

import React, { useState, useEffect } from 'react';
import { LabeledMarker, InferenceResult, CalibrationData } from '@/types/image-scorer';
import { inferForest } from '@/lib/spatial-inference';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { ReconstructedForestVisual } from './ReconstructedForestVisual';

type SpatialInferenceResultsProps = {
  labeledMarkers: LabeledMarker[];
  calibrationData: CalibrationData;
};

export function SpatialInferenceResults({
  labeledMarkers,
  calibrationData,
}: SpatialInferenceResultsProps) {
  const [thresholdMultiplier, setThresholdMultiplier] = useState(0.75);
  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);

  // Auto-run inference when inputs change
  useEffect(() => {
    if (labeledMarkers.length > 0) {
      runInference();
    }
  }, [labeledMarkers, thresholdMultiplier]);

  function runInference() {
    const result = inferForest(
      labeledMarkers,
      calibrationData.distance,
      thresholdMultiplier
    );
    setInferenceResult(result);
  }

  function exportJSON() {
    if (!inferenceResult) return;

    const exportData = {
      calibration: {
        cardSizePixels: calibrationData.distance,
        thresholdMultiplier,
      },
      markers: labeledMarkers,
      inference: {
        assignments: inferenceResult.assignments.map(a => ({
          treeCardId: a.tree.cardId,
          dwellerCardId: a.dweller.cardId,
          slot: a.slot,
          distance: a.distance,
        })),
        conflicts: inferenceResult.conflicts,
        errors: inferenceResult.errors,
      },
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forest-inference-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasErrors = inferenceResult && (inferenceResult.errors.length > 0 || inferenceResult.conflicts.length > 0);
  const isValid = inferenceResult && !hasErrors;

  return (
    <div className="space-y-6">
      {/* Threshold Control */}
      <Card>
        <CardHeader>
          <CardTitle>Distance Threshold</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Max distance from tree center
              </span>
              <Badge variant="outline">
                {thresholdMultiplier.toFixed(2)}x card size ({(calibrationData.distance * thresholdMultiplier).toFixed(1)}px)
              </Badge>
            </div>
            <Slider
              value={[thresholdMultiplier]}
              onValueChange={([value]) => setThresholdMultiplier(value)}
              min={0.3}
              max={1.5}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.3x (strict)</span>
              <span>1.5x (loose)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      {inferenceResult && (
        <Alert variant={isValid ? 'default' : 'destructive'}>
          <AlertDescription className="flex items-center gap-2">
            {isValid ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  Inference successful! {inferenceResult.assignments.length} dwellers assigned to trees.
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>
                  Found {inferenceResult.errors.length} errors and {inferenceResult.conflicts.length} conflicts.
                </span>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Errors */}
      {inferenceResult && inferenceResult.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Errors ({inferenceResult.errors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inferenceResult.errors.map((error, idx) => (
                <div key={idx} className="p-3 border-l-4 border-red-500 bg-red-50 text-sm">
                  <div className="font-medium">{error.dweller.cardId}</div>
                  <div className="text-muted-foreground">{error.details}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflicts */}
      {inferenceResult && inferenceResult.conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Slot Conflicts ({inferenceResult.conflicts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inferenceResult.conflicts.map((conflict, idx) => (
                <div key={idx} className="p-3 border-l-4 border-orange-500 bg-orange-50 text-sm space-y-1">
                  <div className="font-medium">
                    {conflict.tree.cardId} - {conflict.slot} slot
                  </div>
                  <div className="text-muted-foreground">
                    Multiple dwellers competing for this slot:
                  </div>
                  <ul className="list-disc list-inside ml-2">
                    {conflict.dwellers.map((d, dIdx) => (
                      <li key={dIdx}>
                        {d.marker.cardId} (distance: {d.distance.toFixed(1)}px)
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Reconstruction */}
      {inferenceResult && inferenceResult.assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reconstructed Forest</CardTitle>
          </CardHeader>
          <CardContent>
            <ReconstructedForestVisual inferenceResult={inferenceResult} />
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      {inferenceResult && (
        <div className="flex justify-end">
          <Button onClick={exportJSON} className="gap-2">
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
        </div>
      )}
    </div>
  );
}