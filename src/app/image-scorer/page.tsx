'use client';

import React, { useState } from 'react';
import { Marker, LabeledMarker, CalibrationData } from '@/types/image-scorer';
import { ImageAnnotator } from '@/components/ImageAnnotator';
import { CardLabeler } from '@/components/CardLabeler';
import { SpatialInferenceResults } from '@/components/SpatialInferenceResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle } from 'lucide-react';

type Step = 'upload' | 'calibrate' | 'place-markers' | 'label-cards' | 'infer';

export default function ImageScorerPage() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [labeledMarkers, setLabeledMarkers] = useState<LabeledMarker[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | undefined>(undefined);

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
  }

  function handleCalibrationComplete(data: CalibrationData) {
    setCalibrationData(data);
    setCurrentStep('place-markers');
  }

  function handleProceedToLabeling() {
    if (markers.length === 0) {
      alert('Please place at least one marker before proceeding.');
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
              <ImageAnnotator
                imageUrl={imageUrl}
                mode="place-markers"
                markers={markers}
                onMarkersChange={setMarkers}
                calibrationData={calibrationData}
                onCalibrationComplete={() => {}}
                selectedMarkerId={selectedMarkerId}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('calibrate')}>
                  Back to Calibration
                </Button>
                <Button onClick={handleProceedToLabeling}>
                  Proceed to Labeling
                  <Badge className="ml-2">{markers.length} markers</Badge>
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