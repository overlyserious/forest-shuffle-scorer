import type { DetectedCard, DetectionResult } from "@/types/image-scorer";

// Standard playing card aspect ratio (width/height)
const CARD_ASPECT_RATIO = 0.714; // ~63/88mm

export type DetectedCorner = {
  x: number;
  y: number;
  angle: number; // Angle of the corner in degrees (0-360)
  quadrant: "TL" | "TR" | "BL" | "BR" | "unknown";
  strength: number;
};

export type CornerDetectionOptions = {
  maxCorners: number;
  qualityLevel: number;
  minDistance: number;
  expectedCardHeight: number; // Expected card height in pixels (from calibration)
};

const DEFAULT_OPTIONS: CornerDetectionOptions = {
  maxCorners: 200,
  qualityLevel: 0.01,
  minDistance: 10,
  expectedCardHeight: 100,
};

/**
 * Detect corners in an image using Shi-Tomasi corner detection
 */
export function detectCorners(
  cv: typeof window.cv,
  imageSource: HTMLImageElement | HTMLCanvasElement,
  options: Partial<CornerDetectionOptions> = {}
): { corners: DetectedCorner[]; processingTimeMs: number } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = performance.now();

  // Read image
  const src = cv.imread(imageSource);

  // Convert to grayscale
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

  // Apply slight blur to reduce noise
  const blurred = new cv.Mat();
  cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);

  // Detect corners using Shi-Tomasi
  const corners = new cv.Mat();
  cv.goodFeaturesToTrack(
    blurred,
    corners,
    opts.maxCorners,
    opts.qualityLevel,
    opts.minDistance
  );

  // Get edges for corner angle analysis
  const edges = new cv.Mat();
  cv.Canny(blurred, edges, 50, 150);

  const detectedCorners: DetectedCorner[] = [];

  // Process each detected corner
  for (let i = 0; i < corners.rows; i++) {
    const x = corners.floatAt(i, 0);
    const y = corners.floatAt(i, 1);

    // Analyze local edge pattern to determine corner quadrant
    const analysis = analyzeCornerQuadrant(edges, x, y, 15);

    detectedCorners.push({
      x,
      y,
      angle: analysis.angle,
      quadrant: analysis.quadrant,
      strength: analysis.strength,
    });
  }

  // Cleanup
  src.delete();
  gray.delete();
  blurred.delete();
  corners.delete();
  edges.delete();

  return {
    corners: detectedCorners,
    processingTimeMs: performance.now() - startTime,
  };
}

/**
 * Analyze the edge pattern around a corner to determine which quadrant of a card it represents
 */
function analyzeCornerQuadrant(
  edges: { rows: number; cols: number; ucharAt: (r: number, c: number) => number },
  cx: number,
  cy: number,
  radius: number
): { quadrant: DetectedCorner["quadrant"]; angle: number; strength: number } {
  // Sample edges in 4 quadrants around the corner
  const quadrantCounts = {
    topLeft: 0,
    topRight: 0,
    bottomLeft: 0,
    bottomRight: 0,
  };

  let totalEdges = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const px = Math.round(cx + dx);
      const py = Math.round(cy + dy);

      if (px < 0 || px >= edges.cols || py < 0 || py >= edges.rows) continue;

      const edgeVal = edges.ucharAt(py, px);
      if (edgeVal > 128) {
        totalEdges++;
        if (dx < 0 && dy < 0) quadrantCounts.topLeft++;
        else if (dx >= 0 && dy < 0) quadrantCounts.topRight++;
        else if (dx < 0 && dy >= 0) quadrantCounts.bottomLeft++;
        else quadrantCounts.bottomRight++;
      }
    }
  }

  // A card corner should have edges in exactly 2 adjacent quadrants
  // forming an "L" shape
  const counts = [
    { name: "TL" as const, edges: ["topLeft", "topRight", "bottomLeft"], count: quadrantCounts.topLeft + quadrantCounts.topRight + quadrantCounts.bottomLeft, opposite: quadrantCounts.bottomRight },
    { name: "TR" as const, edges: ["topLeft", "topRight", "bottomRight"], count: quadrantCounts.topLeft + quadrantCounts.topRight + quadrantCounts.bottomRight, opposite: quadrantCounts.bottomLeft },
    { name: "BL" as const, edges: ["topLeft", "bottomLeft", "bottomRight"], count: quadrantCounts.topLeft + quadrantCounts.bottomLeft + quadrantCounts.bottomRight, opposite: quadrantCounts.topRight },
    { name: "BR" as const, edges: ["topRight", "bottomLeft", "bottomRight"], count: quadrantCounts.topRight + quadrantCounts.bottomLeft + quadrantCounts.bottomRight, opposite: quadrantCounts.topLeft },
  ];

  // Find the pattern that best matches an "L" shape (high count in 2 adjacent, low in opposite)
  let bestMatch = counts[0];
  let bestScore = 0;

  for (const pattern of counts) {
    // Score based on edge concentration and lack of edges in opposite corner
    const score = pattern.count / (pattern.opposite + 1);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = pattern;
    }
  }

  // Calculate approximate angle based on quadrant
  const angleMap = { TL: 135, TR: 45, BL: 225, BR: 315 };
  const angle = angleMap[bestMatch.name];

  // Strength based on how clear the L-shape is
  const strength = Math.min(1, bestScore / 10);

  // Only return a quadrant if confidence is high enough
  const quadrant = strength > 0.3 ? bestMatch.name : "unknown";

  return { quadrant, angle, strength };
}

/**
 * Cluster corners that likely belong to the same card and infer card positions
 */
