import { CardPosition } from './cards';

/**
 * A marker represents a click point on the image at a card center
 */
export type Marker = {
  id: string;
  x: number;
  y: number;
};

/**
 * A detected card includes bounding box info from CV detection
 */
export type DetectedCard = Marker & {
  width: number;
  height: number;
  angle: number; // rotation angle in degrees
  confidence: number; // 0-1 score based on how "card-like" the detection is
};

/**
 * Options for card detection algorithm
 */
export type DetectionOptions = {
  minAreaRatio: number; // min card area as ratio of image area (default 0.005)
  maxAreaRatio: number; // max card area as ratio of image area (default 0.15)
  minAspectRatio: number; // min width/height ratio (default 0.5)
  maxAspectRatio: number; // max width/height ratio (default 0.9)
  cannyThreshold1: number; // Canny edge detection threshold 1 (default 50)
  cannyThreshold2: number; // Canny edge detection threshold 2 (default 150)
};

/**
 * Result from card detection
 */
export type DetectionResult = {
  cards: DetectedCard[];
  processingTimeMs: number;
  imageSize: { width: number; height: number };
};

/**
 * A detected corner point
 */
export type DetectedCorner = {
  x: number;
  y: number;
  angle: number;
  quadrant: "TL" | "TR" | "BL" | "BR" | "unknown";
  strength: number;
};

/**
 * Detection method
 */
export type DetectionMethod = "contour" | "corner" | "vision";

/**
 * Vision LLM detected card with additional metadata
 */
export type VisionDetectedCard = {
  id: string;
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  cardType: "tree" | "dweller" | "unknown";
  cardName: string | null;
  position: "TOP" | "BOTTOM" | "LEFT" | "RIGHT" | null;
  attachedTo: string | null;
  confidence: number;
};

/**
 * Vision detection result
 */
export type VisionDetectionResult = {
  cards: VisionDetectedCard[];
  relationships: Array<{
    treeId: string;
    dwellerId: string;
    slot: "TOP" | "BOTTOM" | "LEFT" | "RIGHT";
  }>;
  rawAnalysis: string;
};

/**
 * A labeled marker includes the card ID that was assigned to this position
 */
export type LabeledMarker = Marker & {
  cardId: string;
};

/**
 * Represents a dweller card assigned to a tree's slot
 */
export type Assignment = {
  dweller: LabeledMarker;
  tree: LabeledMarker;
  slot: CardPosition;
  distance: number; // Actual distance from tree to dweller
};

/**
 * Represents an error in dweller assignment
 */
export type AssignmentError = {
  dweller: LabeledMarker;
  errorType: 'TOO_FAR_FROM_TREE' | 'NO_TREES_AVAILABLE';
  details: string;
};

/**
 * Represents multiple dwellers competing for the same tree slot
 */
export type SlotConflict = {
  tree: LabeledMarker;
  slot: CardPosition;
  dwellers: Array<{
    marker: LabeledMarker;
    distance: number;
  }>;
};

/**
 * Result of running spatial inference algorithm
 */
export type InferenceResult = {
  assignments: Assignment[];
  conflicts: SlotConflict[];
  errors: AssignmentError[];
  cardSizeEstimate: number;
  thresholdUsed: number;
};

/**
 * Calibration state from two-point click
 */
export type CalibrationData = {
  point1: { x: number; y: number };
  point2: { x: number; y: number };
  distance: number;
};