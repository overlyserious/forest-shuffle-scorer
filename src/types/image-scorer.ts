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