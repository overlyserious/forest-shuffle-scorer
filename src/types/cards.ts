/**
 * Card type definitions for Forest Shuffle MVP
 * 
 * MVP Scope:
 * - 3 tree species: Oak, Birch, Sycamore
 * - 6 simple dwellers with basic scoring rules
 * - No effects, no bonuses (coming in future iterations)
 * - Focus on core game loop: draw, play, score
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum TreeSpecies {
  OAK = 'OAK',
  BIRCH = 'BIRCH',
  SYCAMORE = 'SYCAMORE',
}

export enum CardType {
  TREE = 'TREE',
  DWELLER = 'DWELLER', // Animals, plants, mushrooms
}

export enum DwellerType {
  BIRD = 'BIRD',
  INSECT = 'INSECT',
  PLANT = 'PLANT',
  DEER = 'DEER',
}

export enum CardPosition {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

// ============================================================================
// SCORING RULES
// ============================================================================

/**
 * Scoring rule types for MVP
 * We'll implement progressively:
 * 1. FIXED: Simple point value
 * 2. PER_TREE: 1 point per tree in forest
 * 3. PER_SYMBOL: Points per matching symbol type
 */
export enum ScoringType {
  FIXED = 'FIXED',              // e.g., "5 points"
  PER_TREE = 'PER_TREE',        // e.g., "1 point per tree"
  PER_SYMBOL = 'PER_SYMBOL',    // e.g., "2 points per bird"
}

export interface ScoringRule {
  type: ScoringType;
  value: number;                // Base value (for FIXED) or multiplier (for PER_X)
  symbolType?: DwellerType;     // Used for PER_SYMBOL scoring
}

// ============================================================================
// CARD DEFINITIONS
// ============================================================================

export interface BaseCard {
  id: string;
  name: string;
  cardType: CardType;
  treeSpecies: TreeSpecies;     // Determines card color for bonuses (future)
  cost: number;                 // How many cards to discard to play this
}

export interface TreeCard extends BaseCard {
  cardType: CardType.TREE;
  scoring: ScoringRule;
}

export interface DwellerCard extends BaseCard {
  cardType: CardType.DWELLER;
  dwellerType: DwellerType;
  position: CardPosition;       // Where this dweller can be placed
  scoring: ScoringRule;
}

export type Card = TreeCard | DwellerCard;

// ============================================================================
// MVP CARD DATABASE
// ============================================================================

/**
 * Simplified card set for MVP testing.
 * 
 * Card counts:
 * - 20 trees (6-7 of each species)
 * - 20 dwellers (5 of each type)
 * 
 * Total: 40 cards (enough for extended gameplay testing)
 */
