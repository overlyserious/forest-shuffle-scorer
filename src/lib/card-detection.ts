import type { DetectedCard, DetectionOptions, DetectionResult } from "@/types/image-scorer";

// Default detection options tuned for playing cards
export const DEFAULT_DETECTION_OPTIONS: DetectionOptions = {
  minAreaRatio: 0.003, // Cards should be at least 0.3% of image
  maxAreaRatio: 0.12, // Cards should be at most 12% of image
  minAspectRatio: 0.55, // Standard card is ~63/88 = 0.72
  maxAspectRatio: 0.95, // Allow some variance
  cannyThreshold1: 30,
  cannyThreshold2: 100,
};

/**
 * Detect cards in an image using OpenCV.js
 * Requires OpenCV.js to be loaded (use useOpenCV hook)
 */
export function detectCards(
  cv: typeof window.cv,
  imageSource: HTMLImageElement | HTMLCanvasElement,
  options: Partial<DetectionOptions> = {}
): DetectionResult {
  const opts = { ...DEFAULT_DETECTION_OPTIONS, ...options };
  const startTime = performance.now();

  // Read image into OpenCV Mat
  const src = cv.imread(imageSource);
  const imageArea = src.rows * src.cols;
  const imageSize = { width: src.cols, height: src.rows };

  // Convert to grayscale
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // Apply Gaussian blur to reduce noise
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

  // Edge detection
  const edges = new cv.Mat();
  cv.Canny(blurred, edges, opts.cannyThreshold1, opts.cannyThreshold2);

  // Dilate to close gaps in edges
  const dilated = new cv.Mat();
  const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  cv.dilate(edges, dilated, kernel);

  // Find contours
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const detectedCards: DetectedCard[] = [];
  const minArea = imageArea * opts.minAreaRatio;
  const maxArea = imageArea * opts.maxAreaRatio;

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);

    // Filter by area
    if (area < minArea || area > maxArea) {
      continue;
    }

    // Get rotated bounding rectangle
    const rotatedRect = cv.minAreaRect(contour);
    let width = rotatedRect.size.width;
    let height = rotatedRect.size.height;
    let angle = rotatedRect.angle;

    // Normalize so width < height (portrait orientation for cards)
    if (width > height) {
      [width, height] = [height, width];
      angle = angle + 90;
    }

    // Calculate aspect ratio
    const aspectRatio = width / height;

    // Filter by aspect ratio
    if (aspectRatio < opts.minAspectRatio || aspectRatio > opts.maxAspectRatio) {
      continue;
    }

    // Calculate confidence based on how rectangular the contour is
    const rectArea = width * height;
    const rectangularity = area / rectArea;

    // Skip if not rectangular enough (< 70% filled)
    if (rectangularity < 0.7) {
      continue;
    }

    // Confidence score based on rectangularity and aspect ratio match
    const idealAspect = 0.72; // Standard card ratio
    const aspectScore = 1 - Math.abs(aspectRatio - idealAspect) / 0.3;
    const confidence = (rectangularity * 0.5 + aspectScore * 0.5);

    detectedCards.push({
      id: `detected-${i}-${Date.now()}`,
      x: rotatedRect.center.x,
      y: rotatedRect.center.y,
      width,
      height,
      angle: angle % 360,
      confidence: Math.max(0, Math.min(1, confidence)),
    });
  }

  // Sort by confidence (highest first)
  detectedCards.sort((a, b) => b.confidence - a.confidence);

  // Cleanup OpenCV Mats
  src.delete();
  gray.delete();
  blurred.delete();
  edges.delete();
  dilated.delete();
  kernel.delete();
  contours.delete();
  hierarchy.delete();

  const processingTimeMs = performance.now() - startTime;

  return {
    cards: detectedCards,
    processingTimeMs,
    imageSize,
  };
}

/**
 * Filter out overlapping detections, keeping the one with higher confidence
 */
export function deduplicateDetections(
  cards: DetectedCard[],
  overlapThreshold = 0.5
): DetectedCard[] {
  const kept: DetectedCard[] = [];

  for (const card of cards) {
    let isDuplicate = false;

    for (const existing of kept) {
      const overlap = calculateOverlap(card, existing);
      if (overlap > overlapThreshold) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      kept.push(card);
    }
  }

  return kept;
}

/**
 * Calculate overlap ratio between two detected cards (0 to 1)
 */
function calculateOverlap(a: DetectedCard, b: DetectedCard): number {
  // Simplified overlap using center distance relative to size
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  const avgWidth = (a.width + b.width) / 2;
  const avgHeight = (a.height + b.height) / 2;

  const overlapX = Math.max(0, 1 - dx / avgWidth);
  const overlapY = Math.max(0, 1 - dy / avgHeight);

  return overlapX * overlapY;
}

/**
 * Convert detected cards to simple markers (for compatibility with existing system)
 */
export function detectedCardsToMarkers(cards: DetectedCard[]): DetectedCard[] {
  return cards.map((card, index) => ({
    ...card,
    id: `detected-${index}-${Date.now()}`,
  }));
}
