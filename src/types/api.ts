// Forest Shuffle API Types

export interface Game {
  id: string;
  name: string;
  owner_id: string;
  max_players: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  player_id: string;
  display_name: string;
  joined_at: string;
}

export interface Event {
  id: string;
  game_id: string;
  sequence: string;
  event_type: string;
  actor: string;
  client_id: string;
  payload: Record<string, unknown>;
  result: {
    accepted: boolean;
  };
  created_at: string;
}

export interface PlayerState {
  hand: string[];
  trees: TreeSlot[];
  score: number;
}

export interface TreeSlot {
  card_id: string;
  dwellers: {
    TOP: string | null;
    BOTTOM: string | null;
    LEFT: string | null;
    RIGHT: string | null;
  };
}

export interface GameState {
  phase: string;
  current_player_id: string;
  turn_order: string[];
  deck: string[];
  clearing: string[];
  winter_cards_revealed: number;
  players: Record<string, PlayerState>;
}

export interface StateResponse {
  state: {
    game_id: string;
    status: string;
    state: GameState;
    last_sequence: string;
    last_projected_sequence: string;
    updated_at: string;
  };
  projection_lagging: boolean;
}

export interface CreateGameRequest {
  name: string;
  owner_id: string;
  max_players?: number;
}

export interface AddPlayerRequest {
  player_client_id: string;
  client_id: string;
  display_name?: string;
}

export interface StartGameRequest {
  client_id: string;
}

export interface DrawCardRequest {
  actor: string;
  client_id: string;
  sources: ("DECK" | "CLEARING")[];
}

export interface PlayTreeRequest {
  actor: string;
  client_id: string;
  card_id: string;
  payment_card_ids: string[];
}

export interface PlayDwellerRequest {
  actor: string;
  client_id: string;
  card_id: string;
  tree_index: number;
  position: "TOP" | "BOTTOM" | "LEFT" | "RIGHT";
  payment_card_ids: string[];
}

export interface EndTurnRequest {
  actor: string;
  client_id: string;
}

export interface CodeExecution {
  timestamp: Date;
  action: string;
  code: string;
  request?: unknown;
  response?: unknown;
  error?: string;
}
