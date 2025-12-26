'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Marker, LabeledMarker, CalibrationData, DetectedCard, DetectedCorner, DetectionMethod, VisionDetectionResult } from '@/types/image-scorer';
import { ImageAnnotator } from '@/components/ImageAnnotator';
import { CardLabeler } from '@/components/CardLabeler';
import { SpatialInferenceResults } from '@/components/SpatialInferenceResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { useOpenCV } from '@/lib/opencv-loader';
import { detectCards, deduplicateDetections } from '@/lib/card-detection';
import { detectCorners, detectCardsViaCorners } from '@/lib/corner-detection';

type Step = 'upload' | 'calibrate' | 'place-markers' | 'label-cards' | 'infer';

export default function ImageScorerPage() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [labeledMarkers, setLabeledMarkers] = useState<LabeledMarker[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | undefined>(undefined);

  // Detection state
  const [detectionMethod, setDetectionMethod] = useState<DetectionMethod>("corner");
  const [detectedCards, setDetectedCards] = useState<DetectedCard[]>([]);
  const [detectedCorners, setDetectedCorners] = useState<DetectedCorner[]>([]);
  const [visionResult, setVisionResult] = useState<VisionDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // OpenCV loader
  const { cv, isReady: isOpenCVReady, isLoading: isOpenCVLoading, error: openCVError } = useOpenCV();

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setCurrentStep('calibrate');

    // Reset state when new image is uploaded
    setCalibrationData(null);
    setMarkers([]);
    setLabeledMarkers([]);
    setDetectedCards([]);
    setDetectedCorners([]);
    setVisionResult(null);
    setDetectionError(null);

    // Load image for detection
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
    };
    img.src = url;
  }

  // Convert image to base64 for vision API
  const getImageBase64 = useCallback((): string | null => {
    if (!imageRef.current) return null;

    const canvas = document.createElement('canvas');
    const maxSize = 1024; // Limit size for API
    let width = imageRef.current.width;
    let height = imageRef.current.height;

    if (width > maxSize || height > maxSize) {
      const scale = maxSize / Math.max(width, height);
      width *= scale;
      height *= scale;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(imageRef.current, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // Vision detection via API
  const handleVisionDetect = useCallback(async () => {
    const imageBase64 = getImageBase64();
    if (!imageBase64) {
      setDetectionError('Failed to process image');
      return;
    }

    setIsDetecting(true);
    setDetectionError(null);

    try {
      const response = await fetch('/api/detect-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Vision detection failed');
      }

      const result: VisionDetectionResult = await response.json();
      setVisionResult(result);

      // Convert vision results to detected cards for display
      if (result.cards.length > 0 && imageRef.current) {
        const imgWidth = imageRef.current.width;
        const imgHeight = imageRef.current.height;
        // Scale to canvas size (max 800px width)
        const scale = Math.min(1, 800 / imgWidth);

        const cards: DetectedCard[] = result.cards.map((card, index) => ({
          id: card.id || `vision-${index}`,
          x: card.x * imgWidth * scale,
          y: card.y * imgHeight * scale,
          width: 60 * scale, // Approximate card width
          height: 84 * scale, // Approximate card height
          angle: 0,
          confidence: card.confidence,
        }));
        setDetectedCards(cards);
      }

      setDetectedCorners([]);
      console.log(`Vision detected ${result.cards.length} cards`);
    } catch (err) {
      console.error('Vision detection error:', err);
      setDetectionError(err instanceof Error ? err.message : 'Vision detection failed');
    } finally {
      setIsDetecting(false);
    }
  }, [getImageBase64]);

  const handleDetect = useCallback(() => {
    // Vision detection doesn't need OpenCV
    if (detectionMethod === "vision") {
      handleVisionDetect();
      return;
    }

    if (!cv || !imageRef.current) {
      setDetectionError('OpenCV not ready or image not loaded');
      return;
    }

    setIsDetecting(true);
    setDetectionError(null);
    setVisionResult(null); // Clear vision results

    // Use setTimeout to allow UI to update before heavy processing
    setTimeout(() => {
      try {
        // Calculate scale factor (canvas is max 800px wide)
        const imgWidth = imageRef.current!.width;
        const imgHeight = imageRef.current!.height;
        const maxCanvasWidth = 800;
        const scale = Math.min(1, maxCanvasWidth / imgWidth);

        if (detectionMethod === "corner") {
          // Corner-based detection
          // Use scaled card height for detection since calibration was done on scaled canvas
          const expectedCardHeight = (calibrationData?.distance || 100) / scale;

          // First detect corners
          const cornerResult = detectCorners(cv, imageRef.current!, {
            expectedCardHeight,
            maxCorners: 300,
            qualityLevel: 0.01,
            minDistance: expectedCardHeight * 0.1,
          });

          // Scale corners to canvas coordinates
          const scaledCorners = cornerResult.corners.map(c => ({
            ...c,
            x: c.x * scale,
            y: c.y * scale,
          }));
          setDetectedCorners(scaledCorners);

          // Then infer cards from corners
          const cardResult = detectCardsViaCorners(cv, imageRef.current!, expectedCardHeight);

          // Scale cards to canvas coordinates
          const scaledCards = cardResult.cards.map(card => ({
            ...card,
            x: card.x * scale,
            y: card.y * scale,
            width: card.width * scale,
            height: card.height * scale,
          }));
          setDetectedCards(scaledCards);

          console.log(`Detected ${cornerResult.corners.length} corners and ${cardResult.cards.length} cards in ${cardResult.processingTimeMs.toFixed(0)}ms`);
        } else {
          // Contour-based detection
          const result = detectCards(cv, imageRef.current!);
          const dedupedCards = deduplicateDetections(result.cards);

          // Scale cards to canvas coordinates
          const scaledCards = dedupedCards.map(card => ({
            ...card,
            x: card.x * scale,
            y: card.y * scale,
            width: card.width * scale,
            height: card.height * scale,
          }));
          setDetectedCards(scaledCards);
          setDetectedCorners([]); // Clear corners when using contour method
          console.log(`Detected ${dedupedCards.length} cards in ${result.processingTimeMs.toFixed(0)}ms`);
        }
      } catch (err) {
        console.error('Detection error:', err);
        setDetectionError(err instanceof Error ? err.message : 'Detection failed');
      } finally {
        setIsDetecting(false);
      }
    }, 50);
  }, [cv, detectionMethod, calibrationData, handleVisionDetect]);

  function handleCalibrationComplete(data: CalibrationData) {
    setCalibrationData(data);
    setCurrentStep('place-markers');
  }

  function handleProceedToLabeling() {
    // If no manual markers but detected cards exist, convert them to markers
    if (markers.length === 0 && detectedCards.length > 0) {
      handleUseDetectedAsMarkers();
    } else if (markers.length === 0) {
      alert('Please place at least one marker or detect cards before proceeding.');
      return;
    }
    setCurrentStep('label-cards');
  }

  function handleProceedToInference() {
    const allLabeled = markers.every(m => labeledMarkers.some(lm => lm.id === m.id));
    if (!allLabeled) {
      alert('Please label all markers before proceeding to inference.');
      return;
    }
    setCurrentStep('infer');
  }

  function handleReset() {
    setCurrentStep('upload');
    setImageUrl(null);
    setCalibrationData(null);
    setMarkers([]);
    setLabeledMarkers([]);
    setSelectedMarkerId(undefined);
    setDetectedCards([]);
    setDetectedCorners([]);
    setVisionResult(null);
    setDetectionError(null);
    imageRef.current = null;
  }

  // Convert detected cards to markers for labeling step
  function handleUseDetectedAsMarkers() {
    const newMarkers: Marker[] = detectedCards.map((card, index) => ({
      id: `detected-${index}`,
      x: card.x,
      y: card.y,
    }));
    setMarkers(newMarkers);
  }

  const steps: Array<{ id: Step; label: string; description: string }> = [
    { id: 'upload', label: 'Upload Image', description: 'Upload a photo of finished game' },
    { id: 'calibrate', label: 'Calibrate', description: 'Set card size reference' },
    { id: 'place-markers', label: 'Place Markers', description: 'Click on card centers' },
    { id: 'label-cards', label: 'Label Cards', description: 'Identify each card' },
    { id: 'infer', label: 'Infer & Score', description: 'Reconstruct forest structure' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Forest Shuffle Image Scorer</h1>
        <p className="text-muted-foreground">
          Upload a photo of a finished game and let the app reconstruct the forest and calculate the score.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const isComplete = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      isComplete
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isComplete ? <CheckCircle className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="text-xs mt-2 text-center max-w-[100px]">
                    <div className={isCurrent ? 'font-medium' : ''}>{step.label}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      isComplete ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStepIndex].label}</CardTitle>
          <CardDescription>{steps[currentStepIndex].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Click to upload image</p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, or WEBP (max 10MB)
                  </p>
                </label>
              </div>
            </div>
          )}

          {currentStep === 'calibrate' && imageUrl && (
            <div className="space-y-4">
              <ImageAnnotator
                imageUrl={imageUrl}
                mode="calibrate"
                markers={[]}
                onMarkersChange={() => {}}
                calibrationData={calibrationData}
                onCalibrationComplete={handleCalibrationComplete}
              />
            </div>
          )}

          {currentStep === 'place-markers' && imageUrl && calibrationData && (
            <div className="space-y-4">
              {/* OpenCV loading status */}
              {isOpenCVLoading && (
                <Alert>
                  <AlertDescription>Loading OpenCV.js for card detection...</AlertDescription>
                </Alert>
              )}
              {openCVError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Failed to load OpenCV: {openCVError}</AlertDescription>
                </Alert>
              )}

              <ImageAnnotator
                imageUrl={imageUrl}
                mode="place-markers"
                markers={markers}
                onMarkersChange={setMarkers}
                calibrationData={calibrationData}
                onCalibrationComplete={() => {}}
                selectedMarkerId={selectedMarkerId}
                detectedCards={detectedCards}
                detectedCorners={detectedCorners}
                showBoundingBoxes={true}
                showCorners={true}
                detectionMethod={detectionMethod}
                onDetectionMethodChange={setDetectionMethod}
                onDetect={detectionMethod === "vision" || isOpenCVReady ? handleDetect : undefined}
                isDetecting={isDetecting}
                detectionError={detectionError}
              />

              {/* Actions for detected cards/corners */}
              {(detectedCards.length > 0 || detectedCorners.length > 0) && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <span className="text-sm">
                    {detectedCorners.length > 0 && `${detectedCorners.length} corners`}
                    {detectedCorners.length > 0 && detectedCards.length > 0 && ', '}
                    {detectedCards.length > 0 && `${detectedCards.length} cards detected`}
                  </span>
                  {detectedCards.length > 0 && (
                    <Button size="sm" variant="secondary" onClick={handleUseDetectedAsMarkers}>
                      Use Cards as Markers
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setDetectedCards([]); setDetectedCorners([]); setVisionResult(null); }}>
                    Clear Detection
                  </Button>
                </div>
              )}

              {/* Vision AI Results */}
              {visionResult && visionResult.cards.length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-purple-800">Vision AI Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {visionResult.cards.map((card) => (
                      <div
                        key={card.id}
                        className={`text-xs p-2 rounded ${
                          card.cardType === 'tree'
                            ? 'bg-green-100 text-green-800'
                            : card.cardType === 'dweller'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="font-medium">{card.cardName || 'Unknown'}</div>
                        <div className="opacity-75">
                          {card.cardType}
                          {card.position && ` • ${card.position}`}
                        </div>
                        {card.attachedTo && (
                          <div className="opacity-60 text-[10px]">→ {card.attachedTo}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {visionResult.relationships.length > 0 && (
                    <div className="text-xs text-purple-700">
                      <span className="font-medium">Relationships:</span>{' '}
                      {visionResult.relationships.map((r, i) => (
                        <span key={i}>
                          {r.dwellerId} → {r.treeId} ({r.slot})
                          {i < visionResult.relationships.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('calibrate')}>
                  Back to Calibration
                </Button>
                <Button onClick={handleProceedToLabeling} disabled={markers.length === 0 && detectedCards.length === 0}>
                  Proceed to Labeling
                  <Badge className="ml-2">{markers.length || detectedCards.length} markers</Badge>
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'label-cards' && imageUrl && calibrationData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ImageAnnotator
                  imageUrl={imageUrl}
                  mode="place-markers"
                  markers={markers}
                  onMarkersChange={setMarkers}
                  calibrationData={calibrationData}
                  onCalibrationComplete={() => {}}
                  selectedMarkerId={selectedMarkerId}
                />
              </div>
              <div>
                <CardLabeler
                  markers={markers}
                  labeledMarkers={labeledMarkers}
                  onLabeledMarkersChange={setLabeledMarkers}
                  onMarkerSelect={setSelectedMarkerId}
                  selectedMarkerId={selectedMarkerId}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setCurrentStep('place-markers')}>
                    Back to Markers
                  </Button>
                  <Button onClick={handleProceedToInference}>
                    Run Inference
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'infer' && calibrationData && (
            <div className="space-y-4">
              <SpatialInferenceResults
                labeledMarkers={labeledMarkers}
                calibrationData={calibrationData}
              />
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('label-cards')}>
                  Back to Labeling
                </Button>
                <Button variant="destructive" onClick={handleReset}>
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}