export function inferCardsFromCorners(
  corners: DetectedCorner[],
  expectedCardHeight: number,
  imageSize: { width: number; height: number }
): DetectedCard[] {
  const expectedCardWidth = expectedCardHeight * CARD_ASPECT_RATIO;
  const cards: DetectedCard[] = [];

  // Filter to corners with known quadrants
  const knownCorners = corners.filter((c) => c.quadrant !== "unknown" && c.strength > 0.3);

  // Track which corners have been used
  const usedCorners = new Set<number>();

  // Try to find card rectangles from corner pairs/groups
  for (let i = 0; i < knownCorners.length; i++) {
    if (usedCorners.has(i)) continue;

    const c1 = knownCorners[i];

    // Look for complementary corners that could form a card
    for (let j = i + 1; j < knownCorners.length; j++) {
      if (usedCorners.has(j)) continue;

      const c2 = knownCorners[j];

      // Check if these corners could be diagonal corners of the same card
      const cardCandidate = tryFormCard(c1, c2, expectedCardWidth, expectedCardHeight);

      if (cardCandidate) {
        usedCorners.add(i);
        usedCorners.add(j);
        cards.push({
          id: `corner-card-${cards.length}-${Date.now()}`,
          ...cardCandidate,
        });
        break;
      }
    }

    // If no pair found, try to infer card from single corner
    if (!usedCorners.has(i)) {
      const singleCardCandidate = inferCardFromSingleCorner(
        c1,
        expectedCardWidth,
        expectedCardHeight,
        imageSize
      );

      if (singleCardCandidate) {
        usedCorners.add(i);
        cards.push({
          id: `corner-card-${cards.length}-${Date.now()}`,
          ...singleCardCandidate,
        });
      }
    }
  }

  return cards;
}

/**
 * Try to form a card from two diagonal corners
 */
function tryFormCard(
  c1: DetectedCorner,
  c2: DetectedCorner,
  expectedWidth: number,
  expectedHeight: number
): Omit<DetectedCard, "id"> | null {
  // Check if corners are diagonal (TL-BR or TR-BL)
  const isDiagonal =
    (c1.quadrant === "TL" && c2.quadrant === "BR") ||
    (c1.quadrant === "BR" && c2.quadrant === "TL") ||
    (c1.quadrant === "TR" && c2.quadrant === "BL") ||
    (c1.quadrant === "BL" && c2.quadrant === "TR");

  if (!isDiagonal) return null;

  // Calculate distance between corners
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Expected diagonal length
  const expectedDiag = Math.sqrt(expectedWidth ** 2 + expectedHeight ** 2);

  // Check if distance is close to expected (within 40% tolerance for partially visible cards)
  if (dist < expectedDiag * 0.4 || dist > expectedDiag * 1.4) return null;

  // Calculate center
  const centerX = (c1.x + c2.x) / 2;
  const centerY = (c1.y + c2.y) / 2;

  // Calculate angle from the diagonal
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Estimate actual dimensions from the diagonal
  const scale = dist / expectedDiag;
  const width = expectedWidth * scale;
  const height = expectedHeight * scale;

  // Confidence based on how close to expected size
  const sizeMatch = 1 - Math.abs(scale - 1);
  const confidence = (c1.strength + c2.strength) / 2 * sizeMatch;

  return {
    x: centerX,
    y: centerY,
    width,
    height,
    angle: angle - 45, // Adjust for diagonal angle
    confidence: Math.max(0.3, Math.min(1, confidence)),
  };
}

/**
 * Infer a card position from a single visible corner
 */
function inferCardFromSingleCorner(
  corner: DetectedCorner,
  expectedWidth: number,
  expectedHeight: number,
  imageSize: { width: number; height: number }
): Omit<DetectedCard, "id"> | null {
  // Calculate offset from corner to center based on quadrant
  const halfWidth = expectedWidth / 2;
  const halfHeight = expectedHeight / 2;

  let offsetX = 0;
  let offsetY = 0;

  switch (corner.quadrant) {
    case "TL":
      offsetX = halfWidth;
      offsetY = halfHeight;
      break;
    case "TR":
      offsetX = -halfWidth;
      offsetY = halfHeight;
      break;
    case "BL":
      offsetX = halfWidth;
      offsetY = -halfHeight;
      break;
    case "BR":
      offsetX = -halfWidth;
      offsetY = -halfHeight;
      break;
    default:
      return null;
  }

  const centerX = corner.x + offsetX;
  const centerY = corner.y + offsetY;

  // Check if inferred center is within image bounds (with some tolerance)
  const margin = Math.max(expectedWidth, expectedHeight) * 0.3;
  if (
    centerX < -margin ||
    centerX > imageSize.width + margin ||
    centerY < -margin ||
    centerY > imageSize.height + margin
  ) {
    return null;
  }

  return {
    x: centerX,
    y: centerY,
    width: expectedWidth,
    height: expectedHeight,
    angle: 0,
    confidence: corner.strength * 0.6, // Lower confidence for single-corner inference
  };
}

/**
 * Full detection pipeline using corner detection
 */
export function detectCardsViaCorners(
  cv: typeof window.cv,
  imageSource: HTMLImageElement | HTMLCanvasElement,
  expectedCardHeight: number
): DetectionResult {
  const startTime = performance.now();

  // Get image dimensions
  const src = cv.imread(imageSource);
  const imageSize = { width: src.cols, height: src.rows };
  src.delete();

  // Detect corners
  const { corners } = detectCorners(cv, imageSource, {
    expectedCardHeight,
    maxCorners: 300,
    qualityLevel: 0.01,
    minDistance: expectedCardHeight * 0.1,
  });

  // Infer cards from corners
  const cards = inferCardsFromCorners(corners, expectedCardHeight, imageSize);

  return {
    cards,
    processingTimeMs: performance.now() - startTime,
    imageSize,
  };
}
