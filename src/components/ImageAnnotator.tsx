'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Marker, CalibrationData } from '@/types/image-scorer';
import { calculateDistance } from '@/lib/spatial-inference';

type ImageAnnotatorProps = {
  imageUrl: string;
  mode: 'calibrate' | 'place-markers';
  markers: Marker[];
  onMarkersChange: (markers: Marker[]) => void;
  calibrationData: CalibrationData | null;
  onCalibrationComplete: (data: CalibrationData) => void;
  selectedMarkerId?: string;
};

export function ImageAnnotator({
  imageUrl,
  mode,
  markers,
  onMarkersChange,
  calibrationData,
  onCalibrationComplete,
  selectedMarkerId,
}: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [calibrationPoint1, setCalibrationPoint1] = useState<{ x: number; y: number } | null>(null);
  const [draggedMarkerId, setDraggedMarkerId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Set canvas to match image aspect ratio, max 800px wide
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.width);
      setCanvasSize({
        width: img.width * scale,
        height: img.height * scale,
      });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw calibration points
    if (mode === 'calibrate') {
      if (calibrationPoint1) {
        drawPoint(ctx, calibrationPoint1, 'blue', 8);
      }
      if (calibrationData) {
        drawPoint(ctx, calibrationData.point1, 'blue', 8);
        drawPoint(ctx, calibrationData.point2, 'blue', 8);
        drawLine(ctx, calibrationData.point1, calibrationData.point2, 'blue');
        
        // Show distance label
        const midX = (calibrationData.point1.x + calibrationData.point2.x) / 2;
        const midY = (calibrationData.point1.y + calibrationData.point2.y) / 2;
        ctx.fillStyle = 'blue';
        ctx.font = '14px sans-serif';
        ctx.fillText(`${calibrationData.distance.toFixed(1)}px`, midX + 10, midY);
      }
    }

    // Draw markers
    if (mode === 'place-markers') {
      markers.forEach(marker => {
        const isSelected = marker.id === selectedMarkerId;
        const color = isSelected ? 'yellow' : 'green';
        const size = isSelected ? 10 : 8;
        drawPoint(ctx, marker, color, size);
        
        // Draw marker label
        ctx.fillStyle = color;
        ctx.font = '12px sans-serif';
        ctx.fillText(marker.id, marker.x + 10, marker.y - 10);
      });
    }
  }, [image, mode, markers, calibrationPoint1, calibrationData, selectedMarkerId, canvasSize]);

  function drawPoint(
    ctx: CanvasRenderingContext2D,
    point: { x: number; y: number },
    color: string,
    radius: number
  ) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawLine(
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    color: string
  ) {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function getCanvasCoordinates(e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const coords = getCanvasCoordinates(e);

    if (mode === 'calibrate') {
      if (!calibrationPoint1) {
        // First point
        setCalibrationPoint1(coords);
      } else {
        // Second point - complete calibration
        const distance = calculateDistance(calibrationPoint1, coords);
        onCalibrationComplete({
          point1: calibrationPoint1,
          point2: coords,
          distance,
        });
        setCalibrationPoint1(null);
      }
    } else if (mode === 'place-markers') {
      // Check if clicking near existing marker (within 15px) to avoid accidental placements
      const nearbyMarker = markers.find(m => calculateDistance(m, coords) < 15);
      
      if (!nearbyMarker) {
        // Add new marker
        const newMarker: Marker = {
          id: `marker-${Date.now()}`,
          x: coords.x,
          y: coords.y,
        };
        onMarkersChange([...markers, newMarker]);
      }
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (mode !== 'place-markers') return;

    const coords = getCanvasCoordinates(e);
    
    // Check if clicking on a marker
    const clickedMarker = markers.find(m => calculateDistance(m, coords) < 15);
    
    if (clickedMarker) {
      setDraggedMarkerId(clickedMarker.id);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (mode !== 'place-markers' || !draggedMarkerId) return;

    const coords = getCanvasCoordinates(e);
    
    // Update dragged marker position
    onMarkersChange(
      markers.map(m => (m.id === draggedMarkerId ? { ...m, x: coords.x, y: coords.y } : m))
    );
  }

  function handleMouseUp() {
    setDraggedMarkerId(null);
  }

  if (!image) {
    return <div className="flex items-center justify-center h-96 text-muted-foreground">Loading image...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border rounded-lg overflow-hidden bg-muted/50">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-crosshair"
          style={{ display: 'block', maxWidth: '100%' }}
        />
      </div>
      
      <div className="text-sm text-muted-foreground">
        {mode === 'calibrate' && !calibrationData && (
          <p>
            {calibrationPoint1
              ? '✓ First point placed. Click on the opposite corner of the same card.'
              : 'Click on one corner of any card, then click on the opposite corner to set card size.'}
          </p>
        )}
        {mode === 'calibrate' && calibrationData && (
          <p className="text-green-600">
            ✓ Calibration complete: Card size = {calibrationData.distance.toFixed(1)}px
          </p>
        )}
        {mode === 'place-markers' && (
          <p>
            Click on card centers to place markers. Drag markers to adjust position. {markers.length} markers placed.
          </p>
        )}
      </div>
    </div>
  );
}