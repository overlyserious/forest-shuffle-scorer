// Tutorial flow configuration for the Forest Shuffle API Simulator

export interface TutorialStepConfig {
  id: string;
  title: string;
  explanation: string;
  learningPoints: string[];
  apiConcepts: string[];
  fields: FieldConfig[];
  action: 'create-game' | 'add-player' | 'start-game' | 'get-state' | 'draw-cards' | 'play-tree' | 'end-turn';
  successMessage: string;
  nextStepHint: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'readonly';
  defaultValue: string | number;
  helpText: string;
  detailedExplanation: string;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
}

export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    id: 'create-game',
    title: 'Create Your Game',
    explanation: 'First, we need to create a game on the server. This will register your game and give you a unique game ID that you\'ll use for all future API requests.',
    learningPoints: [
      'How to make a POST request',
      'What a request body is',
      'Why we include a client_id for idempotency',
      'How to read a JSON response'
    ],
    apiConcepts: ['POST /games', 'Request Body', 'Idempotency', 'JSON Response'],
    fields: [
      {
        name: 'name',
        label: 'Game Name',
        type: 'text',
        defaultValue: 'Tutorial Game',
        helpText: 'A friendly name for your game',
        detailedExplanation: 'This is just a label to help you identify your game. It doesn\'t affect gameplay and isn\'t used by the API for any logic.'
      },
      {
        name: 'owner_id',
        label: 'Owner ID',
        type: 'text',
        defaultValue: 'alice',
        helpText: 'Your unique player identifier',
        detailedExplanation: 'This is YOUR player ID. You\'ll use this throughout the game to perform actions. It must be unique within the game and is case-sensitive.'
      },
      {
        name: 'max_players',
        label: 'Max Players',
        type: 'number',
        defaultValue: 2,
        helpText: 'Maximum number of players (2-8)',
        detailedExplanation: 'Forest Shuffle supports 2-8 players. For this tutorial, we\'ll use 2 players to keep things simple.',
        validation: (value) => {
          const num = Number(value);
          if (num < 2 || num > 8) return 'Must be between 2 and 8';
          return null;
        }
      },
      {
        name: 'client_id',
        label: 'Client ID',
        type: 'readonly',
        defaultValue: `create-game-${Date.now()}`,
        helpText: 'Auto-generated unique request identifier',
        detailedExplanation: 'The client_id ensures idempotency: if your request fails due to network issues and you retry, the API knows not to process it twice. We auto-generate this for you.'
      }
    ],
    action: 'create-game',
    successMessage: 'Game created successfully! You now have a game_id that you\'ll use for all future requests.',
    nextStepHint: 'Next, we\'ll add a second player to the game.'
  },
  {
    id: 'add-player-1',
    title: 'Add Second Player',
    explanation: 'The game owner (alice) is automatically added. Now we need to add at least one more player before we can start the game.',
    learningPoints: [
      'How to use path parameters (game_id)',
      'Adding resources to existing entities',
      'Why each player needs a unique ID'
    ],
    apiConcepts: ['POST /games/:gameId/players', 'Path Parameters', 'RESTful Resources'],
    fields: [
      {
        name: 'player_client_id',
        label: 'Player ID',
        type: 'text',
        defaultValue: 'bob',
        helpText: 'Unique identifier for this player',
        detailedExplanation: 'Each player in the game needs a unique ID. This is how the API knows which player is performing actions. Common convention: use simple names like "alice", "bob", "player1", etc.'
      },
      {
        name: 'display_name',
        label: 'Display Name',
        type: 'text',
        defaultValue: 'Bob',
        helpText: 'Human-readable name',
        detailedExplanation: 'This is a friendly name that might be shown in a UI. Unlike player_id, this doesn\'t need to be unique and can contain spaces and special characters.'
      },
      {
        name: 'client_id',
        label: 'Client ID',
        type: 'readonly',
        defaultValue: `add-player-${Date.now()}`,
        helpText: 'Auto-generated request identifier',
        detailedExplanation: 'Another idempotency key for this specific "add player" request.'
      }
    ],
    action: 'add-player',
    successMessage: 'Player added! The game now has 2 players and is ready to start.',
    nextStepHint: 'Now that we have enough players, let\'s start the game.'
  },
  {
    id: 'start-game',
    title: 'Start the Game',
    explanation: 'Starting the game will shuffle and deal cards, determine the starting player, and transition the game from setup to playing phase.',
    learningPoints: [
      'How game state changes via API calls',
      'Understanding responses that include game state',
      'How the API determines random elements (starting player)'
    ],
    apiConcepts: ['Game State Transitions', 'POST /games/:gameId/start', 'State Responses'],
    fields: [
      {
        name: 'client_id',
        label: 'Client ID',
        type: 'readonly',
        defaultValue: `start-game-${Date.now()}`,
        helpText: 'Auto-generated request identifier',
        detailedExplanation: 'Idempotency key for starting the game. If you accidentally call this twice, the second call will be ignored.'
      }
    ],
    action: 'start-game',
    successMessage: 'Game started! Cards have been dealt and a starting player has been chosen.',
    nextStepHint: 'Let\'s check the game state to see what happened.'
  },
  {
    id: 'get-state',
    title: 'Query Game State',
    explanation: 'Now let\'s use a GET request to retrieve the current game state. This shows you the deck, each player\'s hand, whose turn it is, and more.',
    learningPoints: [
      'How GET requests differ from POST',
      'Reading complex JSON responses',
      'Understanding game state structure'
    ],
    apiConcepts: ['GET /games/:gameId/state', 'Query Operations', 'Game State Object'],
    fields: [],
    action: 'get-state',
    successMessage: 'State retrieved! Notice how you can see each player\'s hand, the deck size, and whose turn it is.',
    nextStepHint: 'Time to make your first move: drawing cards.'
  },
  {
    id: 'draw-cards',
    title: 'Draw Two Cards',
    explanation: 'On each turn, a player must either draw 2 cards OR play a card. Let\'s start with drawing. You can draw from the deck or the clearing (discard pile).',
    learningPoints: [
      'How to specify the current player (actor)',
      'Sending arrays in request bodies',
      'How the game state updates after actions'
    ],
    apiConcepts: ['POST /games/:gameId/actions/draw', 'Actor Field', 'Game Actions'],
    fields: [
      {
        name: 'actor',
        label: 'Actor (Current Player)',
        type: 'readonly',
        defaultValue: 'alice',
        helpText: 'Which player is taking this action',
        detailedExplanation: 'This must match the current player whose turn it is. The API will reject actions from players when it\'s not their turn.'
      },
      {
        name: 'source_1',
        label: 'First Card Source',
        type: 'select',
        defaultValue: 'DECK',
        helpText: 'Draw from deck or clearing',
        detailedExplanation: 'DECK is the face-down pile. CLEARING is the face-up discard pile. For this tutorial, we\'ll draw from the deck.',
        options: [
          { value: 'DECK', label: 'Deck (face-down)' },
          { value: 'CLEARING', label: 'Clearing (discard pile)' }
        ]
      },
      {
        name: 'source_2',
        label: 'Second Card Source',
        type: 'select',
        defaultValue: 'DECK',
        helpText: 'Draw from deck or clearing',
        detailedExplanation: 'You can mix sources (e.g., one from deck, one from clearing).',
        options: [
          { value: 'DECK', label: 'Deck (face-down)' },
          { value: 'CLEARING', label: 'Clearing (discard pile)' }
        ]
      },
      {
        name: 'client_id',
        label: 'Client ID',
        type: 'readonly',
        defaultValue: `draw-cards-${Date.now()}`,
        helpText: 'Auto-generated request identifier',
        detailedExplanation: 'Idempotency key for this draw action.'
      }
    ],
    action: 'draw-cards',
    successMessage: 'Cards drawn! The current player now has 2 more cards in their hand.',
    nextStepHint: 'After drawing, you typically end your turn (unless you drew a winter card).'
  },
  {
    id: 'end-turn',
    title: 'End Your Turn',
    explanation: 'After completing your action, end your turn so the next player can go. This advances the game state to the next player.',
    learningPoints: [
      'Turn-based game flow via API',
      'How state changes persist across requests',
      'Simple actions with minimal payloads'
    ],
    apiConcepts: ['POST /games/:gameId/actions/end-turn', 'Turn Management', 'Game Flow'],
    fields: [
      {
        name: 'actor',
        label: 'Actor (Current Player)',
        type: 'readonly',
        defaultValue: 'alice',
        helpText: 'Who is ending their turn',
        detailedExplanation: 'Must be the current player. After this action, it becomes the next player\'s turn.'
      },
      {
        name: 'client_id',
        label: 'Client ID',
        type: 'readonly',
        defaultValue: `end-turn-${Date.now()}`,
        helpText: 'Auto-generated request identifier',
        detailedExplanation: 'Idempotency key for ending turn.'
      }
    ],
    action: 'end-turn',
    successMessage: 'Turn ended! The next player can now take their turn.',
    nextStepHint: 'You\'ve completed the basic tutorial! You can now explore the full interface.'
  }
];

// Helper function to get step by ID
export function getStepById(stepId: string): TutorialStepConfig | undefined {
  return TUTORIAL_STEPS.find(step => step.id === stepId);
}

// Helper function to get next step
export function getNextStep(currentStepId: string): TutorialStepConfig | null {
  const currentIndex = TUTORIAL_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1 || currentIndex === TUTORIAL_STEPS.length - 1) {
    return null;
  }
  return TUTORIAL_STEPS[currentIndex + 1];
}

// Helper function to get previous step
export function getPreviousStep(currentStepId: string): TutorialStepConfig | null {
  const currentIndex = TUTORIAL_STEPS.findIndex(step => step.id === currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return TUTORIAL_STEPS[currentIndex - 1];
}

// Get current step index (1-based for display)
export function getStepNumber(stepId: string): number {
  const index = TUTORIAL_STEPS.findIndex(step => step.id === stepId);
  return index === -1 ? 0 : index + 1;
}

// Get total number of steps
export function getTotalSteps(): number {
  return TUTORIAL_STEPS.length;
}