export const MVP_CARDS: Card[] = [
  // ========== TREES (20 total) ==========
  // Oak (7 copies)
  { id: 'tree-oak-1', name: 'Oak', cardType: CardType.TREE, treeSpecies: TreeSpecies.OAK, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'tree-oak-2', name: 'Oak', cardType: CardType.TREE, treeSpecies: TreeSpecies.OAK, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'tree-oak-3', name: 'Oak', cardType: CardType.TREE, treeSpecies: TreeSpecies.OAK, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'tree-oak-4', name: 'Oak', cardType: CardType.TREE, treeSpecies: TreeSpecies.OAK, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'tree-oak-5', name: 'Oak', cardType: CardType.TREE, treeSpecies: TreeSpecies.OAK, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'tree-oak-6', name: 'Oak', cardType: CardType.TREE, treeSpecies: TreeSpecies.OAK, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'tree-oak-7', name: 'Oak', cardType: CardType.TREE, treeSpecies: TreeSpecies.OAK, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  
  // Birch (7 copies)
  { id: 'tree-birch-1', name: 'Birch', cardType: CardType.TREE, treeSpecies: TreeSpecies.BIRCH, cost: 0, scoring: { type: ScoringType.FIXED, value: 1 } },
  { id: 'tree-birch-2', name: 'Birch', cardType: CardType.TREE, treeSpecies: TreeSpecies.BIRCH, cost: 0, scoring: { type: ScoringType.FIXED, value: 1 } },
  { id: 'tree-birch-3', name: 'Birch', cardType: CardType.TREE, treeSpecies: TreeSpecies.BIRCH, cost: 0, scoring: { type: ScoringType.FIXED, value: 1 } },
  { id: 'tree-birch-4', name: 'Birch', cardType: CardType.TREE, treeSpecies: TreeSpecies.BIRCH, cost: 0, scoring: { type: ScoringType.FIXED, value: 1 } },
  { id: 'tree-birch-5', name: 'Birch', cardType: CardType.TREE, treeSpecies: TreeSpecies.BIRCH, cost: 0, scoring: { type: ScoringType.FIXED, value: 1 } },
  { id: 'tree-birch-6', name: 'Birch', cardType: CardType.TREE, treeSpecies: TreeSpecies.BIRCH, cost: 0, scoring: { type: ScoringType.FIXED, value: 1 } },
  { id: 'tree-birch-7', name: 'Birch', cardType: CardType.TREE, treeSpecies: TreeSpecies.BIRCH, cost: 0, scoring: { type: ScoringType.FIXED, value: 1 } },
  
  // Sycamore (6 copies)
  { id: 'tree-sycamore-1', name: 'Sycamore', cardType: CardType.TREE, treeSpecies: TreeSpecies.SYCAMORE, cost: 2, scoring: { type: ScoringType.FIXED, value: 5 } },
  { id: 'tree-sycamore-2', name: 'Sycamore', cardType: CardType.TREE, treeSpecies: TreeSpecies.SYCAMORE, cost: 2, scoring: { type: ScoringType.FIXED, value: 5 } },
  { id: 'tree-sycamore-3', name: 'Sycamore', cardType: CardType.TREE, treeSpecies: TreeSpecies.SYCAMORE, cost: 2, scoring: { type: ScoringType.FIXED, value: 5 } },
  { id: 'tree-sycamore-4', name: 'Sycamore', cardType: CardType.TREE, treeSpecies: TreeSpecies.SYCAMORE, cost: 2, scoring: { type: ScoringType.FIXED, value: 5 } },
  { id: 'tree-sycamore-5', name: 'Sycamore', cardType: CardType.TREE, treeSpecies: TreeSpecies.SYCAMORE, cost: 2, scoring: { type: ScoringType.FIXED, value: 5 } },
  { id: 'tree-sycamore-6', name: 'Sycamore', cardType: CardType.TREE, treeSpecies: TreeSpecies.SYCAMORE, cost: 2, scoring: { type: ScoringType.FIXED, value: 5 } },

  // ========== DWELLERS (20 total) ==========
  // Birds - TOP (5 Tawny Owl + 5 Woodpecker = 10)
  { id: 'dweller-bird-1', name: 'Tawny Owl', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.BIRD, position: CardPosition.TOP, cost: 1, scoring: { type: ScoringType.FIXED, value: 5 } },
  { id: 'dweller-bird-2', name: 'Tawny Owl', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.BIRD, position: CardPosition.TOP, cost: 1, scoring: { type: ScoringType.FIXED, value: 5 } },
  { id: 'dweller-bird-3', name: 'Tawny Owl', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.BIRD, position: CardPosition.TOP, cost: 1, scoring: { type: ScoringType.FIXED, value: 5 } },
  { id: 'dweller-bird-4', name: 'Tawny Owl', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.BIRD, position: CardPosition.TOP, cost: 1, scoring: { type: ScoringType.FIXED, value: 5 } },
  { id: 'dweller-bird-5', name: 'Tawny Owl', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.BIRD, position: CardPosition.TOP, cost: 1, scoring: { type: ScoringType.FIXED, value: 5 } },
  { id: 'dweller-bird-6', name: 'Woodpecker', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.BIRD, position: CardPosition.TOP, cost: 2, scoring: { type: ScoringType.PER_TREE, value: 1 } },
  { id: 'dweller-bird-7', name: 'Woodpecker', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.BIRD, position: CardPosition.TOP, cost: 2, scoring: { type: ScoringType.PER_TREE, value: 1 } },
  { id: 'dweller-bird-8', name: 'Woodpecker', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.BIRD, position: CardPosition.TOP, cost: 2, scoring: { type: ScoringType.PER_TREE, value: 1 } },
  { id: 'dweller-bird-9', name: 'Woodpecker', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.BIRD, position: CardPosition.TOP, cost: 2, scoring: { type: ScoringType.PER_TREE, value: 1 } },
  { id: 'dweller-bird-10', name: 'Woodpecker', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.BIRD, position: CardPosition.TOP, cost: 2, scoring: { type: ScoringType.PER_TREE, value: 1 } },

  // Insects - BOTTOM (5 Stag Beetle + 5 Wood Ant = 10)
  { id: 'dweller-insect-1', name: 'Stag Beetle', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.INSECT, position: CardPosition.BOTTOM, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'dweller-insect-2', name: 'Stag Beetle', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.INSECT, position: CardPosition.BOTTOM, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'dweller-insect-3', name: 'Stag Beetle', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.INSECT, position: CardPosition.BOTTOM, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'dweller-insect-4', name: 'Stag Beetle', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.INSECT, position: CardPosition.BOTTOM, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'dweller-insect-5', name: 'Stag Beetle', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.INSECT, position: CardPosition.BOTTOM, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'dweller-insect-6', name: 'Wood Ant', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.SYCAMORE, dwellerType: DwellerType.INSECT, position: CardPosition.BOTTOM, cost: 1, scoring: { type: ScoringType.PER_SYMBOL, value: 2, symbolType: DwellerType.INSECT } },
  { id: 'dweller-insect-7', name: 'Wood Ant', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.SYCAMORE, dwellerType: DwellerType.INSECT, position: CardPosition.BOTTOM, cost: 1, scoring: { type: ScoringType.PER_SYMBOL, value: 2, symbolType: DwellerType.INSECT } },
  { id: 'dweller-insect-8', name: 'Wood Ant', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.SYCAMORE, dwellerType: DwellerType.INSECT, position: CardPosition.BOTTOM, cost: 1, scoring: { type: ScoringType.PER_SYMBOL, value: 2, symbolType: DwellerType.INSECT } },
  { id: 'dweller-insect-9', name: 'Wood Ant', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.SYCAMORE, dwellerType: DwellerType.INSECT, position: CardPosition.BOTTOM, cost: 1, scoring: { type: ScoringType.PER_SYMBOL, value: 2, symbolType: DwellerType.INSECT } },
  { id: 'dweller-insect-10', name: 'Wood Ant', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.SYCAMORE, dwellerType: DwellerType.INSECT, position: CardPosition.BOTTOM, cost: 1, scoring: { type: ScoringType.PER_SYMBOL, value: 2, symbolType: DwellerType.INSECT } },

  // Plants - LEFT (5 Moss + 5 Fern = 10)
  { id: 'dweller-plant-1', name: 'Moss', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.PLANT, position: CardPosition.LEFT, cost: 0, scoring: { type: ScoringType.FIXED, value: 2 } },
  { id: 'dweller-plant-2', name: 'Moss', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.PLANT, position: CardPosition.LEFT, cost: 0, scoring: { type: ScoringType.FIXED, value: 2 } },
  { id: 'dweller-plant-3', name: 'Moss', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.PLANT, position: CardPosition.LEFT, cost: 0, scoring: { type: ScoringType.FIXED, value: 2 } },
  { id: 'dweller-plant-4', name: 'Moss', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.PLANT, position: CardPosition.LEFT, cost: 0, scoring: { type: ScoringType.FIXED, value: 2 } },
  { id: 'dweller-plant-5', name: 'Moss', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.PLANT, position: CardPosition.LEFT, cost: 0, scoring: { type: ScoringType.FIXED, value: 2 } },
  { id: 'dweller-plant-6', name: 'Fern', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.SYCAMORE, dwellerType: DwellerType.PLANT, position: CardPosition.LEFT, cost: 1, scoring: { type: ScoringType.FIXED, value: 4 } },
  { id: 'dweller-plant-7', name: 'Fern', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.SYCAMORE, dwellerType: DwellerType.PLANT, position: CardPosition.LEFT, cost: 1, scoring: { type: ScoringType.FIXED, value: 4 } },
  { id: 'dweller-plant-8', name: 'Fern', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.SYCAMORE, dwellerType: DwellerType.PLANT, position: CardPosition.LEFT, cost: 1, scoring: { type: ScoringType.FIXED, value: 4 } },
  { id: 'dweller-plant-9', name: 'Fern', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.SYCAMORE, dwellerType: DwellerType.PLANT, position: CardPosition.LEFT, cost: 1, scoring: { type: ScoringType.FIXED, value: 4 } },
  { id: 'dweller-plant-10', name: 'Fern', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.SYCAMORE, dwellerType: DwellerType.PLANT, position: CardPosition.LEFT, cost: 1, scoring: { type: ScoringType.FIXED, value: 4 } },

  // Deer - RIGHT (5 Roe Deer + 5 Red Deer = 10)
  { id: 'dweller-deer-1', name: 'Roe Deer', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.DEER, position: CardPosition.RIGHT, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'dweller-deer-2', name: 'Roe Deer', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.DEER, position: CardPosition.RIGHT, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'dweller-deer-3', name: 'Roe Deer', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.DEER, position: CardPosition.RIGHT, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'dweller-deer-4', name: 'Roe Deer', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.DEER, position: CardPosition.RIGHT, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'dweller-deer-5', name: 'Roe Deer', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.BIRCH, dwellerType: DwellerType.DEER, position: CardPosition.RIGHT, cost: 1, scoring: { type: ScoringType.FIXED, value: 3 } },
  { id: 'dweller-deer-6', name: 'Red Deer', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.DEER, position: CardPosition.RIGHT, cost: 2, scoring: { type: ScoringType.PER_SYMBOL, value: 1, symbolType: DwellerType.DEER } },
  { id: 'dweller-deer-7', name: 'Red Deer', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.DEER, position: CardPosition.RIGHT, cost: 2, scoring: { type: ScoringType.PER_SYMBOL, value: 1, symbolType: DwellerType.DEER } },
  { id: 'dweller-deer-8', name: 'Red Deer', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.DEER, position: CardPosition.RIGHT, cost: 2, scoring: { type: ScoringType.PER_SYMBOL, value: 1, symbolType: DwellerType.DEER } },
  { id: 'dweller-deer-9', name: 'Red Deer', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.DEER, position: CardPosition.RIGHT, cost: 2, scoring: { type: ScoringType.PER_SYMBOL, value: 1, symbolType: DwellerType.DEER } },
  { id: 'dweller-deer-10', name: 'Red Deer', cardType: CardType.DWELLER, treeSpecies: TreeSpecies.OAK, dwellerType: DwellerType.DEER, position: CardPosition.RIGHT, cost: 2, scoring: { type: ScoringType.PER_SYMBOL, value: 1, symbolType: DwellerType.DEER } },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getCardById(cardId: string): Card | undefined {
  return MVP_CARDS.find(c => c.id === cardId);
}

export function isTreeCard(card: Card): card is TreeCard {
  return card.cardType === CardType.TREE;
}

export function isDwellerCard(card: Card): card is DwellerCard {
  return card.cardType === CardType.DWELLER;
}

/**
 * For future: Load full card database from JSON
 * This allows non-developers to add new cards without touching code
 */
export function loadCardsFromJSON(json: string): Card[] {
  // TODO: Implement when expanding beyond MVP
  throw new Error('Not implemented yet');
}