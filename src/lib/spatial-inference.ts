import { CardPosition } from '@/types/cards';
import {
  LabeledMarker,
  Assignment,
  AssignmentError,
  SlotConflict,
  InferenceResult,
} from '@/types/image-scorer';

/**
 * Calculate Euclidean distance between two points
 */
export function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate angle from tree center to dweller center (in radians)
 * Returns value in range [-π, π]
 */
export function calculateAngle(
  tree: { x: number; y: number },
  dweller: { x: number; y: number }
): number {
  return Math.atan2(dweller.y - tree.y, dweller.x - tree.x);
}

/**
 * Map angle (in radians) to card slot position
 * 
 * Coordinate system (image pixels):
 * - Positive x = right
 * - Positive y = down
 * 
 * Angle ranges (measured counter-clockwise from positive x-axis):
 * - RIGHT:  -45° to 45°   (-π/4 to π/4)
 * - BOTTOM:  45° to 135°  (π/4 to 3π/4)
 * - LEFT:   135° to 225°  (3π/4 to -3π/4, wrapping through ±π)
 * - TOP:    225° to 315°  (-3π/4 to -π/4)
 */
export function angleToSlot(radians: number): CardPosition {
  // Normalize angle to [0, 2π] for easier quadrant logic
  const normalized = radians < 0 ? radians + 2 * Math.PI : radians;
  
  // Convert to degrees for readability
  const degrees = (normalized * 180) / Math.PI;
  
  if (degrees >= 315 || degrees < 45) {
    return CardPosition.RIGHT;
  } else if (degrees >= 45 && degrees < 135) {
    return CardPosition.BOTTOM;
  } else if (degrees >= 135 && degrees < 225) {
    return CardPosition.LEFT;
  } else {
    return CardPosition.TOP;
  }
}

/**
 * Find the nearest tree to a given dweller
 * Returns null if no trees are available
 */
export function findNearestTree(
  dweller: LabeledMarker,
  trees: LabeledMarker[]
): { tree: LabeledMarker; distance: number } | null {
  if (trees.length === 0) return null;
  
  let nearest = trees[0];
  let minDistance = calculateDistance(dweller, nearest);
  
  for (let i = 1; i < trees.length; i++) {
    const distance = calculateDistance(dweller, trees[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = trees[i];
    }
  }
  
  return { tree: nearest, distance: minDistance };
}

/**
 * Detect conflicts where multiple dwellers are assigned to the same tree slot
 */
export function findSlotConflicts(assignments: Assignment[]): SlotConflict[] {
  // Group assignments by tree + slot
  const slotMap = new Map<string, Array<{ marker: LabeledMarker; distance: number }>>();
  
  for (const assignment of assignments) {
    const key = `${assignment.tree.id}-${assignment.slot}`;
    const entry = { marker: assignment.dweller, distance: assignment.distance };
    
    if (slotMap.has(key)) {
      slotMap.get(key)!.push(entry);
    } else {
      slotMap.set(key, [entry]);
    }
  }
  
  // Find slots with multiple dwellers
  const conflicts: SlotConflict[] = [];
  
  for (const [key, dwellers] of slotMap.entries()) {
    if (dwellers.length > 1) {
      const [treeId, slot] = key.split('-');
      const tree = assignments.find(a => a.tree.id === treeId)!.tree;
      
      conflicts.push({
        tree,
        slot: slot as CardPosition,
        dwellers: dwellers.sort((a, b) => a.distance - b.distance), // Sort by distance
      });
    }
  }
  
  return conflicts;
}

/**
 * Run spatial inference algorithm to reconstruct forest from labeled markers
 * 
 * @param markers - All labeled card markers
 * @param calibrationDistance - Reference card size in pixels (from two-point calibration)
 * @param distanceThresholdMultiplier - Multiplier for max distance (e.g., 0.5 = 50% of card size)
 * @returns Inference results with assignments, conflicts, and errors
 */
export function inferForest(
  markers: LabeledMarker[],
  calibrationDistance: number,
  distanceThresholdMultiplier: number
): InferenceResult {
  // Separate cards by type
  const trees = markers.filter(m => m.cardId.startsWith('tree-'));
  const dwellers = markers.filter(m => m.cardId.startsWith('dweller-'));
  
  const thresholdDistance = calibrationDistance * distanceThresholdMultiplier;
  
  const assignments: Assignment[] = [];
  const errors: AssignmentError[] = [];
  
  // Process each dweller
  for (const dweller of dwellers) {
    const nearestTreeResult = findNearestTree(dweller, trees);
    
    if (!nearestTreeResult) {
      errors.push({
        dweller,
        errorType: 'NO_TREES_AVAILABLE',
        details: 'No trees found in the image',
      });
      continue;
    }
    
    const { tree, distance } = nearestTreeResult;
    
    if (distance > thresholdDistance) {
      errors.push({
        dweller,
        errorType: 'TOO_FAR_FROM_TREE',
        details: `Distance ${distance.toFixed(1)}px exceeds threshold ${thresholdDistance.toFixed(1)}px`,
      });
      continue;
    }
    
    const angle = calculateAngle(tree, dweller);
    const slot = angleToSlot(angle);
    
    assignments.push({
      dweller,
      tree,
      slot,
      distance,
    });
  }
  
  const conflicts = findSlotConflicts(assignments);
  
  return {
    assignments,
    conflicts,
    errors,
    cardSizeEstimate: calibrationDistance,
    thresholdUsed: thresholdDistance,
  };
}